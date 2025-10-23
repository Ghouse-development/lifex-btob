// Supabase Client Configuration
// このファイルは src/js/supabase-client.js と同じ内容です

// CDN版のSupabaseを使用
let supabaseClient = null;
let isInitialized = false;

// Supabaseクライアントの初期化
async function initializeClient() {
    if (isInitialized) return supabaseClient;

    const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

    // CDNが読み込まれるまで待機
    let retries = 0;
    while (typeof window.supabase === 'undefined' && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase CDN not loaded');
    }

    const { createClient } = window.supabase;
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: { 'x-application-name': 'LIFE-X' }
        }
    });

    isInitialized = true;
    console.log('✅ Supabase client initialized');
    return supabaseClient;
}

// クライアントを取得（初期化されていなければ初期化）
async function getClient() {
    if (!isInitialized) {
        await initializeClient();
    }
    return supabaseClient;
}

// デフォルトエクスポート（Promiseでラップ）
export const supabase = new Proxy({}, {
    get(target, prop) {
        return async function(...args) {
            const client = await getClient();
            return client[prop](...args);
        };
    },
    has(target, prop) {
        return true;
    }
});

// エラーハンドリング
export function handleError(error) {
    console.error('Supabase Error:', error);

    if (error.code === 'PGRST301') {
        return 'データが見つかりません';
    } else if (error.code === '23505') {
        return 'データが重複しています';
    } else if (error.code === '23503') {
        return '関連データが存在しません';
    } else if (error.code === '42501') {
        return 'アクセス権限がありません';
    } else if (error.message) {
        return error.message;
    }

    return '予期しないエラーが発生しました';
}

// 認証状態の管理
export const auth = {
    async getCurrentUser() {
        const client = await getClient();
        const { data: { user } } = await client.auth.getUser();
        return user;
    },

    async signIn(email, password) {
        const client = await getClient();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    async signOut() {
        const client = await getClient();
        const { error } = await client.auth.signOut();
        return { error };
    },

    async getSession() {
        const client = await getClient();
        const { data: { session } } = await client.auth.getSession();
        return session;
    },

    onAuthStateChange(callback) {
        getClient().then(client => {
            return client.auth.onAuthStateChange(callback);
        });
    }
};

export default supabase;
