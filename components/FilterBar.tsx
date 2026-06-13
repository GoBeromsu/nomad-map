"use client";

import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import type { Category, Status } from "@/lib/types";

export interface Filters {
  query: string;
  categories: Set<Category>;
  statuses: Set<Status>;
}

export default function FilterBar({
  filters,
  onChange,
  total,
  shown,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  total: number;
  shown: number;
}) {
  const toggleCategory = (c: Category) => {
    const next = new Set(filters.categories);
    next.has(c) ? next.delete(c) : next.add(c);
    onChange({ ...filters, categories: next });
  };
  const toggleStatus = (s: Status) => {
    const next = new Set(filters.statuses);
    next.has(s) ? next.delete(s) : next.add(s);
    onChange({ ...filters, statuses: next });
  };

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        placeholder="장소 이름, 태그 검색…"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
          const active = filters.categories.has(c);
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
              style={active ? { background: meta.color } : undefined}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(STATUS_META) as Status[]).map((s) => {
          const active = filters.statuses.has(s);
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className="rounded-full px-2.5 py-1 text-xs font-medium transition"
              style={{
                background: active ? meta.bg : "transparent",
                color: active ? meta.color : "#737373",
                border: `1px solid ${active ? meta.bg : "#e5e5e5"}`,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-neutral-400">
        {shown === total ? `총 ${total}곳` : `${total}곳 중 ${shown}곳 표시`}
      </p>
    </div>
  );
}
