const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { USERS, INSTITUTIONS, REQUIRED_DOCUMENTS } = require("./data/demo");
const store = require("./data/store");
const { validateApplication } = require("./services/validate");
const {
  MAX_FILE_SIZE,
  isSupportedFile,
  sniffFileType,
  shutdownOcr,
} = require("./services/extract");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 12 * 60 * 60 * 1000;
const REVIEW_DECISIONS = new Set([
  "pending",
  "needs_evidence",
  "inspect",
  "cleared_for_officer",
]);
const uploadDir =
  process.env.VERIFYAI_UPLOAD_DIR || path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const { extensionAllowed, mimeAllowed } = isSupportedFile(file);
    if (!extensionAllowed) {
      return cb(
        new Error(
          "Unsupported file type. Upload a PDF, PNG, JPG, WEBP, or TIFF file."
        )
      );
    }
    if (!mimeAllowed) {
      return cb(new Error("Unsupported file content type. Upload a PDF or image file."));
    }
    cb(null, true);
  },
});

// multer reports its errors through the callback, not Express; turn them into
// clear 400 responses instead of a generic 500.
function receiveUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is larger than the 8 MB limit." });
    }
    return res.status(400).json({ error: error.message || "Upload failed." });
  });
}

const sessions = new Map();

function publicUser(user) {
  return {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    instituteCode: user.instituteCode,
  };
}

function requestToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function auth(req, res, next) {
  const token = requestToken(req);
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: "Sign in required" });
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
  req.user = session.user;
  req.token = token;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}

function canAccessApplication(user, application) {
  if (user.role === "admin") return true;
  return application.instituteCode === user.instituteCode;
}

const APP_CATEGORIES = new Set(Object.keys(REQUIRED_DOCUMENTS));

function parseCount(value, label) {
  if (value === undefined || value === null || value === "") {
    return { value: 0, error: null };
  }
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    !Number.isInteger(number) ||
    number < 0 ||
    number > 100000
  ) {
    return {
      value: 0,
      error: `${label} must be a whole number between 0 and 100000.`,
    };
  }
  return { value: number, error: null };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "VerifyAI demo API" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid demo credentials" });
  }
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    user: publicUser(user),
    expiresAt: now + SESSION_TTL_MS,
  });
  res.json({ token, user: publicUser(user) });
});

app.post("/api/logout", auth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/meta", auth, (req, res) => {
  const code = req.user.instituteCode || "INST-2024-001";
  res.json({
    disclaimer:
      "VerifyAI is a student prototype for SIH 26261. It does not connect to AICTE systems and does not authenticate genuine certificates.",
    institution: INSTITUTIONS[code],
    requiredDocuments: REQUIRED_DOCUMENTS,
    demoLogins: [
      { username: "institute", password: "demo123", role: "institution" },
      { username: "admin", password: "demo123", role: "admin" },
    ],
  });
});

app.get("/api/applications", auth, (req, res) => {
  let apps = store.seedIfEmpty();
  if (req.user.role === "institution") {
    apps = apps.filter((a) => a.instituteCode === req.user.instituteCode);
  }
  res.json({ applications: apps });
});

app.post("/api/applications", auth, (req, res) => {
  const apps = store.seedIfEmpty();
  const body = req.body || {};
  const instituteCode =
    req.user.role === "institution"
      ? req.user.instituteCode
      : body.instituteCode || "INST-2024-001";
  const record = INSTITUTIONS[instituteCode];
  // Missing fields fall back to demo defaults, but explicit blanks are rejected
  // so an empty form gets a clear error instead of silently saving defaults.
  const supplied = (key) =>
    Object.prototype.hasOwnProperty.call(body, key);
  const nameValue = supplied("instituteName")
    ? body.instituteName
    : record?.name;
  const instituteName =
    typeof nameValue === "string" ? nameValue.trim().slice(0, 200) : "";
  if (!instituteName) {
    return res.status(400).json({ error: "Institute name is required." });
  }
  const category = supplied("category") ? body.category : "EOA";
  if (!APP_CATEGORIES.has(category)) {
    return res.status(400).json({
      error: `Unknown application category. Use one of: ${[
        ...APP_CATEGORIES,
      ].join(", ")}.`,
    });
  }
  const yearValue = supplied("academicYear")
    ? body.academicYear
    : "2026-27";
  const academicYear =
    typeof yearValue === "string" ? yearValue.trim().slice(0, 20) : "";
  if (!academicYear) {
    return res.status(400).json({ error: "Academic year is required." });
  }
  const counts = [
    parseCount(body.claimedFacultyCount, "Claimed faculty count"),
    parseCount(body.claimedIntakeCse, "Claimed CSE intake"),
    parseCount(body.claimedIntakeEce, "Claimed ECE intake"),
  ];
  const countError = counts.find((count) => count.error);
  if (countError) {
    return res.status(400).json({ error: countError.error });
  }
  const [claimedFacultyCount, claimedIntakeCse, claimedIntakeEce] = counts.map(
    (count) => count.value
  );
  const application = {
    id: `APP-${Date.now()}`,
    instituteCode,
    instituteName,
    category,
    academicYear,
    contactName:
      typeof body.contactName === "string" ? body.contactName.trim().slice(0, 200) : "",
    contactEmail:
      typeof body.contactEmail === "string"
        ? body.contactEmail.trim().slice(0, 200)
        : "",
    claimedFacultyCount,
    claimedIntakeCse,
    claimedIntakeEce,
    claimsNba: body.claimsNba === true || body.claimsNba === "true",
    status: "draft",
    createdAt: new Date().toISOString(),
    documents: [],
    validation: null,
    review: {
      decision: "pending",
      notes: "",
      reviewer: null,
      reviewedAt: null,
    },
    audit: [
      {
        at: new Date().toISOString(),
        actor: req.user.username,
        action: "Created application",
      },
    ],
  };
  apps.unshift(application);
  store.save(apps);
  res.status(201).json({ application });
});

app.get("/api/applications/:id", auth, (req, res) => {
  const apps = store.seedIfEmpty();
  const application = apps.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Not found" });
  if (!canAccessApplication(req.user, application)) {
    return res.status(403).json({ error: "Not allowed" });
  }
  res.json({ application });
});

function discardUpload(file) {
  if (!file || !file.path) return;
  try {
    fs.unlinkSync(file.path);
  } catch {
    // best effort: an orphaned upload is worse than a failed delete log
  }
}

app.post(
  "/api/applications/:id/documents",
  auth,
  receiveUpload,
  (req, res) => {
    const apps = store.seedIfEmpty();
    const application = apps.find((a) => a.id === req.params.id);
    if (!application) {
      discardUpload(req.file);
      return res.status(404).json({ error: "Not found" });
    }
    if (!canAccessApplication(req.user, application)) {
      discardUpload(req.file);
      return res.status(403).json({ error: "Not allowed" });
    }
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const detected = sniffFileType(req.file.path);
    if (detected === "unknown") {
      discardUpload(req.file);
      return res.status(400).json({
        error: "File content is not a supported PDF or image.",
      });
    }

    const doc = {
      id: `DOC-${Date.now()}`,
      declaredType: req.body.declaredType || "other",
      documentNumber: req.body.documentNumber || "",
      expiryDate: req.body.expiryDate || "",
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      detectedType: detected,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      hash: (() => {
        const hash = crypto.createHash("sha256");
        hash.update(fs.readFileSync(req.file.path));
        return hash.digest("hex");
      })(),
      analysis: null,
    };
    application.documents.push(doc);
    application.status = "documents_uploaded";
    application.audit.push({
      at: new Date().toISOString(),
      actor: req.user.username,
      action: `Uploaded ${doc.originalName} as ${doc.declaredType}`,
    });
    store.save(apps);
    res.status(201).json({ document: doc, application });
  }
);

app.post("/api/applications/:id/validate", auth, async (req, res, next) => {
  try {
    const apps = store.seedIfEmpty();
    const application = apps.find((a) => a.id === req.params.id);
    if (!application) return res.status(404).json({ error: "Not found" });
    if (!canAccessApplication(req.user, application)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    application.validation = await validateApplication(application);
    application.status = "validated";
    application.audit.push({
      at: new Date().toISOString(),
      actor: req.user.username,
      action: `Ran document checks (${application.validation.overall})`,
    });
    store.save(apps);
    res.json({ application });
  } catch (error) {
    next(error);
  }
});

app.post("/api/applications/:id/review", auth, adminOnly, (req, res) => {
  const apps = store.seedIfEmpty();
  const application = apps.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Not found" });
  const body = req.body || {};
  const decision = body.decision;
  if (!REVIEW_DECISIONS.has(decision)) {
    return res.status(400).json({
      error: `Unknown review decision. Use one of: ${[...REVIEW_DECISIONS].join(
        ", "
      )}.`,
    });
  }
  if (body.notes !== undefined && typeof body.notes !== "string") {
    return res.status(400).json({ error: "Review notes must be text." });
  }
  const notes = body.notes || "";
  if (notes.length > 2000) {
    return res
      .status(400)
      .json({ error: "Review notes must be 2000 characters or fewer." });
  }
  application.review = {
    decision,
    notes,
    reviewer: req.user.username,
    reviewedAt: new Date().toISOString(),
  };
  application.status = `review_${decision}`;
  application.audit.push({
    at: new Date().toISOString(),
    actor: req.user.username,
    action: `Admin review: ${decision}`,
  });
  store.save(apps);
  res.json({ application });
});

app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    store.seedIfEmpty();
    console.log(`VerifyAI demo API running at http://localhost:${PORT}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      shutdownOcr().finally(() => process.exit(0));
    });
  }
}

module.exports = app;
