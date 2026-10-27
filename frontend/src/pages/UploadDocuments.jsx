import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

const TYPES = [
  { value: "previous_eoa", label: "Previous EoA letter" },
  { value: "affiliation", label: "University affiliation" },
  { value: "faculty_list", label: "Faculty list" },
  { value: "land_affidavit", label: "Land / building affidavit" },
  { value: "fire_noc", label: "Fire safety NOC" },
  { value: "infrastructure", label: "Infrastructure evidence" },
  { value: "other", label: "Other" },
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
      setError("Choose a file first");
      return;
    }
    const extension = file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Unsupported file type. Use a PDF, PNG, JPG, WEBP, or TIFF file.");
      return;
    }
    if (!file.size) {
      setError("That file is empty (0 bytes). Choose a different file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than the 8 MB limit.");
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
      setNotice(`${uploadedName} uploaded. Run the checks to extract fields.`);
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

  if (!appData) return <p>Loading…</p>;

  return (
    <div>
      <h1>Document upload</h1>
      <p className="muted">
        Application {appData.id} · {appData.category} · {appData.instituteName}
      </p>
      <div className="grid-2">
        <form className="card" onSubmit={upload}>
          <label htmlFor="declaredType">Document type</label>
          <select
            id="declaredType"
            value={declaredType}
            onChange={(e) => setDeclaredType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <label htmlFor="documentNumber">Reference number (optional)</label>
          <input
            id="documentNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
          <label htmlFor="expiryDate">Expiry date if applicable</label>
          <input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <label htmlFor="file">File (PDF, PNG, JPG, WEBP, TIFF · max 8 MB)</label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,application/pdf,image/*"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <p className="muted">
            Text-based PDFs are read directly. Scanned PDFs and images are
            processed with local OCR, which can take a few seconds per page.
          </p>
          {error && <p className="error">{error}</p>}
          {notice && <p className="success">{notice}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Working…" : "Upload file"}
          </button>
        </form>
        <div className="card">
          <h3>Uploaded files</h3>
          {!appData.documents.length && (
            <p className="muted">None yet. You can still run the checks.</p>
          )}
          {appData.documents.map((d) => (
            <p key={d.id}>
              <strong>{d.declaredType}</strong> · {d.originalName}
              <br />
              <span className="muted">
                {Math.round(d.size / 1024)} KB · {d.expiryDate || "no expiry"}
                {d.analysis
                  ? ` · analysed (${d.analysis.chars} chars)`
                  : " · not analysed yet"}
              </span>
            </p>
          ))}
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={runValidation}
              disabled={busy}
            >
              {busy ? "Analysing documents…" : "Run document checks"}
            </button>
            <Link className="btn btn-outline" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
