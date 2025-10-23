-- ===========================================
-- ルール・ガイドライン テーブル作成
-- Run this in Supabase SQL Editor
-- ===========================================

-- ルールカテゴリテーブル
CREATE TABLE IF NOT EXISTS rule_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES rule_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    tags JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    display_order INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_rules_category_id ON rules(category_id);
CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_tags ON rules USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_rules_display_order ON rules(display_order);
CREATE INDEX IF NOT EXISTS idx_rule_categories_display_order ON rule_categories(display_order);

-- Row Level Security (RLS) 有効化
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ルールカテゴリは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view rule categories" ON rule_categories;
CREATE POLICY "Anyone can view rule categories"
ON rule_categories
FOR SELECT
USING (true);

-- RLSポリシー: 認証済みユーザーはルールカテゴリを管理可能
DROP POLICY IF EXISTS "Authenticated users can manage rule categories" ON rule_categories;
CREATE POLICY "Authenticated users can manage rule categories"
ON rule_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLSポリシー: アクティブなルールは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view active rules" ON rules;
CREATE POLICY "Anyone can view active rules"
ON rules
FOR SELECT
USING (status = 'active' OR auth.uid() IS NOT NULL);

-- RLSポリシー: 認証済みユーザーは全てのルールを閲覧可能
DROP POLICY IF EXISTS "Authenticated users can view all rules" ON rules;
CREATE POLICY "Authenticated users can view all rules"
ON rules
FOR SELECT
TO authenticated
USING (true);

-- RLSポリシー: 認証済みユーザーはルールを作成可能
DROP POLICY IF EXISTS "Authenticated users can create rules" ON rules;
CREATE POLICY "Authenticated users can create rules"
ON rules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLSポリシー: 認証済みユーザーはルールを更新可能
DROP POLICY IF EXISTS "Authenticated users can update rules" ON rules;
CREATE POLICY "Authenticated users can update rules"
ON rules
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLSポリシー: 認証済みユーザーはルールを削除可能
DROP POLICY IF EXISTS "Authenticated users can delete rules" ON rules;
CREATE POLICY "Authenticated users can delete rules"
ON rules
FOR DELETE
TO authenticated
USING (true);

-- 更新時刻を自動更新する関数（共通）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ルールテーブルに更新時刻トリガーを設定
DROP TRIGGER IF EXISTS update_rules_updated_at ON rules;
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ルールカテゴリテーブルに更新時刻トリガーを設定
DROP TRIGGER IF EXISTS update_rule_categories_updated_at ON rule_categories;
CREATE TRIGGER update_rule_categories_updated_at BEFORE UPDATE ON rule_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データ: ルールカテゴリ
-- 注意: 初期データは自動挿入しません。必要に応じて管理画面から追加してください。
-- INSERT INTO rule_categories (name, description, icon, display_order) VALUES
--     ('営業ルール', '営業活動に関するルールとガイドライン', '💼', 1),
--     ('施工ルール', '施工に関するルールと注意事項', '🔨', 2),
--     ('品質管理', '品質管理に関するルール', '✅', 3),
--     ('安全管理', '安全管理に関するルール', '⚠️', 4),
--     ('顧客対応', '顧客対応に関するルール', '🤝', 5)
-- ON CONFLICT DO NOTHING;

-- スキーマキャッシュをリフレッシュ
NOTIFY pgrst, 'reload schema';

-- 完了メッセージ
SELECT 'Rule tables created successfully!' as message;
