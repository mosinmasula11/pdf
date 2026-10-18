import { PDFDocument, PDFName, PDFRef } from "pdf-lib";

export type DocumentProperties = { title: string; author: string; subject: string; keywords: string; creator: string; producer: string };

export async function writePdfProperties(bytes: ArrayBuffer | Uint8Array, values: DocumentProperties, wipe = false) {
  const document = await PDFDocument.load(bytes, { updateMetadata: false });
  const metadata = document.catalog.get(PDFName.of("Metadata"));
  if (metadata instanceof PDFRef) document.context.delete(metadata);
  document.catalog.delete(PDFName.of("Metadata"));
  const info = document.context.trailerInfo.Info;
  if (info instanceof PDFRef) document.context.delete(info);
  document.context.trailerInfo.Info = undefined;
  if (!wipe) {
    document.setTitle(values.title.trim());
    document.setAuthor(values.author.trim());
    document.setSubject(values.subject.trim());
    document.setKeywords(values.keywords.split(",").map((value) => value.trim()).filter(Boolean));
    document.setCreator(values.creator.trim());
    document.setProducer(values.producer.trim());
  }
  return document.save();
}
