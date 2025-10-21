# Supabase Auth統合 実装計画

**作成日**: 2025-01-21
**目的**: 本番運用可能なセキュリティレベルの実現
**期間**: 2-3週間（段階的実装）

---

## 📋 現状の問題点

### 現在の認証システム
- **方式**: LocalStorageベースの簡易認証
- **パスワード**: 全加盟店共通（`admin123`）
- **保存場所**: LocalStorage（暗号化なし）
- **セッション**: SessionStorage（30分）

### 問題点
1. ❌ パスワードが平文で保存
2. ❌ 全加盟店が同じパスワード
3. ❌ ブラウザのDevToolsでパスワード確認可能
4. ❌ 加盟店別のアクセス制御不可
5. ❌ セッション管理が脆弱
6. ❌ 監査ログなし

---

## 🎯 目標

### セキュリティ要件
✅ 加盟店ごとに独立したアカウント
✅ パスワードの安全な保存（ハッシュ化）
✅ セッション管理の強化
✅ 加盟店別のデータアクセス制御（RLS）
✅ ログイン履歴の記録
✅ パスワードリセット機能

### 機能要件
✅ メールアドレス + パスワードでログイン
✅ ログアウト機能
✅ セッション自動延長
✅ 未認証ユーザーの自動リダイレクト
✅ 加盟店プロファイル管理

---

## 🏗️ システム設計

### 1. データベース設計

#### テーブル構成

**A. user_profiles（ユーザープロファイル）**
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,        -- 加盟店名
    company_code TEXT UNIQUE,          -- 加盟店コード
    contact_name TEXT,                 -- 担当者名
    phone TEXT,                        -- 電話番号
    role TEXT DEFAULT 'member',        -- 役割: 'admin', 'member'
    status TEXT DEFAULT 'active',      -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_user_profiles_company_code ON user_profiles(company_code);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
```

**B. login_history（ログイン履歴）**
```sql
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    status TEXT,  -- 'success', 'failed'
    failure_reason TEXT
);

-- インデックス
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at DESC);
```

### 2. RLS（Row Level Security）設計

#### 基本方針
- 各加盟店は**自社のデータのみ**閲覧・編集可能
- 本部（admin役割）は**全てのデータ**を閲覧・編集可能

#### ポリシー例

**user_profiles テーブル**
```sql
-- 自分のプロファイルは閲覧可能
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- 自分のプロファイルは更新可能
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 管理者は全て閲覧可能
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

**plans テーブル（例）**
```sql
-- 全ての認証済みユーザーがプランを閲覧可能
CREATE POLICY "Authenticated users can view plans"
ON plans FOR SELECT
USING (auth.role() = 'authenticated');

-- 管理者のみがプランを作成・更新・削除可能
CREATE POLICY "Admins can manage plans"
ON plans FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 3. 認証フロー設計

#### A. ログインフロー
```
1. ユーザーがメール+パスワード入力
   ↓
2. Supabase Auth で認証
   ↓
3. 認証成功
   ↓
4. user_profiles から役割・ステータス確認
   ↓
5. ステータスが 'active' の場合のみログイン許可
   ↓
6. login_history に記録
   ↓
7. メインページにリダイレクト
```

#### B. セッション管理
```
- セッション有効期限: 24時間
- 自動延長: あり（アクティビティ検出時）
- リフレッシュトークン: 7日間
```

#### C. ページ保護
```
全ての管理ページ（/admin-*.html）:
  ↓
1. ページ読み込み時に認証チェック
   ↓
2. 未認証の場合 → /admin-login.html にリダイレクト
   ↓
3. 認証済みだが status='inactive' → エラーメッセージ
   ↓
4. 認証済み＆active → ページ表示
```

---

## 📝 実装ステップ

### Phase 1: データベース準備【1-2日】

**タスク:**
- [ ] user_profiles テーブル作成
- [ ] login_history テーブル作成
- [ ] RLSポリシー設定
- [ ] トリガー設定（updated_at自動更新）

**成果物:**
- `supabase-auth-migration.sql`

---

### Phase 2: 認証機能実装【3-4日】

**タスク:**
- [ ] 認証ヘルパー関数作成（`src/js/auth.js`）
  - signIn()
  - signOut()
  - getCurrentUser()
  - checkAuth()
- [ ] ログインページ改修（`admin-login.html`）
  - Supabase Auth統合
  - エラーハンドリング
  - パスワードリセットリンク
- [ ] ログアウト機能統合

**成果物:**
- `src/js/supabase-auth.js`
- 改修された `admin-login.html`

---

### Phase 3: ページ保護実装【2-3日】

**タスク:**
- [ ] 認証チェックミドルウェア作成
- [ ] 全管理ページに認証チェック追加
  - admin-plans.html
  - admin-faq.html
  - admin-rules.html
  - admin-downloads.html
  - その他管理ページ
- [ ] 未認証時のリダイレクト実装

**成果物:**
- 認証保護された管理ページ

---

### Phase 4: プロファイル管理【2-3日】

**タスク:**
- [ ] プロファイル表示ページ
- [ ] プロファイル編集機能
- [ ] パスワード変更機能
- [ ] ログイン履歴表示

**成果物:**
- `admin-profile.html`（新規）

---

### Phase 5: 管理者機能【2-3日】

**タスク:**
- [ ] ユーザー管理画面（admin-users.html）
  - ユーザー一覧
  - ユーザー作成
  - ユーザー編集
  - ステータス変更
- [ ] 役割管理
- [ ] ログイン履歴表示

**成果物:**
- 改修された `admin-users.html`

---

### Phase 6: テスト＆デプロイ【2-3日】

**タスク:**
- [ ] 認証フローのテスト
- [ ] RLSポリシーのテスト
- [ ] セッション管理のテスト
- [ ] 本番環境へのデプロイ
- [ ] 初期ユーザーの作成

---

## 🔐 セキュリティチェックリスト

### 認証
- [ ] パスワードがハッシュ化されている
- [ ] セッショントークンが安全に保存されている
- [ ] パスワードリセット機能が動作する
- [ ] ログイン試行回数制限（Supabase機能）

### アクセス制御
- [ ] RLSポリシーが全テーブルで有効
- [ ] 加盟店は他社のデータを閲覧できない
- [ ] 管理者のみが管理機能にアクセス可能

### 監査
- [ ] ログイン履歴が記録される
- [ ] 失敗したログイン試行も記録される
- [ ] データ変更履歴が記録される（将来実装）

### その他
- [ ] HTTPS強制
- [ ] CSRFトークン（Supabase自動対応）
- [ ] XSS対策（入力サニタイズ）

---

## 📊 移行計画

### 段階的移行戦略

**ステップ1: 並行運用**
- 新しいSupabase Authを実装
- 既存の簡易認証も残す
- 新規ユーザーはSupabase Authを使用

**ステップ2: 移行期間**
- 既存ユーザーに新しいアカウント作成を案内
- 一定期間（2週間）は両方の認証が使用可能

**ステップ3: 完全移行**
- 簡易認証を削除
- Supabase Authのみに統一

### 初期ユーザーの作成

**管理者アカウント（本部）:**
```
Email: admin@ghouse.co.jp
Role: admin
Company: Gハウス本部
Status: active
```

**テスト用加盟店アカウント:**
```
Email: test-member@example.com
Role: member
Company: テスト加盟店
Status: active
```

---

## 🚨 リスクと対策

### リスク1: 既存ユーザーの混乱
**対策:**
- 移行手順の明確なドキュメント作成
- サポート体制の準備
- 移行期間の十分な確保

### リスク2: データアクセス不能
**対策:**
- RLS設定前に十分なテスト
- ロールバック手順の準備
- バックアップの取得

### リスク3: パフォーマンス低下
**対策:**
- インデックスの適切な設定
- クエリパフォーマンスのモニタリング

---

## 📈 成功指標

### 技術指標
- [ ] 認証成功率: 99%以上
- [ ] ログイン時間: 2秒以内
- [ ] セッション維持率: 95%以上

### セキュリティ指標
- [ ] 不正アクセス試行の検出: 100%
- [ ] RLS違反の発生: 0件
- [ ] パスワードリセット成功率: 95%以上

### ユーザー体験指標
- [ ] ログイン完了までのステップ: 2ステップ以内
- [ ] パスワードリセット完了時間: 5分以内

---

## 🔄 次のステップ

1. **この計画をレビュー**
   - 抜け漏れの確認
   - 優先度の調整

2. **Phase 1の開始**
   - データベーススキーマ作成
   - RLSポリシー設定

3. **段階的な実装**
   - 各Phaseを完了後、テストを実施
   - 問題があれば計画を調整

---

**作成者**: Claude Code (Sonnet 4.5)
**最終更新**: 2025-01-21
