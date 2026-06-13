import type { Place } from "@/lib/types";

export type MapProvider = "kakao" | "google";

/**
 * 한국 좌표 범위 (좌표 기반 판별).
 * lat 33.0–38.7: 마라도(최남단) ~ 비무장지대.
 * lng 124.0–132.0: 백령도 ~ 독도.
 * 현재 30개 장소 기준: 26개 한국(통과), 4개 해외(실패) — 물의교회(일본), 안탈리아(터키), 브라이턴/세븐시스터즈(영국).
 */
export function isKorea(lat: number, lng: number): boolean {
  return lat >= 33.0 && lat <= 38.7 && lng >= 124.0 && lng <= 132.0;
}

/** 단일 장소의 지도 프로바이더를 반환합니다. */
export function pickProvider(place: Place): MapProvider {
  return isKorea(place.lat, place.lng) ? "kakao" : "google";
}

/**
 * 필터된 장소 목록 전체에 대한 프로바이더를 반환합니다.
 * 규칙: 모두 한국 → kakao / 한 곳이라도 해외 → google / 빈 목록 → kakao(기본).
 *
 * 현재 데이터(30개) 적용 결과:
 *   - 기본(필터 없음): "google" (해외 4곳 포함)
 *   - 한국만 필터: "kakao"
 *   - 해외 장소 포함 시: "google"
 */
export function pickProviderForSet(places: Place[]): MapProvider {
  if (places.length === 0) return "kakao";
  return places.every((p) => isKorea(p.lat, p.lng)) ? "kakao" : "google";
}
