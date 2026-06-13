"use client";

import { useState } from "react";
import RatingBars from "./RatingBars";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizeField } from "@/lib/i18n/localizeField";
import type { Place } from "@/lib/types";

// Maps status key → accent token classes for dark/light theme compatibility.
const STATUS_CHIP: Record<string, string> = {
  recommended: "bg-accent-green/15 text-accent-green",
  good: "bg-accent-blue/15 text-accent-blue",
  bad: "bg-accent-red/15 text-accent-red",
};

export default function PlaceDetail({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [photoIdx, setPhotoIdx] = useState(0);
  const cat = CATEGORY_META[place.category];
  const photos = place.photos.length > 0 ? place.photos : [];

  return (
    <div className="flex h-full flex-col">
      {/* 사진 */}
      <div className="relative aspect-[4/3] w-full shrink-0 bg-surface-3">
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
                    aria-label={`${i + 1}`}
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
          aria-label={t("common.close")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-muted backdrop-blur transition hover:bg-black/60 hover:text-ink"
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
            {cat.emoji} {t(`category.${place.category}`)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CHIP[place.status] ?? ""}`}
          >
            {t(`status.${place.status}`)}
          </span>
        </div>

        <h2 className="mt-3 text-xl font-bold text-ink">{place.name}</h2>
        {place.address && (
          <p className="mt-1 text-sm text-muted">{place.address}</p>
        )}
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          {localizeField(place.description_i18n, locale, place.description)}
        </p>

        {place.tags && place.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {place.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 노마드 평가 */}
        <section className="mt-5 rounded-xl border border-hairline p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">
            {t("detail.ratings")}
          </h3>
          <RatingBars ratings={place.ratings} />
        </section>

        {/* 코멘트 */}
        {place.comment && (place.comment.date || place.comment.duration || place.comment.note || place.comment.note_i18n) && (
          <section className="mt-4 rounded-xl bg-surface-2 p-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              {t("detail.comment")}
            </h3>
            <div className="space-y-1 text-sm text-muted">
              {(place.comment.date || place.comment.duration) && (
                <p>
                  <span aria-hidden="true">📅</span> {place.comment.date}
                  {place.comment.duration ? ` · ${place.comment.duration}` : ""}
                </p>
              )}
              {(place.comment.note || place.comment.note_i18n) && (
                <p className="text-body">
                  <span aria-hidden="true">💬</span>{" "}
                  {localizeField(place.comment.note_i18n, locale, place.comment.note ?? "")}
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
      className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2.5 text-sm font-medium text-body transition hover:bg-surface-2"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
      <span aria-hidden className="text-muted">
        ↗
      </span>
    </a>
  );
}
