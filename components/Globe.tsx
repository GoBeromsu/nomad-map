"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
    // Zoom is live from the first frame — the intro is explorable, not a locked
    // cutscene. Bounds keep the camera between a close fly-over and a full-globe
    // view (globe radius 100 → altitude ≈ 0.3–4.2).
    ctrl.enableZoom = true;
    ctrl.minDistance = 130;
    ctrl.maxDistance = 520;
    ctrl.enablePan = false;

    // Mark choreography as active so the drag listener knows to abort
    choreoActiveRef.current = true;

    // ------------------------------------------------------------------
    // Hand full control to the user, aborting the scripted intro timeline.
    // Triggered by a drag (controls "start") OR a zoom (wheel / pinch), so
    // zooming during the intro feels responsive instead of fighting the
    // scripted fly-to. Permanent for this session once it fires.
    // ------------------------------------------------------------------
    const takeControl = () => {
      if (!(choreoActiveRef.current && !userTookControlRef.current)) return;
      userTookControlRef.current = true;
      choreoActiveRef.current = false;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      if (dragResumeTimerRef.current) {
        clearTimeout(dragResumeTimerRef.current);
        dragResumeTimerRef.current = null;
      }
      // Immediately reveal arcs + stops so the user can watch them animate
      setArcsData((routeData.arcs ?? []) as RouteArc[]);
      setStopsData(routeData.stops as RouteStop[]);
      // Freeze autoRotate — stop fighting the user
      autoRotateFrozenRef.current = true;
      ctrl.autoRotate = false;
    };

    ctrl.addEventListener("start", () => {
      if (choreoActiveRef.current && !userTookControlRef.current) {
        takeControl();
        return;
      }
      // Normal pre-freeze behavior: temporarily pause autorotate while dragging
      if (autoRotateFrozenRef.current) return;
      ctrl.autoRotate = false;
      if (dragResumeTimerRef.current) clearTimeout(dragResumeTimerRef.current);
    });

    // OrbitControls zoom (wheel / pinch) does NOT fire the "start" event, so
    // hook the canvas wheel event explicitly: the first zoom during the intro
    // also hands over control. Listener dies with the canvas on unmount.
    const wheelEl = g.renderer().domElement;
    wheelEl.addEventListener("wheel", takeControl, { passive: true });

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
          // Real visited-route arcs only — gold→white, weight-scaled stroke.
          // (Decorative ambient arcs to non-visited cities were removed: the
          // globe must connect only places actually visited.)
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => [ARC_HERO_START, ARC_HERO_END]}
          arcStroke={(d: object) => {
            if (isMobile) return null;
            const arc = d as RouteArc;
            // Visit-frequency weighted: more-visited routes render thicker.
            return 0.7 + (arc.weight ?? 0) * 2.0;
          }}
          // Longer dash + near-zero gap = continuous glow, not blinky tick
          arcDashLength={0.5}
          arcDashGap={0.02}
          arcDashInitialGap={0}
          // Slow animate time for a calm cinematic flow
          arcDashAnimateTime={4200}
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
