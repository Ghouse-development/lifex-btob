-- ==========================================================
-- LIFE X プラン管理機能 マイグレーションファイル
-- ==========================================================
-- 作成日: 2025-01-21
-- 説明: プランデータのためのテーブルとRLSポリシーを作成
-- ==========================================================

-- plans テーブル（プラン情報）
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    plan_id TEXT UNIQUE,  -- LocalStorage互換のためのID
    tsubo DECIMAL(5,2) NOT NULL,
    maguchi DECIMAL(5,2),  -- 間口（m）
    oku_yuki DECIMAL(5,2),  -- 奥行（m）
    plan_category TEXT,  -- 平屋/2階建て/3階建て
    plan_sub_category TEXT,  -- サブカテゴリ
    total_area DECIMAL(10,2),  -- 延床面積（m²）
    floor1_area DECIMAL(10,2),  -- 1階床面積（m²）
    floor2_area DECIMAL(10,2),  -- 2階床面積（m²）
    floor3_area DECIMAL(10,2),  -- 3階床面積（m²）
    drawing_file_path TEXT,  -- 図面ファイルパス
    presentation_file_path TEXT,  -- プレゼンファイルパス
    thumbnail_url TEXT,  -- サムネイルURL
    remarks TEXT,  -- 備考
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_plans_tsubo ON plans(tsubo);
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(plan_category);
CREATE INDEX IF NOT EXISTS idx_plans_plan_id ON plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 全ての認証済みユーザーがプランを閲覧可能
DROP POLICY IF EXISTS "Authenticated users can view all plans" ON plans;
CREATE POLICY "Authenticated users can view all plans"
ON plans FOR SELECT
USING (auth.role() = 'authenticated');

-- RLSポリシー: 管理者のみがプランを作成可能
DROP POLICY IF EXISTS "Admins can create plans" ON plans;
CREATE POLICY "Admins can create plans"
ON plans FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLSポリシー: 管理者のみがプランを更新可能
DROP POLICY IF EXISTS "Admins can update plans" ON plans;
CREATE POLICY "Admins can update plans"
ON plans FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- RLSポリシー: 管理者のみがプランを削除可能
DROP POLICY IF EXISTS "Admins can delete plans" ON plans;
CREATE POLICY "Admins can delete plans"
ON plans FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- トリガー: updated_at の自動更新
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plans_updated_at ON plans;
CREATE TRIGGER plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_plans_updated_at();

-- コメント
COMMENT ON TABLE plans IS 'LIFE X プラン情報';
COMMENT ON COLUMN plans.plan_id IS 'LocalStorage互換ID';
COMMENT ON COLUMN plans.tsubo IS '坪数';
COMMENT ON COLUMN plans.maguchi IS '間口（メートル）';
COMMENT ON COLUMN plans.oku_yuki IS '奥行（メートル）';
COMMENT ON COLUMN plans.plan_category IS 'カテゴリ（平屋/2階建て/3階建て）';

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Plans Migration 完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- plans';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. CSVデータをインポート';
    RAISE NOTICE '2. プラン画像をアップロード';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ==========================================================
-- マイグレーション完了
-- ==========================================================
