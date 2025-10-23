import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const client = createClient(supabaseUrl, supabaseServiceKey);

const errors = [];
const warnings = [];

async function checkDatabase() {
    console.log('========================================');
    console.log('🔍 包括的データベース整合性チェック');
    console.log('========================================\n');

    // 1. Check all tables for null foreign keys
    await checkNullForeignKeys();

    // 2. Check status values
    await checkStatusValues();

    // 3. Check orphaned records
    await checkOrphanedRecords();

    // 4. Check required fields
    await checkRequiredFields();

    // 5. Check data consistency
    await checkDataConsistency();

    // Print summary
    printSummary();
}

async function checkNullForeignKeys() {
    console.log('\n📋 1. NULL外部キーチェック\n');

    const checks = [
        { table: 'rules', fkField: 'category_id', refTable: 'rule_categories' },
        { table: 'faqs', fkField: 'category_id', refTable: 'faq_categories' },
        { table: 'downloads', fkField: 'category_id', refTable: 'download_categories' }
    ];

    for (const check of checks) {
        const { data, error } = await client
            .from(check.table)
            .select('id, ' + check.fkField)
            .is(check.fkField, null);

        if (error) {
            errors.push(`${check.table}: クエリエラー - ${error.message}`);
            console.log(`   ❌ ${check.table}: クエリエラー`);
        } else if (data && data.length > 0) {
            errors.push(`${check.table}: ${data.length}件のレコードで${check.fkField}がnull`);
            console.log(`   ❌ ${check.table}: ${data.length}件のレコードで${check.fkField}がnull`);
            data.forEach(row => console.log(`      ID: ${row.id}`));
        } else {
            console.log(`   ✅ ${check.table}: 外部キーは全て設定済み`);
        }
    }
}

async function checkStatusValues() {
    console.log('\n📋 2. ステータス値チェック\n');

    const checks = [
        { table: 'plans', expectedValues: ['published', 'draft'] },
        { table: 'rules', expectedValues: ['active', 'inactive', 'draft'] },
        { table: 'faqs', expectedValues: ['published', 'draft', 'archived'] },
        { table: 'downloads', expectedValues: ['published', 'draft', 'archived'] }
    ];

    for (const check of checks) {
        const { data, error } = await client
            .from(check.table)
            .select('id, status');

        if (error) {
            errors.push(`${check.table}: クエリエラー - ${error.message}`);
            console.log(`   ❌ ${check.table}: クエリエラー`);
        } else if (data) {
            const invalidStatuses = data.filter(row =>
                row.status && !check.expectedValues.includes(row.status)
            );

            if (invalidStatuses.length > 0) {
                errors.push(`${check.table}: ${invalidStatuses.length}件の不正なステータス値`);
                console.log(`   ❌ ${check.table}: ${invalidStatuses.length}件の不正なステータス値`);
                invalidStatuses.forEach(row =>
                    console.log(`      ID: ${row.id}, status: "${row.status}"`)
                );
            } else {
                console.log(`   ✅ ${check.table}: ステータス値は全て正常`);
            }
        }
    }
}

async function checkOrphanedRecords() {
    console.log('\n📋 3. 孤立レコードチェック\n');

    const checks = [
        { table: 'rules', fkField: 'category_id', refTable: 'rule_categories' },
        { table: 'faqs', fkField: 'category_id', refTable: 'faq_categories' },
        { table: 'downloads', fkField: 'category_id', refTable: 'download_categories' }
    ];

    for (const check of checks) {
        // Get all records
        const { data: records } = await client
            .from(check.table)
            .select(`id, ${check.fkField}`)
            .not(check.fkField, 'is', null);

        // Get all valid category IDs
        const { data: categories } = await client
            .from(check.refTable)
            .select('id');

        if (records && categories) {
            const validIds = new Set(categories.map(c => c.id));
            const orphaned = records.filter(r => !validIds.has(r[check.fkField]));

            if (orphaned.length > 0) {
                errors.push(`${check.table}: ${orphaned.length}件が存在しないカテゴリを参照`);
                console.log(`   ❌ ${check.table}: ${orphaned.length}件が存在しないカテゴリを参照`);
                orphaned.forEach(row =>
                    console.log(`      ID: ${row.id}, ${check.fkField}: ${row[check.fkField]}`)
                );
            } else {
                console.log(`   ✅ ${check.table}: 孤立レコードなし`);
            }
        }
    }
}

async function checkRequiredFields() {
    console.log('\n📋 4. 必須フィールドチェック\n');

    // Check plans
    const { data: plans } = await client.from('plans').select('id, name, price, size');
    let missingFields = plans?.filter(p => !p.name || !p.price || !p.size) || [];
    if (missingFields.length > 0) {
        errors.push(`plans: ${missingFields.length}件で必須フィールドが欠落`);
        console.log(`   ❌ plans: ${missingFields.length}件で必須フィールドが欠落`);
    } else {
        console.log(`   ✅ plans: 必須フィールドは全て設定済み`);
    }

    // Check rules
    const { data: rules } = await client.from('rules').select('id, title, content');
    missingFields = rules?.filter(r => !r.title || !r.content) || [];
    if (missingFields.length > 0) {
        errors.push(`rules: ${missingFields.length}件で必須フィールドが欠落`);
        console.log(`   ❌ rules: ${missingFields.length}件で必須フィールドが欠落`);
    } else {
        console.log(`   ✅ rules: 必須フィールドは全て設定済み`);
    }

    // Check faqs
    const { data: faqs } = await client.from('faqs').select('id, question, answer');
    missingFields = faqs?.filter(f => !f.question || !f.answer) || [];
    if (missingFields.length > 0) {
        errors.push(`faqs: ${missingFields.length}件で必須フィールドが欠落`);
        console.log(`   ❌ faqs: ${missingFields.length}件で必須フィールドが欠落`);
    } else {
        console.log(`   ✅ faqs: 必須フィールドは全て設定済み`);
    }
}

async function checkDataConsistency() {
    console.log('\n📋 5. データ整合性チェック\n');

    // Check for duplicate categories
    const categoryTables = ['rule_categories', 'faq_categories', 'download_categories'];

    for (const table of categoryTables) {
        const { data } = await client.from(table).select('name');

        if (data) {
            const names = data.map(c => c.name);
            const uniqueNames = new Set(names);

            if (names.length !== uniqueNames.size) {
                const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
                warnings.push(`${table}: 重複カテゴリ名 - ${[...new Set(duplicates)].join(', ')}`);
                console.log(`   ⚠️  ${table}: 重複カテゴリ名が存在`);
            } else {
                console.log(`   ✅ ${table}: カテゴリ名は全て一意`);
            }
        }
    }

    // Check for empty category names
    for (const table of categoryTables) {
        const { data } = await client
            .from(table)
            .select('id, name')
            .or('name.is.null,name.eq.');

        if (data && data.length > 0) {
            errors.push(`${table}: ${data.length}件のカテゴリ名が空`);
            console.log(`   ❌ ${table}: ${data.length}件のカテゴリ名が空`);
        } else {
            console.log(`   ✅ ${table}: カテゴリ名は全て設定済み`);
        }
    }
}

function printSummary() {
    console.log('\n========================================');
    console.log('📊 チェック結果サマリー');
    console.log('========================================\n');

    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ データベースは完全に正常です！\n');
    } else {
        if (errors.length > 0) {
            console.log(`🚨 エラー: ${errors.length}件\n`);
            errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
            console.log('');
        }

        if (warnings.length > 0) {
            console.log(`⚠️  警告: ${warnings.length}件\n`);
            warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
            console.log('');
        }
    }
}

checkDatabase().then(() => {
    process.exit(errors.length > 0 ? 1 : 0);
}).catch((error) => {
    console.error('❌ 致命的エラー:', error);
    process.exit(1);
});
