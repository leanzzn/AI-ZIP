type AiCardProps = {
  name: string;
  summary: string;
  isFree?: boolean;
  isKorean?: boolean;
};

export default function AiCard({ name, summary, isFree, isKorean }: AiCardProps) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-2 py-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-border" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{name}</span>
          {isFree && (
            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
              무료
            </span>
          )}
          {isKorean && (
            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
              한국어 지원
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted">{summary}</p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-muted"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </div>
  );
}
