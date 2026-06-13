#!/usr/bin/env node
/**
 * publish-place.mjs — 장소 퍼블리시 CLI 스크립트
 *
 * 사용법:
 *   node scripts/publish-place.mjs --place <place.json> [--photos a.jpg,b.jpg] [--dry-run]
 *
 * - place.json: photos/photoSources 제외한 완성된 장소 객체 (또는 photoSources 포함)
 * - --photos: 쉼표로 구분된 원본 사진 경로 목록 (place.json의 photoSources를 덮어씀)
 * - --dry-run: 파일 쓰기 없이 시뮬레이션만 수행
 *
 * 출력 (stdout 마지막 줄): JSON — { ok, id, photos, placesCount } or { ok:false, error }
 * 커밋 메시지 제안: feat(place): add <name> (<id>)
 */

import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname 대체 (ESM)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PLACES_JSON = path.join(REPO_ROOT, "data", "places.json");
const PUBLIC_PLACES = path.join(REPO_ROOT, "public", "places");

/** lib/types.ts Category 열거값 */
const VALID_CATEGORIES = new Set(["cafe", "accommodation", "restaurant", "recovery", "other"]);

/** lib/types.ts Status 열거값 */
const VALID_STATUSES = new Set(["recommended", "good", "bad"]);

/** lib/i18n/config.ts LOCALES */
const REQUIRED_LOCALES = ["ko", "en", "ja", "zh", "es", "fr", "de", "vi"];

// ─── 인수 파싱 ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { placeFile: null, photos: [], dryRun: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--place" && args[i + 1]) {
      result.placeFile = args[++i];
    } else if (args[i] === "--photos" && args[i + 1]) {
      result.photos = args[++i].split(",").map((p) => p.trim()).filter(Boolean);
    } else if (args[i] === "--dry-run") {
      result.dryRun = true;
    }
  }
  return result;
}

// ─── 유효성 검사 ──────────────────────────────────────────────────────────────

function validatePlace(place, existingIds) {
  const errors = [];

  // 필수 필드 존재 여부
  const requiredFields = ["id", "name", "category", "status", "lat", "lng", "description", "description_i18n", "ratings"];
  for (const field of requiredFields) {
    if (place[field] === undefined || place[field] === null) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }

  // id: 비어있지 않은 슬러그, 중복 없음
  if (place.id !== undefined) {
    if (typeof place.id !== "string" || place.id.trim() === "") {
      errors.push("id는 비어있지 않은 문자열이어야 합니다");
    } else if (existingIds.has(place.id)) {
      errors.push(`id "${place.id}" 가 data/places.json 에 이미 존재합니다 (중복 거부)`);
    }
  }

  // category 열거값 확인
  if (place.category && !VALID_CATEGORIES.has(place.category)) {
    errors.push(`category "${place.category}" 는 유효하지 않습니다. 허용값: ${[...VALID_CATEGORIES].join(", ")}`);
  }

  // status 열거값 확인
  if (place.status && !VALID_STATUSES.has(place.status)) {
    errors.push(`status "${place.status}" 는 유효하지 않습니다. 허용값: ${[...VALID_STATUSES].join(", ")}`);
  }

  // lat/lng 범위 확인
  if (place.lat !== undefined) {
    if (typeof place.lat !== "number" || !isFinite(place.lat) || place.lat < -90 || place.lat > 90) {
      errors.push(`lat "${place.lat}" 는 유효한 위도(-90~90)가 아닙니다`);
    }
  }
  if (place.lng !== undefined) {
    if (typeof place.lng !== "number" || !isFinite(place.lng) || place.lng < -180 || place.lng > 180) {
      errors.push(`lng "${place.lng}" 는 유효한 경도(-180~180)가 아닙니다`);
    }
  }

  // description_i18n: 8개 로케일 모두 필요
  if (place.description_i18n && typeof place.description_i18n === "object") {
    const missing = REQUIRED_LOCALES.filter((l) => !place.description_i18n[l]);
    if (missing.length > 0) {
      errors.push(`description_i18n에 다음 로케일이 누락되었습니다: ${missing.join(", ")}`);
    }
  } else if (place.description_i18n !== undefined) {
    errors.push("description_i18n은 객체여야 합니다");
  }

  // ratings 필드 확인
  if (place.ratings && typeof place.ratings === "object") {
    const ratingFields = ["wifi", "power", "seating", "quiet", "longStay"];
    for (const f of ratingFields) {
      const v = place.ratings[f];
      if (v === undefined || typeof v !== "number" || v < 1 || v > 5) {
        errors.push(`ratings.${f} 는 1~5 사이의 숫자여야 합니다 (현재: ${v})`);
      }
    }
  }

  return errors;
}

// ─── 이미지 처리 ──────────────────────────────────────────────────────────────

async function processPhotos(sourcePaths, placeId, dryRun) {
  if (sourcePaths.length === 0) return [];

  // sharp를 동적으로 임포트 (devDependency)
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error("sharp 모듈을 찾을 수 없습니다. `npm install` 을 실행하세요.");
  }

  if (!dryRun) {
    await mkdir(PUBLIC_PLACES, { recursive: true });
  }

  const repoPaths = [];

  for (let i = 0; i < sourcePaths.length; i++) {
    const src = sourcePaths[i];
    const n = i + 1;
    const outputFilename = `${placeId}-${n}.webp`;
    const outputPath = path.join(PUBLIC_PLACES, outputFilename);
    const repoRelativePath = `/places/${outputFilename}`;

    if (dryRun) {
      console.log(`[dry-run] 이미지 처리 예정: ${src} → ${outputPath}`);
      repoPaths.push(repoRelativePath);
      continue;
    }

    // 이미지 파이프라인:
    // 1. rotate(): EXIF 방향 자동 보정
    // 2. resize(): 최대 1600×1600, 비율 유지, 확대 없음
    // 3. webp({ quality: 82 }): WebP 변환 (sharp는 기본적으로 메타데이터 제거 — EXIF/GPS 개인정보 보호)
    await sharp(src)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    console.log(`이미지 처리 완료: ${src} → ${outputPath}`);
    repoPaths.push(repoRelativePath);
  }

  return repoPaths;
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (!args.placeFile) {
    const msg = "--place <place.json> 인수가 필요합니다";
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  // place.json 읽기
  let placeRaw;
  try {
    const content = await readFile(args.placeFile, "utf8");
    placeRaw = JSON.parse(content);
  } catch (err) {
    const msg = `place.json 읽기/파싱 실패: ${err.message}`;
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  // 기존 places.json 읽기
  let existingPlaces;
  try {
    const content = await readFile(PLACES_JSON, "utf8");
    existingPlaces = JSON.parse(content);
  } catch (err) {
    const msg = `data/places.json 읽기/파싱 실패: ${err.message}`;
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  const existingIds = new Set(existingPlaces.map((p) => p.id));

  // 사진 소스 경로 결정: --photos > place.json의 photoSources
  let photoSources = args.photos.length > 0
    ? args.photos
    : (Array.isArray(placeRaw.photoSources) ? placeRaw.photoSources : []);

  // place 객체 정리 (photoSources 제거 — 내부 필드, 결과물에 포함되면 안 됨)
  const place = { ...placeRaw };
  delete place.photoSources;
  delete place.photos; // 뒤에서 처리된 경로로 교체

  // 유효성 검사
  const errors = validatePlace(place, existingIds);
  if (errors.length > 0) {
    const msg = `장소 데이터 검증 실패:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  // 이미지 처리
  let processedPhotos;
  try {
    processedPhotos = await processPhotos(photoSources, place.id, args.dryRun);
  } catch (err) {
    const msg = `이미지 처리 실패: ${err.message}`;
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  // place.photos 설정
  place.photos = processedPhotos;

  if (args.dryRun) {
    console.log("\n[dry-run] 추가될 장소 객체:");
    console.log(JSON.stringify(place, null, 2));
    console.log(`\n[dry-run] data/places.json 에 추가될 예정 (총 ${existingPlaces.length + 1}개)`);
    console.log(`\n제안 커밋 메시지: feat(place): add ${place.name} (${place.id})`);
    console.log(
      JSON.stringify({
        ok: true,
        dryRun: true,
        id: place.id,
        photos: processedPhotos,
        placesCount: existingPlaces.length + 1,
      })
    );
    return;
  }

  // places.json 에 장소 추가
  const updatedPlaces = [...existingPlaces, place];
  const json = JSON.stringify(updatedPlaces, null, 2) + "\n";

  await writeFile(PLACES_JSON, json, "utf8");

  // 후 검증: 다시 읽어서 파싱 확인
  try {
    const reread = await readFile(PLACES_JSON, "utf8");
    JSON.parse(reread);
  } catch (err) {
    const msg = `쓰기 후 data/places.json 파싱 실패 (파일이 손상되었을 수 있음): ${err.message}`;
    console.error(msg);
    console.log(JSON.stringify({ ok: false, error: msg }));
    process.exitCode = 1;
    return;
  }

  console.log(`\n장소 추가 완료: ${place.id} (총 ${updatedPlaces.length}개)`);
  console.log(`제안 커밋 메시지: feat(place): add ${place.name} (${place.id})`);

  console.log(
    JSON.stringify({
      ok: true,
      id: place.id,
      photos: processedPhotos,
      placesCount: updatedPlaces.length,
    })
  );
}

main().catch((err) => {
  const msg = `예상치 못한 오류: ${err.message}`;
  console.error(msg);
  console.log(JSON.stringify({ ok: false, error: msg }));
  process.exitCode = 1;
});
