import Link from "next/link";

/**
 * 애드센스가 요구하는 "탐색하기 쉬운 구조" — 사이트 어디서든 소개·정책·문의로 갈 수 있어야 합니다.
 * 심사에서 이 링크들을 실제로 눌러봅니다.
 */
const LINKS = [
  { href: "/about", label: "소개" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted">
          AI.ZIP은 한국어로 쓸 수 있는 AI 서비스를 모아 소개하는 사이트입니다. 각 서비스는 해당 회사가 운영하며,
          AI.ZIP과는 관련이 없습니다.
        </p>
        <p className="text-sm text-muted">© {new Date().getFullYear()} AI.ZIP</p>
      </div>
    </footer>
  );
}
