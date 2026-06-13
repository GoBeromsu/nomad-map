"use client";

import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
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
  const { t } = useI18n();

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
      {/* Search input — .input class handles theme-aware border/bg/text/placeholder */}
      <input
        type="search"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        placeholder={t("filter.searchPlaceholder")}
        aria-label={t("filter.searchPlaceholder")}
        className="input"
      />

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
          const active = filters.categories.has(c);
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent text-cta-ink"
                  : "border-hairline bg-surface-2 text-body hover:bg-surface-3"
              }`}
              style={active ? { background: meta.color } : undefined}
            >
              {meta.emoji} {t(`category.${c}`)}
            </button>
          );
        })}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(STATUS_META) as Status[]).map((s) => {
          const active = filters.statuses.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-cta text-cta-ink"
                  : "border-hairline bg-surface-2 text-body hover:bg-surface-3"
              }`}
            >
              {t(`status.${s}`)}
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted">
        {t("filter.count", { total, shown })}
      </p>
    </div>
  );
}
