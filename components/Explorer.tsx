"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import FilterBar, { type Filters } from "./FilterBar";
import PlaceListItem from "./PlaceListItem";
import PlaceDetail from "./PlaceDetail";
import { useGeolocation } from "@/lib/useGeolocation";
import { haversineKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Category, Place, Status } from "@/lib/types";

function MapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
      {t("map.loading")}
    </div>
  );
}

// 지도는 클라이언트 전용 (Kakao SDK가 window 필요)
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default function Explorer({ places }: { places: Place[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    categories: new Set<Category>(),
    statuses: new Set<Status>(),
  });
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const { coords: userLocation } = useGeolocation();
  const { t } = useI18n();

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
      <p className="px-2 py-8 text-center text-sm text-neutral-400">
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
      {/* 데스크톱 사이드바: 필터 + 목록 */}
      <aside className="hidden w-[360px] shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="border-b border-neutral-100 p-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            total={places.length}
            shown={filtered.length}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">{renderList()}</div>
      </aside>

      {/* 지도 */}
      <div className="relative flex-1">
        <MapView
          places={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
          userLocation={userLocation}
        />

        {/* 데스크톱: 상세 floating 패널 */}
        {selected && (
          <div className="absolute right-4 top-4 z-20 hidden max-h-[calc(100%-2rem)] w-[380px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl md:block">
            <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* 모바일: 목록 열기 버튼 */}
        <button
          type="button"
          onClick={() => setMobileListOpen(true)}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg md:hidden"
        >
          {t("list.openMobile")} ({filtered.length})
        </button>
      </div>

      {/* 모바일: 상세 바텀시트 (배경 탭으로 닫기) */}
      {selected && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedId(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-hidden rounded-t-2xl border-t border-neutral-200 bg-white shadow-2xl">
            <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      {/* 모바일: 목록 바텀시트 */}
      {mobileListOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileListOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-list-title"
            onKeyDown={handleSheetKeyDown}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 id="mobile-list-title" className="text-sm font-semibold">
                {t("list.title")}
              </h2>
              <button
                ref={sheetCloseRef}
                type="button"
                onClick={() => setMobileListOpen(false)}
                aria-label={t("common.close")}
                className="text-neutral-400"
              >
                ✕
              </button>
            </div>
            <div className="border-b border-neutral-100 p-4">
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
