import { ArrowDownZA, ArrowUpAZ, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "../../lib/cn.js";
import EmptyState from "./EmptyState.jsx";

export default function DataTable({
  columns = [],
  flat = false,
  emptyDescription,
  emptyTitle = "Chưa có dữ liệu",
  rows = [],
  rowKey = "id",
  searchable = true,
  searchKeys = [],
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(columns.find((column) => column.sortable)?.key || "");
  const [sortDirection, setSortDirection] = useState("asc");
  const activeSortKey =
    columns.find((column) => column.key === sortKey)?.key ||
    columns.find((column) => column.sortable)?.key ||
    "";

  let visibleRows = rows;

  if (query.trim() && searchKeys.length) {
    const normalizedQuery = query.trim().toLowerCase();
    visibleRows = visibleRows.filter((row) =>
      searchKeys.some((key) => String(row[key] || "").toLowerCase().includes(normalizedQuery)),
    );
  }

  if (activeSortKey) {
    visibleRows = [...visibleRows].sort((leftRow, rightRow) => {
      const leftValue = String(leftRow[activeSortKey] ?? "");
      const rightValue = String(rightRow[activeSortKey] ?? "");
      return sortDirection === "asc"
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    });
  }

  function toggleSort(nextKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDirection("asc");
      return;
    }

    setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {searchable && searchKeys.length ? (
        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/70 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã, tên tài liệu, trạng thái..."
              className="min-h-[48px] w-full rounded-[16px] border border-slate-200/80 bg-[#f8fafc] pl-11 pr-4 text-[14px] text-ink outline-none transition placeholder:text-slate-400 focus-visible:border-brand-500/30 focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_rgba(30,58,138,0.08)]"
            />
          </label>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {visibleRows.length} bản ghi
          </div>
        </div>
      ) : null}
      <div className={cn("overflow-hidden rounded-card-lg border border-slate-200/80 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.06)]", flat ? "" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead className="border-b border-slate-200/80 bg-[#f5f7fb]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted",
                      column.className?.includes("text-right") ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full transition-transform motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99]",
                          column.className?.includes("text-right")
                            ? "ml-auto w-full justify-end text-right"
                            : "text-left",
                        )}
                      >
                        {column.label}
                        {activeSortKey === column.key ? (
                          sortDirection === "asc" ? (
                            <ArrowUpAZ className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownZA className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row[rowKey]} className="align-top text-[14px] text-ink transition hover:bg-[#f8faff]">
                    {columns.map((column) => (
                      <td
                        key={`${row[rowKey]}-${column.key}`}
                        className={cn("px-5 py-4 align-middle", column.className)}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    <EmptyState
                      title="Không tìm thấy bản ghi phù hợp"
                      description="Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc."
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
