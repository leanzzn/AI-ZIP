"use client";

import { useState } from "react";
import AiCard from "@/components/AiCard";
import { FILTERS, type ListItem } from "@/lib/services";

/**
 * 처음에 그려놓을 카드 수. 1,300개를 한꺼번에 그리면 첫 화면 용량이 2MB가 돼서
 * 폰에서 한참 기다려야 합니다. 나머지는 "더 보기"를 누를 때 붙입니다.
 */
const 처음보여줄개수 = 60;

export default function Feed({ services }: { services: ListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("전체");
  const [보여줄개수, set보여줄개수] = useState(처음보여줄개수);

  const q = query.trim();
  const results = services.filter((s) => {
    const byFilter =
      filter === "전체" ||
      (filter === "오늘 새롭게 추가된 AI" ? s.isNew : s.category === filter);
    const byQuery =
      q === "" || s.name.includes(q) || s.summary.includes(q);
    return byFilter && byQuery;
  });

  return (
    <>
      {/* 검색 (히어로) */}
      <div className="mx-auto mb-8 max-w-xl">
        <div className="flex items-center gap-3 rounded-full border border-border px-5 py-3 transition-colors focus-within:border-muted">
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              set보여줄개수(처음보여줄개수); // 검색어가 바뀌면 처음부터 다시 보여줍니다
            }}
            placeholder="어떤 AI가 필요하세요?"
            aria-label="AI 서비스 검색"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                set보여줄개수(처음보여줄개수);
              }}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active
                  ? "border-foreground font-bold text-foreground"
                  : "border-border text-muted hover:border-muted"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* 결과 */}
      {results.length === 0 ? (
        <p className="py-16 text-center text-muted">
          찾는 AI가 없어요. 다른 말로 검색해보세요
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {results.slice(0, 보여줄개수).map((s) => (
              <AiCard key={s.id} {...s} />
            ))}
          </div>

          {보여줄개수 < results.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => set보여줄개수((n) => n + 처음보여줄개수)}
                className="cursor-pointer rounded-full border border-border px-6 py-2 text-sm text-muted transition-colors hover:border-muted"
              >
                더 보기
              </button>
              <p className="mt-3 text-sm text-muted">
                {results.length}개 중 {보여줄개수}개
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
