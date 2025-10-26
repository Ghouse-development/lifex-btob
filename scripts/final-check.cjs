const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';
const LOGIN_URL = `${BASE_URL}/admin-login.html`;

const pages = [
    { url: `${BASE_URL}/admin-notifications.html`, name: 'admin-notifications' },
    { url: `${BASE_URL}/admin-users.html`, name: 'admin-users' },
    { url: `${BASE_URL}/admin-profile.html`, name: 'admin-profile' },
    { url: `${BASE_URL}/admin-report.html`, name: 'admin-report' },
    { url: `${BASE_URL}/admin-downloads.html`, name: 'admin-downloads' },
    { url: `${BASE_URL}/admin-faq.html`, name: 'admin-faq' }
];

const email = 'admin@ghouse.jp';
const password = 'Ghouse0648';

async function login(page) {
    console.log(`\n🔐 Logging in...`);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.type('#email', email, { delay: 100 });
    await page.type('#password', password, { delay: 100 });
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
}

async function checkPage(browser, pageInfo) {
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        if (type === 'error') {
            errors.push(text);
        } else if (type === 'warning') {
            warnings.push(text);
        }
    });

    page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`);
    });

    try {
        console.log(`\n📄 Checking ${pageInfo.name}...`);
        await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`   ✅ Page loaded: ${pageInfo.name}`);
        console.log(`   📊 Errors: ${errors.length}`);
        console.log(`   ⚠️  Warnings: ${warnings.length}`);

        if (errors.length > 0) {
            console.log(`\n   🔴 ERRORS on ${pageInfo.name}:`);
            errors.forEach((err, i) => console.log(`      ${i + 1}. ${err}`));
        }

    } catch (error) {
        console.error(`   ❌ Failed to check ${pageInfo.name}:`, error.message);
        errors.push(`Navigation error: ${error.message}`);
    } finally {
        await page.close();
    }

    return { name: pageInfo.name, errors: errors.length, warnings: warnings.length, errorDetails: errors };
}

async function main() {
    console.log('🚀 Starting final error check on production...\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const loginPage = await browser.newPage();
    await login(loginPage);
    await loginPage.close();

    const results = [];
    for (const pageInfo of pages) {
        const result = await checkPage(browser, pageInfo);
        results.push(result);
    }

    await browser.close();

    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('📊 FINAL RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    let totalErrors = 0;
    let totalWarnings = 0;

    results.forEach(r => {
        totalErrors += r.errors;
        totalWarnings += r.warnings;
        const status = r.errors === 0 ? '✅' : '❌';
        console.log(`${status} ${r.name}: ${r.errors} errors, ${r.warnings} warnings`);
    });

    console.log('\n───────────────────────────────────────────────────');
    console.log(`TOTAL: ${totalErrors} errors, ${totalWarnings} warnings`);
    console.log('═══════════════════════════════════════════════════\n');

    if (totalErrors === 0) {
        console.log('🎉 SUCCESS! All pages have 0 errors!');
    } else {
        console.log('⚠️  There are still errors to fix.');
    }
}

main().catch(console.error);
