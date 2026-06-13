---
slug: ADR-002-dual-theme-system
date: 2026-06-13
generated-by: claude-code
status: Accepted
superseded-by:
---

# ADR-002: Dual Theme System with Auto-Detection

## Status

Accepted

## Date

2026-06-13

## Context

The app must support both a dark theme (Raycast-derived chrome with a warm globe aesthetic, defined in `/DESIGN.md` per ADR-001) and a light theme (refined warm/cream palette). The owner requires the app to detect and respect the user's OS preference automatically, and also allow the user to override that preference manually at any time.

The project uses Next.js App Router (v16), React 19, and Tailwind v4. Tailwind v4 changed its dark-mode configuration vs v3 — the implementer **must** read the Tailwind v4 docs before wiring.

## Decision

Implement a dual-theme system with the following resolution order:

1. **Explicit user choice** persisted in `localStorage` (highest priority).
2. **`prefers-color-scheme` media query** when no stored preference exists.
3. **Dark theme as default** when the media query result is indeterminate.

A sun/moon toggle in the application header allows the user to switch themes at any time; the choice is written back to `localStorage` so it survives page reloads.

**Implementation strategy:** Tailwind v4 class-based dark mode — a `dark` class is toggled on `<html>`. All colours are exposed as CSS custom properties (defined once in `/DESIGN.md`) that flip their values under the `dark` selector. A tiny pre-hydration inline script sets the initial `dark` class on `<html>` **before first paint** to eliminate flash-of-wrong-theme (FOWT / FOUC). Token values in `/DESIGN.md` are the single source of truth; no raw colour literals appear in component code.

## Alternatives Considered

### B — Dark-only: ship only the Raycast dark theme

**Pros:**
- Fewer tokens to maintain; simpler QA matrix.
- Faster to ship.

**Cons:**
- Forces dark mode on users whose OS is set to light, degrading readability in bright environments.
- Owner explicitly requested light-theme support.

**Rejected:** Owner requirement for light theme support overrides the simplicity gain.

---

### C — System-only, no manual toggle

**Pros:**
- No UI element needed; automatically matches the OS.

**Cons:**
- Prevents users from choosing a theme that differs from their OS setting (common for productivity apps used in mixed-light environments).
- Owner explicitly requested a user-facing toggle.

**Rejected:** Owner requirement for manual override overrides the simplicity gain.

---

### D — `data-theme` attribute instead of a `dark` class on `<html>`

**Pros:**
- More explicit; `data-theme="light"` / `data-theme="dark"` is self-documenting.
- CSS-variable flipping works identically.

**Cons:**
- Tailwind v4's built-in `dark:` variant targets the `.dark` class by default; using a `data-theme` attribute requires a custom variant configuration, adding indirection.
- Slightly more configuration surface.

**Rejected (equivalent option noted):** Class-based approach is the path of least resistance with Tailwind v4's default dark-variant. Switching to `data-theme` is viable with minimal config change if the team prefers it; document and re-evaluate if the toggle logic becomes complex.

## Consequences

### Enables

- OS-aware theming out of the box: users on light OS see light theme, users on dark OS see dark theme, with zero manual action.
- User agency: a single toggle persists preference across sessions.
- Consistent token surface: all visual values live in `/DESIGN.md` CSS custom properties, making design-system updates a single-file change.

### Costs

- Every UI component must consume theme tokens (CSS custom properties) rather than hardcoded colours; linting or code-review must enforce this.
- The anti-FOUC inline script must be embedded in the `<head>` and kept minimal (no imports, no async) to guarantee it runs before first paint.
- Map provider integration requires two colour scheme configurations: one dark map style and one light map style, both switching in sync with the active theme.

### New Constraints

- The inline theme script must run **before** first paint; it cannot be deferred or loaded as an external module.
- All new UI work must be verified in both themes before merge.
- `NEXT_PUBLIC_*` environment variables are not involved in theme selection; theme state is entirely client-side via `localStorage` and the media query.
- Tailwind v4 dark-mode wiring differs from v3 — implementer must consult Tailwind v4 documentation before configuring the dark variant.
