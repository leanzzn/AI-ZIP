-- 사이트에 이미 있는 툴을 보관함에 '처리 완료'로 표시해 둡니다.
-- 수집기가 이 이름을 다시 물어와도 건너뛰고, 노션에도 중복으로 올라가지 않습니다.
-- (사이트 목록이 늘면 이 파일을 다시 만들어 돌리면 됩니다)

INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('ChatGPT', 'https://chatgpt.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Midjourney', 'https://www.midjourney.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Claude', 'https://claude.ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Gemini', 'https://gemini.google.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Perplexity', 'https://www.perplexity.ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Canva AI', 'https://www.canva.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('GitHub Copilot', 'https://github.com/features/copilot', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('DALL·E', 'https://openai.com/dall-e-3', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('뤼튼', 'https://wrtn.ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Cursor', 'https://cursor.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('클로바노트', 'https://clovanote.naver.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Notion AI', 'https://www.notion.so/product/ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Suno', 'https://suno.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Gamma', 'https://gamma.app', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Runway', 'https://runwayml.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Grammarly', 'https://www.grammarly.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('v0', 'https://v0.dev', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Replit', 'https://replit.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Leonardo', 'https://leonardo.ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Elicit', 'https://elicit.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('SciSpace', 'https://scispace.com', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Jasper', 'https://www.jasper.ai', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Consensus', 'https://consensus.app', '사이트 기본 목록', 1);

-- 주소가 이미 다른 이름으로 들어 있어서 막힌 것들. 이름만이라도 걸리게 넣어둡니다
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Cursor', '', '사이트 기본 목록', 1);
INSERT OR IGNORE INTO staging_tools (title, url, source, is_synced) VALUES ('Gamma', '', '사이트 기본 목록', 1);
