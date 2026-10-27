const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "verifyai-store-"));
process.env.VERIFYAI_DATA_DIR = dataDir;

const store = require("../data/store");
const file = path.join(dataDir, "applications.json");

after(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test("seeding is idempotent and writes the JSON store", () => {
  assert.equal(store.load().length, 0);

  const first = store.seedIfEmpty();
  assert.equal(first.length, 1);
  assert.equal(first[0].id, "APP-DEMO-1001");
  assert.ok(fs.existsSync(file));

  const second = store.seedIfEmpty();
  assert.equal(second.length, 1);
});

test("save and load round-trip application data", () => {
  const records = [
    {
      id: "APP-ROUNDTRIP",
      instituteCode: "INST-2024-001",
      status: "review_needs_evidence",
      audit: [{ actor: "admin", action: "Admin review: needs_evidence" }],
    },
  ];
  store.save(records);

  assert.deepEqual(store.load(), records);
});
