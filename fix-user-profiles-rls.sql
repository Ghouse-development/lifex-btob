-- ==========================================
-- user_profiles テーブル RLS ポリシー修正
-- 問題: 無限再帰エラーの修正
-- 日付: 2025-10-22
-- ==========================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;

-- 新しいポリシーを作成（無限再帰なし）

-- 1. ユーザーは自分のプロファイルを読み取り可能
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. ユーザーは自分のプロファイルを更新可能
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. サービスロールは全てのプロファイルを管理可能
CREATE POLICY "Service role full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 確認: 作成されたポリシーを表示
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
