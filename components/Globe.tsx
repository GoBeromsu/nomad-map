"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import GlobeGL from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import type { RouteArc, RouteStop } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import routeData from "@/data/route.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ARC_HERO_START  = "#f5c47a";   // warm gold — hero arc start
const ARC_HERO_END    = "#ffffff";   // white glow — hero arc end
const STOP_COLOR      = "#f5c47a";

const NIGHT_SKY_URL   = "//unpkg.com/three-globe/example/img/night-sky.png";
const NIGHT_EARTH_URL = "//unpkg.com/three-globe/example/img/earth-night.jpg";
const TOPO_URL        = "//unpkg.com/three-globe/example/img/earth-topology.png";

// Korea center (same as MapView.tsx)
const KOREA_POV = { lat: 36.5, lng: 127.8, altitude: 0.65 } as const;

// ---------------------------------------------------------------------------
// Ambient arc city pool — 42 major hubs (lat, lng)
// No person names, public city names only.
// ---------------------------------------------------------------------------
const CITY_COORDS: [number, number][] = [
  [ 40.7128,  -74.0060], // New York
  [ 51.5074,   -0.1278], // London
  [ 48.8566,    2.3522], // Paris
  [ 35.6762,  139.6503], // Tokyo
  [ 22.3193,  114.1694], // Hong Kong
  [  1.3521,  103.8198], // Singapore
  [-33.8688,  151.2093], // Sydney
  [ 55.7558,   37.6173], // Moscow
  [ 19.0760,   72.8777], // Mumbai
  [ 39.9042,  116.4074], // Beijing
  [-23.5505,  -46.6333], // São Paulo
  [ 34.0522, -118.2437], // Los Angeles
  [ 41.8781,  -87.6298], // Chicago
  [ 25.2048,   55.2708], // Dubai
  [ 37.5665,  126.9780], // Seoul
  [-26.2041,   28.0473], // Johannesburg
  [ 30.0444,   31.2357], // Cairo
  [ 28.6139,   77.2090], // Delhi
  [ 49.2827, -123.1207], // Vancouver
  [ 43.6532,  -79.3832], // Toronto
  [ 19.4326,  -99.1332], // Mexico City
  [-34.6037,  -58.3816], // Buenos Aires
  [  6.5244,    3.3792], // Lagos
  [ -1.2921,   36.8219], // Nairobi
  [ 59.3293,   18.0686], // Stockholm
  [ 52.5200,   13.4050], // Berlin
  [ 41.9028,   12.4964], // Rome
  [ 40.4168,   -3.7038], // Madrid
  [ 50.8503,    4.3517], // Brussels
  [ 47.3769,    8.5417], // Zurich
  [ 60.1699,   24.9384], // Helsinki
  [ 59.9139,   10.7522], // Oslo
  [ 55.6761,   12.5683], // Copenhagen
  [ 21.3069, -157.8583], // Honolulu
  [ 13.7563,  100.5018], // Bangkok
  [  3.1390,  101.6869], // Kuala Lumpur
  [ -6.2088,  106.8456], // Jakarta
  [ 31.2304,  121.4737], // Shanghai
  [-37.8136,  144.9631], // Melbourne
  [ 33.5731,   -7.5898], // Casablanca
  [ 14.6937,  -17.4441], // Dakar
  [ -4.3217,   15.3222], // Kinshasa
];

// Dim cinematic palette — green / gold / red / indigo / cyan
const AMBIENT_COLORS = [
  "rgba(74,222,128,0.32)",
  "rgba(251,191,36,0.25)",
  "rgba(248,113,113,0.28)",
  "rgba(129,140,248,0.30)",
  "rgba(34,211,238,0.26)",
];

// ---------------------------------------------------------------------------
// Arc type discriminant
// ---------------------------------------------------------------------------
interface AmbientArc {
  startLat:     number;
  startLng:     number;
  endLat:       number;
  endLng:       number;
  ambient:      true;
  ambientColor: string;
  ambientGap:   number; // staggered arcDashInitialGap 0–1
  ambientSpeed: number; // arcDashAnimateTime ms
}

type CombinedArc = RouteArc | AmbientArc;

function isAmbientArc(arc: CombinedArc): arc is AmbientArc {
  return (arc as AmbientArc).ambient === true;
}

// ---------------------------------------------------------------------------
// Generate ~160 ambient arcs once at module load (client-only via dynamic import)
// ---------------------------------------------------------------------------
function buildAmbientArcs(count: number): AmbientArc[] {
  const result: AmbientArc[] = [];
  const n = CITY_COORDS.length;
  for (let i = 0; i < count; i++) {
    const fromIdx = Math.floor(Math.random() * n);
    let toIdx = Math.floor(Math.random() * n);
    if (toIdx === fromIdx) toIdx = (toIdx + 1) % n;
    result.push({
      startLat:     CITY_COORDS[fromIdx][0],
      startLng:     CITY_COORDS[fromIdx][1],
      endLat:       CITY_COORDS[toIdx][0],
      endLng:       CITY_COORDS[toIdx][1],
      ambient:      true,
      ambientColor: AMBIENT_COLORS[i % AMBIENT_COLORS.length],
      // golden-ratio-ish stagger so arcs flow continuously, not in sync
      ambientGap:   (i * 0.137) % 1.0,
      // spread animate times 4500–7000 ms for a calm shimmer
      ambientSpeed: 4500 + (i % 10) * 250,
    });
  }
  return result;
}

const AMBIENT_ARCS: AmbientArc[] = buildAmbientArcs(160);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface GlobeProps {
  onEnter: () => void;
}

export default function GlobeIntro({ onEnter }: GlobeProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // true once the t=1600 ms step fires — prevents drag-resume timer from
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

  const isMobile = size.w < 640;

  // Theme-derived settings
  const globeBg        = theme === "dark" ? "#07080a" : "#faf7f2";
  const globeBgImage   = theme === "dark" ? NIGHT_SKY_URL : null;
  // Subtle purple-blue atmosphere rim (Image B vibe)
  const atmosColor     = theme === "dark" ? "#4f87ff" : "#7eb4d8";
  const atmosAlt       = theme === "dark" ? 0.22 : 0.18;

  // Combine ambient atmosphere arcs + real hero arcs in one layer
  const allArcsData: CombinedArc[] = useMemo(
    () => [...AMBIENT_ARCS, ...arcsData],
    [arcsData],
  );

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

    // t≈900 ms — reveal real route arcs + stop markers
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

  // Gate rendering until container is measured
  const ready = size.w > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-canvas"
    >
      {/* Cinematic purple-blue bloom overlay */}
      {theme === "dark" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)",
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
          // Night-earth texture — city-lights on a dark earth (cinematic)
          globeImageUrl={NIGHT_EARTH_URL}
          bumpImageUrl={TOPO_URL}
          showAtmosphere={true}
          atmosphereColor={atmosColor}
          atmosphereAltitude={atmosAlt}
          showGraticules={false}
          animateIn={true}
          waitForGlobeReady={true}
          enablePointerInteraction={true}
          rendererConfig={{ antialias: true, alpha: true }}
          // Single arcs layer — ambient (dim atmosphere) + hero (bright real route)
          // Ambient arcs: thin, muted, slow continuous shimmer
          // Hero arcs:    thick, gold→white, clearly the user's real journey
          arcsData={allArcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            const arc = d as CombinedArc;
            if (isAmbientArc(arc)) return arc.ambientColor;
            return [ARC_HERO_START, ARC_HERO_END];
          }}
          arcStroke={(d: object) => {
            const arc = d as CombinedArc;
            if (isAmbientArc(arc)) return 0.3;
            return isMobile ? null : 1.2;
          }}
          // Longer dash + near-zero gap = continuous glow, not blinky tick
          arcDashLength={(d: object) => {
            const arc = d as CombinedArc;
            return isAmbientArc(arc) ? 0.72 : 0.5;
          }}
          arcDashGap={(d: object) => {
            const arc = d as CombinedArc;
            return isAmbientArc(arc) ? 0.01 : 0.02;
          }}
          // Staggered initial gaps → arcs flow at different offsets, not in sync
          arcDashInitialGap={(d: object) => {
            const arc = d as CombinedArc;
            return isAmbientArc(arc) ? arc.ambientGap : 0;
          }}
          // Slow animate times for calm cinematic feel (4500–7000 ms ambient, 4200 hero)
          arcDashAnimateTime={(d: object) => {
            const arc = d as CombinedArc;
            return isAmbientArc(arc) ? arc.ambientSpeed : 4200;
          }}
          arcAltitude={null}
          arcAltitudeAutoScale={(d: object) => {
            const arc = d as CombinedArc;
            return isAmbientArc(arc) ? 0.22 : 0.3;
          }}
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
          ringColor={() => ["rgba(245,196,122,0.6)", "rgba(245,196,122,0)"]}
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
