/**
 * 노션에 이미 올라간 툴 중 **주소가 비었거나 설명이 부실한 것**을 찾아서 고칩니다.
 *
 * push-to-notion.ts 가 "새로 올리는" 담당이라면, 이 스크립트는 "이미 올라간 걸 다듬는" 담당입니다.
 *
 * 실행: npm run enrich:notion                 ← 기본 15건
 *       npm run enrich:notion -- --limit=50   ← 50건
 *       npm run enrich:notion -- --dry-run    ← 안 고치고 뭐가 바뀔지만 보기 (먼저 이걸로 확인하세요)
 *
 * 노션은 초당 3건 제한이 있어 400ms씩 쉬면서 부릅니다. 중간에 끊어도 됩니다 —
 * 고친 것은 다음 실행 때 대상에서 빠지므로 다시 돌리면 이어서 합니다.
 *
 * 주의사항은 scripts/agent/주의사항.md 에 정리해뒀습니다. 고치기 전에 한 번 읽어주세요.
 */
import { Client } from "@notionhq/client";
import { getDataSourceId } from "../../worker/src/notion.ts";
import { resolveOfficialUrl } from "../../worker/src/collect.ts";
import type { Env } from "../../worker/src/notion.ts";

/** 노션 초당 3건 제한. 호출 사이에 이만큼 쉽니다 */
const SLEEP_MS = 400;
/** 한 번에 손볼 개수 (--limit 으로 바꿀 수 있습니다) */
const 기본배치 = 15;
/**
 * 설명이 이보다 짧으면 "부실"로 봅니다.
 * 처음엔 20자로 잡았다가 1,008건이 걸려서 8자로 낮췄습니다 — CLAUDE.md 의 요약 규칙이
 * "25자 내외"라서, "이미지 업스케일러"(9자) 같은 짧은 설명은 멀쩡한 겁니다. 진짜 빈 칸만 잡습니다.
 */
const 최소설명길이 = 8;
/** 한글·영어 아닌 글자가 이 비율을 넘으면 "깨진 글" 로 봅니다 */
const 이상문자한도 = 0.12;
/**
 * 긴 글은 비율만으로는 안 잡힙니다 — 200자짜리 소개글에 러시아어 단어 하나(5자)가 섞이면 2.5%라
 * 위 한도를 못 넘깁니다. 그래서 "몇 글자나 섞였나"도 같이 봅니다.
 */
const 이상문자개수한도 = 4;
/** 한글이 이 비율보다 적으면 "한국어가 아님"으로 봅니다 (영어로만 적힌 설명을 잡습니다) */
const 최소한글비율 = 0.3;
/** AI가 돌려준 한 줄 설명이 이 범위를 벗어나면 요약에 실패한 걸로 보고 버립니다 */
const AI답변최소 = 20;
const AI답변최대 = 200;
/** 긴 소개글은 기준이 다릅니다. 노션 rich_text 한 칸 제한(2,000자)도 넘으면 안 됩니다 */
const AI소개글최소 = 80;
const AI소개글최대 = 1800;

// ─────────────────────────────────────────────── 도구들

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 한글 / 영문 / 숫자 / 흔한 문장부호. 이 밖의 글자는 "이상 문자"로 셉니다 */
const 정상글자 = /[ -~가-힣ㄱ-ㆎ\s·—–…‘’“”₩€£°×÷™®©]/;

/** 일본어·중국어·아랍어·깨진 글자(���) 등이 섞였는지 봅니다 */
export function 깨진글인가(text: string): boolean {
  const 글자 = [...text.trim()];
  if (글자.length === 0) return false;
  const 이상 = 글자.filter((c) => !정상글자.test(c)).length;
  return 이상 / 글자.length > 이상문자한도 || 이상 >= 이상문자개수한도;
}

/**
 * 한글이 거의 없으면 한국어 설명이 아닙니다.
 * 깨진글인가() 는 러시아어·중국어처럼 '글자 모양이 다른' 것만 잡습니다.
 * 스페인어·프랑스어·영어처럼 알파벳을 쓰는 말은 그쪽으로는 안 걸려서 이 검사가 따로 필요합니다.
 */
export function 한국어아님(text: string): boolean {
  const 글자 = [...text.trim()].filter((c) => /\S/.test(c));
  if (글자.length === 0) return false;
  return 글자.filter((c) => /[가-힣]/.test(c)).length / 글자.length < 최소한글비율;
}

export type 할일종류 = "url" | "description" | "overview";

/**
 * 손볼 대상인지 판단합니다.
 *
 * 소개글(overview)은 "비어 있음"을 부실로 보지 않습니다 — 원래 비어 있는 툴이 많고,
 * 재료 없이 AI에게 긴 글을 시키면 그럴듯한 거짓말을 지어냅니다. 이미 적힌 글이
 * 외국어로 오염됐을 때만 다시 씁니다.
 */
export function 손볼곳(url: string, description: string, overview = ""): 할일종류[] {
  const 할일: 할일종류[] = [];
  if (!url.trim()) 할일.push("url");

  const 설명 = description.trim();
  if (설명.length < 최소설명길이 || 깨진글인가(설명) || 한국어아님(설명)) 할일.push("description");

  const 소개 = overview.trim();
  if (소개.length > 0 && (깨진글인가(소개) || 한국어아님(소개))) 할일.push("overview");

  return 할일;
}

// ─────────────────────────────────────────────── AI 로 설명 다시 쓰기

/**
 * 구글 제미나이. 키는 aistudio.google.com 에서 무료로 발급받아 .env.local 에 넣습니다.
 * 모델을 바꾸고 싶으면 .env.local 에 GEMINI_MODEL 한 줄만 추가하면 됩니다.
 */
// 'lite' 를 씁니다 — 윗급(gemini-flash-latest)은 무료로 하루 20건밖에 못 씁니다.
// 'latest' 별칭이라 구글이 모델을 올려도 코드를 안 고쳐도 됩니다.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
/** 무료 요금제는 분당 호출 수가 적어서 AI 호출 사이에는 넉넉히 쉽니다 */
const AI_대기 = 4000;

const 지시문 = [
  "너는 한국인 일반 유저가 보는 AI 서비스 목록의 편집자다.",
  "아래 설명을 규칙대로 다시 써라.",
  "",
  "1. 한국어·영어가 아닌 글자, 깨진 글자, 광고 문구, 이모지는 전부 버린다.",
  "2. 이 서비스가 무엇을 해주는지만 한국어 1~2문장(60자 내외)으로 쓴다.",
  "3. 영어 전문 용어를 쓰지 않는다 (예: 'LLM 기반 멀티모달' ❌ → '그림도 이해하는' ✅).",
  "4. 기능을 나열하지 않는다.",
  "5. 문장은 반드시 '~합니다' 또는 '~입니다' 로 끝낸다. '~이다', '~한다' 같은 반말체는 쓰지 않는다.",
  "6. 설명 문장만 답한다. 인사·따옴표·번호·설명 이외의 말은 절대 붙이지 않는다.",
].join("\n");

/** 제미나이를 한 번 부릅니다. 너무 빠르다고 거절(429)하면 알려준 만큼 쉬고 딱 한 번만 다시 시도 */
async function 제미나이(프롬프트: string, 시킬일 = 지시문, 재시도 = true): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 시킬일 }] },
        contents: [{ parts: [{ text: 프롬프트 }] }],
        generationConfig: {
          temperature: 0.2,
          // 제미나이는 답하기 전에 '속으로 생각'을 하는데 그 분량이 이 한도에 같이 들어갑니다.
          // 한 줄 설명 하나 받는 데도 1,200은 줘야 합니다 — 300으로 잡으면 생각하다 잘려서 답이 반토막 납니다.
          // 긴 소개글까지 받아야 해서 넉넉히 3,000. 한도일 뿐이라 안 쓰면 비용도 안 듭니다.
          maxOutputTokens: 3000,
        },
      }),
    },
  );

  if (res.status === 429 && 재시도) {
    console.warn("  AI 속도 제한 — 20초 쉬고 다시 시도합니다");
    await sleep(20_000);
    return 제미나이(프롬프트, 시킬일, false);
  }
  if (!res.ok) throw new Error(`AI 호출 실패 (${res.status}) ${(await res.text()).slice(0, 200)}`);

  const body = (await res.json()) as {
    candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
  };
  const 후보 = body.candidates?.[0];
  // 끝까지 다 쓰지 못하고 잘린 답은 버립니다 (반토막 문장을 노션에 넣지 않기 위해)
  if (후보?.finishReason && 후보.finishReason !== "STOP") return "";
  return (후보?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

/**
 * AI에게 설명을 다시 써달라고 합니다. 못 받았으면 null (그러면 원래 글을 그대로 둡니다).
 *
 * 노션 "소개글" 칸을 꼭 같이 넘깁니다. 이걸 빼먹었더니 원래 설명이 "글쓰기 도우미"로만 적힌
 * 여섯 개 툴이 전부 똑같은 문장으로 나왔습니다 — AI에게 이름 말고는 줄 게 없었기 때문입니다.
 */
export async function 설명다시쓰기(이름: string, 원본: string, 소개글 = ""): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  await sleep(AI_대기);
  const 답 = await 제미나이(
    `서비스 이름: ${이름}\n` +
      `지금 설명: ${원본.slice(0, 1000) || "(없음)"}\n` +
      `참고할 상세 소개: ${소개글.slice(0, 2000) || "(없음)"}`,
  );
  const 글 = 답.trim().replace(/^["'“”]|["'“”]$/g, "").trim();

  // AI가 헛소리를 했으면 원본을 건드리지 않는 편이 낫습니다
  if (글.length < AI답변최소 || 글.length > AI답변최대 || 깨진글인가(글) || 한국어아님(글)) return null;
  return 글;
}

const 소개글지시문 = [
  "너는 한국인 일반 유저가 보는 AI 서비스 소개 페이지의 편집자다.",
  "아래 소개글을 규칙대로 다시 써라.",
  "",
  "1. 한국어가 아닌 글자(러시아어·중국어·일본어 등), 깨진 글자, 광고 문구는 전부 버린다.",
  "2. 원문에 있는 사실만 쓴다. 원문에 없는 기능·가격·회사 정보를 지어내지 않는다.",
  "3. 문단 2~4개로 나누고, 문단 사이는 빈 줄 하나로 구분한다.",
  "4. 영어 전문 용어를 쓰지 않는다 (예: 'LLM 기반 멀티모달' ❌ → '그림도 이해하는' ✅).",
  "5. 문장은 반드시 '~합니다' 또는 '~입니다' 로 끝낸다. 반말체는 쓰지 않는다.",
  "6. 소개글 본문만 답한다. 제목·인사·따옴표·번호는 절대 붙이지 않는다.",
].join("\n");

/** 긴 소개글에서 외국어를 걷어내고 한국어로 다시 씁니다. 못 받았으면 null (원문 유지) */
export async function 소개글다시쓰기(이름: string, 원본: string, 한줄설명 = ""): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  await sleep(AI_대기);
  const 답 = await 제미나이(
    `서비스 이름: ${이름}\n` +
      `한 줄 설명: ${한줄설명 || "(없음)"}\n` +
      `지금 소개글:\n${원본.slice(0, 4000)}`,
    소개글지시문,
  );
  const 글 = 답.trim().replace(/^["'“”]|["'“”]$/g, "").trim();

  if (글.length < AI소개글최소 || 글.length > AI소개글최대 || 깨진글인가(글) || 한국어아님(글)) return null;
  return 글;
}

// ─────────────────────────────────────────────── 노션에서 대상 고르기

type 대상 = {
  id: string;
  이름: string;
  url: string;
  description: string;
  /** 노션 "소개글" 칸. 설명을 다시 쓸 때 AI에게 넘길 재료이자, 그 자체로 고칠 대상이기도 합니다 */
  소개글: string;
  할일: 할일종류[];
};

type 노션속성 = Record<
  string,
  { url?: string | null; rich_text?: { plain_text: string }[]; title?: { plain_text: string }[] }
>;

/**
 * 손볼 것만 골라 담습니다. 필요한 만큼 채워지면 바로 멈춥니다.
 *
 * `최근시간` 을 주면 그 시간 안에 노션에서 바뀐 줄만 봅니다 (자동 실행용).
 * 수집기가 새 툴을 넣으면 그 줄의 '마지막 수정 시각'이 갱신되므로, 새로 들어온 것만 정확히 걸립니다.
 * 우리가 고친 줄도 시각이 갱신되지만, 고치고 나면 더는 부실하지 않아서 다음 날 다시 잡히지 않습니다.
 *
 * 노션 필터로는 "설명이 8자 미만" 같은 조건을 걸 수 없어서 받아서 직접 봅니다.
 */
async function 대상고르기(
  notion: Client,
  dataSourceId: string,
  개수: number,
  최근시간 = 0,
): Promise<대상[]> {
  const 결과: 대상[] = [];
  let cursor: string | undefined;

  // 최근 것만 볼 때는 최신순으로 받아야 앞부분만 읽고 끝낼 수 있습니다
  const 최근필터 = 최근시간
    ? {
        filter: {
          timestamp: "last_edited_time" as const,
          last_edited_time: { on_or_after: new Date(Date.now() - 최근시간 * 3600_000).toISOString() },
        },
        sorts: [{ timestamp: "last_edited_time" as const, direction: "descending" as const }],
      }
    : {};

  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
      ...최근필터,
    });

    for (const page of res.results) {
      const p = (page as { properties?: 노션속성 }).properties ?? {};
      const 이름 = p["이름"]?.title?.[0]?.plain_text?.trim() ?? "";
      const url = p["URL"]?.url ?? "";
      const description = (p["Description"]?.rich_text ?? []).map((t) => t.plain_text).join("");
      const 소개글 = (p["소개글"]?.rich_text ?? []).map((t) => t.plain_text).join("");
      if (!이름) continue;

      const 할일 = 손볼곳(url, description, 소개글);
      if (할일.length === 0) continue;

      결과.push({ id: page.id, 이름, url, description, 소개글, 할일 });
      if (결과.length >= 개수) return 결과;
    }

    cursor = res.next_cursor ?? undefined;
    if (cursor) await sleep(SLEEP_MS);
  } while (cursor);

  return 결과;
}

// ─────────────────────────────────────────────── 실행

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const 배치 = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) || 기본배치;
/** --최근=25 → 최근 25시간 안에 바뀐 줄만 봅니다. 0이면 전체를 봅니다 */
const 최근시간 =
  Number(args.find((a) => a.startsWith("--최근="))?.split("=")[1] ?? args.find((a) => a.startsWith("--since="))?.split("=")[1]) || 0;

// 판별 규칙이 멀쩡한지 보는 자체 점검. 노션을 건드리지 않습니다: node ... enricher.ts --self-check
if (args.includes("--self-check")) {
  const { strict: a } = await import("node:assert");
  a.equal(깨진글인가("대화로 뭐든 물어보는 만능 AI"), false);
  a.equal(깨진글인가("An AI writing assistant for teams"), false);
  a.equal(깨진글인가("AI 도구 — 무료로 사용 가능 (2024)"), false);
  a.equal(깨진글인가("最先端のAIツールです。ぜひお試しください"), true);
  a.equal(깨진글인가("AI 글쓰기 ���� ??? ᜌᜓᜅ᜔"), true);
  // 알파벳을 쓰는 외국어는 깨진글인가()로는 안 걸립니다 — 한국어아님()이 잡아야 합니다
  a.equal(한국어아님("AI Voice Generator & Text to Speech"), true);
  a.equal(한국어아님("Genera imágenes con inteligencia artificial"), true);
  a.equal(한국어아님("이미지 업스케일러"), false);
  a.equal(한국어아님("Notion 문서를 자동으로 정리해주는 도구"), false);

  a.deepEqual(손볼곳("https://x.com", "이 서비스는 문서를 요약해주는 도구입니다"), []);
  a.deepEqual(손볼곳("", "이 서비스는 문서를 요약해주는 도구입니다"), ["url"]);
  a.deepEqual(손볼곳("https://x.com", "짧음"), ["description"]);
  a.deepEqual(손볼곳("  ", ""), ["url", "description"]);
  // 짧아도 멀쩡한 설명은 건드리지 않습니다 (CLAUDE.md 요약 규칙: 25자 내외)
  a.deepEqual(손볼곳("https://x.com", "이미지 업스케일러"), []);
  a.deepEqual(손볼곳("https://x.com", "프로젝트를 시각화해줌"), []);
  // 실제로 있었던 것들
  a.deepEqual(손볼곳("https://x.com", "개인 плани어"), ["description"]); // Outside — 러시아어 섞임
  a.deepEqual(손볼곳("https://x.com", "법률咨询해주는 챗봇"), ["description"]); // AskLegal.bot — 중국어 섞임

  // 소개글: 비어 있는 건 그냥 둡니다 (재료 없이 긴 글을 시키면 AI가 지어냅니다)
  const 멀쩡한설명 = "문서를 자동으로 요약해주는 도구입니다";
  a.deepEqual(손볼곳("https://x.com", 멀쩡한설명, ""), []);
  a.deepEqual(손볼곳("https://x.com", 멀쩡한설명, "이 서비스는 문서를 빠르게 정리해 줍니다. 회의록도 깔끔하게 만들어 줍니다."), []);
  // 긴 글에 외국어가 조금 섞인 경우 — 비율은 낮아도 글자 수로 잡아야 합니다
  const 러시아어섞인긴글 =
    "이 서비스는 문서를 빠르게 정리해 줍니다. Позволяет 회의록도 깔끔하게 만들어 주고, 필요한 내용만 골라 담아 줍니다. 팀원과 함께 쓰기에도 좋습니다.";
  a.ok(러시아어섞인긴글.length > 60, "긴 글이어야 이 검사가 의미가 있습니다");
  a.deepEqual(손볼곳("https://x.com", 멀쩡한설명, 러시아어섞인긴글), ["overview"]);

  console.log("자체 점검 통과");
  process.exit(0);
}

const env = process.env as unknown as Env;
if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
  throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID 가 없습니다 (.env.local 확인)");
}
if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
  console.warn("⚠ 네이버 검색 키가 없어 주소 찾기는 건너뜁니다 (설명 정리만 합니다)");
}
if (!GEMINI_API_KEY) {
  console.warn("⚠ GEMINI_API_KEY 가 없어 설명 다시 쓰기는 건너뜁니다 (주소 찾기만 합니다)");
}

const notion = new Client({ auth: env.NOTION_TOKEN });
const dataSourceId = await getDataSourceId(notion, env.NOTION_DATABASE_ID);

// 조사만 하기: 노션 전체를 훑어서 손볼 게 몇 건인지 세어봅니다. AI를 안 부르고 아무것도 안 고칩니다.
if (args.includes("--조사") || args.includes("--scan")) {
  const 전부 = await 대상고르기(notion, dataSourceId, Infinity, 최근시간);
  const 주소 = 전부.filter((t) => t.할일.includes("url"));
  const 설명 = 전부.filter((t) => t.할일.includes("description"));
  const 소개 = 전부.filter((t) => t.할일.includes("overview"));
  console.log(`\n손볼 것 ${전부.length}건${최근시간 ? ` (최근 ${최근시간}시간 안에 바뀐 것만)` : ""}`);
  console.log(`  · 주소가 비어 있음: ${주소.length}건`);
  console.log(`  · 한 줄 설명이 부실하거나 외국어가 섞임: ${설명.length}건`);
  console.log(`  · 긴 소개글에 외국어가 섞임: ${소개.length}건`);
  if (설명.length) console.log("\n설명이 이상한 것 (앞 15건):");
  for (const t of 설명.slice(0, 15)) console.log(`   · ${t.이름}: ${t.description || "(비어있음)"}`);
  if (소개.length) console.log("\n소개글이 이상한 것 (앞 15건):");
  for (const t of 소개.slice(0, 15)) console.log(`   · ${t.이름}: ${t.소개글.slice(0, 60)}…`);
  console.log(`\n고치려면: npm run enrich:notion -- --limit=${Math.min(전부.length, 50) || 1}`);
  process.exit(0);
}

console.log(`손볼 것을 찾습니다 (최대 ${배치}건${최근시간 ? `, 최근 ${최근시간}시간 안에 바뀐 것만` : ""})…`);
const 대상들 = await 대상고르기(notion, dataSourceId, 배치, 최근시간);
console.log(`${대상들.length}건 찾았습니다.${dryRun ? " (미리보기 — 노션은 건드리지 않습니다)" : ""}\n`);

let 고침 = 0;
let 그대로 = 0;
const 실패: string[] = [];

for (const t of 대상들) {
  const 바뀔것: Record<string, unknown> = {};
  const 기록: string[] = [];

  try {
    if (t.할일.includes("url") && env.NAVER_CLIENT_ID) {
      const 찾은주소 = await resolveOfficialUrl(t.이름, env);
      if (찾은주소) {
        바뀔것["URL"] = { url: 찾은주소 };
        기록.push(`주소 → ${찾은주소}`);
      } else {
        기록.push("주소 → 못 찾음");
      }
      await sleep(SLEEP_MS);
    }

    if (t.할일.includes("description")) {
      const 새설명 = await 설명다시쓰기(t.이름, t.description, t.소개글);
      if (새설명 && 새설명 !== t.description) {
        바뀔것["Description"] = { rich_text: [{ text: { content: 새설명 } }] };
        기록.push(`설명 → ${새설명}`);
      } else {
        기록.push("설명 → 그대로 둠");
      }
    }

    if (t.할일.includes("overview")) {
      const 새소개 = await 소개글다시쓰기(t.이름, t.소개글, t.description);
      if (새소개 && 새소개 !== t.소개글) {
        바뀔것["소개글"] = { rich_text: [{ text: { content: 새소개 } }] };
        기록.push(`소개글 → ${새소개.slice(0, 45)}…`);
      } else {
        기록.push("소개글 → 그대로 둠");
      }
    }

    if (Object.keys(바뀔것).length === 0) {
      그대로++;
      console.log(`· ${t.이름}: ${기록.join(" / ")}`);
      continue;
    }

    if (!dryRun) await notion.pages.update({ page_id: t.id, properties: 바뀔것 as never });
    고침++;
    console.log(`✓ ${t.이름}: ${기록.join(" / ")}`);
  } catch (e) {
    // 한 건이 터져도 멈추지 않습니다. 남은 건 다음 실행 때 다시 잡힙니다.
    const status = (e as { status?: number }).status;
    if (status === 429) {
      const after = Number((e as { headers?: Record<string, string> }).headers?.["retry-after"]) || 5;
      console.warn(`  속도 제한 — ${after}초 쉽니다`);
      await sleep(after * 1000);
    }
    console.error(`✗ ${t.이름}: ${(e as Error).message}`);
    실패.push(t.이름);
  } finally {
    await sleep(SLEEP_MS);
  }
}

console.log(`\n끝났습니다. 고침 ${고침}건 / 손 못 댐 ${그대로}건 / 실패 ${실패.length}건`);
if (실패.length) console.log("실패한 것:", 실패.join(", "));
if (dryRun) console.log("\n미리보기였습니다. 실제로 고치려면 --dry-run 을 빼고 다시 돌려주세요.");
else console.log("\n사이트는 노션을 1시간 캐시합니다. 잠시 뒤 새로고침 해주세요.");
