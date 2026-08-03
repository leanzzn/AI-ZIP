export type PriceType = "무료" | "부분 무료" | "유료";

export type Service = {
  id: string;
  name: string;
  summary: string;
  category: string;
  priceType: PriceType;
  isKorean: boolean;
  /** 노션에서 주소를 아직 못 채운 툴은 빈 문자열. 화면에서 바로가기 버튼이 껍데기로 나옵니다 */
  websiteUrl: string;
  isNew?: boolean;
  /** 상세페이지에 들어가는 긴 소개글. 문단은 빈 줄로 나눕니다. 노션 "소개글" 칸에서 고칠 수 있습니다 */
  overview?: string;
  // 아래 네 가지는 손으로 정리한 24개에만 있습니다.
  // 수집기가 자동으로 모아온 툴은 비어 있고, 화면에서는 그 부분만 빠진 채로 보입니다.
  userCount?: number;
  needsSignup?: boolean;
  freeScope?: string;
  useCases?: string[];
};

/**
 * 목록 화면이 실제로 쓰는 항목만 추린 것.
 *
 * 목록은 클라이언트 컴포넌트(Feed)라서, 넘긴 값이 전부 HTML에 글자로 박혀 브라우저로 내려갑니다.
 * 예전엔 Service 를 통째로 넘기는 바람에 상세페이지용 긴 소개글까지 1,300개분이 같이 실려
 * 첫 화면이 2MB였습니다. 목록에 안 쓰는 건 빼서 내려보냅니다.
 */
export type ListItem = Pick<
  Service,
  "id" | "name" | "summary" | "category" | "priceType" | "isKorean" | "isNew"
>;

export function toListItem(s: Service): ListItem {
  return {
    id: s.id,
    name: s.name,
    summary: s.summary,
    category: s.category,
    priceType: s.priceType,
    isKorean: s.isKorean,
    isNew: s.isNew,
  };
}

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

/** 손으로 정리한 24개. 노션이 비어있거나 잠깐 안 될 때도 사이트가 비지 않게 항상 깔고 갑니다 */
const curated: Service[] = [
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

// ─────────────────────────────────────────────────────────────
// 긴 소개글 (상세페이지 본문)
// 손으로 정리한 툴의 초안입니다. 노션에 같은 이름의 줄이 있고 그 줄의 "소개글" 칸이 차 있으면
// 노션 쪽 글이 이깁니다 — 사장님이 노션에서 고치면 사이트에 바로 반영됩니다.
// ─────────────────────────────────────────────────────────────

const overviews: Record<string, string> = {
  chatgpt: `대화하듯 물어보면 답해주는 AI입니다. 궁금한 걸 그냥 물어봐도 되고, 글을 써달라고 하거나 긴 글을 짧게 줄여달라고 해도 됩니다. 파일을 올려서 내용을 물어보거나 그림을 만들어달라고 하는 것도 됩니다.

가장 많이 쓰이는 만큼 처음 AI를 써보는 분에게 무난합니다. 어떻게 물어봐야 할지 몰라도 대충 물어보면 알아서 정리해주는 편이라, 이메일 초안이나 보고서 뼈대를 잡을 때 특히 시간이 많이 줄어듭니다.

회원가입만 하면 대부분 기능을 무료로 쓸 수 있고, 가장 똑똑한 모델과 사용량 제한을 풀려면 유료 요금제가 필요합니다. 최신 정보나 숫자는 가끔 틀리게 답하니 중요한 건 한 번 확인하고 쓰세요.`,

  claude: `긴 글을 꼼꼼히 읽고 답하는 데 강한 AI입니다. 수십 장짜리 문서나 계약서를 통째로 넣고 "여기서 중요한 것만 뽑아줘", "이상한 조건 있는지 봐줘" 식으로 물어볼 수 있습니다.

글의 톤을 다듬거나, 쓰던 문장을 자연스럽게 고치는 일을 잘합니다. 답이 차분하고 과장이 적어서, 정확하게 정리된 문장이 필요할 때 쓰기 좋습니다. 코드를 다루는 데도 강한 편입니다.

하루 일정량은 무료로 쓸 수 있고, 더 많이 쓰려면 유료 요금제가 필요합니다. 한국어도 자연스럽게 됩니다.`,

  wrtn: `한국에서 만든 AI 서비스라 한국어 글이 특히 자연스럽습니다. 블로그 글, SNS 문구, 자기소개서처럼 한국어 결이 중요한 글을 쓸 때 어색한 번역투가 덜 나옵니다.

여러 AI를 한자리에서 무료로 써볼 수 있는 것도 장점입니다. 어떤 AI가 나한테 맞는지 모르겠을 때 여기서 이것저것 시켜보면 감이 잡힙니다.

대부분 기능이 무료입니다. 부담 없이 시작해보기에 가장 만만한 곳입니다.`,

  "notion-ai": `메모와 문서를 정리하는 노션 안에서 바로 쓰는 AI입니다. 적어둔 회의록을 그 자리에서 요약하거나, 항목만 적어둔 메모를 문장으로 풀어주는 식으로 씁니다.

이미 노션으로 업무를 정리하고 계신다면 따로 창을 옮길 필요가 없다는 게 가장 큽니다. 문서 안에서 바로 다듬고 이어 쓰기 때문에 옮겨 붙이는 수고가 없습니다.

노션 계정 안에서 일부 무료로 써보고, 그 이상은 유료입니다. 노션을 안 쓰신다면 굳이 이것부터 시작할 필요는 없습니다.`,

  jasper: `광고 문구나 상세페이지 카피처럼 '파는 글'을 대신 써주는 AI입니다. 상품 정보를 넣으면 여러 버전의 문구를 한 번에 뽑아줍니다.

브랜드 말투를 등록해두면 그 톤에 맞춰 계속 써주기 때문에, 여러 사람이 글을 써도 결이 흐트러지지 않습니다. 광고를 자주 돌리는 곳에서 많이 씁니다.

무료 체험 뒤에는 유료입니다. 한국어보다 영어 문구에 강해서, 국내 판매용이라면 뤼튼이나 ChatGPT 쪽이 더 편할 수 있습니다.`,

  perplexity: `물어보면 인터넷에서 찾아서 답해주고, 어디서 가져온 내용인지 출처 링크까지 같이 보여줍니다. 답만 툭 던지는 게 아니라 근거를 보여준다는 게 다른 AI와 가장 다른 점입니다.

그래서 최신 정보를 확인하거나, 자료 조사를 할 때 특히 쓸모가 있습니다. 답 아래 붙은 링크를 눌러 원문을 직접 확인할 수 있어서 잘못된 정보를 걸러내기 쉽습니다.

회원가입 없이도 기본 검색은 됩니다. 더 똑똑한 모델과 사용량 제한을 풀려면 유료 요금제가 필요합니다.`,

  elicit: `연구 주제를 넣으면 관련 논문을 모아서 표로 정리해주는 AI입니다. 어떤 논문이 무엇을 다뤘고 결론이 뭔지 한눈에 비교할 수 있게 줄 세워줍니다.

논문을 하나씩 열어보며 정리하던 일을 크게 줄여줍니다. 대학원생이나 연구자처럼 자료 조사 양이 많은 분에게 맞습니다.

월 일정량은 무료이고 그 이상은 유료입니다. 화면과 논문이 대부분 영어라 영어에 부담이 없어야 편합니다.`,

  scispace: `어려운 논문을 쉽게 풀어서 설명해주는 AI입니다. PDF를 올려놓고 모르는 문단을 드래그해서 "이게 무슨 말이야?"라고 물어보면 쉬운 말로 다시 설명해줍니다.

수식이나 전문 용어에서 막힐 때 특히 도움이 됩니다. 논문 전체를 다 읽지 않아도 필요한 부분만 이해하고 넘어갈 수 있습니다.

기본 기능은 무료입니다. 한국어로 물어봐도 어느 정도 통하지만 논문 자체는 영어인 경우가 대부분입니다.`,

  consensus: `"이거 진짜 효과 있어?" 같은 질문에 실제 논문을 근거로 답해주는 AI입니다. 여러 연구가 어느 쪽으로 기울어 있는지까지 보여줍니다.

건강, 식단, 운동처럼 말이 많이 갈리는 주제를 확인할 때 좋습니다. 인터넷 글 대신 연구 결과를 근거로 삼는다는 게 핵심입니다.

월 일정 질문까지 무료입니다. 답과 논문이 영어라 읽는 데 약간 품이 듭니다.`,

  "github-copilot": `코드를 짜는 중에 다음 줄을 알아서 채워주는 AI입니다. 개발 도구 안에 붙어서 동작하기 때문에 따로 창을 띄울 필요가 없습니다.

반복되는 코드나 익숙하지 않은 언어를 다룰 때 시간이 크게 줄어듭니다. 주석으로 "이런 걸 해줘"라고 적으면 그에 맞는 코드를 만들어주기도 합니다.

학생과 오픈소스 개발자는 무료이고, 그 외에는 월 구독입니다. 개발자용 도구라 코딩을 안 하신다면 필요하지 않습니다.`,

  cursor: `코드를 짜는 프로그램(편집기) 자체에 AI가 들어가 있는 도구입니다. "이 기능 추가해줘", "여기 버그 찾아줘"라고 말하면 파일을 직접 고쳐줍니다.

프로젝트 전체를 이해한 상태로 고쳐준다는 게 강점입니다. 여러 파일에 걸친 수정도 한 번에 처리해줘서 요즘 개발자들이 빠르게 옮겨가고 있습니다.

기본 기능은 무료이고 좋은 모델을 많이 쓰려면 유료입니다. 역시 개발자용 도구입니다.`,

  v0: `만들고 싶은 화면을 말로 설명하면 웹 화면을 만들어주는 AI입니다. "가격표 페이지 만들어줘"라고 하면 바로 보이는 결과와 함께 코드까지 줍니다.

디자인 시안을 빠르게 여러 개 뽑아볼 때 좋습니다. 마음에 안 들면 "더 심플하게" 같은 말로 계속 고쳐나갈 수 있습니다.

월 일정량은 무료입니다. 결과물이 코드라서, 그대로 쓰려면 개발을 아는 사람이 한 번 손봐야 합니다.`,

  replit: `설치 없이 브라우저에서 바로 코딩하고 결과를 확인할 수 있는 서비스입니다. AI가 옆에서 코드를 만들어주고 오류도 같이 봐줍니다.

만든 걸 그 자리에서 인터넷에 올릴 수 있어서, 간단한 도구나 페이지를 빠르게 만들어보기 좋습니다. 코딩을 처음 배우는 분들이 많이 씁니다.

기본은 무료이고 성능과 기능을 늘리려면 유료입니다.`,

  midjourney: `문장으로 설명하면 그림을 그려주는 AI 중에서 결과물의 분위기가 가장 좋다고 평가받는 서비스입니다. 광고 이미지나 콘셉트 그림처럼 '느낌'이 중요한 작업에 많이 씁니다.

같은 설명이라도 다른 그림 도구보다 완성도 있게 나오는 편이라, 그대로 써도 될 수준의 이미지가 자주 나옵니다.

무료 체험 없이 유료 구독입니다. 디스코드나 자체 웹사이트에서 쓰며, 설명은 영어로 넣는 편이 결과가 좋습니다.`,

  dalle: `글로 설명하면 그림으로 만들어주는 AI입니다. ChatGPT 안에서 대화하듯 "이런 그림 그려줘", "조금 더 밝게" 하며 고쳐나갈 수 있는 게 편합니다.

한국어로 설명해도 잘 알아듣기 때문에 처음 그림 AI를 써보는 분에게 부담이 적습니다. 블로그 삽화나 간단한 이미지 정도는 충분히 나옵니다.

ChatGPT 안에서 일부 무료로 쓸 수 있고, 많이 만들려면 유료 요금제가 필요합니다.`,

  "canva-ai": `디자인을 몰라도 카드뉴스, 포스터, 상세페이지를 만들 수 있는 도구입니다. 템플릿을 고르고 글자만 바꿔도 결과가 나옵니다.

여기에 AI 기능이 붙어서 글 몇 줄로 디자인 초안을 만들고, 사진 배경을 지우고, 문구까지 뽑아줍니다. 사장님 혼자 SNS나 상품 이미지를 만들어야 할 때 가장 실용적입니다.

기본 기능은 무료이고 고급 템플릿과 사진은 유료입니다. 한국어를 잘 지원합니다.`,

  runway: `짧은 영상을 만들고 다듬는 AI입니다. 글로 설명해서 영상을 만들거나, 찍어둔 영상에서 배경이나 특정 물체를 지울 수 있습니다.

전문 편집 프로그램 없이도 광고용 짧은 영상이나 시안을 만들어볼 수 있다는 게 장점입니다.

가입하면 무료 크레딧을 주고 다 쓰면 유료입니다. 영상 AI 특성상 원하는 장면이 한 번에 나오지 않아 여러 번 만들어봐야 합니다.`,

  leonardo: `고화질 그림을 만드는 AI입니다. 스타일을 세밀하게 고를 수 있어서 게임 캐릭터나 일러스트처럼 결이 정해진 그림을 만들 때 강합니다.

매일 무료 크레딧을 주기 때문에 돈을 안 쓰고도 꽤 많이 만들어볼 수 있습니다. 그림 AI를 연습해보기에 부담이 적습니다.

무료 크레딧을 넘겨 쓰려면 유료입니다. 설명은 영어로 넣는 편이 결과가 좋습니다.`,

  suno: `가사나 분위기만 알려주면 노래를 통째로 만들어주는 AI입니다. 반주는 물론이고 노래하는 목소리까지 같이 나옵니다.

행사 축가, 매장 배경음악, 선물용 노래처럼 재미있게 쓸 곳이 많습니다. 한국어 가사도 꽤 자연스럽게 불러줍니다.

하루 일정량은 무료입니다. 상업적으로 쓰려면 유료 요금제와 이용 조건을 확인하셔야 합니다.`,

  gemini: `구글이 만든 AI입니다. 검색, 지메일, 문서 같은 구글 서비스와 잘 붙어 있어서 이미 구글을 쓰고 계신다면 자연스럽게 이어집니다.

글뿐 아니라 사진이나 영상을 넣고 물어보는 것도 잘합니다. 유튜브 영상을 요약해달라고 하거나, 사진 속 글자를 읽어달라고 하는 식으로 쓸 수 있습니다.

기본 기능은 무료이고 좋은 모델은 유료입니다. 한국어를 잘 지원합니다.`,

  gamma: `주제만 넣으면 발표자료를 통째로 만들어주는 AI입니다. 슬라이드 구성, 문구, 이미지 배치까지 알아서 잡아줍니다.

빈 화면부터 PPT를 만드는 게 가장 오래 걸리는 일인데, 그 과정을 통째로 건너뜁니다. 초안을 받아서 내용만 고치면 되니 시간이 크게 줄어듭니다.

가입하면 무료 크레딧을 주고 그 이상은 유료입니다. 한국어로 만들어도 결과가 잘 나옵니다.`,

  "clova-note": `녹음한 음성을 글로 바꿔주는 네이버 서비스입니다. 회의나 인터뷰를 녹음해두면 누가 무슨 말을 했는지까지 나눠서 정리해줍니다.

한국어 인식이 정확한 편이라 회의록을 손으로 받아 적을 일이 거의 없어집니다. 녹음 파일을 올려도 되고 앱으로 바로 녹음해도 됩니다.

월 일정 시간까지 무료입니다. 사람 목소리가 겹치거나 잡음이 크면 정확도가 떨어집니다.`,

  grammarly: `영어 문장의 문법과 어색한 표현을 고쳐주는 AI입니다. 브라우저에 설치해두면 메일이나 문서를 쓰는 중에 바로 표시해줍니다.

영어 메일을 보내야 하는데 표현이 맞는지 자신이 없을 때 특히 유용합니다. 왜 고쳐야 하는지도 알려줘서 쓰다 보면 영어가 늘기도 합니다.

기본 교정은 무료이고 문장을 통째로 다듬어주는 기능은 유료입니다. 한국어 교정은 지원하지 않습니다.`,
};

for (const s of curated) s.overview = overviews[s.id];

// ─────────────────────────────────────────────────────────────
// 노션에서 읽어오기
// 수집기(워커)가 6시간마다 모아서 자정에 노션으로 보낸 툴들을 여기서 가져옵니다.
// ─────────────────────────────────────────────────────────────

/** 노션을 매 접속마다 부르면 느려서 1시간 동안은 갖고 있던 걸 씁니다 */
const CACHE_MS = 60 * 60 * 1000;
/** 워커가 재시작돼도 남는 캐시(KV)의 이름표 */
const CACHE_KEY = "notion-services";
const NOTION_VERSION = "2025-09-03";

let cache: { at: number; services: Service[] } | undefined;
let dataSourceId: string | undefined;

type NotionProp = {
  url?: string | null;
  checkbox?: boolean;
  select?: { name: string } | null;
  date?: { start: string } | null;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
};

async function notionFetch(path: string, body?: unknown) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`노션 조회 실패 ${res.status} ${await res.text()}`);
  return res.json();
}

/** 노션 페이지 한 장 → 화면에 쓰는 Service. 비어있는 항목은 비운 채로 둡니다 */
function toService(page: { id: string; properties: Record<string, NotionProp> }): Service | undefined {
  const p = page.properties;
  const name = p["이름"]?.title?.[0]?.plain_text?.trim();
  if (!name) return undefined; // 이름 없는 줄은 화면에 못 씁니다

  const 날짜 = p["날짜"]?.date?.start;
  const 하루전 = Date.now() - 24 * 60 * 60 * 1000;

  return {
    // 노션 페이지 id를 주소로 씁니다 (이름이 바뀌어도 링크가 안 깨집니다)
    id: page.id.replace(/-/g, ""),
    name,
    summary: p["Description"]?.rich_text?.[0]?.plain_text?.trim() ?? "",
    category: p["카테고리"]?.select?.name ?? "일상 및 생산성",
    priceType: (p["가격"]?.select?.name as PriceType) ?? "부분 무료",
    isKorean: p["한국어"]?.checkbox === true,
    websiteUrl: p["URL"]?.url ?? "",
    isNew: 날짜 !== undefined && 날짜 !== null && Date.parse(날짜) > 하루전,
    // 긴 글은 노션이 여러 조각으로 나눠서 주기 때문에 전부 이어 붙입니다
    overview: (p["소개글"]?.rich_text ?? []).map((t) => t.plain_text).join("").trim() || undefined,
  };
}

/**
 * 노션에서 읽어온 목록을 KV(클라우드플레어 저장소)에 1시간 보관합니다.
 *
 * 아래 `cache` 변수만 쓰던 때는 워커가 잠깐 쉬었다 깨어나면 캐시가 통째로 사라져서,
 * 그때 들어온 손님이 노션을 처음부터 다시 부르는 동안 10초를 기다렸습니다
 * (툴 1,300개면 노션에 14번, 3,500개면 35번 물어봐야 합니다).
 *
 * Cloudflare 기본 캐시(Cache API)를 먼저 써봤는데 workers.dev 주소에서는 통째로 무시됩니다.
 * KV는 주소와 상관없이 동작합니다. 저장은 1시간에 한 번뿐이라 무료 한도 안에서 넉넉합니다.
 *
 * ponytail: 캐시가 만료되는 순간에 손님이 여럿 몰리면 그만큼 노션을 동시에 부릅니다.
 *           실제로 문제가 되면 그때 자물쇠를 걸면 됩니다 (지금 트래픽에선 과합니다).
 */
async function fetchFromNotionCached(): Promise<Service[]> {
  const kv = await getKv();
  if (!kv) return fetchFromNotion(); // 로컬 개발 등 KV가 없는 곳

  try {
    const hit = await kv.get(CACHE_KEY, "json");
    if (Array.isArray(hit) && hit.length > 0) return hit as Service[];
  } catch {
    // 캐시가 깨져 있으면 그냥 새로 불러옵니다
  }

  const services = await fetchFromNotion();
  // 노션이 실패해서 빈 배열이 온 걸 저장해두면 한 시간 동안 사이트가 24개로 굳습니다
  if (services.length > 0) {
    try {
      await kv.put(CACHE_KEY, JSON.stringify(services), { expirationTtl: CACHE_MS / 1000 });
    } catch {
      // 저장에 실패해도 화면은 그대로 나갑니다
    }
  }
  return services;
}

type Kv = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

/** wrangler.jsonc 의 NOTION_CACHE 바인딩. 로컬(next dev)에서는 없어서 undefined 입니다 */
async function getKv(): Promise<Kv | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return (getCloudflareContext().env as unknown as { NOTION_CACHE?: Kv }).NOTION_CACHE;
  } catch {
    return undefined;
  }
}

/** 노션에 쌓인 툴 전부. 실패하면 빈 배열 — 노션이 죽어도 사이트는 24개로 계속 돕니다 */
async function fetchFromNotion(): Promise<Service[]> {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return [];

  try {
    if (!dataSourceId) {
      const db = (await notionFetch(`databases/${process.env.NOTION_DATABASE_ID}`)) as {
        data_sources?: { id: string }[];
      };
      dataSourceId = db.data_sources?.[0]?.id;
      if (!dataSourceId) return [];
    }

    const found: Service[] = [];
    let cursor: string | undefined;

    // 노션은 한 번에 100개까지만 주므로 끝까지 넘겨가며 받습니다
    do {
      const res = (await notionFetch(`data_sources/${dataSourceId}/query`, {
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ property: "날짜", direction: "descending" }],
      })) as { results: Parameters<typeof toService>[0][]; next_cursor: string | null; has_more: boolean };

      for (const page of res.results) {
        const s = toService(page);
        if (s) found.push(s);
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);

    return found;
  } catch (e) {
    console.error("노션에서 툴 목록을 못 가져왔습니다", e);
    return [];
  }
}

/**
 * 화면에 뿌릴 전체 목록 = 손으로 정리한 24개 + 노션에 쌓인 것.
 * 같은 툴이 양쪽에 있으면 손으로 정리한 쪽(설명이 더 자세함)을 씁니다.
 */
export async function getServices(): Promise<Service[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.services;

  const 노션 = await fetchFromNotionCached();

  // 같은 툴인지 알아보는 열쇠 = 이름과 주소. 노션은 "Canva", 여기는 "Canva AI" 처럼
  // 이름이 조금 달라도 주소가 같으면 같은 툴로 봅니다.
  const 열쇠 = (s: Service) =>
    [s.name.toLowerCase(), s.websiteUrl.replace(/\/+$/, "").toLowerCase()].filter(Boolean);

  const 이미있음 = new Set(curated.flatMap(열쇠));
  const 새로운것 = 노션.filter((s) => !열쇠(s).some((k) => 이미있음.has(k)));

  // 손으로 정리한 툴이라도 노션에 같은 줄이 있고 소개글이 차 있으면 노션 글을 씁니다
  // (사장님이 노션에서 고친 게 항상 이깁니다)
  const 노션소개 = new Map(노션.flatMap((s) => (s.overview ? 열쇠(s).map((k) => [k, s.overview!] as const) : [])));

  // 손으로 정리한 24개는 이용자 수 순, 새로 모아온 건 그 뒤에 최신순으로 붙습니다
  const services = [...curated]
    .sort((a, b) => (b.userCount ?? 0) - (a.userCount ?? 0))
    .map((s): Service => ({ ...s, overview: 열쇠(s).map((k) => 노션소개.get(k)).find(Boolean) ?? s.overview }))
    .concat(새로운것);

  cache = { at: Date.now(), services };
  return services;
}

export async function getService(id: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.id === id);
}

export async function getRelated(service: Service, limit = 3): Promise<Service[]> {
  return (await getServices())
    .filter((s) => s.category === service.category && s.id !== service.id)
    .slice(0, limit);
}
