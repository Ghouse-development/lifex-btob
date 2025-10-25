const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;

const execAsync = promisify(exec);

console.log('🔍 === Vercel & GitHub 設定チェック ===\n');

async function checkVercelGitHub() {
  const results = {
    vercel: [],
    github: [],
    deployment: [],
    errors: []
  };

  // 1. Vercel設定ファイルチェック
  console.log('⚙️  === Vercel設定ファイル ===');

  try {
    const vercelConfig = JSON.parse(await fs.readFile('vercel.json', 'utf-8'));

    // buildCommand
    const buildCmd = vercelConfig.buildCommand;
    if (buildCmd === 'npm run build') {
      console.log(`✅ buildCommand: ${buildCmd}`);
      results.vercel.push({ name: 'buildCommand', status: 'OK', value: buildCmd });
    } else {
      console.log(`⚠️  buildCommand: ${buildCmd} (推奨: npm run build)`);
      results.vercel.push({ name: 'buildCommand', status: 'WARNING', value: buildCmd });
    }

    // outputDirectory
    const outputDir = vercelConfig.outputDirectory;
    if (outputDir === 'dist') {
      console.log(`✅ outputDirectory: ${outputDir}`);
      results.vercel.push({ name: 'outputDirectory', status: 'OK', value: outputDir });
    } else {
      console.log(`⚠️  outputDirectory: ${outputDir} (推奨: dist)`);
      results.vercel.push({ name: 'outputDirectory', status: 'WARNING', value: outputDir });
    }

    // rewrites
    const rewritesCount = vercelConfig.rewrites?.length || 0;
    if (rewritesCount >= 10) {
      console.log(`✅ rewrites: ${rewritesCount}件設定`);
      results.vercel.push({ name: 'rewrites', status: 'OK', value: `${rewritesCount}件` });
    } else {
      console.log(`⚠️  rewrites: ${rewritesCount}件 (推奨: 10件以上)`);
      results.vercel.push({ name: 'rewrites', status: 'WARNING', value: `${rewritesCount}件` });
    }

    // headers
    const headersCount = vercelConfig.headers?.length || 0;
    console.log(`✅ headers: ${headersCount}件設定`);
    results.vercel.push({ name: 'headers', status: 'OK', value: `${headersCount}件` });

  } catch (error) {
    console.log(`❌ vercel.json 読み込みエラー: ${error.message}`);
    results.errors.push(`vercel.json: ${error.message}`);
  }

  // 2. GitHub リポジトリ情報
  console.log('\n🔧 === GitHub リポジトリ ===');

  try {
    // リモートURL
    const { stdout: remoteUrl } = await execAsync('git remote get-url origin');
    const cleanUrl = remoteUrl.trim();
    console.log(`✅ リモートURL: ${cleanUrl}`);
    results.github.push({ name: 'remote', status: 'OK', value: cleanUrl });

    // 現在のブランチ
    const { stdout: branch } = await execAsync('git branch --show-current');
    console.log(`✅ 現在のブランチ: ${branch.trim()}`);
    results.github.push({ name: 'branch', status: 'OK', value: branch.trim() });

    // 最新のコミット
    const { stdout: lastCommit } = await execAsync('git log -1 --oneline');
    console.log(`✅ 最新コミット: ${lastCommit.trim()}`);
    results.github.push({ name: 'lastCommit', status: 'OK', value: lastCommit.trim() });

    // 未コミットの変更
    const { stdout: statusShort } = await execAsync('git status --short');
    const uncommitted = statusShort.trim();
    if (uncommitted) {
      const fileCount = uncommitted.split('\n').length;
      console.log(`⚠️  未コミットの変更: ${fileCount}ファイル`);
      console.log(`   ${uncommitted.split('\n').slice(0, 3).join('\n   ')}`);
      results.github.push({ name: 'uncommitted', status: 'WARNING', value: `${fileCount}ファイル` });
    } else {
      console.log(`✅ 未コミットの変更: なし`);
      results.github.push({ name: 'uncommitted', status: 'OK', value: 'なし' });
    }

    // リモートとの同期状態
    try {
      await execAsync('git fetch origin --dry-run');
      const { stdout: status } = await execAsync('git status -uno');

      if (status.includes('Your branch is up to date')) {
        console.log(`✅ リモートと同期: 最新`);
        results.github.push({ name: 'sync', status: 'OK', value: '最新' });
      } else if (status.includes('Your branch is ahead')) {
        console.log(`⚠️  リモートと同期: ローカルが進んでいます（push推奨）`);
        results.github.push({ name: 'sync', status: 'WARNING', value: 'push推奨' });
      } else if (status.includes('Your branch is behind')) {
        console.log(`⚠️  リモートと同期: リモートが進んでいます（pull推奨）`);
        results.github.push({ name: 'sync', status: 'WARNING', value: 'pull推奨' });
      }
    } catch (error) {
      console.log(`⚠️  リモート同期状態: 確認できませんでした`);
    }

  } catch (error) {
    console.log(`❌ Git情報取得エラー: ${error.message}`);
    results.errors.push(`Git: ${error.message}`);
  }

  // 3. .gitignore チェック
  console.log('\n📝 === .gitignore チェック ===');

  try {
    const gitignore = await fs.readFile('.gitignore', 'utf-8');
    const requiredPatterns = [
      'node_modules',
      '.env',
      'dist',
      '.vercel'
    ];

    for (const pattern of requiredPatterns) {
      if (gitignore.includes(pattern)) {
        console.log(`✅ ${pattern}: 除外設定あり`);
      } else {
        console.log(`⚠️  ${pattern}: 除外設定なし`);
        results.errors.push(`.gitignore: ${pattern} が設定されていません`);
      }
    }
  } catch (error) {
    console.log(`❌ .gitignore 読み込みエラー: ${error.message}`);
  }

  // 4. Vercel CLI チェック（利用可能な場合）
  console.log('\n🚀 === Vercel デプロイ情報 ===');

  try {
    const { stdout } = await execAsync('vercel --version 2>&1');
    console.log(`✅ Vercel CLI: ${stdout.trim()}`);

    // デプロイ一覧を取得（ログインしている場合）
    try {
      const { stdout: deployments } = await execAsync('vercel ls --scope ghouse-development 2>&1');
      if (!deployments.includes('Error') && !deployments.includes('credentials')) {
        console.log(`✅ Vercel プロジェクト: アクセス可能`);
        const lines = deployments.split('\n').slice(0, 5);
        console.log(lines.join('\n'));
      } else {
        console.log(`⚠️  Vercel CLI: ログインが必要です`);
        console.log(`   実行してください: vercel login`);
      }
    } catch (error) {
      console.log(`⚠️  Vercel デプロイ情報: 取得できませんでした`);
      console.log(`   Vercel CLIにログインしてください: vercel login`);
    }
  } catch (error) {
    console.log(`⚠️  Vercel CLI: インストールされていません`);
    console.log(`   インストール: npm i -g vercel`);
  }

  // 5. 環境変数ファイル確認
  console.log('\n📋 === 環境変数ファイル ===');

  const envFiles = ['.env.local', '.env.example', '.env.local.example'];

  for (const file of envFiles) {
    try {
      const stats = await fs.stat(file);
      console.log(`✅ ${file}: 存在する (${(stats.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      if (file === '.env.local') {
        console.log(`❌ ${file}: 存在しない（必須）`);
        results.errors.push(`${file} が存在しません`);
      } else {
        console.log(`⚠️  ${file}: 存在しない（オプション）`);
      }
    }
  }

  // サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 === チェックサマリー ===');
  console.log('='.repeat(60));

  const vercelOk = results.vercel.filter(v => v.status === 'OK').length;
  const githubOk = results.github.filter(g => g.status === 'OK').length;

  console.log(`\nVercel設定: ${vercelOk}/${results.vercel.length} OK`);
  console.log(`GitHub設定: ${githubOk}/${results.github.length} OK`);

  if (results.errors.length > 0) {
    console.log('\n❌ === エラー・警告 ===');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  const allOk = results.errors.length === 0;

  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('🎉 === Vercel & GitHub 設定OK ===');
  } else {
    console.log('⚠️  === 一部の設定に注意が必要です ===');
  }

  // 次のステップ
  console.log('\n📝 === 次のステップ ===');
  console.log('  1. Vercel環境変数の設定:');
  console.log('     https://vercel.com/dashboard → プロジェクト → Settings → Environment Variables');
  console.log('     - VITE_SUPABASE_URL');
  console.log('     - VITE_SUPABASE_ANON_KEY');
  console.log('');
  console.log('  2. 本番環境のテスト:');
  console.log('     デプロイ後、以下を確認:');
  console.log('     - トップページが表示される');
  console.log('     - コンソールエラーがない');
  console.log('     - データが正常に取得できる');

  console.log('='.repeat(60) + '\n');

  return allOk;
}

checkVercelGitHub()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
