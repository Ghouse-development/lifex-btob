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

// CDN版のSupabaseからcreateClientを取得（読み込みを待機）
let createClient = window.supabase?.createClient;

if (!createClient) {
    console.log('⏳ Supabase CDN読み込み待機中...');

    // CDNが読み込まれるまで待機（最大15秒）
    await new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 300; // 15秒 (50ms * 300)

        const checkInterval = setInterval(() => {
            checkCount++;

            if (window.supabase?.createClient) {
                clearInterval(checkInterval);
                createClient = window.supabase.createClient;
                console.log('✅ Supabase CDN読み込み完了');
                resolve();
            } else if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.error('❌ Supabase CDN が15秒以内に読み込まれませんでした');
                console.error('   ページをリロードしてください (Ctrl+F5 または Cmd+Shift+R)');
                resolve(); // エラーでも続行
            }
        }, 50);
    });
}

if (!createClient) {
    console.error('❌ Supabase CDN が利用できません');
    console.error('   HTMLに以下のスクリプトが含まれているか確認してください:');
    console.error('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    throw new Error('Supabase CDN not loaded. Please reload the page with Ctrl+F5 (or Cmd+Shift+R)');
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
