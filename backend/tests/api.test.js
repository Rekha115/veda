const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Isolate all API writes from the real project data.
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "verifyai-api-"));
process.env.VERIFYAI_DATA_DIR = dataDir;
process.env.VERIFYAI_UPLOAD_DIR = path.join(dataDir, "uploads");

const app = require("../server");
const store = require("../data/store");
const { shutdownOcr } = require("../services/extract");
const { writePdf } = require("./helpers/pdf");
const { fixture, ocrAvailable, CACHE_FILE } = require("./helpers/ocr");

let server;
let base;
let instituteToken;
let adminToken;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  const institute = await login("institute", "demo123");
  assert.equal(institute.status, 200);
  instituteToken = institute.data.token;

  const admin = await login("admin", "demo123");
  assert.equal(admin.status, 200);
  adminToken = admin.data.token;
});

after(async () => {
  await shutdownOcr();
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

async function login(username, password) {
  return request("/api/login", {
    method: "POST",
    body: { username, password },
  });
}

async function request(pathname, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${pathname}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function uploadForm(buffer, filename, type, declaredType = "previous_eoa") {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type }), filename);
  form.append("declaredType", declaredType);
  return form;
}

function samplePdf() {
  return writePdf(fs.mkdtempSync(path.join(dataDir, "pdf-")), "eoa.pdf", [
    "GOVERNMENT OF INDIA",
    "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
    "Extension of Approval Letter",
    "Application No: AICTE/EOA/2026/12345",
    "Name of the Institution: Bharat Institute of Technology",
    "Academic Year: 2026-27",
    "Approval Status: Approved",
    "This approval is valid up to 31 March 2027",
    "Faculty sanctioned: 42",
    "CSE Intake: 120",
  ]);
}

async function createApplication(overrides = {}) {
  const result = await request("/api/applications", {
    method: "POST",
    token: instituteToken,
    body: {
      instituteName: "Bharat Institute of Technology",
      category: "EOA",
      academicYear: "2026-27",
      claimedFacultyCount: 42,
      claimedIntakeCse: 120,
      claimedIntakeEce: 60,
      claimsNba: false,
      ...overrides,
    },
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data.application;
}

function check(validation, id) {
  return validation.checks.find((item) => item.id === id);
}

test("health check is public", async () => {
  const res = await request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
});

test("unauthenticated and invalid logins are rejected", async () => {
  const unauth = await request("/api/applications");
  assert.equal(unauth.status, 401);

  const bad = await login("institute", "wrong-password");
  assert.equal(bad.status, 401);
  assert.match(bad.data.error, /Invalid demo credentials/);
});

test("meta returns the prototype disclaimer and no official integration claim", async () => {
  const res = await request("/api/meta", { token: instituteToken });
  assert.equal(res.status, 200);
  assert.match(res.data.disclaimer, /does not connect to AICTE/i);
  assert.match(res.data.institution.source, /DEMO/);
});

test("application creation validates required fields and counts", async () => {
  const blank = await request("/api/applications", {
    method: "POST",
    token: instituteToken,
    body: { instituteName: "   " },
  });
  assert.equal(blank.status, 400);
  assert.match(blank.data.error, /Institute name is required/);

  const badCategory = await request("/api/applications", {
    method: "POST",
    token: instituteToken,
    body: { instituteName: "Test", category: "UNKNOWN" },
  });
  assert.equal(badCategory.status, 400);
  assert.match(badCategory.data.error, /Unknown application category/);

  const badCount = await request("/api/applications", {
    method: "POST",
    token: instituteToken,
    body: {
      instituteName: "Test",
      category: "EOA",
      academicYear: "2026-27",
      claimedFacultyCount: 1.5,
    },
  });
  assert.equal(badCount.status, 400);
  assert.match(badCount.data.error, /whole number between 0 and 100000/);
});

test("an institution cannot read another institution's application", async () => {
  const apps = store.seedIfEmpty();
  apps.push({
    id: "APP-FOREIGN-1",
    instituteCode: "INST-OTHER",
    instituteName: "Other Institute",
    documents: [],
    audit: [],
  });
  store.save(apps);

  const res = await request("/api/applications/APP-FOREIGN-1", {
    token: instituteToken,
  });
  assert.equal(res.status, 403);

  const admin = await request("/api/applications/APP-FOREIGN-1", {
    token: adminToken,
  });
  assert.equal(admin.status, 200);
});

test("unsupported upload types are rejected", async () => {
  const application = await createApplication();
  const res = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(Buffer.from("MZ"), "malware.exe", "application/octet-stream"),
  });
  assert.equal(res.status, 400);
  assert.match(res.data.error, /Unsupported file type/);
});

test("upload, validate, review and audit trail work end to end", async () => {
  const application = await createApplication();
  const pdf = samplePdf();

  const upload = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(fs.readFileSync(pdf), "eoa.pdf", "application/pdf"),
  });
  assert.equal(upload.status, 201);
  assert.equal(upload.data.document.detectedType, "pdf");
  assert.ok(fs.existsSync(upload.data.document.path));

  const validated = await request(`/api/applications/${application.id}/validate`, {
    method: "POST",
    token: instituteToken,
  });
  assert.equal(validated.status, 200);
  const validation = validated.data.application.validation;
  assert.equal(check(validation, "FILES").status, "PASS");
  assert.equal(check(validation, "READ").status, "PASS");
  assert.equal(check(validation, "DOCS").status, "FAIL");
  assert.equal(check(validation, "AUTH").status, "REVIEW");
  assert.equal(validation.authenticity.status, "UNVERIFIED");
  assert.equal(validated.data.application.status, "validated");

  const forbidden = await request(`/api/applications/${application.id}/review`, {
    method: "POST",
    token: instituteToken,
    body: { decision: "needs_evidence", notes: "no" },
  });
  assert.equal(forbidden.status, 403);

  const invalid = await request(`/api/applications/${application.id}/review`, {
    method: "POST",
    token: adminToken,
    body: { decision: "approved", notes: "should not be accepted" },
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.data.error, /Unknown review decision/);

  const longNotes = await request(`/api/applications/${application.id}/review`, {
    method: "POST",
    token: adminToken,
    body: { decision: "needs_evidence", notes: "x".repeat(2001) },
  });
  assert.equal(longNotes.status, 400);

  const reviewed = await request(`/api/applications/${application.id}/review`, {
    method: "POST",
    token: adminToken,
    body: { decision: "needs_evidence", notes: "Upload the fire NOC." },
  });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.data.application.status, "review_needs_evidence");
  assert.equal(reviewed.data.application.review.reviewer, "admin");
  assert.equal(reviewed.data.application.review.notes, "Upload the fire NOC.");

  const fetched = await request(`/api/applications/${application.id}`, {
    token: instituteToken,
  });
  assert.equal(fetched.status, 200);
  const actions = fetched.data.application.audit.map((entry) => entry.action);
  assert.ok(actions.includes("Created application"));
  assert.match(actions.join(" | "), /Uploaded eoa\.pdf/);
  assert.match(actions.join(" | "), /Ran document checks/);
  assert.match(actions.join(" | "), /Admin review: needs_evidence/);
  assert.equal(fetched.data.application.review.notes, "Upload the fire NOC.");
});

test("a corrupt PDF returns a failed check, not a 500", async () => {
  const application = await createApplication();
  const upload = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(
      Buffer.from("%PDF-1.4\nthis is not a valid pdf"),
      "corrupt.pdf",
      "application/pdf"
    ),
  });
  assert.equal(upload.status, 201);

  const validated = await request(`/api/applications/${application.id}/validate`, {
    method: "POST",
    token: instituteToken,
  });
  assert.equal(validated.status, 200);
  const validation = validated.data.application.validation;
  assert.equal(validation.extracted.documents[0].method, "failed");
  assert.equal(check(validation, "READ").status, "FAIL");
  assert.equal(validation.overall, "FAIL");
});

test("a file deleted after upload is reported safely", async () => {
  const application = await createApplication();
  const upload = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(fs.readFileSync(samplePdf()), "gone.pdf", "application/pdf"),
  });
  assert.equal(upload.status, 201);
  fs.unlinkSync(upload.data.document.path);

  const validated = await request(`/api/applications/${application.id}/validate`, {
    method: "POST",
    token: instituteToken,
  });
  assert.equal(validated.status, 200);
  const files = check(validated.data.application.validation, "FILES");
  assert.equal(files.status, "FAIL");
  assert.match(files.evidence, /file is missing on disk/);
});

test("uploads over 8 MB are rejected", async () => {
  const application = await createApplication();
  const res = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(
      Buffer.alloc(8 * 1024 * 1024 + 1, 0x25),
      "too-big.pdf",
      "application/pdf"
    ),
  });
  assert.equal(res.status, 400);
  assert.match(res.data.error, /8 MB/);
});

test("malformed JSON returns 400", async () => {
  const res = await fetch(`${base}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instituteToken}`,
    },
    body: '{"instituteName":',
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /valid JSON/);
});

test("logout revokes the token", async () => {
  const session = await login("institute", "demo123");
  assert.equal(session.status, 200);
  const token = session.data.token;

  const logout = await request("/api/logout", { method: "POST", token });
  assert.equal(logout.status, 200);

  const me = await request("/api/me", { token });
  assert.equal(me.status, 401);
});

test("a scanned PDF is OCR'd through the API", async (t) => {
  if (!ocrAvailable()) {
    t.skip(`OCR language data not cached at ${CACHE_FILE}`);
    return;
  }

  const application = await createApplication();
  const upload = await request(`/api/applications/${application.id}/documents`, {
    method: "POST",
    token: instituteToken,
    form: uploadForm(
      fs.readFileSync(fixture("sample-scanned.pdf")),
      "scanned-eoa.pdf",
      "application/pdf"
    ),
  });
  assert.equal(upload.status, 201);
  assert.equal(upload.data.document.detectedType, "pdf");

  const validated = await request(`/api/applications/${application.id}/validate`, {
    method: "POST",
    token: instituteToken,
  });
  assert.equal(validated.status, 200);
  const validation = validated.data.application.validation;
  assert.equal(validation.extracted.documents[0].method, "pdf-ocr");
  assert.equal(typeof validation.extracted.documents[0].ocrConfidence, "number");
  assert.ok(validation.extracted.documents[0].characters > 0);
  assert.equal(validation.authenticity.status, "UNVERIFIED");
});
