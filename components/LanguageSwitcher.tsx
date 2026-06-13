"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 / Escape 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
        className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 text-xs font-medium text-body transition hover:bg-surface-3"
      >
        <span aria-hidden="true">🌐</span>
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("common.language")}
          className="absolute right-0 z-50 mt-1.5 max-h-72 w-40 overflow-y-auto rounded-xl border border-hairline bg-surface-1 py-1"
        >
          {LOCALES.map((l: Locale) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-surface-2 ${
                  l === locale
                    ? "font-semibold text-ink"
                    : "text-body"
                }`}
              >
                {LOCALE_NAMES[l]}
                {l === locale && (
                  <span aria-hidden="true" className="text-ink">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
