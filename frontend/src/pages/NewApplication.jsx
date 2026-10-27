import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";
import "./NewApplication.css";

export default function NewApplication() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    instituteName: "Bharat Institute of Technology",
    category: "EOA",
    academicYear: "2026-27",
    contactName: "Dr. Meera Sharma",
    contactEmail: "registrar@bit-jaipur.demo",
    claimedFacultyCount: 40,
    claimedIntakeCse: 180,
    claimedIntakeEce: 60,
    claimsNba: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate(`/applications/${data.application.id}/upload`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="veda-form-page-container">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label={t("nav.navigation")} style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("common.home")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("newApp.breadcrumbApplications")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">{t("newApp.breadcrumbCurrent")}</span>
      </nav>

      {/* Page Header */}
      <div className="veda-page-header-block">
        <h1 className="veda-page-main-title">{t("newApp.title")}</h1>
        <p className="veda-page-lead-desc">
          {t("newApp.leadDesc")}
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "0.86rem",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <form className="veda-form-card" onSubmit={submit} noValidate>
        {/* Section 1: Institutional & Application Particulars */}
        <div className="veda-form-section">
          <h2 className="veda-section-heading">
            <span className="veda-section-heading-icon" aria-hidden="true">🏛️</span>
            <span>{t("newApp.sec1Title")}</span>
          </h2>

          <div className="veda-form-grid-2">
            <div className="veda-field-group">
              <label htmlFor="instituteName" className="veda-field-label">
                {t("newApp.instituteName")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="instituteName"
                className="veda-field-input"
                value={form.instituteName}
                onChange={(e) => set("instituteName", e.target.value)}
                required
              />
              <span className="veda-field-hint">{t("newApp.instituteNameHint")}</span>
            </div>

            <div className="veda-field-group">
              <label htmlFor="category" className="veda-field-label">
                {t("newApp.category")} <span className="veda-field-label-req">*</span>
              </label>
              <select
                id="category"
                className="veda-field-select"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="EOA">{t("common.categories.EOA")}</option>
                <option value="NEW_COURSE">{t("common.categories.NEW_COURSE")}</option>
                <option value="INTAKE_INCREASE">{t("common.categories.INTAKE_INCREASE")}</option>
              </select>
            </div>

            <div className="veda-field-group">
              <label htmlFor="academicYear" className="veda-field-label">
                {t("newApp.academicYear")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="academicYear"
                className="veda-field-input"
                value={form.academicYear}
                onChange={(e) => set("academicYear", e.target.value)}
                placeholder={t("newApp.academicYearPlaceholder")}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Authorized Nodal Contact */}
        <div className="veda-form-section">
          <h2 className="veda-section-heading">
            <span className="veda-section-heading-icon" aria-hidden="true">👤</span>
            <span>{t("newApp.sec2Title")}</span>
          </h2>

          <div className="veda-form-grid-2">
            <div className="veda-field-group">
              <label htmlFor="contactName" className="veda-field-label">
                {t("newApp.contactName")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="contactName"
                className="veda-field-input"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                required
              />
            </div>

            <div className="veda-field-group">
              <label htmlFor="contactEmail" className="veda-field-label">
                {t("newApp.contactEmail")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                className="veda-field-input"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Claimed Institutional Capacity */}
        <div className="veda-form-section">
          <h2 className="veda-section-heading">
            <span className="veda-section-heading-icon" aria-hidden="true">📊</span>
            <span>{t("newApp.sec3Title")}</span>
          </h2>

          <div className="veda-form-grid-3">
            <div className="veda-field-group">
              <label htmlFor="claimedFacultyCount" className="veda-field-label">
                {t("newApp.claimedFacultyCount")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="claimedFacultyCount"
                type="number"
                className="veda-field-input"
                value={form.claimedFacultyCount}
                onChange={(e) => set("claimedFacultyCount", e.target.value)}
                required
              />
              <span className="veda-field-hint">{t("newApp.claimedFacultyHint")}</span>
            </div>

            <div className="veda-field-group">
              <label htmlFor="claimedIntakeCse" className="veda-field-label">
                {t("newApp.claimedIntakeCse")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="claimedIntakeCse"
                type="number"
                className="veda-field-input"
                value={form.claimedIntakeCse}
                onChange={(e) => set("claimedIntakeCse", e.target.value)}
                required
              />
            </div>

            <div className="veda-field-group">
              <label htmlFor="claimedIntakeEce" className="veda-field-label">
                {t("newApp.claimedIntakeEce")} <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="claimedIntakeEce"
                type="number"
                className="veda-field-input"
                value={form.claimedIntakeEce}
                onChange={(e) => set("claimedIntakeEce", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Statutory Accreditation Declaration */}
        <div className="veda-form-section">
          <h2 className="veda-section-heading">
            <span className="veda-section-heading-icon" aria-hidden="true">📜</span>
            <span>{t("newApp.sec4Title")}</span>
          </h2>

          <div className="veda-declaration-box">
            <input
              id="claimsNba"
              type="checkbox"
              className="veda-declaration-checkbox"
              checked={form.claimsNba}
              onChange={(e) => set("claimsNba", e.target.checked)}
            />
            <label htmlFor="claimsNba" className="veda-declaration-text">
              <strong>{t("newApp.nbaCheckboxTitle")}:</strong> {t("newApp.nbaCheckboxDesc")}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="veda-form-actions-bar">
          <Link to="/dashboard" className="veda-btn-cancel">
            {t("common.cancel")}
          </Link>
          <button className="veda-btn-submit-primary" type="submit" disabled={busy}>
            {busy ? t("newApp.saving") : t("newApp.saveAndProceed")}
          </button>
        </div>
      </form>
    </div>
  );
}
