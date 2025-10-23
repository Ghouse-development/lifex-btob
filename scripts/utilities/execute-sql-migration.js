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
 * Supabase Management API を使用してSQLを実行
 * 注: この方法は Supabase Management API の access token が必要
 */
async function executeViaManagementAPI(sql) {
    const MANAGEMENT_API_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;

    if (!MANAGEMENT_API_TOKEN) {
        console.log('⚠️  SUPABASE_MANAGEMENT_TOKEN が設定されていません。');
        return false;
    }

    const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return false;
        }

        console.log('✅ SQL実行成功 (Management API)');
        return true;
    } catch (error) {
        console.error('❌ Management API実行エラー:', error.message);
        return false;
    }
}

/**
 * Supabase HTTP API を使用してSQLを実行
 * Service Role Key を使用して、カスタムRPC関数経由で実行
 */
async function executeViaCustomRPC(sql) {
    const supabaseUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

    // まず、exec_sql というカスタム関数を作成する必要がある
    // この関数は Supabase SQL Editor で作成する

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'params=single-object'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (errorText.includes('Could not find the function')) {
                console.log('⚠️  exec_sql 関数が存在しません。');
                return false;
            }
            console.error('❌ RPC Error:', errorText);
            return false;
        }

        console.log('✅ SQL実行成功 (Custom RPC)');
        return true;
    } catch (error) {
        console.error('❌ RPC実行エラー:', error.message);
        return false;
    }
}

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
        return false;
    }
}

/**
 * SQLファイルを読み込んで実行
 */
async function executeSQLFile(filePath) {
    console.log('========================================');
    console.log('SQL マイグレーション実行');
    console.log('========================================\n');

    console.log('📄 SQLファイル:', filePath);

    if (!fs.existsSync(filePath)) {
        console.error('❌ ファイルが見つかりません:', filePath);
        return false;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('✅ SQLファイル読み込み完了\n');

    // 複数の方法を順番に試す
    console.log('実行方法を選択中...\n');

    // 方法1: PostgreSQL Client (DATABASE_URL使用)
    console.log('1️⃣ PostgreSQL Client で実行を試みます...');
    let success = await executeViaPostgres(sql);
    if (success) return true;

    // 方法2: Custom RPC
    console.log('\n2️⃣ Custom RPC で実行を試みます...');
    success = await executeViaCustomRPC(sql);
    if (success) return true;

    // 方法3: Management API
    console.log('\n3️⃣ Management API で実行を試みます...');
    success = await executeViaManagementAPI(sql);
    if (success) return true;

    // すべて失敗
    console.log('\n❌ 自動実行できませんでした。');
    console.log('\n手動実行の手順:');
    console.log('1. Supabase Dashboard → SQL Editor を開く');
    console.log('2. 以下のファイルの内容をコピー&ペースト:');
    console.log(`   ${filePath}`);
    console.log('3. "Run" をクリックして実行\n');

    return false;
}

/**
 * メイン処理
 */
async function main() {
    const migrationFile = path.join(__dirname, '..', '..', 'supabase-faq-migration.sql');

    const success = await executeSQLFile(migrationFile);

    if (success) {
        console.log('\n========================================');
        console.log('✅ マイグレーション完了！');
        console.log('========================================\n');

        // 確認
        console.log('テーブル作成を確認します...\n');
        const { execSync } = await import('child_process');
        try {
            execSync('node scripts/utilities/check-faq-tables-direct.js', { stdio: 'inherit' });
        } catch (error) {
            console.log('確認スクリプトの実行に失敗しました。');
        }
    }
}

// 実行
main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
