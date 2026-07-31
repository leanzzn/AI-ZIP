import { insertToNotion } from "./notion.ts";
import type { CollectedItem, Env } from "./notion.ts";

/** D1 staging_tools 테이블 한 줄 */
type StagedRow = {
  id: number;
  title: string;
  description: string;
  url: string;
  source: string;
  created_at: string;
};

/**
 * 수집·판정을 통과한 툴을 임시 보관함(D1)에 넣습니다.
 * 이미 들어있는 툴(주소 같음 / 이름 같음)은 INSERT OR IGNORE 로 조용히 건너뜁니다.
 * 돌려주는 값은 "실제로 새로 들어간 개수"입니다.
 */
export async function stageTools(items: CollectedItem[], env: Env): Promise<number> {
  if (items.length === 0) return 0;

  const stmt = env.DB.prepare("INSERT OR IGNORE INTO staging_tools (title, url, description, source) VALUES (?, ?, ?, ?)");

  const results = await env.DB.batch(items.map((t) => stmt.bind(t.title, t.url, t.description, t.source)));
  return results.reduce((n, r) => n + (r.meta.changes ?? 0), 0);
}

/**
 * 자정 배치: 임시 보관함에서 아직 안 보낸 것(is_synced = 0)을 모두 꺼내 노션에 넣고,
 * 성공한 것만 is_synced = 1 로 바꿉니다. 실패한 건 그대로 남아 다음 자정에 다시 시도합니다.
 *
 * insert 인자는 테스트에서 가짜 노션을 끼우기 위한 것입니다. 실제 실행에선 건드릴 일 없습니다.
 */
export async function syncToNotion(env: Env, insert = insertToNotion) {
  const { results } = await env.DB.prepare(
    "SELECT id, title, description, url, source, created_at FROM staging_tools WHERE is_synced = 0 ORDER BY id",
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
          source: row.source,
          createdAt: row.created_at,
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
