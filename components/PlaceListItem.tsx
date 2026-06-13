"use client";

import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { formatKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Place } from "@/lib/types";

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
  const { t } = useI18n();
  const cat = CATEGORY_META[place.category];
  const status = STATUS_META[place.status];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
        active
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
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
          <span className="truncate text-sm font-semibold text-neutral-900">
            {place.name}
          </span>
          {distanceKm !== undefined && (
            <span className="ml-auto shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
              {formatKm(distanceKm)}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {place.description}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: cat.color + "1a", color: cat.color }}
          >
            {t(`category.${place.category}`)}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {t(`status.${place.status}`)}
          </span>
        </div>
      </div>
    </button>
  );
}
