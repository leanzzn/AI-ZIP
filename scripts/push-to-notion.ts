/**
 * 보관함(D1)에서 한국어 번역이 끝난 툴을 노션으로 올립니다. → 사이트에 반영됩니다.
 *
 * 워커의 자정 배치가 아니라 이 스크립트로 올리는 이유:
 * 워커는 요청 하나당 바깥 호출이 50번까지라 수천 건을 한 번에 못 보냅니다.
 * 내 컴퓨터에서 돌리면 그 제한이 없어서 천천히 다 보낼 수 있습니다.
 *
 * 실행: npm run push:notion              ← 전부
 *       npm run push:notion -- --limit=50   ← 앞 50건만 (먼저 이걸로 사이트 확인해보세요)
 *       npm run push:notion -- --dry-run    ← 안 올리고 뭐가 올라갈지만 보기
 *
 * 노션은 초당 3건 제한이 있어 400ms씩 쉬면서 보냅니다. 1,000건이면 약 7분입니다.
 * 중간에 끊어도 됩니다 — 보낸 건 D1에 표시되니 다시 돌리면 이어서 합니다.
 */
import { execFileSync } from "node:child_process";
import { Client } from "@notionhq/client";
import { toNotionPage } from "../worker/src/notion.ts";

const DB = "ai-zip-staging";
const CONFIG = "worker/wrangler.toml";
const SLEEP_MS = 400;
/** 한 번에 UPDATE 로 표시할 개수. SQLite 가 받아주는 선 안에서 */
const MARK_CHUNK = 100;

type 행 = {
  id: number;
  title: string;
  url: string;
  description: string;
  overview: string;
  category: string;
  price_type: string;
  is_korean: number;
  created_at: string;
};

/**
 * wrangler 로 원격 D1 에 질의합니다 (따로 API 토큰이 필요 없습니다).
 * npx 대신 wrangler 파일을 직접 실행합니다 — 윈도우에서 npx 를 쓰면
 * SQL 문장이 공백마다 쪼개져서 명령이 깨집니다.
 */
const WRANGLER = "node_modules/wrangler/bin/wrangler.js";

function d1<T>(sql: string): T[] {
  let out: string;
  try {
    out = execFileSync(
      process.execPath,
      [WRANGLER, "d1", "execute", DB, "--remote", "-c", CONFIG, "-y", "--json", "--command", sql],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
    );
  } catch (e) {
    // 윈도우에서 wrangler 가 종료하며 내는 잡음에 진짜 원인이 묻혀서 따로 꺼내 보여줍니다
    const 원인 = String((e as { stderr?: string }).stderr || (e as Error).message)
      .split("\n")
      .find((l) => l.includes("ERROR") || l.includes("no such column")) ?? String((e as Error).message);
    throw new Error(`D1 질의 실패 — ${원인}\n  질의: ${sql.slice(0, 120)}`);
  }
  // wrangler 가 앞에 안내문을 붙이는 경우가 있어 JSON 이 시작하는 곳부터 읽습니다
  const json = out.slice(out.indexOf("["));
  return (JSON.parse(json) as { results: T[] }[])[0]?.results ?? [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) || 0;

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!dryRun && (!NOTION_TOKEN || !NOTION_DATABASE_ID)) {
  throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID 가 없습니다 (.env.local 확인)");
}

console.log("보관함에서 올릴 목록을 가져옵니다…");
const rows = d1<행>(
  "SELECT id, title, url, description, overview, category, price_type, is_korean, created_at " +
    "FROM staging_tools WHERE is_synced = 0 AND is_enriched = 1 ORDER BY id" +
    (limit ? ` LIMIT ${limit}` : ""),
);
console.log(`올릴 것 ${rows.length}건`);

if (dryRun) {
  for (const r of rows.slice(0, 5)) console.dir(r, { depth: null });
  console.log(`\n(앞 5건만 보여드렸습니다. 총 ${rows.length}건)`);
  process.exit(0);
}
if (rows.length === 0) {
  console.log("올릴 게 없습니다. 먼저 npm run enrich 를 돌리셨는지 확인해주세요.");
  process.exit(0);
}

const notion = new Client({ auth: NOTION_TOKEN });
const 보낸id: number[] = [];
const 실패: string[] = [];

const 예상분 = Math.ceil((rows.length * SLEEP_MS) / 60000);
console.log(`시작합니다. 약 ${예상분}분 걸립니다.\n`);

for (const [i, row] of rows.entries()) {
  const item = {
    title: row.title,
    url: row.url,
    description: row.description,
    overview: row.overview,
    source: "Kaggle: Ultimate AI Tools Dataset",
    createdAt: row.created_at,
    category: row.category,
    priceType: row.price_type,
    isKorean: row.is_korean === 1,
  };

  try {
    await notion.pages.create(toNotionPage(NOTION_DATABASE_ID!, item));
    보낸id.push(row.id);
  } catch (e) {
    // 429(너무 빠름)면 노션이 알려준 만큼 쉬었다 딱 한 번만 다시 시도
    const status = (e as { status?: number }).status;
    if (status === 429) {
      const after = Number((e as { headers?: Record<string, string> }).headers?.["retry-after"]) || 5;
      console.warn(`  속도 제한 — ${after}초 쉬고 다시 시도: ${row.title}`);
      await sleep(after * 1000);
      try {
        await notion.pages.create(toNotionPage(NOTION_DATABASE_ID!, item));
        보낸id.push(row.id);
        continue;
      } catch (e2) {
        console.error(`  ✗ ${row.title}:`, (e2 as Error).message);
        실패.push(row.title);
        continue;
      }
    }
    console.error(`  ✗ ${row.title}:`, (e as Error).message);
    실패.push(row.title);
  } finally {
    // 50건마다 '보냈다' 표시를 남깁니다 — 중간에 끊겨도 여기까지는 안 잃어버립니다
    if (보낸id.length >= 50) 표시하기(보낸id.splice(0));
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1} / ${rows.length} …`);
    await sleep(SLEEP_MS);
  }
}

표시하기(보낸id.splice(0));

console.log(`\n끝났습니다. 성공 ${rows.length - 실패.length}건 / 실패 ${실패.length}건`);
if (실패.length) console.log("실패한 것:", 실패.slice(0, 20).join(", "), 실패.length > 20 ? "…" : "");
console.log("\n사이트는 노션을 1시간 캐시합니다. 바로 보고 싶으면 잠시 뒤 새로고침 해주세요.");

/** 노션에 올린 줄을 '전송 완료'로 바꿉니다 */
function 표시하기(ids: number[]) {
  for (let i = 0; i < ids.length; i += MARK_CHUNK) {
    const 조각 = ids.slice(i, i + MARK_CHUNK);
    d1(`UPDATE staging_tools SET is_synced = 1 WHERE id IN (${조각.join(",")})`);
  }
}
