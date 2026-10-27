import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div>
      <header className="topbar">
        <span className="brand">VerifyAI</span>
        <nav className="nav">
          <a href="#how">How it works</a>
          <a href="#scope">Demo scope</a>
        </nav>
        <Link className="btn btn-ghost" to="/login">
          Institution login
        </Link>
      </header>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <p className="muted" style={{ color: "#9eb6d4" }}>
              SIH 26261 · Smart Automation · Student prototype
            </p>
            <h1>
              Preliminary checks for technical-institution approval applications
            </h1>
            <p>
              VerifyAI helps reviewers spot missing documents, expired dates,
              and inconsistencies against a local demo register — before a
              human officer decides.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" to="/login">
                Open demo login
              </Link>
              <a className="btn btn-ghost" href="#scope">
                What this is not
              </a>
            </div>
          </div>
          <div className="hero-card">
            <h3>Decision support only</h3>
            <p className="muted">
              Statutory scrutiny and final approval stay with competent
              authorities. This demo never issues or rejects an AICTE EoA.
            </p>
            <ul>
              <li>Application checklist by category</li>
              <li>Document upload and file-hash duplicate flags</li>
              <li>Evidence-linked findings for a reviewer</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="section" id="how">
        <h2>How the demo works</h2>
        <div className="grid-3">
          <article className="card">
            <h3>1. File an application</h3>
            <p className="muted">
              An institution user submits EoA / new course / intake details.
            </p>
          </article>
          <article className="card">
            <h3>2. Upload documents</h3>
            <p className="muted">
              Supporting files are stored locally and classified from the form.
            </p>
          </article>
          <article className="card">
            <h3>3. Review flags</h3>
            <p className="muted">
              An admin sees findings, notes, and records a demo review action.
            </p>
          </article>
        </div>
      </section>
      <section className="section" id="scope">
        <h2>Clearly labelled demo limits</h2>
        <div className="card">
          <p>
            There is <strong>no AICTE portal integration</strong>, no NAD / DigiLocker
            connection, and <strong>no genuine certificate verification</strong>.
            Institution records, Fire NOC expiry, and intake figures are sample
            data in this repository.
          </p>
          <p className="muted">
            PDF text scanning is a simple local heuristic, not production OCR.
            Anomaly flags are preliminary indicators for a human, not proof of
            forgery.
          </p>
        </div>
      </section>
      <footer className="footer-dark">
        VerifyAI · SIH problem statement 26261 · Built as a working student demo
      </footer>
    </div>
  );
}
