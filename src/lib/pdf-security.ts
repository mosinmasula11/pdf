import { PDFDocument } from "@cantoo/pdf-lib";

export async function protectPdfBytes(
  bytes: ArrayBuffer | Uint8Array,
  password: string,
  permissions: { restrictPrinting: boolean; restrictCopying: boolean },
) {
  const document = await PDFDocument.load(bytes);
  document.encrypt({
    algorithm: "AES-256",
    userPassword: password,
    ownerPassword: crypto.randomUUID() + crypto.randomUUID(),
    permissions: {
      printing: permissions.restrictPrinting ? false : "highResolution",
      copying: !permissions.restrictCopying,
      modifying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  return document.save({ useObjectStreams: false });
}

export async function unlockPdfBytes(bytes: ArrayBuffer | Uint8Array, password: string) {
  // Supplying even an empty password invokes actual authentication/decryption.
  const document = await PDFDocument.load(bytes, { password });
  document.context.trailerInfo.Encrypt = undefined;
  return document.save({ useObjectStreams: false });
}
