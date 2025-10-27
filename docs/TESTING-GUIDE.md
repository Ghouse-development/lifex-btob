# テスティングガイド

**作成日**: 2025-10-27
**バージョン**: 1.0
**対象**: LIFE X システムのテスト実行方法

---

## 📋 目次

1. [E2Eテスト（Playwright）](#e2eテストplaywright)
2. [パフォーマンス計測（Lighthouse）](#パフォーマンス計測lighthouse)
3. [セキュリティヘッダー確認](#セキュリティヘッダー確認)
4. [テスト実行のベストプラクティス](#テスト実行のベストプラクティス)

---

## E2Eテスト（Playwright）

### 概要

Playwrightを使用したエンドツーエンドテスト。
実際のブラウザを起動して、ユーザーの操作をシミュレートします。

### セットアップ

```bash
# Playwrightブラウザのインストール（初回のみ）
npx playwright install

# Chromeのみインストール
npx playwright install chromium
```

### テスト実行

#### 全テストを実行
```bash
npm test
```

#### UIモードで実行（推奨）
```bash
npm run test:ui
```

#### ブラウザを表示して実行
```bash
npm run test:headed
```

#### 特定のテストのみ実行
```bash
npx playwright test tests/e2e/homepage.spec.js
```

#### 特定のブラウザで実行
```bash
# Chromeのみ
npx playwright test --project=chromium

# Firefoxのみ
npx playwright test --project=firefox

# モバイルChromeのみ
npx playwright test --project="Mobile Chrome"
```

### テストレポート

テスト実行後、HTMLレポートが自動生成されます。

```bash
# レポートを表示
npm run test:report
```

### 既存のテスト

#### 1. homepage.spec.js - トップページテスト
```javascript
// テスト内容:
- ページが正常に表示される
- ナビゲーションリンクが動作する
- レスポンシブデザインが機能する
```

#### 2. plans.spec.js - プラン一覧テスト
```javascript
// テスト内容:
- プラン一覧が表示される
- 検索フィルターが動作する
- プラン詳細へ遷移できる
```

### 新しいテストを追加

```javascript
// tests/e2e/example.spec.js
const { test, expect } = require('@playwright/test');

test('テストの説明', async ({ page }) => {
  // 1. ページに移動
  await page.goto('/');

  // 2. 要素を取得
  const button = page.locator('button');

  // 3. アクションを実行
  await button.click();

  // 4. 期待結果を検証
  await expect(page).toHaveURL(/success/);
});
```

---

## パフォーマンス計測（Lighthouse）

### 概要

Googleのパフォーマンス計測ツールLighthouseを使用して、
ページの表示速度やパフォーマンスを計測します。

### 手動計測

#### カスタムスクリプトで計測
```bash
npm run perf
```

これにより、以下のページが計測されます：
- トップページ
- プラン一覧
- プラン詳細
- 間取マトリックス
- ルール一覧
- FAQ

**結果**:
- コンソールに結果を表示
- `performance-report-YYYY-MM-DD.json` にJSON形式で保存

#### Lighthouse CI で計測
```bash
npm run lighthouse
```

設定ファイル: `lighthouserc.json`

### ブラウザのDevToolsで計測

1. **ブラウザでページを開く**
   ```
   https://lifex-btob.vercel.app
   ```

2. **DevToolsを開く**
   - Windows/Linux: `F12`
   - Mac: `Cmd + Option + I`

3. **Lighthouseタブを開く**

4. **"Analyze page load"をクリック**

5. **結果を確認**
   - Performance: パフォーマンススコア（0-100点）
   - Accessibility: アクセシビリティ
   - Best Practices: ベストプラクティス
   - SEO: SEO対策

### スコアの目安

| スコア | 評価 | 対応 |
|-------|------|------|
| 90-100 | ✅ 優秀 | そのまま維持 |
| 50-89 | ⚠️ 改善が必要 | 改善案を確認 |
| 0-49 | ❌ 問題あり | 早急に改善 |

### 主要指標

#### LCP (Largest Contentful Paint)
```
✅ 良い: 2.5秒以内
⚠️ 改善必要: 2.5-4.0秒
❌ 悪い: 4.0秒以上
```
**意味**: メインコンテンツが表示されるまでの時間

#### FID (First Input Delay)
```
✅ 良い: 100ミリ秒以内
⚠️ 改善必要: 100-300ミリ秒
❌ 悪い: 300ミリ秒以上
```
**意味**: ボタンクリックへの反応速度

#### CLS (Cumulative Layout Shift)
```
✅ 良い: 0.1以下
⚠️ 改善必要: 0.1-0.25
❌ 悪い: 0.25以上
```
**意味**: レイアウトのズレの少なさ

### CI/CDでの自動計測

**GitHub Actions設定例**:
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouseci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run lighthouse
```

---

## セキュリティヘッダー確認

### 設定済みヘッダー

LIFE Xシステムでは、以下のセキュリティヘッダーを設定しています：

```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### ヘッダーの確認方法

#### curlコマンドで確認
```bash
curl -I https://lifex-btob.vercel.app
```

#### ブラウザのDevToolsで確認
1. **DevToolsを開く** (F12)
2. **Networkタブを開く**
3. **ページをリロード**
4. **最初のリクエストをクリック**
5. **Headersタブで確認**

#### オンラインツールで確認
- [Security Headers](https://securityheaders.com/)
- URLを入力して"Scan"をクリック
- A+評価を目指す

---

## テスト実行のベストプラクティス

### 1. テスト前の準備

```bash
# 依存関係を最新に
npm install

# ビルドを実行
npm run build

# ローカルサーバーを起動
npm run dev
```

### 2. テスト実行の順序

```bash
# 1. E2Eテスト（機能確認）
npm test

# 2. パフォーマンス計測
npm run lighthouse

# 3. セキュリティヘッダー確認
curl -I https://lifex-btob.vercel.app
```

### 3. テスト失敗時の対応

#### E2Eテスト失敗
```bash
# 1. スクリーンショットを確認
# test-results/ ディレクトリ内

# 2. ビデオを確認（設定されている場合）
# test-results/ ディレクトリ内

# 3. デバッグモードで再実行
npx playwright test --debug
```

#### パフォーマンス低下
```bash
# 1. 詳細レポートを確認
# performance-report-*.json

# 2. 改善案を確認
# Lighthouseレポートの"Opportunities"セクション

# 3. 個別に改善を実施
```

### 4. CI/CDでの自動テスト

#### 推奨設定
```bash
# package.json の scripts に追加
"test:ci": "playwright test --reporter=github"
"lighthouse:ci": "lhci autorun"
```

#### GitHub Actionsで実行
```yaml
- name: E2Eテスト
  run: npm run test:ci

- name: パフォーマンス計測
  run: npm run lighthouse:ci
```

---

## 📊 テスト結果の分析

### 週次レポート

毎週月曜日に以下を確認：
- [ ] E2Eテストの成功率
- [ ] パフォーマンススコアの推移
- [ ] セキュリティヘッダーの状態

### 月次レビュー

毎月1日に以下を実施：
- [ ] テストカバレッジの向上
- [ ] 新機能のテスト追加
- [ ] パフォーマンス改善の実施

---

## 🎯 目標値

### E2Eテスト
- ✅ 成功率: 100%
- ✅ 実行時間: < 5分

### パフォーマンス
- ✅ Lighthouse スコア: 90点以上
- ✅ LCP: < 2.5秒
- ✅ FID: < 100ミリ秒
- ✅ CLS: < 0.1

### セキュリティ
- ✅ Security Headers: A+評価
- ✅ すべてのヘッダーが設定済み

---

## 📚 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Lighthouse公式ドキュメント](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [OWASP セキュリティヘッダー](https://owasp.org/www-project-secure-headers/)

---

**作成者**: Claude Code
**最終更新**: 2025-10-27
