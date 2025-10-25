/**
 * 古いルールデータを詳しく確認して削除するスクリプト
 * 「あああ」「てすと」などの古いデータを削除
 *
 * 使用方法: node scripts/check-and-delete-old-rules.cjs
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

// 削除対象のキーワード
const DELETE_KEYWORDS = ['あああ', 'てすと', 'テスト', 'test', 'LX', 'TEST'];

async function checkAndDeleteOldRules() {
    console.log('🗑️  古いルールデータの確認と削除を開始します...\n');

    try {
        // 1. すべてのルールカテゴリを確認
        console.log('📋 1. ルールカテゴリを確認中...');
        const { data: categories, error: catError } = await supabase
            .from('rule_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (catError) {
            console.error('❌ カテゴリ取得エラー:', catError);
            return;
        }

        console.log(`✅ カテゴリ総数: ${categories.length}件\n`);

        // すべてのカテゴリを詳細表示
        categories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
            console.log(`   説明: ${cat.description || 'なし'}`);
            console.log(`   表示順: ${cat.display_order}`);
            console.log(`   ステータス: ${cat.status}`);
            console.log(`   作成日: ${cat.created_at}`);
            console.log('');
        });

        // 削除対象のカテゴリを検出
        const categoriesToDelete = categories.filter(cat =>
            DELETE_KEYWORDS.some(keyword => cat.name?.includes(keyword))
        );

        if (categoriesToDelete.length > 0) {
            console.log(`\n🔍 削除対象カテゴリを発見: ${categoriesToDelete.length}件`);
            categoriesToDelete.forEach(cat => {
                console.log(`   - ${cat.name} (ID: ${cat.id})`);
            });

            // カテゴリを削除
            for (const category of categoriesToDelete) {
                console.log(`\n🗑️  カテゴリ「${category.name}」を削除中...`);

                // まず、このカテゴリに紐づくルールを削除
                const { data: relatedRules } = await supabase
                    .from('rules')
                    .select('*')
                    .eq('category_id', category.id);

                if (relatedRules && relatedRules.length > 0) {
                    console.log(`   関連ルール: ${relatedRules.length}件`);
                    for (const rule of relatedRules) {
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

                // カテゴリを削除
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
        }

        // 2. すべてのルールを確認
        console.log('\n📋 2. ルールを確認中...');
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*')
            .order('display_order', { ascending: true });

        if (rulesError) {
            console.error('❌ ルール取得エラー:', rulesError);
            return;
        }

        console.log(`✅ ルール総数: ${rules.length}件\n`);

        // すべてのルールを詳細表示
        rules.forEach((rule, index) => {
            console.log(`${index + 1}. ${rule.title} (ID: ${rule.id})`);
            console.log(`   カテゴリID: ${rule.category_id}`);
            console.log(`   内容: ${rule.content?.substring(0, 50)}...`);
            console.log(`   表示順: ${rule.display_order}`);
            console.log(`   ステータス: ${rule.status}`);
            console.log(`   更新日: ${rule.updated_at}`);
            console.log('');
        });

        // 削除対象のルールを検出
        const rulesToDelete = rules.filter(rule =>
            DELETE_KEYWORDS.some(keyword =>
                rule.title?.includes(keyword) ||
                rule.content?.includes(keyword)
            )
        );

        if (rulesToDelete.length > 0) {
            console.log(`\n🔍 削除対象ルールを発見: ${rulesToDelete.length}件`);
            rulesToDelete.forEach(rule => {
                console.log(`   - ${rule.title} (ID: ${rule.id})`);
            });

            // ルールを削除
            for (const rule of rulesToDelete) {
                console.log(`\n🗑️  ルール「${rule.title}」を削除中...`);
                const { error: deleteError } = await supabase
                    .from('rules')
                    .delete()
                    .eq('id', rule.id);

                if (deleteError) {
                    console.error(`   ❌ 削除失敗: ${rule.title}`, deleteError);
                } else {
                    console.log(`   ✅ 削除成功: ${rule.title}`);
                }
            }
        }

        if (categoriesToDelete.length === 0 && rulesToDelete.length === 0) {
            console.log('\n✅ 削除対象のデータは見つかりませんでした');
        } else {
            console.log('\n✅ 古いルールデータの削除が完了しました！');
        }

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
}

// スクリプト実行
checkAndDeleteOldRules();
