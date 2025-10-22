-- ==========================================================
-- LIFE X プラン管理機能 マイグレーションファイル（修正版）
-- ==========================================================
-- 作成日: 2025-01-21
-- 修正日: 2025-01-21
-- 説明: プランデータのためのテーブルとRLSポリシーを作成
-- 注意: 既存テーブルに対応、カラムの追加処理を含む
-- ==========================================================

-- plans テーブル（プラン情報）
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    plan_id TEXT UNIQUE,  -- LocalStorage互換のためのID
    tsubo DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存テーブルに不足しているカラムを追加（存在しない場合のみ）

-- maguchi カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'maguchi'
    ) THEN
        ALTER TABLE plans ADD COLUMN maguchi DECIMAL(5,2);
        RAISE NOTICE 'Added maguchi column to plans table';
    END IF;
END $$;

-- oku_yuki カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'oku_yuki'
    ) THEN
        ALTER TABLE plans ADD COLUMN oku_yuki DECIMAL(5,2);
        RAISE NOTICE 'Added oku_yuki column to plans table';
    END IF;
END $$;

-- plan_category カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'plan_category'
    ) THEN
        ALTER TABLE plans ADD COLUMN plan_category TEXT;
        RAISE NOTICE 'Added plan_category column to plans table';
    END IF;
END $$;

-- plan_sub_category カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'plan_sub_category'
    ) THEN
        ALTER TABLE plans ADD COLUMN plan_sub_category TEXT;
        RAISE NOTICE 'Added plan_sub_category column to plans table';
    END IF;
END $$;

-- total_area カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'total_area'
    ) THEN
        ALTER TABLE plans ADD COLUMN total_area DECIMAL(10,2);
        RAISE NOTICE 'Added total_area column to plans table';
    END IF;
END $$;

-- floor1_area カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'floor1_area'
    ) THEN
        ALTER TABLE plans ADD COLUMN floor1_area DECIMAL(10,2);
        RAISE NOTICE 'Added floor1_area column to plans table';
    END IF;
END $$;

-- floor2_area カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'floor2_area'
    ) THEN
        ALTER TABLE plans ADD COLUMN floor2_area DECIMAL(10,2);
        RAISE NOTICE 'Added floor2_area column to plans table';
    END IF;
END $$;

-- floor3_area カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'floor3_area'
    ) THEN
        ALTER TABLE plans ADD COLUMN floor3_area DECIMAL(10,2);
        RAISE NOTICE 'Added floor3_area column to plans table';
    END IF;
END $$;

-- drawing_file_path カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'drawing_file_path'
    ) THEN
        ALTER TABLE plans ADD COLUMN drawing_file_path TEXT;
        RAISE NOTICE 'Added drawing_file_path column to plans table';
    END IF;
END $$;

-- presentation_file_path カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'presentation_file_path'
    ) THEN
        ALTER TABLE plans ADD COLUMN presentation_file_path TEXT;
        RAISE NOTICE 'Added presentation_file_path column to plans table';
    END IF;
END $$;

-- thumbnail_url カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE plans ADD COLUMN thumbnail_url TEXT;
        RAISE NOTICE 'Added thumbnail_url column to plans table';
    END IF;
END $$;

-- plan_id カラムを追加（LocalStorage互換のためのID）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE plans ADD COLUMN plan_id TEXT UNIQUE;
        RAISE NOTICE 'Added plan_id column to plans table';
    END IF;
END $$;

-- remarks カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'remarks'
    ) THEN
        ALTER TABLE plans ADD COLUMN remarks TEXT;
        RAISE NOTICE 'Added remarks column to plans table';
    END IF;
END $$;

-- created_by カラムを追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE plans ADD COLUMN created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added created_by column to plans table';
    END IF;
END $$;

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
