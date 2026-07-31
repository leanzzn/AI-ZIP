import Link from "next/link";
import { notFound } from "next/navigation";
import AiCard from "@/components/AiCard";
import { getService, getRelated } from "@/lib/services";

// 노션에 새로 들어온 툴도 바로 열리게 (노션 조회는 1시간 캐시)
export const dynamic = "force-dynamic";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getService(id);
  if (!service) notFound();

  const related = await getRelated(service);

  return (
    <div className="px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        목록으로
      </Link>

      {/* 상단 */}
      <div className="mt-6 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-border text-2xl font-bold">
          {service.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
              {service.priceType}
            </span>
            {service.isKorean && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                한국어
              </span>
            )}
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {service.category}
            </span>
          </div>
        </div>
      </div>

      {/* 주소를 아직 못 찾은 툴은 버튼 자리만 남기고 눌리지 않게 둡니다 */}
      {service.websiteUrl ? (
        <a
          href={service.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-foreground px-5 py-3 font-bold transition-colors hover:bg-border"
        >
          웹사이트 바로가기
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      ) : (
        <button
          disabled
          className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-5 py-3 font-bold text-muted"
        >
          웹사이트 주소 준비 중
        </button>
      )}

      {/* 중단 — 아직 안 채워진 툴은 이 부분이 통째로 빠집니다 */}
      {service.useCases && service.useCases.length > 0 && (
      <section className="mt-10">
        <h2 className="mb-3 font-bold">이럴 때 쓰면 좋아요</h2>
        <ul className="flex flex-col gap-2">
          {service.useCases.map((u) => (
            <li key={u} className="flex gap-2 text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="mt-0.5 shrink-0">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

      <section className="mt-8 flex flex-col gap-2 rounded-xl border border-border px-4 py-4 text-sm">
        {/* 아직 안 채워진 항목은 "확인 중"으로 자리만 잡아둡니다 */}
        <div className="flex justify-between gap-4">
          <span className="text-muted">회원가입</span>
          <span className="font-bold">
            {service.needsSignup === undefined ? "확인 중" : service.needsSignup ? "필요" : "없이 사용 가능"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">무료 사용 범위</span>
          <span className="text-right font-bold">{service.freeScope || "확인 중"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">한국어 지원</span>
          <span className="font-bold">{service.isKorean ? "지원" : "미지원"}</span>
        </div>
      </section>

      {/* 하단 */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-bold">이런 AI는 어때요</h2>
          <div className="grid grid-cols-1 gap-3">
            {related.map((s) => (
              <AiCard key={s.id} {...s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
