# FAQ データ修正手順

## 問題
- admin-faq.htmlに「てすと」というテストデータが表示されている

## 修正手順

### 方法1: Supabase Dashboard （推奨）

1. **Supabase Dashboardにアクセス**
   - URL: https://supabase.com
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」をクリック
   - 「New query」をクリック

3. **SQLスクリプトを実行**
   - `database/fix-faq-data.sql` の内容をコピー
   - SQL Editorに貼り付け
   - 「Run」ボタンをクリック

4. **結果を確認**
   - 最後のSELECT文で、FAQデータの一覧を確認
   - 「てすと」が削除されていることを確認

### 方法2: Supabase CLI

```bash
# プロジェクトにログイン
supabase login

# リンク（初回のみ）
supabase link --project-ref <YOUR_PROJECT_REF>

# SQLスクリプトを実行
supabase db reset --db-url <YOUR_DATABASE_URL>
psql -h <YOUR_PROJECT_URL> -U postgres -d postgres -f database/fix-faq-data.sql
```

### 方法3: 手動削除

1. Supabase Dashboard → Table Editor → `faqs` テーブル
2. 「てすと」を含む行を検索
3. 行を選択して「Delete」

## 確認方法

修正後、以下の手順で確認：

1. https://lifex-btob.vercel.app/admin-faq.html にアクセス
2. 「てすと」が削除されていることを確認

## トラブルシューティング

### データが表示されない
- ブラウザのキャッシュをクリア（Ctrl+Shift+R or Cmd+Shift+R）
- status が 'published' になっているか確認
- ブラウザのコンソールでエラーを確認

## 注意事項

- SQLスクリプトは「てすと」を含むテストデータのみを削除します
- 削除前に念のためバックアップを取得することを推奨します
