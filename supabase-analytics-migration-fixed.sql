-- ==========================================================
-- LIFE X アクセス解析機能 マイグレーションファイル (修正版)
-- ==========================================================
-- 作成日: 2025-01-21
-- 修正日: 2025-01-21
-- 説明: アクセス解析のためのテーブルとRLSポリシーを作成
-- 注意: 既存ポリシーを削除してから再作成
-- ==========================================================

-- page_views テーブル（ページビュー）
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    session_id TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

-- plan_views テーブル（プラン閲覧）
CREATE TABLE IF NOT EXISTS plan_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    view_duration INTEGER, -- 閲覧時間（秒）
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_plan_views_plan_id ON plan_views(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_views_user_id ON plan_views(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_views_viewed_at ON plan_views(viewed_at DESC);

-- download_logs テーブル（ダウンロードログ）
CREATE TABLE IF NOT EXISTS download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_category TEXT,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_download_logs_file_name ON download_logs(file_name);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON download_logs(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_logs_file_category ON download_logs(file_category);

-- search_queries テーブル（検索クエリ）
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    search_type TEXT, -- 'plan', 'rule', 'faq', etc.
    results_count INTEGER,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_searched_at ON search_queries(searched_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 管理者のみが全てのデータを閲覧可能

-- page_views
DROP POLICY IF EXISTS "Admins can view all page views" ON page_views;
CREATE POLICY "Admins can view all page views"
ON page_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can insert own page views" ON page_views;
CREATE POLICY "Users can insert own page views"
ON page_views FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- plan_views
DROP POLICY IF EXISTS "Admins can view all plan views" ON plan_views;
CREATE POLICY "Admins can view all plan views"
ON plan_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can insert own plan views" ON plan_views;
CREATE POLICY "Users can insert own plan views"
ON plan_views FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- download_logs
DROP POLICY IF EXISTS "Admins can view all download logs" ON download_logs;
CREATE POLICY "Admins can view all download logs"
ON download_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can insert own download logs" ON download_logs;
CREATE POLICY "Users can insert own download logs"
ON download_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- search_queries
DROP POLICY IF EXISTS "Admins can view all search queries" ON search_queries;
CREATE POLICY "Admins can view all search queries"
ON search_queries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can insert own search queries" ON search_queries;
CREATE POLICY "Users can insert own search queries"
ON search_queries FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 統計ビュー: プラン閲覧数ランキング
DROP VIEW IF EXISTS plan_view_stats;
CREATE VIEW plan_view_stats AS
SELECT
    plan_id,
    COUNT(*) AS view_count,
    COUNT(DISTINCT user_id) AS unique_users,
    AVG(view_duration) AS avg_duration
FROM plan_views
GROUP BY plan_id
ORDER BY view_count DESC;

-- 統計ビュー: ダウンロード数ランキング
DROP VIEW IF EXISTS download_stats;
CREATE VIEW download_stats AS
SELECT
    file_name,
    file_category,
    COUNT(*) AS download_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM download_logs
GROUP BY file_name, file_category
ORDER BY download_count DESC;

-- 統計ビュー: 人気ページランキング
DROP VIEW IF EXISTS popular_pages;
CREATE VIEW popular_pages AS
SELECT
    page_path,
    page_title,
    COUNT(*) AS view_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY page_path, page_title
ORDER BY view_count DESC
LIMIT 50;

-- 統計ビュー: 検索クエリランキング
DROP VIEW IF EXISTS popular_searches;
CREATE VIEW popular_searches AS
SELECT
    query,
    search_type,
    COUNT(*) AS search_count,
    AVG(results_count) AS avg_results
FROM search_queries
WHERE searched_at >= NOW() - INTERVAL '30 days'
GROUP BY query, search_type
ORDER BY search_count DESC
LIMIT 50;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Analytics Migration 完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- page_views';
    RAISE NOTICE '- plan_views';
    RAISE NOTICE '- download_logs';
    RAISE NOTICE '- search_queries';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたビュー:';
    RAISE NOTICE '- plan_view_stats';
    RAISE NOTICE '- download_stats';
    RAISE NOTICE '- popular_pages';
    RAISE NOTICE '- popular_searches';
    RAISE NOTICE '';
    RAISE NOTICE 'アクセス解析機能が有効になりました！';
    RAISE NOTICE '========================================';
END $$;

-- ==========================================================
-- マイグレーション完了
-- ==========================================================
