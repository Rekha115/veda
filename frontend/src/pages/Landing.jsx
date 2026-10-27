import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import aicteLogo from "../assets/aicte-logo.png";
import "./Landing.css";

export default function Landing() {
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="veda-landing-container"
      style={{ fontSize: `${fontSizeScale * 100}%` }}
    >
      {/* 1. Slim Top Utility Bar */}
      <section className="veda-landing-topbar" aria-label={t("common.govIndia")}>
        <div className="veda-landing-topbar-inner">
          <div style={{ fontWeight: 600, color: "#1f2937" }}>
            {t("common.govIndia")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="#main-hero" style={{ color: "#4b5563", textDecoration: "none" }}>
              {t("common.skipToContent")}
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
                title={t("common.decreaseFont")}
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
                title={t("common.defaultFont")}
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
                title={t("common.increaseFont")}
              >
                A+
              </button>
            </div>
            <div style={{ display: "inline-flex", gap: 4, color: "#4b5563", alignItems: "center" }}>
              <button
                type="button"
                style={{
                  background: language === "en" ? "#f36b16" : "none",
                  border: language === "en" ? "1px solid #f36b16" : "1px solid transparent",
                  borderRadius: 3,
                  padding: "1px 6px",
                  cursor: "pointer",
                  fontWeight: language === "en" ? 700 : 500,
                  color: language === "en" ? "#ffffff" : "#4b5563",
                  fontSize: "0.76rem",
                }}
                onClick={() => setLanguage("en")}
              >
                {t("common.languageNameEn")}
              </button>
              <span style={{ color: "#9ca3af" }}>|</span>
              <button
                type="button"
                style={{
                  background: language === "hi" ? "#f36b16" : "none",
                  border: language === "hi" ? "1px solid #f36b16" : "1px solid transparent",
                  borderRadius: 3,
                  padding: "1px 6px",
                  cursor: "pointer",
                  fontWeight: language === "hi" ? 700 : 500,
                  color: language === "hi" ? "#ffffff" : "#4b5563",
                  fontSize: "0.76rem",
                }}
                onClick={() => setLanguage("hi")}
              >
                {t("common.languageNameHi")}
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
              alt={t("common.aicteCouncil")}
              style={{ width: 52, height: 52, objectFit: "contain" }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                {t("common.aicteCouncil")}
              </span>
              <span style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 500 }}>
                {t("common.aicteHindi")}
              </span>
              <span style={{ fontSize: "0.78rem", color: "#4b5563" }}>
                {t("common.ministryOfEducation")}
              </span>
            </div>
          </div>

          <nav className="veda-landing-nav-group" aria-label={t("nav.navigation")}>
            <a href="#how" className="veda-landing-nav-link">
              {t("landing.howItWorks")}
            </a>
            <a href="#scope" className="veda-landing-nav-link">
              {t("landing.demoScope")}
            </a>
            <Link className="veda-landing-btn-login" to="/login">
              <span>{t("landing.institutionLogin")}</span>
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
              {t("landing.badge")}
            </span>
            <h1 className="veda-landing-hero-title">
              {t("landing.heroTitle")}
            </h1>
            <p className="veda-landing-hero-desc">
              {t("landing.heroDesc")}
            </p>
            <div className="veda-landing-actions">
              <Link className="veda-landing-btn-primary" to="/login">
                {t("landing.openLogin")}
              </Link>
              <a className="veda-landing-btn-outline" href="#scope">
                {t("landing.whatThisIsNot")}
              </a>
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className="veda-landing-hero-card">
            <div className="veda-landing-card-header">
              <h3 className="veda-landing-card-title">{t("landing.decisionSupportOnly")}</h3>
              <span className="veda-landing-pill-advisory">{t("landing.advisory")}</span>
            </div>
            <p className="veda-landing-card-desc">
              {t("landing.advisoryDesc")}
            </p>
            <ul className="veda-landing-check-list">
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>{t("landing.featureChecklist")}</span>
              </li>
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>{t("landing.featureOcr")}</span>
              </li>
              <li className="veda-landing-check-item">
                <span className="veda-landing-check-icon" aria-hidden="true">✓</span>
                <span>{t("landing.featureEvidence")}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Workflow Steps */}
      <section className="veda-landing-section" id="how">
        <div className="veda-landing-section-header">
          <h2 className="veda-landing-section-title">{t("landing.howWorksTitle")}</h2>
          <p className="veda-landing-section-sub">
            {t("landing.howWorksSub")}
          </p>
        </div>

        <div className="veda-landing-workflow-grid">
          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">1</div>
            <h3 className="veda-landing-step-title">{t("landing.step1Title")}</h3>
            <p className="veda-landing-step-text">
              {t("landing.step1Desc")}
            </p>
          </article>

          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">2</div>
            <h3 className="veda-landing-step-title">{t("landing.step2Title")}</h3>
            <p className="veda-landing-step-text">
              {t("landing.step2Desc")}
            </p>
          </article>

          <article className="veda-landing-step-card">
            <div className="veda-landing-step-num">3</div>
            <h3 className="veda-landing-step-title">{t("landing.step3Title")}</h3>
            <p className="veda-landing-step-text">
              {t("landing.step3Desc")}
            </p>
          </article>
        </div>
      </section>

      {/* 5. Demonstration Scope & Limits */}
      <section className="veda-landing-section" id="scope" style={{ paddingTop: 0 }}>
        <div className="veda-landing-scope-card">
          <h2 className="veda-landing-scope-title">{t("landing.limitsTitle")}</h2>
          <p className="veda-landing-scope-text">
            {t("landing.limitsText")}
          </p>
          <p className="veda-landing-scope-muted">
            {t("landing.limitsMuted")}
          </p>
        </div>
      </section>

      {/* 6. Footer */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb", padding: "14px 32px", fontSize: "0.78rem", color: "#64748b" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            {t("landing.landingFooterNotice")}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/login" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              {t("landing.institutionPortal")}
            </Link>
            <a href="#how" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              {t("landing.howItWorks")}
            </a>
            <a href="#scope" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              {t("landing.disclaimer")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
