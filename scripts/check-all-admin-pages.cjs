const puppeteer = require('puppeteer');

const PAGES = [
  'http://localhost:3001/src/admin.html',
  'http://localhost:3001/src/admin-login.html',
  'http://localhost:3001/src/admin-profile.html',
  'http://localhost:3001/src/admin-users.html',
  'http://localhost:3001/src/admin-notifications.html',
  'http://localhost:3001/src/admin-plans.html',
  'http://localhost:3001/src/admin-rules.html',
  'http://localhost:3001/src/admin-faq.html',
  'http://localhost:3001/src/index.html',
  'http://localhost:3001/src/rules.html',
  'http://localhost:3001/src/matrix.html',
  'http://localhost:3001/src/plans.html',
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const results = {};

  for (const url of PAGES) {
    const page = await browser.newPage();
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}`);
    });

    try {
      console.log(`\n📄 Testing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      results[url] = {
        status: 'OK',
        errors: errors
      };

      if (errors.length > 0) {
        console.log(`❌ ${errors.length} errors found:`);
        errors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ No errors`);
      }
    } catch (error) {
      results[url] = {
        status: 'FAILED',
        error: error.message,
        errors: errors
      };
      console.log(`❌ Failed to load: ${error.message}`);
    }

    await page.close();
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  let totalErrors = 0;
  Object.entries(results).forEach(([url, result]) => {
    const pageName = url.split('/').pop();
    const errorCount = result.errors?.length || 0;
    totalErrors += errorCount;

    if (result.status === 'OK' && errorCount === 0) {
      console.log(`✅ ${pageName}`);
    } else if (result.status === 'OK' && errorCount > 0) {
      console.log(`⚠️  ${pageName} (${errorCount} errors)`);
    } else {
      console.log(`❌ ${pageName} (failed to load)`);
    }
  });

  console.log('='.repeat(60));
  console.log(`Total errors: ${totalErrors}`);

  process.exit(totalErrors > 0 ? 1 : 0);
})();
