-- =====================================================
-- Supabase Auth統合 - 既存テーブルへのRLS適用
-- 作成日: 2025-01-21
-- 目的: plans, faqs, rules, downloadsテーブルへのRLS追加
--
-- 前提条件:
-- - user_profiles テーブルが作成済み
-- - plans, faqs, rules, downloads テーブルが存在する
--
-- 実行タイミング:
-- - supabase-auth-migration-minimal.sql 実行後
-- - 既存テーブルが作成された後
-- =====================================================

-- =====================================================
-- 既存テーブルへのRLS追加
-- =====================================================

-- plans テーブル
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans') THEN
        ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Authenticated users can view plans" ON plans;
        CREATE POLICY "Authenticated users can view plans"
        ON plans FOR SELECT
        USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
        CREATE POLICY "Admins can manage plans"
        ON plans FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

        RAISE NOTICE '✅ plans テーブルにRLSを適用しました';
    ELSE
        RAISE NOTICE '⚠️  plans テーブルが存在しません（スキップ）';
    END IF;
END $$;

-- faqs テーブル
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') THEN
        ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Authenticated users can view faqs" ON faqs;
        CREATE POLICY "Authenticated users can view faqs"
        ON faqs FOR SELECT
        USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
        CREATE POLICY "Admins can manage faqs"
        ON faqs FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

        RAISE NOTICE '✅ faqs テーブルにRLSを適用しました';
    ELSE
        RAISE NOTICE '⚠️  faqs テーブルが存在しません（スキップ）';
    END IF;
END $$;

-- rules テーブル
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rules') THEN
        ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Authenticated users can view rules" ON rules;
        CREATE POLICY "Authenticated users can view rules"
        ON rules FOR SELECT
        USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage rules" ON rules;
        CREATE POLICY "Admins can manage rules"
        ON rules FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

        RAISE NOTICE '✅ rules テーブルにRLSを適用しました';
    ELSE
        RAISE NOTICE '⚠️  rules テーブルが存在しません（スキップ）';
    END IF;
END $$;

-- downloads テーブル
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'downloads') THEN
        ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Authenticated users can view downloads" ON downloads;
        CREATE POLICY "Authenticated users can view downloads"
        ON downloads FOR SELECT
        USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage downloads" ON downloads;
        CREATE POLICY "Admins can manage downloads"
        ON downloads FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

        RAISE NOTICE '✅ downloads テーブルにRLSを適用しました';
    ELSE
        RAISE NOTICE '⚠️  downloads テーブルが存在しません（スキップ）';
    END IF;
END $$;

-- =====================================================
-- 実行完了メッセージ
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS適用完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '認証済みユーザー: 全データ閲覧可能';
    RAISE NOTICE '管理者のみ: データの作成・更新・削除可能';
    RAISE NOTICE '';
END $$;
