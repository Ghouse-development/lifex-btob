const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const logs = { console: [], network: [] };

  page.on('console', msg => {
    const text = msg.text();
    // Capture logs about rules loading
    if (text.includes('rules') || text.includes('Rules') || text.includes('categories') || text.includes('Loaded')) {
      logs.console.push(`[${msg.type()}] ${text}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co')) {
      const contentType = response.headers()['content-type'] || '';
      let bodyPreview = '';
      if (contentType.includes('json')) {
        try {
          const text = await response.text();
          bodyPreview = text.substring(0, 300);
        } catch (e) {
          bodyPreview = '[Could not read]';
        }
      }
      logs.network.push({
        url: url.substring(url.indexOf('/rest/') || 0, 150),
        status: response.status(),
        body: bodyPreview
      });
    }
  });

  await page.goto('https://lifex-btob.vercel.app/rules.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // Get Alpine.js data
  const alpineData = await page.evaluate(() => {
    try {
      const el = document.querySelector('[x-data="rulesPage()"]');
      if (!el || !window.Alpine) return null;

      // Access Alpine data - note this is internal API
      const data = window.Alpine.$data(el);
      return {
        categoriesCount: data?.categories?.length || 0,
        categories: data?.categories || [],
        loading: data?.loading,
        errorMsg: data?.errorMsg
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('=== Alpine.js Data ===');
  console.log(JSON.stringify(alpineData, null, 2));

  console.log('\n=== Console Logs (rules related) ===');
  logs.console.forEach(log => console.log(log));

  console.log('\n=== All Supabase Network Requests ===');
  logs.network.forEach(req => {
    console.log(`[${req.status}] ${req.url}`);
    if (req.body) console.log(`  Body: ${req.body}`);
  });

  await browser.close();
})();
