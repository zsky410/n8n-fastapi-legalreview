export default function AdminQueuePage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reviewer workspace</p>
          <h1>Review queue</h1>
        </div>
        <span className="status-pill warning">0 pending</span>
      </header>

      <section className="data-panel">
        <div className="table-header admin">
          <span>Document</span>
          <span>Owner</span>
          <span>Flags</span>
          <span>Risk</span>
          <span>Age</span>
        </div>
        <div className="empty-state">No pending reviews</div>
      </section>
    </section>
  );
}

