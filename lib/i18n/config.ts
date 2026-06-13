// 지원 언어 (8개국어)
export const LOCALES = [
  "ko",
  "en",
  "ja",
  "zh",
  "es",
  "fr",
  "de",
  "vi",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

// 언어 선택기에 표시할 자국어 이름
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  vi: "Tiếng Việt",
};

// 브라우저 언어코드(navigator.language) → 지원 Locale 매핑
export function resolveLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  const base = lower.split("-")[0];
  // zh-TW, zh-HK 등도 일단 zh로
  const match = LOCALES.find((l) => l === lower || l === base);
  return match ?? DEFAULT_LOCALE;
}
