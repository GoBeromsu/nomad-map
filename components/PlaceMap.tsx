"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  isKorea,
  otherProvider,
  pickProviderForSet,
  type MapProvider,
} from "@/lib/maps/provider";
import type { Place } from "@/lib/types";

export interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number } | null;
  onLoadError?: () => void;
}

// 두 import 모두 모듈 스코프 최상단에 선언 — Next.js 정적 분석(코드 스플리팅)에 필수.
// lazy 로드이므로 실제 렌더링 전까지 번들 청크를 가져오지 않습니다.
function MapLoading() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useI18n();
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-2 text-sm text-muted">
      {t("map.loading")}
    </div>
  );
}

const KakaoMap = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <MapLoading />,
});

const GoogleMap = dynamic(() => import("@/components/GoogleMapView"), {
  ssr: false,
  loading: () => <MapLoading />,
});

// 사용자가 고른 모드: "auto"는 좌표 기반 자동 선택, 나머지는 강제 지정.
type ProviderChoice = "auto" | MapProvider;
const CHOICE_KEY = "nm-map-provider";
const CHOICES: ProviderChoice[] = ["auto", "kakao", "google"];

/**
 * 단일 지도 진입점. 세 가지를 한 곳에서 처리합니다.
 *  1. 자동 선택: places 좌표 기준(한국→Kakao / 해외 포함→Google).
 *  2. 수동 토글: 사용자가 자동/Kakao/Google 중 선택, localStorage에 저장.
 *  3. 자동 폴백: 선택된 프로바이더의 SDK 로드가 실패하면 반대편으로 즉시 전환.
 * MapView와 동일한 props를 받으므로 Explorer에서 drop-in 교체가 가능합니다.
 */
export default function PlaceMap(props: MapViewProps) {
  const { t } = useI18n();

  // 수동 선택 — 클라이언트에서만 localStorage 조회(SSR 안정성 위해 "auto" 기본).
  const [choice, setChoice] = useState<ProviderChoice>("auto");
  useEffect(() => {
    const saved = localStorage.getItem(CHOICE_KEY);
    if (saved === "auto" || saved === "kakao" || saved === "google") {
      setChoice(saved);
    }
  }, []);

  // 이번 세션에서 로드 실패한 프로바이더 집합(폴백 판단용).
  const [failed, setFailed] = useState<Set<MapProvider>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  // Provider auto-selection. Once the globe hands off (or a place is deep-linked)
  // we know the focus coordinate, so route Korea→Kakao / overseas→Google by that
  // single point. Until then, fall back to the set-wide heuristic.
  const coord = props.initialCenter ?? props.userLocation ?? null;
  const auto = coord
    ? isKorea(coord.lat, coord.lng)
      ? "kakao"
      : "google"
    : pickProviderForSet(props.places);
  const desired: MapProvider = choice === "auto" ? auto : choice;

  // 실효 프로바이더: 원하는 쪽이 실패했고 반대편은 멀쩡하면 폴백.
  const effective: MapProvider = useMemo(() => {
    if (failed.has(desired)) {
      const alt = otherProvider(desired);
      if (!failed.has(alt)) return alt;
    }
    return desired;
  }, [desired, failed]);

  const setProvider = (next: ProviderChoice) => {
    setChoice(next);
    localStorage.setItem(CHOICE_KEY, next);
    setNotice(null); // 수동 전환 시 폴백 안내 숨김
  };

  const handleLoadError = useCallback(
    (failedProvider: MapProvider) => {
      setFailed((prev) => {
        if (prev.has(failedProvider)) return prev;
        const next = new Set(prev);
        next.add(failedProvider);
        return next;
      });
      const alt = otherProvider(failedProvider);
      setNotice(
        t("map.provider.fallback", {
          from: t(`map.provider.${failedProvider}`),
          to: t(`map.provider.${alt}`),
        }),
      );
    },
    [t],
  );

  const Active = effective === "kakao" ? KakaoMap : GoogleMap;

  return (
    <div className="relative h-full w-full">
      <Active {...props} onLoadError={() => handleLoadError(effective)} />

      {/* 프로바이더 토글 (자동 / Kakao / Google). 우하단 정렬.
          모바일에서는 하단 중앙 '목록 보기' 버튼과 같은 띠(bottom-4)에 놓이면
          겹치므로 한 단 위로 올린다(bottom-16). 데스크톱(md+)은 목록 버튼이
          없으므로 bottom-4로 복귀. */}
      <div
        role="group"
        aria-label={t("map.provider.label")}
        className="absolute bottom-16 right-3 z-20 flex items-center gap-0.5 rounded-full border border-hairline bg-surface-1/90 p-0.5 text-[11px] font-semibold shadow-md backdrop-blur md:bottom-4"
      >
        {CHOICES.map((c) => {
          const selected = choice === c;
          const isFailed = c !== "auto" && failed.has(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setProvider(c)}
              aria-pressed={selected}
              title={isFailed ? t("map.errorTitle") : undefined}
              className={`rounded-full px-2.5 py-1 transition ${
                selected
                  ? "bg-cta text-cta-ink"
                  : "text-body hover:bg-surface-2"
              } ${isFailed ? "line-through opacity-50" : ""}`}
            >
              {t(`map.provider.${c}`)}
            </button>
          );
        })}
      </div>

      {/* 폴백 안내 토스트 */}
      {notice && (
        <div
          role="status"
          className="absolute bottom-28 right-3 z-20 max-w-[260px] rounded-lg border border-hairline bg-surface-1/95 px-3 py-2 text-xs text-body shadow-md backdrop-blur md:bottom-16"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
