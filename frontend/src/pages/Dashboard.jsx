import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const user = getUser();
  const [apps, setApps] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/applications"), api("/api/meta")])
      .then(([a, m]) => {
        setApps(a.applications || []);
        setMeta(m);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Compute summary statistics from actual applications data
  const totalApps = apps.length;
  const underReviewCount = apps.filter(
    (a) =>
      a.review?.decision === "pending" ||
      (!a.review?.decision && a.status !== "approved" && a.status !== "rejected")
  ).length;
  const approvedCount = apps.filter(
    (a) => a.review?.decision === "approved" || a.status === "approved"
  ).length;
  const rejectedCount = apps.filter(
    (a) => a.review?.decision === "rejected" || a.status === "rejected"
  ).length;

  // Extract recent activities from application audits & submission logs
  const activityList = apps
    .flatMap((a) =>
      (a.audit || []).map((auditItem, idx) => ({
        id: `${a.id}-${idx}`,
        appId: a.id,
        category: a.category,
        action: auditItem.action || "Status update",
        actor: auditItem.actor || "System",
        timestamp: auditItem.at || a.createdAt,
      }))
    )
    .sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))
    .slice(0, 5);

  // If activity list is small, provide initial institutional events from meta
  if (activityList.length === 0 && meta?.institution) {
    activityList.push({
      id: "init-eoa",
      appId: "INST-REG",
      category: "EOA",
      action: `Previous EoA status verified: ${meta.institution.previousEoaStatus}`,
      actor: "Institutional Register",
      timestamp: new Date().toISOString(),
    });
  }

  function formatCategory(cat) {
    switch (cat) {
      case "EOA":
        return "Extension of Approval (EoA)";
      case "NEW_COURSE":
        return "New Programme / Course Addition";
      case "INTAKE_INCREASE":
        return "Intake Capacity Increase";
      default:
        return cat || "General Scrutiny";
    }
  }

  function formatDate(isoStr) {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  }

  function getStatusBadge(app) {
    const decision = app.review?.decision;
    if (decision === "approved" || app.status === "approved") {
      return <span className="veda-status-badge approved">Approved</span>;
    }
    if (decision === "rejected" || app.status === "rejected") {
      return <span className="veda-status-badge rejected">Rejected</span>;
    }
    if (app.status === "validated") {
      return <span className="veda-status-badge review">Under Review</span>;
    }
    if (app.status === "draft") {
      return <span className="veda-status-badge draft">Draft Submission</span>;
    }
    return <span className="veda-status-badge review">Under Review</span>;
  }

  return (
    <div className="veda-dashboard-workspace">
      {/* 1. Breadcrumb */}
      <nav className="veda-breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard" className="veda-breadcrumb-link">Home</Link>
        <span className="veda-breadcrumb-sep">/</span>
        <span className="veda-breadcrumb-current">Dashboard</span>
      </nav>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "10px 16px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* 2. Welcome & Institutional Profile Header Card */}
      <section className="veda-welcome-card" aria-label="Institution Overview">
        <div className="veda-welcome-details">
          <h1 className="veda-welcome-title">
            Welcome, {user?.displayName || "Dr. Meera Sharma"}
          </h1>

          <div className="veda-inst-info-row">
            <span className="veda-inst-name">
              {meta?.institution?.name || "Bharat Institute of Technology"}
            </span>
            <span className="veda-inst-code">
              {meta?.institution?.code || "INST-2024-001"}
            </span>
            <span className="veda-inst-tag">
              {meta?.institution?.source || "DEMO institutional register"}
            </span>
          </div>

          <div className="veda-inst-meta-grid">
            <span className="veda-inst-meta-item">
              Location: <strong>{meta?.institution?.district || "Jaipur"}, {meta?.institution?.state || "Rajasthan"}</strong>
            </span>
            <span className="veda-inst-meta-item">
              Previous EoA ({meta?.institution?.previousEoaYear || "2024-25"}): <strong>{meta?.institution?.previousEoaStatus || "Approved"}</strong>
            </span>
            <span className="veda-inst-meta-item">
              Faculty on Register: <strong>{meta?.institution?.facultyCount || 42}</strong>
            </span>
            <span className="veda-inst-meta-item">
              TER Status: <strong>{meta?.institution?.terPaymentStatus || "Paid (demo)"}</strong>
            </span>
          </div>
        </div>

        <div className="veda-welcome-actions">
          <Link to="/applications/new" className="veda-btn-create-app">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create New Application</span>
          </Link>

          {user?.role === "admin" && (
            <Link to="/admin" className="veda-btn-admin-review">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Admin Review</span>
            </Link>
          )}
        </div>
      </section>

      {/* 3. Summary Statistic Cards (Row of 4) */}
      <section className="veda-stats-grid" aria-label="Application Summary Metrics">
        {/* Total Applications */}
        <div className="veda-stat-card total">
          <div className="veda-stat-info">
            <span className="veda-stat-value">{totalApps}</span>
            <span className="veda-stat-label">Total Applications</span>
            <span className="veda-stat-subtext">All academic year submissions</span>
          </div>
          <div className="veda-stat-icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>

        {/* Under Review */}
        <div className="veda-stat-card review">
          <div className="veda-stat-info">
            <span className="veda-stat-value">{underReviewCount}</span>
            <span className="veda-stat-label">Under Review</span>
            <span className="veda-stat-subtext">Pending committee scrutiny</span>
          </div>
          <div className="veda-stat-icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        {/* Approved */}
        <div className="veda-stat-card approved">
          <div className="veda-stat-info">
            <span className="veda-stat-value">{approvedCount}</span>
            <span className="veda-stat-label">Approved</span>
            <span className="veda-stat-subtext">Statutory sanction issued</span>
          </div>
          <div className="veda-stat-icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        {/* Rejected / Deficiencies */}
        <div className="veda-stat-card rejected">
          <div className="veda-stat-info">
            <span className="veda-stat-value">{rejectedCount}</span>
            <span className="veda-stat-label">Rejected</span>
            <span className="veda-stat-subtext">Deficiencies or non-compliance</span>
          </div>
          <div className="veda-stat-icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
      </section>

      {/* 4. Main Content Two-Column Grid */}
      <div className="veda-dashboard-content-grid">
        {/* Left Column: Recent Applications Table */}
        <section className="veda-panel-card" aria-label="Recent Applications">
          <div className="veda-panel-header">
            <div className="veda-panel-title-group">
              <h2 className="veda-panel-title">Recent Applications</h2>
              <span className="veda-pill-badge">Sample data</span>
            </div>
            <Link to="/applications/new" className="veda-panel-link">
              + New Application
            </Link>
          </div>

          <div className="veda-table-responsive">
            <table className="veda-custom-table">
              <thead>
                <tr>
                  <th>Reference No.</th>
                  <th>Application Type</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="veda-app-id-bold">{a.id}</span>
                    </td>
                    <td>
                      <span className="veda-app-category-text">
                        {formatCategory(a.category)}
                      </span>
                    </td>
                    <td>
                      <span className="veda-app-date-text">
                        {formatDate(a.createdAt)}
                      </span>
                    </td>
                    <td>{getStatusBadge(a)}</td>
                    <td>
                      <div className="veda-table-actions">
                        <Link
                          to={`/applications/${a.id}/results`}
                          className="veda-btn-view-action"
                          title="View validation scrutiny results"
                        >
                          View
                        </Link>
                        <Link
                          to={`/applications/${a.id}/upload`}
                          className="veda-btn-sub-link"
                          title="Upload or check compliance documents"
                        >
                          Documents
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {apps.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                      No applications recorded yet. Click <strong>Create New Application</strong> above to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Recent Activity Panel */}
        <section className="veda-panel-card" aria-label="Recent Activity">
          <div className="veda-panel-header">
            <div className="veda-panel-title-group">
              <h2 className="veda-panel-title">Recent Activity</h2>
            </div>
            <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
              Live Log
            </span>
          </div>

          <div className="veda-activity-list">
            {activityList.map((item) => (
              <div key={item.id} className="veda-activity-item">
                <div className="veda-activity-icon-bullet blue" aria-hidden="true">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div className="veda-activity-content">
                  <p className="veda-activity-desc">{item.action}</p>
                  <div className="veda-activity-meta">
                    <span className="veda-activity-app-ref">{item.appId}</span>
                    <span>·</span>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}

            {activityList.length === 0 && (
              <div style={{ padding: "24px 12px", color: "#64748b", textAlign: "center", fontSize: "0.82rem" }}>
                No recent activity recorded.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
