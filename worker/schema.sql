-- AI-ZIP 임시 보관함 (Staging)
-- 6시간마다 수집한 툴이 여기 쌓이고, 자정에 노션으로 한 번에 옮겨집니다.
--
-- 실행:
--   로컬  npx wrangler d1 execute ai-zip-staging --local  --file=worker/schema.sql
--   배포  npx wrangler d1 execute ai-zip-staging --remote --file=worker/schema.sql
--
-- 사이트에 이미 올라와 있는 툴을 수집에서 빼두려면 (수집기가 같은 툴을 또 물어오지 않게):
--   npx wrangler d1 execute ai-zip-staging --remote --file=worker/seed-curated.sql
--   └ 사이트 목록이 늘면 seed-curated.sql 을 다시 만들어서 돌리면 됩니다
--
-- 이미 만들어져 있는 보관함에 칸을 뒤늦게 추가할 때 (한 번만, 이미 있으면 에러가 뜨는데 무시하면 됩니다):
--   npx wrangler d1 execute ai-zip-staging --remote --command="ALTER TABLE staging_tools ADD COLUMN overview TEXT NOT NULL DEFAULT ''"
--   npx wrangler d1 execute ai-zip-staging --remote --command="ALTER TABLE staging_tools ADD COLUMN is_enriched INTEGER NOT NULL DEFAULT 1"

CREATE TABLE IF NOT EXISTS staging_tools (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,                    -- AI 툴 이름
  description TEXT    NOT NULL DEFAULT '',         -- 한 줄 설명
  overview    TEXT    NOT NULL DEFAULT '',         -- 상세페이지에 실릴 긴 소개글 (AI 초안, 노션에서 다듬음)
  url         TEXT    NOT NULL DEFAULT '',         -- 공식 홈페이지 (못 찾으면 빈 값)
  source      TEXT    NOT NULL DEFAULT '',         -- 뽑아온 블로그 글 주소
  category    TEXT    NOT NULL DEFAULT '',         -- AI가 매긴 분야 (웹사이트 칩과 같은 글자)
  price_type  TEXT    NOT NULL DEFAULT '',         -- AI가 매긴 가격 (무료 / 부분 무료 / 유료)
  is_korean   INTEGER NOT NULL DEFAULT 0,          -- AI가 판단한 한국어 지원 여부
  is_enriched INTEGER NOT NULL DEFAULT 1,          -- 0 = 아직 영어라 AI 번역/분류 필요 (POST /enrich 대상)
  is_synced   INTEGER NOT NULL DEFAULT 0,          -- 0 = 노션 전송 대기, 1 = 전송 완료
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 같은 툴이 두 번 쌓이지 않게. INSERT OR IGNORE 가 이 인덱스에 걸려 조용히 건너뜁니다.
-- 전송 완료(is_synced=1) 행을 지우지 않고 남겨두기 때문에 다음 수집에서도 중복이 걸러집니다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_staging_url   ON staging_tools(url) WHERE url != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_staging_title ON staging_tools(lower(title));

-- 자정 배치가 매번 훑는 조건
CREATE INDEX IF NOT EXISTS idx_staging_pending ON staging_tools(is_synced) WHERE is_synced = 0;

-- POST /enrich 가 매번 훑는 조건 (아직 영어인 것)
CREATE INDEX IF NOT EXISTS idx_staging_raw ON staging_tools(is_enriched) WHERE is_enriched = 0;
