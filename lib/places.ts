import placesData from "@/data/places.json";
import type { Place } from "./types";

// 레포의 data/places.json 을 단일 소스로 사용 (사용자는 읽기 전용).
export function getAllPlaces(): Place[] {
  return placesData as Place[];
}

export function getPlaceById(id: string): Place | undefined {
  return getAllPlaces().find((p) => p.id === id);
}

// 지도 초기 중심 = 모든 장소의 평균 좌표 (없으면 서울 시청)
export function getMapCenter(places: Place[]): { lat: number; lng: number } {
  if (places.length === 0) return { lat: 37.5663, lng: 126.9779 };
  const sum = places.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / places.length, lng: sum.lng / places.length };
}
