import type { Metadata } from "next";
import Link from "next/link";

/**
 * 없는 주소로 들어왔을 때 보이는 화면.
 *
 * 애드센스 정책상 404처럼 콘텐츠가 없는 페이지에는 광고를 넣으면 안 됩니다.
 * 나중에 광고를 달더라도 이 파일에는 넣지 마세요.
 */
// 검색 결과에 404가 뜨지 않게 하는 noindex 표시는 Next.js가 알아서 넣어줍니다 (직접 넣으면 태그가 두 번 붙습니다)
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <div className="px-6 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-muted">
        주소가 바뀌었거나, 소개하던 서비스가 목록에서 내려갔을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-foreground px-5 py-3 font-bold transition-colors hover:bg-border"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        AI 목록으로 가기
      </Link>
    </div>
  );
}
