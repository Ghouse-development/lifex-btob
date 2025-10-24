// Supabase Client Configuration (Browser Version)
// CDN版のSupabaseを使用（ブラウザ環境用）

// Supabase接続情報（環境変数から取得、フォールバックあり）
const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

// 環境変数が設定されていない場合は警告を表示（フォールバック値を使用）
if (!import.meta?.env?.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY が環境変数に設定されていません。フォールバック値を使用しています。');
    console.warn('   本番環境では Vercel の Environment Variables で設定してください。');
}

// Supabase CDNが読み込まれるまで待機する関数
async function waitForSupabaseCDN() {
    // 既に読み込まれている場合は即座に返す
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        console.log('✅ Supabase CDN already loaded');
        return window.supabase.createClient;
    }

    console.log('⏳ Waiting for Supabase CDN to load...');

    return new Promise((resolve, reject) => {
        let checkCount = 0;
        const maxChecks = 300; // 15秒間待機 (50ms * 300)
        const checkInterval = 50; // 50ms毎にチェック

        const interval = setInterval(() => {
            checkCount++;

            // CDNが読み込まれたかチェック
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                clearInterval(interval);
                console.log(`✅ Supabase CDN loaded after ${checkCount * checkInterval}ms`);
                resolve(window.supabase.createClient);
                return;
            }

            // タイムアウト
            if (checkCount >= maxChecks) {
                clearInterval(interval);
                const errorMsg = 'Supabase CDN failed to load within 15 seconds. Please check:\n' +
                                '1. Network connection\n' +
                                '2. CDN availability\n' +
                                '3. Browser console for errors\n' +
                                '4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)';
                console.error('❌ ' + errorMsg);
                reject(new Error('Supabase CDN load timeout'));
            }
        }, checkInterval);
    });
}

// CDNの読み込みを待機してクライアントを作成
let createClient;
try {
    createClient = await waitForSupabaseCDN();
} catch (error) {
    console.error('❌ Failed to load Supabase CDN:', error);
    throw error;
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

console.log('✅ Supabase client initialized successfully');

// 認証状態の管理
export const auth = {
    // 現在のユーザー取得
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // ログイン
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // ログアウト
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // セッション取得
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // 認証状態の監視
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

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

// Realtime購読管理
export const realtime = {
    // プランテーブルの変更を購読
    subscribePlans(callback) {
        const channel = supabase
            .channel('plans-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE全て
                    schema: 'public',
                    table: 'plans'
                },
                (payload) => {
                    console.log('Plans change detected:', payload);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return channel;
    },

    // 購読解除
    unsubscribe(channel) {
        if (channel) {
            supabase.removeChannel(channel);
        }
    }
};

// デフォルトエクスポート
export default supabase;
