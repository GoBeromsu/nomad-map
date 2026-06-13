# Architecture

<!--
PURPOSE: The living system map. Answers "how is this system put together?" for someone
who just opened the repo. Update it as the system changes — it is NOT frozen like an ADR.
Keep it a map, not a manual: link to ADRs and rules, never restate their bodies.
-->

## Way point

<!-- Annotated directory tree: each top-level folder gets a one-line purpose and a pointer
     to the governing ADR/rule. Trim branches that carry no architectural meaning. -->

```
.
├── app/          # Next.js App Router pages; app/admin for data management  (ADR-003)
├── components/   # UI tree: AppShell, Globe, Explorer, FilterBar, PlaceMap,
│                 #   PlaceDetail, PlaceListItem, map views  (ADR-001, ADR-003)
├── lib/          # Domain logic: types, constants, map provider routing, i18n, geo utilities
│   ├── maps/     #   provider.ts — Kakao (Korea bbox) vs Google (overseas) dispatch
│   └── i18n/     #   I18nProvider, localizeField, useGeolocation
├── data/         # Canonical place & route data (places.json, route.json)
│                 #   — no personal identifiers  (rules/no-person-names.md)
├── messages/     # 8-locale translation JSON files (ko/en/ja/zh/es/fr/de/vi)
└── docs/         # ADRs, rules, research, this file
```

Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Vercel

## Component boundaries

<!-- What each module owns and how they communicate. One row per component. -->

| Component | Owns | Talks to | Governing ADR/rule |
|-----------|------|----------|--------------------|
| `AppShell` | Stage machine: globe-intro → explore transition | `Globe`, `Explorer` | ADR-003 |
| `Globe` | react-globe.gl + three.js globe render; place markers | `lib/geo.ts`, `data/places.json` | ADR-003 |
| `Explorer` | Explore-mode layout: place list + map panel | `FilterBar`, `PlaceMap`, `PlaceDetail`, `PlaceListItem` | ADR-003 |
| `FilterBar` | Filter state; tag/region controls | `Explorer` | — |
| `PlaceMap` | Active map view; delegates to map provider | `lib/maps/provider.ts` | ADR-003 |
| `PlaceDetail` | Place detail panel (description, localized copy) | `lib/i18n/localizeField`, `data/places.json` | ADR-001 |
| `lib/maps/provider.ts` | Routes map calls → Kakao (Korea bbox) or Google (overseas) | `lib/kakao.ts`, `lib/google.ts` | — |
| `lib/i18n/` | `localizeField(map, locale, legacy)` fallback chain; `I18nProvider`; `useGeolocation` | `messages/*.json` | — |
| `data/` | places.json, route.json — source-of-truth place data | Globe, Explorer, PlaceDetail | rules/no-person-names.md |
| `messages/` | 8-locale JSON translation files | `I18nProvider` | rules/no-person-names.md |

## Cross-cutting decisions index

<!-- Links to ADRs — do NOT restate them. One line each. -->

- [ADR-001](decisions/ADR-001-design-system-foundation.md) — Design System Foundation: Dark Chrome + Warm Globe Hero
- [ADR-002](decisions/ADR-002-dual-theme-system.md) — Dual Theme System with Auto-Detection
- [ADR-003](decisions/ADR-003-globe-first-hybrid-navigation.md) — Globe-First Hybrid Navigation Model
- Rule: [no-person-names](rules/no-person-names.md) — no personal identifiers in any public artifact

## Key flows

<!-- The one or two data/control flows that matter most. A short sequence or diagram. -->

1. **Intro → Explore**: User lands on globe intro → `AppShell` stage machine advances → globe animates out → `Explorer` mounts with place list and map panel.

2. **Place selection**: Click marker on globe → region zoom → `PlaceMap` requests provider via `lib/maps/provider.ts` (Kakao if inside Korea bounding box, Google otherwise) → map focuses on place → `PlaceDetail` panel opens alongside. See ADR-003.

3. **Localization**: `place.description_i18n[locale]` → `localizeField(map, locale, legacy)` → fallback chain (active locale → ko → legacy string) → rendered copy in `PlaceDetail` and list items.
