import { afterAll, beforeAll, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { allowDevLocalRequest, callDevLocalApi, devLocalDestination } from "./api-dev-local";

let server: Server, port: number;
beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === "/redirect") { response.writeHead(302, { location: "http://example.com/" }); response.end(); return; }
    const chunks: Buffer[] = [];
    request.on("data", chunk => chunks.push(chunk));
    request.on("end", () => { response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ method: request.method, body: Buffer.concat(chunks).toString() })); });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as { port: number }).port;
});
afterAll(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); });

it("enables local transport only for same-origin local development", () => {
  const request = new Request("http://localhost:3001/api/local-request", { headers: { origin: "http://localhost:3001" } });
  expect(allowDevLocalRequest(request, "development")).toBe(true);
  expect(allowDevLocalRequest(request, "production")).toBe(false);
  expect(allowDevLocalRequest(new Request(request.url, { headers: { origin: "https://other.example" } }), "development")).toBe(false);
  expect(allowDevLocalRequest(new Request("https://pdf.msyn.in/api/local-request", { headers: { origin: "https://pdf.msyn.in" } }), "development")).toBe(false);
});
it("allows local addresses and rejects public hosts and DNS lookalikes", () => {
  expect(devLocalDestination("http://localhost:3000/").hostname).toBe("127.0.0.1");
  expect(devLocalDestination("http://192.168.0.210:3000/").hostname).toBe("192.168.0.210");
  for (const url of ["https://example.com", "http://localhost.example.com", "http://8.8.8.8", "file:///etc/hosts"]) expect(() => devLocalDestination(url)).toThrow();
});
it("reads responses without CORS headers and preserves methods and bodies", async () => {
  const result = await callDevLocalApi({ url: `http://localhost:${port}/`, method: "POST", headers: { "content-type": "text/plain" }, body: "नमस्ते" }, AbortSignal.timeout(5000));
  expect(result.status).toBe(200);
  expect(JSON.parse(result.data)).toEqual({ method: "POST", body: "नमस्ते" });
  expect(result.headers).not.toHaveProperty("access-control-allow-origin");
});
it("returns redirects without following them outside the local destination", async () => {
  const result = await callDevLocalApi({ url: `http://localhost:${port}/redirect`, method: "GET", headers: {}, body: null }, AbortSignal.timeout(5000));
  expect(result.status).toBe(302);
  expect(result.headers.location).toBe("http://example.com/");
});
