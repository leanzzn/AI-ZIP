// 실행: node --experimental-strip-types --test worker/src/collect.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateToolQuality, normalizeUrl, parseJsonArray, siteRoot, stripHtml, toReadableUrl } from "./collect.ts";

const fakeAi = (answer: string) => ({ run: async () => ({ response: answer }) }) as unknown as Ai;

test("네이버 응답의 태그와 특수문자를 걷어낸다", () => {
  assert.equal(stripHtml(" <b>AI</b> 툴 &amp; 서비스&#39;s "), "AI 툴 & 서비스's");
});

test("네이버 블로그 주소를 본문이 있는 주소로 바꾼다", () => {
  assert.equal(
    toReadableUrl("https://blog.naver.com/wmftask/224363365660"),
    "https://blog.naver.com/PostView.naver?blogId=wmftask&logNo=224363365660",
  );
  // 티스토리 같은 곳은 그대로 둔다
  assert.equal(toReadableUrl("https://sibauchi.tistory.com/1186"), "https://sibauchi.tistory.com/1186");
});

test("AI 답변에서 JSON 배열만 꺼낸다", () => {
  assert.deepEqual(parseJsonArray('여기 있습니다:\n```json\n[{"name":"A"}]\n```'), [{ name: "A" }]);
  assert.deepEqual(parseJsonArray("AI 서비스가 없습니다"), []);
  assert.deepEqual(parseJsonArray("[깨진 JSON"), []);
});

test("같은 툴 주소는 한 가지 모양으로 통일한다", () => {
  const canonical = "https://gamma.app";
  assert.equal(normalizeUrl("https://Gamma.app/"), canonical);
  assert.equal(normalizeUrl("  https://GAMMA.APP///  "), canonical);
  // 경로 대소문자는 의미가 있을 수 있으니 건드리지 않는다
  assert.equal(normalizeUrl("https://gamma.app/Docs"), "https://gamma.app/Docs");
});

test("검색 결과 주소에서 도메인 뿌리만 남긴다", () => {
  assert.equal(siteRoot("https://gemini.google.com/?hl=ko"), "https://gemini.google.com");
  assert.equal(siteRoot("https://gamma.app/ko/pricing"), "https://gamma.app");
  assert.equal(siteRoot("주소아님"), "");
});

test("PASS만 통과시킨다", async () => {
  assert.equal(await evaluateToolQuality(fakeAi("PASS"), "x"), true);
  assert.equal(await evaluateToolQuality(fakeAi(" reject "), "x"), false);
  assert.equal(await evaluateToolQuality(fakeAi("PASS 또는 REJECT"), "x"), false);
  assert.equal(await evaluateToolQuality(fakeAi(""), "x"), false);
});
