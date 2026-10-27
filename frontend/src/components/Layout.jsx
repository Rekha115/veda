import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getToken, getUser } from "../api";

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  async function logout() {
    const token = getToken();
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Sign out locally even if the API is unreachable.
    }
    clearSession();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand">
          VerifyAI
        </NavLink>
        <nav className="nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/applications/new">New application</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">Admin review</NavLink>}
        </nav>
        <div className="topbar-user">
          <span>
            {user?.displayName}
            <small>{user?.role}</small>
          </span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <div className="banner">
        Demo prototype for SIH 26261. Not connected to AICTE. Not genuine
        certificate verification.
      </div>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
