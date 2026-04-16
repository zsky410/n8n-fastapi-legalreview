export default function CitationCard({ citation }) {
  return (
    <div className="rounded-card border border-brand-500/12 bg-brand-50/70 px-4 py-3 shadow-[0_10px_22px_rgba(30,58,138,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{citation.label}</div>
      <p className="mt-2 text-[14px] leading-6 text-muted">{citation.excerpt}</p>
      {citation.source ? <p className="mt-2 text-xs text-muted">Source: {citation.source}</p> : null}
      {citation.rationale ? <p className="mt-1 text-xs text-muted">{citation.rationale}</p> : null}
    </div>
  );
}
