import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import "./UploadDocuments.css";

const TYPES = [
  { value: "previous_eoa", label: "Previous Extension of Approval (EoA) letter" },
  { value: "affiliation", label: "University Affiliation Letter" },
  { value: "faculty_list", label: "Faculty List with Qualifications" },
  { value: "land_affidavit", label: "Land / Building Affidavit" },
  { value: "fire_noc", label: "Fire Safety NOC" },
  { value: "infrastructure", label: "Infrastructure Photographs / Plan Evidence" },
  { value: "other", label: "Other Supporting Document" },
];

const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "tif", "tiff"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export default function UploadDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appData, setAppData] = useState(null);
  const [declaredType, setDeclaredType] = useState("previous_eoa");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  async function refresh() {
    const data = await api(`/api/applications/${id}`);
    setAppData(data.application);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, [id]);

  async function upload(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    const extension = file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Unsupported file format. Please upload PDF, PNG, JPG, WEBP, or TIFF.");
      return;
    }
    if (!file.size) {
      setError("The selected file is empty (0 bytes). Choose a valid document.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("The file exceeds the 8 MB maximum size limit.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("declaredType", declaredType);
      body.append("documentNumber", documentNumber);
      body.append("expiryDate", expiryDate);
      await api(`/api/applications/${id}/documents`, { method: "POST", body });
      const uploadedName = file.name;
      setFile(null);
      setDocumentNumber("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
      setNotice(`"${uploadedName}" successfully uploaded. Run document checks to inspect findings.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function runValidation() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/applications/${id}/validate`, { method: "POST" });
      navigate(`/applications/${id}/results`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!appData) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading application records…</div>;

  return (
    <div className="veda-upload-workspace">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">Home</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">Applications</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">{appData.id} Documents</span>
      </nav>

      {/* Application Summary Bar */}
      <div className="veda-app-summary-bar">
        <div>
          <h1 className="veda-app-summary-title">Compliance Document Ingestion</h1>
          <div className="veda-app-summary-meta">
            <span>Ref: <strong>{appData.id}</strong></span>
            <span>·</span>
            <span>Category: <strong>{appData.category}</strong></span>
            <span>·</span>
            <span>Institution: <strong>{appData.instituteName}</strong></span>
          </div>
        </div>

        <Link
          to={`/applications/${id}/results`}
          className="veda-btn-cancel"
          style={{ padding: "8px 16px", fontSize: "0.84rem" }}
        >
          View Validation Results →
        </Link>
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

      {notice && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "12px 16px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "0.86rem",
          }}
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Two Column Grid: Upload Form + Document List */}
      <div className="veda-upload-grid">
        {/* Left Column: Upload Form */}
        <form className="veda-upload-card" onSubmit={upload} noValidate>
          <h2 className="veda-upload-card-title">Upload New Supporting File</h2>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="declaredType" className="veda-field-label">
              Document type <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              id="declaredType"
              className="veda-field-select"
              value={declaredType}
              onChange={(e) => setDeclaredType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="documentNumber" className="veda-field-label">
              Reference number / certificate ID (optional)
            </label>
            <input
              id="documentNumber"
              className="veda-field-input"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. NOC-2026/892"
            />
          </div>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="expiryDate" className="veda-field-label">
              Expiry / validity date (if applicable)
            </label>
            <input
              id="expiryDate"
              type="date"
              className="veda-field-input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="file" className="veda-field-label">
              Select Document File <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div className="veda-dropzone-box">
              <input
                id="file"
                ref={fileInputRef}
                type="file"
                className="veda-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,application/pdf,image/*"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                Accepted: PDF, PNG, JPG, WEBP, TIFF (Max 8 MB per file)
              </p>
            </div>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b", lineHeight: 1.45 }}>
              Text-based PDFs are processed instantly. Scanned documents and images are read via local OCR engine.
            </p>
          </div>

          <button
            type="submit"
            className="veda-btn-submit-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={busy}
          >
            {busy ? "Uploading file…" : "+ Upload Document"}
          </button>
        </form>

        {/* Right Column: Uploaded Documents Checklist */}
        <div className="veda-files-card">
          <h2 className="veda-upload-card-title">
            <span>Uploaded Files</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500, float: "right" }}>
              {appData.documents.length} File(s)
            </span>
          </h2>

          {!appData.documents.length && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 6 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>No documents uploaded yet.</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                Select a document from the left to upload certificates, NOCs, or floor plans.
              </p>
            </div>
          )}

          {appData.documents.map((d) => (
            <div key={d.id} className="veda-doc-item-row">
              <div>
                <span className="veda-doc-badge">{d.declaredType}</span>
                <p className="veda-doc-filename">{d.originalName}</p>
                <div className="veda-doc-details">
                  <span>{Math.round(d.size / 1024)} KB</span>
                  <span> · </span>
                  <span>Expiry: {d.expiryDate || "None"}</span>
                  {d.documentNumber && <span> · Ref: {d.documentNumber}</span>}
                </div>
              </div>

              <div>
                <span
                  className={`veda-doc-status-pill ${d.analysis ? "analysed" : ""}`}
                >
                  {d.analysis ? `OCR Analysed (${d.analysis.chars} chars)` : "Pending analysis"}
                </span>
              </div>
            </div>
          ))}

          {/* Action Footer */}
          <div className="veda-upload-actions-panel">
            <Link to="/dashboard" className="veda-btn-cancel">
              ← Back to Dashboard
            </Link>

            <button
              type="button"
              className="veda-btn-run-checks"
              onClick={runValidation}
              disabled={busy}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{busy ? "Running Scrutiny Checks…" : "Run Document Checks & Scrutiny"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
