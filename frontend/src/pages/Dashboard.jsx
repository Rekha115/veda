import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../api";

export default function Dashboard() {
  const user = getUser();
  const [apps, setApps] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/applications"), api("/api/meta")])
      .then(([a, m]) => {
        setApps(a.applications);
        setMeta(m);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">{meta?.disclaimer}</p>
      {error && <p className="error">{error}</p>}
      {meta?.institution && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Demo institution register</h3>
          <p>
            <strong>{meta.institution.name}</strong> · {meta.institution.code}
            <br />
            <span className="muted">{meta.institution.source}</span>
          </p>
          <p>
            Previous EoA (demo): {meta.institution.previousEoaYear} ·{" "}
            {meta.institution.previousEoaStatus}
            <br />
            Faculty on register: {meta.institution.facultyCount} · TER:{" "}
            {meta.institution.terPaymentStatus}
          </p>
        </div>
      )}
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <Link className="btn btn-primary" to="/applications/new">
          New application
        </Link>
        {user?.role === "admin" && (
          <Link className="btn btn-outline" to="/admin">
            Open admin review
          </Link>
        )}
      </div>
      <div className="card">
        <h3>Applications</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Status</th>
              <th>Validation</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.category}</td>
                <td>
                  <span className="badge">{a.status}</span>
                </td>
                <td>{a.validation?.overall || "—"}</td>
                <td>
                  <Link to={`/applications/${a.id}/upload`}>Documents</Link>
                  {" · "}
                  <Link to={`/applications/${a.id}/results`}>Results</Link>
                </td>
              </tr>
            ))}
            {!apps.length && (
              <tr>
                <td colSpan="5" className="muted">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
