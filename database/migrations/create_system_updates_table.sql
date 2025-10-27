-- システム更新情報テーブル
-- 「最新の更新」カードに表示する更新履歴を管理

CREATE TABLE IF NOT EXISTS system_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('プラン', 'ダウンロード', 'ルール', 'FAQ', 'システム', 'その他')),
    update_type TEXT NOT NULL,
    related_id TEXT,  -- 関連するプラン/ダウンロード/ルールなどのID
    plan_id TEXT,     -- プラン詳細へのリンク用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- インデックス
CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);
CREATE INDEX idx_system_updates_category ON system_updates(category);
CREATE INDEX idx_system_updates_status ON system_updates(status);
CREATE INDEX idx_system_updates_created_by ON system_updates(created_by);

-- RLSポリシー
ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能（activeな更新のみ）
CREATE POLICY "Anyone can view active system updates"
    ON system_updates
    FOR SELECT
    USING (status = 'active');

-- 認証済みユーザーは作成可能
CREATE POLICY "Authenticated users can create system updates"
    ON system_updates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 作成者は更新・削除可能
CREATE POLICY "Users can update their own system updates"
    ON system_updates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own system updates"
    ON system_updates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- コメント
COMMENT ON TABLE system_updates IS 'システム全体の更新履歴。トップページの「最新の更新」カードに表示される';
COMMENT ON COLUMN system_updates.title IS '更新タイトル';
COMMENT ON COLUMN system_updates.description IS '更新内容の説明';
COMMENT ON COLUMN system_updates.category IS '更新カテゴリ（プラン/ダウンロード/ルール/FAQ/システム/その他）';
COMMENT ON COLUMN system_updates.update_type IS '更新タイプ（例: plan_added, rule_updated, download_added）';
COMMENT ON COLUMN system_updates.related_id IS '関連するデータのID（プランID、ルールIDなど）';
COMMENT ON COLUMN system_updates.plan_id IS 'プラン詳細ページへリンクする場合のプランID';
COMMENT ON COLUMN system_updates.metadata IS '追加のメタデータ（JSON形式）';
