/**
 * Authentication Guard Script
 * 認証保護スクリプト - 全ての管理ページで読み込む
 *
 * 作成日: 2025-01-21
 * 使用方法: 管理ページのHTMLの<head>セクションに以下を追加
 *
 * <script type="module" src="/js/auth-guard.js"></script>
 *
 * または、特定の権限が必要な場合:
 *
 * <script type="module">
 *   import { protectPage } from '/js/auth-guard.js';
 *   await protectPage({ requireAdmin: true });
 * </script>
 */

import * as SupabaseAuth from './supabase-auth.js';

/**
 * ページを認証で保護する
 * @param {Object} options - 保護オプション
 * @param {boolean} options.requireAdmin - 管理者権限が必要か（デフォルト: false）
 * @param {string} options.redirectUrl - 未認証時のリダイレクト先（デフォルト: /admin-login.html）
 * @returns {Promise<{user: object, profile: object}>} - 認証済みユーザー情報
 */
export async function protectPage(options = {}) {
    const {
        requireAdmin = false,
        redirectUrl = '/admin-login.html'
    } = options;

    console.log('🔒 ページ保護チェック開始...');

    try {
        const result = await SupabaseAuth.checkAuth({
            requireAdmin,
            redirectUrl
        });

        if (result.authenticated) {
            console.log('✅ 認証OK - ページ表示を許可');
            return result;
        } else {
            console.log('❌ 認証失敗 - リダイレクト');
            // checkAuth内でリダイレクト済み
            return null;
        }
    } catch (error) {
        console.error('❌ ページ保護チェックエラー:', error);
        window.location.href = redirectUrl;
        return null;
    }
}

/**
 * 現在のユーザー情報を取得（グローバル変数として提供）
 * @returns {Promise<void>}
 */
async function initializeCurrentUser() {
    try {
        const { user, profile } = await SupabaseAuth.getCurrentUser();

        if (user && profile) {
            // グローバル変数としてユーザー情報を保存
            window.currentUser = user;
            window.currentUserProfile = profile;

            console.log('✅ ユーザー情報をグローバル変数に設定:', profile.company_name);

            // ユーザー情報表示エリアを更新（存在する場合）
            updateUserDisplay(profile);
        }
    } catch (error) {
        console.error('❌ ユーザー情報初期化エラー:', error);
    }
}

/**
 * ユーザー情報表示エリアを更新
 * @param {Object} profile - ユーザープロファイル
 */
function updateUserDisplay(profile) {
    // ユーザー名表示エリアを探す
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = profile.contact_name || profile.company_name;
    }

    // 会社名表示エリアを探す
    const companyNameElement = document.getElementById('company-name');
    if (companyNameElement) {
        companyNameElement.textContent = profile.company_name;
    }

    // 会社コード表示エリアを探す
    const companyCodeElement = document.getElementById('company-code');
    if (companyCodeElement) {
        companyCodeElement.textContent = profile.company_code || '未設定';
    }

    // ロール表示エリアを探す
    const userRoleElement = document.getElementById('user-role');
    if (userRoleElement) {
        const roleText = profile.role === 'admin' ? '管理者' : '加盟店';
        userRoleElement.textContent = roleText;
    }

    // 管理者専用要素の表示/非表示
    const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
    adminOnlyElements.forEach(element => {
        if (profile.role === 'admin') {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
}

/**
 * ログアウトハンドラーを設定
 */
function setupLogoutHandler() {
    // ログアウトボタンを探す
    const logoutButtons = document.querySelectorAll('[data-logout]');

    logoutButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();

            if (confirm('ログアウトしますか？')) {
                console.log('🚪 ログアウト処理開始...');

                const result = await SupabaseAuth.signOut();

                if (result.success) {
                    console.log('✅ ログアウト成功 - ログインページへリダイレクト');
                    window.location.href = '/admin-login.html';
                } else {
                    console.error('❌ ログアウト失敗:', result.error);
                    alert('ログアウトに失敗しました');
                }
            }
        });
    });

    console.log(`✅ ログアウトハンドラーを設定 (${logoutButtons.length}個のボタン)`);
}

/**
 * 認証状態の変更を監視
 */
function monitorAuthState() {
    SupabaseAuth.onAuthStateChange((event, session) => {
        console.log('🔄 認証状態変更:', event);

        if (event === 'SIGNED_OUT') {
            console.log('🚪 サインアウト検出 - ログインページへリダイレクト');
            window.location.href = '/admin-login.html';
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 トークンリフレッシュ成功');
        } else if (event === 'USER_UPDATED') {
            console.log('👤 ユーザー情報更新');
            initializeCurrentUser();
        }
    });

    console.log('✅ 認証状態監視を開始');
}

/**
 * 管理者かどうかをチェックするヘルパー関数
 * @returns {boolean}
 */
export function isAdmin() {
    return window.currentUserProfile?.role === 'admin';
}

/**
 * 現在のユーザーの会社コードを取得
 * @returns {string|null}
 */
export function getCurrentCompanyCode() {
    return window.currentUserProfile?.company_code || null;
}

/**
 * 初期化処理
 */
async function initialize() {
    console.log('🔐 Authentication Guard 初期化開始...');

    // ログインページでは認証チェックをスキップ
    if (window.location.pathname.includes('admin-login.html')) {
        console.log('ℹ️ ログインページのため認証チェックをスキップ');
        return;
    }

    // ページを保護
    const authResult = await protectPage();

    if (authResult) {
        // ユーザー情報を初期化
        await initializeCurrentUser();

        // ログアウトハンドラーを設定
        setupLogoutHandler();

        // 認証状態を監視
        monitorAuthState();

        console.log('✅ Authentication Guard 初期化完了');
    }
}

// DOMContentLoaded時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOMが既に読み込まれている場合は即実行
    initialize();
}

// エクスポート
export default {
    protectPage,
    isAdmin,
    getCurrentCompanyCode
};
