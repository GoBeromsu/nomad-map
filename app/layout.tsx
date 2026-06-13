import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata: Metadata = {
  title: "노마드 맵 · 한국 디지털 노마드 장소 기록",
  description:
    "내가 직접 가본 카페·숙소·코워킹 스페이스를 디지털 노마드 관점에서 지도에 기록하고 공유합니다. 와이파이·콘센트·좌석·조용함·장기체류 적합도까지.",
  openGraph: {
    title: "노마드 맵 · 한국 디지털 노마드 장소 기록",
    description:
      "디지털 노마드 관점에서 평가한 한국의 카페·숙소·코워킹 스페이스 지도.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
