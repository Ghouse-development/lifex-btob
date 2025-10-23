-- ===========================================
-- 問題修正: プランRLS + FAQ重複カテゴリ
-- ===========================================

-- 1. プランテーブルのRLSポリシー追加
-- 公開済みプランを誰でも閲覧可能にする

DROP POLICY IF EXISTS "Anyone can view published plans" ON plans;
CREATE POLICY "Anyone can view published plans"
ON plans
FOR SELECT
USING (status = 'published' OR auth.uid() IS NOT NULL);

-- 2. FAQ重複カテゴリの削除
-- 各カテゴリ名で最も古いIDを保持し、新しい方を削除

WITH duplicates AS (
    SELECT
        name,
        id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM faq_categories
)
DELETE FROM faq_categories
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 確認
SELECT 'Plans RLS policy created' as status;
SELECT 'Duplicate FAQ categories removed' as status;
SELECT COUNT(*) as remaining_faq_categories FROM faq_categories;
