/**
 * 보관함에 영어로 들어있는 툴을 전부 한국어로 바꾸고 분야를 매깁니다.
 *
 * 워커의 POST /enrich 를 남은 게 0이 될 때까지 계속 부릅니다.
 * (워커는 한 번에 100개까지만 처리합니다 — 요청당 바깥 호출 50번 제한 때문)
 *
 * 실행: npm run enrich
 *       npm run enrich -- --url=http://localhost:8787   ← 로컬 워커로 시험할 때
 *       npm run enrich -- --max=5                       ← 5번만 돌리고 멈추기 (맛보기)
 *
 * 중간에 끊어도 됩니다. 처리한 건 D1에 표시되니 다시 돌리면 이어서 합니다.
 */
const 기본주소 = "https://ai-zip-collector.lhj106147.workers.dev";

type 결과 = { 처리: number; 통과: number; 탈락: number; 남은개수: number; 오류?: string };

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("--url="))?.split("=")[1] ?? 기본주소;
const 최대회차 = Number(args.find((a) => a.startsWith("--max="))?.split("=")[1]) || Infinity;

let 회차 = 0;
let 통과합 = 0;
let 탈락합 = 0;

console.log(`${base} 에 요청합니다. 끝날 때까지 계속 돕니다 (Ctrl+C 로 언제든 멈춰도 됩니다)\n`);

while (회차 < 최대회차) {
  회차++;
  const res = await fetch(`${base}/enrich`, { method: "POST" });
  const body = await res.text();

  if (!res.ok) {
    console.error(`${회차}회차 실패 (${res.status}): ${body.slice(0, 300)}`);
    console.error("잠시 후 다시 시도합니다…");
    await new Promise((r) => setTimeout(r, 10_000));
    회차--;
    continue;
  }

  const r = JSON.parse(body) as 결과;

  // AI가 죽었으면 여기서 멈춥니다. 계속 돌면 멀쩡한 툴이 전부 탈락으로 기록됩니다.
  if (r.오류) {
    console.error(`\n멈췄습니다 — ${r.오류}`);
    console.error("Workers AI 한도는 하루가 지나면 초기화됩니다. 내일 다시 돌리시거나 유료로 올리세요.");
    console.error(`아직 처리 못 한 것 ${r.남은개수}건은 그대로 남아 있습니다 (다시 돌리면 이어서 합니다).`);
    break;
  }

  통과합 += r.통과;
  탈락합 += r.탈락;
  console.log(`${회차}회차 — 처리 ${r.처리} (통과 ${r.통과} / 탈락 ${r.탈락}) · 남은 것 ${r.남은개수}`);

  if (r.처리 === 0 || r.남은개수 === 0) break;
}

console.log(`\n끝났습니다. 통과 ${통과합}건 / 탈락 ${탈락합}건`);
console.log("다음: npm run push:notion  ← 노션으로 올리면 사이트에 반영됩니다");
