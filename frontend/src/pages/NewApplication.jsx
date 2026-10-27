import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NewApplication() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    instituteName: "Bharat Institute of Technology",
    category: "EOA",
    academicYear: "2026-27",
    contactName: "Dr. Meera Sharma",
    contactEmail: "registrar@bit-jaipur.demo",
    claimedFacultyCount: 40,
    claimedIntakeCse: 180,
    claimedIntakeEce: 60,
    claimsNba: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate(`/applications/${data.application.id}/upload`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>New application</h1>
      <p className="muted">
        Default values include a few mismatches so validation has something to
        flag. Change them if you want a cleaner run.
      </p>
      <form className="card" onSubmit={submit}>
        <div className="grid-2">
          <div>
            <label htmlFor="instituteName">Institute name</label>
            <input
              id="instituteName"
              value={form.instituteName}
              onChange={(e) => set("instituteName", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="category">Application category</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="EOA">Extension of Approval (EoA)</option>
              <option value="NEW_COURSE">New course</option>
              <option value="INTAKE_INCREASE">Intake increase</option>
            </select>
          </div>
          <div>
            <label htmlFor="academicYear">Academic year</label>
            <input
              id="academicYear"
              value={form.academicYear}
              onChange={(e) => set("academicYear", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contactName">Contact name</label>
            <input
              id="contactName"
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contactEmail">Contact email</label>
            <input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="claimedFacultyCount">Claimed faculty count</label>
            <input
              id="claimedFacultyCount"
              type="number"
              value={form.claimedFacultyCount}
              onChange={(e) => set("claimedFacultyCount", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="claimedIntakeCse">Claimed CSE intake</label>
            <input
              id="claimedIntakeCse"
              type="number"
              value={form.claimedIntakeCse}
              onChange={(e) => set("claimedIntakeCse", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="claimedIntakeEce">Claimed ECE intake</label>
            <input
              id="claimedIntakeEce"
              type="number"
              value={form.claimedIntakeEce}
              onChange={(e) => set("claimedIntakeEce", e.target.value)}
            />
          </div>
        </div>
        <label>
          <input
            type="checkbox"
            checked={form.claimsNba}
            onChange={(e) => set("claimsNba", e.target.checked)}
            style={{ width: "auto", marginRight: 8 }}
          />
          Claim NBA accreditation (demo register says not accredited)
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save and upload documents"}
          </button>
        </div>
      </form>
    </div>
  );
}
