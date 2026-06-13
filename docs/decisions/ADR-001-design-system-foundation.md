---
slug: ADR-001-design-system-foundation
date: 2026-06-13
generated-by: claude-code
status: Accepted
superseded-by:
---

# ADR-001: Design System Foundation — Dark Chrome + Warm Globe Hero

## Status

Accepted

## Date

2026-06-13

## Context

The project's original warm/cream UI palette was described by the owner as "not sexy" (색상톤이 썩 섹시하지 않네). At the same time, the warmth and tactile earth quality of the globe were explicitly valued and should be preserved.

After reviewing several premium design references, the Raycast design system (a dark, minimal, high-contrast aesthetic used by the Raycast macOS launcher) was adopted as the primary styling reference. The verbatim source has been archived at `docs/research/references/raycast-design-md.md` for traceability.

A naive "go full dark everywhere" approach was also evaluated. A globe rendered on a near-black canvas with no warm tinting loses its identity as a warm, living earth — it becomes a cold, generic space visualization. This was considered unacceptable given that the warm globe is the product's signature visual.

The tension is therefore: *how do we adopt the Raycast dark aesthetic without sacrificing the warmth that makes the globe distinctive?*

## Decision

Adopt a **dark UI chrome (Raycast-derived) with a warm earth globe hero** as the signature visual combination.

The dark canvas makes the warm globe and glowing flight arcs pop by contrast — the very color properties that felt flat on a cream background become vivid and cinematic on near-black. This pairing resolves the tension identified in the context section.

Specific outcomes of this decision:

- The dark canvas token is `#07080a` (Raycast canvas), not generic `#000000`.
- The globe retains warm earth tinting (`#fff4e0`) and a warm atmospheric rim glow (`#e8b87a`).
- Flight arcs use a premium warm-gold → Raycast-red gradient (`#f5c47a` → `#ff5757`) with a soft bloom effect.
- The living, operational token specification lives in `/DESIGN.md` at the repo root.
- This ADR is the **frozen rationale** — it records why the decision was made and what alternatives were rejected. `/DESIGN.md` is the **operational guide** — it specifies current token values and evolves with the design.
- Dual dark/light theming is a downstream concern recorded separately in ADR-002.

## Alternatives Considered

### Option B — Full dark everywhere, including a dark globe

Rejected. A globe rendered on `#07080a` with no warm tinting loses the warm-earth identity the owner explicitly valued. The result reads as a generic space visualization rather than as a living map of places visited. The warmth is load-bearing to the product's identity.

### Option C — Keep warm/cream palette; adopt only Raycast's structural rules (hairline borders, spacing rhythm) without its colors

Rejected. The owner's feedback was explicitly about color tone ("색상톤이 썩 섹시하지 않네"), not only layout structure. A structural-only adoption would leave the core complaint — the palette feeling unsexy — unaddressed.

## Consequences

### Enables

- A high-contrast, premium visual where flight arcs glow and the warm earth reads as the focal point rather than blending into the background.
- A shared token vocabulary between UI chrome and globe visualization, making cross-component consistency tractable.
- A clear separation between frozen rationale (this ADR) and evolving spec (`/DESIGN.md`), so token values can be tuned without revisiting the architectural decision.

### Costs / Trade-offs

- Every component must be driven by theme tokens rather than hardcoded colors. Components that bypass the token system will break on theme switch and will appear visually inconsistent.
- The globe warm-tinting parameters (tint color, atmosphere altitude, specular) must be maintained in sync with the dark theme's canvas color. If canvas darkens or brightens, globe parameters may need adjustment.

### New Constraints

- **No hardcoded hex values in components.** All colors must reference tokens defined in `/DESIGN.md`. Direct hex literals in component code are a build-time warning.
- **No drop shadows on dark surfaces.** Raycast convention: elevation on dark surfaces is communicated via the surface ladder (`surface-1` → `surface-2` → `surface-3`) and hairline borders, not box shadows. Drop shadows are permitted only in light theme (with soft, warm values).
- **Globe canvas token must always match the active theme's `--bg` canvas token.** The globe is rendered in the same visual space as the page — mismatched canvas colors will produce a visible seam.
