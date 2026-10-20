import { PDFDocument, PDFName, PDFRef } from "@cantoo/pdf-lib";

export type DocumentProperties = { title: string; author: string; subject: string; keywords: string; creator: string; producer: string };

export interface ExtractedPdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export async function readPdfProperties(bytes: ArrayBuffer | Uint8Array, password = ""): Promise<DocumentProperties> {
  const encrypted = (await PDFDocument.load(bytes, {ignoreEncryption:true,updateMetadata:false})).isEncrypted;
  const document = await PDFDocument.load(bytes, { password, updateMetadata: false });
  if (encrypted) {
    const {getPdfJs} = await import("./pdfjs-helper");
    const pdfjs = await getPdfJs();
    const task = pdfjs.getDocument({data: new Uint8Array(bytes).slice(), password, enableXfa:false});
    try {
      const pdf = await task.promise;
      const {info} = await pdf.getMetadata();
      const values = info as Record<string, unknown>;
      const text = (key:string) => typeof values[key] === "string" ? values[key] as string : "";
      return {title:text("Title"),author:text("Author"),subject:text("Subject"),keywords:text("Keywords"),creator:text("Creator"),producer:text("Producer")};
    } finally { await task.destroy(); }
  }
  return {title: document.getTitle() || "", author: document.getAuthor() || "", subject: document.getSubject() || "", keywords: document.getKeywords() || "", creator: document.getCreator() || "", producer: document.getProducer() || ""};
}

export async function writePdfProperties(bytes: ArrayBuffer | Uint8Array, values: DocumentProperties, wipe = false, password = "") {
  const document = await PDFDocument.load(bytes, { password, updateMetadata: false });
  document.context.trailerInfo.Encrypt = undefined;
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

/**
 * Strips all metadata (XMP metadata streams and Document Info dictionaries) from PDF bytes.
 */
export async function stripPdfMetadata(bytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  return writePdfProperties(bytes, { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" }, true);
}

/**
 * Extracts original metadata from a PDF file/bytes (Title, Author, Subject, Keywords, Creator, Producer, Dates).
 */
export async function extractPdfMetadata(
  bytes: ArrayBuffer | Uint8Array,
  password?: string
): Promise<ExtractedPdfMetadata | null> {
  // 1. Try with PDFDocument (supports password & ignoreEncryption in @cantoo/pdf-lib)
  try {
    const doc = await PDFDocument.load(bytes, {
      password,
      ignoreEncryption: true,
      updateMetadata: false,
    });
    const title = doc.getTitle();
    const author = doc.getAuthor();
    const subject = doc.getSubject();
    const keywordsRaw = doc.getKeywords();
    const creator = doc.getCreator();
    const producer = doc.getProducer();
    const creationDate = doc.getCreationDate();
    const modificationDate = doc.getModificationDate();

    const keywords = Array.isArray(keywordsRaw)
      ? keywordsRaw
      : typeof keywordsRaw === "string"
      ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined;

    const hasAny = Boolean(
      title ||
        author ||
        subject ||
        (keywords && keywords.length > 0) ||
        creator ||
        producer ||
        creationDate ||
        modificationDate
    );

    if (hasAny) {
      return {
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        keywords: keywords && keywords.length > 0 ? keywords : undefined,
        creator: creator || undefined,
        producer: producer || undefined,
        creationDate: creationDate || undefined,
        modificationDate: modificationDate || undefined,
      };
    }
  } catch {
    // fallback to PDF.js
  }

  // 2. Fallback to PDF.js for custom encrypted/standard PDFs
  try {
    const { getPdfJs } = await import("./pdfjs-helper");
    const pdfjs = await getPdfJs();
    const slice = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes).slice();
    const task = pdfjs.getDocument({ data: slice, password, enableXfa: false });
    const doc = await task.promise;
    try {
      const { info } = await doc.getMetadata();
      if (info && typeof info === "object") {
        const inf = info as Record<string, unknown>;
        const title = typeof inf.Title === "string" && inf.Title.trim() ? inf.Title.trim() : undefined;
        const author = typeof inf.Author === "string" && inf.Author.trim() ? inf.Author.trim() : undefined;
        const subject = typeof inf.Subject === "string" && inf.Subject.trim() ? inf.Subject.trim() : undefined;
        const keywordsStr = typeof inf.Keywords === "string" && inf.Keywords.trim() ? inf.Keywords.trim() : undefined;
        const creator = typeof inf.Creator === "string" && inf.Creator.trim() ? inf.Creator.trim() : undefined;
        const producer = typeof inf.Producer === "string" && inf.Producer.trim() ? inf.Producer.trim() : undefined;

        const keywords = keywordsStr
          ? keywordsStr.split(/[,;]+/).map((k) => k.trim()).filter(Boolean)
          : undefined;

        const parsePdfDate = (val: unknown): Date | undefined => {
          if (typeof val === "string") {
            const m = val.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
            if (m) {
              return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
            }
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          }
          return undefined;
        };

        const creationDate = parsePdfDate(inf.CreationDate);
        const modificationDate = parsePdfDate(inf.ModDate);

        if (title || author || subject || keywords || creator || producer || creationDate || modificationDate) {
          return {
            title,
            author,
            subject,
            keywords,
            creator,
            producer,
            creationDate,
            modificationDate,
          };
        }
      }
    } finally {
      await task.destroy();
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Copies the original PDF's metadata back into the target PDF bytes before downloading.
 * If the original PDF had metadata, it is preserved onto the target PDF.
 */
export async function restoreOriginalPdfMetadata(
  originalBytes: ArrayBuffer | Uint8Array,
  targetBytes: ArrayBuffer | Uint8Array,
  password?: string
): Promise<Uint8Array> {
  const metadata = await extractPdfMetadata(originalBytes, password);
  if (!metadata) {
    // If original had no metadata, keep target clean without metadata
    return await stripPdfMetadata(targetBytes);
  }

  const targetDoc = await PDFDocument.load(targetBytes, { updateMetadata: false });
  // Clear any default or placeholder metadata
  targetDoc.catalog.delete(PDFName.of("Metadata"));
  targetDoc.context.trailerInfo.Info = undefined;

  if (metadata.title) targetDoc.setTitle(metadata.title);
  if (metadata.author) targetDoc.setAuthor(metadata.author);
  if (metadata.subject) targetDoc.setSubject(metadata.subject);
  if (metadata.keywords && metadata.keywords.length > 0) targetDoc.setKeywords(metadata.keywords);
  if (metadata.creator) targetDoc.setCreator(metadata.creator);
  if (metadata.producer) targetDoc.setProducer(metadata.producer);
  if (metadata.creationDate) targetDoc.setCreationDate(metadata.creationDate);
  if (metadata.modificationDate) targetDoc.setModificationDate(metadata.modificationDate);

  return await targetDoc.save();
}
