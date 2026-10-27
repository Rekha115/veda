const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "ocr-cache",
  "eng.traineddata"
);

function ocrAvailable() {
  return fs.existsSync(CACHE_FILE);
}

function fixture(name) {
  return path.join(__dirname, "..", "fixtures", name);
}

module.exports = { CACHE_FILE, ocrAvailable, fixture };
