// Local document processing: PDF text extraction, OCR for scans/images and
// conservative field extraction. No external AI services or credentials.

const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const { extractFields, guessKindFromText } = require("./fields");

const ENGINE_VERSION = "verifyai-ocr-v1";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_PDF_TEXT_PAGES = 10;
const MAX_OCR_PAGES = 4;
const MIN_PDF_TEXT_CHARS = 120;
const MAX_STORED_PREVIEW = 2000;

const OCR_CACHE_DIR = path.join(__dirname, "..", "data", "ocr-cache");
fs.mkdirSync(OCR_CACHE_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
  "application/octet-stream",
]);

function sniffFileType(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(16);
    const read = fs.readSync(fd, buffer, 0, 16, 0);

    if (read >= 4 && buffer.subarray(0, 4).toString("latin1") === "%PDF") {
      return "pdf";
    }
    if (
      read >= 8 &&
      buffer[0] === 0x89 &&
      buffer.subarray(1, 4).toString("latin1") === "PNG"
    ) {
      return "png";
    }
    if (read >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "jpeg";
    }
    if (
      read >= 12 &&
      buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP"
    ) {
      return "webp";
    }
    if (
      read >= 4 &&
      (buffer.subarray(0, 4).toString("latin1") === "II*\u0000" ||
        buffer.subarray(0, 4).toString("latin1") === "MM\u0000*")
    ) {
      return "tiff";
    }
    return "unknown";
  } catch {
    return "unknown";
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// --- OCR (tesseract.js, WASM based; no system tesseract install needed) ---

let workerPromise = null;
let ocrQueue = Promise.resolve();

async function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, OEM } = require("tesseract.js");
      return createWorker("eng", OEM.LSTM_ONLY, {
        cachePath: OCR_CACHE_DIR,
        logger: () => {},
      });
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function recognizeImage(buffer) {
  const run = async () => {
    const worker = await getOcrWorker();
    const { data } = await worker.recognize(buffer);
    return {
      text: data.text || "",
      confidence:
        typeof data.confidence === "number" ? Math.round(data.confidence) : null,
    };
  };
  // tesseract runs in a child process; keep calls sequential and predictable.
  const result = ocrQueue.then(run, run);
  ocrQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function shutdownOcr() {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    // ignore shutdown errors
  } finally {
    workerPromise = null;
  }
}

// --- PDF text ---

function pdfjsAssetPath() {
  const requireFromHere = createRequire(__filename);
  const root = path.dirname(requireFromHere.resolve("pdfjs-dist/package.json"));
  // pdfjs requires forward-slash URLs, including a trailing slash.
  const posixRoot = root.replace(/\\/g, "/");
  return {
    standardFontDataUrl: `${posixRoot}/standard_fonts/`,
    cMapUrl: `${posixRoot}/cmaps/`,
  };
}

async function pdfText(filePath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const assets = pdfjsAssetPath();
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({
    data,
    ...assets,
    cMapPacked: true,
    isEvalSupported: false,
    verbosity: 0,
  }).promise;

  const totalPages = doc.numPages;
  const pagesToRead = Math.min(totalPages, MAX_PDF_TEXT_PAGES);
  const chunks = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      let lastY = null;
      const parts = [];
      for (const item of content.items) {
        const y = Array.isArray(item.transform) ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          parts.push("\n");
        } else if (parts.length && !/\s$/.test(parts[parts.length - 1])) {
          parts.push(" ");
        }
        parts.push(item.str || "");
        if (item.hasEOL) parts.push("\n");
        if (y !== null) lastY = y;
      }
      chunks.push(parts.join("").replace(/[ \t]+/g, " "));
    }
  } finally {
    await doc.loadingTask.destroy();
  }

  return { text: chunks.join("\n"), pagesRead: pagesToRead, totalPages };
}

async function pdfOcr(filePath) {
  const { pdf } = await import("pdf-to-img");
  const document = await pdf(filePath, {
    scale: 2,
    docInitParams: { verbosity: 0 },
  });

  const totalPages = document.length;
  const pagesToRead = Math.min(totalPages, MAX_OCR_PAGES);
  const texts = [];
  const confidences = [];

  try {
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const image = await document.getPage(pageNumber);
      const result = await recognizeImage(image);
      texts.push(result.text);
      if (result.confidence !== null) confidences.push(result.confidence);
    }
  } finally {
    await document.destroy();
  }

  return {
    text: texts.join("\n"),
    pagesRead: pagesToRead,
    totalPages,
    confidence: confidences.length
      ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length)
      : null,
  };
}

// --- main entry point ---

function emptyAnalysis() {
  return {
    engineVersion: ENGINE_VERSION,
    fileType: "unknown",
    method: "unsupported",
    pagesRead: 0,
    totalPages: 0,
    chars: 0,
    confidence: null,
    durationMs: 0,
    notes: [],
    textPreview: "",
    fields: null,
  };
}

async function analyzeDocument(doc) {
  const started = Date.now();
  const analysis = emptyAnalysis();

  try {
    if (!doc.path || !fs.existsSync(doc.path)) {
      analysis.method = "failed";
      analysis.notes.push("File is missing on disk.");
      return analysis;
    }

    analysis.fileType = sniffFileType(doc.path);
    if (analysis.fileType === "unknown") {
      analysis.method = "unsupported";
      analysis.notes.push("File content is not a supported PDF or image.");
      return analysis;
    }

    let text = "";

    if (analysis.fileType === "pdf") {
      const embedded = await pdfText(doc.path);
      analysis.pagesRead = embedded.pagesRead;
      analysis.totalPages = embedded.totalPages;

      const embeddedChars = embedded.text.replace(/\s+/g, "").length;
      if (embeddedChars >= MIN_PDF_TEXT_CHARS) {
        analysis.method = "pdf-text";
        text = embedded.text;
      } else {
        analysis.notes.push(
          embeddedChars
            ? "Little embedded text found; OCR used for the scanned pages."
            : "No embedded text found; processed as a scanned PDF with OCR."
        );
        try {
          const ocr = await pdfOcr(doc.path);
          analysis.method = embeddedChars ? "pdf-text+ocr" : "pdf-ocr";
          analysis.pagesRead = Math.min(ocr.pagesRead, embedded.pagesRead || ocr.pagesRead);
          analysis.totalPages = ocr.totalPages;
          analysis.confidence = ocr.confidence;
          text = `${embedded.text}\n${ocr.text}`;
        } catch (error) {
          analysis.notes.push(`PDF OCR failed: ${error.message}`);
          text = embedded.text;
          if (!embeddedChars) {
            analysis.method = "failed";
          }
        }
      }
    } else {
      const result = await recognizeImage(fs.readFileSync(doc.path));
      analysis.method = "image-ocr";
      analysis.pagesRead = 1;
      analysis.totalPages = 1;
      analysis.confidence = result.confidence;
      text = result.text;
    }

    const clean = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
    analysis.chars = clean.replace(/\s+/g, "").length;
    analysis.textPreview = clean.slice(0, MAX_STORED_PREVIEW);

    const fields = extractFields(clean);
    fields.documentKindGuess =
      doc.declaredType && doc.declaredType !== "other"
        ? doc.declaredType
        : guessKindFromText(clean);
    analysis.fields = fields;

    if (analysis.method === "failed") {
      analysis.notes.push("No usable text could be extracted from this file.");
    }
  } catch (error) {
    analysis.method = "failed";
    analysis.notes.push(`Processing failed: ${error.message}`);
  } finally {
    analysis.durationMs = Date.now() - started;
  }

  return analysis;
}

function isSupportedFile(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  return {
    extensionAllowed: ALLOWED_EXTENSIONS.has(extension),
    mimeAllowed: ALLOWED_MIME_TYPES.has((file.mimetype || "").toLowerCase()),
  };
}

module.exports = {
  ENGINE_VERSION,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  OCR_CACHE_DIR,
  analyzeDocument,
  sniffFileType,
  isSupportedFile,
  shutdownOcr,
};
