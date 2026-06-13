import type { LocaleMap } from "./i18n/localizeField";

// 장소 분류 (디지털 노마드 관점)
export type Category =
  | "cafe" // 카페
  | "accommodation" // 숙소
  | "restaurant" // 식당
  | "recovery" // 회복 / 칠링 (해변, 사우나, 자연, 쉼)
  | "other"; // 기타

// 상태 배지
export type Status =
  | "recommended" // 추천
  | "good" // 보통
  | "bad"; // 불호

// 1~5 점 노마드 평가 항목
export interface NomadRatings {
  wifi: number; // 와이파이 속도/안정성
  power: number; // 콘센트 접근성
  seating: number; // 좌석 편안함 (장시간 작업)
  quiet: number; // 조용함 (소음 적음)
  longStay: number; // 장기 체류/오래 머물기 적합도
}

export interface LinkRef {
  label: string;
  url: string;
}

export interface Comment {
  date?: string; // 방문/체류 시작일 (YYYY-MM 또는 YYYY-MM-DD)
  duration?: string; // 체류 기간 (예: "3박 4일", "2시간")
  /** @deprecated Use note_i18n. Retained as ko shim until all records migrated. */
  note?: string; // 개인 코멘트 / 팁
  note_i18n?: LocaleMap; // 로컬라이즈된 코멘트
}

export interface RouteStop {
  lat: number;
  lng: number;
  label: string;
  city: string;
  country: string;
}

export interface RouteArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label: string;
  weight?: number;
}

export interface RouteData {
  stops: RouteStop[];
  arcs: RouteArc[];
}

export interface Place {
  id: string;
  /** @deprecated Use name_i18n. Retained as ko/original shim until all records migrated. */
  name: string;
  name_i18n?: LocaleMap; // 로컬라이즈된 장소명
  category: Category;
  status: Status;
  lat: number;
  lng: number;
  address?: string;
  /** @deprecated Use description_i18n. Retained as ko shim until all records migrated. */
  description: string; // 한 줄 ~ 짧은 설명
  description_i18n?: LocaleMap; // 로컬라이즈된 설명
  photos: string[]; // 사진 URL 배열 (첫 번째가 대표)
  ratings: NomadRatings;
  tags?: string[];
  links?: LinkRef[]; // 외부 URL / 지도 링크 / 접근 안내
  channels?: LinkRef[]; // 홍보 채널 (인스타, 블로그, 유튜브 등)
  comment?: Comment;
}
