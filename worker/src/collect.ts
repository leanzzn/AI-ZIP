import { findExistingValues } from "./notion.ts";
import type { CollectedItem, Env } from "./notion.ts";
import { findStagedTitles } from "./staging.ts";

/**
 * 네이버 블로그에서 이 검색어들로 글을 긁어옵니다.
 * 새로 나온 툴을 잡으려고 최신순(sort=date)을 씁니다.
 * 예전에 검색어가 "AI 툴 추천" 처럼 뭉뚱그려져 있을 땐 최신순이 엉뚱한 글을 물어왔는데,
 * 아래처럼 검색어를 좁게 잡고 제목에 AI 단어가 없으면 안 여는 필터가 있어서 지금은 괜찮습니다.
 */
const KEYWORDS = [
  // 신규·트렌드
  "신규 AI 서비스 추천",
  "요즘 뜨는 AI 툴",
  "무료 생성형 AI 사이트",
  "국내 AI SaaS 출시",
  // 글쓰기·번역
  "논문 요약 AI 툴",
  "AI 영문 문법 교정 서비스",
  "글쓰기 보조 AI 추천",
  "영문 이메일 작성 AI",
  // 개발
  "개발자 코딩 보조 AI",
  "파이썬 코딩 AI 서비스",
  "백엔드 개발 생산성 AI",
  "깃허브 AI 툴 추천",
  // 업무 자동화
  "업무 자동화 AI SaaS",
  "노션 연동 AI 툴",
  "PPT 기획 AI 서비스",
  "데이터 분석 AI 사이트",
];

/** 한 번 돌 때 쓸 검색어 개수. 16개를 다 돌리면 아래 호출 예산을 넘깁니다 */
const KEYWORDS_PER_RUN = 4;

/**
 * Product Hunt(해외 신제품 사이트)에서 가져올 분야.
 *
 * 위 네이버 검색어 4묶음(신규·트렌드 / 글쓰기 / 개발 / 업무 자동화)을 그대로 옮긴 것입니다.
 * Product Hunt V2는 "검색어로 프로덕트 찾기"를 지원하지 않고 분야(topic) 단위로만 골라낼 수 있어서,
 * 한글 검색어를 그대로 넘길 수 없어 같은 뜻의 분야 이름으로 바꿔 적었습니다.
 */
const PH_TOPICS = [
  "artificial-intelligence", // 신규·트렌드
  "writing", // 글쓰기·번역
  "developer-tools", // 개발
  "productivity", // 업무 자동화
];

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

/**
 * 디스콰이엇(disquiet.io) — 국내 개발자·창업자들이 만든 서비스를 올리는 곳.
 *
 * 공식 API가 없어서 화면(HTML)을 그대로 읽습니다. 다행히 Rails로 만든 사이트라
 * 목록도 상세도 서버에서 완성된 채로 내려옵니다 — 브라우저를 띄울 필요 없이 글자만 뽑으면 됩니다.
 * (robots.txt가 누구에게나 열려 있고, 우리는 원문 링크를 Source에 그대로 달아 보냅니다)
 *
 * 여기서 오는 툴은 설명이 처음부터 한국어라, 상세페이지에 실을 긴 소개글을 가장 잘 건집니다.
 */
const DQ_LIST_URL = "https://disquiet.io/products";
/**
 * 한 번 돌 때 상세 페이지까지 열어볼 최대 개수 (호출 예산).
 * 실적이 가장 좋은 곳이라 네이버·Product Hunt에서 아낀 호출을 여기로 몰았습니다 (6 → 8).
 */
const MAX_DQ_ITEMS = 8;
/** 누가 긁어가는지 사이트 쪽에서 알아볼 수 있게 우리를 밝힙니다 (디스콰이엇·해커뉴스 공용) */
const BOT_UA = "AI-ZIP-bot/1.0 (+https://ai-zip.lhj106147.workers.dev)";
/** 한 곳이 응답을 안 해도 6시간 수집 전체가 매달려 있지 않도록 */
const FETCH_TIMEOUT_MS = 8000;

/**
 * 해커뉴스 Show HN — 해외 개발자·창업자가 자기가 만든 걸 직접 올리는 곳.
 *
 * 공식 Firebase API 대신 Algolia 검색 API를 씁니다. 키가 필요 없고,
 * Firebase는 글 하나당 한 번씩 불러야 해서 (목록 1 + 글 50) 호출 예산이 남아나지 않습니다.
 * 여기는 한 번의 호출로 최신 Show HN 목록이 본문까지 통째로 옵니다.
 */
const HN_ENDPOINT = "https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=50";
/**
 * 한 번 돌 때 판정까지 돌릴 최대 개수.
 * 여기만 개수를 늘려도 바깥 호출이 안 늘어납니다 — 목록 한 번에 본문까지 다 딸려오기 때문입니다.
 * (디스콰이엇은 한 건당 상세 1번, Product Hunt는 한 건당 주소 펴기 1번이 더 듭니다)
 * 그래서 넉넉히 잡습니다. 늘어나는 건 판정 묶음 하나 정도입니다.
 */
const MAX_HN_ITEMS = 8;
/** 한 번 돌 때 볼 분야 개수 (네이버처럼 매번 무작위로 바꿔 가며 봅니다) */
const PH_TOPICS_PER_RUN = 2;
/** 분야당 가져올 프로덕트 개수 */
const PH_POSTS_PER_TOPIC = 8;
/** 분야를 안 가리고 표를 많이 받은 순으로도 가져옵니다 (신생 인기 툴이 여기 많이 뜹니다) */
const PH_RANKING_COUNT = 10;
/** 한 번에 판정까지 돌릴 해외 프로덕트 최대 개수. 실적이 가장 나빠서 4 → 3 */
const MAX_PH_ITEMS = 3;
/** 며칠치를 볼지. 6시간치만 보면 하루에 몇 개 안 올라와서 거의 빈손으로 돌아옵니다 */
const PH_LOOKBACK_HOURS = 24;

/**
 * 수집처마다 부르는 주기를 다르게 하는 스위치.
 * 크론이 6시간마다 도니까 1이면 매번(6시간), 2면 12시간, 4면 하루 한 번입니다.
 *
 * 보관함 실적을 재보고 정한 값입니다 (2026-08-03 기준, 수동 시드 22건 제외한 19건):
 *   디스콰이엇  4건 — 주소 4/4, 소개글 4/4 ... 호출 하나당 0.57건  ← 가장 알짜
 *   네이버블로그 10건 — 주소 10/10, 소개글 7/10 ... 호출 하나당 0.23건 (예산의 절반을 씀)
 *   Product Hunt 5건 — 주소 0/5, 소개글 2/5 ... 주소를 하나도 못 폈습니다  ← 가장 부실
 * 그래서 Product Hunt만 12시간에 한 번으로 줄이고, 아낀 호출을 디스콰이엇에 옮겼습니다.
 * 나중에 순위가 바뀌면 아래 숫자만 고치면 됩니다.
 */
const EVERY_PH = 2;

export function isTurn(everyNth: number, now = new Date()): boolean {
  return Math.floor(now.getUTCHours() / 6) % everyNth === 0;
}

/**
 * 검색어 16개 중에서 매번 무작위로 몇 개만 뽑습니다.
 * 6시간마다 다른 검색어가 걸리니 하루면 대부분 한 번씩 돕니다.
 */
export function pickKeywords(n = KEYWORDS_PER_RUN, pool = KEYWORDS): string[] {
  return pool
    .map((q) => ({ q, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, n)
    .map(({ q }) => q);
}

// llama-3-8b-instruct는 2026-05-30 종료. 후속 모델로 교체
/** 글에서 툴 이름·설명 뽑기용. 입력이 길어서 가벼운 모델을 씁니다 */
const EXTRACT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
/** 품질 판정용. 8B는 Claude·Gemini까지 REJECT해서 큰 모델을 씁니다 (하루 몇 번 안 부름) */
const JUDGE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

/**
 * 워커는 요청 1건당 바깥 호출을 50번까지만 할 수 있습니다 (AI 호출도 한 번에 하나씩 셉니다).
 * 최악의 경우 예산:
 *
 *   네이버 검색        4     노션 조회        4
 *   블로그 열기        4     툴 추출(AI)      4
 *   주소 찾기          6     Product Hunt     1 + 주소 펴기 3 (12시간마다)
 *   디스콰이엇 목록    1     디스콰이엇 상세  8
 *   해커뉴스           1  ← Algolia는 목록 한 번에 본문까지 다 옵니다 (글마다 열 필요 없음)
 *   품질 판정(AI)      5  ← 후보 25개를 5개씩 묶어서 물어보기 때문에 5번이면 끝납니다
 *   ------------------------------------------------------------
 *   합계 41 (Product Hunt를 건너뛰는 차례엔 37)
 *
 * 네이버가 예산의 절반(18)을 쓰면서 건지는 양은 디스콰이엇과 비슷했습니다. 그래서 블로그 쪽을
 * 조금 줄이고(글 5→4, 주소 찾기 8→6) 그만큼을 실적 좋은 디스콰이엇·해커뉴스로 옮겼습니다.
 *
 * 판정을 하나씩 물어보던 때는 이 자리에서만 18번을 썼습니다. 묶음 판정으로 14번을 벌었고,
 * 그 덕에 아래 숫자들을 올릴 수 있었습니다.
 * D1 조회(보관함 중복 확인)는 바깥 호출이 아니라 이 예산에 안 들어갑니다.
 * (노션 조회는 데이터 소스 id를 캐시해서 실제로는 더 적습니다. 노션 저장은 자정 배치로 빠졌습니다)
 * ponytail: 유료 플랜(1000개)으로 올리면 아래 숫자만 키우면 됨.
 */
const MAX_POSTS = 4;
/** 글 하나에서 뽑을 AI 툴 최대 개수 */
const MAX_TOOLS_PER_POST = 3;
/** 블로그에서 뽑은 것 중 주소 확인 + 품질 판정까지 돌릴 최대 개수. 한 건당 호출 1번이라 8 → 6 */
const MAX_CANDIDATES = 6;

/** 제목에 이 중 하나도 없으면 AI 얘기가 아니라고 보고 글을 열지 않습니다 */
const AI_KEYWORD = /(\bAI\b|A\.I|인공지능|생성형|챗봇|GPT|LLM|클로드|제미나이|미드저니|딥러닝)/i;

/** 웹사이트 사이드바/칩과 순서·글자까지 똑같아야 합니다 (lib/services.ts의 CATEGORIES) */
export const CATEGORIES = [
  "문서 및 글쓰기",
  "학업 및 연구",
  "코딩 및 개발",
  "이미지 및 영상",
  "일상 및 생산성",
] as const;

export const PRICE_TYPES = ["무료", "부분 무료", "유료"] as const;

/**
 * 판정 기준. '광고성 글' 조건은 사장님 요청으로 뺐습니다 —
 * 홍보성 어투 때문에 클로드·제미나이까지 걸러지던 문제도 같이 없어집니다.
 *
 * 실을지 말지(PASS/REJECT)와 분야·가격·한국어를 한 번에 물어봅니다.
 * 따로 물어보면 AI 호출이 두 배가 되는데, 어차피 같은 정보를 보고 판단하는 일이라 한 번이면 충분합니다.
 */
const JUDGE_PROMPT =
  "너는 AI 서비스 디렉토리의 편집자야. 아래에 서비스 여러 개가 [번호]와 함께 들어와.\n" +
  "하나하나 디렉토리에 실을지 판단하고, 싣는다면 분류까지 해줘.\n" +
  "- 자체적인 기술력이나 독창적인 가치가 있는 서비스, 또는 많은 사람이 실제로 쓰는 알려진 서비스 → PASS\n" +
  "- 단순히 ChatGPT API만 연결한 래퍼(Wrapper) 서비스, 실체가 불분명한 서비스, " +
  "그리고 애초에 AI 서비스가 아닌 것(쇼핑몰, 크라우드펀딩, 뉴스, 블로그 등) → REJECT\n" +
  "- 아직 안 나온 서비스(출시 예정, 사전 예약, 대기명단만 받는 중) → REJECT\n" +
  "- AI가 핵심이 아닌 일반 개발 도구 → REJECT " +
  "(게임 엔진, 프로그래밍 언어, 프레임워크, 코드 라이브러리, API 테스트 도구 같은 것들. " +
  "요즘은 이런 것들도 AI 기능을 하나씩 달고 있지만, 그건 곁다리지 그 도구의 본체가 아니야)\n" +
  "\n국내 서비스 판단 기준 (설명이 한국어로 들어오는 경우):\n" +
  "- 국내 서비스나 1인 개발 서비스라고 해서 불리하게 보지 마. 지금 가입해서 쓸 수 있으면 규모는 상관없어.\n" +
  "- '~를 만들었습니다', '~해주는 서비스입니다' 같은 소개 말투는 그냥 소개일 뿐이야. 그걸 광고로 보고 깎지 마.\n" +
  "- 반대로 AI라는 말만 붙어 있고 실제로 하는 일이 AI와 관련 없으면 REJECT.\n" +
  "\n분류 기준:\n" +
  `- 분야: ${CATEGORIES.join(" / ")} 중 딱 하나. 애매하면 "일상 및 생산성".\n` +
  `- 가격: ${PRICE_TYPES.join(" / ")} 중 하나. 모르면 "부분 무료".\n` +
  "- 한국어: 한국어 입출력을 제대로 지원하면 true, 아니거나 모르면 false.\n" +
  "- 요약: 이 서비스가 뭘 해주는지 한국어 한 줄로. 25자 안팎, 마침표 없이.\n" +
  "  기능을 나열하지 말고 '무엇을 해주는지' 하나만 써. 영어 전문 용어를 쓰지 마.\n" +
  "- 소개: 상세페이지에 실릴 한국어 소개글. 3~4문장.\n" +
  "  ①무엇을 해주는 서비스인지 ②어떤 상황에 쓰면 좋은지 ③무료로 어디까지 되는지 순서로 써.\n" +
  "  주어진 설명에 없는 내용은 지어내지 마. 모르는 건 빼고 아는 것만 써.\n" +
  "  쉬운 말로 써. 영어 전문 용어를 쓰지 마.\n" +
  "\n이름과 설명이 영어로 들어와도 똑같은 기준으로 판단해. " +
  "단, 답변에 쓰는 분야·가격·요약·소개는 어떤 경우에도 한국어로 써 (분야와 가격은 위에 적힌 보기 그대로).\n" +
  "\n출력 형식: 서비스 하나당 JSON 한 줄. 줄바꿈으로 나눠서 써. 다른 말은 절대 쓰지 마.\n" +
  "들어온 번호는 하나도 빠뜨리지 말고, 그 번호를 그대로 붙여서 답해.\n" +
  "REJECT면 번호와 판정만 쓰고 나머지는 쓰지 마.\n" +
  '{"번호":1,"판정":"PASS","분야":"코딩 및 개발","가격":"부분 무료","한국어":true,"요약":"코드를 대신 써주는 편집기",' +
  '"소개":"코드를 짤 때 옆에서 다음 줄을 채워주는 도구입니다. 반복되는 코드를 빠르게 넘길 때 쓰면 좋습니다. 기본 기능은 무료로 쓸 수 있습니다."}\n' +
  '{"번호":2,"판정":"REJECT"}';

const EXTRACT_PROMPT =
  "아래 블로그 글에서 '사용자가 직접 써볼 수 있는 AI 서비스'만 뽑아줘.\n" +
  '형식: [{"name":"서비스 이름","description":"한국어 한 줄 설명 30자 이내"}]\n' +
  "규칙:\n" +
  "- name은 그 서비스의 정식 이름만 (예: 챗GPT, Canva, 감마). 문장이나 설명을 넣지 마.\n" +
  "- 서비스가 아닌 것은 넣지 마. '클로드 API', 'GPT-4 요금제'처럼 기능·요금제 이름을 서비스처럼 적지 마 " +
  "(그 경우엔 본체인 '클로드'를 적어).\n" +
  "- AI 기능이 핵심인 서비스만. 뉴스 사이트, 언론사, 쇼핑몰, 서점, 블로그 플랫폼, 위키백과, " +
  "일반 기업/기관 홈페이지, 부품·칩·기술 용어는 절대 넣지 마.\n" +
  "- 해당하는 게 없으면 [] 만 출력해.\n" +
  "JSON 배열만 출력해. 다른 설명은 절대 쓰지 마.";

/**
 * 툴 사이트가 아닌 곳 (블로그 플랫폼, SNS, 언론, 쇼핑몰, 위키, 정적 파일 서버 등)
 * producthunt.com·steemhunt.com은 툴 소개 사이트라, 툴 이름으로 검색하면 공식 홈페이지인 척 잡힙니다.
 */
const NOT_A_TOOL =
  /(^|\.)(naver\.com|naver\.net|pstatic\.net|blog\.me|tistory\.com|daum\.net|kakao\.com|google\.com|gstatic\.com|facebook\.com|instagram\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|linkedin\.com|pinterest\.com|threads\.net|producthunt\.com|steemhunt\.com|webcatalog\.io|coupang\.com|11st\.co\.kr|gmarket\.co\.kr|yes24\.com|kyobobook\.co\.kr|aladin\.co\.kr|netflix\.com|wikipedia\.org|namu\.wiki|w3\.org|schema\.org|go\.kr|or\.kr)$/i;

/** 이미지·CSS 같은 파일 주소는 링크 목록에서 뺍니다 */
const ASSET_FILE = /\.(css|js|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|xml|json)(\?|$)/i;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** 네이버 응답에 섞여오는 <b> 태그와 HTML 특수문자를 걷어냅니다 */
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m])
    .trim();
}

/** 네이버 블로그 주소는 껍데기(프레임)라 본문이 실제로 있는 주소로 바꿔줍니다 */
export function toReadableUrl(url: string): string {
  const m = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
  return m ? `https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}` : url;
}

/**
 * 주소를 한 가지 모양으로 통일합니다. 끝 슬래시와 도메인 대소문자 차이 때문에
 * 같은 툴이 두 번 저장되는 걸 막습니다.
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "")}${u.search}`;
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

/** AI가 뱉은 문자열에서 JSON 배열만 꺼냅니다. 못 꺼내면 빈 배열 */
export function parseJsonArray(s: string): unknown[] {
  const m = s.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const v = JSON.parse(m[0]);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** 블로그 글 하나 = 검색 결과 한 건 */
type Post = { title: string; url: string };

/** 네이버 검색 API 한 번 호출 */
async function searchNaver(query: string, env: Env): Promise<Post[]> {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=20&sort=date`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) throw new Error(`네이버 검색 실패 (${query}) — ${res.status} ${await res.text()}`);

  const { items = [] } = (await res.json()) as { items?: { title: string; link: string }[] };
  return items.map((i) => ({ title: stripHtml(i.title), url: i.link }));
}

/** Product Hunt 프로덕트 한 건 */
type PhNode = {
  name?: string;
  tagline?: string;
  description?: string;
  website?: string;
  url?: string;
  votesCount?: number;
};

/**
 * 한 번의 요청으로 두 가지를 같이 물어봅니다 (GraphQL은 별칭으로 몰아서 물어볼 수 있습니다).
 * - t0, t1...  : 정해둔 분야 안에서 (위 PH_TOPICS)
 * - rank       : 분야를 안 가리고 표를 많이 받은 순으로 (일간 인기 순위)
 *
 * 순위 쪽은 아직 분야가 안 붙은 신생 툴까지 잡아냅니다. 분야만 보면 이런 게 통째로 빠집니다.
 * 분야 이름은 PH_TOPICS 상수에서만 오기 때문에 문자열을 그대로 끼워 넣어도 안전합니다.
 */
export function phQuery(topics: string[]): string {
  const 물어볼것 = "{ nodes { name tagline description website url votesCount } }";
  const 분야별 = topics.map(
    (t, i) =>
      `  t${i}: posts(topic: "${t}", postedAfter: $postedAfter, order: VOTES, first: ${PH_POSTS_PER_TOPIC}) ${물어볼것}`,
  );
  const 순위 = `  rank: posts(postedAfter: $postedAfter, order: VOTES, first: ${PH_RANKING_COUNT}) ${물어볼것}`;
  return `query($postedAfter: DateTime!) {\n${[...분야별, 순위].join("\n")}\n}`;
}

/**
 * GraphQL 응답에서 프로덕트 목록만 꺼냅니다.
 * 분야와 순위에 같은 프로덕트가 겹쳐 나오므로 이름으로 한 번만 남기고, 표를 많이 받은 순으로 세웁니다.
 * (뒤에서 앞에서부터 몇 개만 잘라 쓰기 때문에 이 순서가 곧 우선순위입니다)
 */
export function phNodes(body: unknown): PhNode[] {
  const { data, errors } = (body ?? {}) as {
    data?: Record<string, { nodes?: PhNode[] } | null>;
    errors?: { message?: string }[];
  };

  // GraphQL은 잘못된 요청에도 200을 주고 errors에 이유를 담아 보냅니다
  if (errors?.length) throw new Error(`Product Hunt 응답 오류 — ${errors.map((e) => e.message).join(", ")}`);

  const nodes = Object.values(data ?? {}).flatMap((t) => t?.nodes ?? []);
  const 이름있는것 = nodes.filter((n): n is PhNode & { name: string } => typeof n.name === "string" && n.name.trim() !== "");
  return [...new Map(이름있는것.map((n) => [n.name.trim().toLowerCase(), n])).values()].sort(
    (a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0),
  );
}

/**
 * Product Hunt가 주는 website는 클릭 추적용 중간 주소(producthunt.com/r/...)라
 * 한 번 따라가서 진짜 홈페이지 주소만 남깁니다.
 *
 * 이 주소는 부를 때마다 뒤 토큰이 새로 발급됩니다. 그래서 못 펴면 반드시 빈 값이어야 합니다 —
 * 그대로 저장하면 같은 툴이 매번 다른 주소로 보여서 중복 방지가 통째로 뚫립니다.
 * 한 번만 시도하고 안 되면 빈 값으로 두고 넘어갑니다. 주소가 비어도 저장은 그대로 되고,
 * 국내 툴과 똑같이 이름으로 중복을 거른 뒤 주소는 노션에서 채우시면 됩니다.
 */
const IS_PH = /(^|\.)producthunt\.com$/i;

async function unwrapWebsite(website: string): Promise<string> {
  try {
    if (!IS_PH.test(new URL(website).hostname)) return siteRoot(website);

    // 브라우저인 척해야 통과됩니다. 리다이렉트를 따라가지 않고 Location 헤더만 읽습니다.
    const res = await fetch(website, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": BROWSER_UA },
    });
    const target = res.headers.get("location") ?? "";
    if (!target) {
      console.log("PH 주소 못 폄", res.status, website.slice(0, 60));
      return "";
    }
    return IS_PH.test(new URL(target).hostname) ? "" : siteRoot(target);
  } catch {
    return ""; // 주소가 비었거나 형식이 깨진 경우
  }
}

/**
 * Product Hunt에서 최근 올라온 프로덕트를 가져옵니다.
 * 블로그와 달리 이름·설명·홈페이지를 처음부터 다 주기 때문에
 * 본문 열기 → AI 추출 → 주소 찾기 단계를 통째로 건너뛰고 바로 판정 대상이 됩니다.
 */
export async function fetchProductHunt(env: Env): Promise<CollectedItem[]> {
  if (!env.PRODUCT_HUNT_TOKEN) {
    console.log("PRODUCT_HUNT_TOKEN이 없어 해외 수집은 건너뜁니다");
    return [];
  }

  const topics = pickKeywords(PH_TOPICS_PER_RUN, PH_TOPICS);
  const postedAfter = new Date(Date.now() - PH_LOOKBACK_HOURS * 3600_000).toISOString();
  console.log("이번 해외 분야", topics.join(", "));

  const res = await fetch(PH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PRODUCT_HUNT_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: phQuery(topics), variables: { postedAfter } }),
  });
  if (!res.ok) throw new Error(`Product Hunt 실패 — ${res.status} ${await res.text()}`);

  // 이미 보관함에 있는 이름은 주소를 펴보지도 않습니다 (호출 아끼기)
  const 받은것 = phNodes(await res.json());
  const 아는것 = await findStagedTitles(
    받은것.map((n) => n.name ?? ""),
    env,
  );
  const nodes = 받은것.filter((n) => !아는것.has((n.name ?? "").trim().toLowerCase())).slice(0, MAX_PH_ITEMS);
  console.log(`해외 받은 것 ${받은것.length} → 처음 보는 것 ${nodes.length}`);

  return Promise.all(
    nodes.map(async (n) => ({
      title: (n.name ?? "").trim().slice(0, 100),
      url: normalizeUrl(await unwrapWebsite(n.website ?? "")),
      // tagline이 딱 한 줄짜리 소개라 그대로 설명으로 씁니다
      description: (n.tagline ?? "").trim(),
      source: n.url ?? PH_ENDPOINT,
      // 긴 상세 설명은 판정 근거로만 씁니다 (저장하지 않습니다)
      detail: (n.description ?? "").trim(),
    })),
  );
}

/** 디스콰이엇 목록에서 뽑은 한 줄 */
export type DqCard = { slug: string; name: string; tagline: string };

/**
 * 디스콰이엇 목록 화면(HTML) → 프로덕트 목록.
 * 카드 하나는 "제목 링크 + 한 줄 소개" 모양으로 내려옵니다:
 *   <h3 ...><a href="/products/슬러그">이름</a></h3> ... <p class="text-sm ...">한 줄 소개</p>
 * 화면이 바뀌면 여기만 고치면 됩니다 (못 읽으면 빈 배열 — 수집이 죽지는 않습니다).
 */
export function parseDisquietList(html: string): DqCard[] {
  const 카드 = /href="\/products\/([^"?#]+)"[^>]*>([^<]{1,80})<\/a>[\s\S]{0,800}?<p class="text-sm[^"]*">([^<]{0,300})<\/p>/g;

  const out = new Map<string, DqCard>();
  for (const m of html.matchAll(카드)) {
    const slug = m[1];
    const name = stripHtml(m[2]);
    if (!name || out.has(slug)) continue;
    out.set(slug, { slug, name: name.slice(0, 100), tagline: stripHtml(m[3]).slice(0, 300) });
  }
  return [...out.values()];
}

/**
 * 디스콰이엇 프로덕트 상세 화면(HTML) → 공식 홈페이지 주소와 긴 소개글.
 * - 주소: "방문하기" 버튼에 달린 링크
 * - 소개: 만든 사람이 직접 쓴 소개 문단 (상세페이지 소개글의 재료가 됩니다)
 */
export function parseDisquietProduct(html: string): { website: string; detail: string } {
  const 방문 = html.match(/href="(https?:\/\/[^"]+)"[^>]*>[\s\S]{0,400}?방문하기/);
  const website = 방문?.[1] ?? "";

  const 소개 = html.match(/<div class="prose[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const detail = 소개
    ? stripHtml(소개[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
        // 윈도우 줄바꿈(\r)이 섞여 오면 상세페이지에서 문단이 이상하게 갈라집니다
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
    : "";

  return {
    // 디스콰이엇 안쪽 링크가 잡혔으면 주소를 못 찾은 걸로 봅니다 (노션에서 채우면 됩니다)
    website: /(^|\.)disquiet\.io$/i.test(new URL(website || "https://x.invalid").hostname) ? "" : website,
    detail: detail.slice(0, 3000),
  };
}

/** 우리 이름을 밝히고, 오래 매달리지 않게 시간 제한을 걸어 한 장 받아옵니다 */
async function dqFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": BOT_UA, Accept: "text/html" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`디스콰이엇 열기 실패 ${res.status} ${url}`);
  return res.text();
}

/**
 * 디스콰이엇에서 최근 올라온 프로덕트를 가져옵니다.
 *
 * 목록 한 장(1회) → 제목·한 줄 소개에 AI 얘기가 있는 것만 골라 → 상세 몇 장(최대 3회).
 * 디스콰이엇은 AI 서비스만 모아둔 곳이 아니라서, 상세를 열기 전에 먼저 걸러야 호출이 안 샙니다.
 * 상세 한 장이 실패해도 나머지는 그대로 갑니다.
 */
export async function fetchDisquietProducts(env: Env, limit = MAX_DQ_ITEMS): Promise<CollectedItem[]> {
  const 목록 = parseDisquietList(await dqFetch(DQ_LIST_URL));
  const AI로보이는것 = 목록.filter((p) => AI_KEYWORD.test(`${p.name} ${p.tagline}`));

  // 상세를 열기 전에 이미 아는 툴을 걸러냅니다 (D1 조회는 호출 예산에 안 들어갑니다)
  const 아는것 = await findStagedTitles(
    AI로보이는것.map((p) => p.name),
    env,
  );
  const 후보 = AI로보이는것.filter((p) => !아는것.has(p.name.trim().toLowerCase())).slice(0, limit);

  console.log(`디스콰이엇 목록 ${목록.length} → AI로 보이는 것 ${AI로보이는것.length} → 처음 보는 것 ${후보.length}`);

  const items = await Promise.all(
    후보.map(async (p): Promise<CollectedItem | undefined> => {
      const source = `https://disquiet.io/products/${p.slug}`;
      try {
        const { website, detail } = parseDisquietProduct(await dqFetch(source));
        return {
          title: p.name,
          // 만든 사람이 직접 건 링크라 그대로 씁니다 (주소 안쪽 경로까지 살립니다)
          url: website ? normalizeUrl(website) : "",
          description: p.tagline,
          source,
          // 판정 근거이자 상세페이지 소개글의 재료. 처음부터 한국어라 그대로 쓸 만합니다
          detail,
        };
      } catch (e) {
        console.error("디스콰이엇 상세 실패", source, e);
        return undefined;
      }
    }),
  );

  return items.filter((i): i is CollectedItem => i !== undefined);
}

/** Algolia가 돌려주는 Show HN 글 한 건 */
type HnHit = { objectID?: string; title?: string; url?: string | null; story_text?: string | null };

/** "Show HN:" 머리말 */
const SHOW_HN = /^\s*show\s*hn\s*[:\-–—]\s*/i;

/**
 * Show HN 제목 → 서비스 이름 + 한 줄 소개.
 *
 * 제목은 거의 "Show HN: 이름 – 뭘 해주는지" 모양입니다. 통째로 저장하면
 * 보관함에 "Show HN: Itinr – AI trip planner" 같은 이름이 쌓여서 중복 걸러내기가 통째로 뚫립니다.
 * 구분 기호(대시·세로줄·쉼표·쌍점)가 없으면 자를 데가 없으니 그냥 전부 이름으로 씁니다.
 *
 * 대시는 앞뒤에 띄어쓰기가 있을 때만 자릅니다 — "AI-Powered Widget"이 "AI"로 잘리면 안 됩니다.
 */
export function splitShowHn(title: string): { name: string; tagline: string } {
  const 본문 = stripHtml(title).replace(SHOW_HN, "").trim();
  const m = 본문.match(/^(.{1,60}?)(?:\s+[–—|-]\s+|[,:]\s+)(.+)$/);
  return m ? { name: m[1].trim(), tagline: m[2].trim() } : { name: 본문, tagline: "" };
}

/**
 * Algolia 응답 → 수집 항목. 화면을 긁는 게 아니라 정식 JSON이라 깨질 일이 거의 없지만,
 * 모양이 바뀌어도 에러 대신 빈손이 나오게 둡니다 (나머지 세 곳은 계속 돌아야 합니다).
 */
export function parseHnHits(body: unknown): CollectedItem[] {
  const { hits = [] } = (body ?? {}) as { hits?: HnHit[] };

  return hits.flatMap((h): CollectedItem[] => {
    if (!h?.objectID) return [];
    const { name, tagline } = splitShowHn(h.title ?? "");
    if (!name) return [];

    const 글주소 = `https://news.ycombinator.com/item?id=${h.objectID}`;
    return [
      {
        title: name.slice(0, 100),
        // 만든 사람이 직접 건 프로젝트 링크. 없으면 비워둡니다 (사장님이 노션에서 채우십니다) —
        // 해커뉴스 글 주소를 넣으면 사이트의 "바로가기"가 툴이 아니라 게시글로 가버립니다
        url: h.url ? normalizeUrl(h.url) : "",
        description: tagline,
        source: 글주소,
        // 본인이 쓴 소개 본문. 판정 근거이자 상세페이지 소개글의 재료입니다
        detail: stripHtml(h.story_text ?? "").slice(0, 3000),
      },
    ];
  });
}

/**
 * 해커뉴스 Show HN에서 최근 올라온 프로젝트를 가져옵니다 (바깥 호출 딱 1번).
 *
 * Show HN은 AI만 모아둔 곳이 아니라 오픈소스 라이브러리·튜토리얼이 절반입니다.
 * 그래서 여기서 AI 얘기로 보이는 것만 먼저 추리고, "일반 유저가 쓰는 서비스인가"는
 * 뒤쪽 품질 판정(evaluateTools)에 맡깁니다 — 그 프롬프트에 이미
 * "코드 라이브러리·프레임워크 → REJECT" 규칙이 들어있어서 따로 만들 게 없습니다.
 */
export async function fetchHackerNews(env: Env, limit = MAX_HN_ITEMS): Promise<CollectedItem[]> {
  const res = await fetch(HN_ENDPOINT, {
    headers: { "User-Agent": BOT_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`해커뉴스 실패 — ${res.status} ${await res.text()}`);

  const 받은것 = parseHnHits(await res.json());
  const AI로보이는것 = 받은것.filter((i) => AI_KEYWORD.test(`${i.title} ${i.description} ${i.detail ?? ""}`));

  // 판정에 넘기기 전에 이미 아는 이름을 걸러냅니다 (D1 조회는 호출 예산에 안 들어갑니다)
  const 아는것 = await findStagedTitles(
    AI로보이는것.map((i) => i.title),
    env,
  );
  const 후보 = AI로보이는것.filter((i) => !아는것.has(i.title.trim().toLowerCase())).slice(0, limit);

  console.log(`해커뉴스 ${받은것.length} → AI로 보이는 것 ${AI로보이는것.length} → 처음 보는 것 ${후보.length}`);
  return 후보;
}

/** 블로그 글을 열어서 본문 글자와 글 안의 바깥 링크를 뽑습니다 */
async function fetchPost(url: string): Promise<{ text: string; links: string[] }> {
  const res = await fetch(toReadableUrl(url), { headers: { "User-Agent": BROWSER_UA } });
  if (!res.ok) throw new Error(`블로그 열기 실패 ${res.status}`);
  const html = await res.text();

  const links: string[] = [];
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s]+)["']/gi)) {
    try {
      const host = new URL(m[1]).hostname;
      if (!NOT_A_TOOL.test(host) && !ASSET_FILE.test(m[1]) && !links.includes(m[1])) links.push(m[1]);
    } catch {
      // 주소 형식이 깨진 링크는 무시
    }
  }

  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { text: stripHtml(text).slice(0, 6000), links: links.slice(0, 30) };
}

/** 본문에서 AI 툴 목록(이름/주소/설명)을 뽑아냅니다 */
async function extractTools(ai: Ai, post: Post, page: { text: string; links: string[] }) {
  const out = (await ai.run(EXTRACT_MODEL, {
    messages: [
      { role: "system", content: EXTRACT_PROMPT },
      {
        role: "user",
        content: `제목: ${post.title}\n\n글에 있는 링크:\n${page.links.join("\n") || "(없음)"}\n\n본문:\n${page.text}`,
      },
    ],
    max_tokens: 800,
    temperature: 0, // 같은 글이면 같은 답이 나오게
  })) as { response?: string };

  return parseJsonArray(out.response ?? "")
    .map((t) => t as { name?: unknown; description?: unknown })
    .filter(
      (t): t is { name: string; description?: string } =>
        typeof t.name === "string" && t.name.trim() !== "" && t.name.trim().length <= 40,
    )
    .slice(0, MAX_TOOLS_PER_POST);
}

/** 주소에서 도메인 뿌리만 남깁니다 (https://gemini.google.com/?hl=ko → https://gemini.google.com) */
export function siteRoot(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * 툴 이름으로 네이버 웹검색을 해서 공식 홈페이지 주소를 찾습니다.
 * AI에게 주소를 물어보면 Gemini를 암호화폐 거래소(gemini.com)로 답하는 식의 실수가 나서,
 * 검색 결과에서 직접 가져옵니다.
 */
export async function resolveOfficialUrl(name: string, env: Env): Promise<string> {
  const query = encodeURIComponent(`${name} 공식 사이트`);
  const res = await fetch(`https://openapi.naver.com/v1/search/webkr.json?display=5&query=${query}`, {
    headers: {
      "X-Naver-Client-Id": env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) return "";

  const { items = [] } = (await res.json()) as { items?: { link: string }[] };

  // 블로그·위키·쇼핑몰은 건너뜁니다
  const roots = items
    .map(({ link }) => siteRoot(link))
    .filter((root) => root !== "" && !NOT_A_TOOL.test(new URL(root).hostname));

  // 이름이 도메인에 들어간 결과를 우선합니다
  // (Microsoft 365 Copilot → microsoft.com 보다 copilot.microsoft.com)
  const words = name.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const score = (root: string) => words.filter((w) => new URL(root).hostname.includes(w)).length;

  const 최선 = roots.sort((a, b) => score(b) - score(a))[0];

  /**
   * 이름이 도메인에 하나도 안 들어가면 못 찾은 걸로 봅니다 (빈 문자열).
   *
   * 예전엔 점수가 0이어도 검색 1등을 그냥 돌려줬는데, 그러다 Snapdown 에 leawo.org(DVD 변환 프로그램),
   * 탁몽에 경기북부 e스포츠진흥원 주소가 들어갔습니다. 엉뚱한 주소는 빈 칸보다 나쁩니다 —
   * 빈 칸은 눈에 띄어서 채우게 되지만, 그럴듯한 오답은 손님이 클릭할 때까지 아무도 모릅니다.
   *
   * 이름이 한글뿐이면(words 가 비면) 도메인으로 확인할 방법이 없으니 항상 빈 칸입니다. 그게 안전합니다.
   */
  return 최선 && score(최선) > 0 ? 최선 : "";
}

/** 판정 결과. pass가 false면 나머지 값은 의미 없습니다 */
export type Verdict = {
  pass: boolean;
  category: (typeof CATEGORIES)[number];
  priceType: (typeof PRICE_TYPES)[number];
  isKorean: boolean;
  /** AI가 새로 쓴 한국어 한 줄 요약. 못 받았으면 빈 문자열 */
  summary: string;
  /** AI가 쓴 상세페이지용 긴 소개글 초안. 못 받았으면 빈 문자열 */
  overview: string;
};

/** 한 번에 몇 개씩 묶어서 물어볼지. 늘릴수록 호출은 줄지만 답이 길어져 잘릴 위험이 커집니다 */
const JUDGE_BATCH = 5;
/** 묶음 하나에 허용할 답변 길이 (툴 하나당). 소개글까지 받아야 해서 넉넉히 잡습니다 */
const JUDGE_TOKENS_PER_TOOL = 300;
/** 묶어서 물어볼 때는 툴 하나가 프롬프트를 다 잡아먹지 않게 잘라 넣습니다 */
const JUDGE_TEXT_LIMIT = 800;

/**
 * Workers AI에게 물어봐서 쓸만한 서비스인지 판정하고, 분야·가격·한국어·소개글까지 같이 받아옵니다.
 *
 * 예전에는 툴 하나당 한 번씩 물어봐서 호출이 금방 동났습니다 (워커는 요청당 50번 제한).
 * 지금은 다섯 개씩 묶어서 한 번에 물어봅니다 — 18개를 판정해도 호출은 4번이면 끝납니다.
 * 묶음 하나가 통째로 실패해도 그 묶음만 저장 안 되고 나머지는 그대로 갑니다.
 */
export async function evaluateTools(ai: Ai, texts: string[]): Promise<Verdict[]> {
  const 묶음들: string[][] = [];
  for (let i = 0; i < texts.length; i += JUDGE_BATCH) 묶음들.push(texts.slice(i, i + JUDGE_BATCH));

  const 결과 = await Promise.all(
    묶음들.map((묶음) =>
      judgeBatch(ai, 묶음).catch((e) => {
        console.error("품질 판정 실패 (이 묶음은 저장하지 않습니다)", e);
        return 묶음.map(() => 판정실패());
      }),
    ),
  );
  return 결과.flat();
}

/** 묶음 하나를 AI에게 넘기고 판정 목록을 받아옵니다 */
async function judgeBatch(ai: Ai, 묶음: string[]): Promise<Verdict[]> {
  const 질문 = 묶음.map((t, i) => `[${i + 1}]\n${t.slice(0, JUDGE_TEXT_LIMIT)}`).join("\n\n");

  const out = (await ai.run(JUDGE_MODEL, {
    messages: [
      { role: "system", content: JUDGE_PROMPT },
      { role: "user", content: 질문 },
    ],
    max_tokens: JUDGE_TOKENS_PER_TOOL * 묶음.length,
    temperature: 0, // 같은 툴이면 같은 판정이 나오게
  })) as { response?: string };

  const raw = asText(out.response);
  console.log(`판정 ${묶음.length}개`, JSON.stringify(raw.slice(0, 200)));
  return parseVerdicts(raw, 묶음.length);
}

/**
 * Workers AI가 답을 문자열이 아니라 객체로 돌려줄 때가 있습니다.
 * 그대로 두면 판정이 통째로 에러가 나서 아무것도 저장되지 않으므로 글자로 맞춰줍니다.
 * (객체로 와도 안에 판정 JSON이 그대로 들어있어서 아래 parseVerdicts가 꺼내 씁니다)
 */
export function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** 판정을 못 받았을 때의 값. 저장하지 않는다는 뜻입니다 */
function 판정실패(): Verdict {
  return { pass: false, category: "일상 및 생산성", priceType: "부분 무료", isKorean: false, summary: "", overview: "" };
}

/**
 * AI 답변 → 판정 목록 (넣어준 개수만큼 항상 돌려줍니다).
 *
 * 답이 중간에 잘리는 일이 있어서, JSON 배열 하나로 받지 않고 { } 덩어리를 하나씩 주워 담습니다.
 * 마지막 한 줄이 잘려도 앞의 것들은 그대로 살아남습니다.
 * 못 읽은 자리는 REJECT로 남아서 저장되지 않습니다.
 */
export function parseVerdicts(raw: string, count: number): Verdict[] {
  const 결과 = Array.from({ length: count }, 판정실패);
  let 다음자리 = 0; // AI가 번호를 안 붙였으면 들어온 순서대로 채웁니다

  for (const m of raw.matchAll(/\{[^{}]*\}/g)) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(m[0]) as Record<string, unknown>;
    } catch {
      continue; // 잘린 조각은 건너뜁니다
    }

    const 번호 = Number(parsed["번호"]);
    const 자리 = Number.isInteger(번호) && 번호 >= 1 && 번호 <= count ? 번호 - 1 : 다음자리;
    if (자리 >= count) continue;

    결과[자리] = 하나읽기(parsed);
    다음자리 = 자리 + 1;
  }
  return 결과;
}

/** JSON 한 덩어리 → Verdict */
function 하나읽기(parsed: Record<string, unknown>): Verdict {
  const fallback = 판정실패();
  const 판정 = String(parsed["판정"] ?? "").toUpperCase();
  const 분야 = String(parsed["분야"] ?? "");
  const 가격 = String(parsed["가격"] ?? "");

  return {
    pass: 판정.includes("PASS") && !판정.includes("REJECT"),
    // 목록에 없는 값을 지어내면 기본값으로 (웹사이트 필터가 깨지는 걸 막습니다)
    category: (CATEGORIES as readonly string[]).includes(분야)
      ? (분야 as Verdict["category"])
      : fallback.category,
    priceType: (PRICE_TYPES as readonly string[]).includes(가격)
      ? (가격 as Verdict["priceType"])
      : fallback.priceType,
    isKorean: parsed["한국어"] === true,
    // 카드에 한 줄로 들어갈 자리라 길면 잘라냅니다. 한글이 한 자도 없으면 안 쓴 걸로 봅니다
    summary: 한글요약(String(parsed["요약"] ?? "")),
    // 상세페이지 본문. 노션 한 칸에 2000자까지 들어가서 그 안으로 자릅니다
    overview: 한국어글(String(parsed["소개"] ?? ""), 2000),
  };
}

/** 카드 요약으로 쓸 수 있는 한국어 한 줄인지 보고, 아니면 빈 문자열 */
const HANGUL = /[가-힣]/;

function 한글요약(s: string): string {
  return 한국어글(s.trim().replace(/[.。]$/, ""), 40);
}

/** 한글이 한 자도 없으면(=영어로만 답했으면) 안 쓴 걸로 보고 버립니다 */
function 한국어글(s: string, 최대: number): string {
  const 다듬음 = s.trim();
  return HANGUL.test(다듬음) ? 다듬음.slice(0, 최대) : "";
}

/** 네이버 검색 → 블로그 본문 → AI 툴 추출 → 중복 제거 → 품질 판정 */
export async function collect(env: Env) {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다");
  }

  const queries = pickKeywords();
  console.log("이번 검색어", queries.join(", "));

  // 네 곳은 서로 상관없는 일이라 같이 출발시킵니다
  // (네이버 블로그 / Product Hunt / 디스콰이엇 / 해커뉴스 Show HN).
  // 한 곳이 실패해도 나머지는 끝까지 돌아야 해서, 실패는 여기서 삼키고 빈손으로 넘어갑니다.
  // 수집처를 더 붙일 때도 이 배열에 .catch 를 단 채로 한 줄 추가하면 됩니다.
  const [searched, phItems, dqItems, hnItems] = await Promise.all([
    Promise.all(queries.map((q) => searchNaver(q, env))),
    // Product Hunt만 12시간에 한 번 (EVERY_PH). 건지는 게 가장 적어서 매번 부르지 않습니다.
    // 다른 곳도 뜸하게 부르고 싶으면 여기 isTurn(...)을 똑같이 감싸면 됩니다.
    isTurn(EVERY_PH)
      ? fetchProductHunt(env).catch((e): CollectedItem[] => {
          console.error("Product Hunt 수집 실패", e);
          return [];
        })
      : [],
    fetchDisquietProducts(env).catch((e): CollectedItem[] => {
      console.error("디스콰이엇 수집 실패", e);
      return [];
    }),
    fetchHackerNews(env).catch((e): CollectedItem[] => {
      console.error("해커뉴스 수집 실패", e);
      return [];
    }),
  ]);
  const found = [...new Map(searched.flat().map((p) => [p.url, p])).values()];

  // 제목만 봐도 AI 얘기가 아닌 글은 아예 열지 않습니다 (호출 예산 아끼기)
  const posts = found.filter((p) => AI_KEYWORD.test(p.title));

  // 지난 실행에서 이미 훑은 블로그 글도 열어보지 않습니다
  const readBefore = await findExistingValues(
    "Source",
    posts.map((p) => p.url),
    env,
  );
  // 툴이 안 나온 글은 Source에 안 남아서 다음에도 또 후보가 됩니다.
  // 늘 앞에서부터 고르면 같은 글만 반복해서 읽게 되니 무작위로 뽑습니다.
  const unread = posts.filter((p) => !readBefore.has(p.url));
  const fresh = unread
    .map((p) => ({ p, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, MAX_POSTS)
    .map(({ p }) => p);

  // 본문을 열어서 AI 툴 이름과 설명을 뽑아냅니다. 실패한 글은 건너뜁니다.
  const perPost = await Promise.all(
    fresh.map(async (post) => {
      try {
        const tools = await extractTools(env.AI, post, await fetchPost(post.url));
        return tools.map((t) => ({
          name: t.name.trim().slice(0, 100),
          description: (t.description ?? "").trim(),
          source: post.url,
        }));
      } catch (e) {
        console.error("툴 추출 실패", post.url, e);
        return [];
      }
    }),
  );

  // 같은 이름이 여러 글에 나오면 한 번만. 보관함에 이미 있는 이름도 여기서 뺍니다
  // (블로그에는 늘 나오던 툴이 또 나오기 때문에, 주소 찾기 호출이 여기서 가장 많이 절약됩니다)
  const 뽑힌것 = [...new Map(perPost.flat().map((t) => [t.name.toLowerCase(), t])).values()];
  const 아는이름 = await findStagedTitles(
    뽑힌것.map((t) => t.name),
    env,
  );
  const named = 뽑힌것.filter((t) => !아는이름.has(t.name.trim().toLowerCase())).slice(0, MAX_CANDIDATES);
  console.log(`블로그에서 뽑은 이름 ${뽑힌것.length} → 처음 보는 것 ${named.length}`);

  // 이름으로 공식 홈페이지 주소를 찾습니다
  const withUrl = await Promise.all(
    named.map(async (t) => {
      const url = await resolveOfficialUrl(t.name, env).catch(() => "");
      if (!url) console.log("주소 못 찾음", t.name);
      return { title: t.name, url: normalizeUrl(url), description: t.description, source: t.source };
    }),
  );

  // 여기서 네 갈래(블로그 / Product Hunt / 디스콰이엇 / 해커뉴스) 수집물이 한 줄기로 합쳐집니다.
  // 서로 다른 이름이 같은 사이트로 이어지면 한 건만.
  // 주소를 못 찾은 건 이름을 열쇠로 씁니다 (주소는 비워두고 저장합니다)
  const tools = [
    ...new Map(
      [...withUrl, ...phItems, ...dqItems, ...hnItems].map((t): [string, CollectedItem] => [
        t.url || `이름:${t.title.toLowerCase()}`,
        t,
      ]),
    ).values(),
  ];

  // 이미 노션에 있는 건 주소로, 주소가 없으면 이름으로 걸러냅니다
  const [savedUrls, savedNames] = await Promise.all([
    findExistingValues(
      "URL",
      tools.map((t) => t.url).filter((u) => u !== ""),
      env,
    ),
    findExistingValues(
      "이름",
      tools.map((t) => t.title),
      env,
    ),
  ]);
  const candidates = tools.filter((t) => !savedNames.has(t.title) && !(t.url !== "" && savedUrls.has(t.url)));

  // 상세 설명까지 붙여서 판단 근거를 늘려줍니다 (없으면 이름과 한 줄 설명만으로 판단합니다).
  // 다섯 개씩 묶어서 물어보기 때문에 후보가 18개여도 AI 호출은 4번입니다.
  const verdicts = await evaluateTools(
    env.AI,
    candidates.map((t) => [t.title, t.description, t.detail].filter(Boolean).join("\n")),
  );

  // 통과한 툴에 AI가 매긴 분야·가격·한국어를 붙여둡니다 (웹사이트가 이 값으로 필터를 겁니다)
  const passed: CollectedItem[] = [];
  for (const [idx, t] of candidates.entries()) {
    const v = verdicts[idx];
    if (!v.pass) continue;
    passed.push({
      ...t,
      // 설명이 영어면(주로 해외 프로덕트) AI가 새로 쓴 한국어 요약으로 갈아끼웁니다.
      // 이미 한국어면 블로그에서 뽑은 설명이 더 구체적이라 그대로 둡니다.
      description: HANGUL.test(t.description) ? t.description : v.summary || t.description,
      // 상세페이지에 실릴 긴 글. AI가 못 썼으면 해외 프로덕트의 원문 설명이라도 넣어둡니다
      // (빈칸보다는 고칠 거리가 있는 편이 낫습니다. 사장님이 노션에서 다듬으시면 됩니다)
      overview: v.overview || t.detail || "",
      detail: undefined, // 판정에만 쓰는 원문이라 저장 단계로 넘기지 않습니다
      category: v.category,
      priceType: v.priceType,
      isKorean: v.isKorean,
    });
  }

  const noUrl = passed.filter((t) => t.url === "").length;
  console.log(
    `검색 ${found.length} → AI 글 ${posts.length} → 새 글 ${fresh.length} → 이름 ${named.length} ` +
      `(+ 해외 ${phItems.length} + 디스콰이엇 ${dqItems.length} + 해커뉴스 ${hnItems.length}) ` +
      `→ 새 툴 ${candidates.length} → PASS ${passed.length} (주소 빈 것 ${noUrl})`,
  );

  return {
    blogs: found.length,
    newBlogs: fresh.length,
    ph: phItems.length,
    dq: dqItems.length,
    hn: hnItems.length,
    tools: candidates.length,
    passed,
    noUrl,
  };
}
