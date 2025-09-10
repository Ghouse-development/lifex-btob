// LIFE X 共通JavaScript関数

window.lifeXAPI = {
    // プラン検索機能
    searchPlans(plans, query) {
        if (!query || query.trim() === '') {
            return plans;
        }
        
        const searchTerm = query.toLowerCase().trim();
        
        return plans.filter(plan => {
            // プラン名で検索
            if (plan.name && plan.name.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // プランIDで検索
            if (plan.id && plan.id.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // タグで検索
            if (plan.tags && Array.isArray(plan.tags)) {
                return plan.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            }
            
            return false;
        });
    },

    // プランフィルタリング機能
    filterPlans(plans, filters) {
        return plans.filter(plan => {
            // 坪数フィルタ
            if (filters.tsubo) {
                if (filters.tsubo.min && plan.tsubo < filters.tsubo.min) return false;
                if (filters.tsubo.max && plan.tsubo > filters.tsubo.max) return false;
            }
            
            // 奥行フィルタ
            if (filters.depth) {
                if (filters.depth.min && plan.depth < filters.depth.min) return false;
                if (filters.depth.max && plan.depth > filters.depth.max) return false;
            }
            
            // 間口フィルタ
            if (filters.width) {
                if (filters.width.min && plan.width < filters.width.min) return false;
                if (filters.width.max && plan.width > filters.width.max) return false;
            }
            
            // 価格フィルタ
            if (filters.price && plan.prices) {
                const sellPrice = plan.prices.sell || 0;
                if (filters.price.min && sellPrice < filters.price.min) return false;
                if (filters.price.max && sellPrice > filters.price.max) return false;
            }
            
            // タグフィルタ
            if (filters.tags && filters.tags.length > 0) {
                if (!plan.tags || !Array.isArray(plan.tags)) return false;
                return filters.tags.every(filterTag => 
                    plan.tags.some(planTag => planTag === filterTag)
                );
            }
            
            return true;
        });
    },

    // プランソート機能
    sortPlans(plans, sortBy, sortOrder) {
        const sortedPlans = [...plans].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'name':
                    valueA = a.name || a.id || '';
                    valueB = b.name || b.id || '';
                    break;
                case 'tsubo':
                    valueA = a.tsubo || 0;
                    valueB = b.tsubo || 0;
                    break;
                case 'sell':
                    valueA = a.prices?.sell || 0;
                    valueB = b.prices?.sell || 0;
                    break;
                case 'cost':
                    valueA = a.prices?.cost || 0;
                    valueB = b.prices?.cost || 0;
                    break;
                case 'gross':
                    valueA = a.prices?.gross || 0;
                    valueB = b.prices?.gross || 0;
                    break;
                case 'updated':
                default:
                    valueA = new Date(a.updatedAt || a.updated || 0).getTime();
                    valueB = new Date(b.updatedAt || b.updated || 0).getTime();
                    break;
            }
            
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortOrder === 'asc' ? 
                    valueA.localeCompare(valueB) : 
                    valueB.localeCompare(valueA);
            }
            
            return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        });
        
        return sortedPlans;
    },

    // プランデータ取得
    async getPlansIndex() {
        try {
            // LocalStorageから取得を試みる
            const localData = localStorage.getItem('plans_data');
            if (localData) {
                return JSON.parse(localData);
            }
            
            // APIから取得を試みる（本番環境用）
            const response = await fetch('/api/plans');
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
                return await response.json();
            }
        } catch (error) {
            console.debug('Plans API not available, using empty data');
        }
        
        // エラー時は空のプランを返す
        return { plans: [] };
    },

    // 価格フォーマット
    formatPrice(price) {
        if (!price && price !== 0) return '-';
        return new Intl.NumberFormat('ja-JP').format(price) + '万円';
    },

    // 日付フォーマット
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },

    // ファイルダウンロード
    downloadFile(filePath, fileName) {
        try {
            const link = document.createElement('a');
            link.href = filePath;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            alert('ダウンロードに失敗しました');
        }
    },

    // トースト通知
    showToast(message, type = 'info') {
        // 簡易的なトースト実装
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white max-w-sm ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // アニメーション
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
        }, 3000);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3300);
    },
    
    // ダウンロード取得
    async getDownloads() {
        try {
            // ローカルストレージから取得を試みる
            const localData = localStorage.getItem('downloads_data');
            if (localData) {
                return JSON.parse(localData);
            }
            
            // APIから取得を試みる（本番環境用）
            const response = await fetch('/api/downloads');
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
                return await response.json();
            }
        } catch (error) {
            // エラーは開発環境では正常なので、詳細ログは出さない
            console.debug('Downloads API not available, using empty data');
        }
        // エラー時は空のカテゴリーを返す
        return {
            categories: {
                catalog: { items: [] },
                financial: { items: [] },
                specifications: { items: [] },
                drawings: { items: [] },
                logo: { items: [] },
                sales: { items: [] },
                contracts: { items: [] },
                manuals: { items: [] }
            }
        };
    },
    
    // ルール取得
    async getRules() {
        try {
            // ローカルストレージから取得を試みる
            const localData = localStorage.getItem('rules_data');
            if (localData) {
                return JSON.parse(localData);
            }
            
            const response = await fetch('/api/rules');
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
                return await response.json();
            }
        } catch (error) {
            console.debug('Rules API not available, using empty data');
        }
        return { rules: [] };
    },
    
    // FAQ取得
    async getFAQ() {
        try {
            // ローカルストレージから取得を試みる
            const localData = localStorage.getItem('faq_data');
            if (localData) {
                return JSON.parse(localData);
            }
            
            const response = await fetch('/api/faq');
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
                return await response.json();
            }
        } catch (error) {
            console.debug('FAQ API not available, using empty data');
        }
        return { faqs: [] };
    },
    
    // プラン作成
    async createPlan(planData) {
        try {
            // LocalStorageから既存のプランを取得
            const localData = localStorage.getItem('plans_data');
            let plansData = localData ? JSON.parse(localData) : { plans: [] };
            
            // 新しいプランを追加
            const newPlan = {
                ...planData,
                id: planData.id || `LX-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: planData.status || 'published'
            };
            
            plansData.plans.push(newPlan);
            
            // LocalStorageに保存
            localStorage.setItem('plans_data', JSON.stringify(plansData));
            
            return newPlan;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    },
    
    // プラン更新
    async updatePlan(planId, planData) {
        try {
            // LocalStorageから既存のプランを取得
            const localData = localStorage.getItem('plans_data');
            let plansData = localData ? JSON.parse(localData) : { plans: [] };
            
            // プランを更新
            const index = plansData.plans.findIndex(p => p.id === planId);
            if (index !== -1) {
                plansData.plans[index] = {
                    ...plansData.plans[index],
                    ...planData,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // LocalStorageに保存
            localStorage.setItem('plans_data', JSON.stringify(plansData));
            
            return plansData.plans[index];
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    }
};

// Authentication Manager
window.authManager = {
    isAuthenticated() {
        return sessionStorage.getItem('admin_token') === 'authenticated';
    },

    login(token) {
        sessionStorage.setItem('admin_token', 'authenticated');
    },

    logout() {
        sessionStorage.removeItem('admin_token');
        window.location.href = '/admin-login.html';
    },
    
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/admin-login.html';
            return false;
        }
        return true;
    }
};

// Logout function for admin pages
function logout() {
    if (window.authManager) {
        authManager.logout();
    }
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('LIFE X Common JS loaded');
});