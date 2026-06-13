"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getAllPlaces } from "@/lib/places";
import { CATEGORY_META, RATING_LABELS, STATUS_META } from "@/lib/constants";
import type { Category, LinkRef, NomadRatings, Place, Status } from "@/lib/types";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
});

const EMPTY_RATINGS: NomadRatings = {
  wifi: 3,
  power: 3,
  seating: 3,
  quiet: 3,
  longStay: 3,
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function AdminPage() {
  const existing = useMemo(() => getAllPlaces(), []);
  const [password, setPassword] = useState("");

  // 폼 상태
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("cafe");
  const [status, setStatus] = useState<Status>("recommended");
  const [lat, setLat] = useState(37.5663);
  const [lng, setLng] = useState(126.9779);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [ratings, setRatings] = useState<NomadRatings>(EMPTY_RATINGS);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3>(2);
  const [tags, setTags] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkRef[]>([{ label: "", url: "" }]);
  const [channels, setChannels] = useState<LinkRef[]>([{ label: "", url: "" }]);
  const [visitDate, setVisitDate] = useState("");
  const [visitDuration, setVisitDuration] = useState("");
  const [visitNote, setVisitNote] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const place: Place = useMemo(() => {
    const clean = (arr: LinkRef[]) =>
      arr.filter((l) => l.label.trim() && l.url.trim());
    return {
      id: slugify(name) || "new-place",
      name: name.trim(),
      category,
      status,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: address.trim() || undefined,
      description: description.trim(),
      photos,
      ratings,
      priceLevel,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      links: clean(links),
      channels: clean(channels),
      visit:
        visitDate || visitDuration || visitNote
          ? {
              date: visitDate || undefined,
              duration: visitDuration || undefined,
              note: visitNote || undefined,
            }
          : undefined,
    };
  }, [
    name, category, status, lat, lng, address, description, photos, ratings,
    priceLevel, tags, links, channels, visitDate, visitDuration, visitNote,
  ]);

  const singleJson = JSON.stringify(place, null, 2);
  const mergedJson = JSON.stringify(
    [...existing.filter((p) => p.id !== place.id), place],
    null,
    2,
  );

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!password) {
      setUploadMsg("먼저 관리자 비밀번호를 입력하세요.");
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "x-admin-password": password },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "업로드 실패");
        urls.push(data.url);
      }
      setPhotos((prev) => [...prev, ...urls]);
      setUploadMsg(`${urls.length}장 업로드 완료`);
    } catch (e) {
      setUploadMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function downloadJson() {
    const blob = new Blob([mergedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "places.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <header className="mb-6">
        <a href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
          ← 지도로
        </a>
        <h1 className="mt-2 text-2xl font-bold">관리자 · 장소 추가</h1>
        <p className="mt-1 text-sm text-neutral-500">
          사진을 업로드하고 정보를 입력한 뒤, 생성된 JSON을{" "}
          <code className="rounded bg-neutral-100 px-1">data/places.json</code>{" "}
          에 반영해 커밋하면 배포됩니다. (사용자에게는 읽기 전용)
        </p>
      </header>

      {/* 비밀번호 */}
      <Field label="관리자 비밀번호 (사진 업로드용)">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ADMIN_PASSWORD"
          className="input"
        />
      </Field>

      {/* 사진 업로드 */}
      <Section title="사진">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {uploading && <p className="mt-2 text-xs text-neutral-400">업로드 중…</p>}
        {uploadMsg && (
          <p className="mt-2 text-xs text-neutral-600">{uploadMsg}</p>
        )}
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 기본 정보 */}
      <Section title="기본 정보">
        <Field label="이름">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="예: 프릳츠 커피 마포" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="분류">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>
              ))}
            </select>
          </Field>
          <Field label="상태">
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="input">
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="가격대">
          <select value={priceLevel} onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3)} className="input">
            <option value={1}>₩ (저렴)</option>
            <option value={2}>₩₩ (보통)</option>
            <option value={3}>₩₩₩ (비쌈)</option>
          </select>
        </Field>
        <Field label="주소">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="서울 마포구 …" />
        </Field>
        <Field label="설명">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="디지털 노마드 관점에서 어떤 곳인지" />
        </Field>
        <Field label="태그 (쉼표로 구분)">
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="로스터리, 넓은좌석, 2층작업석" />
        </Field>
      </Section>

      {/* 위치 */}
      <Section title="위치">
        <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="위도(lat)">
            <input type="number" step="0.000001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value) || 0)} className="input" />
          </Field>
          <Field label="경도(lng)">
            <input type="number" step="0.000001" value={lng} onChange={(e) => setLng(parseFloat(e.target.value) || 0)} className="input" />
          </Field>
        </div>
      </Section>

      {/* 노마드 평가 */}
      <Section title="노마드 평가 (1~5)">
        <div className="space-y-3">
          {(Object.keys(RATING_LABELS) as (keyof NomadRatings)[]).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-16 text-sm text-neutral-600">{RATING_LABELS[key]}</span>
              <input
                type="range" min={1} max={5} value={ratings[key]}
                onChange={(e) => setRatings((r) => ({ ...r, [key]: Number(e.target.value) }))}
                className="flex-1"
              />
              <span className="w-6 text-right text-sm font-semibold tabular-nums">{ratings[key]}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 링크 / 채널 */}
      <Section title="링크 (지도/접근 URL)">
        <LinkEditor rows={links} onChange={setLinks} placeholder={["카카오맵", "https://map.kakao.com/?q=…"]} />
      </Section>
      <Section title="홍보 채널 (인스타/블로그 등)">
        <LinkEditor rows={channels} onChange={setChannels} placeholder={["인스타그램", "https://instagram.com/…"]} />
      </Section>

      {/* 방문 기록 */}
      <Section title="방문 기록">
        <div className="grid grid-cols-2 gap-3">
          <Field label="방문 시기"><input value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="input" placeholder="2026-03" /></Field>
          <Field label="체류 기간"><input value={visitDuration} onChange={(e) => setVisitDuration(e.target.value)} className="input" placeholder="3시간 / 3박4일" /></Field>
        </div>
        <Field label="코멘트 / 팁"><textarea value={visitNote} onChange={(e) => setVisitNote(e.target.value)} rows={2} className="input" /></Field>
      </Section>

      {/* 출력 */}
      <Section title="결과">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(singleJson); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            {copied ? "복사됨!" : "이 장소 JSON 복사"}
          </button>
          <button type="button" onClick={downloadJson} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium">
            병합된 places.json 다운로드
          </button>
        </div>
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100">
          {singleJson}
        </pre>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function LinkEditor({
  rows,
  onChange,
  placeholder,
}: {
  rows: LinkRef[];
  onChange: (rows: LinkRef[]) => void;
  placeholder: [string, string];
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row.label}
            onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r)))}
            placeholder={placeholder[0]}
            className="input w-1/3"
          />
          <input
            value={row.url}
            onChange={(e) => onChange(rows.map((r, idx) => (idx === i ? { ...r, url: e.target.value } : r)))}
            placeholder={placeholder[1]}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() => onChange(rows.length === 1 ? [{ label: "", url: "" }] : rows.filter((_, idx) => idx !== i))}
            className="shrink-0 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-400"
            aria-label="행 삭제"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { label: "", url: "" }])}
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        + 행 추가
      </button>
    </div>
  );
}
