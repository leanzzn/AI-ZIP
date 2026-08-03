// 실행: node --experimental-strip-types --test worker/src/collect.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateTools,
  isTurn,
  normalizeUrl,
  parseDisquietList,
  parseDisquietProduct,
  parseHnHits,
  parseJsonArray,
  parseVerdicts,
  phNodes,
  phQuery,
  siteRoot,
  splitShowHn,
  stripHtml,
  toReadableUrl,
} from "./collect.ts";

const fakeAi = (answer: unknown) => ({ run: async () => ({ response: answer }) }) as unknown as Ai;

/** 툴 하나만 물어보는 경우 (예전 테스트를 그대로 쓰기 위한 도우미) */
const 하나판정 = async (answer: unknown) => (await evaluateTools(fakeAi(answer), ["x"]))[0];
const 하나읽기 = (raw: string) => parseVerdicts(raw, 1)[0];

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
  const 결과 = await 하나판정(
    '{"판정":"PASS","분야":"코딩 및 개발","가격":"유료","한국어":true,"요약":"코드를 대신 써주는 편집기."}',
  );
  assert.deepEqual(결과, {
    pass: true,
    category: "코딩 및 개발",
    priceType: "유료",
    isKorean: true,
    // 마침표는 떼고 저장합니다 (카드에 마침표 없이 들어갑니다)
    summary: "코드를 대신 써주는 편집기",
    overview: "",
  });

  assert.equal((await 하나판정('{"판정":"REJECT"}')).pass, false);
  // JSON이 아예 안 오면 저장하지 않습니다
  assert.equal((await 하나판정("PASS")).pass, false);
  assert.equal((await 하나판정("")).pass, false);
});

test("여러 개를 한 번에 물어보고 번호대로 돌려받는다", async () => {
  // 툴 12개를 넣으면 5개씩 3번만 물어봐야 합니다 (예전엔 12번 불렀습니다)
  let 부른횟수 = 0;
  const ai = {
    run: async () => {
      부른횟수 += 1;
      return { response: '{"번호":1,"판정":"PASS","분야":"코딩 및 개발","가격":"무료","한국어":true,"요약":"코드 도구"}' };
    },
  } as unknown as Ai;

  const 결과 = await evaluateTools(ai, Array.from({ length: 12 }, (_, i) => `툴${i}`));
  assert.equal(부른횟수, 3);
  assert.equal(결과.length, 12, "넣은 개수만큼 항상 돌려줘야 자리가 안 밀립니다");
  // 각 묶음의 1번만 PASS, 답이 안 온 자리는 REJECT로 남습니다
  assert.deepEqual(
    결과.map((v) => v.pass),
    [true, false, false, false, false, true, false, false, false, false, true, false],
  );
});

test("묶음 하나가 실패해도 나머지 묶음은 그대로 간다", async () => {
  let 부른횟수 = 0;
  const ai = {
    run: async () => {
      부른횟수 += 1;
      if (부른횟수 === 1) throw new Error("AI가 뻗음");
      return { response: '{"번호":1,"판정":"PASS","분야":"코딩 및 개발","가격":"무료","한국어":true,"요약":"코드 도구"}' };
    },
  } as unknown as Ai;

  const 결과 = await evaluateTools(ai, Array.from({ length: 7 }, (_, i) => `툴${i}`));
  assert.equal(결과.length, 7);
  // 첫 묶음(5개)은 통째로 저장 안 됨, 두 번째 묶음의 1번은 살아남아야 합니다
  assert.deepEqual(
    결과.map((v) => v.pass),
    [false, false, false, false, false, true, false],
  );
});

test("답이 중간에 잘려도 앞의 판정은 살린다", () => {
  // AI 답이 길어지면 마지막 줄이 잘려서 옵니다. 그 한 줄만 버리고 나머지는 써야 합니다
  const 잘린답 =
    '{"번호":1,"판정":"PASS","분야":"코딩 및 개발","가격":"무료","한국어":true,"요약":"코드 도구"}\n' +
    '{"번호":2,"판정":"REJECT"}\n' +
    '{"번호":3,"판정":"PASS","분야":"이미지 및 영상","가격":"유료","한국어":false,"요약":"영상 만드';

  const 결과 = parseVerdicts(잘린답, 3);
  assert.equal(결과[0].pass, true);
  assert.equal(결과[0].summary, "코드 도구");
  assert.equal(결과[1].pass, false);
  assert.equal(결과[2].pass, false, "잘린 줄은 저장하지 않습니다");

  // 번호를 순서 없이 보내도 제자리에 넣습니다
  const 뒤죽박죽 = parseVerdicts('{"번호":2,"판정":"PASS","요약":"둘째"}\n{"번호":1,"판정":"REJECT"}', 2);
  assert.equal(뒤죽박죽[0].pass, false);
  assert.equal(뒤죽박죽[1].summary, "둘째");
});

test("AI가 글자가 아닌 걸 돌려줘도 판정이 죽지 않는다", async () => {
  // 실제로 이것 때문에 판정이 통째로 실패해서 보관함에 아무것도 안 쌓이고 있었습니다
  const 객체로옴 = await 하나판정({
    판정: "PASS",
    분야: "코딩 및 개발",
    가격: "무료",
    한국어: true,
    요약: "코드를 써주는 도구",
  });
  assert.deepEqual(객체로옴, {
    pass: true,
    category: "코딩 및 개발",
    priceType: "무료",
    isKorean: true,
    summary: "코드를 써주는 도구",
    overview: "",
  });

  // 아예 못 알아볼 값이 와도 에러 대신 REJECT로 떨어져야 합니다
  assert.equal((await 하나판정(12345)).pass, false);
  assert.equal((await 하나판정(null)).pass, false);
});

test("분야와 인기 순위를 한 번의 요청으로 묶어서 물어본다", () => {
  const q = phQuery(["artificial-intelligence", "developer-tools"]);
  // 분야마다 별칭이 따로 붙어야 응답에서 갈라 받을 수 있습니다
  assert.match(q, /t0: posts\(topic: "artificial-intelligence"/);
  assert.match(q, /t1: posts\(topic: "developer-tools"/);
  // 인기 순위는 분야를 안 걸고 표 순으로 (신생 툴이 여기 뜹니다)
  assert.match(q, /rank: posts\(postedAfter: \$postedAfter, order: VOTES/);
  assert.doesNotMatch(q, /rank: posts\([^)]*topic:/);
  // 요구된 수집 항목이 다 들어있는지
  for (const f of ["name", "tagline", "description", "website"]) assert.match(q, new RegExp(`\\b${f}\\b`));
});

test("겹치는 프로덕트는 한 번만 세고 표 많은 순으로 세운다", () => {
  const 응답 = {
    data: {
      t0: { nodes: [{ name: "Cursor", tagline: "AI code editor", votesCount: 30 }, { name: "표없음" }] },
      // 분야와 순위에 같은 프로덕트가 겹쳐 나옵니다 (양쪽에서 같은 내용이 옵니다)
      rank: {
        nodes: [
          { name: "Cursor", tagline: "AI code editor", votesCount: 30 },
          { name: "인기툴", votesCount: 500 },
          { name: "  " },
        ],
      },
    },
  };
  assert.deepEqual(
    phNodes(응답).map((n) => n.name),
    ["인기툴", "Cursor", "표없음"],
  );

  // 200으로 와도 errors가 있으면 빈손이 아니라 실패로 처리해야 다음 실행에서 눈치챌 수 있습니다
  assert.throws(() => phNodes({ data: null, errors: [{ message: "토큰 만료" }] }), /토큰 만료/);
  assert.deepEqual(phNodes({}), []);
});

test("AI가 지어낸 분야·가격은 기본값으로 되돌린다", () => {
  // 웹사이트 칩에 없는 분야가 들어오면 필터에서 영영 안 보이게 되므로 막습니다
  const 지어냄 = 하나읽기('{"판정":"PASS","분야":"AI 에이전트","가격":"구독제","한국어":"네"}');
  assert.deepEqual(지어냄, {
    pass: true,
    category: "일상 및 생산성",
    priceType: "부분 무료",
    isKorean: false,
    summary: "",
    overview: "",
  });

  // 앞뒤에 설명을 붙여 보내도 JSON만 꺼내 씁니다
  const 수다 = 하나읽기('네, 판단했습니다:\n{"판정":"PASS","분야":"학업 및 연구","가격":"무료","한국어":false}\n감사합니다');
  assert.deepEqual(수다, {
    pass: true,
    category: "학업 및 연구",
    priceType: "무료",
    isKorean: false,
    summary: "",
    overview: "",
  });

  assert.equal(하나읽기("{깨진 JSON").pass, false);
});

// 아래 두 개는 실제 disquiet.io 화면에서 그대로 떼어온 조각입니다.
// 디스콰이엇이 화면을 바꾸면 이 테스트가 먼저 깨져서 알아챌 수 있습니다.
const 디스콰이엇_목록 = `
<div class="card group relative"><div class="card-body flex-row items-center gap-4">
  <img class="w-12 h-12" src="https://disquiet.io/rails/x.png" />
  <div class="flex-1 min-w-0"><div class="flex items-center gap-2 min-w-0">
    <h3 class="font-medium text-base-content truncate min-w-0">
      <a class="group-hover:underline before:absolute" href="/products/itinr">Itinr</a>
    </h3></div>
    <p class="text-sm text-base-content/60 truncate mt-0.5">여행 일정을 AI가 정리해주는 앱 &amp; 오프라인 지원</p>
  </div></div></div>
<div class="card group relative"><div class="card-body flex-row items-center gap-4">
  <div class="flex-1 min-w-0">
    <h3 class="font-medium"><a href="/products/wehome">위홈</a></h3>
    <p class="text-sm text-base-content/60 truncate mt-0.5">동네 사람들과 물건을 나눠 쓰는 서비스</p>
  </div></div></div>`;

const 디스콰이엇_상세 = `
<a data-action="visit-tracker#track" href="https://www.jasminestudios.net/itinr/">
  <svg viewBox="0 0 24 24"></svg> 방문하기 </a>
<div class="mt-8 pt-8 border-t"><h2 class="text-base-content/60 mb-3">소개</h2>
<div class="prose prose-neutral leading-relaxed whitespace-pre-wrap">안녕하세요, 1인 개발로 만들고 있습니다.<br/>예약 메일을 붙여넣으면 AI가 날짜별 일정으로 정리합니다.</div></div>`;

test("디스콰이엇 목록에서 이름과 한 줄 소개를 뽑는다", () => {
  const 목록 = parseDisquietList(디스콰이엇_목록);
  assert.deepEqual(목록, [
    { slug: "itinr", name: "Itinr", tagline: "여행 일정을 AI가 정리해주는 앱 & 오프라인 지원" },
    { slug: "wehome", name: "위홈", tagline: "동네 사람들과 물건을 나눠 쓰는 서비스" },
  ]);

  // 화면이 통째로 바뀌어도 에러 대신 빈손이어야 나머지 수집이 계속 돕니다
  assert.deepEqual(parseDisquietList("<html>없음</html>"), []);
});

test("디스콰이엇 상세에서 공식 주소와 긴 소개글을 뽑는다", () => {
  const { website, detail } = parseDisquietProduct(디스콰이엇_상세);
  // 주소는 안쪽 경로까지 살립니다 (개인 사이트 아래 딸린 제품이 많습니다)
  assert.equal(website, "https://www.jasminestudios.net/itinr/");
  assert.match(detail, /^안녕하세요, 1인 개발로 만들고 있습니다\./);
  assert.match(detail, /AI가 날짜별 일정으로 정리합니다\.$/);

  // "방문하기"가 없는 제품은 주소를 비워둡니다 (노션에서 채우면 됩니다)
  assert.equal(parseDisquietProduct("<div>주소 없음</div>").website, "");
  // 디스콰이엇 안쪽 링크가 잡히면 공식 주소로 치지 않습니다
  assert.equal(
    parseDisquietProduct('<a href="https://disquiet.io/products/x">방문하기</a>').website,
    "",
  );
});

test("상세페이지에 실릴 긴 소개글을 같이 받아온다", () => {
  const 긴글 = "코드를 짤 때 옆에서 채워주는 도구입니다. 반복되는 코드를 넘길 때 좋습니다. 기본은 무료입니다.";
  assert.equal(하나읽기(`{"판정":"PASS","소개":"  ${긴글}  "}`).overview, 긴글);

  // 영어로만 써주면 상세페이지에 영어가 그대로 뜨므로 버립니다 (노션에서 직접 채우시면 됩니다)
  assert.equal(하나읽기('{"판정":"PASS","소개":"An AI code editor for everyone."}').overview, "");

  // 노션 한 칸(2000자)을 넘기면 잘라냅니다
  assert.equal(하나읽기(`{"판정":"PASS","소개":"${"가".repeat(2500)}"}`).overview.length, 2000);
});

test("수집처마다 부르는 주기를 다르게 준다", () => {
  const 크론시각 = (h: number) => new Date(Date.UTC(2026, 7, 3, h));

  // 크론은 UTC 0·6·12·18시에 웁니다. 1이면 네 번 다 부릅니다
  assert.deepEqual(
    [0, 6, 12, 18].map((h) => isTurn(1, 크론시각(h))),
    [true, true, true, true],
  );
  // 2면 12시간마다 (하루 두 번)
  assert.deepEqual(
    [0, 6, 12, 18].map((h) => isTurn(2, 크론시각(h))),
    [true, false, true, false],
  );
  // 4면 하루 한 번
  assert.deepEqual(
    [0, 6, 12, 18].map((h) => isTurn(4, 크론시각(h))),
    [true, false, false, false],
  );
});

test("Show HN 제목에서 서비스 이름만 떼어낸다", () => {
  // 제목을 통째로 저장하면 보관함 이름이 "Show HN: ..." 로 쌓여서 중복 걸러내기가 뚫립니다
  assert.deepEqual(splitShowHn("Show HN: Itinr – AI trip planner"), {
    name: "Itinr",
    tagline: "AI trip planner",
  });
  // 구분 기호가 여러 가지라 다 받아야 합니다 (-, –, —, |, 쉼표, 쌍점)
  assert.equal(splitShowHn("Show HN: Rewind - an AI note taker").name, "Rewind");
  assert.equal(splitShowHn("Show HN: Vocode, an AI voice agent").tagline, "an AI voice agent");
  assert.equal(splitShowHn("Show HN: AI Visibility: Check whether ChatGPT recommends you").name, "AI Visibility");
  // 붙여 쓴 대시는 자르면 안 됩니다 ("AI-Powered ..." 가 "AI" 로 잘리던 자리)
  assert.equal(
    splitShowHn("Show HN: An AI-Powered Widget for Collecting Feedback").name,
    "An AI-Powered Widget for Collecting Feedback",
  );
  // 자를 데가 없으면 통째로 이름 (짧은 게 없는 것보단 낫습니다)
  assert.deepEqual(splitShowHn("Show HN: I built an AI that reads my email"), {
    name: "I built an AI that reads my email",
    tagline: "",
  });
});

test("해커뉴스 응답에서 이름·주소·본문을 뽑는다", () => {
  const 응답 = {
    hits: [
      {
        objectID: "42",
        title: "Show HN: Itinr – AI trip planner",
        url: "https://itinr.app/",
        story_text: "예약 메일을 붙여넣으면 AI가 정리합니다",
      },
      // 링크를 안 단 글은 주소를 비워둡니다 (노션에서 직접 채우는 자리)
      { objectID: "43", title: "Show HN: Vocode, an AI voice agent", url: null, story_text: null },
      // 제목이나 id가 없는 건 버립니다 (응답 모양이 바뀌어도 에러 대신 빈손)
      { objectID: "44", title: "" },
      { title: "id 없음" },
    ],
  };

  assert.deepEqual(parseHnHits(응답), [
    {
      title: "Itinr",
      url: "https://itinr.app",
      description: "AI trip planner",
      source: "https://news.ycombinator.com/item?id=42",
      detail: "예약 메일을 붙여넣으면 AI가 정리합니다",
    },
    {
      title: "Vocode",
      url: "",
      description: "an AI voice agent",
      source: "https://news.ycombinator.com/item?id=43",
      detail: "",
    },
  ]);

  assert.deepEqual(parseHnHits({}), []);
  assert.deepEqual(parseHnHits(null), []);
});

test("요약을 한국어로 안 써주면 안 쓴 걸로 본다", () => {
  // 영어로 답하면 카드에 영어가 그대로 뜨므로 버립니다 (기존 설명이 그대로 남습니다)
  assert.equal(하나읽기('{"판정":"PASS","요약":"An AI code editor"}').summary, "");
  assert.equal(하나읽기('{"판정":"PASS","요약":"  발표자료 만들어주는 AI  "}').summary, "발표자료 만들어주는 AI");
  // 카드 한 줄을 넘기면 잘라냅니다
  assert.equal(하나읽기(`{"판정":"PASS","요약":"${"가".repeat(60)}"}`).summary.length, 40);
});
