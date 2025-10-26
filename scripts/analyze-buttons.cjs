#!/usr/bin/env node

/**
 * 全管理ページのボタン解析スクリプト
 * - 各ページのボタン要素を検出
 * - イベントハンドラー（@click, onclick等）を特定
 * - 潜在的な問題を検出
 */

const fs = require('fs');
const path = require('path');

const pages = [
  'admin-downloads.html',
  'admin-faq.html',
  'admin-notifications.html',
  'admin-users.html',
  'admin-profile.html',
  'admin-report.html'
];

const srcDir = path.join(__dirname, '..', 'src');

function analyzeButtons(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const buttons = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    // ボタン要素を検出
    const buttonMatches = [
      ...line.matchAll(/<button[^>]*>/gi),
      ...line.matchAll(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>/gi),
      ...line.matchAll(/<input[^>]*type="button"[^>]*>/gi),
      ...line.matchAll(/<input[^>]*type="submit"[^>]*>/gi)
    ];

    for (const match of buttonMatches) {
      const buttonHtml = match[0];

      // イベントハンドラーを検出
      const handlers = [];

      // Alpine.js @click
      const alpineClick = buttonHtml.match(/@click(?:\.prevent)?(?:\.stop)?="([^"]*)"/);
      if (alpineClick) handlers.push({ type: '@click', code: alpineClick[1] });

      // onclick
      const onclick = buttonHtml.match(/onclick="([^"]*)"/i);
      if (onclick) handlers.push({ type: 'onclick', code: onclick[1] });

      // x-on:click
      const xOnClick = buttonHtml.match(/x-on:click="([^"]*)"/);
      if (xOnClick) handlers.push({ type: 'x-on:click', code: xOnClick[1] });

      // ボタンのテキスト/ID/クラスを取得
      const id = buttonHtml.match(/id="([^"]*)"/);
      const className = buttonHtml.match(/class="([^"]*)"/);
      const type = buttonHtml.match(/type="([^"]*)"/);

      // ボタンのラベルを取得（次の行も含めて検索）
      let label = '';
      const textMatch = line.match(/>([^<]+)</);
      if (textMatch) label = textMatch[1].trim();

      buttons.push({
        line: lineNumber,
        html: buttonHtml.substring(0, 100) + (buttonHtml.length > 100 ? '...' : ''),
        id: id ? id[1] : null,
        class: className ? className[1] : null,
        type: type ? type[1] : null,
        label: label || '(ラベルなし)',
        handlers: handlers
      });
    }
  }

  return buttons;
}

function analyzePotentialIssues(buttons, fileName) {
  const issues = [];

  for (const button of buttons) {
    // イベントハンドラーがない
    if (button.handlers.length === 0 && button.type !== 'submit') {
      issues.push({
        severity: 'info',
        button: button,
        message: 'イベントハンドラーがありません（type="submit"でない場合、機能しない可能性）'
      });
    }

    // 複数のイベントハンドラー
    if (button.handlers.length > 1) {
      issues.push({
        severity: 'warning',
        button: button,
        message: '複数のイベントハンドラーが設定されています（競合の可能性）'
      });
    }

    // 危険な関数呼び出し
    for (const handler of button.handlers) {
      // console.errorの使用
      if (handler.code.includes('console.error')) {
        issues.push({
          severity: 'error',
          button: button,
          message: `console.errorを使用: ${handler.code}`
        });
      }

      // window.supabaseの直接使用（common.js経由を推奨）
      if (handler.code.includes('window.supabase.') && !handler.code.includes('window.supabaseClient')) {
        issues.push({
          severity: 'warning',
          button: button,
          message: `window.supabaseを直接使用（window.supabaseClientまたはAPIを推奨）: ${handler.code.substring(0, 50)}...`
        });
      }

      // エラーハンドリングなし
      if (handler.code.includes('await ') && !handler.code.includes('try') && !handler.code.includes('catch')) {
        issues.push({
          severity: 'warning',
          button: button,
          message: `awaitを使用しているがtry-catchがない可能性: ${handler.code.substring(0, 50)}...`
        });
      }
    }
  }

  return issues;
}

console.log('🔍 全管理ページのボタン解析開始...\n');
console.log('='.repeat(80));

const allResults = {};

for (const page of pages) {
  const filePath = path.join(srcDir, page);

  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  ${page}: ファイルが見つかりません`);
    continue;
  }

  console.log(`\n📄 ${page}`);
  console.log('-'.repeat(80));

  const buttons = analyzeButtons(filePath, page);
  const issues = analyzePotentialIssues(buttons, page);

  console.log(`総ボタン数: ${buttons.length}件`);
  console.log(`潜在的な問題: ${issues.length}件`);

  // ボタン一覧
  if (buttons.length > 0) {
    console.log('\n【ボタン一覧】');
    buttons.forEach((btn, i) => {
      console.log(`\n${i + 1}. [行${btn.line}] ${btn.label}`);
      if (btn.id) console.log(`   ID: ${btn.id}`);
      if (btn.type) console.log(`   Type: ${btn.type}`);
      if (btn.handlers.length > 0) {
        btn.handlers.forEach(h => {
          const code = h.code.length > 60 ? h.code.substring(0, 60) + '...' : h.code;
          console.log(`   ${h.type}: ${code}`);
        });
      } else {
        console.log('   イベントハンドラー: なし');
      }
    });
  }

  // 問題一覧
  if (issues.length > 0) {
    console.log('\n【潜在的な問題】');
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log('\n❌ エラー:');
      errors.forEach((issue, i) => {
        console.log(`${i + 1}. [行${issue.button.line}] ${issue.button.label}`);
        console.log(`   ${issue.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach((issue, i) => {
        console.log(`${i + 1}. [行${issue.button.line}] ${issue.button.label}`);
        console.log(`   ${issue.message}`);
      });
    }

    if (infos.length > 0 && infos.length <= 5) {
      console.log('\nℹ️  情報:');
      infos.forEach((issue, i) => {
        console.log(`${i + 1}. [行${issue.button.line}] ${issue.button.label}`);
        console.log(`   ${issue.message}`);
      });
    }
  }

  allResults[page] = {
    buttons: buttons,
    issues: issues
  };
}

// サマリー
console.log('\n' + '='.repeat(80));
console.log('📊 サマリー');
console.log('='.repeat(80));

let totalButtons = 0;
let totalIssues = 0;
let totalErrors = 0;
let totalWarnings = 0;

for (const [page, result] of Object.entries(allResults)) {
  totalButtons += result.buttons.length;
  totalIssues += result.issues.length;
  totalErrors += result.issues.filter(i => i.severity === 'error').length;
  totalWarnings += result.issues.filter(i => i.severity === 'warning').length;
}

console.log(`総ページ数: ${pages.length}`);
console.log(`総ボタン数: ${totalButtons}`);
console.log(`総問題数: ${totalIssues}`);
console.log(`  - エラー: ${totalErrors}`);
console.log(`  - 警告: ${totalWarnings}`);
console.log(`  - 情報: ${totalIssues - totalErrors - totalWarnings}`);

if (totalErrors > 0) {
  console.log('\n❌ エラーが検出されました。修正が必要です。');
} else if (totalWarnings > 0) {
  console.log('\n⚠️  警告が検出されました。確認を推奨します。');
} else {
  console.log('\n✅ 重大な問題は検出されませんでした。');
}

console.log('\n✅ 解析完了');
