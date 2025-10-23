# Vercelデプロイメント修正ガイド

## 🚨 問題の根本原因

現在、Vercelにデプロイされたサイトでデータが全く表示されない原因：

**環境変数`VITE_SUPABASE_ANON_KEY`が設定されていないため、ビルド時に`undefined`になり、JavaScriptが初期化時にエラーをスローしています。**

ビルドされたコード:
```javascript
const S=void 0; // undefined
throw console.error("❌ VITE_SUPABASE_ANON_KEY が設定されていません");
```

---

## ✅ 修正方法

### 方法1: Vercelダッシュボードで環境変数を設定（推奨）

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard にログイン
   - プロジェクト「lifex-btob」を選択

2. **Settings → Environment Variables に移動**

3. **以下の環境変数を追加**:

```
VITE_SUPABASE_URL=https://hegpxvyziovlfxdfsrsv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws
```

4. **Environmentsで「Production」「Preview」「Development」全てにチェック**

5. **Saveをクリック**

6. **再デプロイ**
   - Deploymentsタブに移動
   - 最新のデプロイメントの「...」メニューから「Redeploy」を選択
   - 「Use existing Build Cache」のチェックを**外す**
   - 「Redeploy」をクリック

---

### 方法2: Vercel CLIで設定

```bash
# Vercelにログイン
npx vercel login

# 環境変数を追加
npx vercel env add VITE_SUPABASE_URL production
# 値を入力: https://hegpxvyziovlfxdfsrsv.supabase.co

npx vercel env add VITE_SUPABASE_ANON_KEY production
# 値を入力: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws

# 再デプロイ
npx vercel --prod
```

---

## 🔧 代替修正（コード側で対応）

環境変数の設定が難しい場合、コードを修正してフォールバック値を使用する方法：

### supabase-client.jsを修正

**現在のコード** (src/js/supabase-client.js):
```javascript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY が設定されていません');
    throw new Error('Supabase API key is not configured');
}
```

**修正後のコード**:
```javascript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY が設定されていません');
    throw new Error('Supabase API key is not configured');
}
```

**注意**: この方法はANON KEYをコードに直接埋め込むため、セキュリティリスクがあります。本番環境では方法1を推奨します。

---

## 📋 確認手順

### 1. 環境変数が設定されたことを確認

Vercelダッシュボード → Settings → Environment Variables で以下が表示されることを確認:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY

### 2. 再デプロイが成功したことを確認

Vercel → Deploymentsタブで最新のデプロイが「Ready」状態になることを確認

### 3. 本番サイトでデータが表示されることを確認

以下のページで実際にデータが表示されることを確認:
- ✅ https://lifex-btob.vercel.app/plans.html （57件のプラン）
- ✅ https://lifex-btob.vercel.app/rules.html （2件のルール）
- ✅ https://lifex-btob.vercel.app/faq.html （1件のFAQ）

### 4. ブラウザのコンソールエラーを確認

各ページでF12を押してConsoleタブを開き、以下のエラーがないことを確認:
- ❌ "Supabase API key is not configured" エラー
- ❌ "VITE_SUPABASE_ANON_KEY が設定されていません" エラー

---

## 🎯 問題が解決したかの確認方法

### ブラウザで直接確認

1. https://lifex-btob.vercel.app/faq.html にアクセス
2. F12キーを押してDevToolsを開く
3. Consoleタブを確認
4. エラーがなく、「✅ Loaded FAQs from Supabase: 1」のようなメッセージが表示されれば成功

### APIが正常にアクセスできているか確認

ブラウザのConsoleで以下を実行:
```javascript
fetch('https://hegpxvyziovlfxdfsrsv.supabase.co/rest/v1/faqs?select=*', {
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws'
    }
}).then(r => r.json()).then(console.log)
```

期待される結果: 1件のFAQデータが返される

---

## 📝 まとめ

### 現在の状況
- ❌ Vercelに環境変数が設定されていない
- ❌ ビルド時に`VITE_SUPABASE_ANON_KEY`が`undefined`になる
- ❌ JavaScriptが初期化時にエラーをスロー
- ❌ 全てのデータが表示されない

### 修正後の状況（修正実施後）
- ✅ Vercelに環境変数が設定される
- ✅ ビルド時に正しいANON KEYが埋め込まれる
- ✅ JavaScriptが正常に初期化される
- ✅ Supabaseからデータを取得して表示される

---

**最優先対応**: Vercelダッシュボードで環境変数を設定 → 再デプロイ
