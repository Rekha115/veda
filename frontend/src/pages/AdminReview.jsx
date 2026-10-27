import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import "./AdminReview.css";

export default function AdminReview() {
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await api("/api/applications");
    setApps(data.applications || []);
    if (!selectedId && data.applications && data.applications[0]) {
      setSelectedId(data.applications[0].id);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  const selected = apps.find((a) => a.id === selectedId);

  useEffect(() => {
    const current = apps.find((a) => a.id === selectedId);
    setNotes(current?.review?.notes || "");
  }, [selectedId, apps]);

  async function decide(decision) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/applications/${selected.id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="veda-admin-workspace">
      {/* Breadcrumbs */}
      <nav className="veda-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/dashboard" className="veda-breadcrumb-link">Home</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">Admin Scrutiny Review</span>
      </nav>

      {/* Header Block */}
      <div className="veda-admin-header-block">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
          AICTE Scrutiny Officer Workbench
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
          Human scrutiny interface before regulatory decisions. Review automated flags, inspect OCR evidence, and record recommendations.
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

      {/* Two Column Grid: Queue + Workbench */}
      <div className="veda-admin-grid">
        {/* Queue List */}
        <div className="veda-queue-card">
          <div className="veda-queue-header">
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Application Queue
            </h2>
            <span className="veda-pill-badge">{apps.length} in queue</span>
          </div>

          <div>
            {apps.map((a) => (
              <div
                key={a.id}
                className={`veda-queue-item ${a.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(a.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedId(a.id);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p className="veda-queue-app-id">{a.id}</p>
                  <span
                    className={`veda-status-badge ${
                      a.review?.decision === "approved"
                        ? "approved"
                        : a.review?.decision === "rejected"
                        ? "rejected"
                        : "review"
                    }`}
                    style={{ fontSize: "0.7rem", padding: "1px 6px" }}
                  >
                    {a.review?.decision || a.status}
                  </span>
                </div>
                <div className="veda-queue-app-meta">
                  <span>{a.category}</span>
                  <span>·</span>
                  <span>{a.instituteName ? a.instituteName.substring(0, 24) + "…" : a.instituteCode}</span>
                </div>
              </div>
            ))}

            {apps.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                Queue is empty. No applications submitted yet.
              </div>
            )}
          </div>
        </div>

        {/* Workbench Card */}
        <div className="veda-workbench-card">
          {!selected ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Select an application from the queue to start scrutiny review.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 className="veda-workbench-inst-title">{selected.instituteName}</h2>
                  <div className="veda-workbench-meta-row">
                    <span>App Ref: <strong>{selected.id}</strong></span>
                    <span>·</span>
                    <span>Category: <strong>{selected.category}</strong></span>
                    <span>·</span>
                    <span>Contact: <strong>{selected.contactName}</strong></span>
                  </div>
                </div>

                <Link
                  to={`/applications/${selected.id}/results`}
                  className="veda-btn-view-action"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <span>Open Full Scrutiny Report</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Status Metrics Banner */}
              <div className="veda-workbench-metrics-banner">
                <div>
                  <span style={{ fontSize: "0.76rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Automated Findings
                  </span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                    {selected.validation?.findings?.length || 0} Flag(s)
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.76rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Overall Validation
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: selected.validation?.overall === "PASS" ? "#15803d" : "#b45309" }}>
                    {selected.validation?.overall || "Not validated"}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.76rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Current Review Decision
                  </span>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>
                    {selected.review?.decision?.replace(/_/g, " ") || "Pending Scrutiny"}
                  </div>
                </div>
              </div>

              {/* Notes Form */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="notes"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: 6 }}
                >
                  Reviewer Observations & Justification Note
                </label>
                <textarea
                  id="notes"
                  className="veda-workbench-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record why additional evidence or inspection is needed, or summarize scrutiny findings for the regional officer."
                />
              </div>

              {/* Action Decision Controls */}
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>
                  Record Scrutiny Action:
                </p>
                <div className="veda-workbench-actions">
                  <button
                    type="button"
                    className="veda-btn-decision-amber"
                    disabled={busy}
                    onClick={() => decide("needs_evidence")}
                  >
                    {busy ? "Saving…" : "⚠️ Request Additional Evidence"}
                  </button>

                  <button
                    type="button"
                    className="veda-btn-decision-orange-outline"
                    disabled={busy}
                    onClick={() => decide("inspect")}
                  >
                    {busy ? "Saving…" : "🔍 Flag for Physical Inspection"}
                  </button>

                  <button
                    type="button"
                    className="veda-btn-decision-green-outline"
                    disabled={busy}
                    onClick={() => decide("cleared_for_officer")}
                  >
                    {busy ? "Saving…" : "✓ Clear for Competent Officer"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
