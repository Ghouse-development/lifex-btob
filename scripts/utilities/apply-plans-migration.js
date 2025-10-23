import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase接続情報
const SUPABASE_PROJECT_REF = 'hegpxvyziovlfxdfsrsv';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

/**
 * PostgreSQL クライアントを使用して直接実行
 */
async function executeViaPostgres(sql) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.log('⚠️  DATABASE_URL が設定されていません。');
        console.log('\n以下の手順で設定してください:');
        console.log('1. Supabase Dashboard → Settings → Database');
        console.log('2. "Connection string" の "URI" をコピー');
        console.log('3. .env.local に追加: DATABASE_URL=<接続文字列>\n');
        return false;
    }

    try {
        const pg = await import('pg');
        const { Client } = pg.default;

        const client = new Client({ connectionString: DATABASE_URL });

        console.log('🔌 データベースに接続中...');
        await client.connect();

        console.log('🔄 SQLを実行中...');
        await client.query(sql);

        await client.end();
        console.log('✅ SQL実行成功 (PostgreSQL Client)');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL実行エラー:', error.message);
        console.error('詳細:', error);
        return false;
    }
}

/**
 * SQLファイルを読み込んで実行
 */
async function executeSQLFile(filePath) {
    console.log('========================================');
    console.log('Plans テーブル マイグレーション実行');
    console.log('========================================\n');

    console.log('📄 SQLファイル:', filePath);

    if (!fs.existsSync(filePath)) {
        console.error('❌ ファイルが見つかりません:', filePath);
        return false;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('✅ SQLファイル読み込み完了\n');
    console.log('実行するSQL:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------\n');

    // PostgreSQL Client で実行
    console.log('1️⃣ PostgreSQL Client で実行を試みます...');
    const success = await executeViaPostgres(sql);

    if (!success) {
        console.log('\n❌ 自動実行できませんでした。');
        console.log('\n手動実行の手順:');
        console.log('1. Supabase Dashboard → SQL Editor を開く');
        console.log('   https://supabase.com/dashboard/project/hegpxvyziovlfxdfsrsv/sql/new');
        console.log('2. 以下のファイルの内容をコピー&ペースト:');
        console.log(`   ${filePath}`);
        console.log('3. "Run" をクリックして実行\n');
    }

    return success;
}

/**
 * メイン処理
 */
async function main() {
    const migrationFile = path.join(__dirname, '..', '..', 'database', 'add-missing-columns-migration.sql');

    const success = await executeSQLFile(migrationFile);

    if (success) {
        console.log('\n========================================');
        console.log('✅ マイグレーション完了！');
        console.log('========================================\n');
        console.log('以下のカラムが追加されました:');
        console.log('- layout (間取り)');
        console.log('- ldk_floor (LDK階数)');
        console.log('- bathroom_floor (浴室階数)');
        console.log('- sell_price (販売価格)');
        console.log('- cost (原価)');
        console.log('- gross_profit (粗利)');
        console.log('- ua_value (UA値)');
        console.log('- energy_reduction (省エネ率)');
        console.log('- designer (設計者)');
        console.log('- images (画像データ)');
        console.log('- floor_plans (間取図データ)');
        console.log('- files (ファイルデータ)\n');
    }
}

// 実行
main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
