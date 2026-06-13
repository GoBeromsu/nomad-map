"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FilterBar, { type Filters } from "./FilterBar";
import PlaceMap from "./PlaceMap";
import PlaceListItem from "./PlaceListItem";
import PlaceDetail from "./PlaceDetail";
import { useGeolocation } from "@/lib/useGeolocation";
import { haversineKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Category, Place, Status } from "@/lib/types";

const SIDEBAR_KEY = "nm-sidebar-collapsed";

export default function Explorer({
  places,
  onShowGlobe,
}: {
  places: Place[];
  onShowGlobe?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  // Default expanded (false = not collapsed). Lazy initializer reads localStorage
  // on the client; returns false on SSR (typeof window guard) to keep hydration stable.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const [filters, setFilters] = useState<Filters>({
    query: "",
    categories: new Set<Category>(),
    statuses: new Set<Status>(),
  });
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const { coords: userLocation } = useGeolocation();
  const { t } = useI18n();

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = places.filter((p) => {
      if (filters.categories.size && !filters.categories.has(p.category))
        return false;
      if (filters.statuses.size && !filters.statuses.has(p.status)) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${(p.tags ?? []).join(" ")} ${
          p.address ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // 현재 위치가 있으면 가까운 순으로 정렬
    if (userLocation) {
      return [...list].sort(
        (a, b) =>
          haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
      );
    }
    return list;
  }, [places, filters, userLocation]);

  const selected = useMemo(
    () => places.find((p) => p.id === selectedId) ?? null,
    [places, selectedId],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileListOpen(false);
  };

  // 모바일 목록 시트가 열리면 닫기 버튼에 포커스
  useEffect(() => {
    if (mobileListOpen) sheetCloseRef.current?.focus();
  }, [mobileListOpen]);

  // 목록 시트 키보드: Escape 닫기 + 간단한 포커스 트랩
  const handleSheetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setMobileListOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const renderList = () =>
    filtered.length === 0 ? (
      <p className="px-2 py-8 text-center text-sm text-muted">
        {t("list.empty")}
      </p>
    ) : (
      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id}>
            <PlaceListItem
              place={p}
              active={p.id === selectedId}
              onClick={() => handleSelect(p.id)}
              distanceKm={
                userLocation
                  ? haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* 데스크톱 사이드바: 필터 + 목록 — 사용자가 접고 펼칠 수 있음 */}
      <aside
        className={`hidden shrink-0 flex-col overflow-hidden border-r border-hairline bg-surface-1 transition-all duration-300 ease-in-out md:flex ${
          sidebarCollapsed ? "w-0 opacity-0" : "w-[360px] opacity-100"
        }`}
      >
        {/* 필터 + 접기 버튼 행 */}
        <div className="flex items-start gap-2 border-b border-hairline p-4">
          <div className="min-w-0 flex-1">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              total={places.length}
              shown={filtered.length}
            />
          </div>
          {/* 사이드바 접기 버튼 (◀) */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="사이드바 접기 / Collapse sidebar"
            aria-expanded={true}
            className="mt-0.5 flex shrink-0 items-center justify-center rounded-md p-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            ◀
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{renderList()}</div>
      </aside>

      {/* 지도 */}
      <div className="relative flex-1">
        <PlaceMap
          places={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
          userLocation={userLocation}
        />

        {/* 🌍 지구본으로 돌아가기: 지도 컬럼 안에 위치하므로 사이드바 검색창과
            절대 겹치지 않음 (AppShell에서 이전됨). left-3 top-3. */}
        {onShowGlobe && (
          <button
            type="button"
            onClick={onShowGlobe}
            className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1/90 px-3 py-2 text-sm font-semibold text-body backdrop-blur transition hover:bg-surface-2"
            aria-label={t("map.backToGlobe")}
          >
            🌍
          </button>
        )}

        {/* 사이드바 펼치기 버튼 (▶): 접혔을 때만 표시, 데스크톱 전용.
            🌍 버튼이 left-3 top-3 에 있으므로 left-14 top-3 으로 오프셋. */}
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="사이드바 펼치기 / Expand sidebar"
            aria-expanded={false}
            className="absolute left-14 top-3 z-10 hidden items-center justify-center rounded-md border border-hairline bg-surface-1 p-2 text-xs text-muted transition hover:text-ink md:flex"
          >
            ▶
          </button>
        )}

        {/* 데스크톱: 상세 floating 패널 */}
        {selected && (
          <div className="absolute right-4 top-4 z-20 hidden max-h-[calc(100%-2rem)] w-[380px] overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-sm md:block">
            <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* 모바일: 목록 열기 버튼 */}
        <button
          type="button"
          onClick={() => setMobileListOpen(true)}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-ink md:hidden"
        >
          {t("list.openMobile")} ({filtered.length})
        </button>
      </div>

      {/* 모바일: 상세 바텀시트 (배경 탭으로 닫기) */}
      {selected && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedId(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-hidden rounded-t-2xl border-t border-hairline bg-surface-1">
            <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      {/* 모바일: 목록 바텀시트 */}
      {mobileListOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileListOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-list-title"
            onKeyDown={handleSheetKeyDown}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-hairline bg-surface-1"
          >
            <div className="flex items-center justify-between border-b border-hairline p-4">
              <h2 id="mobile-list-title" className="text-sm font-semibold text-ink">
                {t("list.title")}
              </h2>
              <button
                ref={sheetCloseRef}
                type="button"
                onClick={() => setMobileListOpen(false)}
                aria-label={t("common.close")}
                className="text-muted transition hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="border-b border-hairline p-4">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                total={places.length}
                shown={filtered.length}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3">{renderList()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
