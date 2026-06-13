---
slug: ADR-003-globe-first-hybrid-navigation
date: 2026-06-13
generated-by: claude-code
status: Accepted
superseded-by:
---

# ADR-003: Globe-First Hybrid Navigation Model

## Status

Accepted

## Date

2026-06-13

## Context

The owner wants the primary map experience to feel like spinning a globe rather than panning a flat 2D map side-to-side. The existing flat-map approach was explicitly rejected ("양옆으로 펴지는 것보다 지구본을 돌리는 듯한 경험" — "the experience of spinning a globe rather than spreading it side to side").

However, the place data is heavily clustered: the majority of locations are concentrated in Jeju, Korea, with approximately 18 additional locations spread across 7 overseas countries. At globe zoom levels this dense Jeju cluster collapses to a single indistinguishable point, making a pure-globe surface insufficient for street-level browsing.

The project already uses:
- `react-globe.gl` for the intro/overview globe.
- Kakao Maps for Korean locations and Google Maps for overseas locations, with provider routing logic in `lib/maps/provider.ts`.

The navigation model must honour both the "spin the globe" feel and the need for fine-grained place-level detail.

## Decision

Adopt a **hybrid navigation model** in which the globe is the primary navigation surface and provider maps are the detail surface.

**Globe layer (react-globe.gl) — worldwide overview:**
- The user sees all their places as glowing points or clusters on a spinning globe.
- This is the entry point and the home screen; it owns the "spin" feel.
- Point selection on the globe resolves to a city, region, or cluster.

**Provider map layer — street-level detail:**
- Selecting a point or cluster on the globe triggers a cinematic fly-out transition and hands off to the provider map for that area.
- Provider selection follows existing routing: Kakao Maps when all selected points are within Korea; Google Maps for overseas locations (logic stays in `lib/maps/provider.ts`).
- Markers, street zoom, and place-level interaction live exclusively on the provider map.

**Transition/handoff:** The globe animates a fly-to on the selected region before yielding to the provider map view. Transitions should be cinematic and mobile-friendly (see `/DESIGN.md`).

## Alternatives Considered

### B — Pure globe explorer, replacing provider maps entirely

**Pros:**
- Single rendering stack; simpler architecture.
- Fully realises the "spinning globe" metaphor end-to-end.

**Cons:**
- The dense Jeju cluster collapses to a single dot at any globe zoom level that shows worldwide coverage; street-level detail is unachievable on a spherical projection.
- Eliminates Kakao Maps integration, which provides Korean-language POI data essential for Jeju browsing.

**Rejected:** Loses street-level detail and the Kakao/Google data quality split, which are core to usable place browsing.

---

### C — Keep flat provider map as the primary surface (status quo)

**Pros:**
- Already implemented; zero transition complexity.
- Provider maps are mature and well-tested.

**Cons:**
- The flat panning interaction is the exact experience the owner rejected.
- Provides no sense of worldwide spatial context; overseas places feel disconnected.

**Rejected:** Directly contradicts the owner's stated navigation intent.

---

### D — Google Maps vector globe projection as a single surface

**Pros:**
- Provides a globe-like spherical projection with street-level zoom capability in one SDK.
- Eliminates the globe/provider split and the transition layer entirely.

**Cons:**
- Does not satisfy the "spin the globe" feel at the overview level — the Google Maps globe is navigated with the same pan gestures as the flat map.
- Removes Kakao Maps, losing Korean-language POI density and address accuracy for Jeju.
- Ties the entire experience to a single provider, reducing flexibility.

**Rejected (noted as possible future simplification):** May be reconsidered if the transition layer proves costly to maintain and if Kakao Maps coverage becomes less critical, but is out of scope for the initial implementation.

## Consequences

### Enables

- The desired "spin the globe" experience as the primary entry point, with worldwide spatial context.
- Street-level place browsing via mature provider maps (Kakao / Google) after the globe handoff.
- Preservation of the existing Kakao/Google provider routing logic with minimal changes.
- A cinematic transition moment that reinforces the app's distinct visual identity (per DESIGN.md).

### Costs

- A **transition/handoff layer** must be built between the globe and the provider map; this is new complexity with no existing pattern in the codebase.
- **Clustering logic** is needed to represent the dense Jeju region as a sensible single point or small cluster on the globe without losing individual place identity.
- **Two rendering stacks** (react-globe.gl + Kakao/Google) must be maintained, tested, and kept in sync with theme tokens.

### New Constraints

- The globe must expose a `point-selected` → `region-resolved` → `provider-map-focused` event pipeline; this interface must be defined before either side is implemented.
- Transitions must be cinematic and mobile-friendly; jank or abrupt cuts are a design regression (see DESIGN.md for motion guidelines).
- The globe and provider map must both respect the active theme (dark/light map styles — see ADR-002).
- Clustering strategy for dense regions must be revisited if place data distribution changes significantly.
