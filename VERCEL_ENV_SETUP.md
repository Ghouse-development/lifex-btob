# Vercel 環境変数設定ガイド

## 🚨 緊急: Invalid API key エラーの解決

### 問題

ログインできない原因は **Vercel の環境変数が未設定** です。

### 解決手順

#### ステップ1: Vercel Dashboard にアクセス

1. https://vercel.com/dashboard にアクセス
2. ログイン: `its@ghouse.jp` / `Ghouse0648`
3. プロジェクト `lifex-btob` を選択

#### ステップ2: 環境変数を追加

1. **Settings** タブをクリック
2. 左サイドバーから **Environment Variables** を選択
3. 以下の環境変数を追加:

##### 必須環境変数

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://hegpxvyziovlfxdfsrsv.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | 下記参照 ↓ | Production, Preview, Development |

##### VITE_SUPABASE_ANON_KEY の取得方法

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `hegpxvyziovlfxdfsrsv` を選択
3. **Settings** → **API** をクリック
4. "Project API keys" セクションを探す
5. **anon** の **public** キーをコピー
6. Vercel に貼り付け

または、以下の値を使用（確認済み）:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws
```

#### ステップ3: 再デプロイ

環境変数を設定したら、**必ず再デプロイ** が必要です:

**方法A: Vercel Dashboard から**
1. **Deployments** タブをクリック
2. 最新のデプロイメントの右側の **⋯** をクリック
3. **Redeploy** をクリック

**方法B: Git push（推奨）**
```bash
# 空のコミットをプッシュして再デプロイ
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push
```

#### ステップ4: 確認

1. 再デプロイ完了を待つ（2-3分）
2. https://lifex-btob.vercel.app/admin-login.html にアクセス
3. ログインテスト:
   - Email: `admin@ghouse.jp`
   - Password: `Ghouse0648`

---

## 📋 環境変数一覧（コピー用）

### Production / Preview / Development 全てに設定

```
VITE_SUPABASE_URL=https://hegpxvyziovlfxdfsrsv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws
```

**重要**: 両方とも **Production**, **Preview**, **Development** 全てにチェックを入れてください！

---

## 🔍 トラブルシューティング

### エラー: Invalid API key

**原因**: 環境変数が設定されていない、または間違っている

**解決**:
1. Vercel Dashboard → Settings → Environment Variables を確認
2. `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が設定されているか
3. 値が正しいか確認
4. 再デプロイ

### エラー: プランが表示されない

**原因**: 環境変数が反映されていない

**解決**:
1. 環境変数設定後、必ず再デプロイ
2. ブラウザのキャッシュをクリア（Ctrl + Shift + Delete）
3. シークレットモードで開く

### ログインできるが403エラー

**原因**: RLSポリシーの問題

**解決**:
1. Supabase Dashboard → Authentication → Users で `admin@ghouse.jp` を確認
2. Table Editor → `user_profiles` で `role` が `admin` になっているか確認

---

## 📞 サポート

設定完了後もログインできない場合:
1. ブラウザの開発者ツール（F12）→ Console でエラーを確認
2. Network タブで API リクエストを確認
3. エラーメッセージをコピーして報告

---

**作成日**: 2025-10-22
**優先度**: 🚨 最高（緊急）
