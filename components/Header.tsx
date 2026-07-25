import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          AI.ZIP
        </Link>
        <p className="hidden text-sm text-muted sm:block">
          필요한 AI, 가장 빠르게 찾기
        </p>
      </div>
    </header>
  );
}
