import { ContentInfo, SignedData, CryptoEngine, setEngine } from "pkijs";
import { fromBER } from "asn1js";
import {pdfFingerprint} from "./pdf-verification-evidence";

export type SignatureMetadata = { id:string; signerName?:string; subFilter?:string; byteRange?:number[]; coversWholeDocument?:boolean };
export type SignatureResult = {
  name:string; integrity:"intact"|"invalid"|"not-verified"; coverage:boolean;
  trust:"not-verified"; certificate:"current"|"outside-validity"|"not-verified"; detail:string;
};
export function signedRanges(bytes:Uint8Array, range:unknown) {
  if(!Array.isArray(range)||range.length!==4||range.some(n=>!Number.isSafeInteger(n)||n<0))throw new Error("Invalid signature byte ranges.");
  const [a,b,c,d]=range as number[];
  if(a!==0||b<=0||c<=b||c+d>bytes.length||d<=0)throw new Error("Invalid signature byte ranges.");
  const gap=new TextDecoder("ascii").decode(bytes.subarray(b,c));
  if(!/^<[0-9a-fA-F\s]+>$/.test(gap))throw new Error("Unsupported signature contents encoding.");
  const data=new Uint8Array(b+d);data.set(bytes.subarray(0,b));data.set(bytes.subarray(c,c+d),b);
  const hex=gap.slice(1,-1).replace(/\s/g,"");
  if(hex.length%2)throw new Error("Invalid signature contents encoding.");
  const contents=Uint8Array.from(hex.match(/../g)??[],byte=>parseInt(byte,16));
  return {data,contents,coverage:c+d===bytes.length};
}
export async function verifyCms(pkcs7:Uint8Array,data:Uint8Array) {
  if(!globalThis.crypto?.subtle)throw new Error("Secure browser cryptography is unavailable.");
  setEngine("WebCrypto",new CryptoEngine({name:"WebCrypto",crypto:globalThis.crypto}));
  const decoded=fromBER(new Uint8Array(pkcs7).buffer);
  if(decoded.offset===-1||pkcs7.subarray(decoded.offset).some(byte=>byte!==0))throw new Error("The embedded signature cannot be decoded.");
  const cms=new ContentInfo({schema:decoded.result});
  if(cms.contentType!==ContentInfo.SIGNED_DATA)throw new Error("Unsupported embedded signature type.");
  const signed=new SignedData({schema:cms.content});
  if(signed.encapContentInfo.eContent)throw new Error("Embedded-content signatures are not supported for detached PDF verification.");
  if(signed.signerInfos.length!==1)throw new Error("This CMS signer arrangement is not supported.");
  if(!["2.16.840.1.101.3.4.2.1","2.16.840.1.101.3.4.2.2","2.16.840.1.101.3.4.2.3"].includes(signed.signerInfos[0].digestAlgorithm.algorithmId))throw new Error("This signature uses an unsupported or legacy digest algorithm.");
  const result=await signed.verify({signer:0,data:new Uint8Array(data).buffer,checkChain:false,extendedMode:true});
  const cert=result.signerCertificate;
  const now=new Date();
  const certificate=!cert?"not-verified":now>=cert.notBefore.value&&now<=cert.notAfter.value?"current":"outside-validity";
  const commonName=cert?.subject.typesAndValues.find(attribute=>attribute.type==="2.5.4.3");
  const name=commonName?String(commonName.value.valueBlock.value):undefined;
  return {valid:result.signatureVerified===true,certificate,name} as const;
}
export async function inspectSignature(bytes:Uint8Array,meta:SignatureMetadata,pkcs7:Uint8Array,encryptedDocument=false):Promise<SignatureResult> {
  const base={name:meta.signerName||"Signer not identified",coverage:false,trust:"not-verified" as const,certificate:"not-verified" as const};
  let coverage=false;
  try{
    const ranges=signedRanges(bytes,meta.byteRange);
    coverage=ranges.coverage;
    const matches=ranges.contents.length===pkcs7.length&&!ranges.contents.some((byte,index)=>byte!==pkcs7[index]);
    if(!matches&&!encryptedDocument)throw new Error("Signature contents do not match the excluded byte range.");
    if(!["adbe.pkcs7.detached","ETSI.CAdES.detached"].includes(meta.subFilter||""))return {...base,coverage:ranges.coverage,integrity:"not-verified",detail:"Unsupported signature format. Use a trusted PDF signature validator."};
    // Some encrypted PDFs cause PDF.js to decrypt the already-unencrypted CMS value.
    // Verify the original excluded bytes, never a rewritten/decrypted PDF.
    const result=await verifyCms(matches?pkcs7:ranges.contents,ranges.data);
    return {...base,name:result.name||base.name,coverage:ranges.coverage,certificate:result.certificate,integrity:result.valid?"intact":"invalid",
      detail:result.valid?"The signed bytes match this embedded signature. Signer identity, certificate chain, revocation and trusted timestamps have not been verified.":"Cryptographic signature verification failed. Do not rely on this signature."};
  }catch(error){
    return {...base,coverage,integrity:"not-verified",detail:error instanceof Error?error.message:"Signature verification could not be completed."};
  }
}
export async function inspectPdfEvidence(file:File,password?:string) {
  if(file.size>20*1024*1024)throw new Error("Automatic signature checks support PDFs up to 20 MB.");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const {getPdfJs}=await import("./pdfjs-helper");
  const pdfjs=await getPdfJs();
  const task=pdfjs.getDocument({data:bytes.slice(),password,enableXfa:false});
  try{
    const pdf=await task.promise;
    const metadataInfo=await pdf.getMetadata();
    const encryptedDocument=typeof (metadataInfo.info as Record<string,unknown>).EncryptFilterName==="string";
    const metadata=(await pdf.getSignatures()??[]) as SignatureMetadata[];
    if(metadata.length>20)throw new Error("More than 20 signatures found. Use a dedicated signature validator for this file.");
    const results:SignatureResult[]=[];
    for(const meta of metadata){
      const payload=await pdf.getSignatureData(meta.id);
      if(!payload){results.push({name:"Signer not identified",integrity:"not-verified",coverage:false,trust:"not-verified",certificate:"not-verified",detail:"Signature data is unavailable."});continue;}
      results.push(await inspectSignature(bytes,meta,payload.pkcs7,encryptedDocument));
    }
    return {results,sha256:await pdfFingerprint(bytes),checkedAt:new Date().toISOString(),fileName:file.name,fileSize:bytes.byteLength};
  }finally{await task.destroy();}
}
export async function inspectPdf(file:File,password?:string) {
  return (await inspectPdfEvidence(file,password)).results;
}
