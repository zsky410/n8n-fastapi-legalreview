export default function CitationCard({ citation }) {
  return (
    <div className="rounded-sm border border-line bg-brand-50/90 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{citation.label}</div>
      <p className="mt-2 text-sm leading-6 text-muted">{citation.excerpt}</p>
      {citation.source ? <p className="mt-2 text-xs text-muted">Source: {citation.source}</p> : null}
      {citation.rationale ? <p className="mt-1 text-xs text-muted">{citation.rationale}</p> : null}
    </div>
  );
}
