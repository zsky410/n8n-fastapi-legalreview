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
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm trong bảng"
            className="h-11 w-full rounded-[10px] border border-line bg-[#fffefa] pl-11 pr-4 text-lg text-ink outline-none transition placeholder:text-muted focus-visible:border-muted-strong focus-visible:shadow-[inset_0_0_0_1px_rgb(134,134,133)]"
          />
        </label>
      ) : null}
      <div className={cn("overflow-hidden bg-[#fffefa]", flat ? "" : "rounded-card-lg border border-line shadow-ring")}>
        <div className="overflow-x-auto">
          <table className={cn("w-full min-w-[720px] table-fixed border-collapse divide-y divide-line", flat ? "border-t border-line" : "")}>
            <thead className={cn(flat ? "bg-surface/70" : "bg-surface")}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted",
                      column.className?.includes("text-right") ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "motion-safe:transition-transform motion-safe:hover:scale-105 motion-safe:active:scale-95 inline-flex items-center gap-2 rounded-full",
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
            <tbody className="divide-y divide-line">
              {visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row[rowKey]} className="align-top text-lg text-ink transition hover:bg-surface">
                    {columns.map((column) => (
                      <td
                        key={`${row[rowKey]}-${column.key}`}
                        className={cn("px-4 py-4 align-middle", column.className)}
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
