"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Explorer from "./Explorer";
import { useGeolocation } from "@/lib/useGeolocation";
import type { Place } from "@/lib/types";

const INTRO_KEY = "nm-intro-seen";

function GlobeLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas">
      <span className="animate-pulse text-5xl">🌍</span>
    </div>
  );
}

// Globe is WebGL / browser-only — must be ssr:false.
// Dynamic import at module scope for correct Next.js code-splitting analysis.
const GlobeCanvas = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

type Stage = "globe" | "globe-exiting" | "map";

/**
 * Manages the globe intro → map stage flow.
 *
 * Stage machine:
 *   null  (SSR / hydration) → avoids sessionStorage mismatch
 *   "globe" → GlobeCanvas overlay covers Explorer; the globe is the primary,
 *             freely interactive surface. Zooming in (or "Explore") hands off.
 *   "map"   → Explorer visible; 🌍 button replays the intro
 *
 * Explorer is always mounted so the Kakao/Google SDK initialises during the
 * globe intro, meaning the map is ready the moment the globe hands off.
 *
 * `initialPlaceId` (share / deep-link route) skips the intro and opens that
 * place's detail straight away, seeded at its coordinates.
 */
export default function AppShell({
  places,
  initialPlaceId,
}: {
  places: Place[];
  initialPlaceId?: string;
}) {
  const initialPlace = initialPlaceId
    ? places.find((p) => p.id === initialPlaceId)
    : undefined;

  // null during SSR/hydration — effect below resolves it client-side.
  const [stage, setStage] = useState<Stage | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Centre carried from the globe at handoff (Google Earth model, ADR-005) — or
  // the shared place's coordinates — used to seed the flat map's centre/provider.
  const [handoffCenter, setHandoffCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialPlace ? { lat: initialPlace.lat, lng: initialPlace.lng } : null,
  );

  // Geolocation lives here so both the globe (fly-to) and the map (provider +
  // recenter) share a single request.
  const { coords: userLocation } = useGeolocation();

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    // Deep-linked single place (share route): skip the intro, open the map.
    if (initialPlaceId) {
      sessionStorage.setItem(INTRO_KEY, "1");
      setStage("map");
      return;
    }
    const seen = sessionStorage.getItem(INTRO_KEY);
    setStage(seen ? "map" : "globe");
  }, [initialPlaceId]);

  const handleEnter = (handoff?: { lat: number; lng: number }) => {
    sessionStorage.setItem(INTRO_KEY, "1");
    if (handoff) setHandoffCenter(handoff);
    if (reducedMotion) {
      // No crossfade for users who prefer reduced motion — switch instantly.
      setStage("map");
      return;
    }
    setStage("globe-exiting");
    // Unmount the WebGL overlay after the CSS crossfade completes (~550ms).
    setTimeout(() => setStage("map"), 550);
  };

  // Replay the intro without clearing the sessionStorage flag.
  const handleGlobeButton = () => setStage("globe");

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Explorer always mounted: SDK init + filter state preserved across
          transitions. Incoming map scales 0.97→1.0 as the globe fades. */}
      <div
        className={[
          "flex flex-1",
          reducedMotion ? "" : "transition-transform duration-500 ease-out",
          stage === "globe" ? "scale-[0.97]" : "scale-100",
        ].join(" ")}
      >
        <Explorer
          places={places}
          onShowGlobe={handleGlobeButton}
          userLocation={userLocation}
          initialCenter={handoffCenter}
          initialSelectedId={initialPlaceId}
        />
      </div>

      {/* Globe overlay: conditionally mounted so the WebGL context is released
          when gone; re-mount replays the full choreography. */}
      {(stage === "globe" || stage === "globe-exiting") && (
        <div
          className={[
            "absolute inset-0 z-50",
            reducedMotion ? "" : "transition-opacity duration-500 ease-out",
            stage === "globe-exiting"
              ? "opacity-0 pointer-events-none"
              : "opacity-100",
          ].join(" ")}
        >
          <GlobeCanvas onEnter={handleEnter} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}
