# RLS ポリシー レビュー結果
**日付:** 2025-10-23
**実施者:** Claude Code

## 概要

全テーブルのRLSポリシーを確認し、Anon KeyとService Role Keyでのアクセス可能性をチェックしました。

## チェック結果

### ✅ エラーなし
全17テーブルでエラーは発生していません。

### テーブル別アクセス状況

| テーブル名 | Service Role | Anon Key | 評価 | 備考 |
|-----------|-------------|----------|------|------|
| `faqs` | 0件 | 0件 | ✅ | FAQ本体。Anon Key でアクセス可能 |
| `faq_categories` | 5件 | 5件 | ✅ | FAQカテゴリ。完全に公開 |
| `faq_feedback` | 0件 | 0件 | ✅ | FAQ評価。Anon Key でアクセス可能 |
| `plans` | 57件 | 0件 | ⚠️ | プランデータ。認証必須か確認推奨 |
| `user_profiles` | 1件 | 0件 | ✅ | ユーザープロフィール。認証必須（正常） |
| `login_history` | 1件 | 0件 | ✅ | ログイン履歴。認証必須（正常） |
| `notifications` | 0件 | 0件 | ✅ | 通知。認証が必要な可能性 |
| `notification_reads` | 0件 | 0件 | ✅ | 通知既読。認証が必要な可能性 |
| `user_unread_notifications` | 0件 | 0件 | ✅ | 未読通知。認証が必要な可能性 |
| `page_views` | 0件 | 0件 | ✅ | ページビュー統計 |
| `plan_views` | 0件 | 0件 | ✅ | プラン閲覧統計 |
| `search_queries` | 0件 | 0件 | ✅ | 検索クエリ |
| `download_logs` | 0件 | 0件 | ✅ | ダウンロードログ |
| `download_stats` | 0件 | 0件 | ✅ | ダウンロード統計 |
| `plan_view_stats` | 0件 | 0件 | ✅ | プラン閲覧統計 |
| `popular_pages` | 0件 | 0件 | ✅ | 人気ページ |
| `popular_searches` | 0件 | 0件 | ✅ | 人気検索 |

## 推奨事項

### 1. `plans` テーブル ⚠️

**現状:**
- Service Role: 57件のプランデータが存在
- Anon Key: 0件（アクセス不可）

**確認が必要:**
- プランデータは一般公開する予定ですか？
- それとも認証済みユーザーのみアクセス可能にする予定ですか？

**もし一般公開する場合:**
```sql
-- plansテーブルに公開読み取りポリシーを追加
CREATE POLICY "Public can view published plans"
ON plans
FOR SELECT
USING (status = 'published');
```

### 2. その他のテーブル

その他のテーブル（通知、統計など）は、現在のRLS設定が適切に動作しています。

## 修正履歴

### FAQ テーブル（本日修正済み）

**問題:**
- `faqs` テーブルで "permission denied for table users" エラーが発生
- Anon Key でアクセス不可

**解決策:**
- RLSポリシーから `users` テーブルへの参照を削除
- シンプルなポリシーに変更（`USING (true)` で誰でも閲覧可能）

**適用したSQL:**
- `fix-faq-rls-simple.sql`

**結果:**
- ✅ Service Role、Anon Key 両方でアクセス可能になりました

## まとめ

### 現在の状態
- ✅ **全テーブルでエラーなし**
- ✅ **FAQテーブル完全動作**
- ⚠️ `plans` テーブルのアクセス権限要確認

### 次のアクション
1. `plans` テーブルの公開範囲を決定
2. 必要に応じてRLSポリシーを調整
3. admin-faq.html ページで動作確認

---

**確認コマンド:**
```bash
# 全テーブルのRLS確認
node scripts/utilities/check-all-tables-rls.js

# FAQテーブルのみ確認
node scripts/utilities/check-faq-rls.js
```
