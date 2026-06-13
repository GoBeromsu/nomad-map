"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao";
import { CATEGORY_META } from "@/lib/constants";
import type { Place } from "@/lib/types";

interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({ places, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(36.5, 127.8),
          level: 13,
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // 마커(커스텀 오버레이) 렌더링 — 필터된 목록이 바뀔 때마다 갱신
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    const kakao = window.kakao;
    const map = mapRef.current;

    // 기존 오버레이 제거
    overlaysRef.current.forEach((ov) => ov.setMap(null));
    overlaysRef.current.clear();

    if (places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const pos = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(pos);

      const meta = CATEGORY_META[place.category];
      const el = document.createElement("div");
      el.className = "nm-marker";
      el.dataset.id = place.id;
      el.innerHTML = `
        <button type="button" aria-label="${place.name}" style="--mc:${meta.color}">
          <span class="nm-marker__emoji">${meta.emoji}</span>
          <span class="nm-marker__name">${place.name}</span>
        </button>`;
      el.querySelector("button")!.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(place.id);
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        yAnchor: 1,
        clickable: true,
      });
      overlay.setMap(map);
      overlaysRef.current.set(place.id, overlay);
    });

    map.setBounds(bounds, 60, 60, 60, 60);
  }, [places, ready]);

  // 선택된 장소 강조 + 중심 이동
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    overlaysRef.current.forEach((ov, id) => {
      const el = ov.getContent() as HTMLElement;
      el.classList.toggle("nm-marker--active", id === selectedId);
      if (id === selectedId) ov.setZIndex(100);
      else ov.setZIndex(1);
    });
    if (selectedId) {
      const place = places.find((p) => p.id === selectedId);
      if (place) {
        mapRef.current.panTo(
          new window.kakao.maps.LatLng(place.lat, place.lng),
        );
      }
    }
  }, [selectedId, ready, places]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 p-8 text-center">
        <div className="max-w-sm">
          <p className="text-lg font-semibold text-neutral-800">
            지도를 불러올 수 없습니다
          </p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
          <p className="mt-4 rounded-lg bg-neutral-200 p-3 text-left text-xs text-neutral-600">
            <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 환경변수에 Kakao JavaScript
            키를 설정하고, Kakao Developers 콘솔에서 사이트 도메인을 등록했는지
            확인하세요.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
