const REQUIRED_DOCUMENTS = {
  EOA: [
    { type: "previous_eoa", label: "Previous Extension of Approval letter" },
    { type: "affiliation", label: "University affiliation letter" },
    { type: "faculty_list", label: "Faculty list with qualifications" },
    { type: "land_affidavit", label: "Land / building affidavit" },
    { type: "fire_noc", label: "Fire safety NOC" },
    { type: "infrastructure", label: "Infrastructure photographs / plan" },
  ],
  NEW_COURSE: [
    { type: "previous_eoa", label: "Current EoA letter" },
    { type: "faculty_list", label: "Faculty list for proposed course" },
    { type: "infrastructure", label: "Lab / classroom evidence" },
    { type: "affiliation", label: "University consent / affiliation" },
  ],
  INTAKE_INCREASE: [
    { type: "previous_eoa", label: "Current EoA letter" },
    { type: "faculty_list", label: "Faculty adequacy statement" },
    { type: "infrastructure", label: "Additional infrastructure evidence" },
  ],
};

const INSTITUTIONS = {
  "INST-2024-001": {
    code: "INST-2024-001",
    name: "Bharat Institute of Technology",
    state: "Rajasthan",
    district: "Jaipur",
    source: "DEMO institutional register (not an AICTE live record)",
    previousEoaYear: "2024-25",
    previousEoaStatus: "Approved",
    approvedProgrammes: [
      { name: "B.Tech Computer Science and Engineering", intake: 120 },
      { name: "B.Tech Electronics and Communication", intake: 60 },
    ],
    facultyCount: 42,
    nbaAccredited: false,
    terPaymentStatus: "Paid (demo)",
    lastDeficiency: "None recorded in demo data",
    fireNocExpiry: "2026-03-31",
  },
};

const USERS = [
  {
    username: "institute",
    password: "demo123",
    role: "institution",
    displayName: "BIT Jaipur (Institution Demo)",
    instituteCode: "INST-2024-001",
  },
  {
    username: "admin",
    password: "demo123",
    role: "admin",
    displayName: "Review Officer (Admin Demo)",
    instituteCode: null,
  },
];

module.exports = { REQUIRED_DOCUMENTS, INSTITUTIONS, USERS };
