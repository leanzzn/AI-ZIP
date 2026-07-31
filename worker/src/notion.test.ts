// 실행: node --experimental-strip-types --test worker/src/notion.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { toNotionPage } from "./notion.ts";

test("속성 구조가 노션 규격과 맞는다", () => {
  const page = toNotionPage("db-1", {
    title: "Claude",
    url: "https://claude.ai",
    description: "AI 어시스턴트",
    source: "ProductHunt",
    createdAt: "2026-07-30T00:00:00.000Z",
    category: "문서 및 글쓰기",
    priceType: "부분 무료",
    isKorean: true,
  });

  assert.deepEqual(page.parent, { database_id: "db-1" });
  assert.deepEqual(page.properties, {
    이름: { title: [{ text: { content: "Claude" } }] },
    URL: { url: "https://claude.ai" },
    Description: { rich_text: [{ text: { content: "AI 어시스턴트" } }] },
    Source: { rich_text: [{ text: { content: "ProductHunt" } }] },
    날짜: { date: { start: "2026-07-30T00:00:00.000Z" } },
    카테고리: { select: { name: "문서 및 글쓰기" } },
    가격: { select: { name: "부분 무료" } },
    한국어: { checkbox: true },
  });
});

test("AI가 분류를 못 매겼으면 노션에서도 비워둔다 (사장님이 직접 고르는 용도)", () => {
  const page = toNotionPage("db-1", { title: "탁몽", url: "", description: "", source: "Naver" });
  const props = page.properties as Record<string, unknown>;
  assert.deepEqual(props["카테고리"], { select: null });
  assert.deepEqual(props["가격"], { select: null });
  assert.deepEqual(props["한국어"], { checkbox: false });
});

test("createdAt이 없으면 현재 시각을 넣는다", () => {
  const page = toNotionPage("db-1", { title: "a", url: "https://a.com", description: "", source: "Naver" });
  const start = (page.properties as Record<string, { date: { start: string } }>)["날짜"].date.start;
  assert.ok(!Number.isNaN(Date.parse(start)));
});

test("title이 비면 저장 전에 막는다", () => {
  assert.throws(() => toNotionPage("db-1", { title: " ", url: "https://a.com", description: "", source: "Naver" }));
});

test("주소를 못 찾았으면 URL을 비워서 저장한다 (사장님이 직접 채우는 용도)", () => {
  const page = toNotionPage("db-1", { title: "탁몽", url: "", description: "설명", source: "https://blog.example" });
  assert.deepEqual((page.properties as Record<string, unknown>)["URL"], { url: null });
  // 이름·설명·출처는 그대로 들어가야 한다
  assert.deepEqual((page.properties as Record<string, unknown>)["이름"], { title: [{ text: { content: "탁몽" } }] });
});
