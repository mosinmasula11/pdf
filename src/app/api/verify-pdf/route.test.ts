import { describe, expect, it } from "vitest";
import { POST } from "./route";
import forge from "node-forge";

describe("POST /api/verify-pdf", () => {
  it("returns 400 when no PDF file or stream is provided", async () => {
    const request = new Request("http://localhost:3000/api/verify-pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.chainTrusted).toBe(false);
    expect(data.error).toContain("Empty or missing PDF stream");
  });

  it("returns 400 when file stream is not a valid PDF header", async () => {
    const request = new Request("http://localhost:3000/api/verify-pdf", {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: Buffer.from("NOT_A_VALID_PDF_HEADER_12345"),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.error).toContain("Invalid PDF format");
  });

  it("returns 422 when PDF has no digital signature or /ByteRange", async () => {
    const fakePdf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    );

    const request = new Request("http://localhost:3000/api/verify-pdf", {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: fakePdf,
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.verified).toBe(false);
    expect(data.error).toContain("No digital signature or /ByteRange dictionary found");
  });

  it("successfully parses, verifies, and extracts signer details from a signed PDF structure", async () => {
    // 1. Generate an RSA Keypair and Signer Certificate with node-forge
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "123456789";
    cert.validity.notBefore = new Date("2024-01-01");
    cert.validity.notAfter = new Date("2034-01-01");

    const attrs = [
      { name: "commonName", value: "DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 03" },
      { name: "organizationName", value: "Unique Identification Authority of India" },
      { name: "countryName", value: "IN" },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // 2. We construct a PDF with fixed placeholder for signature hex and ByteRange:
    // Format:
    // [part1Prefix] + [ByteRangeString] + [part1Suffix] + [<hex...>] + [part2]
    // part1 = part1Prefix + ByteRangeString + part1Suffix
    const part1Prefix = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Sig /ByteRange [ ");
    // ByteRange format: "0 000000 000000 000000 ]\n/Contents "
    const placeholderRange = Buffer.from("0 000000 000000 000000 ]\n/Contents ");
    const part2 = Buffer.from("\n>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    const length1 = part1Prefix.length + placeholderRange.length;
    // We create a dummy detached signature to get exact hex length
    const dummyP7 = forge.pkcs7.createSignedData();
    dummyP7.content = forge.util.createBuffer("sample");
    dummyP7.addCertificate(cert);
    dummyP7.addSigner({
      key: keys.privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: "2024-06-01T00:00:00Z" },
      ],
    });
    dummyP7.sign({ detached: true });
    const dummyDer = Buffer.from(forge.asn1.toDer(dummyP7.toAsn1()).getBytes(), "binary");
    const hexLen = dummyDer.length * 2;

    const offset2 = length1 + 1 + hexLen + 1; // +1 for '<' and +1 for '>'
    const length2 = part2.length;

    // Pad numbers to match placeholder length
    const l1Str = length1.toString().padStart(6, "0");
    const o2Str = offset2.toString().padStart(6, "0");
    const l2Str = length2.toString().padStart(6, "0");
    const actualRangeString = Buffer.from(`0 ${l1Str} ${o2Str} ${l2Str} ]\n/Contents `);

    expect(actualRangeString.length).toBe(placeholderRange.length);

    const part1 = Buffer.concat([part1Prefix, actualRangeString]);
    expect(part1.length).toBe(length1);

    // Document data covered by signature
    const docDataToSign = Buffer.concat([part1, part2]);

    // Generate real signature over docDataToSign
    const realP7 = forge.pkcs7.createSignedData();
    realP7.content = forge.util.createBuffer(docDataToSign.toString("binary"));
    realP7.addCertificate(cert);
    realP7.addSigner({
      key: keys.privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: "2024-06-01T00:00:00Z" },
      ],
    });
    realP7.sign({ detached: true });

    const realDer = Buffer.from(forge.asn1.toDer(realP7.toAsn1()).getBytes(), "binary");
    const realHex = realDer.toString("hex");
    expect(realHex.length).toBe(hexLen);

    const assembledPdf = Buffer.concat([
      part1,
      Buffer.from("<" + realHex + ">"),
      part2,
    ]);

    expect(assembledPdf.length).toBe(offset2 + length2);

    const req = new Request("http://localhost:3000/api/verify-pdf", {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: assembledPdf,
    });

    const res = await POST(req);
    const json = await res.json();
    if (res.status !== 200) console.error("ERROR_JSON:", json);

    expect(res.status).toBe(200);
    expect(json.verified).toBe(true);
    expect(json.signerName).toBe("DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 03");
  });

  it("detects tampered document when byte content is modified after signing", async () => {
    // 1. Generate keys & cert
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "987654321";
    cert.validity.notBefore = new Date("2024-01-01");
    cert.validity.notAfter = new Date("2034-01-01");

    const attrs = [{ name: "commonName", value: "Aadhaar eSign" }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // 2. Setup PDF template with fixed-width ByteRange
    const part1Prefix = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Sig /ByteRange [ ");
    const placeholderRange = Buffer.from("0 000000 000000 000000 ]\n/Contents ");
    const part2 = Buffer.from("\n>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    const length1 = part1Prefix.length + placeholderRange.length;

    const dummyP7 = forge.pkcs7.createSignedData();
    dummyP7.content = forge.util.createBuffer("sample");
    dummyP7.addCertificate(cert);
    dummyP7.addSigner({
      key: keys.privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
      ],
    });
    dummyP7.sign({ detached: true });
    const dummyDer = Buffer.from(forge.asn1.toDer(dummyP7.toAsn1()).getBytes(), "binary");
    const hexLen = dummyDer.length * 2;

    const offset2 = length1 + 1 + hexLen + 1;
    const length2 = part2.length;

    const l1Str = length1.toString().padStart(6, "0");
    const o2Str = offset2.toString().padStart(6, "0");
    const l2Str = length2.toString().padStart(6, "0");
    const actualRangeString = Buffer.from(`0 ${l1Str} ${o2Str} ${l2Str} ]\n/Contents `);

    const part1 = Buffer.concat([part1Prefix, actualRangeString]);
    const docDataToSign = Buffer.concat([part1, part2]);

    const realP7 = forge.pkcs7.createSignedData();
    realP7.content = forge.util.createBuffer(docDataToSign.toString("binary"));
    realP7.addCertificate(cert);
    realP7.addSigner({
      key: keys.privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
      ],
    });
    realP7.sign({ detached: true });

    const realHex = Buffer.from(
      forge.asn1.toDer(realP7.toAsn1()).getBytes(),
      "binary"
    ).toString("hex");

    // Tamper part2 by changing 1 byte
    const tamperedPart2 = Buffer.from(part2);
    tamperedPart2[tamperedPart2.length - 2] = 0x58; // modify trailer byte

    const tamperedPdf = Buffer.concat([
      part1,
      Buffer.from("<" + realHex + ">"),
      tamperedPart2,
    ]);

    const req = new Request("http://localhost:3000/api/verify-pdf", {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: tamperedPdf,
    });

    const res = await POST(req);
    const json = await res.json();
    if (res.status !== 200) console.error("ERROR_JSON:", json);

    expect(res.status).toBe(200);
    expect(json.verified).toBe(false);
    expect(json.error).toContain("altered or signature is invalid");
  });
});
