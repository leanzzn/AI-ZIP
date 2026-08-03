import { Hono } from "hono";
import { collect } from "./collect";
import { enrich } from "./enrich";
import { type Env } from "./notion";
import { stageTools, syncToNotion } from "./staging";

/**
 * wrangler.toml [triggers] 에 적힌 크론. 어느 게 울렸는지 보고 할 일을 고릅니다.
 * 이 값을 바꾸면 wrangler.toml 도 똑같이 바꿔주세요.
 */
const SYNC_CRON = "0 * * * *"; // 매시 정각: 보관함 → 노션 (한 번에 40건)
const ENRICH_CRON = "30 */3 * * *"; // 3시간마다: 영어로 들어온 툴을 한국어로 번역 (한 번에 100건)

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true }));

// 크론을 기다리지 않고 수동으로 한 번 돌려보는 용도
app.post("/collect", async (c) => c.json(await runCollect(c.env)));
app.post("/sync", async (c) => c.json(await syncToNotion(c.env)));

// 영어로 들어온 툴을 한국어로 바꾸고 분야를 매깁니다 (scripts/enrich-all.ts 가 0이 될 때까지 부릅니다)
app.post("/enrich", async (c) => c.json(await enrich(c.env, Number(c.req.query("limit")) || undefined)));

// 임시 보관함에 지금 뭐가 쌓여있는지 확인용
app.get("/staging", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, title, url, is_synced, created_at FROM staging_tools ORDER BY id DESC LIMIT 50",
  ).all();
  return c.json(results);
});

// 실패하면 "Internal Server Error" 대신 왜 실패했는지 그대로 보여줍니다
app.onError((err, c) => c.json({ ok: false, error: err.message }, 500));

/**
 * 6시간마다: 네이버 검색 + 디스콰이엇 + 해커뉴스 Show HN, 그리고 12시간마다 Product Hunt
 *   → AI 툴 추출 → 품질 판정 → 임시 보관함(D1)에 한 번에 저장 (is_synced = 0)
 * 네 곳을 같이 출발시키는 부분과 수집처별 주기(EVERY_PH)는 collect() 안에 있습니다
 * (한 곳이 죽어도 나머지는 그대로 갑니다).
 */
async function runCollect(env: Env) {
  const { blogs, newBlogs, ph, dq, hn, tools, passed, noUrl } = await collect(env);
  const staged = await stageTools(passed, env);

  return {
    검색된블로그: blogs,
    안읽은블로그: newBlogs,
    해외프로덕트: ph,
    디스콰이엇: dq,
    해커뉴스: hn,
    찾은툴: tools,
    AI통과: passed.length,
    보관함저장: staged,
    이미있던툴: passed.length - staged,
    주소비어있음: noUrl,
  };
}

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    /**
     * 크론이 여러 개 겹치는 시각에도 Cloudflare가 각각 한 번씩 따로 불러줍니다.
     * 호출 한도(요청당 50번)도 각각 따로 세기 때문에 셋이 서로 방해하지 않습니다.
     *
     * 번역은 3시간마다 100건씩(하루 800건) 돕니다. 더 자주 돌리면 Workers AI 하루 한도를
     * 다 써버려서 정작 수집 쪽 판정이 멈춥니다. 한도가 떨어지면 enrich 가 저장을 건너뛰고
     * 멈추니(오류를 돌려줍니다) 데이터가 망가지지는 않습니다.
     */
    const [이름, 할일] =
      event.cron === SYNC_CRON
        ? (["노션 전송", () => syncToNotion(env)] as const)
        : event.cron === ENRICH_CRON
          ? (["번역", () => enrich(env)] as const)
          : (["수집", () => runCollect(env)] as const);

    ctx.waitUntil(
      할일()
        .then((r) => console.log(`${이름} 완료`, r))
        .catch((e) => console.error(`${이름} 실패`, e)),
    );
  },
} satisfies ExportedHandler<Env>;
