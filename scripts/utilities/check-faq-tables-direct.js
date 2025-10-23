import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    console.log('========================================');
    console.log('データベーステーブル直接確認');
    console.log('========================================\n');

    try {
        // information_schemaを使ってテーブルの存在を確認
        console.log('📊 public スキーマのテーブル一覧を取得中...\n');

        const { data, error } = await supabase.rpc('get_tables_info');

        if (error && error.code === 'PGRST202') {
            console.log('⚠️  get_tables_info 関数が存在しません。');
            console.log('代わりに REST API で確認します...\n');

            // REST APIで直接スキーマ情報を取得
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                }
            });

            const schemaData = await response.json();
            console.log('利用可能なテーブル:', Object.keys(schemaData.definitions || {}));

            // FAQテーブルが含まれているか確認
            const tables = Object.keys(schemaData.definitions || {});
            const faqTables = tables.filter(t => t.includes('faq'));

            if (faqTables.length > 0) {
                console.log('\n✅ FAQ関連テーブル:');
                faqTables.forEach(t => console.log(`  - ${t}`));
            } else {
                console.log('\n❌ FAQ関連テーブルが見つかりません');
            }

        } else if (error) {
            console.error('❌ エラー:', error.message);
        } else {
            console.log('✅ テーブル情報取得成功:');
            console.log(JSON.stringify(data, null, 2));
        }

        // スキーマキャッシュのリフレッシュを試みる
        console.log('\n========================================');
        console.log('スキーマキャッシュのリフレッシュ');
        console.log('========================================\n');

        console.log('以下の方法でスキーマキャッシュをリフレッシュできます:\n');
        console.log('1. Supabase Dashboard → Settings → API');
        console.log('2. 「API Settings」セクションで「Reload schema cache」をクリック\n');
        console.log('または\n');
        console.log('3. Supabase CLI: npx supabase db reset');
        console.log('4. SQL Editor で: NOTIFY pgrst, \'reload schema\'\n');

        // SQL Editorで実行可能なスキーマキャッシュリフレッシュコマンドを提供
        console.log('========================================');
        console.log('SQL Editor で実行するコマンド');
        console.log('========================================\n');
        console.log('以下のSQLをSupabase SQL Editorで実行してください:\n');
        console.log('```sql');
        console.log('-- スキーマキャッシュをリフレッシュ');
        console.log('NOTIFY pgrst, \'reload schema\';');
        console.log('');
        console.log('-- テーブルの存在確認');
        console.log('SELECT table_name');
        console.log('FROM information_schema.tables');
        console.log('WHERE table_schema = \'public\'');
        console.log('  AND table_name LIKE \'%faq%\';');
        console.log('```\n');

    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

checkTables().then(() => {
    console.log('確認完了。');
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
