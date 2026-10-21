import { afterAll, beforeAll, expect, it } from "vitest";
import { createServer as httpServer, type Server, type RequestListener } from "node:http";
import { createServer as httpsServer } from "node:https";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import forge from "node-forge";
import { apiDestinationKind, directApiOptions, directApiFailure, parseLocalResponse } from "./api-local";
import { createLocalApiRunner } from "./api-local-runner";

const run = promisify(execFile);
const localBody = "नमस्ते $& $' $`";
let directory: string, plain: Server, secure: Server, httpPort: number, httpsPort: number;
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "msyn-local-api-test-"));
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate(); cert.publicKey = keys.publicKey; cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 60000); cert.validity.notAfter = new Date(Date.now() + 86400000);
  cert.setSubject([{name:"commonName",value:"localhost"}]); cert.setIssuer(cert.subject.attributes);
  cert.setExtensions([{name:"basicConstraints",cA:true},{name:"keyUsage",keyCertSign:true,digitalSignature:true,keyEncipherment:true},{name:"subjectAltName",altNames:[{type:2,value:"localhost"}]}]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const pem = forge.pki.certificateToPem(cert);
  await writeFile(path.join(directory,"ca.pem"),pem);
  const handler: RequestListener = (req, res) => {
    const chunks: Buffer[] = []; req.on("data",(chunk: Buffer)=>chunks.push(chunk)); req.on("end",()=>{
      res.writeHead(200,{"content-type":"application/json"});
      res.end(JSON.stringify({method:req.method,body:Buffer.concat(chunks).toString("utf8"),length:req.headers["content-length"]}));
    });
  };
  plain=httpServer(handler); secure=httpsServer({key:forge.pki.privateKeyToPem(keys.privateKey),cert:pem},handler);
  await Promise.all([new Promise<void>(resolve=>plain.listen(0,"127.0.0.1",resolve)),new Promise<void>(resolve=>secure.listen(0,"127.0.0.1",resolve))]);
  httpPort=(plain.address() as {port:number}).port; httpsPort=(secure.address() as {port:number}).port;
},30000);
afterAll(async()=>{
  await Promise.all([plain && new Promise<void>(resolve=>plain.close(()=>resolve())),secure && new Promise<void>(resolve=>secure.close(()=>resolve()))]);
  // Only remove this suite's own temporary directory.
  if(directory && path.dirname(directory)===path.resolve(tmpdir()) && path.basename(directory).startsWith("msyn-local-api-test-")) await rm(directory,{recursive:true,force:true});
});

it.each(["http://localhost:8080/","https://127.0.0.1:8080/","http://[::1]:8080/","http://2130706433:8080/"])("detects loopback %s",url=>expect(apiDestinationKind(url)).toBe("loopback"));
it("does not mistake a lookalike public hostname for localhost",()=>{
  expect(apiDestinationKind("https://localhost.example.com")).toBe("public");
  expect(apiDestinationKind("https://127.example.com")).toBe("public");
  expect(apiDestinationKind("https://10.example.com")).toBe("public");
  expect(()=>createLocalApiRunner({url:"https://localhost.example.com",method:"GET",headers:{},body:null})).toThrow("loopback");
});
it("uses standard CORS options without forcing a mismatched address space",()=>{
  const result=directApiOptions("http://localhost:8080/","GET",{},null,new AbortController().signal);
  expect(result.mode).toBe("cors");expect(result).not.toHaveProperty("targetAddressSpace");
  expect(result.credentials).toBe("omit");
  expect(result).not.toHaveProperty("rejectUnauthorized");
  expect(directApiOptions("https://example.com/","GET",{},null,new AbortController().signal)).not.toHaveProperty("targetAddressSpace");
  expect(directApiFailure(new TypeError("Failed to fetch"),"https://localhost:8080")).toContain("local API");
});

async function execute(name:string,url:string,ca=false) {
  const script=path.join(directory,name+".mjs"), output=path.join(directory,name+".json");
  await writeFile(script,createLocalApiRunner({url,method:"DELETE",headers:{"content-type":"text/plain","X-QA":"a'\"`"},body:localBody}));
  let failed=false;
  try { await run(process.execPath,[script,...(ca?["--ca",path.join(directory,"ca.pem")]:[]),"--out",output],{timeout:10000}); } catch {failed=true;}
  return {failed,script,output,result:parseLocalResponse(await readFile(output,"utf8"))};
}
it("runs a localhost request without requiring server CORS and imports its response",async()=>{
  const response=await execute("http",`http://localhost:${httpPort}/`);
  expect(response.failed,response.result.data).toBe(false);expect(response.result.status).toBe(200);
  const body=JSON.parse(response.result.data);expect(body.method).toBe("DELETE");expect(body.body).toBe(localBody);expect(body.length).toBe(String(Buffer.byteLength(localBody)));
  const before=await readFile(response.output,"utf8");
  await expect(run(process.execPath,[response.script,"--out",response.output])).rejects.toThrow();
  expect(await readFile(response.output,"utf8")).toBe(before);
});
it("rejects an untrusted self-signed TLS certificate",async()=>{
  const response=await execute("untrusted",`https://localhost:${httpsPort}/`);
  expect(response.failed).toBe(true);expect(response.result.status).toBe(0);expect(response.result.data).toContain("Certificate verification failed");
});
it("accepts the supplied test CA while keeping hostname verification",async()=>{
  const response=await execute("trusted",`https://localhost:${httpsPort}/`,true);
  expect(response.failed,response.result.data).toBe(false);expect(response.result.status).toBe(200);
  const mismatch=await execute("mismatch",`https://127.0.0.1:${httpsPort}/`,true);
  expect(mismatch.failed).toBe(true);expect(mismatch.result.data).toContain("Certificate verification failed");
});
it("rejects unrelated or malformed response files",()=>expect(()=>parseLocalResponse('{"data":"wrong"}')).toThrow("runner"));
