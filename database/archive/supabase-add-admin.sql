-- 管理者アカウント追加スクリプト
-- 実行日: 2025-10-22
--
-- このスクリプトをSupabase Dashboard → SQL Editorで実行してください
--
-- 注意: このスクリプトは Supabase Auth でユーザーを作成するSQLではありません
-- まず Supabase Dashboard → Authentication → Users で手動作成が必要です
--
-- 手順:
-- 1. Supabase Dashboard → Authentication → Users
-- 2. "Add user" → "Create new user" をクリック
-- 3. 以下の情報を入力:
--    Email: admin@ghouse.jp
--    Password: Ghouse0648
--    Auto Confirm User: ✅ ONにする
-- 4. "Create user" をクリック
-- 5. 作成されたユーザーの UUID をコピー
-- 6. 以下の INSERT 文の '[USER_UUID]' を実際のUUIDに置き換えて実行

-- user_profiles テーブルに管理者プロフィールを追加
-- ※ トリガーで自動作成される場合は、UPDATE文を使用してください

-- 方法1: トリガーで自動作成されなかった場合（INSERT）
INSERT INTO user_profiles (
    id,
    email,
    company_name,
    company_code,
    contact_name,
    phone,
    role,
    status,
    created_at,
    updated_at
)
VALUES (
    '[USER_UUID]',  -- ここを実際のUUIDに置き換える（例: '550e8400-e29b-41d4-a716-446655440000'）
    'admin@ghouse.jp',
    '株式会社Gハウス',
    'GH000',
    '西野秀樹',
    '06-6954-0648',
    'admin',  -- 重要: 管理者権限
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 方法2: トリガーで自動作成された場合（UPDATE）
-- 以下のコメントを解除して実行してください
/*
UPDATE user_profiles
SET
    company_name = '株式会社Gハウス',
    company_code = 'GH000',
    contact_name = '西野秀樹',
    phone = '06-6954-0648',
    role = 'admin',  -- 重要: 管理者権限
    status = 'active',
    updated_at = NOW()
WHERE email = 'admin@ghouse.jp';
*/

-- 確認クエリ
SELECT
    id,
    email,
    company_name,
    role,
    status,
    created_at
FROM user_profiles
WHERE email IN ('admin@ghouse.co.jp', 'admin@ghouse.jp')
ORDER BY created_at DESC;
