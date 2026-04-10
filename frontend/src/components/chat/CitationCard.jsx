export default function CitationCard({ citation }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{citation.label}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{citation.excerpt}</p>
      {citation.source ? <p className="mt-2 text-xs text-slate-500">Source: {citation.source}</p> : null}
      {citation.rationale ? <p className="mt-1 text-xs text-slate-500">{citation.rationale}</p> : null}
    </div>
  );
}
