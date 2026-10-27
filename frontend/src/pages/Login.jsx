import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api";
import { useLanguage } from "../context/LanguageContext";
import aicteLogo from "../assets/aicte-logo.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  // Role and credentials
  const [role, setRole] = useState("institution"); // "institution" | "admin"
  const [username, setUsername] = useState("institute");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Accessibility font scaling
  const [fontSizeScale, setFontSizeScale] = useState(1); // 0.92, 1, 1.08

  // Informational modals for auxiliary actions
  const [modalInfo, setModalInfo] = useState(null);

  function handleRoleChange(newRole) {
    setRole(newRole);
    setError("");
    if (newRole === "institution") {
      setUsername("institute");
      setPassword("demo123");
    } else {
      setUsername("admin");
      setPassword("demo123");
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setSession(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message || t("login.invalidCredentials"));
    } finally {
      setBusy(false);
    }
  }

  const featuresList = t("login.features");

  return (
    <div
      className="veda-login-page"
      style={{ fontSize: `${fontSizeScale * 100}%` }}
    >
      {/* 1. Slim Top Utility Bar */}
      <section className="veda-top-utility-bar" aria-label={t("common.govIndia")}>
        <div className="veda-top-utility-inner">
          <div className="veda-utility-left">
            {t("common.govIndia")}
          </div>
          <div className="veda-utility-right">
            <a href="#login-main-card" className="veda-skip-link">
              {t("common.skipToContent")}
            </a>
            <div className="veda-font-controls" aria-label={t("common.fontSizeControls")}>
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 0.92 ? "active" : ""}`}
                onClick={() => setFontSizeScale(0.92)}
                title={t("common.decreaseFont")}
              >
                A-
              </button>
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 1 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1)}
                title={t("common.defaultFont")}
              >
                A
              </button>
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 1.08 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1.08)}
                title={t("common.increaseFont")}
              >
                A+
              </button>
            </div>
            <div className="veda-lang-switch" aria-label={t("common.switchLanguageAria")}>
              <button
                type="button"
                className={`veda-lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                {t("common.languageNameEn")}
              </button>
              <span className="veda-lang-divider">|</span>
              <button
                type="button"
                className={`veda-lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                {t("common.languageNameHi")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Institutional Header */}
      <header className="veda-header" role="banner">
        <div className="veda-header-inner">
          <div className="veda-header-left">
            <img
              src={aicteLogo}
              alt={t("common.aicteCouncil")}
              className="veda-aicte-logo"
            />
            <div className="veda-aicte-text">
              <h1 className="veda-aicte-title">
                {t("common.aicteCouncil")}
              </h1>
              <span className="veda-aicte-hindi">
                {t("common.aicteHindi")}
              </span>
              <span className="veda-aicte-sub">
                {t("common.ministryOfEducation")}
              </span>
            </div>
          </div>

          <div className="veda-header-right">
            <span className="veda-brand-wordmark">{t("common.vedaWordmark")}</span>
            <div className="veda-brand-divider" aria-hidden="true" />
            <span className="veda-brand-subtitle">
              {t("common.vedaTaglineLong")}
            </span>
          </div>
        </div>
      </header>

      {/* Thin orange divider bar */}
      <div className="veda-header-divider" aria-hidden="true" />

      {/* 3. Main Hero Two-Column Section */}
      <main className="veda-main-hero" id="main-content">
        {/* Left Panel - Orange */}
        <section className="veda-left-panel" aria-label={t("login.heroTitle")}>
          <div className="veda-left-content">
            <h2 className="veda-hero-title">{t("login.heroTitle")}</h2>
            <h3 className="veda-hero-tagline">
              {t("login.heroTagline")}
            </h3>
            <p className="veda-hero-desc">
              {t("login.heroDesc")}
            </p>

            <ul className="veda-features-list">
              {Array.isArray(featuresList) &&
                featuresList.map((feature, idx) => (
                  <li key={idx} className="veda-feature-item">
                    <span className="veda-check-icon" aria-hidden="true">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
            </ul>

            <div className="veda-left-disclaimer" role="note">
              {t("login.advisoryNote")}
            </div>
          </div>

          {/* Architectural Line Illustration */}
          <div className="veda-building-container" aria-hidden="true">
            <svg
              viewBox="0 0 600 210"
              className="veda-building-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="20" y1="200" x2="580" y2="200" stroke="#111" strokeWidth="1.6" />
              <line x1="50" y1="204" x2="550" y2="204" stroke="#111" strokeWidth="1.2" />

              <rect x="70" y="155" width="45" height="45" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="65" y1="155" x2="120" y2="155" stroke="#111" strokeWidth="1.6" />

              <rect x="115" y="130" width="75" height="70" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="110" y1="130" x2="195" y2="130" stroke="#111" strokeWidth="2" />
              <rect x="130" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />
              <rect x="157" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />

              <rect x="410" y="130" width="75" height="70" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="405" y1="130" x2="490" y2="130" stroke="#111" strokeWidth="2" />
              <rect x="425" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />
              <rect x="452" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />

              <rect x="485" y="155" width="45" height="45" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="480" y1="155" x2="535" y2="155" stroke="#111" strokeWidth="1.6" />

              <line x1="180" y1="196" x2="420" y2="196" stroke="#111" strokeWidth="1.6" />
              <line x1="186" y1="192" x2="414" y2="192" stroke="#111" strokeWidth="1.6" />

              <rect x="190" y="105" width="220" height="87" fill="none" stroke="#111" strokeWidth="1.6" />
              <rect x="180" y="98" width="240" height="7" fill="none" stroke="#111" strokeWidth="1.6" />
              <polygon points="300,42 175,98 425,98" fill="none" stroke="#111" strokeWidth="2" />
              <polygon points="300,56 195,95 405,95" fill="none" stroke="#111" strokeWidth="1.2" />

              <circle cx="300" cy="78" r="9" fill="none" stroke="#111" strokeWidth="1.4" />
              <circle cx="300" cy="78" r="4.5" fill="none" stroke="#111" strokeWidth="1" />

              <line x1="210" y1="105" x2="210" y2="192" stroke="#111" strokeWidth="2" />
              <line x1="235" y1="105" x2="235" y2="192" stroke="#111" strokeWidth="2" />
              <line x1="260" y1="105" x2="260" y2="192" stroke="#111" strokeWidth="2" />
              <line x1="340" y1="105" x2="340" y2="192" stroke="#111" strokeWidth="2" />
              <line x1="365" y1="105" x2="365" y2="192" stroke="#111" strokeWidth="2" />
              <line x1="390" y1="105" x2="390" y2="192" stroke="#111" strokeWidth="2" />

              <path d="M 285 192 A 15 15 0 0 1 315 192 Z" fill="none" stroke="#111" strokeWidth="1.8" />
              <line x1="300" y1="177" x2="300" y2="192" stroke="#111" strokeWidth="1.2" />

              <rect x="204" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />
              <rect x="229" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />
              <rect x="254" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />
              <rect x="334" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />
              <rect x="359" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />
              <rect x="384" y="188" width="12" height="4" fill="none" stroke="#111" strokeWidth="1.2" />

              <line x1="290" y1="42" x2="310" y2="42" stroke="#111" strokeWidth="1.6" />
              <line x1="300" y1="42" x2="300" y2="28" stroke="#111" strokeWidth="1.8" />
              <polygon points="300,28 318,34 300,40" fill="none" stroke="#111" strokeWidth="1.2" />
            </svg>
          </div>
        </section>

        {/* Right Panel - Grey background with white Login Card */}
        <section className="veda-right-panel" aria-label={t("login.portalHeading")}>
          <div className="veda-card-wrapper" id="login-main-card">
            <div className="veda-login-card">
              <h2 className="veda-card-heading">
                {t("login.portalHeading")}
              </h2>

              {/* Role Selector */}
              <div className="veda-role-selector" role="tablist" aria-label={t("login.portalHeading")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === "institution"}
                  className={`veda-role-tab ${role === "institution" ? "active" : ""}`}
                  onClick={() => handleRoleChange("institution")}
                >
                  {t("login.roleInstitution")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === "admin"}
                  className={`veda-role-tab ${role === "admin" ? "active" : ""}`}
                  onClick={() => handleRoleChange("admin")}
                >
                  {t("login.roleAdmin")}
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={submit} noValidate>
                {error && (
                  <div className="veda-alert-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="veda-form-group">
                  <label htmlFor="username" className="veda-form-label">
                    {t("login.emailOrUsername")}
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className="veda-input-text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      role === "institution"
                        ? t("login.emailPlaceholderInst")
                        : t("login.emailPlaceholderAdmin")
                    }
                    required
                  />
                </div>

                <div className="veda-form-group">
                  <label htmlFor="password" className="veda-form-label">
                    {t("login.password")}
                  </label>
                  <div className="veda-password-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="veda-input-text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("login.passwordPlaceholder")}
                      required
                    />
                    <button
                      type="button"
                      className="veda-show-hide-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t("login.hide") : t("login.show")}
                    >
                      {showPassword ? t("login.hide") : t("login.show")}
                    </button>
                  </div>
                </div>

                <div className="veda-form-options">
                  <label className="veda-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    {t("login.rememberMe")}
                  </label>

                  <button
                    type="button"
                    className="veda-link-inline"
                    onClick={() =>
                      setModalInfo({
                        title: t("modals.passwordHelpTitle"),
                        body: t("modals.passwordHelpBody"),
                      })
                    }
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>

                <button
                  type="submit"
                  className="veda-btn-login"
                  disabled={busy}
                >
                  {busy ? t("login.signingIn") : t("login.loginBtn")}
                </button>
              </form>

              {/* Secondary links below Login button */}
              <div className="veda-card-secondary-links">
                <div>
                  {t("login.newInstitution")}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setModalInfo({
                        title: t("modals.regRequestTitle"),
                        body: t("modals.regRequestBody"),
                      })
                    }
                  >
                    {t("login.requestAccount")}
                  </button>
                </div>
                <div>
                  {t("login.unableToSignIn")}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setModalInfo({
                        title: t("modals.accountAssistTitle"),
                        body: t("modals.accountAssistBody"),
                      })
                    }
                  >
                    {t("login.accountAssistance")}
                  </button>
                </div>
              </div>
            </div>

            {/* Demonstration prototype notice box */}
            <div className="veda-demo-notice-box" role="note">
              <strong>{language === "hi" ? "प्रदर्शन प्रोटोटाइप। " : "Demonstration prototype. "}</strong>
              {t("common.demoNoticeBox")}
            </div>
          </div>
        </section>
      </main>

      {/* 4. Slim White Footer */}
      <footer className="veda-footer" role="contentinfo">
        <div className="veda-footer-inner">
          <div className="veda-footer-disclaimer">
            {t("common.footerDisclaimer")}
          </div>
          <nav className="veda-footer-links" aria-label={t("common.portalPolicies")}>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.helpTitle"),
                  body: t("modals.helpBody"),
                })
              }
            >
              {t("common.help")}
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.guidelinesTitle"),
                  body: t("modals.guidelinesBody"),
                })
              }
            >
              {t("common.guidelines")}
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.privacyTitle"),
                  body: t("modals.privacyBody"),
                })
              }
            >
              {t("common.privacyPolicy")}
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: t("landing.limitsTitle"),
                  body: t("landing.limitsText"),
                })
              }
            >
              {t("landing.disclaimer")}
            </button>
          </nav>
        </div>
      </footer>

      {/* Auxiliary Help / Policy Modal */}
      {modalInfo && (
        <div
          className="veda-modal-backdrop"
          onClick={() => setModalInfo(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="veda-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="veda-modal-title">{modalInfo.title}</h3>
            <div
              className="veda-modal-body"
              style={{ whiteSpace: "pre-line" }}
            >
              {modalInfo.body}
            </div>
            <button
              type="button"
              className="veda-modal-close-btn"
              onClick={() => setModalInfo(null)}
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
