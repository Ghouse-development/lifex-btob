-- ===========================================
-- FAQ Tables Migration
-- Run this in Supabase SQL Editor
-- ===========================================

-- FAQカテゴリテーブル
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQテーブル
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    display_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQ評価テーブル
CREATE TABLE IF NOT EXISTS faq_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
    user_id UUID,
    is_helpful BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_faqs_category_id ON faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_tags ON faqs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faq_categories_display_order ON faq_categories(display_order);

-- Row Level Security (RLS) 有効化
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_feedback ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: FAQカテゴリは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view FAQ categories" ON faq_categories;
CREATE POLICY "Anyone can view FAQ categories" ON faq_categories
    FOR SELECT USING (true);

-- RLSポリシー: 管理者はFAQカテゴリを管理可能
DROP POLICY IF EXISTS "Admins can manage FAQ categories" ON faq_categories;
CREATE POLICY "Admins can manage FAQ categories" ON faq_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
        )
    );

-- RLSポリシー: 公開されたFAQは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view published FAQs" ON faqs;
CREATE POLICY "Anyone can view published FAQs" ON faqs
    FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

-- RLSポリシー: 管理者はFAQを管理可能
DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;
CREATE POLICY "Admins can manage FAQs" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
        )
    );

-- RLSポリシー: FAQフィードバックは誰でも送信可能
DROP POLICY IF EXISTS "Anyone can submit FAQ feedback" ON faq_feedback;
CREATE POLICY "Anyone can submit FAQ feedback" ON faq_feedback
    FOR INSERT WITH CHECK (true);

-- RLSポリシー: FAQフィードバックは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view FAQ feedback" ON faq_feedback;
CREATE POLICY "Anyone can view FAQ feedback" ON faq_feedback
    FOR SELECT USING (true);

-- 更新時刻を自動更新する関数
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- FAQテーブルに更新時刻トリガーを設定
DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_faqs_updated_at();

-- 初期データ: FAQカテゴリ
INSERT INTO faq_categories (name, description, display_order) VALUES
    ('プランについて', 'プランに関するよくある質問', 1),
    ('契約・価格について', '契約や価格に関するよくある質問', 2),
    ('施工について', '施工に関するよくある質問', 3),
    ('アフターサービス', 'アフターサービスに関するよくある質問', 4),
    ('その他', 'その他のよくある質問', 5)
ON CONFLICT DO NOTHING;

-- 完了メッセージ
SELECT 'FAQ tables created successfully!' as message;
