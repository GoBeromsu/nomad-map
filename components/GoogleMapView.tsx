"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps } from "@/lib/google";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizeField } from "@/lib/i18n/localizeField";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Place } from "@/lib/types";

export interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number } | null;
  /** SDK 로드 실패 시 호출 — 상위(PlaceMap)에서 다른 프로바이더로 자동 폴백. */
  onLoadError?: () => void;
}

export default function GoogleMapView({
  places,
  selectedId,
  onSelect,
  userLocation,
  initialCenter,
  onLoadError,
}: MapViewProps) {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const meMarkerRef = useRef<any>(null);
  const didCenterOnMe = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const lastFlownIdRef = useRef<string | null>(null);
  const zoomRafRef = useRef<number | null>(null);
  // Latest seed centre (handoff / shared place) read inside effects without
  // re-triggering them; `seededCenterRef` dedupes the one-shot recenter.
  const initialCenterRef = useRef(initialCenter);
  initialCenterRef.current = initialCenter;
  const seededCenterRef = useRef<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const map = new google.maps.Map(containerRef.current, {
          center: initialCenterRef.current ?? { lat: 36.5, lng: 127.8 },
          zoom: initialCenterRef.current ? 10 : 7,
          // AdvancedMarkerElement 사용을 위해 mapId 필요
          mapId: "nomad-map",
          // mapId 사용 시 styles 속성은 무시됨 — colorScheme으로 다크/라이트 전환.
          // 초기값을 생성자에서 바로 지정해야 마운트 시 라이트 타일이 번쩍이는
          // (flash-of-light) 현상을 막을 수 있다. 이후 토글은 아래 effect가 처리.
          colorScheme: theme === "dark" ? "DARK" : "LIGHT",
          // 불필요한 기본 UI 제거
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        onLoadErrorRef.current?.();
      });
    return () => {
      cancelled = true;
    };
    // theme는 생성자 초기값으로만 사용 — 토글 시 재초기화하면 안 되므로 deps에서 제외.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 시 colorScheme 재적용
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setOptions({
      colorScheme: theme === "dark" ? "DARK" : "LIGHT",
    });
  }, [theme, ready]);

  // 마커 렌더링 — 필터된 목록이 바뀔 때마다 갱신
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const google = window.google;
    const map = mapRef.current;

    // 기존 clusterer + 마커 제거
    if (clustererRef.current) {
      clustererRef.current.clearMarkers(true);
      (clustererRef.current as any).setMap(null);
      clustererRef.current = null;
    }
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    if (places.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const markersList: google.maps.marker.AdvancedMarkerElement[] = [];

    places.forEach((place) => {
      const pos = { lat: place.lat, lng: place.lng };
      bounds.extend(pos);

      const meta = CATEGORY_META[place.category];
      const name = localizeField(place.name_i18n, locale, place.name);
      const el = document.createElement("div");
      el.className = "nm-marker";
      el.dataset.id = place.id;
      el.innerHTML = `
        <button type="button" aria-label="${name}" style="--mc:${meta.color}">
          <span class="nm-marker__emoji">${meta.emoji}</span>
          <span class="nm-marker__name">${name}</span>
        </button>`;
      el.querySelector("button")!.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(place.id);
      });

      // map은 clusterer가 관리 — 직접 설정하지 않음
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        content: el,
        title: name,
      });
      markersRef.current.set(place.id, marker);
      markersList.push(marker);
    });

    // 커스텀 따뜻한 테마 클러스터 렌더러
    const renderer = {
      render(cluster: { count: number; position: google.maps.LatLng }, _stats: unknown) {
        const { count, position } = cluster;
        const size = count < 10 ? 40 : count < 50 ? 48 : 56;
        const el = document.createElement("div");
        el.className = "nm-cluster";
        el.setAttribute("aria-label", `${count}개 장소 클러스터`);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.fontSize = count >= 100 ? "11px" : "13px";
        el.textContent = String(count);
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: el,
          zIndex: 1000 + count,
        });
      },
    };

    clustererRef.current = new MarkerClusterer({ map, markers: markersList, renderer });

    // 핸드오프/공유 중심이 있으면 fitBounds로 덮어쓰지 않는다(아래 recenter effect가 처리).
    if (!initialCenterRef.current)
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers(true);
        (clustererRef.current as any).setMap(null);
        clustererRef.current = null;
      }
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, [places, ready, locale]);

  // 핸드오프(지구본 줌인) 또는 공유 진입 시: 전달된 중심으로 1회 이동.
  useEffect(() => {
    if (!ready || !mapRef.current || !initialCenter) return;
    const key = `${initialCenter.lat},${initialCenter.lng}`;
    if (seededCenterRef.current === key) return;
    seededCenterRef.current = key;
    mapRef.current.setZoom(10);
    mapRef.current.setCenter({ lat: initialCenter.lat, lng: initialCenter.lng });
  }, [initialCenter, ready]);

  // 선택된 장소 강조 + smooth fly-to (pan + animated zoom)
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    // Always update marker highlights on every re-run (filter changes included)
    markersRef.current.forEach((marker, id) => {
      const el = marker.content as HTMLElement;
      el.classList.toggle("nm-marker--active", id === selectedId);
      marker.zIndex = id === selectedId ? 100 : 1;
    });

    // Only fly-to when selectedId actually changes to a new value
    if (selectedId && selectedId !== lastFlownIdRef.current) {
      const place = places.find((p) => p.id === selectedId);
      if (place) {
        lastFlownIdRef.current = selectedId;
        const map = mapRef.current;
        const TARGET_ZOOM = 15;

        // Cancel any ongoing zoom animation before starting a new one
        if (zoomRafRef.current !== null) {
          cancelAnimationFrame(zoomRafRef.current);
          zoomRafRef.current = null;
        }

        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) {
          // Jump without animation for reduced-motion users.
          map.setCenter({ lat: place.lat, lng: place.lng });
          map.setZoom(TARGET_ZOOM);
          return;
        }

        // Pan immediately — Google Maps pan is inherently smooth
        map.panTo({ lat: place.lat, lng: place.lng });

        // Animate zoom with ease-out cubic over ~600 ms
        const startZoom: number = map.getZoom() ?? 7;
        if (startZoom < TARGET_ZOOM) {
          const startTime = performance.now();
          const DURATION = 600;

          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / DURATION, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            map.setZoom(startZoom + (TARGET_ZOOM - startZoom) * eased);
            if (progress < 1) {
              zoomRafRef.current = requestAnimationFrame(step);
            } else {
              zoomRafRef.current = null;
            }
          };
          zoomRafRef.current = requestAnimationFrame(step);
        }
      }
    } else if (!selectedId) {
      // Reset tracked id when selection is cleared so the same place re-flies next time
      lastFlownIdRef.current = null;
    }

    return () => {
      if (zoomRafRef.current !== null) {
        cancelAnimationFrame(zoomRafRef.current);
        zoomRafRef.current = null;
      }
    };
  }, [selectedId, ready, places]);

  // 현재 위치 마커 — userLocation이 생기면 표시하고, 최초 1회 그쪽으로 중심 이동
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google || !userLocation) return;
    const google = window.google;
    const pos = { lat: userLocation.lat, lng: userLocation.lng };

    if (!meMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "nm-here";
      el.setAttribute("aria-hidden", "true");
      meMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        map: mapRef.current,
        content: el,
        zIndex: 50,
      });
    } else {
      meMarkerRef.current.position = pos;
    }

    if (!didCenterOnMe.current && places.length === 0) {
      mapRef.current.setZoom(12);
      mapRef.current.setCenter(pos);
      didCenterOnMe.current = true;
    }
  }, [userLocation, ready, places.length]);

  const recenterToMe = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setZoom(12);
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
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
