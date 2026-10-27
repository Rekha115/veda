import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";
import "./UploadDocuments.css";

const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "tif", "tiff"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export default function UploadDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatCategory, formatDate } = useLanguage();
  const [appData, setAppData] = useState(null);
  const [declaredType, setDeclaredType] = useState("previous_eoa");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const docTypes = useMemo(
    () => [
      { value: "previous_eoa", label: t("upload.types.previous_eoa") },
      { value: "affiliation", label: t("upload.types.affiliation") },
      { value: "faculty_list", label: t("upload.types.faculty_list") },
      { value: "land_affidavit", label: t("upload.types.land_affidavit") },
      { value: "fire_noc", label: t("upload.types.fire_noc") },
      { value: "infrastructure", label: t("upload.types.infrastructure") },
      { value: "other", label: t("upload.types.other") },
    ],
    [t]
  );

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
      setError(t("upload.chooseFileError"));
      return;
    }
    const extension = file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(t("upload.unsupportedFormatError"));
      return;
    }
    if (!file.size) {
      setError(t("upload.emptyFileError"));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t("upload.fileSizeError"));
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
      setNotice(t("upload.successNotice", { name: uploadedName }));
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

  if (!appData) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        {t("upload.loadingRecord")}
      </div>
    );
  }

  return (
    <div className="veda-upload-workspace">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label={t("nav.navigation")} style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("common.home")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("newApp.breadcrumbApplications")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">{t("upload.breadcrumbDocs", { id: appData.id })}</span>
      </nav>

      {/* Application Summary Bar */}
      <div className="veda-app-summary-bar">
        <div>
          <h1 className="veda-app-summary-title">{t("upload.ingestionTitle")}</h1>
          <div className="veda-app-summary-meta">
            <span>{t("upload.ref")}: <strong>{appData.id}</strong></span>
            <span>·</span>
            <span>{t("upload.category")}: <strong>{formatCategory(appData.category)}</strong></span>
            <span>·</span>
            <span>{t("upload.institution")}: <strong>{appData.instituteName}</strong></span>
          </div>
        </div>

        <Link
          to={`/applications/${id}/results`}
          className="veda-btn-cancel"
          style={{ padding: "8px 16px", fontSize: "0.84rem" }}
        >
          {t("upload.viewResultsBtn")}
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
          <h2 className="veda-upload-card-title">{t("upload.uploadNewCardTitle")}</h2>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="declaredType" className="veda-field-label">
              {t("upload.docType")} <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              id="declaredType"
              className="veda-field-select"
              value={declaredType}
              onChange={(e) => setDeclaredType(e.target.value)}
            >
              {docTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="documentNumber" className="veda-field-label">
              {t("upload.refNumber")}
            </label>
            <input
              id="documentNumber"
              className="veda-field-input"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={t("upload.refNumberPlaceholder")}
            />
          </div>

          <div className="veda-field-group" style={{ marginBottom: 16 }}>
            <label htmlFor="expiryDate" className="veda-field-label">
              {t("upload.expiryDate")}
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
              {t("upload.selectFile")} <span style={{ color: "#dc2626" }}>*</span>
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
                {t("upload.acceptedFilesHint")}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b", lineHeight: 1.45 }}>
              {t("upload.ocrProcessingNote")}
            </p>
          </div>

          <button
            type="submit"
            className="veda-btn-submit-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={busy}
          >
            {busy ? t("upload.uploading") : t("upload.uploadBtn")}
          </button>
        </form>

        {/* Right Column: Uploaded Documents Checklist */}
        <div className="veda-files-card">
          <h2 className="veda-upload-card-title">
            <span>{t("upload.uploadedFilesTitle")}</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500, float: "right" }}>
              {t("upload.filesCountBadge", { count: appData.documents.length })}
            </span>
          </h2>

          {!appData.documents.length && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 6 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>{t("upload.noDocsTitle")}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                {t("upload.noDocsDesc")}
              </p>
            </div>
          )}

          {appData.documents.map((d) => (
            <div key={d.id} className="veda-doc-item-row">
              <div>
                <span className="veda-doc-badge">
                  {t(`upload.types.${d.declaredType}`, null, d.declaredType)}
                </span>
                <p className="veda-doc-filename">{d.originalName}</p>
                <div className="veda-doc-details">
                  <span>{Math.round(d.size / 1024)} KB</span>
                  <span> · </span>
                  <span>
                    {t("upload.expiryLabel")}: {d.expiryDate ? formatDate(d.expiryDate) : t("upload.noneLabel")}
                  </span>
                  {d.documentNumber && (
                    <span> · {t("upload.refLabel")}: {d.documentNumber}</span>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`veda-doc-status-pill ${d.analysis ? "analysed" : ""}`}
                >
                  {d.analysis
                    ? t("upload.ocrAnalysed", { chars: d.analysis.chars })
                    : t("upload.pendingAnalysis")}
                </span>
              </div>
            </div>
          ))}

          {/* Action Footer */}
          <div className="veda-upload-actions-panel">
            <Link to="/dashboard" className="veda-btn-cancel">
              {t("upload.backDashboard")}
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
              <span>{busy ? t("upload.runningChecks") : t("upload.runChecksBtn")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
