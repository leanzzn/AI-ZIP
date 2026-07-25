import Feed from "@/components/Feed";
import { getServices } from "@/lib/services";

export default function Home() {
  const services = getServices();
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
