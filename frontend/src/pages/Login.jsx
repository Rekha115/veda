import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("institute");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setSession(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <p>
          <Link to="/">← Back to landing</Link>
        </p>
        <h2>Institution demo login</h2>
        <p className="muted">
          Use the labelled demo accounts. These are not AICTE credentials.
        </p>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div className="card" style={{ marginTop: 16 }}>
          <strong>Demo accounts</strong>
          <p className="muted">
            Institution: <code>institute</code> / <code>demo123</code>
            <br />
            Admin reviewer: <code>admin</code> / <code>demo123</code>
          </p>
        </div>
      </form>
    </div>
  );
}
