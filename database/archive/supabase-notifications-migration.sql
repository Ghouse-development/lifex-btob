-- ==========================================================
-- LIFE X 通知・お知らせ機能 マイグレーションファイル
-- ==========================================================
-- 作成日: 2025-01-21
-- 説明: お知らせ機能のためのテーブルとRLSポリシーを作成
-- ==========================================================

-- notifications テーブル（お知らせ）
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'plan', 'rule', 'download', 'faq', 'system', 'general'
    priority TEXT DEFAULT 'normal', -- 'high', 'normal', 'low'
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
    target_role TEXT DEFAULT 'all', -- 'all', 'admin', 'member'
    related_item_id TEXT, -- プランID、ルールID等（オプション）
    related_item_type TEXT, -- 'plan', 'rule', 'download', 'faq'（オプション）
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_published_at ON notifications(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);

-- notification_reads テーブル（既読管理）
CREATE TABLE IF NOT EXISTS notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads(notification_id);

-- RLS（Row Level Security）を有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- notifications テーブルのRLSポリシー

-- 全ての認証済みユーザーが公開済みのお知らせを閲覧可能
CREATE POLICY "Authenticated users can view published notifications"
ON notifications FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND status = 'published'
    AND (
        target_role = 'all'
        OR target_role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    )
);

-- 管理者は全てのお知らせを閲覧可能
CREATE POLICY "Admins can view all notifications"
ON notifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 管理者のみがお知らせを作成可能
CREATE POLICY "Admins can create notifications"
ON notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 管理者のみがお知らせを更新可能
CREATE POLICY "Admins can update notifications"
ON notifications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 管理者のみがお知らせを削除可能
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- notification_reads テーブルのRLSポリシー

-- ユーザーは自分の既読情報のみ閲覧可能
CREATE POLICY "Users can view own reads"
ON notification_reads FOR SELECT
USING (auth.uid() = user_id);

-- ユーザーは自分の既読情報のみ作成可能
CREATE POLICY "Users can create own reads"
ON notification_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 管理者は全ての既読情報を閲覧可能
CREATE POLICY "Admins can view all reads"
ON notification_reads FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- トリガー: updated_at の自動更新
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- ビュー: 未読通知数を取得しやすくする
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
    n.*,
    (SELECT COUNT(*) FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = auth.uid()) = 0 AS is_unread
FROM notifications n
WHERE n.status = 'published'
AND (n.target_role = 'all' OR n.target_role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
AND (n.expires_at IS NULL OR n.expires_at > NOW());

-- 初期データ: サンプルお知らせ（オプション）
-- INSERT INTO notifications (title, content, category, priority, status, target_role, published_at)
-- VALUES
--     ('LIFE X ポータルサイトへようこそ', 'LIFE X 加盟店専用ポータルサイトをご利用いただきありがとうございます。', 'system', 'high', 'published', 'all', NOW()),
--     ('新プラン追加のお知らせ', '30坪タイプの新しいプランが追加されました。詳細はプラン一覧ページをご確認ください。', 'plan', 'normal', 'published', 'all', NOW());

-- ==========================================================
-- マイグレーション完了
-- ==========================================================
