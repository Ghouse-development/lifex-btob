// Supabase Integration Helper
// このファイルは既存のHTMLファイルから使用できるグローバル関数を提供

// Supabase APIをグローバルに公開
window.supabaseAPI = {
    // プラン関連
    plans: {
        // 全プラン取得
        async getAll() {
            const module = await import('./supabase-api.js');
            return module.plansAPI.getAllPlans();
        },

        // プラン検索
        async search(filters) {
            const module = await import('./supabase-api.js');
            return module.plansAPI.searchPlans(filters);
        },

        // 単一プラン取得
        async getById(planId) {
            const module = await import('./supabase-api.js');
            return module.plansAPI.getPlanById(planId);
        },

        // プラン作成
        async create(planData) {
            const module = await import('./supabase-api.js');
            return module.plansAPI.createPlan(planData);
        },

        // プラン更新
        async update(planId, updates) {
            const module = await import('./supabase-api.js');
            return module.plansAPI.updatePlan(planId, updates);
        },

        // 画像アップロード
        async uploadImage(planId, file, type) {
            const module = await import('./supabase-api.js');
            return module.plansAPI.uploadPlanImage(planId, file, type);
        }
    },

    // 間取マトリックス関連
    matrix: {
        // 設定取得
        async getSettings() {
            const module = await import('./supabase-api.js');
            return module.matrixAPI.getMatrixSettings();
        },

        // セル取得
        async getCells() {
            const module = await import('./supabase-api.js');
            return module.matrixAPI.getMatrixCells();
        },

        // セル更新
        async updateCell(cellId, planId) {
            const module = await import('./supabase-api.js');
            return module.matrixAPI.updateMatrixCell(cellId, planId);
        }
    },

    // デザインカテゴリ関連
    design: {
        // カテゴリ取得
        async getCategories(type = null) {
            const module = await import('./supabase-api.js');
            return module.designAPI.getDesignCategories(type);
        },

        // カテゴリ別プラン取得
        async getPlansByCategory(categoryId) {
            const module = await import('./supabase-api.js');
            return module.designAPI.getPlansByDesignCategory(categoryId);
        }
    },

    // ルール関連
    rules: {
        // カテゴリ取得
        async getCategories() {
            const module = await import('./supabase-api.js');
            return module.rulesAPI.getRuleCategories();
        },

        // ルール検索
        async search(keyword) {
            const module = await import('./supabase-api.js');
            return module.rulesAPI.searchRules(keyword);
        },

        // ルール作成
        async create(ruleData) {
            const module = await import('./supabase-api.js');
            return module.rulesAPI.createRule(ruleData);
        },

        // ルール更新
        async update(ruleId, updates) {
            const module = await import('./supabase-api.js');
            return module.rulesAPI.updateRule(ruleId, updates);
        }
    },

    // ダウンロード関連
    downloads: {
        // 資料取得
        async getItems(categoryId = null) {
            const module = await import('./supabase-api.js');
            return module.downloadsAPI.getDownloads(categoryId);
        },

        // カテゴリ取得
        async getCategories() {
            const module = await import('./supabase-api.js');
            return module.downloadsAPI.getDownloadCategories();
        },

        // ダウンロード記録
        async recordDownload(downloadId, userId = null) {
            const module = await import('./supabase-api.js');
            return module.downloadsAPI.recordDownload(downloadId, userId);
        },

        // ファイルアップロード
        async uploadFile(file, category) {
            const module = await import('./supabase-api.js');
            return module.downloadsAPI.uploadFile(file, category);
        }
    },

    // FAQ関連
    faq: {
        // FAQ取得
        async getItems(categoryId = null) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.getFAQs(categoryId);
        },

        // カテゴリ取得
        async getCategories() {
            const module = await import('./supabase-api.js');
            return module.faqAPI.getFAQCategories();
        },

        // FAQ検索
        async search(keyword) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.searchFAQs(keyword);
        },

        // FAQ作成
        async create(faqData) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.create(faqData);
        },

        // FAQ更新
        async update(faqId, updates) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.update(faqId, updates);
        },

        // FAQ削除
        async delete(faqId) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.delete(faqId);
        },

        // フィードバック送信
        async submitFeedback(faqId, isHelpful, comment = null) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.submitFeedback(faqId, isHelpful, comment);
        },

        // 閲覧数インクリメント
        async incrementViewCount(faqId) {
            const module = await import('./supabase-api.js');
            return module.faqAPI.incrementViewCount(faqId);
        }
    },

    // ユーザー関連
    users: {
        // プロフィール取得
        async getProfile(userId) {
            const module = await import('./supabase-api.js');
            return module.usersAPI.getUserProfile(userId);
        },

        // プロフィール更新
        async updateProfile(userId, updates) {
            const module = await import('./supabase-api.js');
            return module.usersAPI.updateUserProfile(userId, updates);
        },

        // アクティビティログ
        async logActivity(action, targetType = null, targetId = null, details = {}) {
            const module = await import('./supabase-api.js');
            return module.usersAPI.logActivity(action, targetType, targetId, details);
        }
    },

    // システム設定
    system: {
        // 設定取得
        async getSettings(key = null) {
            const module = await import('./supabase-api.js');
            return module.systemAPI.getSettings(key);
        },

        // 設定更新
        async updateSetting(key, value) {
            const module = await import('./supabase-api.js');
            return module.systemAPI.updateSetting(key, value);
        }
    },

    // 認証関連
    auth: {
        // 現在のユーザー取得
        async getCurrentUser() {
            const module = await import('./supabase-client.js');
            return module.auth.getCurrentUser();
        },

        // ログイン
        async signIn(email, password) {
            const module = await import('./supabase-client.js');
            return module.auth.signIn(email, password);
        },

        // ログアウト
        async signOut() {
            const module = await import('./supabase-client.js');
            return module.auth.signOut();
        },

        // セッション取得
        async getSession() {
            const module = await import('./supabase-client.js');
            return module.auth.getSession();
        },

        // 認証状態の監視
        onAuthStateChange(callback) {
            import('./supabase-client.js').then(module => {
                module.auth.onAuthStateChange(callback);
            });
        }
    }
};

// localStorageとSupabaseのブリッジ関数
window.supabaseBridge = {
    // Supabase使用フラグ（デフォルトをtrueに変更）
    useSupabase: true,

    // 設定を切り替え
    toggleDataSource(useSupabase) {
        this.useSupabase = useSupabase;
        localStorage.setItem('useSupabase', useSupabase ? 'true' : 'false');
    },

    // 初期化
    init() {
        // LocalStorageに設定がない場合はデフォルトでtrue
        const stored = localStorage.getItem('useSupabase');
        this.useSupabase = stored === null ? true : stored === 'true';
    },

    // プランデータ取得（localStorageまたはSupabase）
    async getPlans() {
        if (this.useSupabase) {
            return await window.supabaseAPI.plans.getAll();
        } else {
            // 既存のlocalStorage処理
            const data = localStorage.getItem('plansData');
            return data ? JSON.parse(data).plans : [];
        }
    },

    // プランデータ保存
    async savePlan(planData) {
        if (this.useSupabase) {
            return await window.supabaseAPI.plans.create(planData);
        } else {
            // 既存のlocalStorage処理
            const data = JSON.parse(localStorage.getItem('plansData') || '{"plans":[]}');
            data.plans.push(planData);
            localStorage.setItem('plansData', JSON.stringify(data));
            return { success: true, data: planData };
        }
    },

    // プラン更新
    async updatePlan(planId, updates) {
        if (this.useSupabase) {
            return await window.supabaseAPI.plans.update(planId, updates);
        } else {
            // 既存のlocalStorage処理
            const data = JSON.parse(localStorage.getItem('plansData') || '{"plans":[]}');
            const index = data.plans.findIndex(p => p.id === planId);
            if (index !== -1) {
                data.plans[index] = { ...data.plans[index], ...updates };
                localStorage.setItem('plansData', JSON.stringify(data));
                return { success: true, data: data.plans[index] };
            }
            return { success: false, error: 'Plan not found' };
        }
    },

    // ルールデータ取得
    async getRules() {
        if (this.useSupabase) {
            return await window.supabaseAPI.rules.getCategories();
        } else {
            // 既存のlocalStorage処理
            const data = localStorage.getItem('rules_categories_data');
            return data ? JSON.parse(data).categories : [];
        }
    },

    // FAQデータ取得
    async getFAQs() {
        if (this.useSupabase) {
            return await window.supabaseAPI.faq.getItems();
        } else {
            // 既存のlocalStorage処理
            const data = localStorage.getItem('faqData');
            return data ? JSON.parse(data).faqs : [];
        }
    },

    // ダウンロードデータ取得
    async getDownloads() {
        if (this.useSupabase) {
            return await window.supabaseAPI.downloads.getItems();
        } else {
            // 既存のlocalStorage処理
            const data = localStorage.getItem('downloadsData');
            return data ? JSON.parse(data).items : [];
        }
    }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.supabaseBridge.init();

    // デバッグ用：コンソールにAPI使用状況を表示
    console.log('Supabase Integration loaded');
    console.log('Using Supabase:', window.supabaseBridge.useSupabase);
});

// エクスポート
export const supabaseAPI = window.supabaseAPI;
export const supabaseBridge = window.supabaseBridge;