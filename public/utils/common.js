// LIFE X API Manager
class LifeXAPI {
  constructor() {
    this.baseURL = window.location.origin;
  }

  async fetchJSON(path) {
    try {
      const response = await fetch(this.baseURL + path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  async getPlansIndex() {
    return this.fetchJSON('/data/plans-index.json');
  }

  async getPlan(planId) {
    return this.fetchJSON(`/data/plans/${planId}.json`);
  }

  async getResources() {
    return this.fetchJSON('/data/resources/common.json');
  }

  async getNews() {
    return this.fetchJSON('/data/news.json');
  }

  formatPrice(price, showTax = false, isTaxIncluded = true) {
    const formatted = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(price);
    
    if (showTax) {
      return formatted + (isTaxIncluded ? '(税込)' : '(税別)');
    }
    return formatted;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showToast(message, type = 'info') {
    // シンプルなalertに変更してパフォーマンス改善
    console.log(`Toast: ${message}`);
  }

  // Filter plans
  searchPlans(plans, query) {
    const searchTerm = query.toLowerCase();
    return plans.filter(plan => {
      const searchableText = `${plan.name} ${plan.id} ${plan.tags.join(' ')}`.toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }

  filterPlansByOptions(plans, filters) {
    return plans.filter(plan => {
      // Tsubo filter
      if (filters.tsubo) {
        const min = filters.tsubo.min || 0;
        const max = filters.tsubo.max || Infinity;
        if (plan.tsubo < min || plan.tsubo > max) return false;
      }

      // Depth filter
      if (filters.depth) {
        const min = filters.depth.min || 0;
        const max = filters.depth.max || Infinity;
        if (plan.depth < min || plan.depth > max) return false;
      }

      // Width filter
      if (filters.width) {
        const min = filters.width.min || 0;
        const max = filters.width.max || Infinity;
        if (plan.width < min || plan.width > max) return false;
      }

      // Price filter
      if (filters.price) {
        const min = filters.price.min || 0;
        const max = filters.price.max || Infinity;
        if (plan.prices.sell < min || plan.prices.sell > max) return false;
      }

      return true;
    });
  }

  sortPlans(plans, sortBy, order = 'asc') {
    const sorted = [...plans];
    const multiplier = order === 'asc' ? 1 : -1;
    
    sorted.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        case 'tsubo':
          return (a.tsubo - b.tsubo) * multiplier;
        case 'sell':
          return (a.prices.sell - b.prices.sell) * multiplier;
        case 'cost':
          return (a.prices.cost - b.prices.cost) * multiplier;
        case 'gross':
          return (a.prices.gross - b.prices.gross) * multiplier;
        case 'updated':
          return (new Date(b.updatedAt) - new Date(a.updatedAt)) * multiplier;
        default:
          return 0;
      }
    });
    
    return sorted;
  }
}

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
window.lifeXAPI = new LifeXAPI();
window.authManager = new AuthManager();