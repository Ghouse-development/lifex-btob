-- ======================================
-- Supabaseダッシュボードで実行してください
-- ======================================
-- 1. https://supabase.com/dashboard にアクセス
-- 2. プロジェクトを選択
-- 3. 左側メニューの「SQL Editor」をクリック
-- 4. このファイルの内容を全てコピー＆ペースト
-- 5. 「Run」をクリック
-- ======================================

-- RLS（Row Level Security）を無効化してテスト環境を整える
-- 注意: 本番環境では適切なRLSポリシーを設定してください

-- FAQテーブルのRLS無効化
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories DISABLE ROW LEVEL SECURITY;

-- ルールテーブルのRLS無効化
ALTER TABLE rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE rule_categories DISABLE ROW LEVEL SECURITY;

-- ダウンロードテーブルのRLS無効化
ALTER TABLE downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE download_categories DISABLE ROW LEVEL SECURITY;

-- プランテーブルのRLS無効化
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_files DISABLE ROW LEVEL SECURITY;

-- その他のテーブルのRLS無効化
ALTER TABLE design_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq_feedback DISABLE ROW LEVEL SECURITY;

-- 完了メッセージ
SELECT 'RLSを無効化しました。FAQの作成・更新・削除が可能になりました。' as message;