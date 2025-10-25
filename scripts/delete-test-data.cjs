/**
 * テストデータを削除するスクリプト
 * 「てすと」「LX」などのテストデータをSupabaseから削除
 *
 * 使用方法: node scripts/delete-test-data.cjs
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

// テストデータを判定するキーワード
const TEST_KEYWORDS = ['てすと', 'テスト', 'test', 'LX', 'TEST', 'Test'];

async function checkAndDeleteTestData() {
    console.log('🗑️  テストデータの確認と削除を開始します...\n');

    try {
        // 1. ルールテーブルのテストデータを確認
        console.log('📋 1. ルールデータを確認中...');
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*');

        if (rulesError) {
            console.error('❌ ルール取得エラー:', rulesError);
        } else {
            console.log(`✅ ルール総数: ${rules.length}件\n`);

            // テストデータを検出
            const testRules = rules.filter(rule =>
                TEST_KEYWORDS.some(keyword =>
                    rule.title?.includes(keyword) ||
                    rule.content?.includes(keyword)
                )
            );

            if (testRules.length > 0) {
                console.log(`🔍 テストルールを発見: ${testRules.length}件`);
                testRules.forEach(rule => {
                    console.log(`   - ${rule.title} (ID: ${rule.id})`);
                    console.log(`     内容: ${rule.content?.substring(0, 50)}...`);
                });

                // 削除確認
                console.log('\n🗑️  テストルールを削除中...');
                for (const rule of testRules) {
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
            } else {
                console.log('✅ テストルールは見つかりませんでした\n');
            }
        }

        // 2. プランテーブルのテストデータを確認
        console.log('\n📋 2. プランデータを確認中...');
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('*');

        if (plansError) {
            console.error('❌ プラン取得エラー:', plansError);
        } else {
            console.log(`✅ プラン総数: ${plans.length}件\n`);

            // テストデータを検出
            const testPlans = plans.filter(plan =>
                TEST_KEYWORDS.some(keyword =>
                    plan.plan_name?.includes(keyword) ||
                    plan.description?.includes(keyword)
                )
            );

            if (testPlans.length > 0) {
                console.log(`🔍 テストプランを発見: ${testPlans.length}件`);
                testPlans.forEach(plan => {
                    console.log(`   - ${plan.plan_name} (ID: ${plan.id})`);
                });

                // 削除確認
                console.log('\n🗑️  テストプランを削除中...');
                for (const plan of testPlans) {
                    const { error: deleteError } = await supabase
                        .from('plans')
                        .delete()
                        .eq('id', plan.id);

                    if (deleteError) {
                        console.error(`   ❌ 削除失敗: ${plan.plan_name}`, deleteError);
                    } else {
                        console.log(`   ✅ 削除成功: ${plan.plan_name}`);
                    }
                }
            } else {
                console.log('✅ テストプランは見つかりませんでした\n');
            }
        }

        // 3. FAQテーブルのテストデータを確認
        console.log('\n📋 3. FAQデータを確認中...');
        const { data: faqs, error: faqsError } = await supabase
            .from('faqs')
            .select('*');

        if (faqsError) {
            console.error('❌ FAQ取得エラー:', faqsError);
        } else {
            console.log(`✅ FAQ総数: ${faqs.length}件\n`);

            // テストデータを検出
            const testFaqs = faqs.filter(faq =>
                TEST_KEYWORDS.some(keyword =>
                    faq.question?.includes(keyword) ||
                    faq.answer?.includes(keyword)
                )
            );

            if (testFaqs.length > 0) {
                console.log(`🔍 テストFAQを発見: ${testFaqs.length}件`);
                testFaqs.forEach(faq => {
                    console.log(`   - ${faq.question?.substring(0, 50)}... (ID: ${faq.id})`);
                });

                // 削除確認
                console.log('\n🗑️  テストFAQを削除中...');
                for (const faq of testFaqs) {
                    const { error: deleteError } = await supabase
                        .from('faqs')
                        .delete()
                        .eq('id', faq.id);

                    if (deleteError) {
                        console.error(`   ❌ 削除失敗: ${faq.question}`, deleteError);
                    } else {
                        console.log(`   ✅ 削除成功: ${faq.question?.substring(0, 30)}...`);
                    }
                }
            } else {
                console.log('✅ テストFAQは見つかりませんでした\n');
            }
        }

        // 4. お知らせテーブルのテストデータを確認
        console.log('\n📋 4. お知らせデータを確認中...');
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*');

        if (notificationsError) {
            console.error('❌ お知らせ取得エラー:', notificationsError);
        } else {
            console.log(`✅ お知らせ総数: ${notifications.length}件\n`);

            // テストデータを検出
            const testNotifications = notifications.filter(notification =>
                TEST_KEYWORDS.some(keyword =>
                    notification.title?.includes(keyword) ||
                    notification.content?.includes(keyword)
                )
            );

            if (testNotifications.length > 0) {
                console.log(`🔍 テストお知らせを発見: ${testNotifications.length}件`);
                testNotifications.forEach(notification => {
                    console.log(`   - ${notification.title} (ID: ${notification.id})`);
                });

                // 削除確認
                console.log('\n🗑️  テストお知らせを削除中...');
                for (const notification of testNotifications) {
                    const { error: deleteError } = await supabase
                        .from('notifications')
                        .delete()
                        .eq('id', notification.id);

                    if (deleteError) {
                        console.error(`   ❌ 削除失敗: ${notification.title}`, deleteError);
                    } else {
                        console.log(`   ✅ 削除成功: ${notification.title}`);
                    }
                }
            } else {
                console.log('✅ テストお知らせは見つかりませんでした\n');
            }
        }

        console.log('\n✅ テストデータの削除が完了しました！');

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
}

// スクリプト実行
checkAndDeleteTestData();
