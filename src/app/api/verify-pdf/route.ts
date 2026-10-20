import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import forge from "node-forge";

/**
 * Structured response specification for the PDF signature verification endpoint.
 */
export interface VerifyPdfResponse {
  verified: boolean;
  chainTrusted: boolean;
  signerName: string;
  signingTime: string | null;
  error: string | null;
}

/**
 * Standard OID to Node.js crypto hash algorithm mapping.
 */
const DIGEST_OID_TO_ALGORITHM: Record<string, string> = {
  "2.16.840.1.101.3.4.2.1": "sha256",
  "1.3.14.3.2.26": "sha1",
  "2.16.840.1.101.3.4.2.2": "sha384",
  "2.16.840.1.101.3.4.2.3": "sha512",
  "1.2.840.113549.2.5": "md5",
};

/**
 * Extracts signer Common Name (CN) or Organization (O) from the certificate subject.
 */
function extractSignerName(cert: forge.pki.Certificate): string {
  const cnField = cert.subject.getField("CN");
  if (cnField && typeof cnField.value === "string" && cnField.value.trim()) {
    return cnField.value.trim();
  }
  const oField = cert.subject.getField("O");
  if (oField && typeof oField.value === "string" && oField.value.trim()) {
    return oField.value.trim();
  }
  const ouField = cert.subject.getField("OU");
  if (ouField && typeof ouField.value === "string" && ouField.value.trim()) {
    return ouField.value.trim();
  }
  return "Unknown Signer";
}

/**
 * Parses the PDF /ByteRange dictionary to isolate the signed document bytes
 * and the embedded PKCS#7 hexadecimal signature payload.
 */
function extractPdfSignatureData(pdfBuffer: Buffer): {
  signedDocumentBytes: Buffer;
  sigDerBytes: Buffer;
} {
  const pdfString = pdfBuffer.toString("latin1");

  // Regex matches /ByteRange [ offset1 length1 offset2 length2 ] with arbitrary whitespace/newlines
  const byteRangeRegex = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  const matches = [...pdfString.matchAll(byteRangeRegex)];

  if (!matches || matches.length === 0) {
    throw new Error("No digital signature or /ByteRange dictionary found in PDF.");
  }

  // Use the last /ByteRange match to handle incrementally updated documents
  const lastMatch = matches[matches.length - 1];
  const offset1 = parseInt(lastMatch[1], 10);
  const length1 = parseInt(lastMatch[2], 10);
  const offset2 = parseInt(lastMatch[3], 10);
  const length2 = parseInt(lastMatch[4], 10);

  // Validate range boundary integrity
  if (
    offset1 !== 0 ||
    length1 <= 0 ||
    offset2 <= offset1 + length1 ||
    offset2 + length2 > pdfBuffer.length
  ) {
    throw new Error("Corrupt or invalid /ByteRange dictionary in PDF.");
  }

  // 1. Isolate signed document data bytes by joining the ranges excluding the signature
  const signedDocumentBytes = Buffer.concat([
    pdfBuffer.subarray(offset1, offset1 + length1),
    pdfBuffer.subarray(offset2, offset2 + length2),
  ]);

  // 2. Extract embedded PKCS#7 hex signature from the excluded gap
  const gapBuffer = pdfBuffer.subarray(offset1 + length1, offset2);
  const gapString = gapBuffer.toString("latin1");

  // The hexadecimal contents are enclosed in < ... >
  const contentsMatch = gapString.match(/<([0-9a-fA-F\s]+)>/);
  let hexString = "";

  if (contentsMatch && contentsMatch[1]) {
    hexString = contentsMatch[1].replace(/\s+/g, "");
  } else {
    // Fallback: extract contiguous hexadecimal sequence from gap
    const rawHexMatch = gapString.match(/([0-9a-fA-F]{64,})/);
    if (rawHexMatch && rawHexMatch[1]) {
      hexString = rawHexMatch[1].replace(/\s+/g, "");
    }
  }

  if (!hexString) {
    throw new Error("Unable to extract PKCS#7 /Contents hexadecimal signature block from PDF.");
  }

  let sigDerBytes = Buffer.from(hexString, "hex");

  // Adobe & Aadhaar signing software pads the signature placeholder with trailing zeroes (0x00).
  // Read ASN.1 DER SEQUENCE header to determine exact packet length and strip trailing padding.
  if (sigDerBytes.length > 4 && sigDerBytes[0] === 0x30) {
    let headerLength = 2;
    let contentLen = 0;
    const firstLengthByte = sigDerBytes[1];

    if (firstLengthByte < 0x80) {
      contentLen = firstLengthByte;
    } else {
      const numLengthBytes = firstLengthByte & 0x7f;
      headerLength = 2 + numLengthBytes;
      for (let i = 0; i < numLengthBytes; i++) {
        contentLen = (contentLen << 8) | sigDerBytes[2 + i];
      }
    }

    const totalAsn1Length = headerLength + contentLen;
    if (totalAsn1Length > 0 && totalAsn1Length <= sigDerBytes.length) {
      sigDerBytes = sigDerBytes.subarray(0, totalAsn1Length);
    }
  }

  return { signedDocumentBytes, sigDerBytes };
}

/**
 * Validates the cryptographic signature hash against document content bytes.
 */
function verifyDocumentAndSignature(
  p7: forge.pkcs7.Captured<forge.pkcs7.PkcsSignedData>,
  signedBytes: Buffer
): { isValid: boolean; signerCert: forge.pki.Certificate; signingTime: Date | null } {
  if (!p7.certificates || p7.certificates.length === 0) {
    throw new Error("No certificates found in PKCS#7 signature.");
  }

  interface RawCapture {
    signature?: string;
    digestAlgorithm?: string;
    authenticatedAttributes?: forge.asn1.Asn1[];
    serial?: string;
    signerInfos?: { value?: forge.asn1.Asn1[] };
  }

  const rc = (p7.rawCapture || {}) as RawCapture;
  const rawSignature = rc.signature;

  if (!rawSignature) {
    throw new Error("No signature bytes found in PKCS#7 SignerInfo.");
  }

  // 1. Digest Algorithm Identifier
  const digestAlgoOid = rc.digestAlgorithm ? forge.asn1.derToOid(rc.digestAlgorithm) : "2.16.840.1.101.3.4.2.1";
  const hashAlgorithm = DIGEST_OID_TO_ALGORITHM[digestAlgoOid] || "sha256";

  // 2. Locate Signer Certificate
  let signerCert: forge.pki.Certificate | undefined;
  if (rc.serial) {
    const serialHex = forge.util.createBuffer(rc.serial).toHex();
    signerCert = p7.certificates.find(
      (c) => c.serialNumber.toLowerCase() === serialHex.toLowerCase()
    );
  }

  // Fallback: use first non-CA certificate or first cert
  if (!signerCert) {
    signerCert =
      p7.certificates.find((c) => {
        const bc = c.getExtension("basicConstraints") as { cA?: boolean } | null;
        return !bc || !bc.cA;
      }) || p7.certificates[0];
  }

  const signatureBytes = Buffer.from(rawSignature, "binary");
  let signingTime: Date | null = null;
  const authenticatedAttributes = rc.authenticatedAttributes;

  // 3. Verification logic with Authenticated Attributes (RFC 2315 section 9.3)
  if (authenticatedAttributes && Array.isArray(authenticatedAttributes) && authenticatedAttributes.length > 0) {
    let expectedDigest: Buffer | null = null;

    for (const attr of authenticatedAttributes) {
      const attrSeq = attr.value as forge.asn1.Asn1[];
      const attrOid = forge.asn1.derToOid(attrSeq[0].value as string);

      if (attrOid === forge.pki.oids.messageDigest || attrOid === "1.2.840.113549.1.9.4") {
        const setVal = attrSeq[1].value as forge.asn1.Asn1[];
        expectedDigest = Buffer.from(setVal[0].value as string, "binary");
      } else if (attrOid === forge.pki.oids.signingTime || attrOid === "1.2.840.113549.1.9.5") {
        const setVal = attrSeq[1].value as forge.asn1.Asn1[];
        try {
          signingTime = forge.asn1.utcTimeToDate(setVal[0].value as string);
        } catch {
          // ignore parsing error if generalized time format differs
        }
      }
    }

    if (!expectedDigest) {
      throw new Error("PKCS#7 authenticated attributes missing messageDigest attribute.");
    }

    // A. Cross-verify calculated document hash against embedded messageDigest
    const computedDocDigest = crypto.createHash(hashAlgorithm).update(signedBytes).digest();
    if (
      computedDocDigest.length !== expectedDigest.length ||
      !crypto.timingSafeEqual(computedDocDigest, expectedDigest)
    ) {
      return { isValid: false, signerCert, signingTime };
    }

    // B. Verify cryptographic signature over DER-encoded SET OF authenticated attributes
    const attrsSetAsn1 = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SET,
      true,
      authenticatedAttributes
    );
    const attrsDerBytes = Buffer.from(forge.asn1.toDer(attrsSetAsn1).getBytes(), "binary");
    const signerCertPem = forge.pki.certificateToPem(signerCert);

    const isSignatureValid = crypto.verify(
      hashAlgorithm,
      attrsDerBytes,
      signerCertPem,
      signatureBytes
    );

    return { isValid: isSignatureValid, signerCert, signingTime };
  } else {
    // Raw detached signature verification (without signed attributes)
    const signerCertPem = forge.pki.certificateToPem(signerCert);
    const isSignatureValid = crypto.verify(
      hashAlgorithm,
      signedBytes,
      signerCertPem,
      signatureBytes
    );

    return { isValid: isSignatureValid, signerCert, signingTime };
  }
}

/**
 * Next.js App Router API Route Handler
 * POST /api/verify-pdf
 */
export async function POST(request: Request): Promise<NextResponse<VerifyPdfResponse>> {
  try {
    // 1. Synchronously load trusted root certificate from disk (prioritizing secu/ directory)
    const secuDir = path.join(process.cwd(), "secu");
    const certsDir = path.join(process.cwd(), "certificates");

    const candidatePaths = [
      path.join(secuDir, "CCAIndia2022.cer"),
      path.join(secuDir, "cca_india_root.pem"),
      path.join(certsDir, "cca_india_root.pem"),
    ];

    let rootCertPath = candidatePaths.find((p) => fs.existsSync(p));

    // Also check for any .cer or .pem file in secu/ directory
    if (!rootCertPath && fs.existsSync(secuDir)) {
      const secuFiles = fs.readdirSync(secuDir);
      const certFile = secuFiles.find(
        (f) => f.endsWith(".cer") || f.endsWith(".pem") || f.endsWith(".crt")
      );
      if (certFile) {
        rootCertPath = path.join(secuDir, certFile);
      }
    }

    if (!rootCertPath || !fs.existsSync(rootCertPath)) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error: `Trusted root certificate missing on server. Checked 'secu/' and 'certificates/' directories.`,
        },
        { status: 500 }
      );
    }

    let caStore: forge.pki.CAStore;

    try {
      // Load primary certificate
      const primaryPem = fs.readFileSync(rootCertPath, "utf-8");
      const primaryCert = forge.pki.certificateFromPem(primaryPem);
      const trustedCerts = [primaryCert];

      // Optionally load any secondary certificates found in secu/
      if (fs.existsSync(secuDir)) {
        const extraFiles = fs
          .readdirSync(secuDir)
          .filter(
            (f) =>
              (f.endsWith(".cer") || f.endsWith(".pem") || f.endsWith(".crt")) &&
              path.join(secuDir, f) !== rootCertPath
          );
        for (const file of extraFiles) {
          try {
            const raw = fs.readFileSync(path.join(secuDir, file), "utf-8");
            trustedCerts.push(forge.pki.certificateFromPem(raw));
          } catch {
            // ignore unparseable extra files
          }
        }
      }

      caStore = forge.pki.createCaStore(trustedCerts);
    } catch (certLoadError) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error: `Failed to parse trusted root certificate at ${rootCertPath}: ${
            certLoadError instanceof Error ? certLoadError.message : "Invalid certificate PEM"
          }`,
        },
        { status: 500 }
      );
    }

    // 2. Extract uploaded PDF buffer from request (supports multipart/form-data, binary, or JSON)
    let pdfBuffer: Buffer | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("pdf");

      if (!file || typeof file === "string") {
        return NextResponse.json(
          {
            verified: false,
            chainTrusted: false,
            signerName: "",
            signingTime: null,
            error: "No file found in multipart/form-data request. Provide 'file' field.",
          },
          { status: 400 }
        );
      }

      pdfBuffer = Buffer.from(await (file as Blob).arrayBuffer());
    } else if (
      contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream")
    ) {
      pdfBuffer = Buffer.from(await request.arrayBuffer());
    } else if (contentType.includes("application/json")) {
      const json = await request.json();
      const b64 = json.file || json.pdf || json.data;
      if (typeof b64 === "string" && b64.trim()) {
        const cleanB64 = b64.replace(/^data:application\/pdf;base64,/, "");
        pdfBuffer = Buffer.from(cleanB64, "base64");
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error: "Empty or missing PDF stream in request body.",
        },
        { status: 400 }
      );
    }

    // Check PDF header signature
    if (!pdfBuffer.subarray(0, 10).toString("latin1").includes("%PDF-")) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error: "Invalid PDF format: file header does not contain '%PDF-'.",
        },
        { status: 400 }
      );
    }

    // 3. Extract /ByteRange dictionary to isolate signed bytes and PKCS#7 hex signature
    let signedDocumentBytes: Buffer;
    let sigDerBytes: Buffer;

    try {
      const signatureData = extractPdfSignatureData(pdfBuffer);
      signedDocumentBytes = signatureData.signedDocumentBytes;
      sigDerBytes = signatureData.sigDerBytes;
    } catch (parsePdfError) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error:
            parsePdfError instanceof Error
              ? parsePdfError.message
              : "Failed to extract digital signature from PDF.",
        },
        { status: 422 }
      );
    }

    // 4. Parse the PKCS#7 signature structure using node-forge (forge.pkcs7.messageFromAsn1)
    let p7: forge.pkcs7.Captured<forge.pkcs7.PkcsSignedData>;
    try {
      const asn1Obj = forge.asn1.fromDer(sigDerBytes.toString("binary"));
      p7 = forge.pkcs7.messageFromAsn1(asn1Obj) as forge.pkcs7.Captured<forge.pkcs7.PkcsSignedData>;
    } catch (pkcs7Error) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName: "",
          signingTime: null,
          error: `Invalid PKCS#7 signature ASN.1 structure: ${
            pkcs7Error instanceof Error ? pkcs7Error.message : "Malformed signature payload"
          }`,
        },
        { status: 422 }
      );
    }

    // 5. Implement and execute p7.verify() to cryptographically cross-verify signature hash vs document bytes
    let verificationResult: {
      isValid: boolean;
      signerCert: forge.pki.Certificate;
      signingTime: Date | null;
    };

    // Attach p7.verify method directly to p7 instance
    (p7 as unknown as { verify: () => boolean }).verify = function (): boolean {
      verificationResult = verifyDocumentAndSignature(p7, signedDocumentBytes);
      return verificationResult.isValid;
    };

    const verified = (p7 as unknown as { verify: () => boolean }).verify();
    const { signerCert, signingTime } = verificationResult!;
    const signerName = extractSignerName(signerCert);

    if (!verified) {
      return NextResponse.json(
        {
          verified: false,
          chainTrusted: false,
          signerName,
          signingTime: signingTime ? signingTime.toISOString() : null,
          error: "Signature verification failed: document content has been altered or signature is invalid.",
        },
        { status: 200 }
      );
    }

    // 6. Extract signer certificate chain from PKCS#7 packet and validate using forge.pki.verifyCertificateChain
    let chainTrusted = false;
    let chainError: string | null = null;

    try {
      // Build certificate chain: start with leaf signer cert followed by intermediate CAs
      const intermediateCerts = (p7.certificates || []).filter(
        (c) => c.serialNumber.toLowerCase() !== signerCert.serialNumber.toLowerCase()
      );
      const certificateChain = [signerCert, ...intermediateCerts];

      // Validate certificate chain against loaded root CA store
      chainTrusted = forge.pki.verifyCertificateChain(caStore, certificateChain, {
        validityCheckDate: signingTime || null,
      });
    } catch (certChainError) {
      chainTrusted = false;
      chainError =
        certChainError instanceof Error
          ? certChainError.message
          : "Certificate chain validation failed against root CA.";
    }

    // 7. Return structured JSON response
    return NextResponse.json(
      {
        verified: true,
        chainTrusted,
        signerName,
        signingTime: signingTime ? signingTime.toISOString() : null,
        error: chainError,
      },
      { status: 200 }
    );
  } catch (unexpectedError) {
    return NextResponse.json(
      {
        verified: false,
        chainTrusted: false,
        signerName: "",
        signingTime: null,
        error:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : "Internal server error occurred while verifying PDF signature.",
      },
      { status: 500 }
    );
  }
}
