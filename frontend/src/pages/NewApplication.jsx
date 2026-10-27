import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import "./NewApplication.css";

export default function NewApplication() {
  const navigate = useNavigate();
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
      <nav className="veda-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">Home</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">Applications</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">New Application</span>
      </nav>

      {/* Page Header */}
      <div className="veda-page-header-block">
        <h1 className="veda-page-main-title">New Approval Application</h1>
        <p className="veda-page-lead-desc">
          File details for Extension of Approval (EoA), New Course, or Intake Increase.
          Default values include test parameters to verify automated regulatory scrutiny checks.
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
            <span>1. Institutional & Application Details</span>
          </h2>

          <div className="veda-form-grid-2">
            <div className="veda-field-group">
              <label htmlFor="instituteName" className="veda-field-label">
                Institute name <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="instituteName"
                className="veda-field-input"
                value={form.instituteName}
                onChange={(e) => set("instituteName", e.target.value)}
                required
              />
              <span className="veda-field-hint">Must match institutional records</span>
            </div>

            <div className="veda-field-group">
              <label htmlFor="category" className="veda-field-label">
                Application category <span className="veda-field-label-req">*</span>
              </label>
              <select
                id="category"
                className="veda-field-select"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="EOA">Extension of Approval (EoA)</option>
                <option value="NEW_COURSE">New Course / Programme Addition</option>
                <option value="INTAKE_INCREASE">Intake Capacity Increase</option>
              </select>
            </div>

            <div className="veda-field-group">
              <label htmlFor="academicYear" className="veda-field-label">
                Academic year <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="academicYear"
                className="veda-field-input"
                value={form.academicYear}
                onChange={(e) => set("academicYear", e.target.value)}
                placeholder="2026-27"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Authorized Nodal Contact */}
        <div className="veda-form-section">
          <h2 className="veda-section-heading">
            <span className="veda-section-heading-icon" aria-hidden="true">👤</span>
            <span>2. Authorized Nodal Officer Contact</span>
          </h2>

          <div className="veda-form-grid-2">
            <div className="veda-field-group">
              <label htmlFor="contactName" className="veda-field-label">
                Contact officer name <span className="veda-field-label-req">*</span>
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
                Official contact email <span className="veda-field-label-req">*</span>
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
            <span>3. Claimed Institutional Capacity & Faculty Metrics</span>
          </h2>

          <div className="veda-form-grid-3">
            <div className="veda-field-group">
              <label htmlFor="claimedFacultyCount" className="veda-field-label">
                Claimed faculty count <span className="veda-field-label-req">*</span>
              </label>
              <input
                id="claimedFacultyCount"
                type="number"
                className="veda-field-input"
                value={form.claimedFacultyCount}
                onChange={(e) => set("claimedFacultyCount", e.target.value)}
                required
              />
              <span className="veda-field-hint">Validated against faculty list OCR</span>
            </div>

            <div className="veda-field-group">
              <label htmlFor="claimedIntakeCse" className="veda-field-label">
                Claimed CSE intake <span className="veda-field-label-req">*</span>
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
                Claimed ECE intake <span className="veda-field-label-req">*</span>
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
            <span>4. Accreditation & Statutory Declarations</span>
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
              <strong>Claim NBA Accreditation:</strong> Check this option if your institution holds active National Board of Accreditation (NBA) certification. (Note: Demo institutional register lists NBA accreditation as unverified, allowing you to test regulatory mismatch detection).
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="veda-form-actions-bar">
          <Link to="/dashboard" className="veda-btn-cancel">
            Cancel
          </Link>
          <button className="veda-btn-submit-primary" type="submit" disabled={busy}>
            {busy ? "Saving Application…" : "Save and Proceed to Document Upload →"}
          </button>
        </div>
      </form>
    </div>
  );
}
