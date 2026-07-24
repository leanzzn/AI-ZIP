export default function Header() {
  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold tracking-tight">AI.ZIP</span>
        <p className="hidden text-sm text-muted sm:block">
          필요한 AI, 가장 빠르게 찾기
        </p>
        <div className="ml-auto w-full max-w-md">
          <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="shrink-0 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="AI 서비스 검색"
              className="w-full text-sm outline-none placeholder:text-muted"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
