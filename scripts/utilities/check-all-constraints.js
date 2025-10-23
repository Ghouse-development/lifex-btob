import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
    console.log('========================================');
    console.log('🔍 データベース制約チェック');
    console.log('========================================\n');

    // Check constraint query
    const constraintQuery = `
        SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.check_constraints cc
            ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_schema = 'public'
            AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
        ORDER BY tc.table_name, tc.constraint_type;
    `;

    // Manual checks for known tables (exec_sql not available)
    console.log('各テーブルを個別にチェックします...\n');
    await checkTableConstraints();
}

async function checkTableConstraints() {
    const checks = [
        {
            table: 'plans',
            statusField: 'status',
            expectedValues: ['published', 'draft'],
            categoryField: null
        },
        {
            table: 'rules',
            statusField: 'status',
            expectedValues: ['active', 'inactive', 'draft'],
            categoryField: 'category_id',
            categoryTable: 'rule_categories'
        },
        {
            table: 'faqs',
            statusField: 'status',
            expectedValues: ['published', 'draft', 'archived'],
            categoryField: 'category_id',
            categoryTable: 'faq_categories'
        },
        {
            table: 'downloads',
            statusField: 'status',
            expectedValues: null,
            categoryField: 'category_id',
            categoryTable: 'download_categories'
        }
    ];

    for (const check of checks) {
        console.log(`\n📋 ${check.table} テーブル`);

        // Check status values
        if (check.statusField && check.expectedValues) {
            const { data, error } = await client
                .from(check.table)
                .select(check.statusField)
                .limit(100);

            if (!error && data) {
                const uniqueStatuses = [...new Set(data.map(r => r[check.statusField]))];
                const invalidStatuses = uniqueStatuses.filter(s => !check.expectedValues.includes(s));

                if (invalidStatuses.length > 0) {
                    console.log(`   ❌ 不正なstatus値: ${invalidStatuses.join(', ')}`);
                    console.log(`      許可値: ${check.expectedValues.join(', ')}`);
                } else {
                    console.log(`   ✅ status値: 正常`);
                }
            }
        }

        // Check foreign key references
        if (check.categoryField && check.categoryTable) {
            const { data: items } = await client
                .from(check.table)
                .select(`${check.categoryField}`)
                .not(check.categoryField, 'is', null);

            const { data: categories } = await client
                .from(check.categoryTable)
                .select('id');

            if (items && categories) {
                const categoryIds = new Set(categories.map(c => c.id));
                const invalidRefs = items.filter(item => !categoryIds.has(item[check.categoryField]));

                if (invalidRefs.length > 0) {
                    console.log(`   ❌ 不正な外部キー: ${invalidRefs.length}件`);
                    console.log(`      ${check.categoryTable}に存在しないIDを参照`);
                } else {
                    console.log(`   ✅ 外部キー: 正常`);
                }
            }
        }
    }

    console.log('\n========================================');
    console.log('カテゴリテーブル一覧');
    console.log('========================================\n');

    const categoryTables = ['rule_categories', 'faq_categories', 'download_categories'];

    for (const table of categoryTables) {
        const { data, error } = await client.from(table).select('id, name');

        if (!error && data) {
            console.log(`\n${table}:`);
            data.forEach(cat => {
                console.log(`  ${cat.name}: ${cat.id}`);
            });
        }
    }
}

checkConstraints().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
