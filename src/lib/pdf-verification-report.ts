import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {hasIntactOriginal} from "./signature-result";
import type {PdfVerificationEvidence} from "./pdf-verification-evidence";

export async function buildVerificationReport(evidence:PdfVerificationEvidence) {
  if(!/^[a-f0-9]{64}$/.test(evidence.sha256))throw new Error("A valid SHA-256 fingerprint is required.");
  const checked=new Date(evidence.checkedAt);
  if(!Number.isFinite(checked.getTime()))throw new Error("A valid check time is required.");
  const doc=await PDFDocument.create();
  doc.setTitle("MSYN Verification Report");
  doc.setAuthor("MSYN Tools");
  doc.setSubject("Original file SHA-256: "+evidence.sha256);
  const regular=await doc.embedFont(StandardFonts.Helvetica);
  const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const dark=rgb(.1,.14,.19),muted=rgb(.32,.36,.4),green=rgb(.02,.4,.27),red=rgb(.65,.09,.09);
  let page=doc.addPage(),y=page.getHeight()-44;
  const margin=44,width=page.getWidth()-margin*2;
  let replaced=false;
  const safe=(text:string)=>Array.from(text).map(char=>{
    if(char==="\n"||char==="\r"||char==="\t")return " ";
    try{regular.encodeText(char);return char;}catch{replaced=true;return "?";}
  }).join("");
  const newPage=()=>{page=doc.addPage();y=page.getHeight()-44;};
  const reserve=(height:number)=>{if(y-height<60)newPage();};
  const text=(value:string,size=10,strong=false,color=dark)=>{
    const font=strong?bold:regular;
    const words=safe(value).split(/\s+/).filter(Boolean);
    let line="";
    const emit=()=>{reserve(size+6);page.drawText(line,{x:margin,y:y-size,size,font,color});y-=size+6;line="";};
    for(const word of words){
      if(font.widthOfTextAtSize(word,size)>width){
        if(line)emit();
        for(const char of word){if(font.widthOfTextAtSize(line+char,size)>width)emit();line+=char;}
      }else if(line&&font.widthOfTextAtSize(line+" "+word,size)>width){emit();line=word;}
      else line+=(line?" ":"")+word;
    }
    if(line)emit();
  };
  const gap=(height=10)=>{y-=height;};
  text("MSYN",12,true,muted);
  text("PDF Verification Report",24,true);
  gap();
  const passed=hasIntactOriginal(evidence.results);
  const invalid=evidence.results.some(result=>result.integrity==="invalid");
  reserve(65);
  if(passed){
    page.drawLine({start:{x:margin+2,y:y-20},end:{x:margin+10,y:y-28},thickness:3,color:green});
    page.drawLine({start:{x:margin+10,y:y-28},end:{x:margin+26,y:y-8},thickness:3,color:green});
    page.drawText("Signature integrity verified by MSYN",{x:margin+38,y:y-20,size:15,font:bold,color:green});y-=44;
  }else text(invalid?"Invalid signature detected":"Signature integrity not verified",16,true,invalid?red:dark);
  text("Signer identity, certificate chain, revocation and trusted timestamps: NOT VERIFIED.",10,true);
  text("This is a separate, unsigned report of a local integrity check, not an Aadhaar identity certificate or an Acrobat trust decision.",10,false,muted);
  gap(16);
  text("Original File",13,true);
  text("Filename: "+evidence.fileName);
  text("File size: "+evidence.fileSize.toLocaleString("en-IN")+" bytes");
  text("Checked at (device time): "+checked.toISOString());
  gap();
  text("SHA-256 Fingerprint",11,true);
  for(let i=0;i<64;i+=32)text(evidence.sha256.slice(i,i+32),12,true);
  text("The fingerprint identifies the exact original bytes that were checked. The original PDF was not rewritten, decrypted to a new file, or stamped.",9,false,muted);
  gap(18);
  text("Signature Results",13,true);
  if(!evidence.results.length)text("No readable digital signatures were found. The document's authenticity is not established.");
  for(const [index,result] of evidence.results.entries()){
    reserve(105);
    gap();
    text("Signature "+(index+1),12,true);
    text("Integrity: "+(result.integrity==="intact"?"Signed revision intact":result.integrity==="invalid"?"INVALID":"Not verified"),10,true,result.integrity==="invalid"?red:dark);
    text("Reported signer (not independently trusted): "+result.name);
    text("Entire uploaded file covered: "+(result.coverage?"Yes":"No / not established"));
    text("Certificate dates at check time: "+(result.certificate==="current"?"Within validity period":result.certificate==="outside-validity"?"Outside validity period":"Not verified"));
    text("Signer trust and revocation: NOT VERIFIED",10,true);
    text(result.detail,9,false,muted);
  }
  gap(16);
  text("Important Limitations",12,true);
  text("An intact signature establishes a mathematical match to the signed bytes; it does not establish a trusted signer or verify the holder's identity. Earlier signed revisions may not cover later changes. Certificate dates use the checking device's clock, not a validated timestamp.",9,false,muted);
  text("Keep this report with the unchanged original PDF. Anyone can edit an unsigned report, so it must not replace independent validation of the original.",9,false,muted);
  if(replaced)text("Some name characters are shown as ? because of PDF font limitations. Use the SHA-256 fingerprint to match the exact original file.",9,false,muted);
  const pages=doc.getPages();
  pages.forEach((item,index)=>{
    item.drawLine({start:{x:margin,y:42},end:{x:item.getWidth()-margin,y:42},thickness:.5,color:rgb(.8,.82,.84)});
    item.drawText("MSYN local integrity report | Not digitally signed",{x:margin,y:28,size:8,font:regular,color:muted});
    item.drawText((index+1)+" / "+pages.length,{x:item.getWidth()-margin-32,y:28,size:8,font:regular,color:muted});
  });
  return new Uint8Array(await doc.save());
}
