/**
 * Kaggle "Ultimate AI Tools Dataset" CSV → 임시 보관함(D1) 넣을 SQL 파일 만들기
 * (한 번만 쓰는 스크립트)
 *
 * 노션에 직접 넣지 않습니다. D1 보관함에 넣어두면:
 *   · 몇 초면 끝납니다 (노션 직행은 25분)
 *   · 같은 툴이 두 번 안 들어갑니다 (보관함이 이름/주소로 알아서 걸러줍니다)
 *   · 수집기가 이미 아는 툴을 다시 물어오지 않습니다
 *
 * 실행:
 *   npm run seed:sql -- --dry-run     ← 먼저 이걸로 매핑 확인 (파일 안 만듦)
 *   npm run seed:sql -- --limit=200   ← 앞 200건만
 *   npm run seed:sql                  ← 전체
 *   npm run seed:sql -- --self-check  ← 스크립트 자체가 멀쩡한지 확인
 *
 * 만들어진 SQL 파일을 실제로 넣는 명령은 파일 만든 뒤에 화면에 찍어줍니다.
 */
import { readFileSync, writeFileSync } from "node:fs";
// csv-parse 는 아래 main() 안에서 불러옵니다 — --self-check 는 아무것도 설치 안 해도 돌아가게

const CSV_PATH = "scripts/data/futuretools_all_3539_tools.csv";
const OUT_PATH = "worker/seed-kaggle.sql";

// ────────────────────────────────────────────────────────────────
// TODO: 사장님이 직접 맞추는 곳 — CSV 열 이름
//
// --dry-run 으로 한 번 돌리면 맨 위에 "CSV 열 이름: ..." 이 찍힙니다.
// 거기 나온 이름 중 맞는 걸 아래 각 줄의 [] 안에 넣어주세요.
// 여러 개 적어두면 CSV에 실제로 있는 첫 번째 걸 씁니다. 없으면 그냥 비웁니다.
// ────────────────────────────────────────────────────────────────
const 열이름 = {
  이름: ["Tool Name", "tool_name", "name", "Name", "AI Tool Name"],
  설명: ["Short Description", "description", "Description", "short_description", "Summary"],
  // External Link = 툴 실제 홈페이지로 넘겨주는 주소. Internal Link 는 futuretools.io 소개 페이지라 안 씁니다
  주소: ["External Link", "url", "URL", "website", "Website", "link", "Link"],
  가격: ["Pricing", "pricing", "price", "Price", "pricing_model"],
  긴소개: ["Long Description", "overview", "Overview", "long_description", "details", "features"],
  // 카테고리는 일부러 안 씁니다 — 아래 toRow() 주석 참고
};

/** CSV 가격 표기 → 사이트에서 쓰는 3가지. 모르면 비웁니다(나중에 직접 고르는 자리) */
function 가격변환(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("freemium") || s.includes("free trial") || s.includes("부분")) return "부분 무료";
  if (s.includes("free")) return "무료";
  if (s.includes("paid") || s.includes("subscription") || s.includes("$")) return "유료";
  return ""; // 억지로 채우지 않음
}

// ────────────────────────────────────────────────────────────────

type Row = Record<string, string>;
type Staged = { title: string; url: string; description: string; overview: string; price_type: string };

/** 후보 열 이름 중 실제로 값이 있는 첫 번째를 꺼냅니다. 없으면 빈 문자열 */
export function pick(row: Row, 후보: string[]): string {
  for (const key of 후보) {
    const v = row[key];
    if (typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "nan") return v.trim();
  }
  return "";
}

/** SQL 문자열로 안전하게 감싸기. 홑따옴표는 두 개로, 줄바꿈은 공백으로 (한 줄에 한 문장 유지) */
export function q(v: string): string {
  return "'" + v.replace(/\r?\n/g, " ").replace(/'/g, "''") + "'";
}

export function toRow(row: Row): Staged | null {
  const title = pick(row, 열이름.이름);
  if (!title) return null; // 이름 없는 줄은 통째로 버립니다

  return {
    title,
    url: pick(row, 열이름.주소),
    description: pick(row, 열이름.설명),
    overview: pick(row, 열이름.긴소개),
    price_type: 가격변환(pick(row, 열이름.가격)),
    // 카테고리: CSV의 영어 분류가 사이트 6개 분류와 안 맞아서 비워둡니다.
    // 한국어 여부: CSV에 정보가 없어서 비웁니다(0).
  };
}

/**
 * is_enriched = 0 : 아직 영어라 AI 번역/분류가 필요하다는 표시 (POST /enrich 가 집어갑니다)
 * is_synced   = 0 : 번역이 끝나면 노션으로 보낼 대상
 */
function toSql(r: Staged): string {
  return (
    "INSERT OR IGNORE INTO staging_tools (title, url, description, overview, price_type, source, is_enriched, is_synced) VALUES (" +
    [q(r.title), q(r.url), q(r.description), q(r.overview), q(r.price_type), q("Kaggle: Ultimate AI Tools Dataset"), 0, 0].join(", ") +
    ");"
  );
}

/** 스스로 확인 — SQL 따옴표 처리가 깨지면 여기서 걸립니다 */
function selfCheck() {
  const assert = (조건: boolean, 설명: string) => {
    if (!조건) throw new Error("자체 확인 실패: " + 설명);
  };
  assert(q("It's a tool") === "'It''s a tool'", "홑따옴표를 두 개로 못 바꿈");
  assert(q("a\nb") === "'a b'", "줄바꿈을 공백으로 못 바꿈");
  assert(q("'; DROP TABLE staging_tools; --") === "'''; DROP TABLE staging_tools; --'", "따옴표 탈출 뚫림");
  assert(pick({ a: "nan", b: " x " }, ["a", "b"]) === "x", "nan 건너뛰기 / 공백 정리 안 됨");
  assert(toRow({ name: "" }) === null, "이름 없는 줄을 안 버림");
  assert(toSql({ title: "T", url: "", description: "", overview: "", price_type: "" }).endsWith(", 0, 0);"), "is_enriched/is_synced 안 들어감");
  console.log("자체 확인 통과");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-check")) return selfCheck();

  const { parse } = await import("csv-parse/sync");
  const dryRun = args.includes("--dry-run");
  const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) || Infinity;

  const rows: Row[] = parse(readFileSync(CSV_PATH), { columns: true, skip_empty_lines: true, bom: true });
  console.log(`CSV ${rows.length}줄 읽음`);
  console.log("CSV 열 이름:", Object.keys(rows[0] ?? {}).join(" | "));

  const items = rows.map(toRow).filter((r): r is Staged => r !== null).slice(0, limit);
  console.log(`넣을 대상 ${items.length}건 (이름 없는 줄 ${rows.length - items.length}건 버림)`);

  if (dryRun) {
    console.log("\n앞 3건이 이렇게 들어갑니다:\n");
    for (const r of items.slice(0, 3)) console.dir(r, { depth: null });
    console.log("\n매핑이 맞으면 --dry-run 빼고 다시 실행하세요.");
    return;
  }

  const 머리말 = [
    "-- Kaggle 'Ultimate AI Tools Dataset' 을 보관함에 넣습니다. scripts/seed-to-d1.ts 가 만든 파일입니다.",
    `-- 만든 날: ${new Date().toISOString().slice(0, 10)} / ${items.length}건`,
    "-- is_enriched = 0 : 아직 영어. 다음 단계(npm run enrich)에서 AI가 한국어로 바꾸고 분야를 매깁니다.",
    "",
  ].join("\n");

  writeFileSync(OUT_PATH, 머리말 + items.map(toSql).join("\n") + "\n");

  console.log(`\n${OUT_PATH} 만들었습니다 (${items.length}건).\n다음 순서로 진행하세요:`);
  // 이 wrangler 버전에는 d1 import 가 없어서 execute --file 로 넣습니다
  console.log(`  1) npx wrangler d1 execute ai-zip-staging --remote -c worker/wrangler.toml --file=${OUT_PATH}`);
  console.log("  2) npm run enrich          ← AI가 한국어 번역 + 분야 분류 (오래 걸립니다)");
  console.log("  3) npm run push:notion     ← 노션으로 올리기 → 사이트에 반영");
}

main();
