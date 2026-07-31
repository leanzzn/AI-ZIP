// 실행: node --experimental-strip-types --test worker/src/staging.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickKeywords } from "./collect.ts";
import type { Env } from "./notion.ts";
import { syncToNotion } from "./staging.ts";

/** 아주 얇은 가짜 D1. 실행된 SQL과 바인딩 값을 그대로 기록해둡니다 */
function fakeDb(rows: Record<string, unknown>[]) {
  const 실행된SQL: { sql: string; args: unknown[] }[] = [];
  const DB = {
    prepare(sql: string) {
      const stmt = {
        args: [] as unknown[],
        bind(...args: unknown[]) {
          stmt.args = args;
          return stmt;
        },
        async all() {
          실행된SQL.push({ sql, args: stmt.args });
          return { results: rows };
        },
        async run() {
          실행된SQL.push({ sql, args: stmt.args });
          return {};
        },
      };
      return stmt;
    },
  };
  return { env: { DB } as unknown as Env, 실행된SQL };
}

const row = (id: number, title: string) => ({
  id,
  title,
  description: "설명",
  url: `https://${title}.com`,
  source: "https://blog.example.com/1",
  created_at: "2026-07-31T00:00:00Z",
});

test("노션에 성공한 것만 전송 완료로 표시한다", async () => {
  const { env, 실행된SQL } = fakeDb([row(1, "a"), row(2, "b"), row(3, "c")]);

  const 결과 = await syncToNotion(env, async (item) => {
    if (item.title === "b") throw new Error("노션이 거절함");
    return "page-id";
  });

  assert.deepEqual(결과, { 대기: 3, 전송: 2, 실패: 1, 실패한툴: ["b"] });

  // 실패한 2번은 빼고 1, 3번만 is_synced = 1 로 바뀌어야 다음 자정에 다시 시도됩니다
  const update = 실행된SQL.find((q) => q.sql.startsWith("UPDATE"));
  assert.ok(update);
  assert.match(update.sql, /is_synced = 1 WHERE id IN \(\?,\?\)/);
  assert.deepEqual(update.args, [1, 3]);
});

test("보낼 게 없으면 UPDATE를 아예 돌리지 않는다", async () => {
  const { env, 실행된SQL } = fakeDb([]);

  const 결과 = await syncToNotion(env, async () => {
    throw new Error("불리면 안 됨");
  });

  assert.deepEqual(결과, { 대기: 0, 전송: 0, 실패: 0, 실패한툴: [] });
  assert.equal(
    실행된SQL.filter((q) => q.sql.startsWith("UPDATE")).length,
    0,
  );
});

test("검색어는 매번 목록 안에서 요청한 개수만큼만 뽑는다", () => {
  const 뽑힘 = pickKeywords(4);
  assert.equal(뽑힘.length, 4);
  assert.equal(new Set(뽑힘).size, 4, "같은 검색어가 두 번 뽑히면 안 됩니다");

  // 16개를 다 달라고 하면 16개가 나와야 합니다 (목록 크기 확인 겸)
  assert.equal(pickKeywords(100).length, 16);
});
