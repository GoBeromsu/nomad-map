import type { Category, Status } from "./types";

// 색상/이모지는 표시용 메타. 텍스트 라벨은 i18n(t)에서 가져온다.
export const CATEGORY_META: Record<
  Category,
  { emoji: string; color: string }
> = {
  cafe: { emoji: "☕", color: "#b45309" },
  accommodation: { emoji: "🏠", color: "#7c3aed" },
  restaurant: { emoji: "🍜", color: "#be123c" },
  recovery: { emoji: "🌿", color: "#15803d" },
  other: { emoji: "📍", color: "#0369a1" },
};

export const STATUS_META: Record<Status, { color: string; bg: string }> = {
  recommended: { color: "#047857", bg: "#d1fae5" }, // 추천
  good: { color: "#1d4ed8", bg: "#dbeafe" }, // 보통
  bad: { color: "#be123c", bg: "#ffe4e6" }, // 불호
};

// 평가 항목 키 (라벨은 i18n에서 rating.<key>)
export const RATING_KEYS: (keyof import("./types").NomadRatings)[] = [
  "wifi",
  "power",
  "seating",
  "quiet",
  "longStay",
];
