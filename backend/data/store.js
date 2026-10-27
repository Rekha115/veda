const fs = require("fs");
const path = require("path");

// Tests use an isolated directory; normal runs keep the existing data folder.
const DATA_DIR = process.env.VERIFYAI_DATA_DIR || __dirname;
fs.mkdirSync(DATA_DIR, { recursive: true });
const FILE = path.join(DATA_DIR, "applications.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function save(applications) {
  fs.writeFileSync(FILE, JSON.stringify(applications, null, 2));
}

function seedIfEmpty() {
  const current = load();
  if (current.length) return current;

  const seeded = [
    {
      id: "APP-DEMO-1001",
      instituteCode: "INST-2024-001",
      instituteName: "Bharat Institute of Technology",
      category: "EOA",
      academicYear: "2026-27",
      contactName: "Dr. Meera Sharma",
      contactEmail: "registrar@bit-jaipur.demo",
      claimedFacultyCount: 42,
      claimedIntakeCse: 120,
      claimedIntakeEce: 60,
      claimsNba: false,
      status: "validated",
      createdAt: "2026-10-20T09:00:00.000Z",
      documents: [],
      validation: {
        generatedAt: "2026-10-20T09:10:00.000Z",
        overall: "REVIEW_REQUIRED",
        summary:
          "Seeded demo application. Upload documents on a new application to run live checks.",
        findings: [
          {
            id: "F-SEED-1",
            severity: "info",
            title: "Demo seed record",
            evidence: "This application exists so the dashboard is not empty.",
            source: "Demo dataset",
          },
        ],
        checklist: [],
      },
      review: {
        decision: "pending",
        notes: "",
        reviewer: null,
        reviewedAt: null,
      },
      audit: [
        {
          at: "2026-10-20T09:00:00.000Z",
          actor: "system",
          action: "Seeded demo application",
        },
      ],
    },
  ];
  save(seeded);
  return seeded;
}

module.exports = { load, save, seedIfEmpty };
