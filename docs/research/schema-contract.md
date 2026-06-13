# Schema Contract — comment rename + description localization

Both the DATA lane (edits `data/places.json`) and the CODE lane (edits types/components/admin/messages)
MUST conform to this exact contract so they can run in parallel without integration breakage.

## Locale type (already exists in lib/i18n)
8 locales: `"ko" | "en" | "ja" | "zh" | "es" | "fr" | "de" | "vi"`. `ko` is the base/fallback locale.

## New shared type (CODE lane creates `lib/i18n/localizeField.ts`)
```ts
import type { Locale } from "./..."; // wherever Locale is defined
export type LocaleMap = Partial<Record<Locale, string>>;
// active locale → ko → legacy plain string
export function localizeField(map: LocaleMap | undefined, locale: Locale, legacy?: string): string;
```

## Place type changes (lib/types.ts)
- RENAME interface `VisitRecord` → `Comment`. Same fields PLUS `note_i18n`:
```ts
export interface Comment {
  date?: string;
  duration?: string;
  note?: string;            // LEGACY ko shim — keep for backward compat
  note_i18n?: LocaleMap;    // localized note
}
```
- `Place` changes:
  - KEEP `description: string;` (legacy ko shim, still required/populated)
  - ADD `description_i18n?: LocaleMap;`
  - RENAME field `visit?: VisitRecord;` → `comment?: Comment;`

## places.json shape (DATA lane writes EXACTLY this)
Each place object:
- KEEP existing `description` (string, Korean) as-is = the ko shim.
- ADD `description_i18n`: object with ALL 8 locale keys, each a translation of `description`. `ko` = the existing Korean text verbatim. en/ja/zh/es/fr/de/vi = faithful translations (natural, nomad tone, NO person names).
- RENAME `visit` → `comment`. Inside it: keep `date`, `duration`, keep `note` (ko shim) AND add `note_i18n` (all 8 locales) translating the note.
- Places without a prior `visit` simply have no `comment` (omit).

Example:
```json
{
  "id": "...",
  "description": "구좌읍 종달리에 위치한 ...",
  "description_i18n": {
    "ko": "구좌읍 종달리에 위치한 ...",
    "en": "A bicycle-themed guesthouse in Jongdal-ri ...",
    "ja": "...", "zh": "...", "es": "...", "fr": "...", "de": "...", "vi": "..."
  },
  "comment": {
    "date": "2026-04-14",
    "duration": "2박",
    "note": "스트레스로 당일 충동 예약. ...",
    "note_i18n": { "ko": "스트레스로 ...", "en": "...", "ja": "...", "zh": "...", "es": "...", "fr": "...", "de": "...", "vi": "..." }
  }
}
```

## Rendering (CODE lane)
- `PlaceDetail` / `PlaceListItem`: destructure `locale` from `useI18n()`. Replace `place.description` read with `localizeField(place.description_i18n, locale, place.description)`. Replace `place.visit` with `place.comment`, and `comment.note` read with `localizeField(comment.note_i18n, locale, comment.note)`.
- `app/admin/page.tsx`: rename any `visit` UI to `comment`; description input becomes locale-tabbed (writes `description_i18n`, also mirror `description = description_i18n.ko` as shim). Comment note likewise.
- `messages/*.json`: rename any `visit.*` keys → `comment.*`; keep all 8 files at identical key sets (parity). Update Korean/again label text from "방문 기록" → "코멘트" tone, and locale equivalents ("Comment", "コメント", "评论", "Comentario", "Commentaire", "Kommentar", "Bình luận").

## PII RULE (both lanes — non-negotiable)
No person names or personal identifiers anywhere in descriptions, notes, or translations. If the existing Korean text contains a name, the DATA lane removes it (rephrase neutrally) in ALL locales.
