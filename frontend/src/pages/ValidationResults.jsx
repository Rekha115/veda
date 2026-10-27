import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

const RESULT_BADGE = {
  PASS: "badge-ok",
  REVIEW: "badge-medium",
  FAIL: "badge-high",
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
      <th scope="row">{label}</th>
      <td>{fieldValue(field)}</td>
      <td className="muted">
        {field?.document ? field.document.name : "—"}
        {field?.document?.method ? ` · ${METHOD_LABEL[field.document.method] || field.document.method}` : ""}
      </td>
      <td className="evidence">{field?.evidence || "—"}</td>
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

  if (error) return <p className="error">{error}</p>;
  if (!appData) return <p>Loading…</p>;
  const v = appData.validation;
  const checks = v?.checks || [];
  const extracted = v?.extracted;

  return (
    <div>
      <h1>Document validation report</h1>
      <p className="muted">
        Decision-support output only. Not an AICTE order and not certificate
        authentication.
      </p>

      {!v && (
        <div className="card">
          <p>No checks have been run yet.</p>
          <Link className="btn btn-primary" to={`/applications/${id}/upload`}>
            Go to documents
          </Link>
        </div>
      )}

      {v && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <span className={`badge ${RESULT_BADGE[v.overall] || ""}`}>
              {v.overall}
            </span>
            <p>{v.summary}</p>
            <p className="muted">
              Generated {new Date(v.generatedAt).toLocaleString()} ·{" "}
              {v.recordUsed?.source || "No demo register record used"}
            </p>
          </div>

          <div className="notice" style={{ marginBottom: 16 }}>
            <strong>Authenticity: {v.authenticity?.status || "UNVERIFIED"}</strong>
            <p>{v.authenticity?.reason || "No official record source is connected."}</p>
            <p className="muted">{v.authenticity?.recommendation}</p>
          </div>

          {extracted && (
            <>
              <h2>Extracted fields</h2>
              <p className="muted">
                Values below come from the document text or OCR. Always confirm
                them against the original file.
              </p>
              <div className="table-scroll card" style={{ marginBottom: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Detected value</th>
                      <th>Source</th>
                      <th>Evidence</th>
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

              <h2>Document processing</h2>
              <div className="table-scroll card" style={{ marginBottom: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Declared type</th>
                      <th>Method</th>
                      <th>Pages</th>
                      <th>Text</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(extracted.documents || []).map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.name}</td>
                        <td>{doc.declaredType}</td>
                        <td>{METHOD_LABEL[doc.method] || doc.method}</td>
                        <td>
                          {doc.pagesRead}/{doc.totalPages}
                        </td>
                        <td>
                          {doc.characters} chars
                          {doc.ocrConfidence !== null && doc.ocrConfidence !== undefined
                            ? ` · OCR ${doc.ocrConfidence}%`
                            : ""}
                        </td>
                        <td className="evidence">
                          {doc.notes?.length ? doc.notes.join(" ") : "—"}
                        </td>
                      </tr>
                    ))}
                    {!(extracted.documents || []).length && (
                      <tr>
                        <td colSpan="6" className="muted">
                          No documents were uploaded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h2>Checks</h2>
          {checks.length ? (
            <div className="table-scroll card" style={{ marginBottom: 16 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Check</th>
                    <th>Result</th>
                    <th>Reason</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((check) => (
                    <tr key={check.id}>
                      <td>{check.label}</td>
                      <td>
                        <span className={`badge ${RESULT_BADGE[check.status] || ""}`}>
                          {check.status}
                        </span>
                      </td>
                      <td>{check.reason}</td>
                      <td className="evidence">{check.evidence || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="muted">
                This report was produced by an older version. Run the checks
                again from the documents page to get the detailed result.
              </p>
              {(v.findings || []).map((f) => (
                <article key={f.id} className={`finding ${f.severity}`}>
                  <strong>{f.title}</strong>
                  <span className={`badge badge-${f.severity}`} style={{ marginLeft: 8 }}>
                    {f.severity}
                  </span>
                  <p>{f.evidence}</p>
                  <p className="muted">Source: {f.source}</p>
                </article>
              ))}
            </div>
          )}

          <div className="grid-2">
            <div>
              <h3>Required documents</h3>
              <div className="card">
                {(v.checklist || []).map((c) => (
                  <p key={c.type}>
                    <span
                      className={`badge ${
                        c.status === "present" ? "badge-ok" : "badge-high"
                      }`}
                    >
                      {c.status}
                    </span>{" "}
                    {c.label}
                  </p>
                ))}
                {!(v.checklist || []).length && (
                  <p className="muted">No checklist items.</p>
                )}
              </div>
            </div>
            <div>
              <h3>Audit trail</h3>
              <div className="card">
                {appData.audit.map((a, i) => (
                  <p key={i} className="muted">
                    {new Date(a.at).toLocaleString()} · {a.actor} · {a.action}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="actions">
        <Link className="btn btn-outline" to={`/applications/${id}/upload`}>
          Manage documents
        </Link>
        <Link className="btn btn-outline" to="/dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
