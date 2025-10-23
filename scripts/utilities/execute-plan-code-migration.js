import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

console.log('========================================');
console.log('プランコードカラム追加マイグレーション');
console.log('========================================\n');

async function executeMigration() {
    const client = new Client({
        host: 'aws-0-ap-northeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.hegpxvyziovlfxdfsrsv',
        password: process.env.SUPABASE_DB_PASSWORD || 'Lifex@1031@2024'
    });

    try {
        console.log('📡 データベースに接続中...\n');
        await client.connect();
        console.log('✅ 接続成功\n');

        // マイグレーションSQLを読み込み
        const sqlPath = join(__dirname, '../../database/add-plan-code-column.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        console.log('📋 マイグレーションSQLを実行中...\n');

        await client.query(sql);

        console.log('✅ マイグレーション実行成功！\n');

        // 確認クエリ
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'plans' AND column_name = 'plan_code'
        `);

        if (result.rows.length > 0) {
            console.log('✅ plan_codeカラムが正常に追加されました:');
            console.log('   カラム名:', result.rows[0].column_name);
            console.log('   データ型:', result.rows[0].data_type);
            console.log('   NULL許可:', result.rows[0].is_nullable);
        } else {
            console.log('⚠️  plan_codeカラムが見つかりません');
        }

    } catch (err) {
        console.error('❌ エラー:', err.message);
        if (err.code) {
            console.error('   エラーコード:', err.code);
        }
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n📡 接続を切断しました');
    }
}

executeMigration().then(() => {
    console.log('\n========================================');
    console.log('✅ マイグレーション完了');
    console.log('========================================\n');
    process.exit(0);
});
