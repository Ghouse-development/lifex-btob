#!/usr/bin/env node

/**
 * パフォーマンス計測スクリプト
 * Lighthouse を使用して主要ページのパフォーマンスを計測
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

const BASE_URL = 'https://lifex-btob.vercel.app';

const pages = [
  { url: '/', name: 'トップページ' },
  { url: '/plans.html', name: 'プラン一覧' },
  { url: '/plan-detail.html?id=1', name: 'プラン詳細' },
  { url: '/matrix.html', name: '間取マトリックス' },
  { url: '/rules.html', name: 'ルール一覧' },
  { url: '/faq.html', name: 'FAQ' }
];

async function measurePerformance(url, name) {
  console.log(`\n📊 計測中: ${name} (${url})`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port
  };

  try {
    const runnerResult = await lighthouse(url, options);
    const { lhr } = runnerResult;

    const scores = {
      name,
      url,
      performanceScore: Math.round(lhr.categories.performance.score * 100),
      metrics: {
        fcp: lhr.audits['first-contentful-paint'].displayValue,
        lcp: lhr.audits['largest-contentful-paint'].displayValue,
        tti: lhr.audits['interactive'].displayValue,
        si: lhr.audits['speed-index'].displayValue,
        tbt: lhr.audits['total-blocking-time'].displayValue,
        cls: lhr.audits['cumulative-layout-shift'].displayValue
      }
    };

    await chrome.kill();
    return scores;
  } catch (error) {
    console.error(`❌ エラー: ${error.message}`);
    await chrome.kill();
    return null;
  }
}

async function main() {
  console.log('🚀 LIFE X パフォーマンス計測開始');
  console.log('='.repeat(80));

  const results = [];

  for (const page of pages) {
    const result = await measurePerformance(`${BASE_URL}${page.url}`, page.name);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📈 計測結果サマリー');
  console.log('='.repeat(80));

  results.forEach(result => {
    const emoji = result.performanceScore >= 90 ? '✅' : result.performanceScore >= 50 ? '⚠️' : '❌';
    console.log(`\n${emoji} ${result.name}`);
    console.log(`   パフォーマンススコア: ${result.performanceScore}点`);
    console.log(`   FCP (First Contentful Paint): ${result.metrics.fcp}`);
    console.log(`   LCP (Largest Contentful Paint): ${result.metrics.lcp}`);
    console.log(`   TTI (Time to Interactive): ${result.metrics.tti}`);
    console.log(`   Speed Index: ${result.metrics.si}`);
    console.log(`   TBT (Total Blocking Time): ${result.metrics.tbt}`);
    console.log(`   CLS (Cumulative Layout Shift): ${result.metrics.cls}`);
  });

  // 平均スコアを計算
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length
  );

  console.log('\n' + '='.repeat(80));
  console.log(`📊 平均パフォーマンススコア: ${avgScore}点`);

  if (avgScore >= 90) {
    console.log('✅ 優秀！日本トップクラスのパフォーマンスです。');
  } else if (avgScore >= 70) {
    console.log('⚠️ 良好ですが、改善の余地があります。');
  } else {
    console.log('❌ 改善が必要です。');
  }

  // 結果をJSONファイルに保存
  const timestamp = new Date().toISOString().split('T')[0];
  const outputFile = `performance-report-${timestamp}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 詳細レポートを保存: ${outputFile}`);
}

main().catch(console.error);
