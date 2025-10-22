# 管理者アカウント追加手順

**対象アカウント**: `admin@ghouse.jp`
**パスワード**: `Ghouse0648`
**作成日**: 2025-10-22

---

## 📋 手順

### ステップ1: Supabase Dashboard にアクセス

1. https://supabase.com/dashboard にアクセス
2. ログインする
3. プロジェクトを選択: **hegpxvyziovlfxdfsrsv**

---

### ステップ2: 新規ユーザーを作成

1. 左サイドバーから **Authentication** → **Users** をクリック
2. 右上の **Add user** ボタンをクリック
3. **Create new user** を選択
4. 以下の情報を入力:

```
Email: admin@ghouse.jp
Password: Ghouse0648
Auto Confirm User: ✅ ONにする（重要！）
```

5. **Create user** ボタンをクリック
6. ユーザーが作成されたことを確認

---

### ステップ3: 管理者権限を付与

#### 方法A: Table Editor から編集（推奨）

1. 左サイドバーから **Table Editor** をクリック
2. `user_profiles` テーブルを選択
3. `admin@ghouse.jp` の行を探す
4. 該当行の **鉛筆アイコン** をクリック
5. 以下のフィールドを編集:

| フィールド | 値 |
|-----------|-----|
| `role` | `admin` |
| `company_name` | `株式会社Gハウス` |
| `company_code` | `GH000` |
| `contact_name` | `西野秀樹` |
| `phone` | `06-6954-0648` |
| `status` | `active` |

6. **Save** をクリック

#### 方法B: SQL Editor から実行

1. 左サイドバーから **SQL Editor** をクリック
2. **New query** をクリック
3. 以下の SQL を貼り付けて実行:

```sql
UPDATE user_profiles
SET
    company_name = '株式会社Gハウス',
    company_code = 'GH000',
    contact_name = '西野秀樹',
    phone = '06-6954-0648',
    role = 'admin',
    status = 'active',
    updated_at = NOW()
WHERE email = 'admin@ghouse.jp';
```

4. **Run** ボタンをクリック

---

### ステップ4: 確認

1. **Table Editor** → `user_profiles` を開く
2. 以下の SQL で確認:

```sql
SELECT
    id,
    email,
    company_name,
    role,
    status,
    created_at
FROM user_profiles
WHERE email IN ('admin@ghouse.co.jp', 'admin@ghouse.jp')
ORDER BY created_at DESC;
```

3. 両方のアカウントが表示され、`role` が `admin` になっていることを確認

---

### ステップ5: ログインテスト

#### ローカル環境

1. ターミナルで開発サーバーを起動:
```bash
npm run dev
```

2. ブラウザで開く:
```
http://localhost:3000/admin-login.html
```

3. ログイン情報を入力:
   - Email: `admin@ghouse.jp`
   - Password: `Ghouse0648`

4. ログイン成功後、`/admin.html` にリダイレクトされることを確認

#### 本番環境

1. https://lifex-btob.vercel.app/admin-login.html にアクセス
2. 同じログイン情報でテスト
3. 管理画面にアクセスできることを確認

---

## ✅ 確認項目

- [ ] Supabase でユーザーが作成された
- [ ] `user_profiles` テーブルに行が存在する
- [ ] `role` が `admin` になっている
- [ ] `status` が `active` になっている
- [ ] ローカル環境でログインできた
- [ ] 本番環境でログインできた
- [ ] 管理画面の全機能にアクセスできる

---

## 🚨 トラブルシューティング

### エラー1: ログインできない

**原因**: `user_profiles` に行が作成されていない

**解決策**:
1. **Table Editor** → `user_profiles` を確認
2. 行が存在しない場合、手動で INSERT:

```sql
INSERT INTO user_profiles (
    id,
    email,
    company_name,
    company_code,
    contact_name,
    phone,
    role,
    status
)
SELECT
    auth.users.id,
    'admin@ghouse.jp',
    '株式会社Gハウス',
    'GH000',
    '西野秀樹',
    '06-6954-0648',
    'admin',
    'active'
FROM auth.users
WHERE auth.users.email = 'admin@ghouse.jp';
```

### エラー2: ログイン後すぐにログアウトされる

**原因**: RLS ポリシーの問題

**解決策**:
```sql
-- user_profiles のポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

必要に応じて `supabase-auth-migration.sql` を再実行

### エラー3: 管理画面にアクセスできない

**原因**: `role` が `admin` になっていない

**解決策**:
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@ghouse.jp';
```

---

## 📞 サポート

問題が解決しない場合:

1. ブラウザの開発者ツール → Console でエラーを確認
2. Supabase Dashboard → Logs → API でエラーログを確認
3. `docs/admin-account-setup.md` を参照

---

**作成日**: 2025-10-22
**作成者**: Claude Code
