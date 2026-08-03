/** 소개·개인정보처리방침·이용약관·문의 네 페이지가 같이 쓰는 글 페이지 틀 */
export default function TextPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  /** 정책 문서에 시행일을 밝혀둡니다 (애드센스 심사에서 확인하는 항목입니다) */
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {updatedAt && <p className="mt-2 text-sm text-muted">시행일 {updatedAt}</p>}
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

/** 글 페이지 안의 한 덩어리 (제목 + 본문) */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="flex flex-col gap-3 leading-7 text-muted">{children}</div>
    </section>
  );
}
