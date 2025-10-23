-- ===========================================
-- FAQ テーブル RLS ポリシー修正
-- 問題: anon キーで "permission denied for table users" エラー
-- 解決: ポリシーを分離して、SELECT は誰でも可能に
-- ===========================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Anyone can view published FAQs" ON faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;
DROP POLICY IF EXISTS "Anyone can view FAQ categories" ON faq_categories;
DROP POLICY IF EXISTS "Admins can manage FAQ categories" ON faq_categories;

-- ==========================================
-- faq_categories テーブルのポリシー
-- ==========================================

-- 1. 誰でもカテゴリを閲覧可能（SELECT）
CREATE POLICY "Anyone can view FAQ categories"
ON faq_categories
FOR SELECT
USING (true);

-- 2. 認証済みユーザーがカテゴリを作成・更新・削除可能
CREATE POLICY "Authenticated users can manage FAQ categories"
ON faq_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- faqs テーブルのポリシー
-- ==========================================

-- 1. 誰でも公開済みFAQを閲覧可能（SELECT）
CREATE POLICY "Anyone can view published FAQs"
ON faqs
FOR SELECT
USING (status = 'published' OR auth.uid() IS NOT NULL);

-- 2. 認証済みユーザーは全てのFAQを閲覧可能
CREATE POLICY "Authenticated users can view all FAQs"
ON faqs
FOR SELECT
TO authenticated
USING (true);

-- 3. 認証済みユーザーはFAQを作成可能
CREATE POLICY "Authenticated users can create FAQs"
ON faqs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. 認証済みユーザーはFAQを更新可能
CREATE POLICY "Authenticated users can update FAQs"
ON faqs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. 認証済みユーザーはFAQを削除可能
CREATE POLICY "Authenticated users can delete FAQs"
ON faqs
FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- faq_feedback テーブルのポリシー
-- ==========================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Anyone can submit FAQ feedback" ON faq_feedback;
DROP POLICY IF EXISTS "Anyone can view FAQ feedback" ON faq_feedback;

-- 1. 誰でもフィードバックを閲覧可能
CREATE POLICY "Anyone can view FAQ feedback"
ON faq_feedback
FOR SELECT
USING (true);

-- 2. 誰でもフィードバックを送信可能
CREATE POLICY "Anyone can submit FAQ feedback"
ON faq_feedback
FOR INSERT
WITH CHECK (true);

-- ==========================================
-- 確認: 作成されたポリシーを表示
-- ==========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('faqs', 'faq_categories', 'faq_feedback')
ORDER BY tablename, policyname;
