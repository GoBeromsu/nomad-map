"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function AppHeader() {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-hairline bg-surface-1 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-xl" aria-hidden>
          🧭
        </span>
        <div>
          <h1 className="text-base font-bold leading-tight text-ink">
            {t("app.title")}
          </h1>
          <p className="line-clamp-2 text-[11px] leading-tight text-muted">
            {t("app.tagline")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label="테마 전환 / Toggle theme"
          aria-pressed={isDark}
          className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 text-xs font-medium text-body transition hover:bg-surface-3"
        >
          {isDark ? "🌙" : "☀️"}
        </button>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
