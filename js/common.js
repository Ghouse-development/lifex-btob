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
            // 実際のAPIエンドポイントに置き換える
            // const response = await fetch('/api/plans');
            // return await response.json();
            
            // ダミーデータ
            return {
                plans: [
                    {
                        id: 'LX-030A',
                        name: 'LX-030A プラン',
                        tsubo: 30.2,
                        width: 5460,
                        depth: 9100,
                        prices: { sell: 25000000, cost: 18000000, gross: 4727273 },
                        tags: ['3LDK', '北入り', '2階建て', '1階LDK'],
                        status: 'published',
                        exteriorImage: '/images/plans/LX-030A-exterior.jpg',
                        floorPlan1F: '/images/plans/LX-030A-1F.jpg',
                        floorPlan2F: '/images/plans/LX-030A-2F.jpg',
                        updatedAt: '2024-01-15'
                    },
                    {
                        id: 'LX-030B',
                        name: 'LX-030B プラン',
                        tsubo: 30.5,
                        width: 5460,
                        depth: 9100,
                        prices: { sell: 26000000, cost: 18500000, gross: 5136364 },
                        tags: ['4LDK', '南入り', '2階建て', '1階LDK'],
                        status: 'published',
                        exteriorImage: '/images/plans/LX-030B-exterior.jpg',
                        floorPlan1F: '/images/plans/LX-030B-1F.jpg',
                        floorPlan2F: '/images/plans/LX-030B-2F.jpg',
                        updatedAt: '2024-01-14'
                    },
                    {
                        id: 'LX-033A',
                        name: 'LX-033A プラン',
                        tsubo: 33.1,
                        width: 6370,
                        depth: 9100,
                        prices: { sell: 27200000, cost: 19800000, gross: 4927273 },
                        tags: ['4LDK', '東入り', '2階建て', '1階LDK', 'シューズクローク'],
                        status: 'published',
                        exteriorImage: '/images/plans/LX-033A-exterior.jpg',
                        floorPlan1F: '/images/plans/LX-033A-1F.jpg',
                        floorPlan2F: '/images/plans/LX-033A-2F.jpg',
                        updatedAt: '2024-01-13'
                    },
                    {
                        id: 'LX-035A',
                        name: 'LX-035A プラン',
                        tsubo: 35.8,
                        width: 6825,
                        depth: 9100,
                        prices: { sell: 28300000, cost: 20500000, gross: 5227273 },
                        tags: ['5LDK', '西入り', '2階建て', '1階LDK', 'ファミリークローク'],
                        status: 'published',
                        exteriorImage: '/images/plans/LX-035A-exterior.jpg',
                        floorPlan1F: '/images/plans/LX-035A-1F.jpg',
                        floorPlan2F: '/images/plans/LX-035A-2F.jpg',
                        updatedAt: '2024-01-12'
                    }
                ]
            };
        } catch (error) {
            console.error('Error fetching plans:', error);
            throw error;
        }
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