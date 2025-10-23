import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Plans テーブル 実際のスキーマ取得');
console.log('========================================\n');

async function getActualSchema() {
    try {
        // 既存プランを1件取得してカラム名を確認
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ データ取得エラー:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log('⚠️  既存データがありません');
            return;
        }

        const columns = Object.keys(data[0]);
        console.log('実際のカラム一覧（全', columns.length, '個）:\n');

        columns.forEach((col, index) => {
            const value = data[0][col];
            const type = typeof value;
            const preview = value === null ? 'NULL' :
                           type === 'object' ? JSON.stringify(value).substring(0, 30) :
                           String(value).substring(0, 30);
            console.log(`${(index + 1).toString().padStart(2, ' ')}. ${col.padEnd(30, ' ')} (${type}) = ${preview}`);
        });

        console.log('\n========================================');
        console.log('カラム名の違いを確認:');
        console.log('========================================\n');

        const expectedColumns = {
            'name': '期待: name',
            'plan_name': '実際: plan_name ← 不一致！'
        };

        if (columns.includes('plan_name')) {
            console.log('⚠️  データベースには "plan_name" カラムが存在します');
            console.log('   しかし、admin-plans.htmlは "name" を送信しています');
            console.log('   → admin-plans.htmlを修正する必要があります\n');
        } else if (columns.includes('name')) {
            console.log('✅ "name" カラムが存在します（正常）\n');
        }

        console.log('実際に存在する主要カラム:');
        const keyColumns = ['id', 'plan_name', 'name', 'tsubo', 'total_floor_area', 'construction_floor_area', 'layout', 'floors'];
        keyColumns.forEach(col => {
            if (columns.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} (存在しません)`);
            }
        });

    } catch (err) {
        console.error('予期しないエラー:', err);
    }
}

getActualSchema().then(() => {
    console.log('\n========================================\n');
    process.exit(0);
});
