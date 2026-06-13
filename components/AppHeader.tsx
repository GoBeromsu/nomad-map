"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-xl" aria-hidden>
          🧭
        </span>
        <div>
          <h1 className="text-base font-bold leading-tight text-neutral-900">
            {t("app.title")}
          </h1>
          <p className="text-[11px] leading-tight text-neutral-500">
            {t("app.tagline")}
          </p>
        </div>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
