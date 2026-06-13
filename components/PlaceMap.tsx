"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { pickProviderForSet } from "@/lib/maps/provider";
import type { Place } from "@/lib/types";

export interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
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

/**
 * 단일 지도 진입점. places 목록을 기준으로 프로바이더를 자동 선택합니다.
 * - 모두 한국 좌표 → Kakao Maps
 * - 해외 장소 포함 → Google Maps
 * MapView와 동일한 props를 받으므로 Explorer에서 drop-in 교체가 가능합니다.
 */
export default function PlaceMap(props: MapViewProps) {
  const provider = pickProviderForSet(props.places);
  return provider === "kakao" ? (
    <KakaoMap {...props} />
  ) : (
    <GoogleMap {...props} />
  );
}
