/**
 * Supabase Auth Helper Module
 * 認証機能のヘルパー関数
 *
 * 作成日: 2025-01-21
 * 目的: Supabase Authを使用したセキュアな認証機能の提供
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabaseクライアントの初期化
// ブラウザ環境で直接使用するため、値を直接指定
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTU0NDAsImV4cCI6MjA1MjE3MTQ0MH0.Lbk3uC6YI99rn5j1oXGd8gNE3C8OxJVMymUKG_x_puw';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ログイン処理
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @returns {Promise<{success: boolean, user?: object, profile?: object, error?: string}>}
 */
export async function signIn(email, password) {
    try {
        console.log('🔐 ログイン試行:', email);

        // 1. Supabase Authで認証
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('❌ 認証エラー:', authError);

            // ログイン失敗を記録
            await recordLoginHistory(null, 'failed', authError.message);

            return {
                success: false,
                error: getErrorMessage(authError)
            };
        }

        console.log('✅ 認証成功:', authData.user.id);

        // 2. ユーザープロファイルを取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('❌ プロファイル取得エラー:', profileError);
            return {
                success: false,
                error: 'ユーザープロファイルが見つかりません'
            };
        }

        // 3. ステータスチェック
        if (profile.status !== 'active') {
            console.warn('⚠️ アカウントが無効:', profile.status);

            await recordLoginHistory(authData.user.id, 'failed', `Account status: ${profile.status}`);

            return {
                success: false,
                error: `アカウントが無効です（${profile.status}）。管理者にお問い合わせください。`
            };
        }

        console.log('✅ ユーザープロファイル取得成功:', profile.company_name);

        // 4. 最終ログイン時刻を更新
        await updateLastLogin(authData.user.id);

        // 5. ログイン履歴を記録
        await recordLoginHistory(authData.user.id, 'success');

        console.log('✅ ログイン完了');

        return {
            success: true,
            user: authData.user,
            profile: profile
        };

    } catch (error) {
        console.error('❌ ログイン処理エラー:', error);
        return {
            success: false,
            error: '予期しないエラーが発生しました'
        };
    }
}

/**
 * ログアウト処理
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signOut() {
    try {
        console.log('🚪 ログアウト処理開始');

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('❌ ログアウトエラー:', error);
            return {
                success: false,
                error: 'ログアウトに失敗しました'
            };
        }

        console.log('✅ ログアウト成功');

        return { success: true };

    } catch (error) {
        console.error('❌ ログアウト処理エラー:', error);
        return {
            success: false,
            error: '予期しないエラーが発生しました'
        };
    }
}

/**
 * 現在のユーザー情報を取得
 * @returns {Promise<{user: object|null, profile: object|null}>}
 */
export async function getCurrentUser() {
    try {
        // 1. Supabase Authからセッション取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.log('ℹ️ セッションなし');
            return { user: null, profile: null };
        }

        // 2. ユーザープロファイルを取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('❌ プロファイル取得エラー:', profileError);
            return { user: session.user, profile: null };
        }

        return {
            user: session.user,
            profile: profile
        };

    } catch (error) {
        console.error('❌ ユーザー情報取得エラー:', error);
        return { user: null, profile: null };
    }
}

/**
 * 認証状態をチェック（ページ保護用）
 * @param {Object} options - オプション
 * @param {boolean} options.requireAdmin - 管理者権限が必要か
 * @param {string} options.redirectUrl - 未認証時のリダイレクト先（デフォルト: /admin-login.html）
 * @returns {Promise<{authenticated: boolean, user?: object, profile?: object}>}
 */
export async function checkAuth(options = {}) {
    const {
        requireAdmin = false,
        redirectUrl = '/admin-login.html'
    } = options;

    try {
        const { user, profile } = await getCurrentUser();

        // 未認証の場合
        if (!user || !profile) {
            console.warn('⚠️ 未認証ユーザー - リダイレクト:', redirectUrl);
            if (typeof window !== 'undefined') {
                window.location.href = redirectUrl;
            }
            return { authenticated: false };
        }

        // ステータスチェック
        if (profile.status !== 'active') {
            console.warn('⚠️ アカウントが無効:', profile.status);
            if (typeof window !== 'undefined') {
                alert(`アカウントが無効です（${profile.status}）。管理者にお問い合わせください。`);
                window.location.href = redirectUrl;
            }
            return { authenticated: false };
        }

        // 管理者権限チェック
        if (requireAdmin && profile.role !== 'admin') {
            console.warn('⚠️ 管理者権限が必要です');
            if (typeof window !== 'undefined') {
                alert('この機能にアクセスする権限がありません。');
                window.location.href = '/admin-dashboard.html';
            }
            return { authenticated: false };
        }

        console.log('✅ 認証OK:', profile.company_name);

        return {
            authenticated: true,
            user,
            profile
        };

    } catch (error) {
        console.error('❌ 認証チェックエラー:', error);
        if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
        return { authenticated: false };
    }
}

/**
 * 最終ログイン時刻を更新
 * @param {string} userId - ユーザーID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            console.error('❌ 最終ログイン時刻更新エラー:', error);
        } else {
            console.log('✅ 最終ログイン時刻更新成功');
        }
    } catch (error) {
        console.error('❌ 最終ログイン時刻更新処理エラー:', error);
    }
}

/**
 * ログイン履歴を記録
 * @param {string|null} userId - ユーザーID（失敗時はnull）
 * @param {string} status - 'success' | 'failed'
 * @param {string} failureReason - 失敗理由（オプション）
 * @returns {Promise<void>}
 */
async function recordLoginHistory(userId, status, failureReason = null) {
    try {
        const loginRecord = {
            user_id: userId,
            login_at: new Date().toISOString(),
            ip_address: null, // フロントエンドでは取得困難
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            status: status,
            failure_reason: failureReason
        };

        const { error } = await supabase
            .from('login_history')
            .insert([loginRecord]);

        if (error) {
            console.error('❌ ログイン履歴記録エラー:', error);
        } else {
            console.log('✅ ログイン履歴記録成功');
        }
    } catch (error) {
        console.error('❌ ログイン履歴記録処理エラー:', error);
    }
}

/**
 * パスワードリセットメール送信
 * @param {string} email - メールアドレス
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendPasswordResetEmail(email) {
    try {
        console.log('📧 パスワードリセットメール送信:', email);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin-reset-password.html`
        });

        if (error) {
            console.error('❌ パスワードリセットメール送信エラー:', error);
            return {
                success: false,
                error: getErrorMessage(error)
            };
        }

        console.log('✅ パスワードリセットメール送信成功');

        return { success: true };

    } catch (error) {
        console.error('❌ パスワードリセットメール送信処理エラー:', error);
        return {
            success: false,
            error: '予期しないエラーが発生しました'
        };
    }
}

/**
 * パスワード更新
 * @param {string} newPassword - 新しいパスワード
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePassword(newPassword) {
    try {
        console.log('🔑 パスワード更新処理開始');

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('❌ パスワード更新エラー:', error);
            return {
                success: false,
                error: getErrorMessage(error)
            };
        }

        console.log('✅ パスワード更新成功');

        return { success: true };

    } catch (error) {
        console.error('❌ パスワード更新処理エラー:', error);
        return {
            success: false,
            error: '予期しないエラーが発生しました'
        };
    }
}

/**
 * セッション状態変更を監視
 * @param {Function} callback - 状態変更時のコールバック関数
 * @returns {Object} - 購読オブジェクト（unsubscribeメソッドあり）
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 認証状態変更:', event);
        callback(event, session);
    });
}

/**
 * エラーメッセージを日本語に変換
 * @param {Object} error - Supabaseエラーオブジェクト
 * @returns {string} - 日本語エラーメッセージ
 */
function getErrorMessage(error) {
    const errorMessages = {
        'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
        'Email not confirmed': 'メールアドレスが確認されていません',
        'User not found': 'ユーザーが見つかりません',
        'Invalid email': '無効なメールアドレスです',
        'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
        'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
        'Email rate limit exceeded': 'メール送信の上限に達しました。しばらく待ってから再度お試しください',
        'Network request failed': 'ネットワークエラーが発生しました。インターネット接続を確認してください'
    };

    return errorMessages[error.message] || error.message || '予期しないエラーが発生しました';
}

/**
 * 管理者かどうかをチェック
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
    try {
        const { profile } = await getCurrentUser();
        return profile?.role === 'admin';
    } catch (error) {
        console.error('❌ 管理者チェックエラー:', error);
        return false;
    }
}

/**
 * 現在のユーザーの会社コードを取得
 * @returns {Promise<string|null>}
 */
export async function getCurrentCompanyCode() {
    try {
        const { profile } = await getCurrentUser();
        return profile?.company_code || null;
    } catch (error) {
        console.error('❌ 会社コード取得エラー:', error);
        return null;
    }
}

// Supabaseクライアントをエクスポート（他のモジュールで使用する場合）
export { supabase };

// デフォルトエクスポート
export default {
    signIn,
    signOut,
    getCurrentUser,
    checkAuth,
    sendPasswordResetEmail,
    updatePassword,
    onAuthStateChange,
    isAdmin,
    getCurrentCompanyCode,
    supabase
};
