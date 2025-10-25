# デプロイ前チェックリスト

## 🎯 使い方

このチェックリストは、デプロイ前後に確認すべき全ての項目を網羅しています。

### クイックチェック（自動）

**デプロイ前:**
```bash
# 包括的システムチェック（15秒）
node scripts/comprehensive-system-check.cjs

# ローカルコンソールエラーチェック（60秒）
node scripts/test-all-pages-console.cjs
```

**デプロイ後（必須）:**
```bash
# 本番環境コンソールエラーチェック（60秒）
node scripts/test-production-console.cjs
```

**❗ 重要:** デプロイ後は必ず `test-production-console.cjs` を実行してください。ローカルで問題がなくても、本番環境でエラーが発生する可能性があります。

---

## ✅ チェック項目

### 1. ローカル環境 ⚙️

#### 環境変数
- [ ] `.env.local` ファイルが存在する
- [ ] `VITE_SUPABASE_URL` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が設定されている（開発用のみ）

**確認方法:**
```bash
cat .env.local | grep -E "VITE_SUPABASE|SUPABASE_SERVICE"
```

#### ファイル構成
- [ ] `public/js/common.js` が存在する（86KB前後）
- [ ] `public/js/supabase-auth.js` が存在する（14KB前後）
- [ ] `public/js/supabase-client.js` が存在する（CDN版、6KB前後）
- [ ] `src/js/supabase-auth.js` が存在する（14KB前後）
- [ ] `src/js/auth-guard.js` が存在する（7KB前後）

**確認方法:**
```bash
ls -lh public/js/ src/js/ | grep supabase
```

#### 設定ファイル
- [ ] `vercel.json` の buildCommand が `npm run build`
- [ ] `vercel.json` の outputDirectory が `dist`
- [ ] `vercel.json` に rewrites が12件以上設定されている
- [ ] `vite.config.js` に26ページの input 設定がある
- [ ] `package.json` の build script が正しい

**確認方法:**
```bash
cat vercel.json | grep -E "buildCommand|outputDirectory|rewrites"
```

#### ビルド
- [ ] `npm run build` がエラーなく完了する
- [ ] `dist/` ディレクトリに25個以上のHTMLファイルが生成される
- [ ] `dist/assets/` ディレクトリにJS/CSSファイルが生成される

**確認方法:**
```bash
npm run build && ls dist/*.html | wc -l
```

#### Git
- [ ] 未コミットの変更がない、または意図的なもの
- [ ] 最新のコミットメッセージが適切
- [ ] 作業ブランチが正しい

**確認方法:**
```bash
git status
git log -1 --oneline
```

---

### 2. Vercel設定 🚀

#### 環境変数（Vercel Dashboard）
Vercel Dashboard → プロジェクト → Settings → Environment Variables

- [ ] `VITE_SUPABASE_URL` が設定されている
  - Scope: Production, Preview, Development
  - 値: `https://hegpxvyziovlfxdfsrsv.supabase.co`

- [ ] `VITE_SUPABASE_ANON_KEY` が設定されている
  - Scope: Production, Preview, Development
  - 値: Supabaseの anon/public key

**確認方法（CLIが設定されている場合）:**
```bash
vercel env ls
```

**手動確認方法:**
1. https://vercel.com にログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 上記2つの変数が **Production**, **Preview**, **Development** 全てに設定されているか確認

#### ビルド設定
Vercel Dashboard → プロジェクト → Settings → General

- [ ] Framework Preset: Vite（または None）
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

#### デプロイ
- [ ] 最新のデプロイが成功している
- [ ] デプロイログにエラーがない
- [ ] Preview URLでページが正常に表示される

**確認方法:**
1. Vercel Dashboard → Deployments
2. 最新のデプロイをクリック
3. Building → Success を確認
4. Preview URLにアクセスしてテスト

---

### 3. Supabase設定 🗄️

#### 接続情報
Supabase Dashboard → Project Settings → API

- [ ] Project URL が `.env.local` と一致する
- [ ] anon/public key が `.env.local` と一致する
- [ ] service_role key が `.env.local` と一致する（開発用のみ）

**確認方法:**
1. https://supabase.com/dashboard にログイン
2. プロジェクトを選択
3. Settings → API
4. Project URLとAPI Keysを確認

#### テーブル構造
Supabase Dashboard → Table Editor

必須テーブル:
- [ ] `user_profiles` テーブルが存在する
- [ ] `plans` テーブルが存在する
- [ ] `rule_categories` テーブルが存在する
- [ ] `rules` テーブルが存在する

**確認方法:**
1. Supabase Dashboard → Table Editor
2. 左サイドバーでテーブル一覧を確認

#### RLSポリシー（Row Level Security）
Supabase Dashboard → Authentication → Policies

**user_profiles テーブル:**
- [ ] "Enable read access for all users" ポリシーが存在する
  - Operation: SELECT
  - Target roles: anon, authenticated
  - Policy: `true` (全ユーザーが読み取り可能)

**plans テーブル:**
- [ ] 公開プランの読み取りポリシーが存在する
  - Operation: SELECT
  - Target roles: anon, authenticated

**確認方法:**
1. Supabase Dashboard → Authentication → Policies
2. 各テーブルのポリシー一覧を確認
3. "Enable read access for all users" などのポリシーが有効になっているか確認

#### RLS有効化
- [ ] 各テーブルでRLS（Row Level Security）が有効になっている

**確認方法:**
1. Supabase Dashboard → Table Editor
2. 各テーブルの設定で "Enable RLS" がオンになっているか確認

---

### 4. GitHub設定 🔧

#### リポジトリ
- [ ] リモートリポジトリURLが正しい
- [ ] メインブランチが `main` または `master`
- [ ] 作業ブランチから main へのPRが作成可能

**確認方法:**
```bash
git remote -v
git branch -a
```

#### Secrets（GitHub Actions使用時のみ）
GitHub Repository → Settings → Secrets and variables → Actions

- [ ] 必要なSecretsが設定されている（使用している場合）

---

### 5. 本番環境テスト 🌐

#### ページ読み込み
本番URL: `https://your-domain.vercel.app`

- [ ] トップページ（/）が読み込まれる
- [ ] /admin-login が読み込まれる
- [ ] /admin が読み込まれる（ログイン後）
- [ ] /plans が読み込まれる
- [ ] /rules が読み込まれる
- [ ] /matrix が読み込まれる

#### コンソールエラー

**❗ 重要: 本番環境でエラーが発生した場合、必ずPuppeteerで全ページのコンソールエラーチェックを実行してください。**

**自動チェック（推奨）:**
```bash
# 本番環境の全ページでコンソールエラーをチェック（60秒）
node scripts/test-production-console.cjs
```

このスクリプトは以下を自動的にチェックします:
- [ ] 全ページのコンソールエラー（console.error）
- [ ] JavaScriptランタイムエラー（PageError）
- [ ] ネットワークエラー（RequestFailed）
- [ ] HTTPステータスエラー（404, 500等）

**チェック項目:**
- [ ] Supabase接続エラーがない
- [ ] 404エラーがない
- [ ] JavaScript実行エラーがない
- [ ] CORS エラーがない

**手動確認方法（サブセット）:**
1. ブラウザで本番URLを開く
2. F12で開発者ツールを開く
3. Consoleタブでエラーを確認
4. Networkタブで404エラーを確認

**注意:**
- 手動確認では一部のページしかチェックできません
- 本番環境特有のエラー（環境変数未設定、パス解決の違い等）を見逃す可能性があります
- **必ずPuppeteerによる自動チェックを実行してください**

#### 機能テスト
- [ ] プラン一覧が表示される
- [ ] ルール一覧が表示される
- [ ] 管理画面へのログインができる
- [ ] 管理画面でデータが表示される

---

## 🚨 トラブルシューティング

### 本番環境でエラーが発生した場合（必須手順）

**1. Puppeteerで本番環境の全ページをチェック:**
```bash
node scripts/test-production-console.cjs
```

このコマンドで以下が確認できます:
- どのページでエラーが発生しているか
- エラーの種類（404, JavaScript実行エラー、ネットワークエラー等）
- エラーの詳細メッセージ

**2. エラーの種類別の対処法:**

**404エラーの場合:**
- `vercel.json` の rewrites 設定を確認
- 該当ページの rewrite ルールが設定されているか確認
- 設定後は必ず再デプロイが必要

**JavaScript実行エラーの場合:**
- ローカルで同じエラーが発生するか確認（`npm run dev` で確認）
- 環境変数が本番環境で設定されているか確認（Vercel Dashboard）
- ビルド時の警告を確認（`npm run build`）

**環境変数関連エラーの場合:**
- Vercel Dashboard → Environment Variables で設定を確認
- Production, Preview, Development すべてに設定されているか確認
- 設定変更後は必ず再デプロイが必要

**3. 修正後の確認:**
```bash
# 修正をコミット・プッシュ
git add .
git commit -m "fix: 本番環境エラーを修正"
git push

# デプロイ完了まで2-3分待つ

# 再度テスト
node scripts/test-production-console.cjs
```

---

### ビルドが失敗する
```bash
# キャッシュをクリア
rm -rf node_modules dist
npm install
npm run build
```

### Vercelで環境変数が反映されない
1. Vercelで環境変数を変更した場合、**必ず再デプロイ**が必要
2. Deployments → 最新のデプロイ → Redeploy

### Supabase接続エラー
1. `.env.local` の値が正しいか確認
2. Vercelの環境変数が正しいか確認
3. Supabaseプロジェクトが一時停止していないか確認

### RLSポリシーエラー（403 Forbidden）
1. Supabase Dashboard → Authentication → Policies
2. 該当テーブルのポリシーを確認
3. `anon` ロールでSELECT権限があるか確認

---

## 📝 定期チェック推奨

### デプロイ前（毎回）
```bash
# ローカル環境チェック
node scripts/comprehensive-system-check.cjs

# ローカルコンソールエラーチェック
node scripts/test-all-pages-console.cjs
```

### デプロイ後（毎回・必須）
```bash
# 本番環境コンソールエラーチェック（必須）
node scripts/test-production-console.cjs
```

**❗ 重要:** デプロイ後は必ず本番環境のコンソールエラーチェックを実行してください。ローカルで問題がなくても、本番環境で以下のエラーが発生する可能性があります:
- 環境変数の設定漏れ
- vercel.json の rewrites 設定不足
- ファイルパスの解決の違い
- ビルド時の最適化による問題

### 週次
- [ ] Vercelの環境変数を確認
- [ ] Supabase RLSポリシーを確認
- [ ] 本番環境で全ページをPuppeteerでテスト（`node scripts/test-production-console.cjs`）

### 月次
- [ ] npm パッケージの更新確認
- [ ] Supabaseのストレージ使用量確認
- [ ] Vercelのビルド時間確認

---

## 🎯 クイックリファレンス

### 環境変数一覧
```env
# ローカル開発（.env.local）
VITE_SUPABASE_URL=https://hegpxvyziovlfxdfsrsv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # ローカルのみ

# Vercel本番環境
VITE_SUPABASE_URL=https://hegpxvyziovlfxdfsrsv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 重要なURL
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Repository: https://github.com/Ghouse-development/lifex-btob

### サポートコマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# ローカル環境チェック
node scripts/comprehensive-system-check.cjs

# ローカルコンソールエラーチェック
node scripts/test-all-pages-console.cjs

# ページ別チェック（詳細）
node scripts/comprehensive-self-check.cjs

# 本番環境コンソールエラーチェック（必須）
node scripts/test-production-console.cjs
```
