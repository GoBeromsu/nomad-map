"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LOCALE, resolveLocale, type Locale } from "./config";

import ko from "@/messages/ko.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import zh from "@/messages/zh.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import vi from "@/messages/vi.json";

type Messages = Record<string, unknown>;

const CATALOGS: Record<Locale, Messages> = {
  ko,
  en,
  ja,
  zh,
  es,
  fr,
  de,
  vi,
};

const STORAGE_KEY = "locale";

// 점(.) 표기 키로 중첩 객체 탐색
function lookup(messages: Messages, key: string): string | undefined {
  let cur: unknown = messages;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

// "{name}" 형태의 치환
function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // 최초 마운트 시: 저장된 선택 > 브라우저 언어 > 기본값
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored
      ? resolveLocale(stored)
      : resolveLocale(navigator.language);
    setLocaleState(initial);
  }, []);

  // 문서 lang 동기화
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const msg =
        lookup(CATALOGS[locale], key) ??
        lookup(CATALOGS[DEFAULT_LOCALE], key) ??
        key;
      return interpolate(msg, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
