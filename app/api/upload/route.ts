import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";

export const runtime = "nodejs";

// 허용 이미지 MIME (svg+xml 제외 — 스크립트 실행 가능하므로 stored XSS 방지)
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// 메모리 기반 레이트 리밋 (콜드스타트 시 초기화 — 영구 enforcement는 @upstash/ratelimit 사용).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failureLog = new Map<string, { count: number; resetAt: number }>();

function isBlocked(ip: string): boolean {
  const e = failureLog.get(ip);
  return !!e && Date.now() <= e.resetAt && e.count > MAX_FAILURES;
}
function recordFailure(ip: string): void {
  const now = Date.now();
  const e = failureLog.get(ip);
  if (!e || now > e.resetAt) failureLog.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else e.count += 1;
}

// 타이밍 공격 방지: 길이 불일치 시에도 timingSafeEqual을 한 번 호출해 시간 정규화.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

// 관리자 전용 사진 업로드.
// 인증: x-admin-password 헤더 == process.env.ADMIN_PASSWORD
// 저장: BLOB_READ_WRITE_TOKEN 이 있으면 Vercel Blob, 없으면 public/uploads (로컬 개발 전용)
export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "서버에 ADMIN_PASSWORD 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isBlocked(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." },
      { status: 429 },
    );
  }

  const provided = req.headers.get("x-admin-password") ?? "";
  if (!safeEqual(provided, adminPassword)) {
    recordFailure(ip);
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "지원하지 않는 형식입니다. (jpeg, png, webp, gif만 허용)" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 10MB 이하여야 합니다." },
      { status: 413 },
    );
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "-")
    .slice(0, 40);
  const suffix = `${file.size}-${ext}`;
  const filename = `places/${safeBase || "photo"}-${suffix}`;

  // Vercel Blob 경로
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, storage: "blob" });
  }

  // Vercel(read-only FS)에서는 로컬 폴백 불가 → 명시적 에러
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN 이 설정되지 않았습니다. Vercel 대시보드에서 Blob 스토어를 연결하세요.",
      },
      { status: 500 },
    );
  }

  // 로컬 개발 폴백: public/uploads
  const buf = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const localName = `${safeBase || "photo"}-${suffix}`;
  await writeFile(path.join(uploadsDir, localName), buf);
  return NextResponse.json({ url: `/uploads/${localName}`, storage: "local" });
}
