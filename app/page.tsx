import Explorer from "@/components/Explorer";
import { getAllPlaces } from "@/lib/places";

export default function Home() {
  const places = getAllPlaces();

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden>
            🧭
          </span>
          <div>
            <h1 className="text-base font-bold leading-tight text-neutral-900">
              노마드 맵
            </h1>
            <p className="text-[11px] leading-tight text-neutral-500">
              한국 디지털 노마드 장소 기록
            </p>
          </div>
        </div>
        <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600">
          직접 가본 곳만 기록 ✍️
        </span>
      </header>

      <Explorer places={places} />
    </main>
  );
}
