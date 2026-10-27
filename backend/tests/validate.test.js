const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { validateApplication } = require("../services/validate");
const { ENGINE_VERSION } = require("../services/extract");
const { writePdf, isoDate } = require("./helpers/pdf");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "verifyai-validate-"));

after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

let counter = 0;

function makeApp(overrides = {}) {
  return {
    id: "APP-TEST",
    instituteCode: "INST-2024-001",
    instituteName: "Bharat Institute of Technology",
    category: "EOA",
    academicYear: "2026-27",
    claimedFacultyCount: 42,
    claimedIntakeCse: 120,
    claimedIntakeEce: 60,
    claimsNba: false,
    documents: [],
    ...overrides,
  };
}

function makeDoc(filePath, declaredType) {
  counter += 1;
  return {
    id: `DOC-${counter}`,
    declaredType,
    documentNumber: "",
    expiryDate: "",
    originalName: path.basename(filePath),
    path: filePath,
    mimeType: "application/pdf",
    size: fs.statSync(filePath).size,
    uploadedAt: new Date().toISOString(),
  };
}

function requiredDocs({ issue = isoDate(-30), expiry = isoDate(180) } = {}) {
  const dir = fs.mkdtempSync(path.join(tempDir, "docs-"));
  const previous = writePdf(dir, "previous-eoa.pdf", [
    "GOVERNMENT OF INDIA",
    "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
    "Extension of Approval Letter",
    "Application No: AICTE/EOA/2026/12345",
    "Name of the Institution: Bharat Institute of Technology",
    "Academic Year: 2026-27",
    "Approval Status: Approved",
    `Date of issue: ${issue}`,
    `This approval is valid up to ${expiry}`,
    "Faculty sanctioned: 42",
    "CSE Intake: 120",
    "Issuing Authority: All India Council for Technical Education",
  ]);
  const affiliation = writePdf(dir, "affiliation.pdf", [
    "University Affiliation Letter",
    "Name of the Institution: Bharat Institute of Technology",
    "Affiliated to Rajasthan Technical University",
    "Reference Number: AFF/2026/0099",
    "Academic Year: 2026-27",
    "The affiliation is valid up to 31 March 2028",
    "This document confirms university consent for the institute",
  ]);
  const faculty = writePdf(dir, "faculty.pdf", [
    "Faculty List and Qualifications",
    "Name of the Institution: Bharat Institute of Technology",
    "Faculty sanctioned: 42",
    "Professor: 8",
    "Associate Professor: 12",
    "Assistant Professor: 22",
    "All faculty members hold valid qualifications",
    "Department of Computer Science and Engineering",
    "Department of Electronics and Communication Engineering",
    "Total teaching staff: 42",
  ]);
  const land = writePdf(dir, "land.pdf", [
    "Land and Building Affidavit",
    "Name of the Institution: Bharat Institute of Technology",
    "The institute owns the land and building used for academic purposes",
    "Total land area: 5 acres",
    "Built up area: 12000 square metres",
    "The affidavit is sworn before a notary",
    "No encumbrance exists on the property",
    "This affidavit supports the extension of approval application",
  ]);
  const fire = writePdf(dir, "fire.pdf", [
    "Fire Safety No Objection Certificate",
    "Name of the Institution: Bharat Institute of Technology",
    "Issued by Rajasthan Fire and Emergency Services",
    "Certificate Number: FIRE/2026/4411",
    "This certificate is valid up to 31 March 2027",
    "Fire fighting equipment has been inspected",
    "Emergency exits and alarms are operational",
  ]);
  const infra = writePdf(dir, "infrastructure.pdf", [
    "Infrastructure Photographs and Plan",
    "Name of the Institution: Bharat Institute of Technology",
    "Classrooms: 24",
    "Laboratories: 12",
    "Library and reading room available",
    "Computer centre with 120 systems",
    "Sports ground and hostel facilities available",
    "The campus plan is enclosed with this application",
  ]);
  return [
    makeDoc(previous, "previous_eoa"),
    makeDoc(affiliation, "affiliation"),
    makeDoc(faculty, "faculty_list"),
    makeDoc(land, "land_affidavit"),
    makeDoc(fire, "fire_noc"),
    makeDoc(infra, "infrastructure"),
  ];
}

function check(result, id) {
  return result.checks.find((item) => item.id === id);
}

test("no documents fails closed and never asserts authenticity", async () => {
  const result = await validateApplication(makeApp());

  assert.equal(result.overall, "FAIL");
  assert.equal(check(result, "FILES").status, "FAIL");
  assert.equal(check(result, "READ").status, "FAIL");
  assert.equal(check(result, "AUTH").status, "REVIEW");
  assert.equal(result.authenticity.status, "UNVERIFIED");
  assert.match(result.summary, /not a rejection decision/i);
  assert.equal(result.recordUsed.source.includes("DEMO"), true);
});

test("a complete synthetic application passes content checks but authenticity stays UNVERIFIED", async () => {
  const result = await validateApplication(
    makeApp({ documents: requiredDocs() })
  );

  assert.equal(result.overall, "PASS");
  assert.equal(check(result, "FILES").status, "PASS");
  assert.equal(check(result, "READ").status, "PASS");
  assert.equal(check(result, "DOCS").status, "PASS");
  assert.equal(check(result, "INST").status, "PASS");
  assert.equal(check(result, "REF").status, "PASS");
  assert.equal(check(result, "DATES").status, "PASS");
  assert.equal(check(result, "EXPIRY").status, "PASS");
  assert.equal(check(result, "DATE_ORDER").status, "PASS");
  assert.equal(check(result, "STATUS").status, "PASS");
  assert.equal(check(result, "CONSIST").status, "PASS");
  assert.equal(check(result, "DUP").status, "PASS");
  assert.equal(check(result, "AUTH").status, "REVIEW");
  assert.equal(result.authenticity.status, "UNVERIFIED");
  assert.match(result.summary, /Authenticity remains UNVERIFIED/);
});

test("missing required documents is a blocking failure with named gaps", async () => {
  const docs = requiredDocs().slice(0, 1);
  const result = await validateApplication(makeApp({ documents: docs }));
  const docsCheck = check(result, "DOCS");

  assert.equal(result.overall, "FAIL");
  assert.equal(docsCheck.status, "FAIL");
  assert.match(docsCheck.reason, /5 required document/);
  assert.match(docsCheck.evidence, /Missing:/);
  assert.match(docsCheck.evidence, /Fire safety NOC/);
});

test("an expired approval date fails", async () => {
  const result = await validateApplication(
    makeApp({
      documents: requiredDocs({ issue: isoDate(-400), expiry: isoDate(-10) }),
    })
  );
  const expiry = check(result, "EXPIRY");

  assert.equal(result.overall, "FAIL");
  assert.equal(expiry.status, "FAIL");
  assert.match(expiry.reason, /ended on/);
});

test("an approval expiring within 60 days requires review", async () => {
  const result = await validateApplication(
    makeApp({
      documents: requiredDocs({ issue: isoDate(-300), expiry: isoDate(30) }),
    })
  );
  const expiry = check(result, "EXPIRY");

  assert.equal(result.overall, "REVIEW");
  assert.equal(expiry.status, "REVIEW");
  assert.match(expiry.reason, /in \d+ day\(s\)/);
});

test("an impossible calendar date fails instead of being guessed", async () => {
  const result = await validateApplication(
    makeApp({ documents: requiredDocs({ expiry: "2027-02-30" }) })
  );

  assert.equal(result.overall, "FAIL");
  assert.equal(check(result, "DATES").status, "FAIL");
  assert.equal(check(result, "EXPIRY").status, "FAIL");
  assert.match(check(result, "EXPIRY").reason, /could not be parsed/);
});

test("claims that conflict with the demo register are flagged for review", async () => {
  const result = await validateApplication(
    makeApp({
      documents: requiredDocs(),
      claimedFacultyCount: 99,
      claimsNba: true,
    })
  );
  const consist = check(result, "CONSIST");

  assert.equal(result.overall, "REVIEW");
  assert.equal(consist.status, "REVIEW");
  assert.match(consist.evidence, /Claimed faculty 99/);
  assert.match(consist.evidence, /NBA accreditation is claimed/);
});

test("identical uploads are detected by content hash", async () => {
  const docs = requiredDocs();
  const duplicate = writePdf(
    path.dirname(docs[0].path),
    "fire-copy.pdf",
    [
      "GOVERNMENT OF INDIA",
      "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
      "Extension of Approval Letter",
      "Application No: AICTE/EOA/2026/12345",
      "Name of the Institution: Bharat Institute of Technology",
      "Academic Year: 2026-27",
      "Approval Status: Approved",
      `Date of issue: ${isoDate(-30)}`,
      `This approval is valid up to ${isoDate(180)}`,
      "Faculty sanctioned: 42",
      "CSE Intake: 120",
      "Issuing Authority: All India Council for Technical Education",
    ]
  );
  docs[4] = makeDoc(duplicate, "fire_noc");

  const result = await validateApplication(makeApp({ documents: docs }));
  const dup = check(result, "DUP");

  assert.equal(result.overall, "REVIEW");
  assert.equal(dup.status, "REVIEW");
  assert.match(dup.evidence, /identical to/);
});

test("a file missing from disk is reported, not thrown", async () => {
  const missingPath = path.join(tempDir, "does-not-exist.pdf");
  const result = await validateApplication(
    makeApp({
      documents: [
        {
          id: "DOC-MISSING",
          declaredType: "previous_eoa",
          documentNumber: "",
          expiryDate: "",
          originalName: "does-not-exist.pdf",
          path: missingPath,
          mimeType: "application/pdf",
          size: 100,
          uploadedAt: new Date().toISOString(),
        },
      ],
    })
  );

  assert.equal(result.overall, "FAIL");
  assert.equal(check(result, "FILES").status, "FAIL");
  assert.match(check(result, "FILES").evidence, /file is missing on disk/);
  assert.equal(check(result, "READ").status, "FAIL");
});

test("low-confidence extraction becomes REVIEW, not PASS", async () => {
  const file = writePdf(tempDir, "tiny.pdf", ["Tiny document"]);
  const doc = makeDoc(file, "previous_eoa");
  doc.analysis = {
    engineVersion: ENGINE_VERSION,
    fileType: "pdf",
    method: "pdf-text",
    pagesRead: 1,
    totalPages: 1,
    chars: 50,
    confidence: null,
    durationMs: 1,
    notes: [],
    textPreview: "Tiny document",
    fields: null,
  };

  const result = await validateApplication(makeApp({ documents: [doc] }));

  assert.equal(check(result, "READ").status, "REVIEW");
  assert.match(check(result, "READ").reason, /very little text/);
});

test("unsupported file content fails safely", async () => {
  const file = path.join(tempDir, "not-a-document.pdf");
  fs.writeFileSync(file, "this is plain text, not a pdf");
  const result = await validateApplication(
    makeApp({ documents: [makeDoc(file, "previous_eoa")] })
  );

  assert.equal(result.overall, "FAIL");
  assert.equal(check(result, "FILES").status, "FAIL");
  assert.equal(check(result, "READ").status, "FAIL");
});
