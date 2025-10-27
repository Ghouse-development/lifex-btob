// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * トップページのE2Eテスト
 */

test.describe('トップページ', () => {
  test('ページが正常に表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルチェック
    await expect(page).toHaveTitle(/LIFE X/i);

    // メインコンテンツが表示されることを確認
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('ナビゲーションリンクが動作する', async ({ page }) => {
    await page.goto('/');

    // プラン一覧へのリンクをクリック
    await page.click('a[href*="plans"]');

    // URLが変わることを確認
    await expect(page).toHaveURL(/plans/);
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // ページが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});
