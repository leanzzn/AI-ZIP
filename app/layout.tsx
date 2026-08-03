import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  // 이 주소가 있어야 각 페이지의 canonical 주소가 완성됩니다 (중복 콘텐츠 방지)
  metadataBase: new URL(SITE_URL),
  title: {
    // 페이지마다 "소개 — AI.ZIP" 처럼 제목이 달라집니다.
    // 예전엔 50개 페이지가 전부 "AI.ZIP" 하나였습니다 (검색엔진이 중복으로 봅니다)
    default: `${SITE_NAME} — 필요한 AI를 가장 빠르게`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
