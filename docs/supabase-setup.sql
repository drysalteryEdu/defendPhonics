-- ════════════════════════════════════════════════════════
-- 拼读保卫战 Supabase 日志表初始化
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ════════════════════════════════════════════════════════

-- 1. 建表
CREATE TABLE IF NOT EXISTS phonics_defend_logs (
  id          bigserial        PRIMARY KEY,
  session_id  text             NOT NULL,
  event_type  text             NOT NULL,   -- place_tile / synthesize_hero / ...
  wave        integer,
  level       text,                        -- 已选单元 JSON 字符串
  details     jsonb            DEFAULT '{}',
  client_time timestamptz      NOT NULL,
  created_at  timestamptz      DEFAULT now()
);

-- 按时间字段建索引，供定时清理和查询使用
CREATE INDEX IF NOT EXISTS idx_logs_client_time ON phonics_defend_logs(client_time);
CREATE INDEX IF NOT EXISTS idx_logs_event_type  ON phonics_defend_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_session_id  ON phonics_defend_logs(session_id);

-- 2. 行级安全 (RLS)：只允许写入，不允许外部读取
ALTER TABLE phonics_defend_logs ENABLE ROW LEVEL SECURITY;

-- 匿名用户只能 INSERT
CREATE POLICY "anon insert only"
  ON phonics_defend_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 3. ════ 日志保留 6 个月 ════
--    使用 pg_cron 每天凌晨 3:00 UTC 自动清理

-- 启用 pg_cron 扩展（Supabase 已内置，直接启用即可）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 注册定时任务：每天 03:00 UTC 删除 6 个月前的记录
SELECT cron.schedule(
  'phonics-log-cleanup-6m',          -- 任务名，唯一
  '0 3 * * *',                       -- cron 表达式：每天 03:00 UTC
  $$
    DELETE FROM phonics_defend_logs
    WHERE client_time < NOW() - INTERVAL '6 months';
  $$
);

-- 查看已注册的定时任务（确认）
-- SELECT * FROM cron.job WHERE jobname = 'phonics-log-cleanup-6m';

-- 手动触发一次清理（测试用）
-- DELETE FROM phonics_defend_logs WHERE client_time < NOW() - INTERVAL '6 months';

-- ════════════════════════════════════════════════════════
-- 常用查询
-- ════════════════════════════════════════════════════════

-- 按事件类型统计
-- SELECT event_type, count(*) FROM phonics_defend_logs GROUP BY event_type ORDER BY count DESC;

-- 查看最近合成英雄事件
-- SELECT session_id, details->>'word' AS word, client_time
-- FROM phonics_defend_logs WHERE event_type = 'synthesize_hero'
-- ORDER BY client_time DESC LIMIT 20;

-- 统计每波次平均基地剩余血量（难度分析）
-- SELECT
--   (details->>'wave')::int AS wave,
--   avg((details->>'baseHp')::numeric) AS avg_hp
-- FROM phonics_defend_logs
-- WHERE event_type = 'wave_complete'
-- GROUP BY wave ORDER BY wave;
