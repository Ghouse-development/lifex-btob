-- =====================================================
-- Supabase Auth統合 - データベースマイグレーション (最終修正版)
-- 作成日: 2025-01-21
-- 最終修正日: 2025-01-21
-- 目的: 認証・ユーザー管理機能の強化
-- 注意: 既存テーブルに対応、カラムの追加処理を含む
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
    user_agent TEXT
);

-- 既存テーブルに success カラムを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'login_history' AND column_name = 'success'
    ) THEN
        ALTER TABLE login_history ADD COLUMN success BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added success column to login_history table';
    END IF;
END $$;

-- 既存テーブルに failure_reason カラムを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'login_history' AND column_name = 'failure_reason'
    ) THEN
        ALTER TABLE login_history ADD COLUMN failure_reason TEXT;
        RAISE NOTICE 'Added failure_reason column to login_history table';
    END IF;
END $$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);

-- コメント追加
COMMENT ON TABLE login_history IS 'ログイン履歴';
COMMENT ON COLUMN login_history.success IS 'true: 成功, false: 失敗';

-- =====================================================
-- 3. RLS（Row Level Security）有効化
-- =====================================================

-- user_profiles テーブル
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- login_history テーブル
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLSポリシー設定
-- =====================================================

-- user_profiles テーブルのポリシー

-- ユーザーは自分のプロファイルのみ閲覧可能
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- ユーザーは自分のプロファイルのみ更新可能
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 管理者は全てのプロファイルを閲覧可能
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 管理者は全てのプロファイルを管理可能
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles"
ON user_profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- login_history テーブルのポリシー

-- ユーザーは自分のログイン履歴のみ閲覧可能
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
CREATE POLICY "Users can view own login history"
ON login_history FOR SELECT
USING (auth.uid() = user_id);

-- システムはログイン履歴を記録可能（サービスロール用）
DROP POLICY IF EXISTS "System can insert login history" ON login_history;
CREATE POLICY "System can insert login history"
ON login_history FOR INSERT
WITH CHECK (true);

-- 管理者は全てのログイン履歴を閲覧可能
DROP POLICY IF EXISTS "Admins can view all login history" ON login_history;
CREATE POLICY "Admins can view all login history"
ON login_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- 5. トリガー関数
-- =====================================================

-- ユーザー作成時に自動的にプロファイルを作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, company_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Company'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
        'active'
    )
    ON CONFLICT (id) DO NOTHING;  -- 既に存在する場合はスキップ
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: auth.users にユーザーが追加されたら user_profiles を作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- updated_at の自動更新
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

-- ログイン時に last_login_at を更新
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- success カラムをチェック（存在する場合のみ）
    IF TG_TABLE_NAME = 'login_history' THEN
        IF NEW.success = true THEN
            UPDATE user_profiles
            SET last_login_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_login_success ON login_history;
CREATE TRIGGER on_login_success
AFTER INSERT ON login_history
FOR EACH ROW
EXECUTE FUNCTION update_last_login();

-- =====================================================
-- 7. ヘルパー関数
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
-- 8. 完了メッセージ
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Supabase Auth Migration 完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- user_profiles';
    RAISE NOTICE '- login_history';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. 管理者ユーザーを作成';
    RAISE NOTICE '3. Table Editor > user_profiles で role を admin に変更';
    RAISE NOTICE '';
    RAISE NOTICE 'ドキュメント: docs/admin-account-setup.md';
    RAISE NOTICE '========================================';
END $$;
