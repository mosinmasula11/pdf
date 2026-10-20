import type {SignatureResult} from "./pdf-signature-check";

export type PdfVerificationEvidence={
  fileName:string;fileSize:number;sha256:string;checkedAt:string;results:SignatureResult[];
};
export async function pdfFingerprint(bytes:Uint8Array) {
  const digest=await crypto.subtle.digest("SHA-256",new Uint8Array(bytes).buffer);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}
