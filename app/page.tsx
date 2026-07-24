import AiCard from "@/components/AiCard";

const placeholderItems = [
  { name: "서비스명 A", summary: "간결한 한 줄 요약 설명이 여기에 표시됩니다.", isFree: true, isKorean: true },
  { name: "서비스명 B", summary: "간결한 한 줄 요약 설명이 여기에 표시됩니다.", isFree: true, isKorean: false },
  { name: "서비스명 C", summary: "간결한 한 줄 요약 설명이 여기에 표시됩니다.", isKorean: true },
];

export default function Home() {
  return (
    <div className="px-6 py-6">
      <h1 className="mb-2 text-lg font-semibold">전체 AI 서비스</h1>
      <div>
        {placeholderItems.map((item) => (
          <AiCard key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}
