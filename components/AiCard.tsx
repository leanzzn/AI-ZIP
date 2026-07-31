import Link from "next/link";
import type { Service } from "@/lib/services";

export default function AiCard({ id, name, summary, priceType, isKorean }: Service) {
  return (
    <Link
      href={`/service/${id}`}
      className="flex items-center gap-4 rounded-xl border border-border px-4 py-4 transition-colors hover:border-muted"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-border text-lg font-bold">
        {name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{name}</span>
          <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
            {priceType}
          </span>
          {isKorean && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              한국어
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted">{summary || "설명 준비 중"}</p>
      </div>
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-muted"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </Link>
  );
}
