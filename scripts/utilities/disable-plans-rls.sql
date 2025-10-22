-- 一時的にplansテーブルのRLSを無効化
-- インポート完了後に enable-plans-rls.sql で再度有効化してください

ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- 確認メッセージ
DO $$
BEGIN
    RAISE NOTICE 'plansテーブルのRLSを無効化しました';
    RAISE NOTICE '重要: データインポート完了後、必ずenable-plans-rls.sqlを実行してRLSを再度有効化してください';
END $$;
