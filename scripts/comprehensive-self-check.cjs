const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DEV_URL = 'http://localhost:3001';

const PAGES_TO_CHECK = [
  // Admin pages
  { url: '/src/admin.html', name: 'Admin Dashboard', requiresAuth: true },
  { url: '/src/admin-login.html', name: 'Admin Login', requiresAuth: false },
  { url: '/src/admin-profile.html', name: 'Admin Profile', requiresAuth: true },
  { url: '/src/admin-users.html', name: 'Admin Users', requiresAuth: true },
  { url: '/src/admin-notifications.html', name: 'Admin Notifications', requiresAuth: true },
  { url: '/src/admin-plans.html', name: 'Admin Plans', requiresAuth: true },
  { url: '/src/admin-rules.html', name: 'Admin Rules', requiresAuth: true },
  { url: '/src/admin-faq.html', name: 'Admin FAQ', requiresAuth: true },

  // Public pages
  { url: '/src/index.html', name: 'Homepage', requiresAuth: false },
  { url: '/src/rules.html', name: 'Rules', requiresAuth: false },
  { url: '/src/matrix.html', name: 'Matrix', requiresAuth: false },
  { url: '/src/plans.html', name: 'Plans', requiresAuth: false },
];

async function checkBuild() {
  console.log('\n🔨 === BUILD CHECK ===');
  try {
    const { stdout, stderr } = await execAsync('npm run build 2>&1');

    if (stderr && stderr.includes('error')) {
      console.log('❌ Build failed');
      console.log(stderr);
      return { ok: false, errors: ['Build failed'] };
    }

    console.log('✅ Build successful');
    return { ok: true, errors: [] };
  } catch (error) {
    console.log('❌ Build failed with exception');
    console.log(error.message);
    return { ok: false, errors: [error.message] };
  }
}

async function checkPages() {
  console.log('\n🌐 === PAGE CHECKS ===');
  const browser = await puppeteer.launch({ headless: true });
  const results = {};
  let totalErrors = 0;

  for (const pageInfo of PAGES_TO_CHECK) {
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];

    // Console error listener
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      } else if (msg.type() === 'warning' && text.includes('supabase')) {
        warnings.push(text);
      }
    });

    // Page error listener
    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}`);
    });

    // Response listener for HTTP errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        // Ignore expected auth redirects and external resources
        if (!url.includes('supabase.co') && !url.includes('cdn.')) {
          errors.push(`HTTP ${response.status()}: ${url}`);
        }
      }
    });

    try {
      const fullUrl = `${DEV_URL}${pageInfo.url}`;
      await page.goto(fullUrl, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });

      // Wait for page to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      const errorCount = errors.length;
      totalErrors += errorCount;

      results[pageInfo.name] = {
        ok: errorCount === 0,
        errors: errors,
        warnings: warnings
      };

      if (errorCount === 0) {
        console.log(`✅ ${pageInfo.name}`);
      } else {
        console.log(`❌ ${pageInfo.name} (${errorCount} errors)`);
        errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
        if (errors.length > 3) {
          console.log(`   ... and ${errors.length - 3} more errors`);
        }
      }
    } catch (error) {
      results[pageInfo.name] = {
        ok: false,
        errors: [error.message],
        warnings: []
      };
      totalErrors++;
      console.log(`❌ ${pageInfo.name} (Failed to load)`);
    }

    await page.close();
  }

  await browser.close();

  return { results, totalErrors };
}

async function checkCodeQuality() {
  console.log('\n📝 === CODE QUALITY CHECK ===');
  const issues = [];

  // Check for remaining /js/supabase-auth.js imports
  try {
    const { stdout } = await execAsync('grep -r "from.*\\"/js/supabase-auth" src/ || true');
    if (stdout.trim()) {
      issues.push('Found /js/supabase-auth.js imports (should be ./js/):');
      console.log('❌ Found bad import paths:');
      console.log(stdout);
    } else {
      console.log('✅ No bad import paths found');
    }
  } catch (e) {
    // grep returns error if no matches - that's good
    console.log('✅ No bad import paths found');
  }

  // Check for type="module" import statements with absolute /js/ paths (BAD)
  try {
    const { stdout } = await execAsync('grep -r "import.*from.*\'/js/supabase-auth\\|import.*from.*\\\"/js/supabase-auth" src/*.html || true');

    if (stdout.trim()) {
      const lines = stdout.trim().split('\n').filter(l => l);
      issues.push(`Found ${lines.length} files with absolute /js/ import paths`);
      console.log(`❌ Found ${lines.length} bad imports:`);
      lines.forEach(line => console.log(`   ${line}`));
    } else {
      console.log('✅ All imports use correct relative paths');
    }
  } catch (e) {
    console.log('✅ All imports use correct relative paths');
  }

  return { ok: issues.length === 0, issues };
}

async function main() {
  console.log('🚀 === COMPREHENSIVE SELF-CHECK ===\n');

  const buildResult = await checkBuild();
  const { results: pageResults, totalErrors } = await checkPages();
  const codeQualityResult = await checkCodeQuality();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 === FINAL SUMMARY ===');
  console.log('='.repeat(60));

  console.log(`\n🔨 Build: ${buildResult.ok ? '✅ OK' : '❌ FAILED'}`);
  if (!buildResult.ok) {
    buildResult.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log(`\n🌐 Pages: ${totalErrors === 0 ? '✅ OK' : '❌ FAILED'} (${totalErrors} total errors)`);
  Object.entries(pageResults).forEach(([name, result]) => {
    const status = result.ok ? '✅' : '❌';
    console.log(`   ${status} ${name}`);
  });

  console.log(`\n📝 Code Quality: ${codeQualityResult.ok ? '✅ OK' : '❌ FAILED'}`);
  if (!codeQualityResult.ok) {
    codeQualityResult.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Overall
  const allOk = buildResult.ok && totalErrors === 0 && codeQualityResult.ok;

  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('🎉 === ALL CHECKS PASSED - 100% OK ===');
  } else {
    console.log('❌ === SOME CHECKS FAILED - NEEDS FIXES ===');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allOk ? 0 : 1);
}

main().catch(console.error);
