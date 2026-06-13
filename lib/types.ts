// 장소 분류 (디지털 노마드 관점)
export type Category =
  | "cafe" // 카페
  | "accommodation" // 숙소
  | "coworking" // 코워킹 스페이스
  | "restaurant" // 식당
  | "spot"; // 그 외 (도서관, 라운지 등)

// 상태 배지
export type Status =
  | "recommended" // 강력 추천
  | "good" // 괜찮음
  | "revisit" // 재방문 의사
  | "mixed"; // 호불호 갈림

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

export interface VisitRecord {
  date?: string; // 방문/체류 시작일 (YYYY-MM 또는 YYYY-MM-DD)
  duration?: string; // 체류 기간 (예: "3박 4일", "2시간")
  note?: string; // 개인 코멘트 / 팁
}

export interface Place {
  id: string;
  name: string;
  category: Category;
  status: Status;
  lat: number;
  lng: number;
  address?: string;
  description: string; // 한 줄 ~ 짧은 설명
  photos: string[]; // 사진 URL 배열 (첫 번째가 대표)
  ratings: NomadRatings;
  priceLevel?: 1 | 2 | 3; // 가격대 (₩ ~ ₩₩₩)
  tags?: string[];
  links?: LinkRef[]; // 외부 URL / 지도 링크 / 접근 안내
  channels?: LinkRef[]; // 홍보 채널 (인스타, 블로그, 유튜브 등)
  visit?: VisitRecord;
}
