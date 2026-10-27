# VerifyAI (SIH 26261 demo)

Working student prototype for **AI-powered application validation, document authentication and regulatory compliance verification**.

This is **not** connected to the AICTE portal and does **not** verify genuine certificates. Institution records are labelled demo data.

## Run (two terminals)

You need Node.js installed. Use **Node.js 22.13 or newer** (tested with Node 22.19): the PDF page rasteriser (`pdf-to-img`) requires it.

**Terminal 1 — backend**

```powershell
cd "C:\Users\Ishank Kaushik\VerifyAI\backend"
npm install
npm start
```

API: http://localhost:5000

**Terminal 2 — frontend**

```powershell
cd "C:\Users\Ishank Kaushik\VerifyAI\frontend"
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Demo logins

| Role | Username | Password |
| --- | --- | --- |
| Institution | `institute` | `demo123` |
| Admin reviewer | `admin` | `demo123` |

Suggested path: landing → sign in as `institute` → New application → upload documents → Run document checks → sign out → sign in as `admin` → Admin review.

## Tests

```powershell
cd backend
npm test
```

The suite covers validation rules, file sniffing, PDF/OCR extraction, API auth/upload/review flows, audit entries, safe failure handling and session expiry. It uses temporary data/upload directories, so it does not modify the real `applications.json` or uploads. OCR tests are skipped with a message if `backend/data/ocr-cache/eng.traineddata` is missing.

There are no frontend unit tests; the available frontend check is `npm run build` in `frontend/`.


## Document processing and checks

Uploads are processed locally. No AI API keys, cloud OCR, or external credentials are used.

| Input | How it is read |
| --- | --- |
| Text-based PDF | Embedded text layer via `pdfjs-dist` |
| Scanned PDF (little/no text layer) | Pages rendered to images with `pdf-to-img`, then OCR |
| PNG / JPG / WEBP / TIFF | OCR directly |

OCR uses `tesseract.js` (WebAssembly), so no system Tesseract install is needed. It recognises English text (`eng`) and runs on CPU.

**File policy:** PDF, PNG, JPG/JPEG, WEBP, TIF/TIFF only; maximum 8 MB per file. Type is checked by extension, declared MIME type, and magic bytes. Unsupported or oversized files are rejected with a 400 and the stored file is deleted.

**First run:** tesseract.js downloads `eng.traineddata` (~5 MB) once. It is cached at `backend/data/ocr-cache/` (git-ignored), so later runs work offline. If the machine has no internet on first use, download that file manually into `backend/data/ocr-cache/`.

**PDF page rendering:** `pdf-to-img` uses the optional `@napi-rs/canvas` package, installed automatically with the backend dependencies. Re-run `npm install` in `backend/` if it is missing.

### What the report contains

Each check returns `PASS`, `REVIEW`, or `FAIL` with a reason and the extracted evidence:

| Check | Fails when |
| --- | --- |
| Uploaded files | No files, empty file, over 8 MB, or unsupported content |
| Text extraction / OCR | A document yields no usable text |
| Required documents | A required document type for the category is missing |
| Institution name | Detected name contradicts the demo register |
| Application / reference number | Missing or not a plausible reference (REVIEW) |
| Date formats | A detected date is not a valid calendar date |
| Approval validity | Detected validity date has already passed |
| Date ordering | Issue date is after the validity date |
| Approval / extension status | Document says rejected, cancelled, or expired |
| Claims vs records | Form values, extracted values, and demo register disagree (REVIEW) |
| Duplicate files | The same file content is uploaded twice (REVIEW) |
| Official authenticity | Always `REVIEW` — authenticity is `UNVERIFIED` |

The overall result ignores the authenticity row: `FAIL` if any blocking check fails, otherwise `REVIEW` if anything needs a human, otherwise `PASS`.

**Important limitation:** VerifyAI is not connected to AICTE, NAD/DigiLocker, or any issuing authority. Passing OCR and field checks only means the document *says* the expected things. It never proves a document is genuine, and a `PASS` is not an approval. Authenticity is always shown as `UNVERIFIED` and the report recommends manual verification against official records.

Extracted text is cached on the application record (`analysis`, keyed by engine version), so re-running the checks after the first pass is fast. Changing or re-uploading a document triggers fresh processing.

