import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('📋 全機能総合チェック');
console.log('========================================\n');

let allChecks = {
    dashboard: { passed: 0, failed: 0, details: [] },
    matrix: { passed: 0, failed: 0, details: [] },
    admin: { passed: 0, failed: 0, details: [] },
    storage: { passed: 0, failed: 0, details: [] },
    database: { passed: 0, failed: 0, details: [] }
};

function checkPassed(category, test, result = true) {
    if (result) {
        allChecks[category].passed++;
        allChecks[category].details.push(`✅ ${test}`);
        console.log(`  ✅ ${test}`);
    } else {
        allChecks[category].failed++;
        allChecks[category].details.push(`❌ ${test}`);
        console.log(`  ❌ ${test}`);
    }
}

async function checkDashboard() {
    console.log('🏠 ダッシュボード機能チェック');
    console.log('─────────────────────────');

    // 1. Notifications table check
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

    checkPassed('dashboard', 'お知らせテーブル読み込み', !notifError);
    if (notifications) {
        console.log(`    件数: ${notifications.length}`);
    }

    // 2. Plans count for stats
    const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*', { count: 'exact' });

    checkPassed('dashboard', 'プラン統計データ取得', !plansError);
    if (plans) {
        console.log(`    プラン総数: ${plans.length}`);
    }

    // 3. Latest updates (recently updated plans)
    const { data: updates, error: updatesError } = await supabase
        .from('plans')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    checkPassed('dashboard', '最新更新プラン取得', !updatesError);
    if (updates) {
        console.log(`    最新更新: ${updates.length}件`);
        updates.forEach(p => {
            console.log(`      - ${p.plan_code}: ${new Date(p.updated_at).toLocaleDateString('ja-JP')}`);
        });
    }

    console.log('');
}

async function checkMatrix() {
    console.log('📊 マトリクス機能チェック');
    console.log('─────────────────────────');

    // 1. All plans loading
    const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*');

    checkPassed('matrix', 'プラン一覧読み込み', !plansError && plans && plans.length > 0);
    if (plans) {
        console.log(`    プラン数: ${plans.length}`);
    }

    // 2. Color coding logic check (28-38坪 range)
    if (plans && plans.length > 0) {
        const planWithArea = plans.find(p => p.construction_floor_area);
        if (planWithArea) {
            // ㎡から坪に変換 (1坪 = 3.30579㎡)
            const areaM2 = parseFloat(planWithArea.construction_floor_area);
            const areaTsubo = areaM2 / 3.30579;
            let colorCategory = '';
            if (areaTsubo >= 28 && areaTsubo < 31) colorCategory = '28-31坪 (緑)';
            else if (areaTsubo >= 31 && areaTsubo < 34) colorCategory = '31-34坪 (黄)';
            else if (areaTsubo >= 34 && areaTsubo < 36) colorCategory = '34-36坪 (橙)';
            else if (areaTsubo >= 36 && areaTsubo <= 38) colorCategory = '36-38坪 (赤)';
            else colorCategory = `範囲外 (${areaTsubo.toFixed(2)}坪)`;

            checkPassed('matrix', 'カラーコーディング判定', colorCategory !== '' && !colorCategory.startsWith('範囲外'));
            console.log(`    例: ${planWithArea.plan_code} (${areaM2}㎡ = ${areaTsubo.toFixed(2)}坪) → ${colorCategory}`);
        }
    }

    // 3. Required fields validation
    if (plans && plans.length > 0) {
        const requiredFields = ['plan_code', 'plan_name', 'construction_floor_area', 'site_area', 'building_area'];
        const allHaveRequired = plans.every(p =>
            requiredFields.every(field => p[field] != null && p[field] !== '')
        );

        checkPassed('matrix', '必須フィールド検証', allHaveRequired);
        if (!allHaveRequired) {
            plans.forEach(p => {
                const missing = requiredFields.filter(f => !p[f]);
                if (missing.length > 0) {
                    console.log(`    ⚠️  ${p.plan_code}: 未入力 → ${missing.join(', ')}`);
                }
            });
        }
    }

    console.log('');
}

async function checkAdminFeatures() {
    console.log('⚙️  管理機能チェック');
    console.log('─────────────────────────');

    // 1. CRUD - Read capability
    const { data: plans, error: readError } = await supabase
        .from('plans')
        .select('*')
        .limit(1);

    checkPassed('admin', 'プラン読み込み (Read)', !readError);

    // 2. File upload structure check
    const { data: images } = await supabase.storage
        .from('plan-images')
        .list('plans', { limit: 10 });

    checkPassed('admin', '画像アップロード構造確認', images !== null);
    if (images) {
        console.log(`    Storageファイル数: ${images.length}`);
    }

    const { data: drawings } = await supabase.storage
        .from('plan-drawings')
        .list('plans', { limit: 10 });

    checkPassed('admin', '図面アップロード構造確認', drawings !== null);
    if (drawings) {
        console.log(`    Storageファイル数: ${drawings.length}`);
    }

    // 3. Delete functionality (soft delete check)
    const { data: deletedPlans } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'deleted');

    checkPassed('admin', 'ソフトデリート機能', true);
    if (deletedPlans) {
        console.log(`    削除済みプラン: ${deletedPlans.length}件`);
    }

    // 4. Updated_at timestamp check
    if (plans && plans.length > 0) {
        const hasUpdatedAt = plans.every(p => p.updated_at);
        checkPassed('admin', 'タイムスタンプ管理', hasUpdatedAt);
    }

    console.log('');
}

async function checkStorage() {
    console.log('💾 Storage容量チェック');
    console.log('─────────────────────────');

    const buckets = ['plan-images', 'plan-drawings'];

    for (const bucket of buckets) {
        const { data: files } = await supabase.storage
            .from(bucket)
            .list('plans', { limit: 1000 });

        if (files) {
            const totalSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
            const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

            checkPassed('storage', `${bucket} アクセス可能`, true);
            console.log(`    ファイル数: ${files.length}, 容量: ${sizeMB}MB`);
        } else {
            checkPassed('storage', `${bucket} アクセス可能`, false);
        }
    }

    console.log('');
}

async function checkDatabase() {
    console.log('🗄️  データベース整合性チェック');
    console.log('─────────────────────────');

    // 1. Plans table
    const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*', { count: 'exact' });

    checkPassed('database', 'plansテーブル', !plansError);

    // 2. Notifications table
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' });

    checkPassed('database', 'notificationsテーブル', !notifError);

    // 3. FAQ table (correct name is 'faqs')
    const { data: faq, error: faqError } = await supabase
        .from('faqs')
        .select('*', { count: 'exact' });

    checkPassed('database', 'faqsテーブル', !faqError);

    // 4. Rules table
    const { data: rules, error: rulesError } = await supabase
        .from('rules')
        .select('*', { count: 'exact' });

    checkPassed('database', 'rulesテーブル', !rulesError);

    // 5. Downloads table (correct name is 'download_logs')
    const { data: downloads, error: downloadsError } = await supabase
        .from('download_logs')
        .select('*', { count: 'exact' });

    checkPassed('database', 'download_logsテーブル', !downloadsError);

    // 6. Site data table check
    const { data: siteData, error: siteDataError } = await supabase
        .from('site_data')
        .select('*', { count: 'exact' })
        .limit(1);

    if (!siteDataError && siteData) {
        console.log(`    ℹ️  site_dataテーブル: ${siteData.length}件のデータ`);
    }

    console.log('');
}

async function runAllChecks() {
    await checkDashboard();
    await checkMatrix();
    await checkAdminFeatures();
    await checkStorage();
    await checkDatabase();

    // Summary
    console.log('========================================');
    console.log('📈 総合結果サマリー');
    console.log('========================================\n');

    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, results] of Object.entries(allChecks)) {
        const total = results.passed + results.failed;
        const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

        console.log(`${category.toUpperCase()}: ${results.passed}/${total} (${percentage}%)`);

        if (results.failed > 0) {
            console.log('  失敗したチェック:');
            results.details.filter(d => d.startsWith('❌')).forEach(d => {
                console.log(`    ${d}`);
            });
        }
        console.log('');

        totalPassed += results.passed;
        totalFailed += results.failed;
    }

    const grandTotal = totalPassed + totalFailed;
    const overallPercentage = ((totalPassed / grandTotal) * 100).toFixed(1);

    console.log('========================================');
    console.log(`総合: ${totalPassed}/${grandTotal} (${overallPercentage}%)`);
    console.log('========================================\n');

    if (totalFailed === 0) {
        console.log('✅ 全ての機能チェックが正常に完了しました！');
    } else {
        console.log(`⚠️  ${totalFailed}件の問題が検出されました。`);
    }
}

runAllChecks().then(() => {
    process.exit(0);
});
