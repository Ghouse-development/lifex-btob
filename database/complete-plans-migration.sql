-- ===========================================
-- Plans テーブル 完全マイグレーション
-- 不足している全てのカラムを追加
-- Date: 2025-10-23
-- ===========================================

-- まず、statusのCHECK制約を更新（'deleted'を追加）
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans ADD CONSTRAINT plans_status_check
    CHECK (status IN ('draft', 'published', 'archived', 'inactive', 'deleted'));

-- ===========================================
-- 元のスキーマから不足しているカラムを追加
-- ===========================================

-- 基本情報
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT;

-- nameカラムにNOT NULL制約を追加（既存データがある場合はデフォルト値を設定）
UPDATE plans SET name = 'プラン名未設定 ' || id WHERE name IS NULL OR name = '';
ALTER TABLE plans ALTER COLUMN name SET NOT NULL;

-- 基本仕様
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS floors INTEGER DEFAULT 2;

-- 価格情報
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS price_without_tax BIGINT,
    ADD COLUMN IF NOT EXISTS construction_period INTEGER;

-- 部屋構成
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
    ADD COLUMN IF NOT EXISTS living_dining TEXT,
    ADD COLUMN IF NOT EXISTS kitchen TEXT,
    ADD COLUMN IF NOT EXISTS bathroom TEXT,
    ADD COLUMN IF NOT EXISTS toilet INTEGER;

-- メタデータ（外部キー制約なし - usersテーブルが存在しないため）
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- 追加仕様（JSON形式）
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}';

-- ===========================================
-- 新規追加カラム（要件定義に基づく）
-- ===========================================

-- 間取り情報
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS layout TEXT,
    ADD COLUMN IF NOT EXISTS ldk_floor INTEGER,
    ADD COLUMN IF NOT EXISTS bathroom_floor INTEGER;

-- 面積情報（新規要件）
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS total_floor_area DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS construction_floor_area DECIMAL(10,2);

-- 価格情報（詳細）
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS sell_price BIGINT,
    ADD COLUMN IF NOT EXISTS cost BIGINT,
    ADD COLUMN IF NOT EXISTS gross_profit BIGINT;

-- 性能値
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS ua_value DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS energy_reduction DECIMAL(10,2);

-- 設計者
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS designer TEXT;

-- 画像・ファイル（JSONB形式）
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '{}';

-- ===========================================
-- インデックスを追加（検索性能向上）
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);
CREATE INDEX IF NOT EXISTS idx_plans_layout ON plans(layout);
CREATE INDEX IF NOT EXISTS idx_plans_sell_price ON plans(sell_price);
CREATE INDEX IF NOT EXISTS idx_plans_designer ON plans(designer);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at);

-- ===========================================
-- カラムコメントを追加
-- ===========================================

-- 基本情報
COMMENT ON COLUMN plans.name IS 'プラン名（必須）';
COMMENT ON COLUMN plans.category IS 'カテゴリー';
COMMENT ON COLUMN plans.description IS 'プラン説明';

-- 間取り情報
COMMENT ON COLUMN plans.layout IS '間取り（例: 3LDK, 4LDK）';
COMMENT ON COLUMN plans.ldk_floor IS 'LDKの階数（1階 or 2階）';
COMMENT ON COLUMN plans.bathroom_floor IS '浴室の階数（1階 or 2階）';

-- 面積情報
COMMENT ON COLUMN plans.tsubo IS '坪数（自動計算または入力）';
COMMENT ON COLUMN plans.total_floor_area IS '延床面積（㎡）';
COMMENT ON COLUMN plans.construction_floor_area IS '施工床面積（㎡）';
COMMENT ON COLUMN plans.width IS '間口（m）';
COMMENT ON COLUMN plans.depth IS '奥行（m）';
COMMENT ON COLUMN plans.floors IS '階数';

-- 価格情報
COMMENT ON COLUMN plans.price IS '基本価格（円単位）';
COMMENT ON COLUMN plans.sell_price IS '販売価格（円単位）';
COMMENT ON COLUMN plans.cost IS '原価（円単位）';
COMMENT ON COLUMN plans.gross_profit IS '粗利（円単位）';
COMMENT ON COLUMN plans.price_without_tax IS '税抜価格（円単位）';
COMMENT ON COLUMN plans.construction_period IS '工期（日数）';

-- 部屋構成
COMMENT ON COLUMN plans.bedrooms IS '寝室数';
COMMENT ON COLUMN plans.living_dining IS 'リビング・ダイニング';
COMMENT ON COLUMN plans.kitchen IS 'キッチン';
COMMENT ON COLUMN plans.bathroom IS '浴室';
COMMENT ON COLUMN plans.toilet IS 'トイレ数';

-- 性能値
COMMENT ON COLUMN plans.ua_value IS 'UA値（外皮平均熱貫流率）';
COMMENT ON COLUMN plans.energy_reduction IS '省エネ削減率（%）';

-- 設計者
COMMENT ON COLUMN plans.designer IS '設計者名';

-- タグ・データ
COMMENT ON COLUMN plans.tags IS '特徴タグ（JSON配列）';
COMMENT ON COLUMN plans.images IS '画像データ（外観・内観等）';
COMMENT ON COLUMN plans.floor_plans IS '間取図データ配列';
COMMENT ON COLUMN plans.files IS 'ファイルデータ（プレゼン資料・図面等）';

-- ステータス・メタデータ
COMMENT ON COLUMN plans.status IS 'ステータス（draft, published, archived, inactive, deleted）';
COMMENT ON COLUMN plans.created_by IS '作成者ID（users.id参照）';
COMMENT ON COLUMN plans.updated_by IS '更新者ID（users.id参照）';
COMMENT ON COLUMN plans.created_at IS '作成日時';
COMMENT ON COLUMN plans.updated_at IS '更新日時';
COMMENT ON COLUMN plans.published_at IS '公開日時';

-- 追加仕様
COMMENT ON COLUMN plans.specifications IS '追加仕様（JSON形式）';
COMMENT ON COLUMN plans.options IS 'オプション（JSON形式）';

-- ===========================================
-- 完了メッセージ
-- ===========================================
-- マイグレーション完了
-- 全ての不足カラムが追加されました
