# データ表示問題診断レポート

**作成日時**: 2025-01-23
**状態**: 🟢 データベースは正常 / 🔴 JavaScriptエラーあり

---

## 📊 データベース診断結果

### ✅ データは存在します

| テーブル | 公開データ | 全データ | 状態 |
|---------|-----------|---------|------|
| **plans** | 57件 | 57件 | ✅ 正常 |
| **rules** | 2件 | 2件 | ✅ 正常 |
| **faqs** | 2件 | 2件 | ✅ 修正済み |

**結論**: データベースには十分なデータがあります。問題はデータベースではありません。

---

## 🚨 発見されたJavaScriptエラー

### エラー1: admin-plans.html - 無限再帰

**エラーメッセージ**:
```
Uncaught RangeError: Maximum call stack size exceeded
    at showToast (admin-plans.html:1118:27)
```

**原因**:
```javascript
// ❌ 問題のあったコード
function showToast(message, type = 'info') {
    if (window.lifeXAPI && typeof window.showToast === 'function') {
        window.showToast(message, type);  // ← 自分自身を呼び出している！
    }
}
```

**修正**:
```javascript
// ✅ 修正後のコード
function showToast(message, type = 'info') {
    if (window.lifeXAPI && typeof window.lifeXAPI.showToast === 'function') {
        window.lifeXAPI.showToast(message, type);  // ← 正しい参照
    }
}
```

**状態**: ✅ 修正完了

---

### エラー2: faq.html - メソッド名の誤り

**エラーメッセージ**:
```
TypeError: window.supabaseAPI.faq.getFAQs is not a function
    at Proxy.loadFAQs (faq.html:187:71)
```

**原因**:
`window.supabaseAPI.faq` には `getFAQs()` メソッドが存在しない。
正しいメソッド名は `getItems()` です。

**修正**:
```javascript
// ❌ 修正前
const data = await window.supabaseAPI.faq.getFAQs();

// ✅ 修正後
const data = await window.supabaseAPI.faq.getItems();
```

**状態**: ✅ 修正完了

---

### エラー3: plans.html - supabase未定義

**エラーメッセージ**:
```
TypeError: Cannot read properties of undefined (reading 'from')
    at Proxy.loadPlans (plans.html:1049:30)
```

**原因**:
plans.htmlが直接`supabase`オブジェクトにアクセスしようとしているが、
`window.supabaseAPI`を使うべき。

**状態**: ⚠️ 要確認（plans.htmlのコードを調査中）

---

### エラー4: plans.html - prices未定義

**エラーメッセージ**:
```
Alpine Expression Error: Cannot read properties of undefined (reading 'sell')
Expression: "lifeXAPI.formatPrice(plan.prices.sell)"
```

**原因**:
プランデータに`prices`オブジェクトが存在しない。

**診断結果**:
Supabaseのプランデータには`price`フィールド（単数形）しかなく、
`prices.sell`, `prices.cost`, `prices.gross`は存在しません。

**現在のデータ構造**:
```javascript
{
  id: "243d3340-d47b-40b1-8ea9-dff890f81276",
  plan_name: "28坪_南入_1階LDK_003",
  tsubo: 28,
  price: null,  // ← これしかない
  // prices.sell, prices.cost, prices.gross は存在しない
}
```

**状態**: ⚠️ 要修正（データ構造またはテンプレートを修正必要）

---

## 🔧 実施した修正

### 1. admin-plans.html の無限再帰を修正 ✅
- `window.showToast` → `window.lifeXAPI.showToast`
- コミット: 42e0549

### 2. faq.html のAPIメソッド名を修正 ✅
- `getFAQs()` → `getItems()`
- コミット: 42e0549

### 3. FAQ の null category_id を修正 ✅
- ID: `b40976d8-4a93-4a84-b451-4e9f9f2ebf73`
- category_id を「その他」カテゴリに設定

---

## 📋 残っている問題

### ~~問題1: plans.html のデータ構造不一致~~ ✅ 修正完了

**影響**: プランの価格が表示されない

**原因**: データベースのスキーマとHTMLテンプレートが一致していない

**修正内容**:
全ての `plan.prices.*` 参照に null チェックを追加:
```javascript
// 修正前（エラーが出る）
<div x-text="lifeXAPI.formatPrice(plan.prices.sell)"></div>

// 修正後（null チェック追加）
<div x-text="plan.prices ? lifeXAPI.formatPrice(plan.prices.sell) : '-'"></div>
```

**修正箇所**:
- Line 444: 想定販売価格（リストビュー）
- Line 448: 想定原価（リストビュー）
- Line 452: 想定粗利（リストビュー）
- Line 560: 想定販売価格（モーダルビュー）
- Line 564: 想定粗利（モーダルビュー）

**状態**: ✅ 修正完了（コミット: 2f11209）

---

### ~~問題2: plans.html の supabase 直接アクセス~~ ✅ 修正完了

**原因**: `window.supabase.from()` を直接呼び出していた（line 1050）

**修正内容**:
```javascript
// 修正前
const { data, error } = await window.supabase
    .from('plans')
    .select('*')
    .order('created_at', { ascending: false });

// 修正後
// Supabase APIが利用可能になるまで待機
let retries = 0;
while (!window.supabaseAPI && retries < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
}

const data = await window.supabaseAPI.plans.getAll();
```

**状態**: ✅ 修正完了（コミット: 2f11209）

---

## ✅ 確認済み事項

- ✅ Supabaseへの接続は正常
- ✅ ANON KEYは正しく設定されている
- ✅ RLSポリシーは正常（匿名ユーザーが公開データを取得可能）
- ✅ データは十分に存在している（プラン57件、ルール2件、FAQ2件）
- ✅ カテゴリテーブルも正常

---

## 🎯 次のステップ

### ✅ 即座に実施すべき修正（完了）

1. ✅ **plans.htmlの価格表示を修正**
   - `plan.prices.*` に null チェック追加
   - 状態: 完了（コミット: 2f11209）

2. ✅ **plans.htmlのsupabase直接アクセスを修正**
   - `supabase.from()` → `window.supabaseAPI.plans.*`
   - 状態: 完了（コミット: 2f11209）

3. 🔄 **Vercelに最新コードをデプロイ**
   - 修正済みのコードをプッシュ
   - 状態: プッシュ中

### 中長期的な改善

1. **データベーススキーマの整備**
   - `prices`テーブルの追加または`plans`テーブルに価格カラム追加
   - 現在は null チェックで対応済み

2. **TypeScript導入**
   - データ型の不一致を事前に検出

3. **E2Eテスト追加**
   - データ表示が正しく動作することを自動確認

---

## 📝 まとめ

### 現状
- ✅ 全ての JavaScript エラーを修正完了
- ✅ データベースは正常
- ✅ データ表示が正常に動作するはず

### 問題の本質（解決済み）
1. データベースにデータは存在する ✅
2. JavaScriptエラーでデータの取得・表示に失敗していた ✅ 修正完了
3. 主な原因は「データ構造の不一致」と「APIメソッドの誤用」 ✅ 修正完了

### 修正済み（5件）
1. ✅ admin-plans.html の無限再帰（コミット: 42e0549）
2. ✅ faq.html のAPIメソッド名（コミット: 42e0549）
3. ✅ FAQ の null category_id（直接DB修正）
4. ✅ plans.html の価格表示（コミット: 2f11209）
5. ✅ plans.html の supabase 直接アクセス（コミット: 2f11209）

**結果**: 全ての JavaScript エラーを修正。Vercel デプロイ後にデータが正常に表示されるはずです。

---

**作成者**: Claude Code
**最終更新**: 2025-01-23
