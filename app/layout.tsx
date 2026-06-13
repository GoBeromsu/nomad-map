import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "노마드 맵 · 디지털 노마드 장소 기록",
  description:
    "내가 직접 가본 카페·숙소·코워킹 스페이스를 디지털 노마드 관점에서 지도에 기록하고 공유합니다. 와이파이·콘센트·좌석·조용함·장기체류 적합도까지.",
  openGraph: {
    title: "노마드 맵 · 디지털 노마드 장소 기록",
    description:
      "디지털 노마드 관점에서 평가한 전 세계 카페·숙소·코워킹 스페이스 지도.",
    type: "website",
  },
};

// Anti-FOUC: applied synchronously before first paint.
// Reads "nm-theme" from localStorage; falls back to prefers-color-scheme;
// defaults to dark per ADR-002.
const themeScript = `(function(){try{var t=localStorage.getItem('nm-theme');if(t==='light'){}else if(t==='dark'){document.documentElement.classList.add('dark');}else{if(!window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.add('dark');}}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink transition-colors antialiased">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
