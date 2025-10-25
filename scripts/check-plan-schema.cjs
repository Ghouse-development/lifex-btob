#!/usr/bin/env node

/**
 * プランデータのスキーマと実際のデータを確認するスクリプト
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

async function checkPlanSchema() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('🔍 プランデータのスキーマチェック開始...\n');

    // 特定のプランIDのデータを取得
    const testPlanId = 'c9213ddf-1bda-49fa-ac69-11fdc0595543';

    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', testPlanId)
        .single();

    if (error) {
        console.error('❌ エラー:', error.message);
        return;
    }

    console.log('✅ プランデータ取得成功\n');
    console.log('📋 全フィールド一覧:');
    console.log('='.repeat(60));

    // すべてのフィールドとその値を表示
    Object.keys(data).sort().forEach(key => {
        const value = data[key];
        const type = typeof value;
        const displayValue = value === null ? '(null)' :
                           type === 'object' ? JSON.stringify(value).substring(0, 50) :
                           String(value).substring(0, 50);

        console.log(`${key.padEnd(25)} = ${displayValue}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🔍 重要フィールドの詳細チェック:\n');

    // 重要なフィールドをチェック
    const importantFields = {
        'plan_name': 'プラン名',
        'tsubo': '坪数',
        'maguchi': '間口',
        'oku_yuki': '奥行',
        'building_floors': '階数',
        'ldk_floor': 'LDK階',
        'bathroom_floor': '浴室階',
        'sell_price': '売価',
        'cost_price': '原価',
        'gross_profit': '粗利'
    };

    Object.entries(importantFields).forEach(([field, label]) => {
        const value = data[field];
        const exists = field in data;
        const status = exists ? (value !== null && value !== undefined ? '✅' : '⚠️ (null)') : '❌';
        console.log(`${status} ${label.padEnd(15)} (${field.padEnd(20)}): ${value !== null && value !== undefined ? value : 'なし'}`);
    });

    // フィールド名の類似性をチェック（typoの可能性）
    console.log('\n' + '='.repeat(60));
    console.log('🔍 類似フィールド名のチェック:\n');

    const fieldNames = Object.keys(data);
    const searchTerms = ['width', 'depth', 'floor', '間口', '奥行', '階'];

    searchTerms.forEach(term => {
        const matches = fieldNames.filter(f => f.toLowerCase().includes(term.toLowerCase()));
        if (matches.length > 0) {
            console.log(`"${term}" を含むフィールド: ${matches.join(', ')}`);
        }
    });
}

checkPlanSchema().catch(error => {
    console.error('\n❌ スクリプト実行エラー:', error);
    process.exit(1);
});
