export default function CitationCard({ citation }) {
  return (
    <div className="rounded-card border border-line bg-brand-50 px-4 py-3 shadow-ring">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{citation.label}</div>
      <p className="mt-2 text-lg leading-relaxed text-muted">{citation.excerpt}</p>
      {citation.source ? <p className="mt-2 text-xs text-muted">Source: {citation.source}</p> : null}
      {citation.rationale ? <p className="mt-1 text-xs text-muted">{citation.rationale}</p> : null}
    </div>
  );
}
