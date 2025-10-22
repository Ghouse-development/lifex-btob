# LIFE X ポータル デプロイガイド

**最終更新日**: 2025-01-21
**対象**: システム管理者
**所要時間**: 約30-45分

---

## 📋 概要

このガイドでは、LIFE X 加盟店ポータルサイトを本番環境にデプロイする手順を説明します。

### 前提条件

- ✅ Supabase プロジェクトが作成済み
- ✅ Vercel アカウントが作成済み
- ✅ GitHub リポジトリにコードがプッシュ済み
- ✅ Gemini API キーを取得済み（AI機能を使用する場合）

---

## 🗂️ デプロイステップ

### ステップ1: Supabase データベース設定【必須】

#### 1.1. Supabase Dashboardにログイン

https://supabase.com にアクセスし、プロジェクトを選択

#### 1.2. SQL Editor を開く

左サイドバーから「SQL Editor」をクリック

#### 1.3. マイグレーションファイルの実行

以下の順番でSQLファイルを実行してください：

##### **A. 認証システム（必須）**
```sql
-- supabase-auth-migration.sql の内容をコピー&ペースト
-- 実行ボタンをクリック
```

**含まれるテーブル:**
- `user_profiles` - ユーザープロファイル
- `login_history` - ログイン履歴
- RLSポリシー、トリガー、関数

##### **B. 通知機能（推奨）**
```sql
-- supabase-notifications-migration.sql の内容をコピー&ペースト
-- 実行ボタンをクリック
```

**含まれるテーブル:**
- `notifications` - お知らせ
- `notification_reads` - 既読管理

##### **C. アクセス解析（オプション）**
```sql
-- supabase-analytics-migration.sql の内容をコピー&ペースト
-- 実行ボタンをクリック
```

**含まれるテーブル:**
- `page_views` - ページビュー
- `plan_views` - プラン閲覧
- `download_logs` - ダウンロードログ
- `search_queries` - 検索クエリ

#### 1.4. テーブル作成の確認

左サイドバーから「Table Editor」をクリックし、以下のテーブルが作成されていることを確認：

✅ user_profiles
✅ login_history
✅ notifications
✅ notification_reads
✅ page_views
✅ plan_views
✅ download_logs
✅ search_queries

---

### ステップ2: 管理者アカウント作成【必須】

#### 2.1. 初回ユーザー作成

1. Supabase Dashboard → 「Authentication」 → 「Users」
2. 「Add user」ボタンをクリック
3. 以下の情報を入力：
   - Email: `admin@ghouse.co.jp`（または任意の管理者メールアドレス）
   - Password: 6文字以上の安全なパスワード
   - Auto Confirm User: **ON**（チェックを入れる）
4. 「Create user」をクリック

#### 2.2. 管理者権限の付与

1. Supabase Dashboard → 「Table Editor」 → `user_profiles`
2. 作成したユーザーの行を見つける（メールアドレスで検索）
3. 以下のフィールドを編集：
   - `role`: `admin` に変更
   - `company_name`: `株式会社Gハウス`（または任意）
   - `status`: `active` のまま
4. 「Save」をクリック

#### 2.3. ログインテスト（ローカル環境）

開発サーバーを起動してログインテスト：

```bash
npm run dev
```

http://localhost:3000/admin-login.html にアクセスし、作成したメールアドレスとパスワードでログインできることを確認

---

### ステップ3: Vercel 環境変数設定【必須】

#### 3.1. Vercel Dashboardにログイン

https://vercel.com にアクセス

#### 3.2. プロジェクトを選択

LIFE X ポータルのプロジェクトをクリック

#### 3.3. 環境変数の設定

1. 「Settings」タブをクリック
2. 左サイドバーから「Environment Variables」をクリック
3. 以下の環境変数を追加：

##### **A. Gemini API Key（AI機能を使用する場合）**

| Key | Value | Environment |
|-----|-------|-------------|
| `GEMINI_API_KEY` | `AIza...`（取得したAPIキー） | Production, Preview, Development |

4. 「Save」をクリック

---

### ステップ4: Vercel デプロイ【自動】

#### 4.1. GitHub連携確認

Vercel が GitHub リポジトリと連携されていることを確認

#### 4.2. 自動デプロイ

GitHub の `main` ブランチにプッシュすると、Vercel が自動的にデプロイを開始します。

```bash
git push origin main
```

#### 4.3. デプロイ状況の確認

1. Vercel Dashboard で「Deployments」タブを確認
2. 最新のデプロイが「Ready」になるまで待機（通常2-3分）
3. デプロイURLをクリックして本番環境を確認

---

### ステップ5: 本番環境テスト【必須】

#### 5.1. ログインテスト

1. 本番環境の `/admin-login.html` にアクセス
2. 作成した管理者アカウントでログイン
3. 管理画面にリダイレクトされることを確認

#### 5.2. 機能テスト

以下の機能が正常に動作することを確認：

**認証機能:**
- ✅ ログイン
- ✅ ログアウト
- ✅ パスワードリセット
- ✅ プロファイル表示

**管理機能（管理者のみ）:**
- ✅ プラン管理
- ✅ FAQ管理
- ✅ ルール管理
- ✅ ダウンロード管理
- ✅ ユーザー管理
- ✅ お知らせ管理

**一般機能:**
- ✅ プラン検索
- ✅ 間取マトリックス
- ✅ ダウンロード
- ✅ FAQ閲覧

#### 5.3. セキュリティテスト

- ✅ 未認証でアクセスすると `/admin-login.html` にリダイレクトされる
- ✅ メンバーアカウントで管理者専用ページにアクセスできない
- ✅ RLSポリシーが正常に機能している

---

## 🔐 セキュリティチェックリスト

デプロイ前に以下を確認してください：

### データベース
- [ ] 全テーブルでRLSが有効化されている
- [ ] 適切なRLSポリシーが設定されている
- [ ] 管理者とメンバーで適切にアクセス制御されている

### 認証
- [ ] パスワードがハッシュ化されている（Supabase Auth自動）
- [ ] セッション管理が適切に機能している
- [ ] パスワードリセット機能が動作する

### API
- [ ] Supabase API Keyは公開しても安全なanon key
- [ ] Gemini API Keyは環境変数で管理されている
- [ ] APIエンドポイントが適切に保護されている

### HTTPS
- [ ] 本番環境でHTTPSが強制されている（Vercel自動）
- [ ] Mixed Contentの警告がない

---

## 🚨 トラブルシューティング

### エラー1: ログイン後にエラーが表示される

**原因:** テーブルが作成されていない、またはRLSポリシーが不足

**解決策:**
1. Supabase Dashboard → Table Editor でテーブルを確認
2. SQL Editorでマイグレーションファイルを再実行
3. ブラウザのキャッシュをクリア

---

### エラー2: ユーザー作成時に「permission denied」

**原因:** RLSポリシーが厳しすぎる

**解決策:**
1. Supabase Dashboard → SQL Editor
2. 以下のSQLを実行して一時的にRLSを無効化：
```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```
3. ユーザー作成後、再度有効化：
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

### エラー3: AI機能が動作しない

**原因:** Gemini API Keyが設定されていない

**解決策:**
1. Vercel Dashboard → Settings → Environment Variables
2. `GEMINI_API_KEY` が正しく設定されているか確認
3. 環境変数変更後、再デプロイが必要

---

## 📊 デプロイ後の確認事項

### 1週間後
- [ ] ログイン履歴を確認（異常なアクセスがないか）
- [ ] エラーログを確認（Vercel Dashboard）
- [ ] ユーザーからのフィードバック収集

### 1ヶ月後
- [ ] アクセス解析データを確認
- [ ] パフォーマンスモニタリング
- [ ] セキュリティアップデート確認

---

## 🔄 継続的なメンテナンス

### 定期タスク

**毎週:**
- ログイン履歴の確認
- お知らせの更新

**毎月:**
- プラン・ルールの更新確認
- アクセス解析レポート作成
- セキュリティパッチ適用

**四半期:**
- 全機能の動作確認
- パフォーマンステスト
- ユーザーフィードバックの反映

---

## 📞 サポート

### ドキュメント
- `docs/auth-setup-guide.md` - 認証システム詳細
- `docs/gemini-api-setup-guide.md` - Gemini API設定
- `docs/auth-implementation-summary.md` - 実装サマリー

### 外部リソース
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Gemini API公式ドキュメント](https://ai.google.dev/docs)

---

**デプロイ完了！** 🎉

これでLIFE X 加盟店ポータルサイトが本番環境で稼働しています。
