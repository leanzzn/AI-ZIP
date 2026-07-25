export type PriceType = "무료" | "부분 무료" | "유료";

export type Service = {
  id: string;
  name: string;
  summary: string;
  category: string;
  priceType: PriceType;
  isKorean: boolean;
  websiteUrl: string;
  userCount: number;
  isNew?: boolean;
  needsSignup: boolean;
  freeScope: string;
  useCases: string[];
};

// 사이드바/칩 순서와 항상 일치시킬 것 (CLAUDE.md 기능 2)
export const CATEGORIES = [
  "문서 및 글쓰기",
  "학업 및 연구",
  "코딩 및 개발",
  "이미지 및 영상",
  "일상 및 생산성",
] as const;

// 필터 칩에 쓰는 값 (전체 + 오늘 추가 + 카테고리 5개)
export const FILTERS = ["전체", "오늘 새롭게 추가된 AI", ...CATEGORIES] as const;

const services: Service[] = [
  {
    id: "chatgpt", name: "ChatGPT", summary: "대화로 뭐든 물어보는 만능 AI",
    category: "문서 및 글쓰기", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://chatgpt.com", userCount: 1200000,
    needsSignup: true, freeScope: "무료로 대부분 기능 사용, 최신 모델은 유료",
    useCases: ["복잡한 걸 쉽게 설명받고 싶을 때", "이메일·보고서 초안을 빠르게 쓸 때", "아이디어가 막혔을 때 같이 생각할 때"],
  },
  {
    id: "claude", name: "Claude", summary: "긴 글도 꼼꼼히 읽고 답하는 AI",
    category: "문서 및 글쓰기", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://claude.ai", userCount: 620000,
    needsSignup: true, freeScope: "하루 일정량 무료, 그 이상은 유료",
    useCases: ["긴 문서를 요약하거나 검토할 때", "정확하고 차분한 답이 필요할 때", "글의 톤을 다듬고 싶을 때"],
  },
  {
    id: "wrtn", name: "뤼튼", summary: "한국어 글쓰기를 도와주는 AI",
    category: "문서 및 글쓰기", priceType: "무료", isKorean: true,
    websiteUrl: "https://wrtn.ai", userCount: 410000,
    needsSignup: true, freeScope: "대부분 기능 무료",
    useCases: ["한국어로 자연스러운 글이 필요할 때", "블로그·SNS 글을 빠르게 쓸 때", "여러 AI를 무료로 써보고 싶을 때"],
  },
  {
    id: "notion-ai", name: "Notion AI", summary: "메모하며 바로 요약해주는 AI",
    category: "문서 및 글쓰기", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://www.notion.so/product/ai", userCount: 330000,
    needsSignup: true, freeScope: "노션 안에서 일부 무료, 그 이상 유료",
    useCases: ["메모를 정리하고 요약할 때", "회의록을 깔끔하게 다듬을 때", "노션을 이미 쓰고 있을 때"],
  },
  {
    id: "jasper", name: "Jasper", summary: "마케팅 문구를 대신 써주는 AI",
    category: "문서 및 글쓰기", priceType: "유료", isKorean: false,
    websiteUrl: "https://www.jasper.ai", userCount: 90000,
    needsSignup: true, freeScope: "무료 체험 후 유료",
    useCases: ["광고·상세페이지 문구가 필요할 때", "브랜드 톤을 맞춰 쓰고 싶을 때", "많은 양의 카피를 빠르게 뽑을 때"],
  },

  {
    id: "perplexity", name: "Perplexity", summary: "출처까지 알려주는 검색 AI",
    category: "학업 및 연구", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://www.perplexity.ai", userCount: 540000, isNew: true,
    needsSignup: false, freeScope: "기본 검색 무료, 고급 기능 유료",
    useCases: ["믿을 만한 출처가 필요할 때", "최신 정보를 빠르게 찾을 때", "검색과 요약을 한 번에 하고 싶을 때"],
  },
  {
    id: "elicit", name: "Elicit", summary: "논문 찾고 정리해주는 AI",
    category: "학업 및 연구", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://elicit.com", userCount: 120000,
    needsSignup: true, freeScope: "월 일정량 무료",
    useCases: ["연구 주제로 논문을 모을 때", "논문 핵심을 표로 정리할 때", "레퍼런스 조사를 빠르게 할 때"],
  },
  {
    id: "scispace", name: "SciSpace", summary: "어려운 논문을 쉽게 풀어주는 AI",
    category: "학업 및 연구", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://scispace.com", userCount: 95000,
    needsSignup: true, freeScope: "기본 기능 무료",
    useCases: ["논문의 어려운 부분을 이해할 때", "수식·용어 설명이 필요할 때", "PDF에 바로 질문하고 싶을 때"],
  },
  {
    id: "consensus", name: "Consensus", summary: "논문 근거로 답해주는 AI",
    category: "학업 및 연구", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://consensus.app", userCount: 80000,
    needsSignup: true, freeScope: "월 일정 질문 무료",
    useCases: ["\"이게 진짜 효과 있나?\" 근거가 필요할 때", "연구로 검증된 답을 원할 때", "리포트에 인용할 근거를 찾을 때"],
  },

  {
    id: "github-copilot", name: "GitHub Copilot", summary: "코드를 대신 짜주는 AI",
    category: "코딩 및 개발", priceType: "유료", isKorean: false,
    websiteUrl: "https://github.com/features/copilot", userCount: 480000,
    needsSignup: true, freeScope: "학생·오픈소스 무료, 그 외 유료",
    useCases: ["반복되는 코드를 빠르게 채울 때", "익숙하지 않은 언어를 쓸 때", "함수를 자동으로 완성하고 싶을 때"],
  },
  {
    id: "cursor", name: "Cursor", summary: "코딩을 도와주는 편집기 AI",
    category: "코딩 및 개발", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://cursor.com", userCount: 360000, isNew: true,
    needsSignup: true, freeScope: "기본 무료, 고급 모델 유료",
    useCases: ["코드 전체를 이해하며 수정할 때", "말로 지시해 파일을 고칠 때", "버그를 함께 찾고 싶을 때"],
  },
  {
    id: "v0", name: "v0", summary: "말로 화면을 만들어주는 AI",
    category: "코딩 및 개발", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://v0.dev", userCount: 210000,
    needsSignup: true, freeScope: "월 일정량 무료",
    useCases: ["웹 화면 시안이 빠르게 필요할 때", "코드로 바로 쓸 결과를 원할 때", "디자인을 말로 설명해 만들 때"],
  },
  {
    id: "replit", name: "Replit", summary: "브라우저에서 바로 코딩하는 AI",
    category: "코딩 및 개발", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://replit.com", userCount: 180000,
    needsSignup: true, freeScope: "기본 무료, 확장 기능 유료",
    useCases: ["설치 없이 바로 코딩할 때", "만든 걸 바로 배포하고 싶을 때", "코딩을 처음 배울 때"],
  },

  {
    id: "midjourney", name: "Midjourney", summary: "상상을 그림으로 그려주는 AI",
    category: "이미지 및 영상", priceType: "유료", isKorean: false,
    websiteUrl: "https://www.midjourney.com", userCount: 700000,
    needsSignup: true, freeScope: "유료 구독제",
    useCases: ["감각적인 그림이 필요할 때", "콘셉트 이미지를 만들 때", "높은 퀄리티의 결과를 원할 때"],
  },
  {
    id: "dalle", name: "DALL·E", summary: "문장을 그림으로 만드는 AI",
    category: "이미지 및 영상", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://openai.com/dall-e-3", userCount: 450000,
    needsSignup: true, freeScope: "ChatGPT 안에서 일부 무료",
    useCases: ["글로 설명해 그림을 만들 때", "간단한 삽화가 필요할 때", "ChatGPT와 함께 쓰고 싶을 때"],
  },
  {
    id: "canva-ai", name: "Canva AI", summary: "디자인을 뚝딱 만들어주는 AI",
    category: "이미지 및 영상", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://www.canva.com", userCount: 520000,
    needsSignup: true, freeScope: "기본 무료, 고급 기능 유료",
    useCases: ["카드뉴스·포스터를 만들 때", "디자인을 몰라도 예쁘게 만들 때", "SNS 이미지를 빠르게 뽑을 때"],
  },
  {
    id: "runway", name: "Runway", summary: "영상을 만들고 편집하는 AI",
    category: "이미지 및 영상", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://runwayml.com", userCount: 240000,
    needsSignup: true, freeScope: "무료 크레딧 제공 후 유료",
    useCases: ["짧은 영상을 만들 때", "배경을 지우거나 바꿀 때", "영상 아이디어를 시험해볼 때"],
  },
  {
    id: "leonardo", name: "Leonardo", summary: "고화질 그림을 만드는 AI",
    category: "이미지 및 영상", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://leonardo.ai", userCount: 160000,
    needsSignup: true, freeScope: "매일 무료 크레딧 제공",
    useCases: ["게임·캐릭터 이미지를 만들 때", "무료로 많이 만들어보고 싶을 때", "스타일을 세밀하게 조절할 때"],
  },
  {
    id: "suno", name: "Suno", summary: "노래를 만들어주는 AI",
    category: "이미지 및 영상", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://suno.com", userCount: 300000, isNew: true,
    needsSignup: true, freeScope: "하루 일정량 무료",
    useCases: ["가사만 있어도 노래를 만들 때", "행사용 축가가 필요할 때", "취미로 음악을 만들어볼 때"],
  },

  {
    id: "gemini", name: "Gemini", summary: "구글이 만든 똑똑한 AI",
    category: "일상 및 생산성", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://gemini.google.com", userCount: 580000,
    needsSignup: true, freeScope: "기본 무료, 고급 모델 유료",
    useCases: ["구글 서비스와 함께 쓸 때", "이미지도 같이 이해시킬 때", "빠른 답이 필요할 때"],
  },
  {
    id: "gamma", name: "Gamma", summary: "발표자료를 자동으로 만드는 AI",
    category: "일상 및 생산성", priceType: "부분 무료", isKorean: true,
    websiteUrl: "https://gamma.app", userCount: 260000,
    needsSignup: true, freeScope: "무료 크레딧 제공 후 유료",
    useCases: ["PPT를 처음부터 만들기 귀찮을 때", "주제만 넣고 슬라이드를 뽑을 때", "발표자료를 빠르게 정리할 때"],
  },
  {
    id: "clova-note", name: "클로바노트", summary: "음성을 글로 바꿔주는 AI",
    category: "일상 및 생산성", priceType: "무료", isKorean: true,
    websiteUrl: "https://clovanote.naver.com", userCount: 340000,
    needsSignup: true, freeScope: "월 일정 시간 무료",
    useCases: ["회의를 자동으로 받아 적을 때", "인터뷰를 글로 정리할 때", "강의를 녹음해 복습할 때"],
  },
  {
    id: "grammarly", name: "Grammarly", summary: "영어 문법을 고쳐주는 AI",
    category: "일상 및 생산성", priceType: "부분 무료", isKorean: false,
    websiteUrl: "https://www.grammarly.com", userCount: 220000,
    needsSignup: true, freeScope: "기본 교정 무료, 고급 유료",
    useCases: ["영어 메일을 자연스럽게 고칠 때", "문법 실수를 줄이고 싶을 때", "영어 문서를 다듬을 때"],
  },
];

export function getServices(): Service[] {
  return [...services].sort((a, b) => b.userCount - a.userCount);
}

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function getRelated(service: Service, limit = 3): Service[] {
  return getServices()
    .filter((s) => s.category === service.category && s.id !== service.id)
    .slice(0, limit);
}
