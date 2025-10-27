# システム更新情報テーブルのセットアップ

**作成日**: 2025-10-27
**目的**: 「最新の更新」カードのデータをSupabaseで管理

---

## 🎯 問題の背景

**発見した問題**:
- 「最新の更新」カードのデータがlocalStorageに保存されていた
- 管理者のブラウザにしか更新情報が表示されない
- 他のユーザーや別のデバイスからは見えない
- **実用性が低い設計だった**

**解決策**:
- ✅ Supabaseテーブルに移行
- ✅ 全ユーザーで更新情報を共有
- ✅ 永続的なデータ保存

---

## 📝 セットアップ手順

### 1. Supabase Dashboardにログイン

https://supabase.com にアクセスして、プロジェクトを開く

### 2. SQL Editorを開く

左側のメニューから **SQL Editor** を選択

### 3. SQLスクリプトを実行

以下のSQLを**新規クエリ**として実行:

```sql
-- システム更新情報テーブル
CREATE TABLE IF NOT EXISTS system_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('プラン', 'ダウンロード', 'ルール', 'FAQ', 'システム', 'その他')),
    update_type TEXT NOT NULL,
    related_id TEXT,
    plan_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- インデックス
CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);
CREATE INDEX idx_system_updates_category ON system_updates(category);
CREATE INDEX idx_system_updates_status ON system_updates(status);
CREATE INDEX idx_system_updates_created_by ON system_updates(created_by);

-- RLSポリシー
ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能（activeな更新のみ）
CREATE POLICY "Anyone can view active system updates"
    ON system_updates
    FOR SELECT
    USING (status = 'active');

-- 認証済みユーザーは作成可能
CREATE POLICY "Authenticated users can create system updates"
    ON system_updates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 作成者は更新・削除可能
CREATE POLICY "Users can update their own system updates"
    ON system_updates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own system updates"
    ON system_updates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
```

### 4. 実行結果を確認

✅ **Success. No rows returned** と表示されればOK

### 5. テーブルエディタで確認

左側のメニューから **Table Editor** → **system_updates** を選択
テーブルが作成されていることを確認

---

## 🔍 テーブル構造

| カラム名 | 型 | 説明 |
|---------|---|------|
| id | UUID | 主キー（自動生成） |
| title | TEXT | 更新タイトル（必須） |
| description | TEXT | 更新内容の説明 |
| category | TEXT | カテゴリ（プラン/ダウンロード/ルール/FAQ/システム/その他） |
| update_type | TEXT | 更新タイプ（例: plan_added, rule_updated） |
| related_id | TEXT | 関連データのID |
| plan_id | TEXT | プラン詳細ページへのリンク用 |
| created_at | TIMESTAMPTZ | 作成日時（自動設定） |
| created_by | UUID | 作成者のユーザーID |
| status | TEXT | ステータス（active / archived） |
| metadata | JSONB | 追加のメタデータ |

---

## 🔐 セキュリティ設定（RLS）

### 閲覧権限
- ✅ **全ユーザー**: activeな更新情報のみ閲覧可能
- ✅ **未認証ユーザー**: 閲覧のみ可能

### 書き込み権限
- ✅ **認証済みユーザー**: 新規作成可能
- ✅ **作成者のみ**: 自分が作成した更新情報を編集・削除可能

---

## 📊 使用例

### 更新情報の追加（プラン追加時）

```javascript
await lifeXAPI.addLatestUpdate({
    title: '新プラン「LX-045B」を追加しました',
    description: '3LDK、45坪の新プランが追加されました。',
    category: 'プラン',
    type: 'plan_added',
    planId: 'LX-045B'
});
```

### 更新情報の取得

```javascript
const updates = await lifeXAPI.getLatestUpdates();
// 最新20件を取得

const latestFive = await lifeXAPI.getLatestUpdates(5);
// 最新5件のみ取得
```

---

## ✅ 動作確認

### 1. トップページで確認

https://lifex-btob.vercel.app/

「最新の更新」セクションに情報が表示されるか確認

### 2. 管理画面でプラン追加

管理画面でプランを追加すると、自動的に更新情報が作成される

### 3. 別のブラウザで確認

シークレットモードや別のブラウザで同じページを開き、
更新情報が表示されることを確認

---

## 🛠️ トラブルシューティング

### Q: テーブルが作成されない

**A**: SQLエディタでエラーメッセージを確認してください。
既にテーブルが存在する場合は `IF NOT EXISTS` により無視されます。

### Q: 更新情報が表示されない

**A**: ブラウザのコンソールを確認してください:
1. F12 キーで開発者ツールを開く
2. Console タブを確認
3. `✅ System updates loaded from Supabase: X items` と表示されるか確認

### Q: RLSエラーが出る

**A**: ポリシーが正しく設定されているか確認:
1. Supabase Dashboard → Authentication → Policies
2. `system_updates` テーブルのポリシーを確認
3. 必要に応じて再作成

---

## 📚 関連ファイル

- **SQLスクリプト**: `database/migrations/create_system_updates_table.sql`
- **JavaScript実装**: `src/js/common.js` (line 1048-1158)
- **フロントエンド表示**: `src/index.html` (line 201-237)

---

## 🎓 学んだこと

### ❌ 悪い設計
- localStorageにユーザー間で共有すべきデータを保存
- ブラウザ単位のストレージ利用

### ✅ 良い設計
- Supabaseテーブルでデータ管理
- RLSで適切なアクセス制御
- localStorageはフォールバックとしてのみ使用

---

**作成者**: Claude Code
**最終更新**: 2025-10-27
