# 統計データ不一致レポート

## 概要
`admin.html` と `admin-report.html` で統計データの取得方法が異なるため、同じ統計でも異なる数値が表示される問題があります。

## 不一致の詳細

### 1. プラン統計 - 今月の件数

| ページ | データソース | 計算基準 | コード位置 |
|--------|--------------|----------|------------|
| **admin.html** | Supabase | `updated_at` ベース | src/admin.html:593-599 |
| **admin-report.html** | Supabase | `created_at` ベース | src/admin-report.html:260-265 |

**問題**: 同じ「今月のプラン数」でも、admin.htmlは「今月更新されたプラン」、admin-report.htmlは「今月作成されたプラン」をカウントしています。

**影響**: 数値が一致しない可能性が高い

---

### 2. ルール統計 - 必須ルール数

| ページ | フィルタ条件 | コード位置 |
|--------|--------------|------------|
| **admin.html** | `importance === '必須'` | src/admin.html:611 |
| **admin-report.html** | `required === true` | src/admin-report.html:312 |

**問題**: 異なるフィールド・条件で「必須ルール」を判定しています。

**影響**:
- `importance`フィールドと`required`フィールドの値が一致しない場合、数値が異なる
- どちらか一方のフィールドしか存在しない場合、片方は常に0になる

---

### 3. ダウンロード統計

| ページ | データソース | コード位置 |
|--------|--------------|------------|
| **admin.html** | **localStorage** (`downloads_data`) | src/admin.html:623-660 |
| **admin-report.html** | **Supabase** (`downloads` テーブル) | src/admin-report.html:316-324 |

**問題**: 完全に異なるデータソースを使用しています。

**影響**:
- localStorageとSupabaseのデータが同期していない場合、数値が大きく異なる
- Supabase側にデータがない場合、admin-report.htmlは常に0を表示

---

### 4. FAQ統計

| ページ | フィルタ条件 | コード位置 |
|--------|--------------|------------|
| **admin.html** | `status === 'published'` のみカウント | src/admin.html:673 |
| **admin-report.html** | **フィルタなし** (全件カウント) | src/admin-report.html:286 |

**問題**: admin.htmlは公開中のFAQのみカウント、admin-report.htmlは下書きも含む全件をカウント。

**影響**: admin-report.htmlの方が大きい数値になる

---

## 推奨される修正方針

### 優先度：高

1. **データソースをSupabaseに統一**
   - admin.htmlのダウンロード統計もSupabaseから取得
   - localStorageの使用を廃止

2. **今月のプラン計算を統一**
   - 選択肢A: `created_at` ベース（今月作成）
   - 選択肢B: `updated_at` ベース（今月更新）
   - **推奨**: `created_at` ベース（レポートでは「新規作成数」の方が意味がある）

3. **必須ルールの判定を統一**
   - データベースのスキーマを確認
   - `importance` と `required` のどちらが正しいか確認
   - **推奨**: `required` フィールドに統一（boolean型の方が明確）

4. **FAQフィルタを統一**
   - **推奨**: 両方とも `status === 'published'` でフィルタ（公開中のみカウント）

### 優先度：中

5. **プランのフィルタ**
   - admin.htmlのコメント「公開中のプランのみカウント」と実装が不一致
   - コメント通りに実装するか、コメントを削除

---

## 修正後の統一ロジック案

```javascript
// 両ページで以下のロジックを使用

// 1. プラン統計
const { data: plans } = await sb.from('plans').select('*');
this.stats.totalPlans = plans.length;

// 今月作成されたプラン（created_atベース）
const now = new Date();
this.stats.plansThisMonth = plans.filter(p => {
    const created = new Date(p.created_at);
    return created.getMonth() === now.getMonth() &&
           created.getFullYear() === now.getFullYear();
}).length;

// 2. FAQ統計（公開中のみ）
const { data: faqs } = await sb.from('faqs').select('*');
this.stats.totalFaqs = faqs.filter(f => f.status === 'published').length;

// 3. ルール統計（requiredフィールドで統一）
const { data: rules } = await sb.from('rules').select('*');
this.stats.totalRules = rules.length;
this.stats.requiredRules = rules.filter(r => r.required === true).length;

// 4. ダウンロード統計（Supabaseから取得）
const { data: downloads } = await sb.from('downloads').select('*');
this.stats.totalDownloads = downloads.length;
```

---

## アクションアイテム

- [ ] データベーススキーマ確認（`rules`テーブルの`importance`と`required`）
- [ ] ダウンロードデータの移行状況確認（localStorageからSupabaseへ）
- [ ] ユーザーに今月のプラン計算方法を確認（created_at vs updated_at）
- [ ] 両ページの統計ロジックを統一
- [ ] テスト実施
- [ ] デプロイ

---

生成日時: 2025-10-26
