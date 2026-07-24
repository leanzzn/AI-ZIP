type IconProps = { className?: string };

const icons: Record<string, (p: IconProps) => React.ReactNode> = {
  new: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  ),
  write: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16M6 16.5V20h3.5L20 9.5l-3.5-3.5L6 16.5Z" />
    </svg>
  ),
  study: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 8l10-5 10 5-10 5-10-5Zm4 2v6l6 3 6-3v-6" />
    </svg>
  ),
  code: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
    </svg>
  ),
  media: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5.5-5.5L7 19" />
    </svg>
  ),
  life: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  ),
};

const categories = [
  { key: "new", label: "오늘 새롭게 추가된 AI" },
  { key: "write", label: "문서 및 글쓰기" },
  { key: "study", label: "학업 및 연구" },
  { key: "code", label: "코딩 및 개발" },
  { key: "media", label: "이미지 및 영상" },
  { key: "life", label: "일상 및 생산성" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border px-3 py-6">
      <nav className="flex flex-col gap-1">
        {categories.map((c) => {
          const Icon = icons[c.key];
          return (
            <button
              key={c.key}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-border"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
