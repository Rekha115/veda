// Field extraction heuristics for text produced by PDF text extraction or OCR.
// These are deliberately conservative: every field carries the evidence line
// it came from so a human reviewer can check it.

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH_RE =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function normalizeSpace(value) {
  return (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function squash(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cap(value, max = 300) {
  const text = normalizeSpace(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function monthNumber(name) {
  return MONTHS[normalizeSpace(name).toLowerCase().slice(0, 3)] || null;
}

function makeIso(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    return { valid: false, iso: null, error: "not a calendar date" };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return { valid: false, iso: null, error: "not a calendar date" };
  }
  return { valid: true, iso: date.toISOString().slice(0, 10), error: null };
}

function parseDateToken(raw) {
  const s = normalizeSpace(raw).replace(/\.$/, "");
  let m;

  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    return { ...makeIso(m[1], m[2], m[3]), format: "YYYY-MM-DD" };
  }

  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) {
    let year = m[3];
    if (year.length === 2) year = Number(year) <= 69 ? `20${year}` : `19${year}`;
    return {
      ...makeIso(year, m[2], m[1]),
      format: "DD/MM/YYYY (day-first assumed)",
    };
  }

  if (
    (m = s.match(
      new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\.?,?\\s+(\\d{4})$`, "i")
    ))
  ) {
    return {
      ...makeIso(m[3], monthNumber(m[2]), m[1]),
      format: "D Month YYYY",
    };
  }

  if (
    (m = s.match(
      new RegExp(`^(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$`, "i")
    ))
  ) {
    return {
      ...makeIso(m[3], monthNumber(m[1]), m[2]),
      format: "Month D, YYYY",
    };
  }

  return { valid: false, iso: null, error: "unrecognised date format", format: null };
}

function lineAt(text, index) {
  const start = text.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  let end = text.indexOf("\n", index);
  if (end === -1) end = text.length;
  return cap(text.slice(start, end), 240);
}

function findDateMatches(text) {
  const patterns = [
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
    /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g,
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?,?\\s+\\d{4}\\b`, "gi"),
    new RegExp(`\\b${MONTH_RE}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "gi"),
  ];

  const seen = new Map();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const key = normalizeSpace(match[0]).toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { raw: normalizeSpace(match[0]), index: match.index || 0 });
      }
    }
  }

  return [...seen.values()].map(({ raw, index }) => ({
    raw,
    ...parseDateToken(raw),
    context: lineAt(text, index),
  }));
}

function cleanLabelValue(value) {
  const trimmed = normalizeSpace(value);
  const cut = trimmed.match(
    /\s{2,}|\b(?:academic year|application|reference|status|date|valid|address|phone|email|website|affiliated|institution code)\b/i
  );
  const result = cut && cut.index > 3 ? trimmed.slice(0, cut.index) : trimmed;
  return cap(result.replace(/[,;:\-]+$/, ""), 160);
}

function extractInstitutionName(lines) {
  const label =
    /(?:name\s+of\s+(?:the\s+)?institution|institution(?:\s+name)?|institute\s+name|name\s+of\s+(?:the\s+)?college|college\s+name)\s*[:\-]\s*(.+)/i;

  for (const line of lines) {
    const match = line.match(label);
    if (match) {
      const value = cleanLabelValue(match[1]);
      if (value.length >= 3) return { value, evidence: line };
    }
  }

  for (const line of lines) {
    if (
      /(institute|college|university|polytechnic)/i.test(line) &&
      !/(all india council|aicte|technical education|government of|affiliation letter|approved|list of|notification)/i.test(
        line
      ) &&
      line.length <= 120
    ) {
      return { value: cap(line, 120), evidence: line };
    }
  }

  return null;
}

function extractApplicationNumber(lines) {
  const patterns = [
    /(?:application|reference|ref\.?|file)\s*(?:no\.?|number|#)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9/_.-]{3,})/i,
    /\b(AICTE\s*[/-]\s*[A-Za-z0-9][A-Za-z0-9/_.-]{2,})/i,
    /\b([A-Z]{2,6}\/[A-Z0-9]{2,}(?:\/[A-Z0-9]{2,})+)\b/,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match) continue;
      const value = normalizeSpace(match[1]).toUpperCase();
      if (value.length < 5) continue;
      if (/^20\d{2}[/-]\d{2,4}$/.test(value)) continue; // academic year, not a reference
      return { value, evidence: line };
    }
  }

  return null;
}

function extractAcademicYear(lines) {
  for (const line of lines) {
    const labelled = line.match(
      /(?:academic\s+year|session)\s*[:\-]?\s*(20\d{2}\s*[-–/]\s*(?:20)?\d{2})/i
    );
    if (labelled) {
      return { value: normalizeSpace(labelled[1]).replace(/\s+/g, ""), evidence: line };
    }
  }
  for (const line of lines) {
    const match = line.match(/\b(20\d{2}\s*[-–/]\s*(?:20)?\d{2})\b/);
    if (match) {
      return { value: normalizeSpace(match[1]).replace(/\s+/g, ""), evidence: line };
    }
  }
  return null;
}

const STATUS_RULES = [
  {
    value: "rejected",
    regex: /\b(not\s+approved|rejected|refused|declined|withdrawn|cancelled)\b/i,
  },
  { value: "expired", regex: /\b(expired|lapsed|no\s+longer\s+valid)\b/i },
  {
    value: "pending",
    regex: /\b(pending|under\s+process|in\s+process|under\s+consideration|not\s+yet\s+approved)\b/i,
  },
  {
    value: "approved",
    regex: /\b(approved|approval\s+granted|extension\s+of\s+approval|extended|renewed|valid\s+up\s+to)\b/i,
  },
];

function extractApprovalStatus(lines) {
  for (const rule of STATUS_RULES) {
    for (const line of lines) {
      const match = line.match(rule.regex);
      if (match) {
        return { value: rule.value, raw: normalizeSpace(match[0]), evidence: line };
      }
    }
  }
  return null;
}

function extractDateNear(lines, regex) {
  for (const line of lines) {
    if (!regex.test(line)) continue;
    const dates = findDateMatches(line);
    if (dates.length) {
      return { ...dates[0], evidence: line };
    }
  }
  return null;
}

function extractExpiryDate(lines) {
  return extractDateNear(
    lines,
    /(valid\s*(?:up\s*to|till|until|through)|expir\w*|validity|period\s+of\s+approval|extended\s*(?:up\s*)?to)/i
  );
}

function extractIssueDate(lines) {
  return extractDateNear(
    lines,
    /(date\s+of\s+issue|issued\s+on|issue\s+date|dated|date\s*[:\-])/i
  );
}

function extractNumberNear(lines, regex) {
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0 && value < 100000) {
        return { value, evidence: line };
      }
    }
  }
  return null;
}

function extractFacultyCount(lines) {
  return extractNumberNear(lines, /faculty[^0-9\n]{0,60}(\d{1,5})/i);
}

function extractCseIntake(lines) {
  return (
    extractNumberNear(
      lines,
      /(?:cse|computer\s*science(?:\s*(?:and|&)\s*engineering)?)[^0-9\n]{0,80}(\d{1,5})/i
    ) ||
    extractNumberNear(lines, /(?:sanctioned\s+)?intake[^0-9\n]{0,40}(\d{1,5})/i)
  );
}

function extractIssuingAuthority(lines) {
  for (const line of lines) {
    if (/all\s+india\s+council\s+for\s+technical\s+education|\bAICTE\b/i.test(line)) {
      return { value: "AICTE", evidence: line };
    }
  }
  return null;
}

function guessKindFromText(text) {
  if (/extension\s+of\s+approval|\bEOA\b/i.test(text)) return "previous_eoa";
  if (/affiliation/i.test(text)) return "affiliation";
  if (/faculty\s+(?:list|details)|list\s+of\s+faculty/i.test(text)) return "faculty_list";
  if (/fire\s+(?:safety\s+)?noc|no\s+objection\s+certificate/i.test(text)) return "fire_noc";
  if (/land|affidavit/i.test(text)) return "land_affidavit";
  if (/infrastructure|photograph/i.test(text)) return "infrastructure";
  return "other";
}

function extractFields(text) {
  const lines = (text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => normalizeSpace(line))
    .filter(Boolean);

  return {
    institutionName: extractInstitutionName(lines),
    applicationNumber: extractApplicationNumber(lines),
    academicYear: extractAcademicYear(lines),
    approvalStatus: extractApprovalStatus(lines),
    issueDate: extractIssueDate(lines),
    expiryDate: extractExpiryDate(lines),
    facultyCount: extractFacultyCount(lines),
    cseIntake: extractCseIntake(lines),
    issuingAuthority: extractIssuingAuthority(lines),
    documentKindGuess: guessKindFromText(lines.join("\n")),
    dates: findDateMatches(lines.join("\n")),
  };
}

module.exports = {
  extractFields,
  parseDateToken,
  findDateMatches,
  guessKindFromText,
  normalizeSpace,
  squash,
};
