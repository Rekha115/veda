import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { clearSession, getToken, getUser } from "../api";
import { useLanguage } from "../context/LanguageContext";
import aicteLogo from "../assets/aicte-logo.png";
import "./Layout.css";

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // Accessibility font scaling
  const [fontSizeScale, setFontSizeScale] = useState(1);

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
      <section className="veda-shell-topbar" aria-label={t("common.govIndia")}>
        <div className="veda-shell-topbar-inner">
          <div className="veda-shell-utility-left">
            {t("common.govIndia")}
          </div>
          <div className="veda-shell-utility-right">
            <a href="#main-content" className="veda-shell-skip-link">
              {t("common.skipToContent")}
            </a>
            <div className="veda-shell-font-controls" aria-label={t("common.fontSizeControls")}>
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 0.92 ? "active" : ""}`}
                onClick={() => setFontSizeScale(0.92)}
                title={t("common.decreaseFont")}
              >
                A-
              </button>
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 1 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1)}
                title={t("common.defaultFont")}
              >
                A
              </button>
              <button
                type="button"
                className={`veda-shell-font-btn ${fontSizeScale === 1.08 ? "active" : ""}`}
                onClick={() => setFontSizeScale(1.08)}
                title={t("common.increaseFont")}
              >
                A+
              </button>
            </div>
            <div className="veda-shell-lang-switch" aria-label={t("common.switchLanguageAria")}>
              <button
                type="button"
                className={`veda-shell-lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                {t("common.languageNameEn")}
              </button>
              <span style={{ color: "#9ca3af" }}>|</span>
              <button
                type="button"
                className={`veda-shell-lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                {t("common.languageNameHi")}
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
              alt={t("common.aicteCouncil")}
              className="veda-shell-aicte-logo"
            />
            <div className="veda-shell-aicte-text">
              <h1 className="veda-shell-aicte-title">
                {t("common.aicteCouncil")}
              </h1>
              <span className="veda-shell-aicte-hindi">
                {t("common.aicteHindi")}
              </span>
              <span className="veda-shell-aicte-sub">
                {t("common.ministryOfEducation")}
              </span>
            </div>
          </NavLink>

          <div className="veda-shell-header-right">
            <div className="veda-shell-brand-group">
              <span className="veda-shell-brand-wordmark">{t("common.vedaWordmark")}</span>
              <div className="veda-shell-brand-divider" aria-hidden="true" />
              <span className="veda-shell-brand-sub">
                {t("common.vedaTagline")}
              </span>
            </div>

            {/* Notification & User Profile */}
            <div className="veda-shell-user-actions">
              <button
                type="button"
                className="veda-shell-icon-btn"
                title={t("common.notifications")}
                onClick={() =>
                  setModalInfo({
                    title: t("modals.notificationsTitle"),
                    body: t("modals.notificationsBody"),
                  })
                }
                aria-label={t("common.notifications")}
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
                  {user?.displayName || t("nav.defaultUser")}
                </span>
                <span className="veda-shell-user-role">
                  {user?.role === "admin" ? t("nav.roleAdmin") : t("nav.roleInstitution")}
                </span>
              </div>

              <button
                type="button"
                className="veda-shell-signout-btn"
                onClick={logout}
              >
                {t("common.signOut")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Saffron/Orange Accent Bar */}
      <div className="veda-shell-divider-bar" aria-hidden="true" />

      {/* Demonstration Prototype Notice Banner */}
      <div className="veda-shell-prototype-banner" role="status">
        <strong>{language === "hi" ? "प्रदर्शन प्रोटोटाइप: " : "Demonstration prototype: "}</strong>
        {t("common.prototypeBanner")}
      </div>

      {/* 3. Main Workspace Shell: Sidebar + Content */}
      <div className="veda-shell-body">
        {/* Left Sidebar */}
        <aside className="veda-shell-sidebar" aria-label={t("nav.navigation")}>
          <nav className="veda-sidebar-nav">
            <div className="veda-sidebar-section-title">{t("nav.navigation")}</div>

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
              <span>{t("nav.dashboard")}</span>
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
              <span>{t("nav.newApplication")}</span>
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
                <span>{t("nav.adminReview")}</span>
              </NavLink>
            )}

            <div className="veda-sidebar-section-title" style={{ marginTop: 12 }}>
              {t("nav.resources")}
            </div>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.documentsTitle"),
                  body: t("modals.documentsBody"),
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
              <span>{t("nav.documents")}</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.reportsTitle"),
                  body: t("modals.reportsBody"),
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
              <span>{t("nav.reports")}</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.guidelinesTitle"),
                  body: t("modals.guidelinesBody"),
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
              <span>{t("nav.guidelines")}</span>
            </button>

            <button
              type="button"
              className="veda-sidebar-link"
              onClick={() =>
                setModalInfo({
                  title: t("modals.helpTitle"),
                  body: t("modals.helpBody"),
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
              <span>{t("nav.help")}</span>
            </button>
          </nav>

          {/* Demonstration Notice Box at bottom of sidebar */}
          <div className="veda-sidebar-bottom-box">
            <strong>{t("nav.demoDataTitle")}</strong>
            {t("nav.demoDataDesc", { code: user?.instituteCode || "INST-2024-001" })}
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
            {t("common.footerDisclaimer")}
          </div>
          <nav className="veda-shell-footer-links" aria-label={t("common.portalPolicies")}>
            <button
              type="button"
              className="veda-shell-footer-link"
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
              className="veda-shell-footer-link"
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
              className="veda-shell-footer-link"
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
              className="veda-shell-footer-link"
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
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
