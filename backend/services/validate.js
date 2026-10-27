const crypto = require("crypto");
const fs = require("fs");
const { REQUIRED_DOCUMENTS, INSTITUTIONS } = require("../data/demo");
const { ENGINE_VERSION, MAX_FILE_SIZE, analyzeDocument } = require("./extract");
const { squash } = require("./fields");

const PASS = "PASS";
const REVIEW = "REVIEW";
const FAIL = "FAIL";

function fileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function classifyFromName(filename) {
  const name = (filename || "").toLowerCase();
  if (name.includes("eoa") || name.includes("approval")) return "previous_eoa";
  if (name.includes("affiliat") || name.includes("university")) return "affiliation";
  if (name.includes("faculty")) return "faculty_list";
  if (name.includes("land") || name.includes("affidavit")) return "land_affidavit";
  if (name.includes("fire") || name.includes("noc")) return "fire_noc";
  if (name.includes("infra") || name.includes("photo") || name.includes("plan")) {
    return "infrastructure";
  }
  return "other";
}

function makeCheck(id, label, status, reason, evidence = "") {
  return { id, label, status, reason, evidence };
}

function docRef(entry) {
  return {
    id: entry.doc.id,
    name: entry.doc.originalName,
    declaredType: entry.doc.declaredType,
    method: entry.analysis.method,
  };
}

function matchesName(value, expected) {
  const a = squash(value);
  const b = squash(expected);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

async function ensureAnalysis(doc) {
  if (doc.analysis && doc.analysis.engineVersion === ENGINE_VERSION) {
    return doc.analysis;
  }
  const analysis = await analyzeDocument(doc);
  doc.analysis = analysis;
  return analysis;
}

function collectDates(entries) {
  const seen = new Set();
  const dates = [];
  for (const entry of entries) {
    const found = (entry.analysis.fields && entry.analysis.fields.dates) || [];
    for (const date of found) {
      const key = `${String(date.raw).toLowerCase()}|${entry.doc.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dates.push({ ...date, document: docRef(entry) });
    }
  }
  return dates;
}

function pickField(entries, fieldName, preferredKinds = []) {
  const candidates = [];
  for (const entry of entries) {
    const field = entry.analysis.fields && entry.analysis.fields[fieldName];
    if (!field) continue;
    const hasValue =
      (field.value !== undefined && field.value !== null && field.value !== "") ||
      field.raw ||
      field.iso;
    if (!hasValue) continue;
    candidates.push({ field, entry });
  }
  if (!candidates.length) return null;

  const preferred = candidates.find((candidate) =>
    preferredKinds.includes(candidate.entry.analysis.fields.documentKindGuess)
  );
  const chosen = preferred || candidates[0];
  const value =
    chosen.field.value !== undefined &&
    chosen.field.value !== null &&
    chosen.field.value !== ""
      ? chosen.field.value
      : chosen.field.iso || chosen.field.raw;

  return {
    value,
    raw: chosen.field.raw || null,
    iso: chosen.field.iso || null,
    evidence: chosen.field.evidence || "",
    document: docRef(chosen.entry),
    confidence: chosen.entry.analysis.confidence,
  };
}

function startOfToday() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function daysBetween(iso, todayMs) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - todayMs) / 86400000);
}

function buildExtracted(entries) {
  const status = pickField(entries, "approvalStatus", ["previous_eoa", "affiliation"]);
  return {
    institutionName: pickField(entries, "institutionName", ["previous_eoa", "affiliation"]),
    applicationNumber: pickField(entries, "applicationNumber", ["previous_eoa"]),
    academicYear: pickField(entries, "academicYear", ["previous_eoa"]),
    approvalStatus: status
      ? {
          ...status,
          value: status.value,
          raw: status.raw || String(status.value),
        }
      : null,
    issueDate: pickField(entries, "issueDate", ["previous_eoa"]),
    expiryDate: pickField(entries, "expiryDate", ["previous_eoa"]),
    facultyCount: pickField(entries, "facultyCount", ["faculty_list", "previous_eoa"]),
    cseIntake: pickField(entries, "cseIntake", ["previous_eoa"]),
    issuingAuthority: pickField(entries, "issuingAuthority", ["previous_eoa"]),
    dates: collectDates(entries),
    documents: entries.map(({ doc, analysis }) => ({
      id: doc.id,
      name: doc.originalName,
      declaredType: doc.declaredType,
      detectedType: analysis.fileType,
      method: analysis.method,
      pagesRead: analysis.pagesRead,
      totalPages: analysis.totalPages,
      characters: analysis.chars,
      ocrConfidence: analysis.confidence,
      durationMs: analysis.durationMs,
      notes: analysis.notes,
      textPreview: analysis.textPreview,
    })),
  };
}

async function validateApplication(app) {
  const entries = [];
  for (const doc of app.documents || []) {
    const analysis = await ensureAnalysis(doc);
    entries.push({ doc, analysis });
  }

  const record = INSTITUTIONS[app.instituteCode];
  const checklistDefinition =
    REQUIRED_DOCUMENTS[app.category] || REQUIRED_DOCUMENTS.EOA;
  const checks = [];
  const extracted = buildExtracted(entries);
  const todayMs = startOfToday();

  // 1. Files: type, size, existence.
  if (!entries.length) {
    checks.push(
      makeCheck(
        "FILES",
        "Uploaded files",
        FAIL,
        "No documents have been uploaded, so nothing can be checked.",
        "Upload at least the required documents for this category."
      )
    );
  } else {
    const fileIssues = [];
    for (const { doc, analysis } of entries) {
      if (!doc.path || !fs.existsSync(doc.path)) {
        fileIssues.push(`${doc.originalName}: file is missing on disk`);
        continue;
      }
      if (analysis.fileType === "unknown") {
        fileIssues.push(`${doc.originalName}: content is not a supported PDF or image`);
      }
      if (!doc.size) {
        fileIssues.push(`${doc.originalName}: file is empty (0 bytes)`);
      } else if (doc.size > MAX_FILE_SIZE) {
        fileIssues.push(`${doc.originalName}: exceeds the 8 MB limit`);
      }
    }
    checks.push(
      fileIssues.length
        ? makeCheck("FILES", "Uploaded files", FAIL, "Some uploaded files are not usable.", fileIssues.join("; "))
        : makeCheck(
            "FILES",
            "Uploaded files",
            PASS,
            `All ${entries.length} uploaded file(s) are supported and within the 8 MB limit.`,
            entries.map(({ doc, analysis }) => `${doc.originalName} (${analysis.fileType}, ${Math.round(doc.size / 1024)} KB)`).join("; ")
          )
    );
  }

  // 2. Readability / OCR quality.
  const unreadable = [];
  const weak = [];
  const readable = [];
  for (const { doc, analysis } of entries) {
    if (analysis.method === "failed" || analysis.method === "unsupported") {
      unreadable.push(`${doc.originalName}: ${analysis.notes[0] || "no text extracted"}`);
    } else if (analysis.chars < 40) {
      weak.push(`${doc.originalName}: only ${analysis.chars} characters recognised`);
    } else {
      readable.push(`${doc.originalName}: ${analysis.method}, ${analysis.chars} characters`);
      if (analysis.chars < 120) {
        weak.push(`${doc.originalName}: very little text (${analysis.chars} characters)`);
      }
    }
  }
  if (!entries.length) {
    checks.push(makeCheck("READ", "Text extraction / OCR", FAIL, "No files were available to read.", ""));
  } else if (unreadable.length) {
    checks.push(
      makeCheck(
        "READ",
        "Text extraction / OCR",
        FAIL,
        "One or more documents could not be read, so their content cannot be checked.",
        unreadable.join("; ")
      )
    );
  } else if (weak.length) {
    checks.push(
      makeCheck(
        "READ",
        "Text extraction / OCR",
        REVIEW,
        "Text was extracted but some documents produced very little text. Verify them manually.",
        weak.join("; ")
      )
    );
  } else {
    checks.push(
      makeCheck(
        "READ",
        "Text extraction / OCR",
        PASS,
        "Every uploaded document produced readable text.",
        readable.join("; ")
      )
    );
  }

  // 3. Required document checklist.
  const presentTypes = new Set();
  for (const { doc, analysis } of entries) {
    presentTypes.add(doc.declaredType);
    const guessed = analysis.fields
      ? analysis.fields.documentKindGuess
      : classifyFromName(doc.originalName);
    if (guessed && guessed !== "other") presentTypes.add(guessed);
  }

  const checklist = checklistDefinition.map((item) => ({
    ...item,
    status: presentTypes.has(item.type) ? "present" : "missing",
  }));
  const missing = checklist.filter((item) => item.status === "missing");

  checks.push(
    missing.length
      ? makeCheck(
          "DOCS",
          "Required documents",
          FAIL,
          `${missing.length} required document(s) for ${app.category} are missing.`,
          `Missing: ${missing.map((item) => item.label).join(", ")}`
        )
      : makeCheck(
          "DOCS",
          "Required documents",
          PASS,
          `All required documents for ${app.category} are present.`,
          checklist.map((item) => item.label).join(", ")
        )
  );

  // 4. Institution name.
  const institution = extracted.institutionName;
  if (!institution) {
    checks.push(
      makeCheck(
        "INST",
        "Institution name",
        REVIEW,
        "No institution name was detected in the uploaded documents.",
        "Confirm the institution name manually against the application form."
      )
    );
  } else {
    const evidence = `"${institution.evidence}" (${institution.document.name})`;
    if (record && matchesName(institution.value, record.name)) {
      checks.push(
        makeCheck(
          "INST",
          "Institution name",
          PASS,
          `Document institution matches the demo register: "${record.name}".`,
          evidence
        )
      );
    } else if (app.instituteName && matchesName(institution.value, app.instituteName)) {
      checks.push(
        makeCheck(
          "INST",
          "Institution name",
          REVIEW,
          `Document name matches the application but not the demo register ("${record ? record.name : "unknown"}").`,
          evidence
        )
      );
    } else {
      checks.push(
        makeCheck(
          "INST",
          "Institution name",
          FAIL,
          `Document institution "${institution.value}" does not match the demo register ("${record ? record.name : "unknown"}").`,
          evidence
        )
      );
    }
  }

  // 5. Application / reference number.
  const applicationNumber = extracted.applicationNumber;
  if (!applicationNumber) {
    checks.push(
      makeCheck(
        "REF",
        "Application / reference number",
        REVIEW,
        "No application or reference number was detected in the uploaded documents.",
        "Ask the institution for a document that shows the reference number."
      )
    );
  } else {
    const looksValid =
      /^[A-Z0-9][A-Z0-9/_.-]{4,}$/i.test(applicationNumber.value) &&
      /\d/.test(applicationNumber.value);
    checks.push(
      makeCheck(
        "REF",
        "Application / reference number",
        looksValid ? PASS : REVIEW,
        looksValid
          ? `Reference number detected: ${applicationNumber.value}.`
          : `Detected reference "${applicationNumber.value}" does not look like a standard reference number.`,
        `"${applicationNumber.evidence}" (${applicationNumber.document.name})`
      )
    );
  }

  // 6. Date formats.
  const allDates = extracted.dates;
  const invalidDates = allDates.filter((date) => !date.valid);
  if (!allDates.length) {
    checks.push(
      makeCheck(
        "DATES",
        "Date formats",
        REVIEW,
        "No dates were detected in the uploaded documents.",
        "Check issue and validity dates manually."
      )
    );
  } else if (invalidDates.length) {
    checks.push(
      makeCheck(
        "DATES",
        "Date formats",
        FAIL,
        "One or more dates use an unrecognised or invalid format.",
        invalidDates.map((date) => `"${date.raw}" — ${date.error}`).join("; ")
      )
    );
  } else {
    checks.push(
      makeCheck(
        "DATES",
        "Date formats",
        PASS,
        `${allDates.length} date(s) parsed successfully.`,
        allDates
          .map((date) => `${date.raw}${date.iso ? ` → ${date.iso}` : ""}`)
          .join("; ")
      )
    );
  }

  // 7. Expiry / validity.
  const expiry = extracted.expiryDate;
  if (!expiry) {
    checks.push(
      makeCheck(
        "EXPIRY",
        "Approval validity",
        REVIEW,
        "No validity or expiry date was detected in the uploaded documents.",
        "Confirm the approval period manually."
      )
    );
  } else if (!expiry.iso) {
    checks.push(
      makeCheck(
        "EXPIRY",
        "Approval validity",
        FAIL,
        `The detected validity date "${expiry.raw}" could not be parsed.`,
        `"${expiry.evidence}" (${expiry.document.name})`
      )
    );
  } else {
    const days = daysBetween(expiry.iso, todayMs);
    const evidence = `"${expiry.evidence}" (${expiry.document.name}) → ${expiry.iso}`;
    if (days < 0) {
      checks.push(
        makeCheck(
          "EXPIRY",
          "Approval validity",
          FAIL,
          `Approval validity ended on ${expiry.iso} (${Math.abs(days)} day(s) ago).`,
          evidence
        )
      );
    } else if (days <= 60) {
      checks.push(
        makeCheck(
          "EXPIRY",
          "Approval validity",
          REVIEW,
          `Approval validity ends on ${expiry.iso} in ${days} day(s).`,
          evidence
        )
      );
    } else {
      checks.push(
        makeCheck(
          "EXPIRY",
          "Approval validity",
          PASS,
          `Approval validity runs to ${expiry.iso}.`,
          evidence
        )
      );
    }
  }

  // 8. Date ordering, when both dates exist.
  if (expiry && expiry.iso && extracted.issueDate && extracted.issueDate.iso) {
    if (extracted.issueDate.iso > expiry.iso) {
      checks.push(
        makeCheck(
          "DATE_ORDER",
          "Date ordering",
          FAIL,
          `Issue date ${extracted.issueDate.iso} is after the validity date ${expiry.iso}.`,
          `Issue: "${extracted.issueDate.evidence}"; expiry: "${expiry.evidence}"`
        )
      );
    } else {
      checks.push(
        makeCheck(
          "DATE_ORDER",
          "Date ordering",
          PASS,
          "Issue date is before the validity date.",
          `Issue ${extracted.issueDate.iso}, expiry ${expiry.iso}`
        )
      );
    }
  }

  // 9. Approval / extension status.
  const status = extracted.approvalStatus;
  if (!status) {
    checks.push(
      makeCheck(
        "STATUS",
        "Approval / extension status",
        REVIEW,
        "No approval or extension status was detected in the uploaded documents.",
        "Confirm the status manually with the issuing authority."
      )
    );
  } else {
    const evidence = `"${status.evidence}" (${status.document.name})`;
    if (status.value === "approved") {
      checks.push(
        makeCheck(
          "STATUS",
          "Approval / extension status",
          PASS,
          `Document states: "${status.raw || "approved"}".`,
          evidence
        )
      );
    } else if (status.value === "pending") {
      checks.push(
        makeCheck(
          "STATUS",
          "Approval / extension status",
          REVIEW,
          `Document states the application is pending ("${status.raw || "pending"}").`,
          evidence
        )
      );
    } else {
      checks.push(
        makeCheck(
          "STATUS",
          "Approval / extension status",
          FAIL,
          `Document states an adverse status: "${status.raw || status.value}".`,
          evidence
        )
      );
    }
  }

  // 10. Consistency with the demo register and the form.
  const inconsistencies = [];
  if (!record) {
    inconsistencies.push(`Institute code ${app.instituteCode} is not in the demo register.`);
  } else {
    if (app.instituteName && !matchesName(app.instituteName, record.name)) {
      inconsistencies.push(
        `Application name "${app.instituteName}" differs from the demo register "${record.name}".`
      );
    }
    if (Number(app.claimedFacultyCount) !== record.facultyCount) {
      inconsistencies.push(
        `Claimed faculty ${app.claimedFacultyCount}; demo register lists ${record.facultyCount}.`
      );
    }
    const approvedCse = record.approvedProgrammes?.[0]?.intake;
    if (approvedCse !== undefined && Number(app.claimedIntakeCse) !== approvedCse) {
      inconsistencies.push(
        `Claimed CSE intake ${app.claimedIntakeCse}; demo last approved ${approvedCse}.`
      );
    }
    if (app.claimsNba && !record.nbaAccredited) {
      inconsistencies.push(
        "NBA accreditation is claimed but the demo register says it is not accredited."
      );
    }
  }

  const extractedFaculty = extracted.facultyCount;
  if (
    extractedFaculty &&
    app.claimedFacultyCount &&
    Number(extractedFaculty.value) !== Number(app.claimedFacultyCount)
  ) {
    inconsistencies.push(
      `Document lists ${extractedFaculty.value} faculty; application claims ${app.claimedFacultyCount}.`
    );
  }

  const extractedIntake = extracted.cseIntake;
  if (
    extractedIntake &&
    app.claimedIntakeCse &&
    Number(extractedIntake.value) !== Number(app.claimedIntakeCse)
  ) {
    inconsistencies.push(
      `Document lists CSE intake ${extractedIntake.value}; application claims ${app.claimedIntakeCse}.`
    );
  }

  const extractedYear = extracted.academicYear;
  if (
    extractedYear &&
    app.academicYear &&
    String(extractedYear.value).replace(/\s/g, "") !== String(app.academicYear).replace(/\s/g, "")
  ) {
    inconsistencies.push(
      `Document academic year "${extractedYear.value}" differs from the application "${app.academicYear}".`
    );
  }

  checks.push(
    inconsistencies.length
      ? makeCheck(
          "CONSIST",
          "Claims vs records",
          REVIEW,
          `${inconsistencies.length} inconsistenc(ies) with the demo register or the application form.`,
          inconsistencies.join("; ")
        )
      : makeCheck(
          "CONSIST",
          "Claims vs records",
          PASS,
          "No inconsistency found between the form, extracted fields, and the demo register.",
          ""
        )
  );

  // 11. Duplicate files (hash based).
  const hashes = new Map();
  const duplicates = [];
  for (const { doc } of entries) {
    if (!doc.path || !fs.existsSync(doc.path) || !doc.size) continue;
    let hash = doc.hash;
    if (!hash) {
      hash = fileHash(doc.path);
      doc.hash = hash;
    }
    if (hashes.has(hash)) {
      duplicates.push(`${doc.originalName} is identical to ${hashes.get(hash)}`);
    } else {
      hashes.set(hash, doc.originalName);
    }
  }
  checks.push(
    duplicates.length
      ? makeCheck(
          "DUP",
          "Duplicate files",
          REVIEW,
          "The same file appears to have been uploaded more than once.",
          duplicates.join("; ")
        )
      : makeCheck(
          "DUP",
          "Duplicate files",
          PASS,
          "No duplicate file content detected.",
          ""
        )
  );

  // 12. Official authenticity is never asserted.
  const authenticity = {
    status: "UNVERIFIED",
    reason:
      "VerifyAI is not connected to AICTE, NAD/DigiLocker, or any issuing authority. OCR and field checks cannot prove that a document is genuine or that an approval was granted.",
    recommendation:
      "Manually verify the document against official AICTE/issuing-authority records before any regulatory action.",
  };
  checks.push(
    makeCheck(
      "AUTH",
      "Official authenticity",
      REVIEW,
      "UNVERIFIED — no official record source is connected.",
      "Checks above cover local content only, not the existence or validity of the underlying approval."
    )
  );

  const gatingChecks = checks.filter((check) => check.id !== "AUTH");
  const fails = gatingChecks.filter((check) => check.status === FAIL);
  const reviews = gatingChecks.filter((check) => check.status === REVIEW);
  const overall = fails.length ? FAIL : reviews.length ? REVIEW : PASS;

  const summary =
    overall === PASS
      ? "All automated content checks passed. Authenticity remains UNVERIFIED; a human reviewer must confirm against official records."
      : overall === REVIEW
        ? `${reviews.length} check(s) need manual review. Authenticity remains UNVERIFIED and no approval is implied.`
        : `${fails.length} blocking check(s) failed. This is not a rejection decision; a human reviewer must decide.`;

  const findings = checks
    .filter((check) => check.status !== PASS)
    .map((check) => ({
      id: `F-${check.id}`,
      severity: check.status === FAIL ? "high" : "medium",
      title: check.label,
      evidence: check.evidence
        ? `${check.reason} Evidence: ${check.evidence}`
        : check.reason,
      source: "VerifyAI automated check",
    }));

  return {
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    overall,
    summary,
    authenticity,
    checks,
    extracted,
    checklist,
    findings,
    recordUsed: record
      ? { code: record.code, name: record.name, source: record.source }
      : null,
  };
}

module.exports = { validateApplication };
