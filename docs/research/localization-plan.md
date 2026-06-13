# Place Content Localization Plan

**Date:** 2026-06-13  
**Scope:** `description` on `Place` and `note` on `VisitRecord` — 34 description fields, 27 visit-note fields across `data/places.json`  
**Goal:** Both fields render in the active UI locale with graceful `ko` fallback, no runtime translation API, no paid dependency.

---

## Current State

| Field | Type | Problem |
|---|---|---|
| `Place.description` | `string` (Korean) | Hardcoded; rendered verbatim in `PlaceDetail` (line 91) and `PlaceListItem` (line 59) |
| `VisitRecord.note` | `string \| undefined` (Korean) | Hardcoded; rendered in `PlaceDetail` (line 130) |

The UI i18n system (`useI18n` → `t()`) already handles locale selection and fallback to `DEFAULT_LOCALE = "ko"`, but it only covers static message catalog keys. Place content lives in `data/places.json` and is not wired into that system.

---

## Options Compared

### Option A — Multilingual field per place: `description_i18n: Partial<Record<Locale, string>>`

Each `Place` object carries all translations inline:

```json
{
  "description_i18n": {
    "ko": "구좌읍 종달리에 위치한 자전거 테마 게스트하우스…",
    "en": "A bicycle-themed guesthouse in Jongdal-ri, Gujwa-eup…"
  }
}
```

**Pros:**
- Data is co-located with the place record — no foreign-key join, no extra files
- Mirrors the existing `CATALOGS[locale][key]` fallback pattern in `I18nProvider.tsx`
- TypeScript-safe with a shared `LocaleMap` type
- Admin form adds per-locale textareas inside the existing form shape
- Migration is mechanical: rename the existing `string` value into `{ko: value}`
- Zero new runtime dependencies

**Cons:**
- `places.json` grows (but only by filled-in locales; sparse is fine)
- Admin form becomes wider per-locale — manageable with a tab/accordion UI

---

### Option B — Separate per-locale content files / a lookup map keyed by place ID

A parallel file like `data/place-content.en.json` or `data/place-content.json`:

```json
{
  "제주도-자전거컨셉-게스트하우스": {
    "en": { "description": "...", "visitNote": "..." }
  }
}
```

**Pros:**
- Place IDs act as stable foreign keys
- Content files can be generated/updated independently of place metadata

**Cons:**
- Requires a runtime join (look up place ID in a second data structure) on every render
- Place IDs are slugified Korean strings — they are not safe stable keys if a place is renamed
- Admin form must write to two separate structures, complicating the JSON-download workflow
- No structural win over Option A; adds indirection without payoff

**Verdict: rejected.** The join complexity is not justified given the small dataset (34 places).

---

### Option C — Runtime machine translation (Google Translate / DeepL)

Translate `description` on the fly via API when locale changes.

**Pros:** Zero content authoring effort per new locale

**Cons:**
- Google Translate and DeepL both require paid API keys active at request time
- Adds 200–800 ms latency on every locale switch
- Outputs are non-deterministic — subtle diffs on re-render are possible
- Cannot be cached in a static export without baking translated content into the build
- Introduces a third-party runtime dependency and billing risk

**Verdict: rejected.** Fails the "no paid API at request time" constraint.

---

## Recommendation: Option A

Inline multilingual fields on each `Place` and `VisitRecord`, with a shared `LocaleMap` helper type and a `localizeField()` utility that mirrors the existing `lookup()` fallback logic.

---

## Implementation Specification

### 1. New shared type utility — `lib/i18n/localizeField.ts` (new file)

```typescript
import type { Locale } from "./config";

/** Sparse locale → string map; any locale may be absent. */
export type LocaleMap = Partial<Record<Locale, string>>;

/**
 * Resolve a LocaleMap to a display string.
 * Priority: requested locale → fallback locale (ko) → legacyPlainString → ''.
 *
 * Pass `legacyPlainString` during the migration window to handle place records
 * that have not yet been converted to the i18n shape.
 */
export function localizeField(
  map: LocaleMap | undefined,
  locale: Locale,
  legacyPlainString: string = "",
  fallbackLocale: Locale = "ko",
): string {
  if (!map) return legacyPlainString;
  return map[locale] ?? map[fallbackLocale] ?? legacyPlainString;
}
```

No circular dependency risk: `lib/types.ts` imports `LocaleMap` from here; `I18nProvider.tsx` does not need to change.

---

### 2. Type changes — `lib/types.ts`

Add `LocaleMap` import and two new optional i18n fields. Keep the old `string` fields as deprecated shims during the migration window so no component breaks before the data migration is committed.

```typescript
import type { LocaleMap } from "./i18n/localizeField";

export interface Place {
  id: string;
  name: string;
  category: Category;
  status: Status;
  lat: number;
  lng: number;
  address?: string;
  /** @deprecated Use description_i18n. Retained as fallback until all records migrated. */
  description: string;
  /** Primary localized description. Must contain at least the "ko" key. */
  description_i18n?: LocaleMap;
  photos: string[];
  ratings: NomadRatings;
  tags?: string[];
  links?: LinkRef[];
  channels?: LinkRef[];
  visit?: VisitRecord;
}

export interface VisitRecord {
  date?: string;
  duration?: string;
  /** @deprecated Use note_i18n. */
  note?: string;
  /** Localized visit comment / tip. */
  note_i18n?: LocaleMap;
}
```

After data migration is complete (all records converted), remove `description` and `note` and make `description_i18n` required.

---

### 3. Component changes — `components/PlaceDetail.tsx`

Add `locale` to the `useI18n()` destructure (it is already available on the context value). Replace the two plain-string reads with `localizeField`.

**Line 16 — update import and destructure:**
```tsx
import { localizeField } from "@/lib/i18n/localizeField";
// ...
const { t, locale } = useI18n();
```

**Line 90–92 — description paragraph:**
```tsx
<p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
  {localizeField(place.description_i18n, locale, place.description)}
</p>
```

**Line 129–131 — visit note:**
```tsx
{(place.visit.note || place.visit.note_i18n) && (
  <p className="text-neutral-700">
    <span aria-hidden="true">💬</span>{" "}
    {localizeField(place.visit.note_i18n, locale, place.visit.note ?? "")}
  </p>
)}
```

---

### 4. Component changes — `components/PlaceListItem.tsx`

**Add import and destructure (line 5 area):**
```tsx
import { localizeField } from "@/lib/i18n/localizeField";
// ...
const { t, locale } = useI18n();
```

**Line 58–60 — description truncation:**
```tsx
<p className="mt-0.5 truncate text-xs text-neutral-500">
  {localizeField(place.description_i18n, locale, place.description)}
</p>
```

---

### 5. Admin form changes — `app/admin/page.tsx`

Replace the single `description` and `visitNote` string states with `LocaleMap` states. Add a locale-tab UI inside the existing Section/Field pattern so the admin can enter text per locale.

**State changes:**
```tsx
import type { LocaleMap } from "@/lib/i18n/localizeField";
import { LOCALES } from "@/lib/i18n/config";

// Replace:
// const [description, setDescription] = useState("");
// const [visitNote, setVisitNote] = useState("");
const [descriptionI18n, setDescriptionI18n] = useState<LocaleMap>({ ko: "" });
const [visitNoteI18n, setVisitNoteI18n] = useState<LocaleMap>({});
const [activeLang, setActiveLang] = useState<Locale>("ko");
```

**LocaleMap textarea helper (add alongside Section/Field):**
```tsx
function I18nTextarea({
  label,
  value,
  map,
  locale,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: LocaleMap;
  map: LocaleMap;
  locale: Locale;
  onChange: (updated: LocaleMap) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={`${label} · ${locale.toUpperCase()}`}>
      <textarea
        value={map[locale] ?? ""}
        onChange={(e) => onChange({ ...map, [locale]: e.target.value })}
        rows={rows}
        className="input"
        placeholder={placeholder}
      />
    </Field>
  );
}
```

Add a locale tab bar at the top of the 기본 정보 section:
```tsx
<div className="mb-3 flex flex-wrap gap-1">
  {LOCALES.map((l) => (
    <button
      key={l}
      type="button"
      onClick={() => setActiveLang(l)}
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        activeLang === l ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"
      }`}
    >
      {l.toUpperCase()}
    </button>
  ))}
</div>
<I18nTextarea
  label="설명"
  value={descriptionI18n}
  map={descriptionI18n}
  locale={activeLang}
  onChange={setDescriptionI18n}
  placeholder="디지털 노마드 관점에서 어떤 곳인지"
/>
```

**Place memo — update the built object:**
```tsx
const place: Place = useMemo(() => {
  // ...
  return {
    // ...
    description: descriptionI18n.ko ?? "",   // migration shim
    description_i18n: descriptionI18n,
    // ...
    visit: visitDate || visitDuration || visitNoteI18n.ko
      ? {
          date: visitDate || undefined,
          duration: visitDuration || undefined,
          note: visitNoteI18n.ko,            // migration shim
          note_i18n: Object.keys(visitNoteI18n).length ? visitNoteI18n : undefined,
        }
      : undefined,
  };
}, [..., descriptionI18n, visitNoteI18n]);
```

---

### 6. Migration path for existing 34 Korean descriptions + 27 visit notes

This is a one-time data transformation on `data/places.json`. No runtime code depends on the old shape after step 3–4 are deployed (the `localizeField` shim handles both old and new shapes).

**Step 1 — seed `ko` from existing fields** (run a Node script or do it with `jq`):

```bash
# jq one-liner to convert in-place
jq '[.[] | . + {description_i18n: {ko: .description}} |
         if .visit.note then
           .visit += {note_i18n: {ko: .visit.note}}
         else . end]' \
  data/places.json > data/places.tmp.json && mv data/places.tmp.json data/places.json
```

This seeds every place with `description_i18n: {ko: "..."}` and every visit record that has a note with `note_i18n: {ko: "..."}`. The legacy `description` and `visit.note` fields remain as shims.

**Step 2 — add English translations** (optional but high value; en is the most common non-ko locale).

Options (in order of preference):
- Author manually for the 5–6 highest-traffic places (cafes, accommodations with the most detail)
- Run a one-time offline script using the Anthropic API (claude-haiku) or free LibreTranslate endpoint; commit the output; review before merging
- Leave `en` absent — `localizeField` falls back to `ko`, which is a legible Korean string rather than a blank

**Step 3 — remove legacy shim fields** after all records have `description_i18n.ko` populated and team is confident in the new shape. Remove `description` and `note` from the type definitions and run `tsc` to confirm no references remain.

---

### 7. PII rule for translations

The PII rule (no person names in descriptions) applies equally to all translated variants. When seeding translations:
- The existing Korean content does not contain person names — verify by greedy search before committing: `grep -E '[가-힣]{2,3}씨|Mr\.|Ms\.' data/places.json`
- If translations are authored by AI, include the instruction: "Do not include any person names. Describe the place factually."
- `visit.note_i18n` may include personal impressions but must not name individuals.

---

## Summary of File Changes

| File | Change |
|---|---|
| `lib/i18n/localizeField.ts` | New: `LocaleMap` type + `localizeField()` helper |
| `lib/types.ts` | Add `description_i18n?: LocaleMap` to `Place`; add `note_i18n?: LocaleMap` to `VisitRecord`; deprecate old string fields |
| `components/PlaceDetail.tsx` | Import `localizeField`, destructure `locale`, replace 2 plain string reads |
| `components/PlaceListItem.tsx` | Import `localizeField`, destructure `locale`, replace 1 plain string read |
| `app/admin/page.tsx` | Replace `description`/`visitNote` states with `LocaleMap`; add locale tab bar; update place memo |
| `data/places.json` | One-time jq migration: seed `description_i18n.ko` and `note_i18n.ko` from existing fields |
