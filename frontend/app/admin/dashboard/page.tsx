const stats = [
  ["Total documents", "0"],
  ["AI approved", "0"],
  ["Pending admin", "0"],
  ["Rejected", "0"],
  ["Agreement rate", "0%"],
];

export default function AdminDashboardPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="stat-grid">
        {stats.map(([label, value]) => (
          <div className="stat-panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
    </section>
  );
}

