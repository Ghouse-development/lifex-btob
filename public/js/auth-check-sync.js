/**
 * 同期認証チェック - Alpine.jsより前に実行
 * 未認証の場合は即座にリダイレクト
 */
(function() {
    'use strict';

    // ログインページでは何もしない
    if (window.location.pathname.includes('admin-login')) {
        return;
    }

    console.log('🔒 同期認証チェック開始...');

    // localStorageからセッション情報を確認
    const hasSession = checkLocalStorageSession();

    if (!hasSession) {
        console.log('❌ セッションなし - 即座にリダイレクト');
        // ページ読み込みを停止してからリダイレクト（ERR_ABORTEDエラーを防ぐ）
        if (window.stop) window.stop();
        window.location.replace('/admin-login.html');
        // リダイレクト後のコードは実行されないが、念のためreturn
        return;
    }

    console.log('✅ セッション確認済み - ページ読み込み継続');

    function checkLocalStorageSession() {
        try {
            // Supabaseのセッション情報をチェック
            const authKey = Object.keys(localStorage).find(key =>
                key.startsWith('sb-') && key.includes('-auth-token')
            );

            if (!authKey) {
                return false;
            }

            const authData = localStorage.getItem(authKey);
            if (!authData) {
                return false;
            }

            const session = JSON.parse(authData);

            // アクセストークンの存在確認
            if (!session.access_token) {
                return false;
            }

            // 有効期限チェック
            if (session.expires_at) {
                const expiresAt = session.expires_at * 1000; // UNIX timestamp to ms
                if (Date.now() >= expiresAt) {
                    console.log('⚠️ セッション期限切れ');
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('❌ セッションチェックエラー:', error);
            return false;
        }
    }
})();
