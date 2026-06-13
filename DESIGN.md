# DESIGN.md — Nomad Map Living Design System

> **This is the operational source of truth.** Token values and component patterns live here and evolve with the design.
> For the frozen *rationale* behind each major decision, see the ADR index in `docs/decisions/`.
> Last updated: 2026-06-13

---

## Philosophy

- **Dark chrome + warm globe hero.** The near-black Raycast-derived canvas makes the warm earth globe and glowing flight arcs pop by contrast. See [ADR-001](docs/decisions/ADR-001-design-system-foundation.md).
- **Dual theme (dark default, light available).** Respects `prefers-color-scheme`; user override persisted in localStorage. See ADR-002.
- **Cinematic globe.** The globe is the hero of every view. Every layout decision serves it.
- **Mobile-first.** Layouts collapse gracefully; the globe scales; intro choreography is device-aware.
- **Derived from Raycast design.md.** Verbatim source archived at `docs/research/references/raycast-design-md.md`. Raycast rules apply unless explicitly overridden here.

---

## Theme Tokens

### Dark Theme (Raycast-derived — default)

| Token | Value | Usage |
|---|---|---|
| `--bg` / canvas | `#07080a` | Page background, globe canvas |
| `--surface-1` | `#0d0d0d` | Primary surface (header, sidebar) |
| `--surface-2` | `#101111` | Cards, popovers |
| `--surface-3` | `#121212` | Nested surfaces, active states |
| `--hairline` / `--border` | `#242728` | All borders and dividers |
| `--text-primary` / ink | `#f4f4f6` | Headings, labels |
| `--text-body` | `#cdcdcd` | Body copy, descriptions |
| `--text-muted` | `#8a8f98` | Placeholders, metadata, timestamps |
| `--cta-bg` | `#ffffff` | CTA pill background |
| `--cta-text` | `#07080a` | CTA pill label (dark on white) |
| `--accent-blue` | `#57c1ff` | Info, links |
| `--accent-red` | `#ff6161` | Destructive, Raycast brand |
| `--accent-green` | `#59d499` | Success, positive |
| `--accent-yellow` | `#ffc533` | Warning, highlight |
| `--hero-gradient-start` | `#ff5757` | Arc gradient / hero gradient start |
| `--hero-gradient-end` | `#a1131a` | Arc gradient / hero gradient end |

### Light Theme (refined warm/cream)

| Token | Value | Usage |
|---|---|---|
| `--bg` / canvas | `#faf7f2` | Page background, globe canvas |
| `--surface-1` | `#ffffff` | Primary surface (header, sidebar) |
| `--surface-2` | `#fbf8f3` | Cards, popovers |
| `--surface-3` | `#f3ede3` | Nested surfaces, active states |
| `--hairline` / `--border` | `#e7ded0` | All borders and dividers |
| `--text-primary` | `#2a2723` | Headings, labels |
| `--text-body` | `#57514a` | Body copy, descriptions |
| `--text-muted` | `#a39a8c` | Placeholders, metadata, timestamps |
| `--cta-bg` | `#1f1b16` | CTA pill background |
| `--cta-text` | `#ffffff` | CTA pill label (white on dark) |

> Accent and hero-gradient tokens inherit from the dark table above unless a light-specific override is noted in ADR-002.

---

## Category & Status Colors

### Category Colors

Base values are calibrated for legibility on light/warm surfaces. In dark theme, use the brightened variants below — the base values are too muddy on near-black.

| Category | Base (light) | Dark variant (brightened ~15%) |
|---|---|---|
| Cafe | `#b45309` | `#f59e0b` |
| Accommodation | `#7c3aed` | `#a78bfa` |
| Restaurant | `#be123c` | `#fb2952` |
| Recovery | `#15803d` | `#34d979` |
| Other | `#0369a1` | `#38bdf8` |

The dark variants are more saturated and luminous so they read clearly against `#07080a` – `#121212` surfaces without requiring a white text override on every chip.

### Status Colors

| Status | Text color | Background | Dark-theme note |
|---|---|---|---|
| Recommended | `#047857` | `#d1fae5` | Use `--accent-green` (`#59d499`) as text on a translucent tinted chip |
| Good | `#1d4ed8` | `#dbeafe` | Use `--accent-blue` (`#57c1ff`) as text on a translucent tinted chip |
| Bad | `#be123c` | `#ffe4e6` | Use `--accent-red` (`#ff6161`) as text on a translucent tinted chip |

In dark theme, status chips use `background: color-mix(in srgb, <accent> 12%, transparent)` with the accent token as text, keeping them subtle but recognizable.

---

## Typography

**Primary UI face:** `Inter` with stylistic set `ss03` enabled (`font-feature-settings: "ss03" 1`) — this is the Raycast convention and gives Inter a slightly more humanistic feel.

**Fallback stack:**

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
  Pretendard, "Segoe UI", "Noto Sans KR", Roboto, sans-serif;
```

Korean text legibility is non-negotiable. The `"Apple SD Gothic Neo"`, `Pretendard`, and `"Noto Sans KR"` entries in the fallback stack must be preserved in this order.

---

## Spacing & Radius

**Base unit:** `8px`

**Large section rhythm:** `96px` (vertical padding between major page sections)

### Radius scale

| Size | Value | Usage |
|---|---|---|
| XS | `4px` | Filter chips, inputs, badges |
| S | `8px` | Cards, place list items |
| M | `12px` | Modals, dropdowns |
| L | `16px` | Panels, bottom sheets, sidebar |

---

## Elevation

### Dark theme

**No drop shadows.** This is a Raycast hard rule: drop shadows are invisible on near-black and create visual noise. Use the **surface ladder** for elevation:

| Layer | Token | Conveys |
|---|---|---|
| Page | `--bg` (`#07080a`) | Ground plane |
| Resting surface | `--surface-1` (`#0d0d0d`) | Header, sidebar |
| Raised surface | `--surface-2` (`#101111`) | Cards, popovers |
| Floating surface | `--surface-3` (`#121212`) | Tooltips, active overlays |

All surfaces are separated by `--hairline` (`#242728`) borders, not shadows.

### Light theme

Subtle shadows are permitted. Keep them soft and warm — avoid cool/gray shadows.

```css
/* Example: card shadow in light theme */
box-shadow: 0 1px 4px rgba(42, 39, 35, 0.08), 0 4px 16px rgba(42, 39, 35, 0.06);
```

---

## Globe & Flight Arcs (Cinematic)

The globe is the hero. All globe decisions serve a **cinematic mood** — not a utilitarian data-viz tool.

### Canvas

| Theme | Globe canvas color |
|---|---|
| Dark | `#07080a` — deep space, subtle procedural starfield, vignette on edges |
| Light | `#faf7f2` — warm parchment, no starfield, soft vignette |

### Earth texture

Two options are acceptable; the owner is open to either:

| Option | Description | Recommendation |
|---|---|---|
| **A — Blue Marble (preferred)** | NASA Blue Marble 2k or 4k texture loaded from a CDN (e.g. `unpkg`, `jsdelivr`, or a self-hosted `/public/textures/` path). Apply a warm cream tint (`#fff4e0`) and warm specular highlight (`#332200`) in the Three.js `MeshPhongMaterial`. | **Recommended** — highest cinematic quality, warm and textured. |
| B — Stylized Three.js | No photoreal texture; instead a stylized Three.js composition (e.g. custom `ShaderMaterial` with procedural continents and ocean). Lighter weight, no CDN dependency. | Fallback for performance-constrained environments. |

In both cases, apply:
- Warm tint overlay: `#fff4e0` at low opacity (≈ 0.15–0.25 over the texture)
- Warm specular: `#332200`

### Atmospheric rim light

| Property | Value |
|---|---|
| Glow color | `#e8b87a` |
| Altitude (rim thickness) | `0.18` – `0.25` |

### Flight arcs

| Property | Value |
|---|---|
| Gradient start (warm gold) | `#f5c47a` |
| Gradient end (Raycast red) | `#ff5757` |
| Effect | Soft bloom / glow (post-processing or simulated via layered geometry) |
| Desktop stroke width | `0.6` – `0.8` (was `0.4`) |
| Animation speed | Slower dash animation — majestic, not hurried |
| Stop markers | `#ff6161` with gentle pulse rings |

### Cinematic camera

- Slow, weighted easing (ease-in-out cubic or custom spring)
- Gentle initial autorotate at low angular velocity
- A graceful fly-to-Korea arc on intro completion

### Interactive globe

The globe accepts pointer/touch input (`enablePointerInteraction: true`). Dragging pauses cinematic autorotation; a 3-second idle timer resumes it. Zoom and pan are disabled. Dragging does **not** advance or skip the intro choreography — that sequence runs on its own timers.

---

## Intro Choreography (~5s, mobile-friendly)

The owner found the prior intro (≈ 2.9s) too fast. Target: **≈5s of breathing room**. Skip and Enter buttons remain visible the entire duration.

| t (ms) | Event |
|---|---|
| `0` | Globe ready; camera at Asia-Pacific overview; slow cinematic autorotate begins |
| `~900` | Reveal flight arcs and stop markers (staggered entry, not all at once) |
| `~1600` | Autorotate stops; graceful fly-to-Korea begins (~2600ms easing) |
| `~4200` | Camera settles on Korea; brief hold |
| `~5200` | Auto handoff to Explorer (`onEnter` fires) |

**Skip button** and **Enter button** are visible from `t = 0` throughout. Clicking either interrupts the sequence and calls `onEnter` immediately.

### Mobile adaptations

| Concern | Adaptation |
|---|---|
| GPU load | Cap `devicePixelRatio` at `2` |
| Arc resolution | Lower arc and point resolution (fewer vertices) |
| Pulse rings | Drop pulse rings on stop markers |
| Timing | Keep the same ≈5s pacing — do not compress on mobile |

---

## Component Patterns

### Top header

| Theme | Background | Border |
|---|---|---|
| Dark | `--surface-1` (`#0d0d0d`) | `--hairline` bottom |
| Light | `#ffffff` | `--hairline` bottom |

Contains: logo/wordmark, language switcher, theme toggle (sun/moon icon).

### Collapsible left sidebar

- User-toggled (◀ / ▶ control, accessible label "Collapse sidebar" / "Expand sidebar")
- Collapsed state persists in `localStorage` (`key: sidebar-collapsed`)
- Background: `--surface-1`; right edge: `--hairline`

### Place cards

- Background: `--surface-2`
- Border: `1px solid var(--hairline)`
- Radius: `8px` (S in radius scale)
- On hover (dark): lift to `--surface-3`, keep hairline border — no shadow

### Filter chips

- Radius: `4px` (XS)
- Default state: `--surface-2` background, `--text-muted` label
- Active state: accent color background (category-specific or `--accent-blue`), `--text-primary` or contrasting label

### CTA pill

- Dark theme: white pill (`--cta-bg` / `--cta-text`)
- Light theme: dark pill (`--cta-bg` / `--cta-text`)
- Radius: `12px` (M) or `9999px` for a true pill

### Language switcher

- Inline control in header; cycles or toggles between available locales
- Uses `--text-muted` at rest, `--text-primary` on hover/active

### Theme toggle

- Sun icon (light mode) / Moon icon (dark mode)
- On mount: reads `prefers-color-scheme` as default; user override stored in `localStorage` (`key: theme`)
- See ADR-002 for full dual-theme decision record

---

## Interaction: Immersive Navigation

Place selection must feel like a camera dive, not a data update. Every navigation moment — globe→map handoff and within-map place selection — reinforces the cinematic identity. See [ADR-004](docs/decisions/ADR-004-immersive-navigation.md) for the full decision record.

### Click-to-fly (place selection)

Selecting a place — from a **map marker** or a **sidebar list item** — triggers an animated fly-to that pans and zooms simultaneously. Both entry points call a shared `flyToPlace(placeId)` in the map controller; neither calls `panTo` or `setCenter` directly.

| Provider | Fly-to target zoom |
|---|---|
| Kakao Maps | Level `4` (~1:5,000, street-level) |
| Google Maps | Zoom `15` (street-level) |

The fly-to uses the provider's native animated primitive so easing matches the SDK's built-in motion model. A plain `panTo` with no zoom change is not acceptable — it delivers no sense of travel.

`prefers-reduced-motion` override: fall back to instant `panTo` with no animation.

### Arrival emphasis

After the fly-to settles, the target marker enters a transient active state:

| Property | Value |
|---|---|
| Duration | ~1500 ms |
| Visual | Enlarged icon + accent ring (`--accent-blue` or category accent) |
| Decay | Fades cleanly into the resting selected-marker style |

The pulse must not conflict with the persistent selected state; it decays into it.

### Globe→map crossfade handoff

When the globe hands off to the provider map (region selected or intro completes):

| Step | Detail |
|---|---|
| Provider map mounts beneath globe | `opacity: 0`, renders in background |
| Crossfade duration | 500–600 ms, ease-in-out |
| Scale | Incoming map scales `0.97 → 1.0` (reinforces "zooming in") |
| WebGL teardown | Globe context released **after** fade completes — never during the overlap window |

Both layers are mounted simultaneously for the crossfade duration; z-index keeps the outgoing globe on top until the fade is done. A hard cut is a design regression.

`prefers-reduced-motion` override: instant swap, no crossfade or scale.

---

## References

| Document | Purpose |
|---|---|
| [ADR-001](docs/decisions/ADR-001-design-system-foundation.md) | Dark chrome + warm globe hero rationale |
| ADR-002 | Dual dark/light theme decision |
| ADR-003 | (future) |
| `docs/research/references/raycast-design-md.md` | Verbatim Raycast design system source (read-only archive) |
| `docs/rules/no-person-names.md` | PII rule: no person names in any project file |
