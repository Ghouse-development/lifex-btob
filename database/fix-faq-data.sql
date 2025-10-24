-- ===========================================
-- FAQ データ修正スクリプト
-- 「てすと」項目を削除
-- Date: 2025-10-24
-- ===========================================

-- 1. 「てすと」を含むテストデータを削除
DELETE FROM faqs
WHERE question LIKE '%てすと%'
   OR question LIKE '%テスト%'
   OR question LIKE '%test%';

-- 2. 確認用クエリ（削除後のFAQ一覧を表示）
SELECT
    id,
    question,
    category_id,
    display_order,
    status,
    created_at
FROM faqs
ORDER BY display_order, created_at;
