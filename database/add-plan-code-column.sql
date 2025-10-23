-- プランコードカラムを追加
-- 手入力用の識別コード（表示用）
-- 内部IDはUUIDのまま維持

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS plan_code TEXT;

-- UNIQUE制約を追加（重複防止）
ALTER TABLE plans
    ADD CONSTRAINT plans_plan_code_unique UNIQUE (plan_code);

-- インデックス追加（検索性能向上）
CREATE INDEX IF NOT EXISTS idx_plans_plan_code ON plans(plan_code);

-- カラムコメント追加
COMMENT ON COLUMN plans.plan_code IS '表示用プランコード（例: LX-001）半角英数字とハイフンのみ';

-- 既存データに一時的なplan_codeを設定（NULL回避）
-- 実運用では手動で適切なコードを設定してください
UPDATE plans
SET plan_code = 'PLAN-' || substring(id::text, 1, 8)
WHERE plan_code IS NULL;
