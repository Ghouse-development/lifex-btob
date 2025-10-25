const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
  });

  page.on('pageerror', error => {
    errors.push(`[PageError] ${error.message}`);
  });

  await page.goto('https://lifex-btob.vercel.app/rules.html', {
    waitUntil: 'networkidle0',
    timeout: 15000
  });

  // Wait for Alpine to initialize
  await new Promise(r => setTimeout(r, 5000));

  // Check Alpine data and APIs
  const state = await page.evaluate(() => {
    return {
      // Alpine.js
      alpineAvailable: !!window.Alpine,
      alpineVersion: window.Alpine?.$version || 'unknown',

      // Supabase
      sbReady: !!window.sbReady,
      sbReadyResolved: window.sbReady instanceof Promise ? 'pending' : 'resolved',
      supabaseClient: !!window.supabaseClient,

      // APIs
      lifeXApis: {
        rules: !!window.lifeX?.apis?.rules,
        rulesGetRules: typeof window.lifeX?.apis?.rules?.getRules === 'function',
        rulesGetCategories: typeof window.lifeX?.apis?.rules?.getCategories === 'function'
      },
      supabaseAPI: {
        rules: !!window.supabaseAPI?.rules,
        rulesGetAll: typeof window.supabaseAPI?.rules?.getAll === 'function'
      },

      // Try to get Alpine component data
      componentData: null
    };
  });

  // Try to manually call the APIs
  const apiTest = await page.evaluate(async () => {
    try {
      const results = {
        categories: null,
        rules: null,
        errors: []
      };

      // Test lifeX.apis.rules
      if (window.lifeX?.apis?.rules?.getCategories) {
        try {
          results.categories = await window.lifeX.apis.rules.getCategories();
        } catch (e) {
          results.errors.push(`getCategories error: ${e.message}`);
        }
      }

      if (window.lifeX?.apis?.rules?.getRules) {
        try {
          results.rules = await window.lifeX.apis.rules.getRules();
        } catch (e) {
          results.errors.push(`getRules error: ${e.message}`);
        }
      }

      return results;
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('=== 🔍 Rules Page State ===');
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== 🧪 API Test Results ===');
  console.log(JSON.stringify(apiTest, null, 2));

  console.log('\n=== 📋 Console Logs ===');
  logs.forEach(log => console.log(log));

  console.log('\n=== ❌ Errors ===');
  if (errors.length > 0) {
    errors.forEach(err => console.log(err));
  } else {
    console.log('(なし)');
  }

  await browser.close();
})();
