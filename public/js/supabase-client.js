// Supabase Client Configuration
// このファイルはCDN版のSupabaseを使用します（common.jsで初期化済み）

// window.supabaseをProxyでラップして、常に最新の状態を参照
export const supabase = new Proxy({}, {
    get(target, prop) {
        // window.supabaseが初期化されているか確認
        if (typeof window.supabase !== 'undefined' && window.supabase.from) {
            return window.supabase[prop];
        }

        // まだ初期化されていない場合はエラー
        throw new Error('Supabase client not initialized. Make sure common.js is loaded first.');
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
