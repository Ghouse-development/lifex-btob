-- ==========================================================
-- LIFE X プラン画像・ファイルストレージ設定
-- ==========================================================
-- 作成日: 2025-10-22
-- 説明: プラン画像とPDFファイルのストレージバケット設定
-- ==========================================================

-- ストレージバケットの作成
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('plan-images', 'plan-images', true),
  ('plan-drawings', 'plan-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- plan-images バケットのRLSポリシー
-- 全員が画像を閲覧可能
CREATE POLICY "Public Access to plan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-images');

-- 認証済みユーザーが画像をアップロード可能
CREATE POLICY "Authenticated users can upload plan images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plan-images' AND
  auth.role() = 'authenticated'
);

-- 管理者のみが画像を更新・削除可能
CREATE POLICY "Admins can update plan images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete plan images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- plan-drawings バケットのRLSポリシー
-- 全員がPDFを閲覧可能
CREATE POLICY "Public Access to plan drawings"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-drawings');

-- 認証済みユーザーがPDFをアップロード可能
CREATE POLICY "Authenticated users can upload plan drawings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plan-drawings' AND
  auth.role() = 'authenticated'
);

-- 管理者のみがPDFを更新・削除可能
CREATE POLICY "Admins can update plan drawings"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'plan-drawings' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete plan drawings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'plan-drawings' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ストレージバケット設定完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたバケット:';
    RAISE NOTICE '- plan-images (プラン画像用)';
    RAISE NOTICE '- plan-drawings (PDF図面用)';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. ローカルファイルをアップロード';
    RAISE NOTICE '2. プランデータのURLを更新';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
