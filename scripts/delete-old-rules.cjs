/**
 * 古いルールデータを削除するスクリプト
 *
 * 使用方法: node scripts/delete-old-rules.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// .env.local ファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key (first 30 chars):', supabaseKey.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteOldRules() {
    console.log('🗑️  古いルールデータの削除を開始します...\n');

    try {
        // 1. すべてのカテゴリとルールを取得
        console.log('📋 現在のカテゴリとルールを取得中...');
        const { data: categories, error: catError } = await supabase
            .from('rule_categories')
            .select('*');

        if (catError) {
            console.error('❌ カテゴリ取得エラー:', catError);
            return;
        }

        console.log(`✅ カテゴリ数: ${categories.length}件\n`);

        // カテゴリを表示
        categories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
        });

        // 2. 各カテゴリのルールを取得して表示
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*');

        if (rulesError) {
            console.error('❌ ルール取得エラー:', rulesError);
            return;
        }

        console.log(`\n✅ ルール総数: ${rules.length}件\n`);

        // カテゴリごとにルールを表示
        for (const category of categories) {
            const categoryRules = rules.filter(r => r.category_id === category.id);
            console.log(`\n📁 ${category.name} (${categoryRules.length}件):`);
            categoryRules.forEach(rule => {
                console.log(`   - ${rule.title} (${rule.content.substring(0, 30)}...)`);
            });
        }

        // 3. 削除対象のカテゴリを特定（「販売ルール」と「広告ルール」）
        const categoriesToDelete = categories.filter(cat =>
            cat.name === '販売ルール' || cat.name === '広告ルール'
        );

        if (categoriesToDelete.length === 0) {
            console.log('\n✅ 削除対象のカテゴリが見つかりません。');
            return;
        }

        console.log(`\n🗑️  削除対象カテゴリ: ${categoriesToDelete.length}件`);
        categoriesToDelete.forEach(cat => {
            console.log(`   - ${cat.name} (ID: ${cat.id})`);
        });

        // 4. 各カテゴリに紐づくルールを削除
        for (const category of categoriesToDelete) {
            const categoryRules = rules.filter(r => r.category_id === category.id);

            if (categoryRules.length > 0) {
                console.log(`\n🗑️  カテゴリ「${category.name}」のルールを削除中...`);

                for (const rule of categoryRules) {
                    const { error: deleteRuleError } = await supabase
                        .from('rules')
                        .delete()
                        .eq('id', rule.id);

                    if (deleteRuleError) {
                        console.error(`   ❌ ルール削除失敗: ${rule.title}`, deleteRuleError);
                    } else {
                        console.log(`   ✅ ルール削除成功: ${rule.title}`);
                    }
                }
            }

            // 5. カテゴリを削除
            console.log(`\n🗑️  カテゴリ「${category.name}」を削除中...`);
            const { error: deleteCatError } = await supabase
                .from('rule_categories')
                .delete()
                .eq('id', category.id);

            if (deleteCatError) {
                console.error(`   ❌ カテゴリ削除失敗: ${category.name}`, deleteCatError);
            } else {
                console.log(`   ✅ カテゴリ削除成功: ${category.name}`);
            }
        }

        console.log('\n✅ 古いルールデータの削除が完了しました！');

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
}

// スクリプト実行
deleteOldRules();
