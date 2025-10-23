-- PostgREST スキーマキャッシュをリフレッシュ
NOTIFY pgrst, 'reload schema';

-- 確認: FAQ関連テーブルを表示
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%faq%'
ORDER BY table_name;
