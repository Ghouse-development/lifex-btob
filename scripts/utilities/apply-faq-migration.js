import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

// PostgreSQL接続文字列（Supabaseダッシュボードから取得）
// Database Settings → Connection string → URI から取得
const DB_CONNECTION_STRING = process.env.DATABASE_URL ||
    'postgresql://postgres.hegpxvyziovlfxdfsrsv:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

// Supabaseクライアント作成（テーブル確認用）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigrationViaPsql() {
    console.log('========================================');
    console.log('FAQ テーブル マイグレーション実行');
    console.log('（psql コマンドを使用）');
    console.log('========================================\n');

    try {
        const migrationPath = path.join(__dirname, '..', '..', 'supabase-faq-migration.sql');
        console.log('📄 マイグレーションファイル:', migrationPath);

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ マイグレーションファイルが見つかりません:', migrationPath);
            return false;
        }

        // psqlコマンドで実行
        console.log('🔄 psql コマンドでSQLを実行します...\n');

        const command = `psql "${DB_CONNECTION_STRING}" -f "${migrationPath}"`;
        const { stdout, stderr } = await execPromise(command);

        if (stdout) {
            console.log('stdout:', stdout);
        }
        if (stderr) {
            console.log('stderr:', stderr);
        }

        console.log('✅ マイグレーション実行完了\n');
        return true;

    } catch (error) {
        console.error('❌ psql実行エラー:', error.message);
        if (error.message.includes('psql')) {
            console.log('\n⚠️  psql コマンドが見つかりません。');
            console.log('PostgreSQLクライアントがインストールされていない可能性があります。\n');
        }
        return false;
    }
}

async function applyMigrationManually() {
    console.log('========================================');
    console.log('FAQ テーブル 手動作成');
    console.log('========================================\n');

    try {
        const migrationPath = path.join(__dirname, '..', '..', 'supabase-faq-migration.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');

        console.log('📋 以下の手順でマイグレーションを実行してください:\n');
        console.log('1. Supabaseダッシュボードを開く:');
        console.log('   https://supabase.com/dashboard/project/hegpxvyziovlfxdfsrsv\n');
        console.log('2. 左サイドバーの「SQL Editor」をクリック\n');
        console.log('3. 「New query」をクリック\n');
        console.log('4. 以下のSQLをコピー&ペースト:\n');
        console.log('─'.repeat(60));
        console.log(sqlContent.substring(0, 500) + '...\n（以降省略）');
        console.log('─'.repeat(60));
        console.log('\n   ※ 完全なSQLは supabase-faq-migration.sql を参照\n');
        console.log('5. 「Run」をクリックして実行\n');

        console.log('マイグレーションファイルの場所:');
        console.log(`  ${migrationPath}\n`);

    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

async function verifyTables() {
    console.log('========================================');
    console.log('テーブル確認');
    console.log('========================================\n');

    const tables = [
        { name: 'faq_categories', description: 'FAQカテゴリ' },
        { name: 'faqs', description: 'FAQ本体' },
        { name: 'faq_feedback', description: 'FAQ評価' }
    ];

    let allExist = true;

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table.name} (${table.description}): 存在しません`);
                console.log(`   エラー: ${error.message}\n`);
                allExist = false;
            } else {
                console.log(`✅ ${table.name} (${table.description}): 存在します (${count || 0}件)\n`);
            }
        } catch (err) {
            console.log(`❌ ${table.name} (${table.description}): 確認エラー`);
            console.log(`   ${err.message}\n`);
            allExist = false;
        }
    }

    return allExist;
}

async function main() {
    console.log('FAQテーブル マイグレーションを開始します...\n');

    // まず、テーブルが既に存在するか確認
    console.log('1️⃣ 既存テーブルを確認中...\n');
    const tablesExist = await verifyTables();

    if (tablesExist) {
        console.log('✅ FAQテーブルは既に存在します！');
        console.log('マイグレーションは不要です。\n');
        return;
    }

    console.log('2️⃣ マイグレーションを実行します...\n');

    // psql で実行を試みる
    const psqlSuccess = await applyMigrationViaPsql();

    if (!psqlSuccess) {
        // psqlが使えない場合は手動実行の案内
        await applyMigrationManually();
        console.log('⚠️  手動でマイグレーションを実行してください。');
        return;
    }

    // 実行後の確認
    console.log('3️⃣ マイグレーション後の確認...\n');
    const success = await verifyTables();

    if (success) {
        console.log('========================================');
        console.log('✅ マイグレーション完了！');
        console.log('========================================');
        console.log('FAQ機能が使用可能になりました。\n');
    } else {
        console.log('========================================');
        console.log('⚠️  一部のテーブルが作成されていません');
        console.log('========================================');
        console.log('手動でマイグレーションを実行してください。\n');
    }
}

// 実行
main().then(() => {
    console.log('処理が完了しました。');
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
