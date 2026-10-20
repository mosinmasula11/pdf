import {beforeAll,describe,expect,it} from "vitest";
import {Certificate,AttributeTypeAndValue,ContentInfo,SignedData,EncapsulatedContentInfo,SignerInfo,IssuerAndSerialNumber,CryptoEngine,setEngine} from "pkijs";
import {Integer,Utf8String,OctetString,fromBER} from "asn1js";
import {verifyCms,signedRanges,inspectSignature} from "./pdf-signature-check";
let cms:Uint8Array;
const data=new TextEncoder().encode("Original signed test content");
beforeAll(async()=>{
  setEngine("WebCrypto",new CryptoEngine({name:"WebCrypto",crypto:globalThis.crypto}));
  const keys=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const cert=new Certificate();cert.version=2;cert.serialNumber=new Integer({value:1});
  cert.issuer.typesAndValues.push(new AttributeTypeAndValue({type:"2.5.4.3",value:new Utf8String({value:"Untrusted test signer"})}));
  cert.subject=cert.issuer;
  cert.notBefore.value=new Date(Date.now()-86400000);cert.notAfter.value=new Date(Date.now()+86400000);
  await cert.subjectPublicKeyInfo.importKey(keys.publicKey);await cert.sign(keys.privateKey,"SHA-256");
  const signed=new SignedData({encapContentInfo:new EncapsulatedContentInfo({eContentType:ContentInfo.DATA}),signerInfos:[new SignerInfo({sid:new IssuerAndSerialNumber({issuer:cert.issuer,serialNumber:cert.serialNumber})})],certificates:[cert]});
  await signed.sign(keys.privateKey,0,"SHA-256",data);
  cms=new Uint8Array(new ContentInfo({contentType:ContentInfo.SIGNED_DATA,content:signed.toSchema(true)}).toSchema().toBER(false));
},20000);
describe("PDF signature integrity",()=>{
  it("verifies a genuine detached CMS without claiming trust",async()=>{
    const result=await verifyCms(cms,data);
    expect(result.valid).toBe(true);expect(result.certificate).toBe("current");
  });
  it("does not accept changed data",async()=>{
    const tampered=data.slice();tampered[0]^=1;
    const outcome=await verifyCms(cms,tampered).catch(()=>({valid:false}));
    expect(outcome.valid).toBe(false);
  });
  it("rejects malformed CMS",async()=>{await expect(verifyCms(new Uint8Array([1,2,3]),data)).rejects.toThrow();});
  it("rejects embedded-content substitution",async()=>{
    const content=new ContentInfo({schema:fromBER(cms).result});
    const signed=new SignedData({schema:content.content});
    signed.encapContentInfo.eContent=new OctetString({valueHex:new Uint8Array(data).buffer});
    content.content=signed.toSchema(true);
    await expect(verifyCms(new Uint8Array(content.toSchema().toBER(false)),data)).rejects.toThrow("Embedded-content");
  });
  it("rejects invalid byte ranges and arbitrary excluded content",()=>{
    const bytes=new TextEncoder().encode("HEAD<0000>TAIL");
    expect(signedRanges(bytes,[0,4,10,4]).coverage).toBe(true);
    expect(new TextDecoder().decode(signedRanges(bytes,[0,4,10,4]).data)).toBe("HEADTAIL");
    expect(signedRanges(new TextEncoder().encode("HEAD<0000>TAILEXTRA"),[0,4,10,4]).coverage).toBe(false);
    for(const range of [[1,4,10,4],[0,4,3,1],[0,4,10,100],[0,-1,10,1],[0,1.5,10,1],[]])expect(()=>signedRanges(bytes,range)).toThrow();
    expect(()=>signedRanges(bytes,[0,3,10,4])).toThrow();
  });
  it("reports unsupported signatures conservatively",async()=>{
    const bytes=new TextEncoder().encode("HEAD<0000>TAIL");
    const result=await inspectSignature(bytes,{id:"test",byteRange:[0,4,10,4],subFilter:"unknown"},new Uint8Array([0,0]));
    expect(result.integrity).toBe("not-verified");expect(result.trust).toBe("not-verified");
  });
  it("does not confuse signature presence with verification",async()=>{
    const bytes=new TextEncoder().encode("HEAD<0000>TAIL");
    const result=await inspectSignature(bytes,{id:"test",byteRange:[0,4,10,4],subFilter:"adbe.pkcs7.detached"},new Uint8Array([1,2]));
    expect(result.integrity).toBe("not-verified");expect(result.detail).toContain("do not match");
  });
  it("verifies original CMS bytes when an encrypted-PDF parser transforms Contents",async()=>{
    const split=9;
    const gap=new TextEncoder().encode("<"+Array.from(cms,byte=>byte.toString(16).padStart(2,"0")).join("")+">");
    const bytes=new Uint8Array(data.length+gap.length);
    bytes.set(data.subarray(0,split));bytes.set(gap,split);bytes.set(data.subarray(split),split+gap.length);
    const meta={id:"encrypted",subFilter:"adbe.pkcs7.detached",byteRange:[0,split,split+gap.length,data.length-split]};
    const transformed=new Uint8Array([255,2,3]);
    const result=await inspectSignature(bytes,meta,transformed,true);
    expect(result.integrity).toBe("intact");expect(result.coverage).toBe(true);expect(result.trust).toBe("not-verified");
    expect((await inspectSignature(bytes,meta,transformed)).integrity).toBe("not-verified");
    bytes[bytes.length-1]^=1;
    expect((await inspectSignature(bytes,meta,transformed,true)).integrity).not.toBe("intact");
  });
});
