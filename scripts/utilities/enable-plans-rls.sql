-- plansテーブルのRLSを再度有効化

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 確認メッセージ
DO $$
BEGIN
    RAISE NOTICE 'plansテーブルのRLSを再度有効化しました';
    RAISE NOTICE 'セキュリティが正常に復元されました';
END $$;
