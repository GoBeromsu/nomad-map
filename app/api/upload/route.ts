import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

// 관리자 전용 사진 업로드.
// 인증: x-admin-password 헤더 == process.env.ADMIN_PASSWORD
// 저장: BLOB_READ_WRITE_TOKEN 이 있으면 Vercel Blob, 없으면 public/uploads (로컬 개발)
export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "서버에 ADMIN_PASSWORD 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const provided = req.headers.get("x-admin-password");
  if (provided !== adminPassword) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "이미지 파일만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "-")
    .slice(0, 40);
  // 결정적 파일명 (Math.random 미사용): 크기+타입 기반 접미사
  const suffix = `${file.size}-${ext}`;
  const filename = `places/${safeBase || "photo"}-${suffix}`;

  // Vercel Blob 경로
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, storage: "blob" });
  }

  // 로컬 개발 폴백: public/uploads
  const buf = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const localName = `${safeBase || "photo"}-${suffix}`;
  await writeFile(path.join(uploadsDir, localName), buf);
  return NextResponse.json({ url: `/uploads/${localName}`, storage: "local" });
}
