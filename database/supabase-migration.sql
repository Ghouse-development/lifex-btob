-- ===========================================
-- LIFE X 加盟店専用サイト データベース構築SQL
-- Supabase Migration File
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- 1. 基本テーブル
-- ===========================================

-- ユーザー管理テーブル（認証は Supabase Auth を使用）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    department TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'guest')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 2. プラン管理
-- ===========================================

-- プランマスターテーブル
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,

    -- 基本仕様
    tsubo DECIMAL(10,2),
    width DECIMAL(10,2),
    depth DECIMAL(10,2),
    floors INTEGER DEFAULT 2,

    -- 価格情報
    price BIGINT,
    price_without_tax BIGINT,
    construction_period INTEGER,

    -- 部屋構成
    bedrooms INTEGER,
    living_dining TEXT,
    kitchen TEXT,
    bathroom TEXT,
    toilet INTEGER,

    -- タグ（JSON配列）
    tags JSONB DEFAULT '[]',

    -- ステータス
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'inactive')),

    -- メタデータ
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,

    -- 追加仕様（JSON形式）
    specifications JSONB DEFAULT '{}',
    options JSONB DEFAULT '{}'
);

-- プラン画像テーブル
CREATE TABLE IF NOT EXISTS plan_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('exterior', 'interior', 'floor_plan_1f', 'floor_plan_2f', 'other')),
    url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- プラン関連ファイルテーブル
CREATE TABLE IF NOT EXISTS plan_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'cad', 'document', 'other')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 3. 間取マトリックス
-- ===========================================

-- 間取マトリックス設定テーブル
CREATE TABLE IF NOT EXISTS matrix_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    width_ranges JSONB DEFAULT '[]', -- [{min: 5460, max: 6370, label: "6P"}]
    depth_ranges JSONB DEFAULT '[]', -- [{min: 7280, max: 8190, label: "8P"}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 間取マトリックスセルとプランの関連テーブル
CREATE TABLE IF NOT EXISTS matrix_cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    width_min DECIMAL(10,2),
    width_max DECIMAL(10,2),
    depth_min DECIMAL(10,2),
    depth_max DECIMAL(10,2),
    plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 4. デザインカテゴリ
-- ===========================================

-- デザインカテゴリテーブル
CREATE TABLE IF NOT EXISTS design_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('exterior', 'interior')),
    description TEXT,
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- プランとデザインカテゴリの関連テーブル
CREATE TABLE IF NOT EXISTS plan_design_categories (
    plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
    category_id UUID REFERENCES design_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, category_id)
);

-- ===========================================
-- 5. ルール・ガイドライン
-- ===========================================

-- ルールカテゴリテーブル
CREATE TABLE IF NOT EXISTS rule_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ルールテーブル
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES rule_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    tags JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- 6. ダウンロード資料
-- ===========================================

-- ダウンロードカテゴリテーブル
CREATE TABLE IF NOT EXISTS download_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ダウンロード資料テーブル
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES download_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'excel', 'word', 'powerpoint', 'image', 'video', 'other')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    thumbnail_url TEXT,
    download_count INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ダウンロード履歴テーブル
CREATE TABLE IF NOT EXISTS download_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    download_id UUID REFERENCES downloads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 7. FAQ
-- ===========================================

-- FAQカテゴリテーブル
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQテーブル
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQ評価テーブル
CREATE TABLE IF NOT EXISTS faq_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_helpful BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 8. システム設定・ログ
-- ===========================================

-- システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 操作ログテーブル
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 9. インデックス作成
-- ===========================================

-- プラン検索用インデックス
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_category ON plans(category);
CREATE INDEX idx_plans_tsubo ON plans(tsubo);
CREATE INDEX idx_plans_width ON plans(width);
CREATE INDEX idx_plans_depth ON plans(depth);
CREATE INDEX idx_plans_price ON plans(price);
CREATE INDEX idx_plans_tags ON plans USING GIN(tags);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);

-- 画像検索用インデックス
CREATE INDEX idx_plan_images_plan_id ON plan_images(plan_id);
CREATE INDEX idx_plan_images_type ON plan_images(type);

-- マトリックス検索用インデックス
CREATE INDEX idx_matrix_cells_ranges ON matrix_cells(width_min, width_max, depth_min, depth_max);
CREATE INDEX idx_matrix_cells_plan_id ON matrix_cells(plan_id);

-- ルール検索用インデックス
CREATE INDEX idx_rules_category_id ON rules(category_id);
CREATE INDEX idx_rules_status ON rules(status);
CREATE INDEX idx_rules_tags ON rules USING GIN(tags);

-- ダウンロード検索用インデックス
CREATE INDEX idx_downloads_category_id ON downloads(category_id);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_tags ON downloads USING GIN(tags);

-- FAQ検索用インデックス
CREATE INDEX idx_faqs_category_id ON faqs(category_id);
CREATE INDEX idx_faqs_status ON faqs(status);
CREATE INDEX idx_faqs_tags ON faqs USING GIN(tags);

-- ログ検索用インデックス
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ===========================================
-- 10. Row Level Security (RLS) ポリシー
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- プランテーブルのポリシー（公開されたプランは誰でも閲覧可能）
CREATE POLICY "Anyone can view published plans" ON plans
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- 画像テーブルのポリシー（プランと同じ権限）
CREATE POLICY "Anyone can view plan images" ON plan_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plans
            WHERE plans.id = plan_images.plan_id
            AND plans.status = 'published'
        )
    );

CREATE POLICY "Admins can manage plan images" ON plan_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- ダウンロードテーブルのポリシー
CREATE POLICY "Anyone can view active downloads" ON downloads
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage downloads" ON downloads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- FAQテーブルのポリシー
CREATE POLICY "Anyone can view published FAQs" ON faqs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage FAQs" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- ルールテーブルのポリシー
CREATE POLICY "Anyone can view active rules" ON rules
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage rules" ON rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- ===========================================
-- 11. 関数とトリガー
-- ===========================================

-- 更新時刻を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新時刻トリガーを設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rule_categories_updated_at BEFORE UPDATE ON rule_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_downloads_updated_at BEFORE UPDATE ON downloads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_categories_updated_at BEFORE UPDATE ON design_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matrix_settings_updated_at BEFORE UPDATE ON matrix_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 12. Storage Buckets設定
-- ===========================================

-- Supabase Storage Buckets (これはSupabaseダッシュボードで設定することを推奨)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--     ('plan-images', 'plan-images', true),
--     ('plan-files', 'plan-files', true),
--     ('downloads', 'downloads', true),
--     ('system-assets', 'system-assets', true);

-- ===========================================
-- 13. 初期データ投入（サンプル）
-- ===========================================

-- システム設定の初期値
INSERT INTO system_settings (key, value, description) VALUES
    ('site_name', '"LIFE X 加盟店専用サイト"', 'サイト名'),
    ('maintenance_mode', 'false', 'メンテナンスモード'),
    ('allow_registration', 'false', '新規登録許可'),
    ('default_user_role', '"user"', 'デフォルトユーザー権限')
ON CONFLICT (key) DO NOTHING;

-- FAQカテゴリの初期データ
INSERT INTO faq_categories (name, description, display_order) VALUES
    ('プランについて', 'プランに関するよくある質問', 1),
    ('契約・価格について', '契約や価格に関するよくある質問', 2),
    ('施工について', '施工に関するよくある質問', 3),
    ('アフターサービス', 'アフターサービスに関するよくある質問', 4),
    ('その他', 'その他のよくある質問', 5)
ON CONFLICT DO NOTHING;

-- ダウンロードカテゴリの初期データ
INSERT INTO download_categories (name, description, display_order) VALUES
    ('カタログ・パンフレット', '製品カタログやパンフレット', 1),
    ('技術資料', '技術仕様書や図面', 2),
    ('営業資料', '営業用プレゼンテーション資料', 3),
    ('契約書類', '契約関連の書類テンプレート', 4),
    ('マニュアル', '各種マニュアルやガイドライン', 5)
ON CONFLICT DO NOTHING;

-- ルールカテゴリの初期データ
INSERT INTO rule_categories (name, description, icon, display_order) VALUES
    ('営業ルール', '営業活動に関するルールとガイドライン', '💼', 1),
    ('施工ルール', '施工に関するルールと注意事項', '🔨', 2),
    ('品質管理', '品質管理に関するルール', '✅', 3),
    ('安全管理', '安全管理に関するルール', '⚠️', 4),
    ('顧客対応', '顧客対応に関するルール', '🤝', 5)
ON CONFLICT DO NOTHING;

-- デザインカテゴリの初期データ
INSERT INTO design_categories (name, type, description, display_order) VALUES
    ('モダン', 'exterior', 'シンプルでスタイリッシュな外観デザイン', 1),
    ('和モダン', 'exterior', '和風要素を取り入れたモダンな外観', 2),
    ('ナチュラル', 'exterior', '自然素材を活かした温かみのある外観', 3),
    ('北欧スタイル', 'interior', '明るく機能的な北欧風インテリア', 4),
    ('インダストリアル', 'interior', '工業的な要素を取り入れたインテリア', 5),
    ('ミニマル', 'interior', 'シンプルで洗練されたインテリア', 6)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 完了メッセージ
-- ===========================================
-- このSQLファイルをSupabaseのSQL Editorで実行してください。
-- 実行後、以下を確認してください：
-- 1. 全テーブルが正常に作成されたか
-- 2. インデックスが作成されたか
-- 3. RLSポリシーが設定されたか
-- 4. Storage Bucketsをダッシュボードから作成