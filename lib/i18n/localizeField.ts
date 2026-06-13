import type { Locale } from "./config";

/** Sparse locale → string map; any locale may be absent. */
export type LocaleMap = Partial<Record<Locale, string>>;

/**
 * Resolve a LocaleMap to a display string.
 * Priority: requested locale → fallback locale (ko) → legacyPlainString → ''.
 *
 * Pass `legacy` during the migration window to handle records
 * that have not yet been converted to the i18n shape.
 */
export function localizeField(
  map: LocaleMap | undefined,
  locale: Locale,
  legacy: string = "",
  fallbackLocale: Locale = "ko",
): string {
  if (!map) return legacy;
  return map[locale] ?? map[fallbackLocale] ?? legacy;
}
