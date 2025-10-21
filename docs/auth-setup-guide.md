# Supabase Auth セットアップガイド

**作成日**: 2025-01-21
**目的**: Supabase Auth統合の手順書

---

## 📋 前提条件

- Supabaseプロジェクトが作成済みであること
- Supabase Dashboardへのアクセスがあること
- プロジェクトURL とAnon Key が判明していること

---

## 🔧 セットアップ手順

### ステップ1: データベースマイグレーションの実行

#### 1.1 Supabase Dashboardにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 該当プロジェクトを選択
3. 左サイドバーから **SQL Editor** をクリック

#### 1.2 認証テーブルのマイグレーション

**使用するファイル**: `supabase-auth-migration-minimal.sql`

1. **New query** ボタンをクリック
2. `supabase-auth-migration-minimal.sql` の内容を全てコピー
3. SQLエディターに貼り付け
4. **Run** ボタンをクリック

**期待される結果:**
```
✅ user_profiles テーブル作成成功
✅ login_history テーブル作成成功
✅ RLSポリシー作成成功
✅ トリガー作成成功
✅ ヘルパー関数作成成功
```

#### 1.3 テーブル作成の確認

1. 左サイドバーから **Table Editor** をクリック
2. 以下のテーブルが作成されていることを確認:
   - `user_profiles`
   - `login_history`

#### 1.4 既存テーブルへのRLS適用（オプション）

**既に plans, faqs, rules, downloads テーブルが存在する場合のみ実行**

**使用するファイル**: `supabase-auth-migration-rls-only.sql`

1. **New query** ボタンをクリック
2. `supabase-auth-migration-rls-only.sql` の内容を全てコピー
3. SQLエディターに貼り付け
4. **Run** ボタンをクリック

このSQLは既存テーブルにRLS（アクセス制御）を追加します。テーブルが存在しない場合は自動的にスキップされます。

---

### ステップ2: 管理者アカウントの作成

#### 2.1 Supabase Authで管理者ユーザーを作成

1. 左サイドバーから **Authentication** → **Users** をクリック
2. **Add user** → **Create new user** をクリック
3. 以下の情報を入力:

```
Email: admin@ghouse.co.jp
Password: <セキュアなパスワードを設定>
Auto Confirm User: ✅ チェックを入れる
```

4. **Create user** をクリック
5. 作成されたユーザーの **UUID** をコピー（例: `550e8400-e29b-41d4-a716-446655440000`）

#### 2.2 user_profilesテーブルを確認

マイグレーションスクリプトの `handle_new_user()` トリガーにより、
`user_profiles` テーブルに自動的にプロファイルが作成されます。

1. **Table Editor** → **user_profiles** を開く
2. 新しいレコードが自動作成されていることを確認
3. 以下のフィールドを手動で更新:

```sql
UPDATE user_profiles
SET
  company_name = 'Gハウス本部',
  company_code = 'GH000',
  contact_name = '管理者',
  role = 'admin',
  status = 'active'
WHERE email = 'admin@ghouse.co.jp';
```

**または、Table Editorから直接編集:**
- `company_name`: Gハウス本部
- `company_code`: GH000
- `contact_name`: 管理者
- `role`: admin ← **重要！**
- `status`: active

---

### ステップ3: テスト用加盟店アカウントの作成（オプション）

#### 3.1 加盟店ユーザーを作成

1. **Authentication** → **Users** → **Add user**
2. 以下の情報を入力:

```
Email: test-member@example.com
Password: <テスト用パスワード>
Auto Confirm User: ✅ チェックを入れる
```

3. **Create user** をクリック

#### 3.2 user_profilesを編集

```sql
UPDATE user_profiles
SET
  company_name = 'テスト加盟店',
  company_code = 'TEST001',
  contact_name = 'テスト担当者',
  role = 'member',
  status = 'active'
WHERE email = 'test-member@example.com';
```

---

### ステップ4: フロントエンド実装の統合

#### 4.1 既存の管理ページに認証ガードを追加

全ての管理ページ（admin-*.html）の `<head>` セクションに以下を追加:

```html
<!-- Supabase Auth Guard -->
<script type="module" src="/js/auth-guard.js"></script>
```

**追加対象ページ例:**
- `src/admin.html`
- `src/admin-plans.html`
- `src/admin-faq.html`
- `src/admin-rules.html`
- `src/admin-downloads.html`
- その他全ての `admin-*.html`

#### 4.2 管理者専用ページの保護

管理者のみアクセス可能なページには、以下のように設定:

```html
<!-- Supabase Auth Guard (Admin Only) -->
<script type="module">
    import { protectPage } from '/js/auth-guard.js';
    await protectPage({ requireAdmin: true });
</script>
```

**管理者専用ページ例:**
- ユーザー管理ページ
- システム設定ページ

#### 4.3 ログアウトボタンの追加

ナビゲーションバーやヘッダーに以下のボタンを追加:

```html
<button data-logout class="logout-button">
    ログアウト
</button>
```

`data-logout` 属性があるボタンは、`auth-guard.js` が自動的にログアウト機能を紐付けます。

#### 4.4 ユーザー情報の表示（オプション）

ページ内でユーザー情報を表示したい場合:

```html
<!-- ユーザー名 -->
<span id="user-name"></span>

<!-- 会社名 -->
<span id="company-name"></span>

<!-- 会社コード -->
<span id="company-code"></span>

<!-- ロール -->
<span id="user-role"></span>
```

`auth-guard.js` がこれらの要素を自動的に更新します。

#### 4.5 管理者専用要素の表示制御

管理者のみに表示したい要素には `data-admin-only` 属性を追加:

```html
<div data-admin-only>
    <a href="/admin-users.html">ユーザー管理</a>
</div>
```

加盟店ユーザーには自動的に非表示になります。

---

### ステップ5: テスト

#### 5.1 ログインテスト

1. ブラウザで開発サーバーにアクセス
2. `/admin-login.html` にアクセス
3. 作成した管理者アカウントでログイン:
   - Email: `admin@ghouse.co.jp`
   - Password: <設定したパスワード>
4. ログイン成功後、`/admin.html` にリダイレクトされることを確認

#### 5.2 認証保護のテスト

1. ログアウトせずに `/admin-plans.html` などにアクセス → アクセス可能
2. ログアウトする
3. 再度 `/admin-plans.html` にアクセス → `/admin-login.html` にリダイレクトされることを確認

#### 5.3 RLSポリシーのテスト

1. 加盟店アカウントでログイン（`test-member@example.com`）
2. プランデータが閲覧できることを確認
3. プラン作成・編集が**できない**ことを確認（管理者のみ可能）

#### 5.4 ログイン履歴の確認

1. **Table Editor** → **login_history** を開く
2. ログイン試行が記録されていることを確認

---

## 🔐 セキュリティチェックリスト

### 必須項目

- [ ] 管理者アカウントのパスワードは強固（12文字以上、記号含む）
- [ ] 全ての管理ページに `auth-guard.js` を追加済み
- [ ] RLSポリシーが全テーブルで有効
- [ ] ログイン履歴が記録されている
- [ ] 加盟店は他社のデータを閲覧できない

### 推奨項目

- [ ] パスワードリセット機能のテスト完了
- [ ] セッションタイムアウトの動作確認
- [ ] 複数ブラウザでの同時ログインテスト

---

## 🚨 トラブルシューティング

### 問題1: ログインできない

**症状:**
- メール・パスワードを入力してもログイン失敗

**原因と対策:**
1. Supabase Auth でユーザーが作成されているか確認
2. `user_profiles` テーブルに対応するレコードがあるか確認
3. `status` が `active` になっているか確認
4. ブラウザのコンソールでエラーメッセージを確認

### 問題2: ログイン後すぐにログイン画面に戻る

**症状:**
- ログイン成功後、管理画面にアクセスできない

**原因と対策:**
1. `user_profiles.status` が `active` か確認
2. ブラウザのCookieが有効か確認
3. コンソールで認証エラーがないか確認

### 問題3: RLSポリシーでデータが表示されない

**症状:**
- ログイン成功したが、プランなどのデータが表示されない

**原因と対策:**
1. SQL EditorでRLSポリシーが正しく作成されているか確認:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'plans';
   ```
2. ポリシーの条件を確認
3. 開発中は一時的にRLSを無効化してテスト:
   ```sql
   ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
   ```
   ※本番環境では必ず有効化してください

### 問題4: パスワードリセットメールが届かない

**症状:**
- パスワードリセットを実行しても メールが届かない

**原因と対策:**
1. Supabase Authのメール設定を確認:
   - **Authentication** → **Email Templates** → **Reset Password**
2. メールプロバイダーの設定を確認
3. 迷惑メールフォルダを確認

---

## 📚 関連ドキュメント

- [Supabase Auth実装計画](./auth-implementation-plan.md)
- [実装状況レポート](./implementation-status-report.md)
- [README.md](../README.md)

---

## 📞 サポート

技術的な問題や質問については、以下を参照してください:

- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)

---

**作成者**: Claude Code (Sonnet 4.5)
**最終更新**: 2025-01-21
