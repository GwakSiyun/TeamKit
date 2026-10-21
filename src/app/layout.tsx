import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_KR } from "next/font/google";
import { APP_NAME } from "@/constants/app";
import { AuthProvider } from "@/features/auth/AuthProvider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 카카오톡 등 링크 미리보기의 이미지 주소를 절대 경로로 만들 때 쓰는 기준 주소
  metadataBase: new URL("https://teamkit.site"),
  title: APP_NAME,
  description: "개발팀의 할 일 · 회의록 · 일정을 한곳에서",
  openGraph: {
    siteName: APP_NAME,
    title: APP_NAME,
    description: "개발팀의 할 일 · 회의록 · 일정을 한곳에서. GitHub 커밋 · PR 로 진행상황이 자동 반영돼요.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
