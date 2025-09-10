// 管理者認証システム
class AuthManager {
  constructor() {
    // デフォルトパスワード（本番環境では環境変数を使用すべき）
    this.DEFAULT_PASSWORD = 'admin123';
    this.SESSION_KEY = 'lifex_admin_session';
    this.PASSWORD_KEY = 'lifex_admin_password';
    this.SESSION_DURATION = 30 * 60 * 1000; // 30分
  }

  // パスワードの取得（保存されていない場合はデフォルト）
  getStoredPassword() {
    const stored = localStorage.getItem(this.PASSWORD_KEY);
    return stored || this.DEFAULT_PASSWORD;
  }

  // パスワードの変更
  changePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('パスワードは6文字以上である必要があります');
    }
    localStorage.setItem(this.PASSWORD_KEY, newPassword);
    return true;
  }

  // ログイン
  login(password) {
    const correctPassword = this.getStoredPassword();
    if (password === correctPassword) {
      const sessionData = {
        authenticated: true,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      return true;
    }
    return false;
  }

  // ログアウト
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = '/';
  }

  // セッションチェック
  isAuthenticated() {
    const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return false;

    try {
      const session = JSON.parse(sessionStr);
      const now = Date.now();
      
      // セッションの有効期限チェック
      if (now - session.timestamp > this.SESSION_DURATION) {
        sessionStorage.removeItem(this.SESSION_KEY);
        return false;
      }
      
      return session.authenticated === true;
    } catch (e) {
      return false;
    }
  }

  // セッションの更新
  refreshSession() {
    if (this.isAuthenticated()) {
      const sessionData = {
        authenticated: true,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    }
  }

  // 認証が必要なページの保護
  requireAuth() {
    if (!this.isAuthenticated()) {
      // 現在のURLを保存
      sessionStorage.setItem('redirect_after_login', window.location.href);
      window.location.href = '/admin-login.html';
      return false;
    }
    // セッションを更新
    this.refreshSession();
    return true;
  }

  // ログイン後のリダイレクト
  redirectAfterLogin() {
    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('redirect_after_login');
    window.location.href = redirectUrl || '/admin.html';
  }
}

// グローバルインスタンス
window.authManager = new AuthManager();