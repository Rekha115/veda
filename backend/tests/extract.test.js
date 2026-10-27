const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  analyzeDocument,
  sniffFileType,
  isSupportedFile,
  shutdownOcr,
} = require("../services/extract");
const { writePdf } = require("./helpers/pdf");
const { fixture, ocrAvailable, CACHE_FILE } = require("./helpers/ocr");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "verifyai-extract-"));

after(async () => {
  await shutdownOcr();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function write(name, buffer) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, buffer);
  return file;
}

function doc(file, declaredType = "previous_eoa") {
  return {
    id: path.basename(file),
    path: file,
    declaredType,
    originalName: path.basename(file),
    mimeType: file.endsWith(".pdf") ? "application/pdf" : "image/png",
    size: fs.statSync(file).size,
  };
}

test("sniffFileType uses magic bytes, not the file extension", () => {
  const files = {
    "a.pdf": Buffer.from("%PDF-1.7\n"),
    "a.png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    "a.jpg": Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    "a.webp": Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.alloc(4),
      Buffer.from("WEBP"),
    ]),
    "a.tiff": Buffer.from([0x49, 0x49, 0x2a, 0x00]),
    "a.exe": Buffer.from("MZ not a document"),
  };

  for (const [name, buffer] of Object.entries(files)) {
    const expected = {
      "a.pdf": "pdf",
      "a.png": "png",
      "a.jpg": "jpeg",
      "a.webp": "webp",
      "a.tiff": "tiff",
      "a.exe": "unknown",
    }[name];
    assert.equal(sniffFileType(write(name, buffer)), expected, name);
  }
});

test("extension and MIME allow-lists both apply", () => {
  assert.deepEqual(
    isSupportedFile({ originalname: "scan.pdf", mimetype: "application/pdf" }),
    { extensionAllowed: true, mimeAllowed: true }
  );
  assert.deepEqual(
    isSupportedFile({ originalname: "scan.exe", mimetype: "application/pdf" }),
    { extensionAllowed: false, mimeAllowed: true }
  );
  assert.deepEqual(
    isSupportedFile({ originalname: "scan.pdf", mimetype: "text/html" }),
    { extensionAllowed: true, mimeAllowed: false }
  );
});

test("a missing file fails safely", async () => {
  const analysis = await analyzeDocument({
    path: path.join(tempDir, "missing.pdf"),
    declaredType: "previous_eoa",
  });

  assert.equal(analysis.method, "failed");
  assert.match(analysis.notes.join(" "), /missing on disk/i);
});

test("unknown content is reported as unsupported", async () => {
  const file = write("fake.pdf", Buffer.from("not a real pdf"));
  const analysis = await analyzeDocument(doc(file));

  assert.equal(analysis.fileType, "unknown");
  assert.equal(analysis.method, "unsupported");
});

test("a text PDF is read without OCR and fields are extracted", async () => {
  const file = writePdf(tempDir, "text.pdf", [
    "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
    "Application No: AICTE/EOA/2026/12345",
    "Name of the Institution: Bharat Institute of Technology",
    "Academic Year: 2026-27",
    "This approval is valid up to 31 March 2027",
    "Faculty sanctioned: 42",
    "CSE Intake: 120",
  ]);
  const analysis = await analyzeDocument(doc(file));

  assert.equal(analysis.method, "pdf-text");
  assert.ok(analysis.chars > 120);
  assert.equal(
    analysis.fields.institutionName.value,
    "Bharat Institute of Technology"
  );
  assert.equal(analysis.fields.applicationNumber.value, "AICTE/EOA/2026/12345");
  assert.equal(analysis.fields.expiryDate.iso, "2027-03-31");
});

test("a corrupt PDF fails without throwing", async () => {
  const file = write("corrupt.pdf", Buffer.from("%PDF-1.4\nnot actually a pdf"));
  const analysis = await analyzeDocument(doc(file));

  assert.equal(analysis.method, "failed");
  assert.match(analysis.notes.join(" "), /Processing failed/);
});

test("a scanned PDF is OCR'd", async (t) => {
  if (!ocrAvailable()) {
    t.skip(`OCR language data not cached at ${CACHE_FILE}`);
    return;
  }
  const file = fixture("sample-scanned.pdf");
  const analysis = await analyzeDocument(doc(file));

  assert.equal(analysis.method, "pdf-ocr");
  assert.ok(analysis.chars > 0);
  assert.equal(typeof analysis.confidence, "number");
  assert.match(analysis.notes.join(" "), /scanned PDF/i);
});

test("an image is OCR'd", async (t) => {
  if (!ocrAvailable()) {
    t.skip(`OCR language data not cached at ${CACHE_FILE}`);
    return;
  }
  const file = fixture("sample-scan.png");
  const analysis = await analyzeDocument({
    ...doc(file),
    mimeType: "image/png",
  });

  assert.equal(analysis.method, "image-ocr");
  assert.ok(analysis.chars > 0);
  assert.equal(typeof analysis.confidence, "number");
});
