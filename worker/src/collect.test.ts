// 실행: node --experimental-strip-types --test worker/src/collect.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateToolQuality,
  normalizeUrl,
  parseJsonArray,
  parseVerdict,
  phNodes,
  phQuery,
  siteRoot,
  stripHtml,
  toReadableUrl,
} from "./collect.ts";

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

test("PASS만 통과시키고 분류까지 받아온다", async () => {
  const 결과 = await evaluateToolQuality(
    fakeAi('{"판정":"PASS","분야":"코딩 및 개발","가격":"유료","한국어":true,"요약":"코드를 대신 써주는 편집기."}'),
    "x",
  );
  assert.deepEqual(결과, {
    pass: true,
    category: "코딩 및 개발",
    priceType: "유료",
    isKorean: true,
    // 마침표는 떼고 저장합니다 (카드에 마침표 없이 들어갑니다)
    summary: "코드를 대신 써주는 편집기",
  });

  assert.equal((await evaluateToolQuality(fakeAi('{"판정":"REJECT"}'), "x")).pass, false);
  // JSON이 아예 안 오면 저장하지 않습니다
  assert.equal((await evaluateToolQuality(fakeAi("PASS"), "x")).pass, false);
  assert.equal((await evaluateToolQuality(fakeAi(""), "x")).pass, false);
});

test("분야 여러 개를 한 번의 요청으로 묶어서 물어본다", () => {
  const q = phQuery(["artificial-intelligence", "developer-tools"]);
  // 분야마다 별칭이 따로 붙어야 응답에서 갈라 받을 수 있습니다
  assert.match(q, /t0: posts\(topic: "artificial-intelligence"/);
  assert.match(q, /t1: posts\(topic: "developer-tools"/);
  // 요구된 수집 항목이 다 들어있는지
  for (const f of ["name", "tagline", "description", "website"]) assert.match(q, new RegExp(`\\b${f}\\b`));
});

test("Product Hunt 응답에서 프로덕트만 꺼내고 겹치는 건 한 번만 센다", () => {
  const 응답 = {
    data: {
      t0: { nodes: [{ name: "Cursor", tagline: "AI code editor" }, { name: "빈칸없음" }] },
      // 분야가 달라도 같은 프로덕트가 또 올라옵니다
      t1: { nodes: [{ name: "cursor", tagline: "중복" }, { name: "  " }] },
    },
  };
  assert.deepEqual(
    phNodes(응답).map((n) => n.name),
    ["cursor", "빈칸없음"],
  );

  // 200으로 와도 errors가 있으면 빈손이 아니라 실패로 처리해야 다음 실행에서 눈치챌 수 있습니다
  assert.throws(() => phNodes({ data: null, errors: [{ message: "토큰 만료" }] }), /토큰 만료/);
  assert.deepEqual(phNodes({}), []);
});

test("AI가 지어낸 분야·가격은 기본값으로 되돌린다", () => {
  // 웹사이트 칩에 없는 분야가 들어오면 필터에서 영영 안 보이게 되므로 막습니다
  const 지어냄 = parseVerdict('{"판정":"PASS","분야":"AI 에이전트","가격":"구독제","한국어":"네"}');
  assert.deepEqual(지어냄, {
    pass: true,
    category: "일상 및 생산성",
    priceType: "부분 무료",
    isKorean: false,
    summary: "",
  });

  // 앞뒤에 설명을 붙여 보내도 JSON만 꺼내 씁니다
  const 수다 = parseVerdict('네, 판단했습니다:\n{"판정":"PASS","분야":"학업 및 연구","가격":"무료","한국어":false}\n감사합니다');
  assert.deepEqual(수다, {
    pass: true,
    category: "학업 및 연구",
    priceType: "무료",
    isKorean: false,
    summary: "",
  });

  assert.equal(parseVerdict("{깨진 JSON").pass, false);
});

test("요약을 한국어로 안 써주면 안 쓴 걸로 본다", () => {
  // 영어로 답하면 카드에 영어가 그대로 뜨므로 버립니다 (기존 설명이 그대로 남습니다)
  assert.equal(parseVerdict('{"판정":"PASS","요약":"An AI code editor"}').summary, "");
  assert.equal(parseVerdict('{"판정":"PASS","요약":"  발표자료 만들어주는 AI  "}').summary, "발표자료 만들어주는 AI");
  // 카드 한 줄을 넘기면 잘라냅니다
  assert.equal(parseVerdict(`{"판정":"PASS","요약":"${"가".repeat(60)}"}`).summary.length, 40);
});
