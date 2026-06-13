"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Explorer from "./Explorer";
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
 *   "globe" → GlobeCanvas overlay covers Explorer; fires onEnter on completion
 *   "map"   → Explorer visible; 🌍 button replays the intro
 *
 * Explorer is always mounted so the Kakao/Google SDK initialises during
 * the globe intro, meaning the map is ready the moment the user enters.
 */
export default function AppShell({ places }: { places: Place[] }) {
  // null during SSR/hydration — effect below resolves it client-side.
  const [stage, setStage] = useState<Stage | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(INTRO_KEY);
    setStage(seen ? "map" : "globe");
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    if (reducedMotion) {
      // No crossfade for users who prefer reduced motion — switch instantly.
      setStage("map");
      return;
    }
    setStage("globe-exiting");
    // Unmount the WebGL overlay after the CSS crossfade completes (~550ms).
    // pointer-events-none on the wrapper prevents any interaction during the fade.
    setTimeout(() => setStage("map"), 550);
  };

  // Replay the intro without clearing the sessionStorage flag —
  // sessionStorage only controls the page-load skip, not in-session replays.
  const handleGlobeButton = () => setStage("globe");

  return (
    // Same classes as Explorer's own outer div to satisfy the h-dvh layout contract
    // set by app/page.tsx: <main className="flex h-dvh flex-col">.
    <div className="relative flex flex-1 overflow-hidden">
      {/* Explorer always mounted: SDK init + filter state preserved across transitions.
          Incoming map scales 0.97→1.0 as the globe fades — a subtle "settle into place"
          that reads as diving down to the surface. Stripped when reduced-motion. */}
      <div
        className={[
          "flex flex-1",
          reducedMotion ? "" : "transition-transform duration-500 ease-out",
          stage === "globe" ? "scale-[0.97]" : "scale-100",
        ].join(" ")}
      >
        <Explorer places={places} onShowGlobe={handleGlobeButton} />
      </div>

      {/* Globe overlay: conditionally mounted so WebGL context is released when gone;
          re-mount replays the full choreography animation.
          "globe-exiting" keeps it mounted during the CSS crossfade, then unmounts. */}
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
          <GlobeCanvas onEnter={handleEnter} />
        </div>
      )}

      {/* 🌍 return button now lives inside Explorer's map column (see Explorer's
          onShowGlobe) so it floats over the map, never over the sidebar search. */}
    </div>
  );
}
