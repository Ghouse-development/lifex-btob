const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const logs = { console: [], errors: [], network: [] };

  page.on('console', msg => {
    logs.console.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.errors.push(error.message);
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co') && url.includes('rules')) {
      logs.network.push({
        url: url.substring(0, 150),
        status: response.status()
      });
    }
  });

  await page.goto('https://lifex-btob.vercel.app/rules.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const pageState = await page.evaluate(() => {
    return {
      hasRulesAPI: !!window.lifeX?.apis?.rules,
      hasSupabaseAPI: !!window.supabaseAPI?.rules,
      sbReadyResolved: !!window.sbReady,
      supabaseClientAvailable: !!window.supabaseClient
    };
  });

  console.log('=== Rules API Check ===');
  console.log(JSON.stringify(pageState, null, 2));

  console.log('\n=== Console Logs (last 15) ===');
  logs.console.slice(-15).forEach(log => console.log(log));

  console.log('\n=== Errors ===');
  if (logs.errors.length > 0) {
    logs.errors.forEach(err => console.log(err));
  } else {
    console.log('(なし)');
  }

  console.log('\n=== Supabase Network Requests for Rules ===');
  if (logs.network.length > 0) {
    logs.network.forEach(req => console.log(`[${req.status}] ${req.url}`));
  } else {
    console.log('(なし)');
  }

  await browser.close();
})();
