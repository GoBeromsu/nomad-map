"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Place } from "@/lib/types";

interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapView({
  places,
  selectedId,
  onSelect,
  userLocation,
}: MapViewProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
  const meMarkerRef = useRef<any>(null);
  const didCenterOnMe = useRef(false);
  const lastFlyToId = useRef<string | null>(null);
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

  // LIMITATION: Kakao lacks full JSON dark styling — apply a subtle CSS filter
  // to the map container so it doesn't glare against the dark UI.
  // Markers remain theme-aware via .nm-marker and are unaffected by this mild filter.
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.filter =
      theme === "dark" ? "brightness(0.85) contrast(1.05)" : "";
  }, [theme]);

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

    return () => {
      overlaysRef.current.forEach((ov) => ov.setMap(null));
      overlaysRef.current.clear();
    };
  }, [places, ready]);

  // 선택된 장소 강조 + 중심 이동 (fly-to)
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    overlaysRef.current.forEach((ov, id) => {
      const el = ov.getContent() as HTMLElement;
      el.classList.toggle("nm-marker--active", id === selectedId);
      if (id === selectedId) ov.setZIndex(100);
      else ov.setZIndex(1);
    });
    // Only animate fly-to when selectedId actually changed to a new non-null value.
    // Re-runs caused by places array changes (filtering) skip the zoom so the
    // camera does not yank while the user is just filtering.
    if (selectedId && selectedId !== lastFlyToId.current) {
      const place = places.find((p) => p.id === selectedId);
      if (place) {
        const latlng = new window.kakao.maps.LatLng(place.lat, place.lng);
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) {
          // Jump without animation for reduced-motion users.
          mapRef.current.setLevel(4);
          mapRef.current.setCenter(latlng);
        } else {
          mapRef.current.panTo(latlng);
          mapRef.current.setLevel(4, { animate: { duration: 450 } });
        }
        lastFlyToId.current = selectedId;
      }
    }
  }, [selectedId, ready, places]);

  // 현재 위치 마커 — userLocation이 생기면 표시하고, 최초 1회 그쪽으로 중심 이동
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao || !userLocation) return;
    const kakao = window.kakao;
    const pos = new kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    if (!meMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "nm-here";
      el.setAttribute("aria-hidden", "true");
      meMarkerRef.current = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 50,
      });
      meMarkerRef.current.setMap(mapRef.current);
    } else {
      meMarkerRef.current.setPosition(pos);
    }

    if (!didCenterOnMe.current && places.length === 0) {
      mapRef.current.setLevel(6);
      mapRef.current.setCenter(pos);
      didCenterOnMe.current = true;
    }
  }, [userLocation, ready, places.length]);

  const recenterToMe = () => {
    if (!mapRef.current || !window.kakao || !userLocation) return;
    mapRef.current.setLevel(6);
    mapRef.current.panTo(
      new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
    );
  };

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-2 p-8 text-center">
        <div className="max-w-sm">
          <p className="text-lg font-semibold text-ink">
            {t("map.errorTitle")}
          </p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <p className="mt-4 rounded-lg bg-surface-3 p-3 text-left text-xs text-body">
            {t("map.errorHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label={t("app.title")}
      />
      {userLocation && (
        <button
          type="button"
          onClick={recenterToMe}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1/95 px-3 py-2 text-xs font-semibold text-body shadow-md backdrop-blur transition hover:bg-surface-1"
        >
          <span aria-hidden="true">📍</span>
          {t("map.recenter")}
        </button>
      )}
    </div>
  );
}
