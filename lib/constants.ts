import type { Category, Status } from "./types";

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; color: string }
> = {
  cafe: { label: "카페", emoji: "☕", color: "#b45309" },
  accommodation: { label: "숙소", emoji: "🏠", color: "#7c3aed" },
  coworking: { label: "코워킹", emoji: "💻", color: "#0369a1" },
  restaurant: { label: "식당", emoji: "🍜", color: "#be123c" },
  spot: { label: "기타", emoji: "📍", color: "#15803d" },
};

export const STATUS_META: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  recommended: { label: "강력 추천", color: "#047857", bg: "#d1fae5" },
  good: { label: "괜찮음", color: "#1d4ed8", bg: "#dbeafe" },
  revisit: { label: "재방문 의사", color: "#a16207", bg: "#fef3c7" },
  mixed: { label: "호불호", color: "#9333ea", bg: "#f3e8ff" },
};

export const RATING_LABELS: Record<keyof import("./types").NomadRatings, string> =
  {
    wifi: "와이파이",
    power: "콘센트",
    seating: "좌석",
    quiet: "조용함",
    longStay: "장기체류",
  };

export const PRICE_LABEL: Record<number, string> = {
  1: "₩",
  2: "₩₩",
  3: "₩₩₩",
};
