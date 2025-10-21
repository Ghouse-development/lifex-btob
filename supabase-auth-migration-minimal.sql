-- =====================================================
-- Supabase Auth統合 - 最小構成マイグレーション
-- 作成日: 2025-01-21
-- 目的: 認証・ユーザー管理テーブルのみ作成
--
-- 注意: このSQLは認証関連テーブルのみを作成します。
--       既存テーブル(plans, faqs, rules, downloads)へのRLS適用は含まれません。
-- =====================================================

-- =====================================================
-- 1. ユーザープロファイルテーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,        -- 加盟店名
    company_code TEXT UNIQUE,          -- 加盟店コード（例: GH001）
    contact_name TEXT,                 -- 担当者名
    phone TEXT,                        -- 電話番号
    role TEXT NOT NULL DEFAULT 'member',  -- 役割: 'admin', 'member'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,

    -- 制約
    CONSTRAINT valid_role CHECK (role IN ('admin', 'member')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_code ON user_profiles(company_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- コメント追加
COMMENT ON TABLE user_profiles IS '加盟店ユーザープロファイル';
COMMENT ON COLUMN user_profiles.id IS 'auth.users.idと紐付け';
COMMENT ON COLUMN user_profiles.company_code IS '加盟店識別コード';
COMMENT ON COLUMN user_profiles.role IS 'admin: 本部管理者, member: 加盟店';
COMMENT ON COLUMN user_profiles.status IS 'active: 有効, inactive: 無効, suspended: 停止中';

-- =====================================================
-- 2. ログイン履歴テーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL,              -- 'success', 'failed'
    failure_reason TEXT,

    -- 制約
    CONSTRAINT valid_login_status CHECK (status IN ('success', 'failed'))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);

-- コメント追加
COMMENT ON TABLE login_history IS 'ログイン履歴（監査用）';
COMMENT ON COLUMN login_history.status IS 'success: 成功, failed: 失敗';

-- =====================================================
-- 3. トリガー: updated_at自動更新
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. トリガー: 新規ユーザー作成時にプロファイル作成
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, company_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        'New Company',  -- デフォルト値（後で更新）
        'member'        -- デフォルトは加盟店
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 5. RLS（Row Level Security）ポリシー
-- =====================================================

-- user_profiles テーブルのRLS有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー1: 自分のプロファイルは閲覧可能
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- ポリシー2: 自分のプロファイルは更新可能
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ポリシー3: 管理者は全てのプロファイルを閲覧可能
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ポリシー4: 管理者は全てのプロファイルを更新可能
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ポリシー5: 管理者は新規ユーザーを作成可能（トリガー経由）
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.uid() = id  -- 自動作成（トリガー経由）も許可
);

-- login_history テーブルのRLS有効化
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- ポリシー1: 自分のログイン履歴は閲覧可能
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
CREATE POLICY "Users can view own login history"
ON login_history FOR SELECT
USING (user_id = auth.uid());

-- ポリシー2: 管理者は全てのログイン履歴を閲覧可能
DROP POLICY IF EXISTS "Admins can view all login history" ON login_history;
CREATE POLICY "Admins can view all login history"
ON login_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ポリシー3: ログイン履歴の記録は誰でも可能（サービス経由）
DROP POLICY IF EXISTS "Anyone can insert login history" ON login_history;
CREATE POLICY "Anyone can insert login history"
ON login_history FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 6. ヘルパー関数
-- =====================================================

-- 現在のユーザーが管理者かチェック
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のユーザーの会社コードを取得
CREATE OR REPLACE FUNCTION get_current_company_code()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT company_code FROM user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 実行完了メッセージ
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Supabase Auth Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. Supabase Dashboardで管理者アカウントを作成';
    RAISE NOTICE '   Email: admin@ghouse.co.jp';
    RAISE NOTICE '2. 作成されたUIDでuser_profilesを確認';
    RAISE NOTICE '3. roleを''admin''に変更（必要に応じて）';
    RAISE NOTICE '4. フロントエンド実装を開始';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- user_profiles';
    RAISE NOTICE '- login_history';
    RAISE NOTICE '';
    RAISE NOTICE '注意: 既存テーブル(plans, faqs, rules, downloads)への';
    RAISE NOTICE 'RLS適用は含まれていません。';
    RAISE NOTICE 'これらのテーブルが作成された後、';
    RAISE NOTICE 'supabase-auth-migration-rls-only.sql を実行してください。';
END $$;
