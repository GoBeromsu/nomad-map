"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizeField } from "@/lib/i18n/localizeField";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Place } from "@/lib/types";

interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Cache drawn marker images so each category color+emoji combo is only
// rendered once per page load (max 5 entries for the 5 CATEGORY_META keys).
const markerImageCache = new Map<string, string>();

/**
 * Draw a filled circle with the category color and emoji into an off-screen
 * canvas and return a data URL suitable for kakao.maps.MarkerImage.
 */
function makeMarkerDataUrl(color: string, emoji: string): string {
  const cacheKey = `${color}|${emoji}`;
  const cached = markerImageCache.get(cacheKey);
  if (cached) return cached;

  const S = 36;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // Filled circle
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Emoji centred inside the circle
  ctx.font = `${Math.round(S * 0.48)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, S / 2, S / 2 + 1);

  const url = canvas.toDataURL();
  markerImageCache.set(cacheKey, url);
  return url;
}

export default function MapView({
  places,
  selectedId,
  onSelect,
  userLocation,
}: MapViewProps) {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  // Single CustomOverlay shown on top of the selected/active marker.
  const activePillRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const didCenterOnMe = useRef(false);
  const lastFlyToId = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 지도 초기화 + MarkerClusterer 초기화
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

        // MarkerClusterer: cluster when map level >= minLevel (more zoomed out).
        // At level < 6 (zoomed in), individual markers are shown.
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: false,
          styles: [
            {
              width: "44px",
              height: "44px",
              background: "#ffffff",
              border: "2px solid #e7ded0",
              borderRadius: "50%",
              color: "#2a2723",
              fontWeight: "700",
              fontSize: "13px",
              textAlign: "center",
              lineHeight: "40px",
              boxShadow: "0 2px 6px rgba(0,0,0,.2)",
            },
          ],
        });

        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // LIMITATION: Kakao has no native dark tile API (MapTypeId only offers
  // ROADMAP/SKYVIEW/HYBRID). The robust workaround is a colour-inversion CSS
  // filter on the tile container so the map reads as an intentional dark map
  // instead of a dimmed light one. The .nm-marker / .nm-here custom overlays
  // are counter-inverted in globals.css so their CSS-var colours survive.
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.filter =
      theme === "dark"
        ? "invert(0.93) hue-rotate(180deg) brightness(0.95) contrast(0.85) saturate(0.75)"
        : "";
  }, [theme]);

  // 마커 + 클러스터링 — 필터된 목록이 바뀔 때마다 갱신
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao || !clustererRef.current)
      return;
    const kakao = window.kakao;
    const map = mapRef.current;
    const clusterer = clustererRef.current;

    // Remove all previous markers from the clusterer (and thus the map).
    clusterer.clear();
    markersRef.current.clear();

    // The active pill was anchored to a marker that no longer exists.
    if (activePillRef.current) {
      activePillRef.current.setMap(null);
      activePillRef.current = null;
    }

    if (places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    const newMarkers: any[] = [];

    places.forEach((place) => {
      const pos = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(pos);

      const meta = CATEGORY_META[place.category];
      const imgUrl = makeMarkerDataUrl(meta.color, meta.emoji);
      const markerImage = new kakao.maps.MarkerImage(
        imgUrl,
        new kakao.maps.Size(36, 36),
        { offset: new kakao.maps.Point(18, 18) },
      );

      const marker = new kakao.maps.Marker({ position: pos, image: markerImage });
      kakao.maps.event.addListener(marker, "click", () => {
        onSelectRef.current(place.id);
      });

      markersRef.current.set(place.id, marker);
      newMarkers.push(marker);
    });

    clusterer.addMarkers(newMarkers);
    map.setBounds(bounds, 60, 60, 60, 60);

    return () => {
      clusterer.clear();
      markersRef.current.clear();
      if (activePillRef.current) {
        activePillRef.current.setMap(null);
        activePillRef.current = null;
      }
    };
  }, [places, ready]);

  // 선택된 장소: 이름 pill 오버레이 표시 + 중심 이동 (fly-to)
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    const kakao = window.kakao;

    // Tear down the previous active pill unconditionally.
    if (activePillRef.current) {
      activePillRef.current.setMap(null);
      activePillRef.current = null;
    }

    if (selectedId) {
      const place = places.find((p) => p.id === selectedId);
      if (place) {
        const pos = new kakao.maps.LatLng(place.lat, place.lng);
        const meta = CATEGORY_META[place.category];
        const name = localizeField(place.name_i18n, locale, place.name);
        const el = document.createElement("div");
        el.className = "nm-marker nm-marker--active";
        el.innerHTML = `
          <button type="button" aria-label="${name}" style="--mc:${meta.color}">
            <span class="nm-marker__emoji">${meta.emoji}</span>
            <span class="nm-marker__name">${name}</span>
          </button>`;
        el.querySelector("button")!.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(place.id);
        });
        activePillRef.current = new kakao.maps.CustomOverlay({
          position: pos,
          content: el,
          yAnchor: 1,
          clickable: true,
          zIndex: 100,
        });
        activePillRef.current.setMap(mapRef.current);
      }
    }

    // Only animate fly-to when selectedId actually changed to a new non-null value.
    // Re-runs caused by places array changes (filtering) skip the zoom so the
    // camera does not yank while the user is just filtering.
    if (selectedId && selectedId !== lastFlyToId.current) {
      const place = places.find((p) => p.id === selectedId);
      if (place) {
        const latlng = new kakao.maps.LatLng(place.lat, place.lng);
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
  }, [selectedId, ready, places, locale]);

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
        className="nm-kakao-surface h-full w-full"
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
