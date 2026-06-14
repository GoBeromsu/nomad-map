"use client";

import { useEffect, useRef, useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cat = CATEGORY_META[place.category];
  const photos = place.photos.length > 0 ? place.photos : [];
  const displayName = localizeField(place.name_i18n, locale, place.name);

  // Reset the gallery to the first photo whenever the place changes.
  useEffect(() => {
    setPhotoIdx(0);
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [place.id]);

  // Derive the active photo from the horizontal scroll position (native swipe).
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPhotoIdx((prev) => (prev === idx ? prev : idx));
  };

  const goToPhoto = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/place/${encodeURIComponent(place.id)}`;
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: displayName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // Share sheet dismissed or clipboard blocked — nothing to do.
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 사진 — 가로 스와이프 갤러리 (스크롤-스냅) */}
      <div className="relative aspect-[4/3] w-full shrink-0 bg-surface-3">
        {photos.length > 0 ? (
          <>
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="nm-gallery flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
            >
              {photos.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={i}
                  src={src}
                  alt={`${displayName} ${i + 1}`}
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full shrink-0 snap-center object-cover"
                />
              ))}
            </div>

            {photos.length > 1 && (
              <>
                {/* 이전/다음 (데스크톱·마우스용 — 모바일은 스와이프) */}
                <button
                  type="button"
                  onClick={() => goToPhoto(photoIdx - 1)}
                  aria-label="이전 사진"
                  disabled={photoIdx === 0}
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 disabled:opacity-0"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => goToPhoto(photoIdx + 1)}
                  aria-label="다음 사진"
                  disabled={photoIdx === photos.length - 1}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 disabled:opacity-0"
                >
                  ›
                </button>

                {/* 인디케이터 점 */}
                <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${i + 1}`}
                      aria-current={i === photoIdx ? "true" : undefined}
                      onClick={() => goToPhoto(i)}
                      className="pointer-events-auto flex h-9 w-6 items-center justify-center"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all ${
                          i === photoIdx ? "w-5 bg-white" : "w-1.5 bg-white/60"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {cat.emoji}
          </div>
        )}

        {/* 공유 + 닫기 */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label={t("detail.share")}
            title={t("detail.share")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          >
            <span aria-hidden="true">⤴</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          >
            ✕
          </button>
        </div>

        {copied && (
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur"
          >
            {t("detail.linkCopied")}
          </div>
        )}
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

        <h2 className="mt-3 text-xl font-bold text-ink">{displayName}</h2>
        {place.address && (
          <p className="mt-1 text-sm text-muted">{place.address}</p>
        )}
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          {localizeField(place.description_i18n, locale, place.description)}
        </p>

        {place.tags && place.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-muted"
              >
                #{tag}
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
