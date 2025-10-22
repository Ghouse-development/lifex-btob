# 管理者アカウント作成ガイド

**最終更新日**: 2025-01-21
**対象**: システム管理者
**所要時間**: 約5-10分

---

## 📋 概要

LIFE X ポータルサイトの管理者アカウントを作成する手順を説明します。

### 前提条件

- ✅ Supabase プロジェクトが作成済み
- ✅ 以下のSQLが実行済み:
  - `supabase-auth-migration.sql`
  - `supabase-notifications-migration.sql`
  - `supabase-analytics-migration.sql`

---

## 🚀 管理者アカウント作成手順

### ステップ1: Supabase Dashboard にログイン

1. https://supabase.com にアクセス
2. プロジェクトを選択: **hegpxvyziovlfxdfsrsv**
3. 左サイドバーから **Authentication** → **Users** をクリック

### ステップ2: 新規ユーザーを作成

1. 右上の **Add user** → **Create new user** をクリック

2. **ユーザー情報を入力:**

| フィールド | 値 | 説明 |
|-----------|-----|------|
| Email | `admin@ghouse.co.jp` | 管理者メールアドレス（任意に変更可） |
| Password | `[安全なパスワード]` | 6文字以上、英数字記号推奨 |
| Auto Confirm User | **ON** ✅ | **重要**: 必ずチェックを入れる |

3. **Create user** ボタンをクリック

4. ユーザーが作成されたことを確認（Users一覧に表示される）

### ステップ3: 管理者権限を付与

1. 左サイドバーから **Table Editor** をクリック

2. `user_profiles` テーブルを選択

3. 作成したユーザーの行を探す
   - `email` 列で検索: `admin@ghouse.co.jp`

4. 該当行の **鉛筆アイコン** をクリックして編集

5. 以下のフィールドを設定:

| フィールド | 値 | 説明 |
|-----------|-----|------|
| `role` | `admin` | **重要**: `member` から `admin` に変更 |
| `company_name` | `株式会社Gハウス` | 会社名（任意） |
| `company_code` | `GH000` | 本部用コード（任意） |
| `contact_name` | `西野秀樹` | 担当者名（任意） |
| `phone` | `06-6954-0648` | 電話番号（任意） |
| `status` | `active` | すでに設定されている |

6. **Save** ボタンをクリック

### ステップ4: ログインテスト

#### ローカル環境でテスト

1. ターミナルで開発サーバーを起動:
```bash
npm run dev
```

2. ブラウザで開く:
```
http://localhost:3000/admin-login.html
```

3. 作成したメールアドレスとパスワードでログイン:
   - Email: `admin@ghouse.co.jp`
   - Password: [設定したパスワード]

4. ログイン成功後、`/admin.html` にリダイレクトされることを確認

#### 本番環境でテスト

1. Vercel デプロイURLにアクセス:
```
https://lifex-btob.vercel.app/admin-login.html
```

2. 同様にログインテスト

---

## 🔐 セキュリティのベストプラクティス

### パスワード要件

- ✅ **最低8文字以上**
- ✅ 英大文字・小文字を含む
- ✅ 数字を含む
- ✅ 記号を含む（推奨）

**良い例:**
```
AdminG@House2025!
Lifex#Admin123
```

**悪い例:**
```
123456        （短すぎる、単純）
password      （一般的すぎる）
admin123      （予測しやすい）
```

### 推奨設定

| 設定項目 | 推奨値 | 理由 |
|---------|--------|------|
| メールアドレス | 実際に使用しているメール | パスワードリセット用 |
| パスワード | 16文字以上 | セキュリティ強化 |
| 2段階認証 | 有効化（将来実装） | 不正ログイン防止 |

---

## 👥 追加ユーザー作成（加盟店アカウント）

### メンバーアカウントの作成

管理者アカウント作成後、加盟店用のメンバーアカウントを作成できます。

#### 手順

1. **管理画面からユーザー追加:**
   - ログイン後、`/admin-users.html` にアクセス
   - 「新規ユーザー追加」ボタンをクリック

2. **ユーザー情報を入力:**

| フィールド | 値 | 例 |
|-----------|-----|-----|
| 会社名 | 加盟店の会社名 | `〇〇工務店` |
| メールアドレス | 加盟店のメール | `info@example.com` |
| 担当者名 | 担当者名 | `山田太郎` |
| 電話番号 | 電話番号 | `06-1234-5678` |
| パスワード | 仮パスワード | `TempPass123!` |
| 役割 | `member` | **管理者以外は必ず member** |

3. **保存** をクリック

4. 加盟店にメールとパスワードを連絡（初回ログイン後に変更を推奨）

---

## 🚨 トラブルシューティング

### エラー1: ログイン後に「permission denied」

**原因**: `user_profiles` テーブルに行が作成されていない

**解決策**:
1. Table Editor → `user_profiles` を確認
2. 該当ユーザーの行が存在するか確認
3. 存在しない場合、手動で追加:

```sql
INSERT INTO user_profiles (id, email, company_name, role, status)
VALUES (
    '[auth.users.id のUUID]',
    'admin@ghouse.co.jp',
    '株式会社Gハウス',
    'admin',
    'active'
);
```

### エラー2: パスワードリセットメールが届かない

**原因**: Supabase のメール設定が未完了

**解決策**:
1. Supabase Dashboard → Settings → Authentication
2. Email Templates を確認
3. SMTP設定を確認（必要に応じて設定）

### エラー3: ログイン後すぐにログアウトされる

**原因**: RLSポリシーの問題

**解決策**:
1. SQL Editor で RLS ポリシーを確認:
```sql
-- user_profiles のポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

2. 必要に応じて `supabase-auth-migration.sql` を再実行

---

## ✅ 確認チェックリスト

管理者アカウント作成後、以下を確認してください:

### ログイン機能

- [ ] `/admin-login.html` でログインできる
- [ ] ログイン後 `/admin.html` にリダイレクトされる
- [ ] ログアウトボタンが機能する

### プロフィール

- [ ] `/admin-profile.html` で情報が表示される
- [ ] プロフィール編集ができる
- [ ] パスワード変更ができる

### 管理機能

- [ ] `/admin-plans.html` - プラン管理画面にアクセスできる
- [ ] `/admin-users.html` - ユーザー管理画面にアクセスできる
- [ ] `/admin-notifications.html` - お知らせ管理画面にアクセスできる

### 権限チェック

- [ ] メンバーアカウントでは管理画面にアクセスできない
- [ ] メンバーアカウントではユーザー管理画面にアクセスできない

---

## 📞 サポート

問題が解決しない場合:

1. **ログを確認:**
   - ブラウザの開発者ツール → Console
   - エラーメッセージをコピー

2. **Supabase ログを確認:**
   - Supabase Dashboard → Logs
   - API、Database のログを確認

3. **ドキュメントを参照:**
   - `docs/deployment-guide.md` - デプロイ全般
   - `docs/auth-setup-guide.md` - 認証詳細

---

**次のステップ**: `docs/notification-test-guide.md` を参照して、お知らせ機能をテストしてください。
