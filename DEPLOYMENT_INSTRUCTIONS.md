# デプロイ手順

## 問題の原因

現在アクセスしているURL:
```
https://lifex-btob-7psuj2110-ghouse-developments-projects.vercel.app/
```

これは**プレビューデプロイメント**のURLで、古いコミットから生成されています。
最新の修正（commit 37477ae）が反映されていません。

## 解決方法

### 方法1: 本番環境にデプロイ（推奨）

最新のコードを本番環境にデプロイします:

```bash
# 1. 最新のコードが既にビルド済みであることを確認
npm run build

# 2. Vercel本番環境にデプロイ
vercel --prod
```

デプロイ後、本番URLでアクセスしてください（プレビューURLではなく）。

### 方法2: 最新のプレビューデプロイメントを生成

```bash
# 1. 最新のコードをビルド
npm run build

# 2. 新しいプレビューデプロイメントを作成
vercel
```

これで新しいプレビューURLが生成されます。

## 確認済み事項

✅ **ローカルビルドは完璧に動作します**
- すべてのテストをパス（10/10成功）
- window.supabaseが正しく設定されている
- Supabaseクライアントが正しくインポートされている
- 必要なアセットファイルがすべて存在

✅ **最新のコミット (37477ae) の内容**
- window.supabase参照の修正が完了
- plan-detail.htmlが正しく動作するように修正
- すべてのSupabaseエラーが解消

## デプロイ後の確認

1. 本番URLまたは新しいプレビューURLにアクセス
2. プラン詳細ページを開く:
   ```
   https://[your-production-domain]/plan-detail.html?id=c9213ddf-1bda-49fa-ac69-11fdc0595543
   ```
3. ブラウザのコンソール（F12）を開いてエラーがないか確認
4. プランデータが正しく表示されることを確認

## トラブルシューティング

### Vercelにログインしていない場合

```bash
vercel login
```

### デプロイがうまくいかない場合

```bash
# キャッシュをクリアしてビルド
npm run build

# 強制的に本番デプロイ
vercel --prod --force
```

### 古いデプロイメントを削除したい場合

Vercelのダッシュボード (https://vercel.com) から:
1. プロジェクトを選択
2. Deploymentsタブを開く
3. 古いプレビューデプロイメントを削除

## 修正内容の詳細

### commit 37477ae: 全ページのwindow.supabase参照を修正

**修正したファイル:**
- src/plans.html
- src/faq.html
- src/rules.html
- src/admin-faq.html
- src/admin-plans.html
- src/admin-rules.html

**修正内容:**
```javascript
// BEFORE (エラーの原因)
window.supabase.from('plans')

// AFTER (ほとんどのページ)
window.supabaseClient.from('plans')
```

**plan-detail.htmlの特殊な実装:**
plan-detail.htmlは独自のES moduleパターンを使用:
```javascript
import { supabase } from '/js/supabase-client.js';
window.supabase = supabase; // 作成したクライアントをwindow.supabaseに設定
```

そのため、plan-detail.htmlでは`window.supabase.from()`が正しい使い方です。

## 参考: Vercel デプロイメントの種類

1. **本番デプロイメント (Production)**
   - コマンド: `vercel --prod`
   - URL: カスタムドメインまたはメインのvercel.appドメイン
   - 最も安定したデプロイメント

2. **プレビューデプロイメント (Preview)**
   - コマンド: `vercel`
   - URL: `[unique-hash]-[project-name].vercel.app`
   - 各コミット/ブランチごとに自動生成
   - テスト用途

現在のエラーが出ているURLは古いプレビューデプロイメントです。
最新のコードを本番環境にデプロイすれば問題は解決します。
