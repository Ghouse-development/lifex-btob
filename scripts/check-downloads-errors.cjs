const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';
const LOGIN_URL = `${BASE_URL}/admin-login.html`;
const PAGE_URL = `${BASE_URL}/admin-downloads.html`;

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

async function checkPage() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const errors = [];
    const resourceUrls = [];

    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        if (type === 'error') {
            console.log(`   ❌ Console Error: ${text}`);
            errors.push({ type: 'console', message: text });
        } else if (type === 'log' || type === 'warning') {
            // デバッグ用: すべてのログを表示
            console.log(`   📝 Console ${type}: ${text}`);
        }
    });

    page.on('pageerror', error => {
        console.log(`   ❌ Page Error: ${error.message}`);
        errors.push({ type: 'page', message: error.message });
    });

    page.on('response', response => {
        const status = response.status();
        const url = response.url();

        if (status === 404) {
            console.log(`   🔴 404 Error: ${url}`);
            errors.push({ type: '404', message: url });
        }

        resourceUrls.push({ url, status });
    });

    await login(page);

    console.log(`\n📄 First Load: Checking ${PAGE_URL}...`);
    await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n📊 FIRST LOAD SUMMARY:`);
    console.log(`   Total errors: ${errors.length}`);

    const error404s = errors.filter(e => e.type === '404');
    if (error404s.length > 0) {
        console.log(`\n🔴 404 ERRORS (${error404s.length}):`);
        error404s.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.message}`);
        });
    }

    // Clear errors for second load
    errors.length = 0;

    console.log(`\n\n📄 Second Load: Checking ${PAGE_URL}... (testing LocalStorage cache)`);
    await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n📊 SECOND LOAD SUMMARY:`);
    console.log(`   Total errors: ${errors.length}`);

    const error404s2 = errors.filter(e => e.type === '404');
    if (error404s2.length > 0) {
        console.log(`\n🔴 404 ERRORS (${error404s2.length}):`);
        error404s2.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.message}`);
        });
    } else {
        console.log(`\n✅ No 404 errors on second load - LocalStorage cache working!`);
    }

    console.log(`\n\n🎯 COMPARISON:`);
    console.log(`   First load:  ${error404s.length} errors`);
    console.log(`   Second load: ${error404s2.length} errors`);
    console.log(`   Reduction:   ${error404s.length - error404s2.length} errors eliminated by cache`);

    await browser.close();
}

checkPage().catch(console.error);
