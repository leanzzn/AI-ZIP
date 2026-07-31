import { Client } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client";

export type Env = {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  NAVER_CLIENT_ID: string;
  NAVER_CLIENT_SECRET: string;
  /** Cloudflare Workers AI 바인딩 (wrangler.toml의 [ai]) */
  AI: Ai;
  /** 임시 보관함 D1 바인딩 (wrangler.toml의 [[d1_databases]]) */
  DB: D1Database;
};

/** 수집기가 만들어내는 한 건의 데이터 = AI 툴 하나 */
export type CollectedItem = {
  /** AI 툴 이름 */
  title: string;
  /** AI 툴 공식 홈페이지 주소. 못 찾았으면 빈 문자열 — 노션에서 직접 채우시면 됩니다 */
  url: string;
  /** AI 툴 한 줄 설명 */
  description: string;
  /** 이 툴 정보를 뽑아온 블로그 글 주소 */
  source: string;
  /** ISO 문자열. 없으면 현재 시각 */
  createdAt?: string;
  /** AI가 매긴 분야. 웹사이트 카테고리 칩과 같은 글자여야 합니다 */
  category?: string;
  /** AI가 매긴 가격 유형 (무료 / 부분 무료 / 유료) */
  priceType?: string;
  /** AI가 판단한 한국어 지원 여부 */
  isKorean?: boolean;
};

/**
 * CollectedItem → 노션 페이지 요청 본문 (순수 함수, 테스트 대상)
 * 속성 이름/타입은 노션 DB "AI-ZIP"의 실제 구조에 맞춰져 있습니다.
 * 노션에서 속성을 바꾸면 여기도 같이 바꿔야 합니다.
 */
export function toNotionPage(databaseId: string, data: CollectedItem): CreatePageParameters {
  if (!data.title?.trim()) throw new Error("insertToNotion: title은 필수입니다");

  return {
    parent: { database_id: databaseId },
    properties: {
      이름: { title: [{ text: { content: data.title.slice(0, 2000) } }] },
      // 주소를 못 찾았으면 비워둡니다 (사장님이 노션에서 직접 채우는 용도)
      URL: { url: data.url?.trim() || null },
      Description: { rich_text: [{ text: { content: (data.description ?? "").slice(0, 2000) } }] },
      Source: { rich_text: [{ text: { content: data.source } }] },
      날짜: { date: { start: data.createdAt ?? new Date().toISOString() } },
      // AI가 매긴 분류. 빈 값이면 노션에서도 비워둡니다 (사장님이 직접 고르시는 용도)
      카테고리: data.category ? { select: { name: data.category } } : { select: null },
      가격: data.priceType ? { select: { name: data.priceType } } : { select: null },
      한국어: { checkbox: data.isKorean === true },
    },
  };
}

type PageProps = Record<
  string,
  { url?: string | null; rich_text?: { plain_text: string }[]; title?: { plain_text: string }[] }
>;

/** 조회할 때마다 DB를 다시 물어보면 호출만 낭비라 한 번 찾은 id는 들고 있습니다 */
let cachedDataSourceId: string | undefined;

async function getDataSourceId(notion: Client, databaseId: string): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;

  // 노션 v5부터는 DB가 아니라 "데이터 소스"에 질의합니다. DB에서 그 id를 먼저 꺼냅니다.
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const id = "data_sources" in db ? db.data_sources[0]?.id : undefined;
  if (!id) throw new Error("노션 DB에서 데이터 소스를 찾지 못했습니다");

  cachedDataSourceId = id;
  return id;
}

/**
 * 넘긴 값 중 이미 노션에 저장돼 있는 것만 골라 돌려줍니다 (중복 저장 방지).
 * "URL"은 AI 툴 주소, "이름"은 툴 이름(주소를 못 찾은 건 이걸로 비교), "Source"는 블로그 주소입니다.
 * ponytail: 한 값당 페이지가 100개를 넘으면 놓칠 수 있음. 실제로 겹치면 커서 페이지네이션 추가.
 */
export async function findExistingValues(
  property: "URL" | "이름" | "Source",
  values: string[],
  env: Env,
): Promise<Set<string>> {
  const found = new Set<string>();
  if (values.length === 0) return found;

  const notion = new Client({ auth: env.NOTION_TOKEN });
  const dataSourceId = await getDataSourceId(notion, env.NOTION_DATABASE_ID);

  // 노션 필터는 한 번에 조건 100개까지
  for (let i = 0; i < values.length; i += 100) {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        or: values.slice(i, i + 100).map((v) => {
          if (property === "URL") return { property, url: { equals: v } };
          if (property === "이름") return { property, title: { equals: v } };
          return { property, rich_text: { equals: v } };
        }),
      },
      page_size: 100,
    });

    for (const page of res.results) {
      const prop = (page as { properties?: PageProps }).properties?.[property];
      const value =
        property === "URL"
          ? prop?.url
          : property === "이름"
            ? prop?.title?.[0]?.plain_text
            : prop?.rich_text?.[0]?.plain_text;
      if (value) found.add(value);
    }
  }

  return found;
}

/** 노션 데이터베이스에 한 건 추가. 실패하면 원인을 붙여서 throw */
export async function insertToNotion(data: CollectedItem, env: Env): Promise<string> {
  if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
    throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다");
  }

  const notion = new Client({ auth: env.NOTION_TOKEN });

  try {
    const page = await notion.pages.create(toNotionPage(env.NOTION_DATABASE_ID, data));
    return page.id;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`노션 저장 실패 (${data.source}: ${data.title}) — ${reason}`, { cause: err });
  }
}
