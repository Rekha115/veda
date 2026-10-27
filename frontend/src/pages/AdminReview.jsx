import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function AdminReview() {
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await api("/api/applications");
    setApps(data.applications);
    if (!selectedId && data.applications[0]) {
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
    <div>
      <h1>Admin review</h1>
      <p className="muted">
        Human review before any adverse action. Saving a decision here is a demo
        workflow only — it is not an AICTE regulatory order.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="grid-2">
        <div className="card">
          <h3>Queue</h3>
          {apps.map((a) => (
            <p key={a.id}>
              <button
                type="button"
                className={a.id === selectedId ? "btn btn-primary" : "btn btn-outline"}
                onClick={() => setSelectedId(a.id)}
              >
                {a.id}
              </button>
              <br />
              <span className="muted">
                {a.category} · {a.status} · {a.validation?.overall || "not validated"}
              </span>
            </p>
          ))}
        </div>
        <div className="card">
          {!selected && <p>Select an application.</p>}
          {selected && (
            <>
              <h3>{selected.instituteName}</h3>
              <p>
                {selected.id} · contact {selected.contactName}
              </p>
              <p>
                Findings: {selected.validation?.findings?.length || 0} · Review:{" "}
                {selected.review?.decision}
              </p>
              <Link to={`/applications/${selected.id}/results`}>
                Open full results
              </Link>
              <label htmlFor="notes" style={{ marginTop: 16 }}>
                Reviewer notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record why additional evidence or inspection is needed"
              />
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => decide("needs_evidence")}
                >
                  Request evidence
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => decide("inspect")}
                >
                  Flag for inspection
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => decide("cleared_for_officer")}
                >
                  Clear for officer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
