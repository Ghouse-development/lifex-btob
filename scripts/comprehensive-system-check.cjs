const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// チェック結果を格納
const results = {
  env: {},
  files: {},
  config: {},
  supabase: {},
  vercel: {},
  github: {},
  build: {},
  runtime: {}
};

console.log('🔍 === 包括的システムチェック開始 ===\n');

// ========================================
// 1. 環境変数チェック
// ========================================
async function checkEnvironmentVariables() {
  console.log('📝 === 環境変数チェック ===');

  const checks = [];

  // .env.local の存在確認
  try {
    const envContent = await fs.readFile('.env.local', 'utf-8');
    checks.push({
      name: '.env.local ファイル',
      status: 'OK',
      detail: '存在する'
    });

    // 必須環境変数の確認
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        const match = envContent.match(new RegExp(`${varName}=(.+)`));
        const value = match ? match[1].trim() : '';
        checks.push({
          name: varName,
          status: value.length > 10 ? 'OK' : 'WARNING',
          detail: value.length > 10 ? '設定済み' : '値が短すぎる可能性'
        });
      } else {
        checks.push({
          name: varName,
          status: 'ERROR',
          detail: '未設定'
        });
      }
    }
  } catch (error) {
    checks.push({
      name: '.env.local ファイル',
      status: 'ERROR',
      detail: '存在しない'
    });
  }

  results.env = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.every(c => c.status === 'OK');
}

// ========================================
// 2. 重要ファイルの存在・整合性チェック
// ========================================
async function checkCriticalFiles() {
  console.log('\n📁 === 重要ファイルチェック ===');

  const criticalFiles = [
    { path: 'vercel.json', required: true },
    { path: 'vite.config.js', required: true },
    { path: 'package.json', required: true },
    { path: 'public/js/common.js', required: true },
    { path: 'public/js/supabase-auth.js', required: true },
    { path: 'public/js/supabase-client.js', required: false },
    { path: 'src/js/supabase-auth.js', required: true },
    { path: 'src/js/auth-guard.js', required: true },
    { path: '.gitignore', required: true }
  ];

  const checks = [];

  for (const file of criticalFiles) {
    try {
      const stats = await fs.stat(file.path);
      checks.push({
        name: file.path,
        status: 'OK',
        detail: `${(stats.size / 1024).toFixed(1)}KB`,
        size: stats.size
      });
    } catch (error) {
      checks.push({
        name: file.path,
        status: file.required ? 'ERROR' : 'WARNING',
        detail: '存在しない',
        size: 0
      });
    }
  }

  // ファイルサイズの異常チェック
  const commonJsPublic = checks.find(c => c.name === 'public/js/common.js');
  if (commonJsPublic && commonJsPublic.size < 1000) {
    commonJsPublic.status = 'WARNING';
    commonJsPublic.detail += ' (サイズが小さすぎる可能性)';
  }

  results.files = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.filter(c => c.status === 'ERROR').length === 0;
}

// ========================================
// 3. 設定ファイルの内容チェック
// ========================================
async function checkConfigFiles() {
  console.log('\n⚙️  === 設定ファイル内容チェック ===');

  const checks = [];

  // vercel.json チェック
  try {
    const vercelConfig = JSON.parse(await fs.readFile('vercel.json', 'utf-8'));
    checks.push({
      name: 'vercel.json - buildCommand',
      status: vercelConfig.buildCommand === 'npm run build' ? 'OK' : 'WARNING',
      detail: vercelConfig.buildCommand || '未設定'
    });
    checks.push({
      name: 'vercel.json - outputDirectory',
      status: vercelConfig.outputDirectory === 'dist' ? 'OK' : 'WARNING',
      detail: vercelConfig.outputDirectory || '未設定'
    });
    checks.push({
      name: 'vercel.json - rewrites',
      status: Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length > 0 ? 'OK' : 'WARNING',
      detail: `${vercelConfig.rewrites?.length || 0}件`
    });
  } catch (error) {
    checks.push({
      name: 'vercel.json',
      status: 'ERROR',
      detail: '読み込みエラー'
    });
  }

  // vite.config.js チェック
  try {
    const viteConfig = await fs.readFile('vite.config.js', 'utf-8');
    const inputMatch = viteConfig.match(/input:\s*{([^}]+)}/s);
    if (inputMatch) {
      const inputs = inputMatch[1].split('\n').filter(l => l.includes(':')).length;
      checks.push({
        name: 'vite.config.js - input pages',
        status: inputs >= 20 ? 'OK' : 'WARNING',
        detail: `${inputs}ページ設定`
      });
    }
    checks.push({
      name: 'vite.config.js - publicDir',
      status: viteConfig.includes("publicDir: '../public'") ? 'OK' : 'WARNING',
      detail: viteConfig.includes("publicDir:") ? '設定あり' : '未設定'
    });
  } catch (error) {
    checks.push({
      name: 'vite.config.js',
      status: 'ERROR',
      detail: '読み込みエラー'
    });
  }

  // package.json チェック
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    checks.push({
      name: 'package.json - build script',
      status: pkg.scripts?.build ? 'OK' : 'ERROR',
      detail: pkg.scripts?.build || '未設定'
    });
    checks.push({
      name: 'package.json - dependencies',
      status: pkg.dependencies && Object.keys(pkg.dependencies).length > 0 ? 'OK' : 'WARNING',
      detail: `${Object.keys(pkg.dependencies || {}).length}個`
    });
  } catch (error) {
    checks.push({
      name: 'package.json',
      status: 'ERROR',
      detail: '読み込みエラー'
    });
  }

  results.config = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.filter(c => c.status === 'ERROR').length === 0;
}

// ========================================
// 4. Gitリポジトリチェック
// ========================================
async function checkGitRepository() {
  console.log('\n🔧 === Gitリポジトリチェック ===');

  const checks = [];

  try {
    // 現在のブランチ
    const { stdout: branch } = await execAsync('git branch --show-current');
    checks.push({
      name: '現在のブランチ',
      status: 'OK',
      detail: branch.trim()
    });

    // リモートURL
    const { stdout: remote } = await execAsync('git remote get-url origin');
    checks.push({
      name: 'リモートリポジトリ',
      status: remote.includes('github.com') ? 'OK' : 'WARNING',
      detail: remote.trim().substring(0, 50) + '...'
    });

    // 未コミットの変更
    const { stdout: status } = await execAsync('git status --short');
    checks.push({
      name: '未コミットの変更',
      status: status.trim().length === 0 ? 'OK' : 'WARNING',
      detail: status.trim().length === 0 ? 'なし' : `${status.trim().split('\n').length}ファイル`
    });

    // 最新コミット
    const { stdout: lastCommit } = await execAsync('git log -1 --oneline');
    checks.push({
      name: '最新コミット',
      status: 'OK',
      detail: lastCommit.trim().substring(0, 50)
    });
  } catch (error) {
    checks.push({
      name: 'Git',
      status: 'ERROR',
      detail: 'Gitリポジトリではない、またはGitが利用できない'
    });
  }

  results.github = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.filter(c => c.status === 'ERROR').length === 0;
}

// ========================================
// 5. ビルドチェック
// ========================================
async function checkBuild() {
  console.log('\n🔨 === ビルドチェック ===');

  const checks = [];

  try {
    console.log('  ⏳ ビルド実行中...');
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync('npm run build 2>&1');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const hasError = stderr.includes('error') || stdout.includes('error during build');

    checks.push({
      name: 'ビルド実行',
      status: hasError ? 'ERROR' : 'OK',
      detail: `${duration}秒`
    });

    // dist ディレクトリの確認
    try {
      const distFiles = await fs.readdir('dist');
      const htmlFiles = distFiles.filter(f => f.endsWith('.html'));
      const assetsDir = distFiles.includes('assets');

      checks.push({
        name: 'HTMLファイル生成',
        status: htmlFiles.length >= 20 ? 'OK' : 'WARNING',
        detail: `${htmlFiles.length}ファイル`
      });

      checks.push({
        name: 'アセットディレクトリ',
        status: assetsDir ? 'OK' : 'ERROR',
        detail: assetsDir ? '存在する' : '存在しない'
      });

      if (assetsDir) {
        const assets = await fs.readdir('dist/assets');
        checks.push({
          name: 'アセットファイル',
          status: assets.length > 0 ? 'OK' : 'WARNING',
          detail: `${assets.length}ファイル`
        });
      }
    } catch (error) {
      checks.push({
        name: 'distディレクトリ',
        status: 'ERROR',
        detail: '存在しない'
      });
    }
  } catch (error) {
    checks.push({
      name: 'ビルド実行',
      status: 'ERROR',
      detail: error.message.substring(0, 100)
    });
  }

  results.build = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.filter(c => c.status === 'ERROR').length === 0;
}

// ========================================
// 6. ランタイムチェック（開発サーバー）
// ========================================
async function checkRuntime() {
  console.log('\n🌐 === ランタイムチェック（サンプル3ページ）===');

  const checks = [];
  const testPages = [
    'http://localhost:3001/src/index.html',
    'http://localhost:3001/src/admin-login.html',
    'http://localhost:3001/src/admin.html'
  ];

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });

    for (const url of testPages) {
      const page = await browser.newPage();
      const errors = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pageName = url.split('/').pop();
        checks.push({
          name: pageName,
          status: errors.length === 0 ? 'OK' : 'WARNING',
          detail: errors.length === 0 ? 'エラーなし' : `${errors.length}個のエラー`
        });
      } catch (error) {
        const pageName = url.split('/').pop();
        checks.push({
          name: pageName,
          status: 'ERROR',
          detail: '読み込み失敗'
        });
      }

      await page.close();
    }
  } catch (error) {
    checks.push({
      name: 'Puppeteer',
      status: 'ERROR',
      detail: '起動失敗 - 開発サーバーが起動していない可能性'
    });
  } finally {
    if (browser) await browser.close();
  }

  results.runtime = checks;
  checks.forEach(c => {
    const icon = c.status === 'OK' ? '✅' : c.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  return checks.filter(c => c.status === 'ERROR').length === 0;
}

// ========================================
// メイン実行
// ========================================
async function main() {
  const startTime = Date.now();

  const envOk = await checkEnvironmentVariables();
  const filesOk = await checkCriticalFiles();
  const configOk = await checkConfigFiles();
  const gitOk = await checkGitRepository();
  const buildOk = await checkBuild();
  const runtimeOk = await checkRuntime();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 === チェックサマリー ===');
  console.log('='.repeat(60));

  const summary = [
    { name: '環境変数', ok: envOk },
    { name: '重要ファイル', ok: filesOk },
    { name: '設定ファイル', ok: configOk },
    { name: 'Gitリポジトリ', ok: gitOk },
    { name: 'ビルド', ok: buildOk },
    { name: 'ランタイム', ok: runtimeOk }
  ];

  summary.forEach(s => {
    const icon = s.ok ? '✅' : '❌';
    console.log(`${icon} ${s.name}: ${s.ok ? 'OK' : 'NG'}`);
  });

  const allOk = summary.every(s => s.ok);

  console.log('='.repeat(60));
  console.log(`⏱️  実行時間: ${duration}秒`);
  console.log('='.repeat(60));

  if (allOk) {
    console.log('\n🎉 === 全てのチェックが合格しました ===\n');
  } else {
    console.log('\n❌ === 一部のチェックが失敗しました ===\n');
  }

  // 次のステップを提案
  console.log('📝 === 次のステップ ===');
  if (!envOk) {
    console.log('  1. .env.local ファイルを確認・修正してください');
  }
  if (!buildOk) {
    console.log('  2. ビルドエラーを修正してください');
  }
  if (!allOk) {
    console.log('  3. 上記のエラーを修正後、再度チェックを実行してください');
  }
  if (allOk) {
    console.log('  ✅ Vercel環境変数の設定を確認してください');
    console.log('  ✅ Supabase RLSポリシーを確認してください');
    console.log('  ✅ 本番環境でのテストを実施してください');
  }

  process.exit(allOk ? 0 : 1);
}

main().catch(console.error);
