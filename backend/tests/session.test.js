const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "verifyai-session-"));
process.env.VERIFYAI_DATA_DIR = dataDir;
process.env.VERIFYAI_UPLOAD_DIR = path.join(dataDir, "uploads");
process.env.SESSION_TTL_MS = "25";

const app = require("../server");

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test("an expired session is rejected with a clear message", async () => {
  const login = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "institute", password: "demo123" }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();

  await new Promise((resolve) => setTimeout(resolve, 100));

  const me = await fetch(`${base}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(me.status, 401);
  const data = await me.json();
  assert.match(data.error, /Session expired/);
});
