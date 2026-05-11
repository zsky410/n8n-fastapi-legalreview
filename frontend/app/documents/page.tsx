export default function DocumentsPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1>Documents</h1>
        </div>
        <span className="status-pill neutral">0 active</span>
      </header>

      <section className="data-panel">
        <div className="table-header">
          <span>Filename</span>
          <span>Status</span>
          <span>Risk</span>
          <span>Updated</span>
        </div>
        <div className="empty-state">No documents yet</div>
      </section>
    </section>
  );
}

