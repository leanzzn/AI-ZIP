import { insertToNotion } from "./notion.ts";
import type { CollectedItem, Env } from "./notion.ts";

/** D1 staging_tools 테이블 한 줄 */
type StagedRow = {
  id: number;
  title: string;
  description: string;
  overview: string;
  url: string;
  source: string;
  category: string;
  price_type: string;
  is_korean: number;
  created_at: string;
};

/**
 * 보관함에 이미 들어있는 이름만 골라 돌려줍니다 (소문자로 비교).
 *
 * 수집처가 상세 페이지를 열기 전에 이걸로 한 번 걸러내면, 이미 아는 툴을 다시 열어보는
 * 헛걸음이 사라집니다. 보관함은 노션으로 보낸 뒤에도 줄을 지우지 않아서 예전에 모은 것까지 다 걸러집니다.
 * D1 조회는 바깥 호출(요청당 50개 제한)에 안 들어가서 공짜나 마찬가지입니다.
 *
 * 수집처를 새로 붙일 때도 "목록 받기 → 이 함수로 거르기 → 상세 열기" 순서를 지켜주세요.
 */
export async function findStagedTitles(titles: string[], env: Env): Promise<Set<string>> {
  const found = new Set<string>();
  const 이름들 = [...new Set(titles.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (이름들.length === 0) return found;

  // 한 번에 넣는 값이 너무 많으면 SQLite가 거부해서 100개씩 끊습니다
  for (let i = 0; i < 이름들.length; i += 100) {
    const 조각 = 이름들.slice(i, i + 100);
    const { results } = await env.DB.prepare(
      `SELECT lower(title) AS t FROM staging_tools WHERE lower(title) IN (${조각.map(() => "?").join(",")})`,
    )
      .bind(...조각)
      .all<{ t: string }>();

    for (const r of results) found.add(r.t);
  }
  return found;
}

/**
 * 수집·판정을 통과한 툴을 임시 보관함(D1)에 넣습니다.
 * 이미 들어있는 툴(주소 같음 / 이름 같음)은 INSERT OR IGNORE 로 조용히 건너뜁니다.
 * 돌려주는 값은 "실제로 새로 들어간 개수"입니다.
 */
export async function stageTools(items: CollectedItem[], env: Env): Promise<number> {
  if (items.length === 0) return 0;

  const stmt = env.DB.prepare(
    "INSERT OR IGNORE INTO staging_tools (title, url, description, overview, source, category, price_type, is_korean) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  const results = await env.DB.batch(
    items.map((t) =>
      stmt.bind(
        t.title,
        t.url,
        t.description,
        t.overview ?? "",
        t.source,
        t.category ?? "",
        t.priceType ?? "",
        t.isKorean ? 1 : 0,
      ),
    ),
  );
  return results.reduce((n, r) => n + (r.meta.changes ?? 0), 0);
}

/**
 * 자정 배치: 임시 보관함에서 아직 안 보낸 것(is_synced = 0)을 꺼내 노션에 넣고,
 * 성공한 것만 is_synced = 1 로 바꿉니다. 실패한 건 그대로 남아 다음 자정에 다시 시도합니다.
 *
 * 한 번에 MAX_PER_RUN 건까지만 보냅니다. 워커는 요청 하나당 바깥 호출이 50번까지라
 * 대기가 수천 건 쌓여 있으면(예: 데이터 일괄 투입) 제한에 걸려 통째로 실패하기 때문입니다.
 * 남은 건 다음 시간에 이어서 갑니다. 한 번에 많이 밀어넣어야 하면 scripts/push-to-notion.ts 를 쓰세요.
 *
 * is_enriched = 1 조건이 반드시 있어야 합니다. 외부 데이터셋은 영어인 채로 들어와서
 * 번역 전에는 is_enriched = 0 입니다. 이 조건이 없으면 영어 설명이 그대로 사이트에 올라갑니다.
 *
 * insert 인자는 테스트에서 가짜 노션을 끼우기 위한 것입니다. 실제 실행에선 건드릴 일 없습니다.
 */
const MAX_PER_RUN = 40;

export async function syncToNotion(env: Env, insert = insertToNotion) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, description, overview, url, source, category, price_type, is_korean, created_at
       FROM staging_tools
      WHERE is_synced = 0 AND is_enriched = 1
      ORDER BY id LIMIT ${MAX_PER_RUN}`,
  ).all<StagedRow>();

  const synced: number[] = [];
  const failed: string[] = [];

  // 노션은 초당 3건 제한이 있어서 한 건씩 순서대로 보냅니다.
  // 자정에 도는 배치라 좀 느려도 상관없습니다.
  for (const row of results) {
    try {
      await insert(
        {
          title: row.title,
          url: row.url,
          description: row.description,
          overview: row.overview,
          source: row.source,
          createdAt: row.created_at,
          category: row.category,
          priceType: row.price_type,
          isKorean: row.is_korean === 1,
        },
        env,
      );
      synced.push(row.id);
    } catch (e) {
      console.error("노션 전송 실패", row.title, e);
      failed.push(row.title);
    }
  }

  if (synced.length > 0) {
    await env.DB.prepare(`UPDATE staging_tools SET is_synced = 1 WHERE id IN (${synced.map(() => "?").join(",")})`)
      .bind(...synced)
      .run();
  }

  return { 대기: results.length, 전송: synced.length, 실패: failed.length, 실패한툴: failed };
}
