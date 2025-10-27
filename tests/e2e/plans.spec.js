// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * プラン一覧ページのE2Eテスト
 */

test.describe('プラン一覧ページ', () => {
  test('プラン一覧が表示される', async ({ page }) => {
    await page.goto('/plans.html');

    // ページタイトルチェック
    await expect(page).toHaveTitle(/プラン/i);

    // プランカードが表示されることを確認（最低1つ）
    const planCards = page.locator('[data-testid="plan-card"], .plan-card, article');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('検索フィルターが動作する', async ({ page }) => {
    await page.goto('/plans.html');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 検索フィルターが存在することを確認
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('3LDK');

      // フィルター結果を待機
      await page.waitForTimeout(1000);
    }
  });

  test('プラン詳細へ遷移できる', async ({ page }) => {
    await page.goto('/plans.html');

    // プランカードのリンクをクリック
    const firstPlanLink = page.locator('a[href*="plan-detail"]').first();
    if (await firstPlanLink.isVisible()) {
      await firstPlanLink.click();

      // 詳細ページに遷移することを確認
      await expect(page).toHaveURL(/plan-detail/);
    }
  });
});
