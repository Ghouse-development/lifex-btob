class LifeXAPI {
  constructor() {
    this.baseUrl = window.location.origin;
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10分に延長してパフォーマンス改善
  }

  async fetchJSON(url) {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
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

  downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast('ダウンロードを開始しました', 'success');
  }

  searchPlans(plans, query) {
    if (!query) return plans;
    
    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 0);
    
    return plans.filter(plan => {
      const searchText = [
        plan.id,
        plan.name,
        ...plan.tags
      ].join(' ').toLowerCase();
      
      return keywords.every(keyword => searchText.includes(keyword));
    });
  }

  filterPlans(plans, filters) {
    return plans.filter(plan => {
      // 坪数フィルタ
      if (filters.tsubo) {
        if (filters.tsubo.min !== undefined && plan.tsubo < filters.tsubo.min) return false;
        if (filters.tsubo.max !== undefined && plan.tsubo > filters.tsubo.max) return false;
      }

      // 奥行フィルタ
      if (filters.depth) {
        if (filters.depth.min !== undefined && plan.depth < filters.depth.min) return false;
        if (filters.depth.max !== undefined && plan.depth > filters.depth.max) return false;
      }

      // 間口フィルタ
      if (filters.width) {
        if (filters.width.min !== undefined && plan.width < filters.width.min) return false;
        if (filters.width.max !== undefined && plan.width > filters.width.max) return false;
      }

      // 価格フィルタ
      if (filters.price) {
        if (filters.price.min !== undefined && plan.prices.sell < filters.price.min) return false;
        if (filters.price.max !== undefined && plan.prices.sell > filters.price.max) return false;
      }

      // タグフィルタ
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => plan.tags.includes(tag))) return false;
      }

      // オプションフィルタ
      if (filters.options) {
        if (filters.options.solar !== undefined && plan.options.solar !== filters.options.solar) return false;
        if (filters.options.evoltz !== undefined && plan.options.evoltz !== filters.options.evoltz) return false;
      }

      return true;
    });
  }

  sortPlans(plans, sortBy, sortOrder = 'asc') {
    const sorted = [...plans].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'tsubo':
          aVal = a.tsubo;
          bVal = b.tsubo;
          break;
        case 'sell':
          aVal = a.prices.sell;
          bVal = b.prices.sell;
          break;
        case 'cost':
          aVal = a.prices.cost;
          bVal = b.prices.cost;
          break;
        case 'gross':
          aVal = a.prices.gross;
          bVal = b.prices.gross;
          break;
        case 'updated':
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
          break;
        default:
          aVal = a.updatedAt;
          bVal = b.updatedAt;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }
}

// グローバルAPIインスタンス
window.lifeXAPI = new LifeXAPI();