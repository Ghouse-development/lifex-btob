import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('プランコードカラム追加マイグレーション');
console.log('========================================\n');

async function runMigration() {
    try {
        // マイグレーションSQLを読み込み
        const sqlPath = join(__dirname, '../../database/add-plan-code-column.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        console.log('📋 マイグレーションSQLを実行中...\n');

        // SQLを実行（Supabase CLIまたは直接実行）
        // 注: Supabase JS クライアントでは直接SQL実行できないため、
        // SQL Editorで手動実行するか、supabase CLIを使用してください

        console.log('⚠️  以下のSQLをSupabase SQL Editorで実行してください:\n');
        console.log('----------------------------------------');
        console.log(sql);
        console.log('----------------------------------------\n');

        console.log('または、以下のコマンドで実行:');
        console.log('npx supabase db execute --file database/add-plan-code-column.sql\n');

        // カラムが存在するか確認
        const { data, error } = await supabase
            .from('plans')
            .select('plan_code')
            .limit(1);

        if (error) {
            if (error.code === '42703') {
                console.log('❌ plan_codeカラムがまだ存在しません');
                console.log('   上記のSQLを実行してください\n');
            } else {
                console.error('❌ エラー:', error.message);
            }
        } else {
            console.log('✅ plan_codeカラムが存在します\n');
            console.log('マイグレーション完了！');
        }

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

runMigration().then(() => {
    console.log('\n========================================\n');
    process.exit(0);
});
