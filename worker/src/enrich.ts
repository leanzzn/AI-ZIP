import { evaluateTools } from "./collect.ts";
import type { Env } from "./notion.ts";

/**
 * 보관함에 영어로 들어온 툴(Kaggle 등)을 AI에게 넘겨 한국어로 바꾸고 분야를 매깁니다.
 *
 * 수집기가 쓰는 evaluateTools() 를 그대로 씁니다 — 한국어 요약·분야·가격·한국어여부·소개글을
 * 한 번에 받아옵니다. 판정에서 떨어진 툴(REJECT)은 지우지 않고 '처리 완료 + 전송 안 함'으로
 * 남겨둡니다. 그래야 수집기가 나중에 같은 툴을 또 물어오지 않습니다.
 *
 * 워커는 요청 하나당 바깥 호출이 50번까지라, 5개씩 묶어 물어보는 걸 감안해 한 번에 100개
 * (= AI 호출 20번)까지만 처리합니다. 남은 개수를 돌려주니 0이 될 때까지 다시 부르면 됩니다.
 */
const 한번에 = 100;
const 최대 = 200; // AI 호출 40번. 이 위로는 호출 한도(50)에 걸립니다

type 대기행 = { id: number; title: string; description: string; overview: string };

export async function enrich(env: Env, limit = 한번에) {
  const 개수 = Math.min(Math.max(limit, 1), 최대);

  const { results } = await env.DB.prepare(
    "SELECT id, title, description, overview FROM staging_tools WHERE is_enriched = 0 ORDER BY id LIMIT ?",
  )
    .bind(개수)
    .all<대기행>();

  if (results.length === 0) return { 처리: 0, 통과: 0, 탈락: 0, 남은개수: 0 };

  const verdicts = await evaluateTools(
    env.AI,
    results.map((r) => [r.title, r.description, r.overview].filter(Boolean).join("\n")),
  );

  /**
   * AI 호출이 실패하면 evaluateTools 가 전부 '탈락'으로 돌려줍니다 — 진짜 탈락과 구분이 안 됩니다.
   * 실제 데이터에서 20개가 내리 다 탈락일 확률은 없다시피 하니(실측 통과율 85~95%),
   * 그런 결과가 오면 AI가 고장난 걸로 보고 **아무것도 저장하지 않고** 멈춥니다.
   * 저장해버리면 멀쩡한 툴이 영영 탈락으로 굳어버립니다 (한 번 이렇게 2,000건을 날릴 뻔했습니다).
   */
  const 통과수 = verdicts.filter((v) => v.pass).length;
  if (통과수 === 0 && results.length >= 20) {
    return {
      오류: "AI가 응답하지 않습니다 (Workers AI 한도 소진일 가능성이 큽니다). 아무것도 저장하지 않았습니다.",
      처리: 0,
      통과: 0,
      탈락: 0,
      남은개수: results.length,
    };
  }

  const 갱신 = env.DB.prepare(
    `UPDATE staging_tools
        SET description = ?, overview = ?, category = ?, price_type = ?, is_korean = ?,
            is_enriched = 1, is_synced = ?
      WHERE id = ?`,
  );

  await env.DB.batch(
    results.map((row, i) => {
      const v = verdicts[i];
      return 갱신.bind(
        // AI가 영어로 답했으면(요약이 비면) 원래 설명을 그대로 둡니다
        v.pass && v.summary ? v.summary : row.description,
        v.pass && v.overview ? v.overview : row.overview,
        v.pass ? v.category : "",
        v.pass ? v.priceType : "",
        v.pass && v.isKorean ? 1 : 0,
        // 떨어진 건 is_synced = 1 로 박아둬서 노션에 안 올라갑니다 (이름은 중복 방지용으로 남음)
        v.pass ? 0 : 1,
        row.id,
      );
    }),
  );

  const 남은 = await env.DB.prepare("SELECT count(*) AS n FROM staging_tools WHERE is_enriched = 0").first<{
    n: number;
  }>();

  return { 처리: results.length, 통과: 통과수, 탈락: results.length - 통과수, 남은개수: 남은?.n ?? 0 };
}
