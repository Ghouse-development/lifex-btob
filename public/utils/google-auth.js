// Google認証管理システム
class GoogleAuthManager {
    constructor() {
        this.CLIENT_ID = ''; // Google Cloud ConsoleでクライアントIDを取得して設定
        this.AUTHORIZED_ADMINS = [
            'hn@ghouse.jp',           // 西野秀樹（管理者）
            'yoneyama-m@g-house.osaka.jp'  // 米山真史（管理者）
        ];
        this.currentUser = null;
        this.isInitialized = false;
        this.updateHistory = [];
    }

    // Google認証の初期化
    async init() {
        // Google Sign-In APIのスクリプトを動的に読み込み
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.initializeGoogleSignIn();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Google Sign-Inの初期化
    initializeGoogleSignIn() {
        if (typeof google === 'undefined') {
            console.error('Google Sign-In APIの読み込みに失敗しました');
            return;
        }

        // CLIENT_IDが設定されていない場合は従来の認証を使用
        if (!this.CLIENT_ID) {
            console.log('Google認証が設定されていません。従来の認証システムを使用します。');
            return;
        }

        google.accounts.id.initialize({
            client_id: this.CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: true,
            cancel_on_tap_outside: false
        });

        this.isInitialized = true;
    }

    // Google認証レスポンスの処理
    handleCredentialResponse(response) {
        // JWTトークンをデコード
        const credential = response.credential;
        const payload = this.decodeJWT(credential);
        
        // ユーザー情報を保存
        this.currentUser = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            isAdmin: this.AUTHORIZED_ADMINS.includes(payload.email),
            token: credential,
            loginTime: new Date().toISOString()
        };

        // セッションに保存
        sessionStorage.setItem('googleUser', JSON.stringify(this.currentUser));
        
        // 更新履歴に記録
        this.addUpdateHistory('ログイン', `${this.currentUser.name} (${this.currentUser.email})`);

        // 管理者権限をチェック
        if (!this.currentUser.isAdmin) {
            this.showError('このアカウントには管理者権限がありません。');
            this.logout();
            return false;
        }

        // ログイン成功
        this.onLoginSuccess();
        return true;
    }

    // JWTトークンのデコード
    decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    }

    // ログイン成功時の処理
    onLoginSuccess() {
        if (window.location.pathname === '/admin-login.html') {
            window.location.href = '/admin.html';
        }
        
        // UIを更新
        this.updateUIForLoggedInUser();
    }

    // ログイン状態のUI更新
    updateUIForLoggedInUser() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <div class="flex items-center space-x-3">
                    <img src="${this.currentUser.picture}" alt="${this.currentUser.name}" class="w-8 h-8 rounded-full">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${this.currentUser.name}</div>
                        <div class="text-xs text-gray-500">${this.currentUser.email}</div>
                    </div>
                    <button onclick="googleAuth.logout()" class="text-sm text-red-600 hover:text-red-800">ログアウト</button>
                </div>
            `;
        }
    }

    // Google Sign-Inボタンを表示
    renderSignInButton(elementId) {
        if (!this.isInitialized) {
            console.error('Google Sign-Inが初期化されていません');
            return;
        }

        google.accounts.id.renderButton(
            document.getElementById(elementId),
            {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                locale: 'ja'
            }
        );
    }

    // プロンプトを表示
    showPrompt() {
        if (!this.isInitialized) return;
        google.accounts.id.prompt();
    }

    // ログアウト
    logout() {
        if (this.currentUser) {
            this.addUpdateHistory('ログアウト', `${this.currentUser.name} (${this.currentUser.email})`);
        }
        
        this.currentUser = null;
        sessionStorage.removeItem('googleUser');
        
        if (this.isInitialized) {
            google.accounts.id.disableAutoSelect();
        }
        
        // 従来の認証もクリア
        if (window.authManager) {
            window.authManager.logout();
        }
        
        window.location.href = '/admin-login.html';
    }

    // 現在のユーザーを取得
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = sessionStorage.getItem('googleUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return this.currentUser;
    }

    // 管理者かどうかをチェック
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.isAdmin;
    }

    // 認証が必要
    requireAuth() {
        if (!this.isAdmin()) {
            window.location.href = '/admin-login.html';
            return false;
        }
        return true;
    }

    // 管理者を追加
    addAdmin(email) {
        if (!this.isAdmin()) {
            this.showError('管理者権限が必要です');
            return false;
        }
        
        if (!this.AUTHORIZED_ADMINS.includes(email)) {
            this.AUTHORIZED_ADMINS.push(email);
            this.saveAdminList();
            this.addUpdateHistory('管理者追加', `${email} を管理者に追加`);
            return true;
        }
        return false;
    }

    // 管理者を削除
    removeAdmin(email) {
        if (!this.isAdmin()) {
            this.showError('管理者権限が必要です');
            return false;
        }
        
        // 最後の管理者は削除できない
        if (this.AUTHORIZED_ADMINS.length <= 1) {
            this.showError('最後の管理者は削除できません');
            return false;
        }
        
        const index = this.AUTHORIZED_ADMINS.indexOf(email);
        if (index > -1) {
            this.AUTHORIZED_ADMINS.splice(index, 1);
            this.saveAdminList();
            this.addUpdateHistory('管理者削除', `${email} を管理者から削除`);
            return true;
        }
        return false;
    }

    // 管理者リストを保存（実際のAPIエンドポイントに接続する必要があります）
    saveAdminList() {
        // LocalStorageに一時保存（本番環境ではサーバーに保存）
        localStorage.setItem('authorizedAdmins', JSON.stringify(this.AUTHORIZED_ADMINS));
    }

    // 管理者リストを読み込み
    loadAdminList() {
        const saved = localStorage.getItem('authorizedAdmins');
        if (saved) {
            this.AUTHORIZED_ADMINS = JSON.parse(saved);
        }
    }

    // 更新履歴を追加
    addUpdateHistory(action, details) {
        const history = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            user: this.currentUser ? this.currentUser.email : 'システム'
        };
        
        this.updateHistory.push(history);
        
        // LocalStorageに保存（最大100件）
        const allHistory = this.getUpdateHistory();
        allHistory.unshift(history);
        if (allHistory.length > 100) {
            allHistory.pop();
        }
        localStorage.setItem('updateHistory', JSON.stringify(allHistory));
    }

    // 更新履歴を取得
    getUpdateHistory() {
        const saved = localStorage.getItem('updateHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // エラーメッセージを表示
    showError(message) {
        if (window.lifeXAPI && window.lifeXAPI.showToast) {
            window.lifeXAPI.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // 成功メッセージを表示
    showSuccess(message) {
        if (window.lifeXAPI && window.lifeXAPI.showToast) {
            window.lifeXAPI.showToast(message, 'success');
        } else {
            console.log(message);
        }
    }
}

// グローバルインスタンスを作成
window.googleAuth = new GoogleAuthManager();

// 既存のauthManagerとの互換性を保つ
window.authManager = {
    isAuthenticated: () => {
        // Google認証が有効な場合はそちらを使用
        if (window.googleAuth.isInitialized) {
            return window.googleAuth.isAdmin();
        }
        // 従来の認証システムにフォールバック
        const session = sessionStorage.getItem('adminAuthenticated');
        return session === 'true';
    },
    
    requireAuth: () => {
        if (window.googleAuth.isInitialized) {
            return window.googleAuth.requireAuth();
        }
        // 従来の認証チェック
        if (!window.authManager.isAuthenticated()) {
            window.location.href = '/admin-login.html';
            return false;
        }
        return true;
    },
    
    login: (password) => {
        // 従来のパスワード認証（Google認証が設定されていない場合のフォールバック）
        const adminPassword = localStorage.getItem('adminPassword') || 'admin123';
        if (password === adminPassword) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            window.googleAuth.addUpdateHistory('ログイン', 'パスワード認証でログイン');
            return true;
        }
        return false;
    },
    
    logout: () => {
        sessionStorage.removeItem('adminAuthenticated');
        if (window.googleAuth.isInitialized) {
            window.googleAuth.logout();
        } else {
            window.location.href = '/admin-login.html';
        }
    },
    
    changePassword: (oldPassword, newPassword) => {
        const currentPassword = localStorage.getItem('adminPassword') || 'admin123';
        if (oldPassword === currentPassword) {
            localStorage.setItem('adminPassword', newPassword);
            window.googleAuth.addUpdateHistory('パスワード変更', 'ログインパスワードを変更');
            return true;
        }
        return false;
    }
};