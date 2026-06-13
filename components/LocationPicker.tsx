"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao";

// 관리자용: 지도를 클릭해 위도/경도를 선택. 주소 검색도 지원.
export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !ref.current) return;
        const center = new kakao.maps.LatLng(lat || 37.5663, lng || 126.9779);
        const map = new kakao.maps.Map(ref.current, { center, level: 5 });
        const marker = new kakao.maps.Marker({ position: center });
        marker.setMap(map);
        mapRef.current = map;
        markerRef.current = marker;

        kakao.maps.event.addListener(map, "click", (e: any) => {
          const ll = e.latLng;
          marker.setPosition(ll);
          onChangeRef.current(ll.getLat(), ll.getLng());
        });
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 외부에서 lat/lng가 바뀌면 마커/중심 동기화
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const ll = new window.kakao.maps.LatLng(lat, lng);
    markerRef.current?.setPosition(ll);
  }, [lat, lng]);

  const search = () => {
    if (!keyword.trim() || !window.kakao?.maps?.services) return;
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword, (data: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && data[0]) {
        const { y, x } = data[0];
        const nlat = parseFloat(y);
        const nlng = parseFloat(x);
        onChangeRef.current(nlat, nlng);
        const ll = new window.kakao.maps.LatLng(nlat, nlng);
        mapRef.current?.setCenter(ll);
        markerRef.current?.setPosition(ll);
      }
    });
  };

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        지도 로드 실패: {error} — 위도/경도를 직접 입력하세요.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          aria-label="장소 또는 주소 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="장소/주소 검색 (예: 프릳츠 마포)"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <button
          type="button"
          onClick={search}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          검색
        </button>
      </div>
      <div
        ref={ref}
        className="h-56 w-full overflow-hidden rounded-lg border border-neutral-200"
      />
      <p className="text-xs text-neutral-400">
        지도를 클릭하거나 검색해서 위치를 지정하세요. 현재: {lat.toFixed(5)},{" "}
        {lng.toFixed(5)}
      </p>
    </div>
  );
}
