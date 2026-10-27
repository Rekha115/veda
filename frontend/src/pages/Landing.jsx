import { useState } from "react";
import { Link } from "react-router-dom";
import aicteLogo from "../assets/aicte-logo.png";
import "./Landing.css";

export default function Landing() {
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [language, setLanguage] = useState("en");

  return (
    <div
      className="veda-landing-container"
      style={{ fontSize: `${fontSizeScale * 100}%` }}
    >
      {/* 1. Slim Top Utility Bar */}
      <section className="veda-landing-topbar" aria-label="National Portal Utilities">
        <div className="veda-landing-topbar-inner">
          <div style={{ fontWeight: 600, color: "#1f2937" }}>
            Government of India &nbsp;|&nbsp; Ministry of Education
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="#main-hero" style={{ color: "#4b5563", textDecoration: "none" }}>
              Skip to main content
            </a>
            <div style={{ display: "inline-flex", gap: 3 }}>
              <button
                type="button"
                style={{
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 3,
                  padding: "1px 6px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setFontSizeScale(0.92)}
              >
                A-
              </button>
              <button
                type="button"
                style={{
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 3,
                  padding: "1px 6px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setFontSizeScale(1)}
              >
                A
              </button>
              <button
                type="button"
                style={{
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 3,
                  padding: "1px 6px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setFontSizeScale(1.08)}
              >
                A+
              </button>
            </div>
            <div style={{ display: "inline-flex", gap: 4, color: "#4b5563" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: language === "en" ? 700 : 500,
                  color: language === "en" ? "#111" : "#4b5563",
                }}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <span>|</span>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: language === "hi" ? 700 : 500,
                  color: language === "hi" ? "#111" : "#4b5563",
                }}
                onClick={() => setLanguage("hi")}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Institutional Header */}
      <header className="veda-landing-header" role="banner">
        <div className="veda-landing-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={aicteLogo}
              alt="Official AICTE Emblem"
              style={{ width: 52, height: 52, objectFit: "contain" }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                All India Council for Technical Education
              </span>
              <span style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500 }}>
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </span>
              <span style={{ fontSize: "0.78rem", color: "#4b5563" }}>
                Ministry of Education, Government of India
              </span>
            </div>
          </div>

          <nav className="veda-landing-nav-group" aria-label="Main Navigation">
            <a href="#how" className="veda-landing-nav-link">
              How it works
            </a>
            <a href="#scope" className="veda-landing-nav-link">
              Demo scope
            </a>
            <Link className="veda-landing-btn-login" to="/login">
              <span>Institution Login</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* Saffron/Orange Accent Bar */}
      <div style={{ height: 3, backgroundColor: "#f36b16", width: "100%" }} aria-hidden="true" />

      {/* 3. Hero Section */}
      <section className="veda-landing-hero" id="main-hero">
        <div className="veda-landing-hero-inner">
          <div>
            <span className="veda-landing-badge">
              SIH 26261 · Smart Automation · Technical Institution Scrutiny
            </span>
            <h1 className="veda-landing-hero-title">
              Preliminary checks for technical-institution approval applications
            </h1>
            <p className="veda-landing-hero-desc">
              VEDA helps reviewers spot missing documents, expired dates, and
              inconsistencies against a local demo register — before a human officer
              decides.
            </p>
            <div className="veda-landing-actions">
              <Link className="veda-landing-btn-primary" to="/login">
                Open demo login
              </Link>
              <a className="veda-landing-btn-outline" href="#scope">
                What this is not
              </a>
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className="veda-landing-hero-card">
            <div className="veda-landing-card-header">
              <h3 className="veda-landing-card-title">Decision support only</h3>
              <span className="veda-landing-pill-advisory">Advisory</span>
            </div>
            <p className="veda-landing-card-desc">
              Statutory scrutiny and final approval stay with competent authorities.
              This demo never issues or rejects an AICTE EoA.
            </p>
            <ul className="veda-landing-check-list">
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>Application checklist by category (EoA, New Course, Intake)</span>
              </li>
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>Document upload, local OCR scanning and file-hash duplicate flags</span>
              </li>
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>Evidence-linked findings for scrutiny committee reviewers</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Workflow Steps */}
      <section className="veda-landing-section" id="how">
        <div className="veda-landing-section-header">
          <h2 className="veda-landing-section-title">How the demo works</h2>
          <p className="veda-landing-section-sub">
            An automated workflow assisting technical institutions and scrutiny officers
          </p>
        </div>

        <div className="veda-landing-workflow-grid">
          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">1</div>
            <h3 className="veda-landing-step-title">File an application</h3>
            <p className="veda-landing-step-text">
              An institution user submits Extension of Approval (EoA), new course
              addition, or intake details.
            </p>
          </article>

          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">2</div>
            <h3 className="veda-landing-step-title">Upload documents</h3>
            <p className="veda-landing-step-text">
              Supporting certificates, Fire NOCs, and affidavits are stored locally
              and analyzed via OCR.
            </p>
          </article>

          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">3</div>
            <h3 className="veda-landing-step-title">Review flags</h3>
            <p className="veda-landing-step-text">
              An authorized scrutiny officer inspects extracted fields, deficiency
              flags, and logs decision actions.
            </p>
          </article>
        </div>
      </section>

      {/* 5. Demonstration Scope & Limits */}
      <section className="veda-landing-section" id="scope" style={{ paddingTop: 0 }}>
        <div className="veda-landing-scope-card">
          <h2 className="veda-landing-scope-title">Clearly labelled demo limits</h2>
          <p className="veda-landing-scope-text">
            There is <strong>no AICTE portal integration</strong>, no NAD / DigiLocker
            connection, and <strong>no genuine certificate verification</strong>.
            Institution records, Fire NOC expiry, and intake figures are sample
            data in this repository.
          </p>
          <p className="veda-landing-scope-muted">
            PDF text scanning is a simple local heuristic, not production OCR.
            Anomaly flags are preliminary indicators for a human, not proof of
            forgery.
          </p>
        </div>
      </section>

      {/* 6. Footer */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb", padding: "14px 32px", fontSize: "0.78rem", color: "#64748b" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            VEDA · SIH problem statement 26261 · Built as an independent demonstration prototype
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/login" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              Institution Portal
            </Link>
            <a href="#how" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              How it works
            </a>
            <a href="#scope" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
