"use client";

import { CATEGORY_META, PRICE_LABEL, STATUS_META } from "@/lib/constants";
import type { Place } from "@/lib/types";

export default function PlaceListItem({
  place,
  active,
  onClick,
}: {
  place: Place;
  active: boolean;
  onClick: () => void;
}) {
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
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {place.description}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: cat.color + "1a", color: cat.color }}
          >
            {cat.label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          {place.priceLevel && (
            <span className="text-[10px] font-semibold text-neutral-400">
              {PRICE_LABEL[place.priceLevel]}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
