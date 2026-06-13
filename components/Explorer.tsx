"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import FilterBar, { type Filters } from "./FilterBar";
import PlaceListItem from "./PlaceListItem";
import PlaceDetail from "./PlaceDetail";
import type { Category, Place, Status } from "@/lib/types";

// 지도는 클라이언트 전용 (Kakao SDK가 window 필요)
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
      지도를 불러오는 중…
    </div>
  ),
});

export default function Explorer({ places }: { places: Place[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    categories: new Set<Category>(),
    statuses: new Set<Status>(),
  });

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return places.filter((p) => {
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
  }, [places, filters]);

  const selected = useMemo(
    () => places.find((p) => p.id === selectedId) ?? null,
    [places, selectedId],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileListOpen(false);
  };

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
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-neutral-400">
              조건에 맞는 장소가 없어요.
            </p>
          ) : (
            filtered.map((p) => (
              <PlaceListItem
                key={p.id}
                place={p}
                active={p.id === selectedId}
                onClick={() => handleSelect(p.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* 지도 */}
      <div className="relative flex-1">
        <MapView
          places={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
        />

        {/* 데스크톱: 상세 floating 패널 */}
        {selected && (
          <div className="absolute right-4 top-4 z-20 hidden w-[380px] max-h-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl md:block">
            <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* 모바일: 목록 열기 버튼 */}
        <button
          type="button"
          onClick={() => setMobileListOpen(true)}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg md:hidden"
        >
          목록 보기 ({filtered.length})
        </button>
      </div>

      {/* 모바일: 상세 바텀시트 */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-hidden rounded-t-2xl border-t border-neutral-200 bg-white shadow-2xl md:hidden">
          <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
        </div>
      )}

      {/* 모바일: 목록 바텀시트 */}
      {mobileListOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileListOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="text-sm font-semibold">장소 목록</h2>
              <button
                type="button"
                onClick={() => setMobileListOpen(false)}
                aria-label="닫기"
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
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {filtered.map((p) => (
                <PlaceListItem
                  key={p.id}
                  place={p}
                  active={p.id === selectedId}
                  onClick={() => handleSelect(p.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
