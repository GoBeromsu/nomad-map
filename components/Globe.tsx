"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import GlobeGL from "react-globe.gl";
import { MeshPhongMaterial, Color } from "three";
import type { GlobeMethods } from "react-globe.gl";
import type { RouteArc, RouteStop } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import routeData from "@/data/route.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ARC_COLOR_START = "#f5c47a"; // warm gold — contrasts the blue hex globe
const ARC_COLOR_END = "#ff5757";   // Raycast red
const STOP_COLOR = "#ff6161";      // accent-red
const GLOBE_GEO_URL =
  "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";
const NIGHT_SKY_URL =
  "//unpkg.com/three-globe/example/img/night-sky.png";

// Korea center (same as MapView.tsx)
const KOREA_POV = { lat: 36.5, lng: 127.8, altitude: 0.65 } as const;

interface GlobeProps {
  onEnter: () => void;
}

export default function GlobeIntro({ onEnter }: GlobeProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // true once the t=1600ms step fires — prevents drag-resume timer from
  // re-enabling autoRotate after the fly-to has begun
  const autoRotateFrozenRef = useRef(false);
  // true while the scripted intro timeline is running
  const choreoActiveRef = useRef(false);
  // permanently true once the user drags during the intro
  const userTookControlRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [arcsData, setArcsData] = useState<RouteArc[]>([]);
  const [stopsData, setStopsData] = useState<RouteStop[]>([]);
  // GeoJSON features for the dotted-hex country layer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hexData, setHexData] = useState<any[]>([]);

  // Dark globe material — created synchronously (no texture, near-black navy)
  const [globeMat] = useState<MeshPhongMaterial | null>(() => {
    if (typeof window === "undefined") return null;
    return new MeshPhongMaterial({
      color: new Color("#0a0c12"),
      shininess: 6,
      specular: new Color("#0f1a2e"),
    });
  });

  const isMobile = size.w < 640;

  // Theme-derived canvas settings — safe: loaded via next/dynamic ssr:false
  const globeBg = theme === "dark" ? "#07080a" : "#faf7f2";
  const globeBgImage: string | null = theme === "dark" ? NIGHT_SKY_URL : null;

  // Hex polygon accent — cool glow in dark, warmer navy in light
  const hexColor = theme === "dark" ? "#57c1ff" : "#2a6fa8";
  // Atmosphere rim — cool blue in dark, soft sky-blue in light
  const atmosColor = theme === "dark" ? "#57c1ff" : "#7eb4d8";

  // ------------------------------------------------------------------
  // Responsive sizing via ResizeObserver
  // ------------------------------------------------------------------
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ------------------------------------------------------------------
  // Fetch country GeoJSON for dotted-hex layer (client-side only)
  // Falls back gracefully — dark globe + arcs still render on failure
  // ------------------------------------------------------------------
  useEffect(() => {
    fetch(GLOBE_GEO_URL)
      .then((r) => r.json())
      .then((data) => {
        if (data?.features) setHexData(data.features);
      })
      .catch(() => {
        // Intentionally silent — globe renders without country outlines
      });
  }, []);

  // ------------------------------------------------------------------
  // Timer cleanup on unmount
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      if (dragResumeTimerRef.current) clearTimeout(dragResumeTimerRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Skip / Enter — interrupt choreography and proceed immediately
  // ------------------------------------------------------------------
  const handleSkip = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    if (dragResumeTimerRef.current) {
      clearTimeout(dragResumeTimerRef.current);
      dragResumeTimerRef.current = null;
    }
    onEnter();
  }, [onEnter]);

  // ------------------------------------------------------------------
  // Globe ready → cinematic choreography (~5 s total)
  // ------------------------------------------------------------------
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return;
    const g = globeRef.current;

    // Cap DPR — prevents 9× pixel load on 3× high-DPR mobile
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // t=0: Asia-Pacific overview
    g.pointOfView({ lat: 20, lng: 115, altitude: 2.8 });

    // Cinematic slow autorotate
    const ctrl = g.controls();
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = 0.55;
    ctrl.enableZoom = false;
    ctrl.enablePan = false;

    // Mark choreography as active so the drag listener knows to abort
    choreoActiveRef.current = true;

    // ------------------------------------------------------------------
    // Drag START — if intro is still running, abort the entire timeline
    // and hand full control to the user (permanent for this session).
    // ------------------------------------------------------------------
    ctrl.addEventListener("start", () => {
      if (choreoActiveRef.current && !userTookControlRef.current) {
        // Abort scripted intro — user grabbed the globe
        userTookControlRef.current = true;
        choreoActiveRef.current = false;
        timeoutIdsRef.current.forEach(clearTimeout);
        timeoutIdsRef.current = [];
        if (dragResumeTimerRef.current) {
          clearTimeout(dragResumeTimerRef.current);
          dragResumeTimerRef.current = null;
        }
        // Immediately reveal arcs + stops so user can watch them animate
        setArcsData((routeData.arcs ?? []) as RouteArc[]);
        setStopsData(routeData.stops as RouteStop[]);
        // Freeze autoRotate — stop fighting the user's drag
        autoRotateFrozenRef.current = true;
        ctrl.autoRotate = false;
        return;
      }
      // Normal pre-freeze behavior: temporarily pause autorotate while dragging
      if (autoRotateFrozenRef.current) return;
      ctrl.autoRotate = false;
      if (dragResumeTimerRef.current) clearTimeout(dragResumeTimerRef.current);
    });

    // Drag END — resume autorotate 3 s after pointer idle (pre-freeze only)
    ctrl.addEventListener("end", () => {
      if (autoRotateFrozenRef.current) return;
      if (dragResumeTimerRef.current) clearTimeout(dragResumeTimerRef.current);
      dragResumeTimerRef.current = setTimeout(() => {
        if (!autoRotateFrozenRef.current && globeRef.current) {
          globeRef.current.controls().autoRotate = true;
        }
      }, 3000);
    });

    const ids: ReturnType<typeof setTimeout>[] = [];

    // t≈900 ms — reveal arcs + stop markers
    ids.push(
      setTimeout(() => {
        setArcsData((routeData.arcs ?? []) as RouteArc[]);
        setStopsData(routeData.stops as RouteStop[]);
      }, 900),
    );

    // t≈1600 ms — freeze rotation; fly to Korea over 2600 ms (lands ≈t=4200 ms)
    ids.push(
      setTimeout(() => {
        if (userTookControlRef.current) return; // user already took over
        if (!globeRef.current) return;
        autoRotateFrozenRef.current = true;
        if (dragResumeTimerRef.current) clearTimeout(dragResumeTimerRef.current);
        globeRef.current.controls().autoRotate = false;
        globeRef.current.pointOfView(KOREA_POV, 2600);
      }, 1600),
    );

    // t≈5200 ms — mark choreography complete, hand off to Explorer
    ids.push(
      setTimeout(() => {
        choreoActiveRef.current = false;
        onEnter();
      }, 5200),
    );

    timeoutIdsRef.current = ids;
  }, [onEnter]);

  // Gate rendering until container is measured + material is ready
  const ready = size.w > 0 && globeMat !== null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-canvas"
    >
      {/* Dark-mode bloom: faint cool radial glow complementing the blue hex dots */}
      {theme === "dark" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(87,193,255,0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      )}

      {ready && (
        <GlobeGL
          ref={globeRef}
          width={size.w}
          height={size.h}
          // Theme-aware canvas
          backgroundColor={globeBg}
          backgroundImageUrl={globeBgImage}
          globeImageUrl={null}
          bumpImageUrl={null}
          globeMaterial={globeMat}
          showAtmosphere={true}
          atmosphereColor={atmosColor}
          atmosphereAltitude={0.22}
          showGraticules={false}
          animateIn={true}
          waitForGlobeReady={true}
          enablePointerInteraction={true}
          rendererConfig={{ antialias: true, alpha: true }}
          // Dotted-hex country layer — the premium dotted-globe look
          hexPolygonsData={hexData}
          hexPolygonUseDots={true}
          hexPolygonResolution={3}
          hexPolygonMargin={0.3}
          hexPolygonColor={() => hexColor}
          hexPolygonAltitude={0.001}
          // Arcs — glowing flights with slightly thicker stroke
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => [ARC_COLOR_START, ARC_COLOR_END]}
          arcStroke={isMobile ? null : 1.0}
          arcDashLength={0.4}
          arcDashGap={0.5}
          arcDashInitialGap={0}
          arcDashAnimateTime={3000}
          arcAltitude={null}
          arcAltitudeAutoScale={0.3}
          arcCurveResolution={isMobile ? 32 : 64}
          arcCircularResolution={isMobile ? 3 : 6}
          arcsTransitionDuration={500}
          // Stop cylinders
          pointsData={stopsData}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => STOP_COLOR}
          pointAltitude={0.01}
          pointRadius={0.22}
          pointResolution={isMobile ? 6 : 12}
          pointsMerge={true}
          pointsTransitionDuration={400}
          // Pulse rings — desktop only; dropped on mobile to reduce GPU load
          ringsData={isMobile ? [] : stopsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => ["rgba(255,97,97,0.6)", "rgba(245,196,122,0)"]}
          ringMaxRadius={2.5}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={1400}
          ringAltitude={0.0015}
          onGlobeReady={handleGlobeReady}
        />
      )}

      {/* Cinematic vignette — pointer-events-none depth overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, rgba(7,8,10,0.85) 100%)"
              : "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(250,247,242,0.65) 100%)",
        }}
      />

      {/* Tagline */}
      <p className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-sm text-muted tracking-wide pointer-events-none select-none whitespace-nowrap">
        {t("intro.tagline")}
      </p>

      {/* Skip + Enter — both visible from t=0 throughout the entire intro */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-5 py-2 rounded-full bg-surface-2 border border-hairline text-sm text-muted hover:text-body transition"
        >
          {t("intro.skip")}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-5 py-2 rounded-full bg-cta text-cta-ink text-sm hover:opacity-90 transition"
        >
          {t("intro.enter")}
        </button>
      </div>
    </div>
  );
}
