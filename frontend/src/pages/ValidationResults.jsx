import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import "./ValidationResults.css";

const RESULT_BADGE = {
  PASS: "pass",
  REVIEW: "review",
  REVIEW_REQUIRED: "review",
  FAIL: "fail",
};

const METHOD_LABEL = {
  "pdf-text": "PDF text layer",
  "pdf-ocr": "Scanned PDF (OCR)",
  "pdf-text+ocr": "PDF text + OCR",
  "image-ocr": "Image (OCR)",
  unsupported: "Unsupported file",
  failed: "Could not read",
};

function fieldValue(field) {
  if (!field) return "—";
  if (field.raw) return field.raw;
  if (field.iso) return field.iso;
  return String(field.value);
}

function FieldRow({ label, field }) {
  return (
    <tr>
      <th scope="row" style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>
        {label}
      </th>
      <td style={{ fontWeight: 600, color: "#0f172a" }}>{fieldValue(field)}</td>
      <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
        {field?.document ? field.document.name : "—"}
        {field?.document?.method ? ` · ${METHOD_LABEL[field.document.method] || field.document.method}` : ""}
      </td>
      <td>
        <div className="veda-table-evidence-cell">
          {field?.evidence || "—"}
        </div>
      </td>
    </tr>
  );
}

export default function ValidationResults() {
  const { id } = useParams();
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/applications/${id}`)
      .then((d) => setAppData(d.application))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div style={{ padding: 32, color: "#b91c1c" }}>Error: {error}</div>;
  if (!appData) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading validation report…</div>;

  const v = appData.validation;
  const checks = v?.checks || [];
  const extracted = v?.extracted;
  const overallStatus = v?.overall ? (RESULT_BADGE[v.overall] || "review") : "review";

  return (
    <div className="veda-report-workspace">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">Home</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">Applications</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">{appData.id} Scrutiny Report</span>
      </nav>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Document Validation & Scrutiny Report
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
            Application <strong>{appData.id}</strong> · {appData.category} · {appData.instituteName}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="veda-btn-cancel"
            style={{ padding: "8px 16px", fontSize: "0.84rem" }}
            onClick={() => window.print()}
          >
            🖨️ Print / Export Report
          </button>
          <Link
            to={`/applications/${id}/upload`}
            className="veda-btn-submit-primary"
            style={{ padding: "8px 16px", fontSize: "0.84rem", textDecoration: "none" }}
          >
            Manage Documents
          </Link>
        </div>
      </div>

      {!v ? (
        <div className="veda-report-overview-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 12px" }}>
            No automated checks have been run on this application yet.
          </p>
          <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "0.88rem" }}>
            Upload supporting files such as the EoA letter, NOCs, and faculty lists to generate an evidence-based report.
          </p>
          <Link className="veda-btn-submit-primary" to={`/applications/${id}/upload`} style={{ textDecoration: "none" }}>
            Proceed to Document Upload →
          </Link>
        </div>
      ) : (
        <>
          {/* 1. Overview Banner */}
          <section className={`veda-report-overview-card ${overallStatus}`} aria-label="Scrutiny Summary">
            <div className="veda-report-top-row">
              <h2 className="veda-report-title">Automated Validation Outcome</h2>
              <span className={`veda-report-status-badge ${overallStatus}`}>
                {v.overall || "REVIEW_REQUIRED"}
              </span>
            </div>
            <p className="veda-report-summary-text">{v.summary}</p>
            <p className="veda-report-meta-text">
              Generated: <strong>{new Date(v.generatedAt).toLocaleString()}</strong> · Institutional Reference Source: <strong>{v.recordUsed?.source || "Demo Institutional Register"}</strong>
            </p>
          </section>

          {/* 2. Authenticity Notice Box */}
          <div className="veda-authenticity-notice" role="note">
            <strong>Authenticity Status: {v.authenticity?.status || "UNVERIFIED"}</strong>
            <p>{v.authenticity?.reason || "No live government database API is integrated in this prototype."}</p>
            <small>{v.authenticity?.recommendation || "Physical inspection or original document verification recommended."}</small>
          </div>

          {/* 3. Extracted Fields Table */}
          {extracted && (
            <>
              <section className="veda-report-section-card" aria-label="Extracted Fields">
                <div className="veda-report-section-header">
                  <h2 className="veda-report-section-title">Detected Fields & OCR Evidence</h2>
                  <p className="veda-report-section-desc">
                    Values extracted via automated text heuristics and OCR engines. Human scrutiny should verify original evidence.
                  </p>
                </div>

                <div className="veda-table-responsive">
                  <table className="veda-custom-table">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Detected Value</th>
                        <th>Document Source & Method</th>
                        <th>Extracted Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <FieldRow label="Institution name" field={extracted.institutionName} />
                      <FieldRow label="Application / reference no." field={extracted.applicationNumber} />
                      <FieldRow label="Academic year" field={extracted.academicYear} />
                      <FieldRow label="Approval status" field={extracted.approvalStatus} />
                      <FieldRow label="Issue date" field={extracted.issueDate} />
                      <FieldRow label="Validity / expiry date" field={extracted.expiryDate} />
                      <FieldRow label="Faculty count" field={extracted.facultyCount} />
                      <FieldRow label="CSE intake" field={extracted.cseIntake} />
                      <FieldRow label="Issuing authority" field={extracted.issuingAuthority} />
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Document Processing Log */}
              <section className="veda-report-section-card" aria-label="Document Processing">
                <div className="veda-report-section-header">
                  <h2 className="veda-report-section-title">Document Processing & OCR Metrics</h2>
                  <p className="veda-report-section-desc">
                    Audit of file readability, page counts, OCR confidence scores, and ingestion heuristics.
                  </p>
                </div>

                <div className="veda-table-responsive">
                  <table className="veda-custom-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Declared Type</th>
                        <th>Extraction Engine</th>
                        <th>Pages Read</th>
                        <th>Characters</th>
                        <th>Scrutiny Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(extracted.documents || []).map((doc) => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{doc.name}</td>
                          <td>
                            <span className="veda-pill-badge">{doc.declaredType}</span>
                          </td>
                          <td style={{ color: "#475569" }}>{METHOD_LABEL[doc.method] || doc.method}</td>
                          <td>{doc.pagesRead} / {doc.totalPages}</td>
                          <td>
                            {doc.characters} chars
                            {doc.ocrConfidence !== null && doc.ocrConfidence !== undefined
                              ? ` (OCR ${doc.ocrConfidence}%)`
                              : ""}
                          </td>
                          <td>
                            <div className="veda-table-evidence-cell">
                              {doc.notes?.length ? doc.notes.join(" ") : "No anomalies detected."}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!(extracted.documents || []).length && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                            No documents uploaded for this application.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* 5. Automated Checks */}
          <section className="veda-report-section-card" aria-label="Compliance Checks">
            <div className="veda-report-section-header">
              <h2 className="veda-report-section-title">Regulatory Compliance Rule Checks</h2>
              <p className="veda-report-section-desc">
                Automated matching against AICTE Approval Process Handbook (APH 2026-27) parameters.
              </p>
            </div>

            <div className="veda-table-responsive">
              <table className="veda-custom-table">
                <thead>
                  <tr>
                    <th>Rule Check</th>
                    <th>Outcome</th>
                    <th>Reason / Logic</th>
                    <th>Audit Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.length ? (
                    checks.map((check) => {
                      const badgeClass = RESULT_BADGE[check.status] || "review";
                      return (
                        <tr key={check.id}>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{check.label}</td>
                          <td>
                            <span className={`veda-status-badge ${badgeClass}`}>
                              {check.status}
                            </span>
                          </td>
                          <td style={{ color: "#334155" }}>{check.reason}</td>
                          <td>
                            <div className="veda-table-evidence-cell">
                              {check.evidence || "—"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: 20 }}>
                        {(v.findings || []).map((f) => (
                          <div key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <strong>{f.title}</strong> — <span style={{ color: "#b45309" }}>{f.severity}</span>
                            <p style={{ margin: "4px 0", color: "#475569" }}>{f.evidence}</p>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Required Documents & Audit Trail Grid */}
          <div className="veda-report-grid-2">
            <div className="veda-panel-card">
              <div className="veda-panel-header">
                <h3 className="veda-panel-title">Required Documents Checklist</h3>
              </div>
              <div>
                {(v.checklist || []).map((c) => (
                  <div key={c.type} className="veda-checklist-item">
                    <span>{c.label}</span>
                    <span
                      className={`veda-checklist-status ${
                        c.status === "present" ? "present" : "missing"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
                {!(v.checklist || []).length && (
                  <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>
                    No checklist items defined for this category.
                  </div>
                )}
              </div>
            </div>

            <div className="veda-panel-card">
              <div className="veda-panel-header">
                <h3 className="veda-panel-title">Scrutiny Audit Trail</h3>
              </div>
              <div>
                {appData.audit.map((a, i) => (
                  <div key={i} className="veda-audit-item">
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{a.action}</div>
                    <div className="veda-audit-meta">
                      Actor: <strong>{a.actor}</strong> · {new Date(a.at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer Navigation */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Link to={`/applications/${id}/upload`} className="veda-btn-cancel">
          ← Manage Application Documents
        </Link>
        <Link to="/dashboard" className="veda-btn-cancel">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
