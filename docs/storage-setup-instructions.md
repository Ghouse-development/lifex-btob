# Supabase Storage バケット設定手順

**所要時間**: 約5分

## 方法1: Supabaseダッシュボードから手動作成（推奨）

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクト `hegpxvyziovlfxdfsrsv` を開く

2. **Storageセクションへ移動**
   - 左メニューから "Storage" をクリック

3. **plan-imagesバケットを作成**
   - "New bucket" ボタンをクリック
   - Bucket name: `plan-images`
   - Public bucket: **ON** (チェックを入れる)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/jpg, image/png`
   - "Create bucket" をクリック

4. **plan-drawingsバケットを作成**
   - 再度 "New bucket" ボタンをクリック
   - Bucket name: `plan-drawings`
   - Public bucket: **ON** (チェックを入れる)
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`
   - "Create bucket" をクリック

## 方法2: SQLエディタから実行

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクト `hegpxvyziovlfxdfsrsv` を開く

2. **SQL Editorへ移動**
   - 左メニューから "SQL Editor" をクリック

3. **SQLファイルの内容を実行**
   - `supabase-storage-migration.sql` の内容をコピー
   - SQL Editorにペースト
   - "Run" ボタンをクリック

## バケット作成後の確認

ターミナルで以下を実行してバケットが作成されたことを確認:

```bash
node scripts/utilities/check-storage-buckets.js
```

✅ が表示されれば成功です。

## 次のステップ: ファイルアップロード

バケット作成後、以下を実行してプラン画像とPDFをアップロード:

```bash
node scripts/utilities/upload-plans-to-storage.js
```

このスクリプトは:
- 57個のプランフォルダを走査
- 各プランの外観パース画像をアップロード (`exterior.jpg`)
- 各プランのプレゼンPDFをアップロード
- データベースのURLフィールドを自動更新

**アップロード完了後、プラン一覧ページで画像とPDFが表示されます！**
