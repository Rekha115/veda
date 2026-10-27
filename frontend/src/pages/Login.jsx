import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api";
import aicteLogo from "../assets/aicte-logo.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  // Role and credentials
  const [role, setRole] = useState("institution"); // "institution" | "admin"
  const [username, setUsername] = useState("institute");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Accessibility & language state
  const [fontSizeScale, setFontSizeScale] = useState(1); // 0.92, 1, 1.08
  const [language, setLanguage] = useState("en"); // "en" | "hi"

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
      setError(err.message || "Invalid credentials. Please verify your username and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="veda-login-page"
      style={{ fontSize: `${fontSizeScale * 100}%` }}
    >
      {/* 1. Slim Top Utility Bar */}
      <section className="veda-top-utility-bar" aria-label="National Portal Utilities">
        <div className="veda-top-utility-inner">
          <div className="veda-utility-left">
            Government of India &nbsp;|&nbsp; Ministry of Education
          </div>
          <div className="veda-utility-right">
            <a href="#login-main-card" className="veda-skip-link">
              Skip to main content
            </a>
            <div className="veda-font-controls" aria-label="Font size controls">
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 0.92 ? "active" : ""}`}
                onClick={() => setFontSizeScale(0.92)}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 1 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1)}
                title="Default font size"
              >
                A
              </button>
              <button
                type="button"
                className={`veda-font-btn ${fontSizeScale === 1.08 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1.08)}
                title="Increase font size"
              >
                A+
              </button>
            </div>
            <div className="veda-lang-switch" aria-label="Language options">
              <button
                type="button"
                className={`veda-lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <span className="veda-lang-divider">|</span>
              <button
                type="button"
                className={`veda-lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                हिंदी
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
              alt="Official AICTE Emblem"
              className="veda-aicte-logo"
            />
            <div className="veda-aicte-text">
              <h1 className="veda-aicte-title">
                All India Council for Technical Education
              </h1>
              <span className="veda-aicte-hindi">
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </span>
              <span className="veda-aicte-sub">
                Ministry of Education, Government of India
              </span>
            </div>
          </div>

          <div className="veda-header-right">
            <span className="veda-brand-wordmark">VEDA</span>
            <div className="veda-brand-divider" aria-hidden="true" />
            <span className="veda-brand-subtitle">
              Application validation and document scrutiny platform
            </span>
          </div>
        </div>
      </header>

      {/* Thin orange divider bar */}
      <div className="veda-header-divider" aria-hidden="true" />

      {/* 3. Main Hero Two-Column Section */}
      <main className="veda-main-hero" id="main-content">
        {/* Left Panel - Orange */}
        <section className="veda-left-panel" aria-label="VEDA Information">
          <div className="veda-left-content">
            <h2 className="veda-hero-title">VEDA</h2>
            <h3 className="veda-hero-tagline">
              AI-Powered Application Validation, Document Authentication and Regulatory Compliance Assistance
            </h3>
            <p className="veda-hero-desc">
              VEDA helps institutions prepare AICTE approval-related applications, including
              Extension of Approval (EoA) and other applicable changes. It assists authorised
              reviewers by analysing application information and supporting documents, checking
              them against available institutional records and configurable regulatory
              requirements, and generating evidence-based validation reports.
            </p>

            <ul className="veda-features-list">
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Processes digital and scanned PDFs, JPG and PNG documents using OCR.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Identifies missing information, incomplete or expired documents, and mismatched details.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Checks application information against available authorised institutional records and configurable compliance rules.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Flags potential document alterations, duplicates and anomalies for further verification.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Supports document verification through authorised issuing-authority sources wherever available.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Assists in reviewing infrastructure evidence and identifying cases requiring additional evidence or physical inspection.</span>
              </li>
              <li className="veda-feature-item">
                <span className="veda-check-icon" aria-hidden="true">✓</span>
                <span>Provides application-wise validation status, verification results, alerts and an auditable record of findings.</span>
              </li>
            </ul>

            <div className="veda-left-disclaimer" role="note">
              All automated findings are preliminary and advisory. Statutory scrutiny,
              inspections where required, and final regulatory decisions remain with the
              competent AICTE authorities.
            </div>
          </div>

          {/* Architectural Line Illustration */}
          <div className="veda-building-container" aria-hidden="true">
            <svg
              viewBox="0 0 600 210"
              className="veda-building-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ground plinth lines */}
              <line x1="20" y1="200" x2="580" y2="200" stroke="#111" strokeWidth="1.6" />
              <line x1="50" y1="204" x2="550" y2="204" stroke="#111" strokeWidth="1.2" />

              {/* Left outer wing */}
              <rect x="70" y="155" width="45" height="45" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="65" y1="155" x2="120" y2="155" stroke="#111" strokeWidth="1.6" />

              {/* Left main wing */}
              <rect x="115" y="130" width="75" height="70" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="110" y1="130" x2="195" y2="130" stroke="#111" strokeWidth="2" />
              <rect x="130" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />
              <rect x="157" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />

              {/* Right main wing */}
              <rect x="410" y="130" width="75" height="70" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="405" y1="130" x2="490" y2="130" stroke="#111" strokeWidth="2" />
              <rect x="425" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />
              <rect x="452" y="146" width="18" height="18" fill="none" stroke="#111" strokeWidth="1.5" />

              {/* Right outer wing */}
              <rect x="485" y="155" width="45" height="45" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="480" y1="155" x2="535" y2="155" stroke="#111" strokeWidth="1.6" />

              {/* Central plinth stepped foundation */}
              <line x1="180" y1="196" x2="420" y2="196" stroke="#111" strokeWidth="1.6" />
              <line x1="186" y1="192" x2="414" y2="192" stroke="#111" strokeWidth="1.6" />

              {/* Main colonnade back wall */}
              <rect x="190" y="105" width="220" height="87" fill="none" stroke="#111" strokeWidth="1.6" />

              {/* Entablature beam */}
              <rect x="180" y="98" width="240" height="7" fill="none" stroke="#111" strokeWidth="1.6" />

              {/* Triangular Classical Pediment */}
              <polygon points="300,42 175,98 425,98" fill="none" stroke="#111" strokeWidth="2" />
              <line x1="195" y1="94" x2="405" y2="94" stroke="#111" strokeWidth="1" />

              {/* Flagpole & Mast */}
              <line x1="300" y1="42" x2="300" y2="18" stroke="#111" strokeWidth="2" />
              <rect x="300" y="20" width="22" height="13" fill="#111" />

              {/* 4 Architectural Columns */}
              <rect x="208" y="105" width="6" height="87" fill="none" stroke="#111" strokeWidth="1.4" />
              <rect x="255" y="105" width="6" height="87" fill="none" stroke="#111" strokeWidth="1.4" />
              <rect x="339" y="105" width="6" height="87" fill="none" stroke="#111" strokeWidth="1.4" />
              <rect x="386" y="105" width="6" height="87" fill="none" stroke="#111" strokeWidth="1.4" />

              {/* Central Grand Doorway */}
              <rect x="282" y="142" width="36" height="50" fill="none" stroke="#111" strokeWidth="1.6" />
              <line x1="300" y1="142" x2="300" y2="192" stroke="#111" strokeWidth="1.2" />
            </svg>
          </div>
        </section>

        {/* Right Panel - Cool Grey */}
        <section className="veda-right-panel" aria-label="Sign In Section">
          <div className="veda-login-container">
            {/* White Login Card */}
            <div className="veda-card" id="login-main-card">
              <h2 className="veda-card-heading">Sign in to VEDA</h2>
              <p className="veda-card-subtext">
                Use the credentials issued to your institution or review office.
              </p>

              {/* Role Selector */}
              <div className="veda-role-selector" role="tablist" aria-label="User Role Selection">
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === "institution"}
                  className={`veda-role-tab ${role === "institution" ? "active" : ""}`}
                  onClick={() => handleRoleChange("institution")}
                >
                  Institution User
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === "admin"}
                  className={`veda-role-tab ${role === "admin" ? "active" : ""}`}
                  onClick={() => handleRoleChange("admin")}
                >
                  Admin / Reviewer
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
                    Email or username
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
                        ? "name@institution.edu.in"
                        : "admin"
                    }
                    required
                  />
                </div>

                <div className="veda-form-group">
                  <label htmlFor="password" className="veda-form-label">
                    Password
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
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="veda-show-hide-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
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
                    Remember me on this device
                  </label>

                  <button
                    type="button"
                    className="veda-link-inline"
                    onClick={() =>
                      setModalInfo({
                        title: "Password Assistance",
                        body:
                          "In this demonstration prototype, demo credentials are pre-configured:\n\n• Institution: username 'institute', password 'demo123'\n• Admin / Reviewer: username 'admin', password 'demo123'\n\nIn a production environment, password resets are processed via registered institutional nodal email or the AICTE National Helpdesk.",
                      })
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="veda-btn-login"
                  disabled={busy}
                >
                  {busy ? "Signing in…" : "Login"}
                </button>
              </form>

              {/* Secondary links below Login button */}
              <div className="veda-card-secondary-links">
                <div>
                  New institution?{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setModalInfo({
                        title: "Institutional Registration Request",
                        body:
                          "This portal prototype is pre-loaded with demonstration institutions. Authorized institutions seeking AICTE portal access should apply through official AICTE onboarding notifications.",
                      })
                    }
                  >
                    Request an account
                  </button>
                </div>
                <div>
                  Unable to sign in?{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setModalInfo({
                        title: "Account Assistance & Support",
                        body:
                          "For technical support during demonstration evaluation, please ensure you use either:\n\n1. Role 'Institution User': institute / demo123\n2. Role 'Admin / Reviewer': admin / demo123",
                      })
                    }
                  >
                    Account assistance
                  </button>
                </div>
              </div>
            </div>

            {/* Demonstration prototype notice box */}
            <div className="veda-demo-notice-box" role="note">
              <strong>Demonstration prototype.</strong> Sign-in is a mock integration
              and all data shown in VEDA is demo data. Do not enter real credentials.
            </div>
          </div>
        </section>
      </main>

      {/* 4. Slim White Footer */}
      <footer className="veda-footer" role="contentinfo">
        <div className="veda-footer-inner">
          <div className="veda-footer-disclaimer">
            VEDA is a demonstration prototype and is not an official AICTE or Government
            of India service. Automated checks are preliminary; final decisions rest
            with authorised human reviewers.
          </div>
          <nav className="veda-footer-links" aria-label="Portal Policies and Support">
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Help & Support",
                  body:
                    "VEDA is designed to assist technical institutions and AICTE scrutiny committees in reviewing compliance documents, floor plans, faculty registrations, and land norms automatically via OCR and cross-referencing.",
                })
              }
            >
              Help
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Accessibility Statement",
                  body:
                    "This interface adheres to GIGW (Guidelines for Indian Government Websites) accessibility standards, supporting screen readers, keyboard navigation, and variable font scaling (A- / A / A+).",
                })
              }
            >
              Accessibility
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Privacy Policy",
                  body:
                    "All uploaded files, test applications, and sample records in this prototype are processed locally within the demo environment for testing purposes only.",
                })
              }
            >
              Privacy
            </button>
            <button
              type="button"
              className="veda-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Disclaimer",
                  body:
                    "VEDA is a technical prototype developed for demonstration purposes. It does not replace statutory AICTE approvals or physical inspections required by law.",
                })
              }
            >
              Disclaimer
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
