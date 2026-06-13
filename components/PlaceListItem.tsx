"use client";

import { CATEGORY_META } from "@/lib/constants";
import { formatKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizeField } from "@/lib/i18n/localizeField";
import type { Place } from "@/lib/types";

// Maps status key → accent token classes for dark/light theme compatibility.
// STATUS_META bg/color values are light-theme only; accent tokens auto-flip.
const STATUS_CHIP: Record<string, string> = {
  recommended: "bg-accent-green/15 text-accent-green",
  good: "bg-accent-blue/15 text-accent-blue",
  bad: "bg-accent-red/15 text-accent-red",
};

export default function PlaceListItem({
  place,
  active,
  onClick,
  distanceKm,
}: {
  place: Place;
  active: boolean;
  onClick: () => void;
  distanceKm?: number;
}) {
  const { t, locale } = useI18n();
  const cat = CATEGORY_META[place.category];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
        active
          ? "border-accent-red bg-surface-2"
          : "border-hairline bg-surface-1 hover:bg-surface-2"
      }`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-3">
        {place.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.photos[0]}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            {cat.emoji}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-ink">
            {place.name}
          </span>
          {distanceKm !== undefined && (
            <span className="ml-auto shrink-0 rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
              {formatKm(distanceKm)}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {localizeField(place.description_i18n, locale, place.description)}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: cat.color + "1a", color: cat.color }}
          >
            {t(`category.${place.category}`)}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[place.status] ?? ""}`}
          >
            {t(`status.${place.status}`)}
          </span>
        </div>
      </div>
    </button>
  );
}
