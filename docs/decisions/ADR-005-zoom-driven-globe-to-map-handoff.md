---
slug: ADR-005-zoom-driven-globe-to-map-handoff
date: 2026-06-13
generated-by: claude-code
status: Accepted
superseded-by:
---

# ADR-005: Zoom-Driven Globe → Flat-Map Handoff (Google Earth Model)

## Status

Accepted — refines the transition mechanism of ADR-003 (Globe-First Hybrid Navigation)
and ADR-004 (Immersive Navigation). Provider routing and globe-first intent from those
ADRs are unchanged; only the *trigger* for entering the flat map changes.

## Date

2026-06-13

## Context

ADR-003 established a globe-first model with a hybrid drill-down into provider maps
(Kakao for Korea, Google overseas). ADR-004 added the immersive cinematic handoff.

In both, the move from globe to flat map was **discrete**: a scripted intro that ends
with an explicit "Enter" action (button / completion of the choreography), after which
the flat map is shown laid out side-to-side.

The owner rejected that flat-map-laid-sideways feel as the primary surface:

> "지도가 옆으로 펼쳐져있는데 이를 지구본 ux로 줄 수 없을까 google earth같은 느낌으로
> 화면에 꽉차기 시작하면 그 때부터 평면 지도로 바꾸면 되잖아"

The desired model is **Google Earth**: the 3D globe is the primary, continuously
interactive explore surface. The user spins and zooms it freely; as they zoom toward a
region and the globe begins to fill the screen, the experience transitions into the flat
provider map for that region — seamlessly, driven by zoom depth rather than a button.

## Decision

Make the globe→flat-map transition **continuous and zoom-driven**, not a discrete button:

1. The cinematic intro (ADR-004) still plays on first load, then settles into a
   **freely interactive** globe (the existing drag-interrupt already enables this).
2. While the globe is interactive, monitor the camera's point-of-view **altitude**
   (`globe.pointOfView()` / react-globe.gl zoom events). The globe is the active surface.
3. When altitude drops below a **handoff threshold** (the globe "starts filling the
   screen"), crossfade into the flat provider map, **seeded with the globe's current
   centre lat/lng and a matching zoom level**, so the surface the user was looking at is
   exactly what the flat map opens to.
4. Provider selection at handoff reuses `lib/maps/provider.ts` (Kakao for the Korea
   bbox, Google otherwise) based on the handoff lat/lng.
5. The "🌍 back to globe" affordance reverses the handoff: returns to the globe zoomed
   out to roughly the region the user left, preserving spatial continuity.
6. Respect `prefers-reduced-motion`: reduced-motion users get an instant switch (no
   crossfade), consistent with the existing AppShell guard.

### Why a threshold rather than a literal 3D→2D morph

A true Google-Earth seamless mesh morph (single engine rendering both globe and flat) is
out of scope for react-globe.gl + a separate Kakao/Google tile map. A zoom-threshold
crossfade that **carries the centre and zoom across** achieves the same *felt* continuity
("I zoomed in and it became a map of where I was looking") without rebuilding the rendering
stack. This is the lowest-risk path that preserves the cinematic globe the owner approved.

## Consequences

- `AppShell` stage trigger moves from an explicit Enter action to a zoom-altitude callback
  emitted by `Globe`. The stage machine (`globe` → `globe-exiting` → `map`) is reused;
  only what fires the transition changes.
- `Globe` must expose the current POV (lat/lng/altitude) at handoff so the map can be
  seeded; map components (`MapView`, `GoogleMapView`) must accept an initial centre/zoom.
- The Enter/Skip buttons become optional (a fast-path "dive in" affordance) rather than
  the sole entry mechanism.
- Hysteresis is needed so a user hovering near the threshold does not flip-flop between
  globe and map; entering the map should require a deliberate zoom past the threshold.

## Privacy

No change to the standing rule: no person names anywhere; `.claude` / `.omc` / `.omx`
stay out of the public repo. This decision adds no new data surface.

## Sequencing

Implemented **after** the in-flight zoom-clustering + visit-frequency-weight work, because
that work edits the same files (`Globe.tsx`, `AppShell.tsx`, the map components) and the
changes must not collide.
