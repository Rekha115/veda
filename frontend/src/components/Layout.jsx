import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { clearSession, getToken, getUser } from "../api";
import aicteLogo from "../assets/aicte-logo.png";
import "./Layout.css";

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Accessibility & language state
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [language, setLanguage] = useState("en");

  // Informational modal for shell links
  const [modalInfo, setModalInfo] = useState(null);

  async function logout() {
    const token = getToken();
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Sign out locally even if the API is unreachable.
    }
    clearSession();
    navigate("/");
  }

  return (
    <div
      className="veda-app-shell"
      style={{ fontSize: `${fontSizeScale * 100}%` }}
    >
      {/* 1. Slim Top Utility Bar */}
      <section className="veda-shell-topbar" aria-label="National Portal Utilities">
        <div className="veda-shell-topbar-inner">
          <div className="veda-shell-utility-left">
            Government of India &nbsp;|&nbsp; Ministry of Education
          </div>
          <div className="veda-shell-utility-right">
            <a href="#main-content" className="veda-shell-skip-link">
              Skip to main content
            </a>
            <div className="veda-shell-font-controls" aria-label="Font size controls">
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 0.92 ? "active" : ""}`}
                onClick={() => setFontSizeScale(0.92)}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 1 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1)}
                title="Default font size"
              >
                A
              </button>
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 1.08 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1.08)}
                title="Increase font size"
              >
                A+
              </button>
            </div>
            <div className="veda-shell-lang-switch" aria-label="Language options">
              <button
                type="button"
                className={`veda-shell-lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <span style={{ color: "#9ca3af" }}>|</span>
              <button
                type="button"
                className={`veda-shell-lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Institutional Header */}
      <header className="veda-shell-header" role="banner">
        <div className="veda-shell-header-inner">
          <NavLink to="/dashboard" className="veda-shell-header-left">
            <img
              src={aicteLogo}
              alt="Official AICTE Emblem"
              className="veda-shell-aicte-logo"
            />
            <div className="veda-shell-aicte-text">
              <h1 className="veda-shell-aicte-title">
                All India Council for Technical Education
              </h1>
              <span className="veda-shell-aicte-hindi">
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </span>
              <span className="veda-shell-aicte-sub">
                Ministry of Education, Government of India
              </span>
            </div>
          </NavLink>

          <div className="veda-shell-header-right">
            <div className="veda-shell-brand-group">
              <span className="veda-shell-brand-wordmark">VEDA</span>
              <div className="veda-shell-brand-divider" aria-hidden="true" />
              <span className="veda-shell-brand-sub">
                Application validation and scrutiny
              </span>
            </div>

            {/* Notification & User Profile */}
            <div className="veda-shell-user-actions">
              <button
                type="button"
                className="veda-shell-icon-btn"
                title="Notifications"
                onClick={() =>
                  setModalInfo({
                    title: "Institutional Notifications",
                    body:
                      "• Demo EoA 2026-27 validation report generated.\n• Land and infrastructure documents pending review.\n• AICTE Approval Process Handbook (APH 2026-27) norms active.",
                  })
                }
                aria-label="View notifications"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="veda-shell-notification-badge" aria-hidden="true" />
              </button>

              <div className="veda-shell-user-info">
                <span className="veda-shell-user-name">
                  {user?.displayName || "Institution User"}
                </span>
                <span className="veda-shell-user-role">
                  {user?.role === "admin" ? "Review Officer" : "Institutional Nodal Officer"}
                </span>
              </div>

              <button
                type="button"
                className="veda-shell-signout-btn"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Saffron/Orange Accent Bar */}
      <div className="veda-shell-divider-bar" aria-hidden="true" />

      {/* Demonstration Prototype Notice Banner */}
      <div className="veda-shell-prototype-banner" role="status">
        <strong>Demonstration prototype:</strong> Not an official AICTE or Government of India service. Automated checks are preliminary and require human verification.
      </div>

      {/* 3. Main Workspace Shell: Sidebar + Content */}
      <div className="veda-shell-body">
        {/* Left Sidebar */}
        <aside className="veda-shell-sidebar" aria-label="Portal Navigation">
          <nav className="veda-sidebar-nav">
            <div className="veda-sidebar-section-title">Navigation</div>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `veda-sidebar-link ${isActive ? "active" : ""}`
              }
              end
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/applications/new"
              className={({ isActive }) =>
                `veda-sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>New Application</span>
            </NavLink>

            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `veda-sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <svg
                  className="veda-sidebar-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Admin Review</span>
              </NavLink>
            )}

            <div className="veda-sidebar-section-title" style={{ marginTop: 12 }}>
              Resources
            </div>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: "Institutional Document Library",
                  body:
                    "Supported document categories for AICTE compliance scrutiny:\n\n1. Previous Extension of Approval (EoA) letter\n2. Land / Building ownership deed & affidavit\n3. Approved building plan & municipal approval\n4. Fire safety NOC from competent state authority\n5. Faculty list with qualification degrees\n6. University affiliation & syllabus confirmation",
                })
              }
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>Documents</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: "Scrutiny & Validation Reports",
                  body:
                    "VEDA automated scrutiny reports compile OCR text extraction, regulatory rule matching (APH 2026-27), faculty ratio calculations, and land adequacy flags.\n\nSelect an application in your Recent Applications table to inspect full validation reports.",
                })
              }
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Reports</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: "AICTE Approval Process Guidelines",
                  body:
                    "AICTE Approval Process Handbook (APH) Reference:\n\n• Extension of Approval (EoA) Clause 1.4\n• Land and Building Norms: Table 4.1\n• Student-Faculty Ratio: 1:15 for UG Engineering\n• Fire and Structural Safety Certificates mandatory before statutory scrutiny committee meetings.",
                })
              }
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Guidelines</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: "Help & Technical Support",
                  body:
                    "VEDA Help Desk:\n\n• For prototype assistance: test demo credentials (institute / demo123)\n• For application support: refer to the AICTE National Portal guidelines\n• Scrutiny findings represent automated assistance for committee members.",
                })
              }
            >
              <svg
                className="veda-sidebar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Help</span>
            </button>
          </nav>

          {/* Demonstration Notice Box at bottom of sidebar */}
          <div className="veda-sidebar-bottom-box">
            <strong>Demonstration Data</strong>
            Connected to demo register ({user?.instituteCode || "INST-2024-001"}). All applications are simulated.
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="veda-shell-main" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* 4. Slim White Footer */}
      <footer className="veda-shell-footer" role="contentinfo">
        <div className="veda-shell-footer-inner">
          <div className="veda-shell-footer-disclaimer">
            VEDA is a demonstration prototype and is not an official AICTE or Government
            of India service. Automated checks are preliminary; final decisions rest
            with authorised human reviewers.
          </div>
          <nav className="veda-shell-footer-links" aria-label="Portal Policies">
            <button
              type="button"
              className="veda-shell-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Help & Documentation",
                  body:
                    "VEDA provides institutional users with assisted application preparation, checking uploaded certificates and floor plans against AICTE regulatory norms.",
                })
              }
            >
              Help
            </button>
            <button
              type="button"
              className="veda-shell-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Accessibility Standards",
                  body:
                    "VEDA complies with GIGW (Guidelines for Indian Government Websites) accessibility guidelines, supporting scalable typography and screen readers.",
                })
              }
            >
              Accessibility
            </button>
            <button
              type="button"
              className="veda-shell-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Privacy Statement",
                  body:
                    "In this demonstration prototype, test data and sample PDF documents are processed in local session memory and are not shared externally.",
                })
              }
            >
              Privacy
            </button>
            <button
              type="button"
              className="veda-shell-footer-link"
              onClick={() =>
                setModalInfo({
                  title: "Disclaimer",
                  body:
                    "This system is an AI-assisted scrutiny tool developed for demonstration purposes. Official approvals are issued exclusively by AICTE statutory bodies.",
                })
              }
            >
              Disclaimer
            </button>
          </nav>
        </div>
      </footer>

      {/* Informational Modal */}
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
