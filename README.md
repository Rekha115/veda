# VEDA — AI-Powered Application Validation, Document Authentication and Regulatory Compliance Assistance

[![Node.js Version](https://img.shields.io/badge/Node.js-22.13%2B-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Status-Demonstration%20Prototype-orange.svg)]()

> **Notice:** VEDA is an independent demonstration prototype developed for **SIH Problem Statement 26261**. It is not connected to live AICTE databases, does not connect to DigiLocker/NAD, and does not authenticate genuine certificates. All institutional records and findings are preliminary and advisory for demonstration evaluation.

---

## 🏛️ Overview

**VEDA** assists technical institutions and authorized AICTE scrutiny committees during the approval and renewal application process (including Extension of Approval - EoA, New Course Additions, and Intake Capacity Increases). 

It automates pre-scrutiny checks by:
* Extracting text and metadata from digital and scanned PDFs, JPGs, PNGs, WEBP, and TIFF files using a local WebAssembly OCR engine (`tesseract.js` + `pdf-to-img`).
* Validating submitted application figures against available institutional register records and configurable regulatory rules (AICTE Approval Process Handbook - APH).
* Identifying missing mandatory documents, expired certificates, date misalignments, duplicate file hashes, and faculty ratio discrepancies.
* Providing an evidence-linked scrutiny report and a reviewer workbench for scrutiny committees before official statutory review.

---

## 🎨 User Interface & Design System

The platform features an authentic Indian institutional government-portal design system:
* **Branding & Emblems**: Official All India Council for Technical Education (AICTE) emblem and Ministry of Education identifiers.
* **Palette**: Institutional saffron/orange (`#F36B16`), dark text (`#0F172A`), clean white cards (`#FFFFFF`), and cool-grey workspaces (`#F2F4F7`).
* **Accessibility & Language**: Scalable typography controls (**A-**, **A**, **A+**), complete bilingual switching (**English | हिंदी**) across all pages with `localStorage` persistence, Noto Sans Devanagari font rendering, and GIGW-compliant contrast and keyboard navigation.
* **Responsive Architecture**: Polished responsive layouts for desktop, tablet, and mobile across all screens.


---

## 📋 Features & Screens

1. **Public Landing Page (`/`)**: Overview of VEDA's regulatory assistance scope, 3-step workflow explanation, and prototype limits.
2. **Institutional Login (`/login`)**: Full-bleed two-column hero with exact VEDA feature specifications, institutional building line illustration, role selector tabs, and password show/hide toggle.
3. **Institution Dashboard (`/dashboard`)**: Institutional profile overview (Bharat Institute of Technology `INST-2024-001`), 4 real-time summary statistic cards, Recent Applications list, and dynamic chronological activity audit log.
4. **New Application (`/applications/new`)**: 4-part categorized submission form covering institutional details, nodal officer contact, claimed capacity, and statutory declarations.
5. **Document Ingestion (`/applications/:id/upload`)**: Drag-and-drop document upload interface with file format validation, declared document type selectors, and upload checklists.
6. **Validation & Scrutiny Reports (`/applications/:id/results`)**: Detailed validation report with detected fields, OCR confidence metrics, rule check logs, authenticity status, and print/export tools.
7. **Admin Review Workbench (`/admin`)**: Scrutiny officer queue with decision actions (*Request Evidence*, *Flag for Physical Inspection*, *Clear for Competent Officer*) and reviewer notes.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: Version **22.13 or newer** (tested on Node 22.19; required for `@napi-rs/canvas` and `pdf-to-img`).
* **npm**: Version 10 or newer.

### Installation

Clone the repository:
```bash
git clone https://github.com/Rekha115/veda.git
cd veda
```

### 1. Start Backend API Server

Open a terminal and run:
```bash
cd backend
npm install
npm start
```
* Backend service runs at: `http://localhost:5000`

### 2. Start Frontend Dev Server

Open a second terminal and run:
```bash
cd frontend
npm install
npm run dev
```
* Frontend application runs at: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

The prototype includes pre-configured demo credentials:

| Role | Username | Password | Default Destination |
| :--- | :--- | :--- | :--- |
| **Institution User** | `institute` | `demo123` | `/dashboard` |
| **Admin / Reviewer** | `admin` | `demo123` | `/admin` |

---

## 🧪 Testing

### Backend Test Suite
Run the automated test suite covering validation logic, OCR handling, file security, session management, and API routes:
```bash
cd backend
npm test
```

### Frontend Production Build
Validate the client code and production bundle:
```bash
cd frontend
npm run build
```

---

## 📄 Document Processing & Verification Rules

Uploads are analyzed locally on CPU without requiring external cloud AI keys or commercial OCR subscriptions:

| File Type | Processing Method |
| :--- | :--- |
| **Text-based PDF** | Embedded text layer extracted via `pdfjs-dist` |
| **Scanned PDF** | Pages rasterized to PNG via `pdf-to-img` and processed via `tesseract.js` |
| **Images (PNG, JPG, WEBP, TIFF)** | Direct optical character recognition via `tesseract.js` |

### Scrutiny Verification Checks

Each document check evaluates to `PASS`, `REVIEW`, or `FAIL` with verifiable evidence:
* **File Policy**: Maximum 8 MB per file. Magic bytes and declared MIME types are validated against file content.
* **Text Extraction**: Flags empty or unreadable scans.
* **Mandatory Checklist**: Checks for previous EoA letters, Fire Safety NOC, Land affidavits, and faculty lists according to application category.
* **Date & Expiry Checks**: Detects expired Fire NOCs or reversed issue/validity dates.
* **Data Discrepancies**: Flags mismatches between form entries, detected document text, and institutional registers.
* **Duplicate Detection**: Identifies identical document hashes uploaded across different categories.

---

## 🛡️ License & Disclaimer

Developed as an independent demonstration prototype for SIH problem statement 26261. This application is not an official portal of the All India Council for Technical Education (AICTE) or the Ministry of Education, Government of India.
