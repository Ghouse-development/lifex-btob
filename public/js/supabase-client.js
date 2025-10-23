// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

// Supabase接続情報（環境変数から取得、フォールバックあり）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

// 環境変数が設定されていない場合は警告を表示（フォールバック値を使用）
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY が環境変数に設定されていません。フォールバック値を使用しています。');
    console.warn('   本番環境では Vercel の Environment Variables で設定してください。');
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