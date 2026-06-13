# 🧭 노마드 맵 (Nomad Map)

한국을 여행·체류하는 **디지털 노마드 관점**에서 내가 직접 가본 카페·숙소·코워킹 스페이스·식당을 지도에 기록하고 공유하는 사이트입니다.

- 🗺️ **카카오맵** 기반 지도에 장소 표시 (마커 클릭 → 상세)
- 📊 노마드 평가: **와이파이 · 콘센트 · 좌석 · 조용함 · 장기체류 적합도** (1~5)
- 🏷️ 분류(카페/숙소/코워킹/식당/기타) · 상태(강력추천/괜찮음/재방문/호불호) 필터 + 검색
- 🔗 각 장소의 외부 URL / 지도 링크 / 홍보 채널 / 방문 기록
- 📸 관리자 사진 업로드 (`/admin`), **일반 사용자는 읽기 전용**

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Kakao Maps JS SDK
- Vercel Blob (사진 저장) · Vercel 배포

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                  # http://localhost:3000
```

### 환경변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | ✅ | Kakao Developers의 **JavaScript 키**. 콘솔 `플랫폼 > Web`에 도메인 등록 필요 |
| `ADMIN_PASSWORD` | 업로드 시 | `/admin` 사진 업로드 인증 |
| `BLOB_READ_WRITE_TOKEN` | 선택 | Vercel Blob 토큰. 없으면 로컬 `public/uploads`에 저장 |

> Kakao 키는 콘솔의 **플랫폼 > Web 사이트 도메인**에 `http://localhost:3000` 과 배포 URL을 모두 등록해야 지도가 로드됩니다.

## 장소 추가 워크플로우

1. `/admin` 접속 → 관리자 비밀번호 입력
2. 사진 업로드(자동으로 Blob/로컬에 저장되고 URL 생성) → 정보 입력 → 지도 클릭으로 위치 지정
3. **"병합된 places.json 다운로드"** 또는 **"이 장소 JSON 복사"**
4. 결과를 `data/places.json` 에 반영하고 git 커밋 → Vercel 자동 배포

데이터는 레포의 `data/places.json` 하나가 단일 소스라서, 사용자에게는 항상 읽기 전용입니다.

## 배포 (Vercel)

```bash
npx vercel link            # 프로젝트 연결
npx vercel deploy          # 프리뷰
npx vercel deploy --prod   # 프로덕션
```

환경변수(`NEXT_PUBLIC_KAKAO_MAP_KEY`, `ADMIN_PASSWORD`)는 Vercel 대시보드 또는
`vercel env add` 로 등록하세요. Blob 스토어를 만들면 `BLOB_READ_WRITE_TOKEN`이 자동 주입됩니다.
