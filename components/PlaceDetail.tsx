"use client";

import { useState } from "react";
import RatingBars from "./RatingBars";
import { CATEGORY_META, PRICE_LABEL, STATUS_META } from "@/lib/constants";
import type { Place } from "@/lib/types";

export default function PlaceDetail({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const cat = CATEGORY_META[place.category];
  const status = STATUS_META[place.status];
  const photos = place.photos.length > 0 ? place.photos : [];

  return (
    <div className="flex h-full flex-col">
      {/* 사진 */}
      <div className="relative aspect-[4/3] w-full shrink-0 bg-neutral-100">
        {photos.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[photoIdx]}
              alt={place.name}
              className="h-full w-full object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`사진 ${i + 1}`}
                    aria-current={i === photoIdx ? "true" : undefined}
                    onClick={() => setPhotoIdx(i)}
                    className="flex h-9 w-6 items-center justify-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        i === photoIdx ? "w-5 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {cat.emoji}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: cat.color + "1a", color: cat.color }}
          >
            {cat.emoji} {cat.label}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          {place.priceLevel && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
              {PRICE_LABEL[place.priceLevel]}
            </span>
          )}
        </div>

        <h2 className="mt-3 text-xl font-bold text-neutral-900">{place.name}</h2>
        {place.address && (
          <p className="mt-1 text-sm text-neutral-500">{place.address}</p>
        )}
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {place.description}
        </p>

        {place.tags && place.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {place.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 노마드 평가 */}
        <section className="mt-5 rounded-xl border border-neutral-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-800">
            노마드 평가
          </h3>
          <RatingBars ratings={place.ratings} />
        </section>

        {/* 방문 기록 */}
        {place.visit && (place.visit.date || place.visit.duration || place.visit.note) && (
          <section className="mt-4 rounded-xl bg-neutral-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-neutral-800">
              방문 기록
            </h3>
            <div className="space-y-1 text-sm text-neutral-600">
              {(place.visit.date || place.visit.duration) && (
                <p>
                  <span aria-hidden="true">📅</span> {place.visit.date}
                  {place.visit.duration ? ` · ${place.visit.duration}` : ""}
                </p>
              )}
              {place.visit.note && (
                <p className="text-neutral-700">
                  <span aria-hidden="true">💬</span> {place.visit.note}
                </p>
              )}
            </div>
          </section>
        )}

        {/* 링크 / 채널 */}
        {((place.links && place.links.length > 0) ||
          (place.channels && place.channels.length > 0)) && (
          <section className="mt-4 space-y-2">
            {place.links?.map((l) => (
              <LinkRow key={l.url} label={l.label} url={l.url} icon="🔗" />
            ))}
            {place.channels?.map((c) => (
              <LinkRow key={c.url} label={c.label} url={c.url} icon="📣" />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function LinkRow({ label, url, icon }: { label: string; url: string; icon: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
      <span aria-hidden className="text-neutral-400">
        ↗
      </span>
    </a>
  );
}
