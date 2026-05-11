export default function AdminAuditLogsPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Traceability</p>
          <h1>Audit logs</h1>
        </div>
      </header>

      <section className="data-panel">
        <div className="table-header">
          <span>Action</span>
          <span>Actor</span>
          <span>Target</span>
          <span>Time</span>
        </div>
        <div className="empty-state">No audit events</div>
      </section>
    </section>
  );
}

