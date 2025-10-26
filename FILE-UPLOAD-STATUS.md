# ファイルアップロード機能の実装状況

## 現状分析

### ❌ 問題: ファイル保存機能が未実装

#### admin-plans-new.html の状況

**実装済み** ✅:
- ファイル選択UI（プレゼン、図面、ドキュメント）
- ドラッグ&ドロップ対応
- ファイル一覧表示
- ファイル削除機能
- `handlePresentationFiles()`
- `handleDrawingFiles()`
- `handleDocumentFiles()`

**未実装** ❌:
```javascript
saveForm() {
    console.log('保存データ:', this.formData);
    const fileCount =
        this.formData.files.presentation.length +
        this.formData.files.drawings.length +
        this.formData.files.documents.length;
    alert(`保存機能は未実装です。\n...`);  // ← 実装されていない！
}
```

#### plan-detail.html の状況

**実装済み** ✅:
- ファイル表示UI
- ダウンロードボタン
- `convertFilesToDownloadFormat()` 関数
- タブ切り替え（プレゼン/図面/Excel等）

**問題** ❌:
- 表示するデータがSupabaseに保存されていない
- ファイルアップロード機能が実際に動作していない

---

## 必要な実装

### 1. Supabase Storage設定

ファイルを保存するためのバケット作成:
```sql
-- Supabase Storage Bucket
CREATE BUCKET IF NOT EXISTS plan_files
  PUBLIC false;

-- RLSポリシー
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plan_files');

CREATE POLICY "Authenticated users can download files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'plan_files');
```

### 2. admin-plans-new.html の修正

`saveForm()` 関数を実装:
```javascript
async saveForm() {
    if (!this.validateForm()) return;

    this.loading = true;

    try {
        // 1. ファイルをSupabase Storageにアップロード
        const uploadedFiles = {
            presentation: [],
            drawings: [],
            documents: []
        };

        // プレゼンファイルをアップロード
        for (const fileData of this.formData.files.presentation) {
            const filePath = `plans/${this.formData.planCode}/presentation/${fileData.name}`;
            const { data, error } = await window.supabase.storage
                .from('plan_files')
                .upload(filePath, fileData.file);

            if (error) throw error;

            const { data: { publicUrl } } = window.supabase.storage
                .from('plan_files')
                .getPublicUrl(filePath);

            uploadedFiles.presentation.push({
                name: fileData.name,
                size: fileData.size,
                type: fileData.type,
                url: publicUrl,
                updated: new Date().toISOString()
            });
        }

        // 図面ファイルをアップロード（同様の処理）
        // ドキュメントファイルをアップロード（同様の処理）

        // 2. プランデータをSupabaseに保存
        const { data, error } = await window.supabase
            .from('plans')
            .insert({
                plan_code: this.formData.planCode,
                building_floors: parseInt(this.formData.floors),
                tsubo: parseFloat(this.formData.tsubo),
                layout: this.formData.layout,
                sell_price: parseFloat(this.formData.sellPrice),
                cost_price: parseFloat(this.formData.cost),
                files: uploadedFiles  // ← ファイル情報を保存
            });

        if (error) throw error;

        lifeXAPI.showToast('プランを作成しました', 'success');

        // プラン一覧にリダイレクト
        setTimeout(() => {
            window.location.href = '/admin-plans.html';
        }, 1500);

    } catch (error) {
        console.error('保存エラー:', error);
        lifeXAPI.showToast('保存に失敗しました: ' + error.message, 'error');
    } finally {
        this.loading = false;
    }
}
```

### 3. データベーススキーマ確認

`plans`テーブルに`files`カラムが存在するか確認:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'plans' AND column_name = 'files';
```

---

## 影響

### 現在の状態
- ❌ 新規プラン追加でファイルをアップロードできない
- ❌ プラン詳細でファイルをダウンロードできない
- ❌ UIだけ実装されていて、実際の機能が動作しない

### 期待される動作
- ✅ 新規プラン追加でファイルをアップロード
- ✅ ファイルがSupabase Storageに保存される
- ✅ プラン詳細でファイルをダウンロード

---

## 次のステップ

1. Supabase Storageのバケット作成
2. `saveForm()` 関数の実装
3. ファイルアップロード処理の実装
4. エラーハンドリングの追加
5. プログレスバーの表示
6. テスト

---

生成日時: 2025-10-26
