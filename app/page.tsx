import Feed from "@/components/Feed";
import { getServices } from "@/lib/services";

// 노션에 새 툴이 쌓이면 바로 보이도록 접속할 때 만듭니다 (노션 조회는 1시간 캐시)
export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await getServices();
  return (
    <div className="px-6 py-12 md:py-16">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          필요한 AI를 가장 빠르게
        </h1>
        <p className="mt-3 text-muted">
          이름·설명으로 검색하거나 분야로 골라보세요
        </p>
      </div>
      <Feed services={services} />
    </div>
  );
}
