-- ===========================================
-- プラン管理の不足カラムを追加
-- Migration: Add missing columns to plans table
-- Date: 2025-10-23
-- ===========================================

-- まずCHECK制約を削除して再作成（'deleted'ステータスを追加）
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans ADD CONSTRAINT plans_status_check
    CHECK (status IN ('draft', 'published', 'archived', 'inactive', 'deleted'));

-- 不足しているカラムを追加
ALTER TABLE plans
    -- 間取り情報
    ADD COLUMN IF NOT EXISTS layout TEXT,
    ADD COLUMN IF NOT EXISTS ldk_floor INTEGER,
    ADD COLUMN IF NOT EXISTS bathroom_floor INTEGER,

    -- 面積情報
    ADD COLUMN IF NOT EXISTS total_floor_area DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS construction_floor_area DECIMAL(10,2),

    -- 価格情報（詳細）
    ADD COLUMN IF NOT EXISTS sell_price BIGINT,
    ADD COLUMN IF NOT EXISTS cost BIGINT,
    ADD COLUMN IF NOT EXISTS gross_profit BIGINT,

    -- 性能値
    ADD COLUMN IF NOT EXISTS ua_value DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS energy_reduction DECIMAL(10,2),

    -- 設計者
    ADD COLUMN IF NOT EXISTS designer TEXT,

    -- 画像・ファイル（JSONB形式）
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '{}';

-- インデックスを追加（検索性能向上）
CREATE INDEX IF NOT EXISTS idx_plans_layout ON plans(layout);
CREATE INDEX IF NOT EXISTS idx_plans_sell_price ON plans(sell_price);
CREATE INDEX IF NOT EXISTS idx_plans_designer ON plans(designer);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- コメントを追加
COMMENT ON COLUMN plans.layout IS '間取り（例: 3LDK, 4LDK）';
COMMENT ON COLUMN plans.ldk_floor IS 'LDKの階数（1階 or 2階）';
COMMENT ON COLUMN plans.bathroom_floor IS '浴室の階数（1階 or 2階）';
COMMENT ON COLUMN plans.total_floor_area IS '延床面積（㎡）';
COMMENT ON COLUMN plans.construction_floor_area IS '施工床面積（㎡）';
COMMENT ON COLUMN plans.sell_price IS '販売価格（円単位）';
COMMENT ON COLUMN plans.cost IS '原価（円単位）';
COMMENT ON COLUMN plans.gross_profit IS '粗利（円単位）';
COMMENT ON COLUMN plans.ua_value IS 'UA値（外皮平均熱貫流率）';
COMMENT ON COLUMN plans.energy_reduction IS '省エネ削減率（%）';
COMMENT ON COLUMN plans.designer IS '設計者名';
COMMENT ON COLUMN plans.images IS '画像データ（外観・内観等）';
COMMENT ON COLUMN plans.floor_plans IS '間取図データ配列';
COMMENT ON COLUMN plans.files IS 'ファイルデータ（プレゼン資料・図面等）';
