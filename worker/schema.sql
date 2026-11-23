-- D1 schema for the onyachamp.com download counter.
-- Apply with: npx wrangler d1 execute onyachamp-stats --remote --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS downloads (
  id    TEXT    NOT NULL,          -- file id from data/resources.json
  day   TEXT    NOT NULL,          -- UTC date, YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, day)
);
