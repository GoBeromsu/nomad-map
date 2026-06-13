---
slug: ADR-004-immersive-navigation
date: 2026-06-13
generated-by: claude-code
status: Accepted
superseded-by:
---

# ADR-004: Immersive Navigation — Click-to-Fly Map Motion & Cinematic Globe→Map Handoff

## Status

Accepted

## Date

2026-06-13

## Context

ADR-003 established the globe-first hybrid navigation model: the globe is the entry point; selecting a region hands off to a provider map (Kakao or Google) for street-level detail. That ADR left the mechanics of two transitions unspecified:

1. **Place selection inside the provider map** — clicking a marker or a sidebar list item currently calls the provider's bare `panTo`/`setCenter`, which snaps or slides the viewport with no sense of travel. The owner's stated intent: "클릭하면 그 위치로 슈슉 맵 이동" ("clicking moves the map there in a swoosh"). A plain pan does not satisfy this.

2. **Globe→provider map stage transition** — ADR-003 says "cinematic fly-out transition" but does not specify timing, visual technique, or what happens to the WebGL context. Without a spec, implementations default to a hard cut, which breaks the immersive mood.

The owner's broader goal: "사용자에게 몰입감 있는 경험" — an immersive experience in which every navigation moment reinforces the "spin the globe then dive in" cinematic identity.

This ADR elaborates ADR-003; it does **not** supersede it.

## Decision

### 1 — Place selection triggers an animated fly-to, not a bare pan

Whenever a place is selected — from a map marker **or** a sidebar list item — the provider map performs an animated camera fly-to that combines pan and zoom-in simultaneously, landing at a street-level zoom:

| Provider | Target zoom on arrival |
|---|---|
| Kakao Maps | Level `4` (street-level, ~1:5,000) |
| Google Maps | Zoom `15` (street-level) |

The animation uses the provider's native fly-to primitive (`panTo` + `setLevel`/`animateTo` on Kakao; `panTo`/`flyTo` with `zoom` on Google) so that easing curves match the map SDK's built-in motion model. Custom easing on top of the SDK is not added unless the SDK provides no animated option.

Both entry points — marker click and list item click — must trigger the same fly-to path. They share a single `flyToPlace(placeId)` call in the map controller layer.

### 2 — Globe→provider map stage transition is a crossfade/scale handoff (~500–600 ms)

When the globe hands off to the provider map (triggered by region selection or intro completion):

1. The provider map mounts and renders beneath the globe at `opacity: 0`.
2. The globe fades out while the provider map fades in over **500–600 ms** using an ease-in-out curve.
3. A subtle scale-down (`transform: scale(0.97 → 1.0)`) on the incoming provider map reinforces the "zooming in" feel without being jarring.
4. The WebGL context for the globe is **released** (component unmounted or paused) only after the fade is complete, preventing a flash of canvas-clear during the overlap window.

The crossfade keeps both layers mounted for its duration; z-index management ensures the outgoing globe sits above the incoming map until the fade completes.

### 3 — Arrival emphasis on the selected marker

After the fly-to completes, the target marker enters an **active state** (enlarged icon, accent ring using `--accent-blue` or category-specific accent) for ~1500 ms before settling to its resting active style. This confirms arrival and draws the eye to the destination.

## Alternatives Considered

### A — Instant `panTo` only (no zoom animation)

**Pros:** Zero implementation complexity; already partially in place.

**Cons:** Delivers no sense of travel. The owner explicitly asked for "슈슉" — a whoosh/fly feel, not a slide. Does not serve the immersive intent.

**Rejected:** Directly contradicts the stated UX intent.

---

### B — Full 3D globe-to-map morph (continuous WebGL zoom from globe altitude to street level)

**Pros:** Most visually spectacular; seamless spatial continuity from globe to street.

**Cons:**
- Requires a continuous zoom path across projection systems (spherical globe → flat/Mercator provider map), which is not achievable within the existing `react-globe.gl` + Kakao/Google Maps stack without a custom 3D engine.
- High implementation risk; no existing pattern in the codebase.
- Performance on mobile is uncertain; could cause frame drops on the transition moment.

**Deferred:** May be revisited if the rendering stack is ever consolidated onto a single 3D engine (see ADR-003, Option D). Out of scope for the current implementation.

---

### C — Provider map zoom-only (zoom-in only, no pan)

**Pros:** Simpler than a simultaneous pan+zoom fly-to.

**Cons:** If the selected place is far from the current viewport center, zooming in without panning first zooms into empty space, confusing the user.

**Rejected:** Pan + zoom combined is the correct behavior; most map SDK `flyTo` primitives support this natively.

## Consequences

### Enables

- The "swoosh" / "dive in" navigation feel the owner asked for at both the globe→map stage boundary and within provider map place selection.
- A cohesive cinematic identity across all navigation moments: intro choreography (ADR-003) → globe→map handoff → place fly-to → arrival emphasis.
- A single `flyToPlace(placeId)` abstraction that decouples the UI trigger (marker vs. list) from the map provider implementation.

### Costs

- The **crossfade handoff** requires both the globe and provider map to be mounted simultaneously for ~600 ms; memory footprint is briefly elevated during this window.
- The **fly-to abstraction** must be implemented consistently for both Kakao and Google providers; the abstraction layer in `lib/maps/` must be extended.
- **Arrival emphasis** requires a transient active state on markers beyond the persistent selected state; the marker component must handle this lifecycle.

### New Constraints

- Fly-to target zoom levels (Kakao level 4, Google zoom 15) are the default; individual place records may override this if a different zoom is more appropriate (e.g., a region-level place).
- Globe WebGL context must not be released until the crossfade opacity transition is fully complete; premature teardown causes a flash of background canvas.
- Arrival emphasis animation must not conflict with the persistent active marker style; the transient pulse must decay cleanly into the resting active state.
- All motion must respect `prefers-reduced-motion`; if set, fly-to must fall back to instant `panTo` and the crossfade must be replaced by an instant swap.
