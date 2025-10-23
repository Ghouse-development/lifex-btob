-- ==========================================
-- user_profiles テーブル 全RLSポリシー削除と再作成
-- 問題: 古いAdmin用ポリシーが無限再帰を引き起こしている
-- 日付: 2025-10-22
-- ==========================================

-- ステップ1: 全てのポリシーを削除
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;

-- ステップ2: シンプルな新しいポリシーのみ作成（無限再帰なし）

-- 1. 認証済みユーザーは自分のプロファイルを読み取り可能
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. 認証済みユーザーは自分のプロファイルを更新可能
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. サービスロールは全てのプロファイルを完全管理可能
CREATE POLICY "Service role full access"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ステップ3: 確認 - 作成されたポリシーを表示（3つだけのはず）
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN LENGTH(qual) > 50 THEN LEFT(qual, 50) || '...'
    ELSE qual
  END as qual_preview
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
