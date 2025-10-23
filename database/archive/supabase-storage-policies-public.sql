-- ==========================================================
-- LIFE X ストレージRLSポリシー（パブリックアップロード許可版）
-- ==========================================================
-- 作成日: 2025-10-22
-- 説明: 誰でもアップロード可能なRLSポリシー設定
-- ==========================================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Public Access to plan images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plan images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update plan images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete plan images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to plan drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plan drawings" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update plan drawings" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete plan drawings" ON storage.objects;

-- plan-images バケットのRLSポリシー
-- 全員が画像を閲覧可能
CREATE POLICY "Public Access to plan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-images');

-- 誰でも画像をアップロード可能（一時的）
CREATE POLICY "Public upload plan images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plan-images');

-- 誰でも画像を更新可能（一時的）
CREATE POLICY "Public update plan images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'plan-images');

-- 誰でも画像を削除可能（一時的）
CREATE POLICY "Public delete plan images"
ON storage.objects FOR DELETE
USING (bucket_id = 'plan-images');

-- plan-drawings バケットのRLSポリシー
-- 全員がPDFを閲覧可能
CREATE POLICY "Public Access to plan drawings"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-drawings');

-- 誰でもPDFをアップロード可能（一時的）
CREATE POLICY "Public upload plan drawings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plan-drawings');

-- 誰でもPDFを更新可能（一時的）
CREATE POLICY "Public update plan drawings"
ON storage.objects FOR UPDATE
USING (bucket_id = 'plan-drawings');

-- 誰でもPDFを削除可能（一時的）
CREATE POLICY "Public delete plan drawings"
ON storage.objects FOR DELETE
USING (bucket_id = 'plan-drawings');

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLSポリシー設定完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '設定内容:';
    RAISE NOTICE '- 全員がアップロード・更新・削除可能';
    RAISE NOTICE '- セキュリティ強化が必要な場合は後で変更してください';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE 'node scripts/utilities/upload-plans-to-storage.js を実行';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
