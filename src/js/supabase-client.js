// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://tkemcbxqbrfqgmyswkjg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZW1jYnhxYnJmcWdteXN3a2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTIwMjUsImV4cCI6MjA3NDM2ODAyNX0.UKHU7iTO35N3MuIzJYp9VVxB7ga2YDQ5Vrzd6Gf3k-I';

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

// デフォルトエクスポート
export default supabase;