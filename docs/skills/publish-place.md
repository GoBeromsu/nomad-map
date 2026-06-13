# Skill: publish-place

외부 에이전트(Hermes/Sari)가 사용자 사진 + 최소 장소 정보를 받아 nomad-map 레포에 장소를 게시하는 워크플로우.

---

## 트리거

사용자가 사진과 함께 장소 등록 요청을 보낼 때:

- "이 카페 올려줘 [사진]"
- "여기 지도에 추가해줘 [사진 + 주소]"
- "노마드맵에 이 장소 넣어줘"

---

## 단계별 절차

### 1. 레포 준비

```bash
# 처음이면 클론, 이미 있으면 최신 상태로 pull
git clone https://github.com/GoBeromsu/nomad-map.git ~/nomad-map  # 최초 1회
cd ~/nomad-map && git pull origin main
npm install  # 의존성 설치 (sharp 포함)
```

### 2. 장소 데이터 구성

사용자 메시지에서 다음 정보를 추출·보완하여 **완전한 place 객체**를 작성한다.

**필수 작업:**

- **주소 → 좌표**: 주소를 지오코딩하여 `lat`, `lng` (소수점 6자리) 산출
- **카테고리 선택**: `cafe` / `accommodation` / `restaurant` / `recovery` / `other` 중 하나
- **상태 선택**: `recommended` / `good` / `bad` 중 하나
- **설명**: `description` (한국어 원문) + `description_i18n` (8개 로케일 **모두** 필수)
- **장소명**: `name` (한국어/원어) + `name_i18n` (8개 로케일)
- **코멘트**: `comment.note` (한국어) + `comment.note_i18n` (8개 로케일)
- **ratings**: wifi·power·seating·quiet·longStay 각 1–5점 (사용자 언급 없으면 합리적 기본값)
- **tags**: 장소 특성 태그 배열 (한국어 권장)
- **links**: 네이버지도·카카오맵·공식사이트 등 LinkRef 배열
- **channels**: 인스타·블로그·유튜브 등 LinkRef 배열

**8개 로케일**: `ko` `en` `ja` `zh` `es` `fr` `de` `vi`

### 3. place.json 파일 작성

`/tmp/place.json` 에 완성된 place 객체를 저장한다. `photos`/`photoSources` 필드는 제외하거나 `photoSources`로 경로를 지정할 수 있다.

```json
{
  "id": "도시-장소슬러그",
  "name": "장소 한국어명",
  "name_i18n": {
    "ko": "...", "en": "...", "ja": "...", "zh": "...",
    "es": "...", "fr": "...", "de": "...", "vi": "..."
  },
  "category": "cafe",
  "status": "recommended",
  "lat": 37.123456,
  "lng": 127.123456,
  "address": "...",
  "description": "한국어 설명",
  "description_i18n": {
    "ko": "...", "en": "...", "ja": "...", "zh": "...",
    "es": "...", "fr": "...", "de": "...", "vi": "..."
  },
  "ratings": { "wifi": 4, "power": 3, "seating": 4, "quiet": 3, "longStay": 4 },
  "tags": ["태그1", "태그2"],
  "links": [{ "label": "네이버지도", "url": "https://..." }],
  "channels": [],
  "comment": {
    "date": "YYYY-MM-DD",
    "duration": "2시간",
    "note": "한국어 코멘트",
    "note_i18n": {
      "ko": "...", "en": "...", "ja": "...", "zh": "...",
      "es": "...", "fr": "...", "de": "...", "vi": "..."
    }
  }
}
```

### 4. 스크립트 실행

```bash
cd ~/nomad-map

# 사진이 있는 경우
node scripts/publish-place.mjs \
  --place /tmp/place.json \
  --photos /tmp/photo1.jpg,/tmp/photo2.jpg

# 사진이 없는 경우
node scripts/publish-place.mjs --place /tmp/place.json

# 먼저 확인만 하려면 (파일 쓰기 없음)
node scripts/publish-place.mjs --place /tmp/place.json --photos /tmp/photo1.jpg --dry-run
```

### 5. 출력 확인

스크립트 stdout 마지막 줄이 JSON이다:

```json
{ "ok": true, "id": "도시-장소슬러그", "photos": ["/places/...webp"], "placesCount": 12 }
```

`ok: false` 이면 `error` 필드를 읽고 수정 후 재실행. 주요 오류:
- 중복 id → id 변경
- description_i18n 로케일 누락 → 해당 로케일 추가
- ratings 범위 오류 → 1–5 사이 값으로 수정

### 6. Git 커밋 & 푸시

```bash
cd ~/nomad-map
git add data/places.json public/places/
git commit -m "feat(place): add <장소명> (<id>)"
git push origin main
```

푸시하면 Vercel이 자동 배포를 시작한다.

### 7. 완료 응답

사용자에게 답변:

```
✅ [장소명] 이 노마드맵에 추가되었습니다!
🌐 https://nomad-map.vercel.app
ID: <id>
```

---

## 개인정보 보호 규칙 (HARD RULES — 반드시 준수)

> **이 규칙을 위반하면 게시를 중단하고 사용자에게 수정을 요청해야 한다.**

**(a) 실명·개인식별정보 금지**
description, description_i18n, comment, note_i18n, address, 태그, 커밋 메시지 **어디에도** 실존하는 개인의 이름이나 개인식별정보를 포함하지 않는다.
- 허용: 공개 사업체·브랜드명, 공공장소의 공개 건축가/예술가 크레딧
- 금지: 동행자, 지인, 호스트, 직원, 지인의 이름 또는 닉네임

**(b) 관계·개인 정보 금지**
연인, 커플, 동반자, 개인적 관계에 대한 언급은 모든 필드에서 제외한다.

**(c) 사진 규칙**
- 사용자가 명시적으로 제공한 사진만 처리한다
- 이미지 파이프라인이 EXIF/GPS를 자동 제거하므로 별도 처리 불필요
- 식별 가능한 일반인의 얼굴이 담긴 사진은 게시하지 않는다

---

## Place 객체 스키마 참고

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | 고유 슬러그 (예: `서울-블루보틀-삼청`) |
| `name` | string | ✅ | 한국어/원어 장소명 |
| `name_i18n` | LocaleMap | 권장 | 8개 로케일 장소명 |
| `category` | Category | ✅ | `cafe`/`accommodation`/`restaurant`/`recovery`/`other` |
| `status` | Status | ✅ | `recommended`/`good`/`bad` |
| `lat` | number | ✅ | 위도 (-90~90) |
| `lng` | number | ✅ | 경도 (-180~180) |
| `address` | string | 선택 | 도로명 주소 |
| `description` | string | ✅ | 한국어 한 줄~짧은 설명 |
| `description_i18n` | LocaleMap | ✅ | 8개 로케일 모두 필수 |
| `photos` | string[] | — | 스크립트가 자동 설정 (`/places/<id>-N.webp`) |
| `ratings` | NomadRatings | ✅ | wifi·power·seating·quiet·longStay 각 1–5 |
| `tags` | string[] | 선택 | 검색·필터용 태그 |
| `links` | LinkRef[] | 선택 | 외부 URL (지도, 공식사이트 등) |
| `channels` | LinkRef[] | 선택 | 홍보 채널 (인스타, 블로그 등) |
| `comment` | Comment | 선택 | 방문 코멘트 (date, duration, note, note_i18n) |

---

## 완성 예시 (가상 카페)

```json
{
  "id": "서울-노마드카페-합정",
  "name": "노마드카페 합정점",
  "name_i18n": {
    "ko": "노마드카페 합정점",
    "en": "Nomad Cafe Hapjeong",
    "ja": "ノマドカフェ 合井店",
    "zh": "游牧咖啡 合井店",
    "es": "Nomad Café Hapjeong",
    "fr": "Nomad Café Hapjeong",
    "de": "Nomad Café Hapjeong",
    "vi": "Nomad Café Hapjeong"
  },
  "category": "cafe",
  "status": "recommended",
  "lat": 37.549012,
  "lng": 126.913456,
  "address": "서울특별시 마포구 합정동",
  "description": "합정역 도보 5분, 2층 창가 좌석이 넓고 조용해 장시간 작업에 최적인 카페. 콘센트가 모든 좌석에 있고 와이파이가 안정적이다.",
  "description_i18n": {
    "ko": "합정역 도보 5분, 2층 창가 좌석이 넓고 조용해 장시간 작업에 최적인 카페. 콘센트가 모든 좌석에 있고 와이파이가 안정적이다.",
    "en": "5 minutes from Hapjeong station, the second-floor window seats are spacious and quiet — ideal for long work sessions. Every seat has an outlet and the WiFi is reliable.",
    "ja": "合井駅から徒歩5分、2階の窓側席は広くて静かで長時間作業に最適なカフェ。全席にコンセントがありWi-Fiも安定している。",
    "zh": "距合井站步行5分钟，二楼靠窗座位宽敞安静，非常适合长时间工作。每个座位都有插座，WiFi稳定。",
    "es": "A 5 minutos de la estación Hapjeong, los asientos junto a la ventana del segundo piso son amplios y silenciosos, ideales para trabajar durante horas. Todos los asientos tienen enchufe y el WiFi es estable.",
    "fr": "À 5 minutes de la station Hapjeong, les sièges côté fenêtre du deuxième étage sont spacieux et calmes — idéaux pour de longues sessions de travail. Chaque siège dispose d'une prise et le WiFi est fiable.",
    "de": "5 Minuten vom Bahnhof Hapjeong entfernt, die Fensterplätze im zweiten Stock sind geräumig und ruhig — ideal für lange Arbeitssitzungen. Jeder Platz hat eine Steckdose und das WLAN ist zuverlässig.",
    "vi": "Cách ga Hapjeong 5 phút đi bộ, ghế cạnh cửa sổ tầng 2 rộng rãi và yên tĩnh — lý tưởng cho các buổi làm việc dài. Mỗi chỗ ngồi đều có ổ cắm và WiFi ổn định."
  },
  "photos": ["/places/서울-노마드카페-합정-1.webp"],
  "ratings": {
    "wifi": 5,
    "power": 5,
    "seating": 4,
    "quiet": 4,
    "longStay": 5
  },
  "tags": ["합정", "카페", "노트북", "콘센트", "와이파이", "2층창가"],
  "links": [
    { "label": "네이버지도", "url": "https://map.naver.com/p/entry/place/12345678" }
  ],
  "channels": [
    { "label": "인스타그램", "url": "https://instagram.com/nomadcafe.hapjeong" }
  ],
  "comment": {
    "date": "2026-06-10",
    "duration": "3시간",
    "note": "오후 2시~5시 방문. 2층 창가 자리에서 작업. 조용하고 콘센트 여유 있음.",
    "note_i18n": {
      "ko": "오후 2시~5시 방문. 2층 창가 자리에서 작업. 조용하고 콘센트 여유 있음.",
      "en": "Visited 2–5 PM. Worked at a second-floor window seat. Quiet with plenty of outlets.",
      "ja": "午後2時〜5時に訪問。2階窓側席で作業。静かでコンセントに余裕あり。",
      "zh": "下午2点至5点到访。在二楼靠窗座位工作。安静，插座充足。",
      "es": "Visita de 14:00 a 17:00. Trabajé en un asiento junto a la ventana del segundo piso. Tranquilo y con muchos enchufes.",
      "fr": "Visite de 14h à 17h. Travaillé à un siège côté fenêtre au deuxième étage. Calme avec beaucoup de prises.",
      "de": "Besuch von 14–17 Uhr. An einem Fensterplatz im zweiten Stock gearbeitet. Ruhig mit ausreichend Steckdosen.",
      "vi": "Đến từ 2–5 giờ chiều. Làm việc ở chỗ ngồi cạnh cửa sổ tầng 2. Yên tĩnh, nhiều ổ cắm."
    }
  }
}
```

---

## 이미지 처리 파이프라인 (자동)

스크립트가 자동 처리:
1. `sharp(src).rotate()` — EXIF 방향 자동 보정
2. `.resize({ width:1600, height:1600, fit:'inside', withoutEnlargement:true })` — 최대 1600×1600, 비율 유지
3. `.webp({ quality:82 })` — WebP 변환
4. **EXIF/GPS 완전 제거** (sharp 기본 동작 — 별도 설정 불필요)
5. `public/places/<id>-<n>.webp` 로 저장
6. `place.photos = ["/places/<id>-1.webp", ...]` 자동 설정

---

## 비밀값(Secrets) 관련

이 워크플로우는 앱 시크릿 없이 동작한다.
- 이미지는 레포 내 `public/places/` 에 저장 (Vercel Blob 미사용)
- 배포는 호스트의 기존 GitHub push 권한으로 Vercel 자동 배포 트리거
- 별도 토큰/시크릿 불필요 — 호스트의 git 인증만 있으면 됨
- 시크릿은 절대 레포에 커밋하지 않는다
