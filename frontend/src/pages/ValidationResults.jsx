import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";
import "./ValidationResults.css";

const RESULT_BADGE = {
  PASS: "pass",
  REVIEW: "review",
  REVIEW_REQUIRED: "review",
  FAIL: "fail",
};

function fieldValue(field) {
  if (!field) return "—";
  if (field.raw) return field.raw;
  if (field.iso) return field.iso;
  return String(field.value);
}

function FieldRow({ label, field, getMethodLabel }) {
  return (
    <tr>
      <th scope="row" style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>
        {label}
      </th>
      <td style={{ fontWeight: 600, color: "#0f172a" }}>{fieldValue(field)}</td>
      <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
        {field?.document ? field.document.name : "—"}
        {field?.document?.method ? ` · ${getMethodLabel(field.document.method)}` : ""}
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
  const { t, formatCategory, formatDate } = useLanguage();
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/applications/${id}`)
      .then((d) => setAppData(d.application))
      .catch((err) => setError(err.message));
  }, [id]);

  const getMethodLabel = (methodKey) =>
    t(`validation.methods.${methodKey}`, null, methodKey || "—");

  if (error) {
    return (
      <div style={{ padding: 32, color: "#b91c1c" }}>
        {t("common.error")}: {error}
      </div>
    );
  }

  if (!appData) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        {t("validation.loadingReport")}
      </div>
    );
  }

  const v = appData.validation;
  const checks = v?.checks || [];
  const extracted = v?.extracted;
  const overallStatus = v?.overall ? (RESULT_BADGE[v.overall] || "review") : "review";

  return (
    <div className="veda-report-workspace">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label={t("nav.navigation")} style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("common.home")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <Link to="/dashboard" className="veda-breadcrumb-link">{t("newApp.breadcrumbApplications")}</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">{t("validation.breadcrumbReport", { id: appData.id })}</span>
      </nav>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            {t("validation.title")}
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
            {t("validation.appSubtext", {
              id: appData.id,
              category: formatCategory(appData.category),
              institute: appData.instituteName,
            })}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="veda-btn-cancel"
            style={{ padding: "8px 16px", fontSize: "0.84rem" }}
            onClick={() => window.print()}
          >
            {t("validation.printExport")}
          </button>
          <Link
            to={`/applications/${id}/upload`}
            className="veda-btn-submit-primary"
            style={{ padding: "8px 16px", fontSize: "0.84rem", textDecoration: "none" }}
          >
            {t("validation.manageDocs")}
          </Link>
        </div>
      </div>

      {!v ? (
        <div className="veda-report-overview-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 12px" }}>
            {t("validation.noChecksTitle")}
          </p>
          <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "0.88rem" }}>
            {t("validation.noChecksDesc")}
          </p>
          <Link className="veda-btn-submit-primary" to={`/applications/${id}/upload`} style={{ textDecoration: "none" }}>
            {t("validation.proceedToUploadBtn")}
          </Link>
        </div>
      ) : (
        <>
          {/* 1. Overview Banner */}
          <section className={`veda-report-overview-card ${overallStatus}`} aria-label={t("validation.outcomeTitle")}>
            <div className="veda-report-top-row">
              <h2 className="veda-report-title">{t("validation.outcomeTitle")}</h2>
              <span className={`veda-report-status-badge ${overallStatus}`}>
                {v.overall === "PASS"
                  ? t("common.pass")
                  : v.overall === "FAIL"
                  ? t("common.fail")
                  : t("common.reviewRequired")}
              </span>
            </div>
            <p className="veda-report-summary-text">{v.summary}</p>
            <p className="veda-report-meta-text">
              {t("validation.generatedLabel")}: <strong>{formatDate(v.generatedAt)}</strong> · {t("validation.sourceLabel")}: <strong>{v.recordUsed?.source || t("validation.defaultSource")}</strong>
            </p>
          </section>

          {/* 2. Authenticity Notice Box */}
          <div className="veda-authenticity-notice" role="note">
            <strong>{t("validation.authenticityStatus")}: {v.authenticity?.status || t("common.unverified")}</strong>
            <p>{v.authenticity?.reason || t("validation.defaultUnverified")}</p>
            <small>{v.authenticity?.recommendation || t("validation.defaultRecommendation")}</small>
          </div>

          {/* 3. Extracted Fields Table */}
          {extracted && (
            <>
              <section className="veda-report-section-card" aria-label={t("validation.detectedFieldsTitle")}>
                <div className="veda-report-section-header">
                  <h2 className="veda-report-section-title">{t("validation.detectedFieldsTitle")}</h2>
                  <p className="veda-report-section-desc">
                    {t("validation.detectedFieldsDesc")}
                  </p>
                </div>

                <div className="veda-table-responsive">
                  <table className="veda-custom-table">
                    <thead>
                      <tr>
                        <th>{t("validation.thFieldName")}</th>
                        <th>{t("validation.thDetectedValue")}</th>
                        <th>{t("validation.thDocSourceMethod")}</th>
                        <th>{t("validation.thExtractedEvidence")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <FieldRow label={t("validation.fields.institutionName")} field={extracted.institutionName} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.applicationNumber")} field={extracted.applicationNumber} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.academicYear")} field={extracted.academicYear} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.approvalStatus")} field={extracted.approvalStatus} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.issueDate")} field={extracted.issueDate} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.expiryDate")} field={extracted.expiryDate} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.facultyCount")} field={extracted.facultyCount} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.cseIntake")} field={extracted.cseIntake} getMethodLabel={getMethodLabel} />
                      <FieldRow label={t("validation.fields.issuingAuthority")} field={extracted.issuingAuthority} getMethodLabel={getMethodLabel} />
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Document Processing Log */}
              <section className="veda-report-section-card" aria-label={t("validation.docProcessingTitle")}>
                <div className="veda-report-section-header">
                  <h2 className="veda-report-section-title">{t("validation.docProcessingTitle")}</h2>
                  <p className="veda-report-section-desc">
                    {t("validation.docProcessingDesc")}
                  </p>
                </div>

                <div className="veda-table-responsive">
                  <table className="veda-custom-table">
                    <thead>
                      <tr>
                        <th>{t("validation.thFileName")}</th>
                        <th>{t("validation.thDeclaredType")}</th>
                        <th>{t("validation.thExtractionEngine")}</th>
                        <th>{t("validation.thPagesRead")}</th>
                        <th>{t("validation.thCharacters")}</th>
                        <th>{t("validation.thScrutinyNotes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(extracted.documents || []).map((doc) => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{doc.name}</td>
                          <td>
                            <span className="veda-pill-badge">
                              {t(`upload.types.${doc.declaredType}`, null, doc.declaredType)}
                            </span>
                          </td>
                          <td style={{ color: "#475569" }}>{getMethodLabel(doc.method)}</td>
                          <td>{doc.pagesRead} / {doc.totalPages}</td>
                          <td>
                            {doc.characters} {t("validation.charsUnit")}
                            {doc.ocrConfidence !== null && doc.ocrConfidence !== undefined
                              ? ` (${t("validation.ocrAccuracy")} ${doc.ocrConfidence}%)`
                              : ""}
                          </td>
                          <td>
                            <div className="veda-table-evidence-cell">
                              {doc.notes?.length ? doc.notes.join(" ") : t("validation.noAnomalies")}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!(extracted.documents || []).length && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                            {t("validation.noDocsUploaded")}
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
          <section className="veda-report-section-card" aria-label={t("validation.ruleChecksTitle")}>
            <div className="veda-report-section-header">
              <h2 className="veda-report-section-title">{t("validation.ruleChecksTitle")}</h2>
              <p className="veda-report-section-desc">
                {t("validation.ruleChecksDesc")}
              </p>
            </div>

            <div className="veda-table-responsive">
              <table className="veda-custom-table">
                <thead>
                  <tr>
                    <th>{t("validation.thRuleCheck")}</th>
                    <th>{t("validation.thOutcome")}</th>
                    <th>{t("validation.thReasonLogic")}</th>
                    <th>{t("validation.thAuditEvidence")}</th>
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
                              {check.status === "PASS"
                                ? t("common.pass")
                                : check.status === "FAIL"
                                ? t("common.fail")
                                : t("common.review")}
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
                <h3 className="veda-panel-title">{t("validation.requiredDocsTitle")}</h3>
              </div>
              <div>
                {(v.checklist || []).map((c) => (
                  <div key={c.type} className="veda-checklist-item">
                    <span>{t(`upload.types.${c.type}`, null, c.label)}</span>
                    <span
                      className={`veda-checklist-status ${
                        c.status === "present" ? "present" : "missing"
                      }`}
                    >
                      {c.status === "present"
                        ? (t("common.verified") || "present")
                        : (t("common.rejected") || "missing")}
                    </span>
                  </div>
                ))}
                {!(v.checklist || []).length && (
                  <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>
                    {t("validation.noChecklist")}
                  </div>
                )}
              </div>
            </div>

            <div className="veda-panel-card">
              <div className="veda-panel-header">
                <h3 className="veda-panel-title">{t("validation.auditTrailTitle")}</h3>
              </div>
              <div>
                {appData.audit.map((a, i) => (
                  <div key={i} className="veda-audit-item">
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{a.action}</div>
                    <div className="veda-audit-meta">
                      {t("validation.actorLabel")}: <strong>{a.actor}</strong> · {formatDate(a.at)}
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
          {t("validation.manageAppDocsLink")}
        </Link>
        <Link to="/dashboard" className="veda-btn-cancel">
          {t("validation.backDashboardLink")}
        </Link>
      </div>
    </div>
  );
}
