const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';

const pages = [
  { path: '/', name: 'トップページ' },
  { path: '/plans.html', name: 'プラン一覧' },
  { path: '/faq.html', name: 'FAQ' },
  { path: '/admin.html', name: '管理ホーム' },
  { path: '/admin-faq.html', name: 'FAQ管理' },
  { path: '/admin-profile.html', name: 'プロフィール' }
];

async function check500Errors() {
  console.log('🔍 500エラーの詳細チェックを開始します...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // リクエストとレスポンスを監視
  const failed500Requests = [];

  page.on('requestfailed', request => {
    failed500Requests.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  page.on('response', response => {
    if (response.status() === 500) {
      failed500Requests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // コンソールエラーも監視
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  for (const { path, name } of pages) {
    const url = `${BASE_URL}${path}`;
    console.log(`📄 チェック中: ${name} (${path})`);

    failed500Requests.length = 0;
    consoleErrors.length = 0;

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // ページが完全にロードされるまで待機
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (failed500Requests.length > 0) {
        console.log(`   ❌ 500エラー: ${failed500Requests.length}件`);
        failed500Requests.forEach((req, i) => {
          console.log(`   ${i + 1}. URL: ${req.url}`);
          if (req.status) {
            console.log(`      ステータス: ${req.status} ${req.statusText}`);
          }
          if (req.failure) {
            console.log(`      失敗理由: ${req.failure.errorText}`);
          }
        });
      }

      if (consoleErrors.length > 0) {
        console.log(`   ⚠️ コンソールエラー: ${consoleErrors.length}件`);
        consoleErrors.forEach((err, i) => {
          console.log(`   ${i + 1}. ${err}`);
        });
      }

      if (failed500Requests.length === 0 && consoleErrors.length === 0) {
        console.log('   ✅ エラーなし');
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ ページロードエラー: ${error.message}\n`);
    }
  }

  await browser.close();
  console.log('✅ チェック完了');
}

check500Errors().catch(console.error);
