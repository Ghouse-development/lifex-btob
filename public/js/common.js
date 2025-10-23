// LIFE X 共通JavaScript関数

// IndexedDB画像ストレージクラス
class ImageStorage {
    constructor() {
        this.dbName = 'LifeX_Images';
        this.version = 1;
        this.storeName = 'images';
        this.db = null;
    }

    // データベース初期化
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('planId', 'planId', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // 画像を保存
    async saveImage(id, planId, type, base64Data, metadata = {}) {
        if (!this.db) await this.init();
        
        const imageData = {
            id: id,
            planId: planId,
            type: type, // 'exterior', 'interior', 'floorPlan', etc.
            data: base64Data,
            size: base64Data.length,
            timestamp: Date.now(),
            ...metadata
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(imageData);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`Image saved to IndexedDB: ${id} (${(base64Data.length / 1024 / 1024).toFixed(2)}MB)`);
                resolve(id);
            };
        });
    }

    // 画像を取得
    async getImage(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    console.log(`Image retrieved from IndexedDB: ${id}`);
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
        });
    }

    // プランの全画像を取得
    async getPlanImages(planId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('planId');
            const request = index.getAll(planId);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const images = {};
                request.result.forEach(img => {
                    images[img.type] = img.data;
                });
                resolve(images);
            };
        });
    }

    // 画像を削除
    async deleteImage(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`Image deleted from IndexedDB: ${id}`);
                resolve();
            };
        });
    }

    // プランの全画像を削除
    async deletePlanImages(planId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('planId');
            const request = index.getAll(planId);
            
            request.onsuccess = () => {
                const deletePromises = request.result.map(img => this.deleteImage(img.id));
                Promise.all(deletePromises).then(() => resolve()).catch(reject);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ストレージ使用量を取得
    async getStorageInfo() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const images = request.result;
                const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
                const count = images.length;
                
                resolve({
                    count: count,
                    totalSize: totalSize,
                    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
                });
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 画像ID生成
    generateImageId(planId, type) {
        return `${planId}_${type}_${Date.now()}`;
    }
}

// グローバルインスタンス
window.imageStorage = new ImageStorage();

// モード管理
class ModeManager {
    constructor() {
        this.currentMode = this.getMode();
        this.initEventListeners();
    }

    // モード取得（デフォルトは打合せモード）
    getMode() {
        return localStorage.getItem('display_mode') || 'business';
    }

    // モード設定
    setMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('display_mode', mode);
        this.updateModeDisplay();
        this.broadcastModeChange(mode);
    }

    // モード切り替え
    toggleMode() {
        const newMode = this.currentMode === 'business' ? 'internal' : 'business';
        this.setMode(newMode);
    }

    // 社内モードかどうか
    isInternalMode() {
        return this.currentMode === 'internal';
    }

    // 打合せモードかどうか
    isBusinessMode() {
        return this.currentMode === 'business';
    }

    // モード表示更新
    updateModeDisplay() {
        // モード切り替えボタンの更新
        const modeButtons = document.querySelectorAll('.mode-toggle-button');
        modeButtons.forEach(button => {
            const icon = button.querySelector('.mode-icon');
            const text = button.querySelector('.mode-text');
            
            if (this.currentMode === 'internal') {
                button.classList.add('bg-red-600', 'text-white');
                button.classList.remove('bg-gray-600', 'text-white');
                if (icon) icon.textContent = '🏢';
                if (text) text.textContent = '社内モード';
            } else {
                button.classList.add('bg-gray-300', 'text-gray-600', 'border', 'border-gray-300');
                button.classList.remove('bg-red-600', 'text-white', 'bg-gray-600');
                if (icon) icon.textContent = '🤝';
                if (text) text.textContent = '打合せモード';
            }
        });

        // 価格表示の制御
        const priceElements = document.querySelectorAll('[data-price-element]');
        priceElements.forEach(element => {
            if (this.currentMode === 'internal') {
                element.style.display = '';
                element.classList.remove('hidden');
            } else {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        });

        // 価格ボタンの制御
        const priceButtons = document.querySelectorAll('[data-price-button]');
        priceButtons.forEach(button => {
            if (this.currentMode === 'internal') {
                button.style.display = 'none';
                button.classList.add('hidden');
            } else {
                button.style.display = '';
                button.classList.remove('hidden');
            }
        });
    }

    // モード変更をブロードキャスト
    broadcastModeChange(mode) {
        window.dispatchEvent(new CustomEvent('modeChanged', { 
            detail: { mode: mode } 
        }));
    }

    // イベントリスナー初期化
    initEventListeners() {
        // ページ読み込み時にモード表示を更新
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.updateModeDisplay(), 100);
        });

        // Alpine.js初期化後にも更新
        document.addEventListener('alpine:init', () => {
            setTimeout(() => this.updateModeDisplay(), 100);
        });
    }

    // モード切り替えボタンHTML生成
    generateModeToggleButton() {
        const mode = this.currentMode;
        const isInternal = mode === 'internal';
        
        return `
            <button 
                onclick="window.modeManager.toggleMode()" 
                class="mode-toggle-button flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isInternal ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600 border border-gray-300'}"
                title="モードを切り替え">
                <span class="mode-icon">${isInternal ? '🏢' : '🤝'}</span>
                <span class="mode-text">${isInternal ? '社内モード' : '打合せモード'}</span>
            </button>
        `;
    }
}

// グローバルインスタンス
window.modeManager = new ModeManager();

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
            // 複数のソースからデータを復元を試みる
            console.log('Attempting to restore plans data from multiple sources...');
            
            // 1. 'plans_data'からの取得を試みる
            let localData = localStorage.getItem('plans_data');
            if (localData) {
                console.log('Found plans data in localStorage (plans_data)');
                const data = JSON.parse(localData);
                if (!data.plans) data.plans = [];
                return data;
            }
            
            // 2. 'lifex_plans'からの取得を試みる（古いキー）
            localData = localStorage.getItem('lifex_plans');
            if (localData) {
                console.log('Found plans data in localStorage (lifex_plans)');
                const data = JSON.parse(localData);
                if (!data.plans) data.plans = [];
                // 新しいキーに移行
                localStorage.setItem('plans_data', localData);
                return data;
            }
            
            // 3. 'plans'からの取得を試みる（配列形式）
            localData = localStorage.getItem('plans');
            if (localData) {
                console.log('Found plans array in localStorage (plans)');
                const plans = JSON.parse(localData);
                const data = { plans: Array.isArray(plans) ? plans : [] };
                // 新しいキーに移行
                localStorage.setItem('plans_data', JSON.stringify(data));
                return data;
            }
            
            // 4. 個別にLocalStorageキーを検索
            console.log('Searching for individual plan data in localStorage...');
            const planKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('plan_') || key.startsWith('lifex_plan_')
            );
            
            if (planKeys.length > 0) {
                console.log(`Found ${planKeys.length} individual plan entries`);
                const plans = [];
                planKeys.forEach(key => {
                    try {
                        const planData = JSON.parse(localStorage.getItem(key));
                        if (planData && planData.id) {
                            plans.push(planData);
                        }
                    } catch (e) {
                        console.warn(`Failed to parse plan data for key ${key}:`, e);
                    }
                });
                
                if (plans.length > 0) {
                    const data = { plans };
                    localStorage.setItem('plans_data', JSON.stringify(data));
                    console.log(`Restored ${plans.length} plans from individual entries`);
                    return data;
                }
            }
            
            // 5. IndexedDBからプランメタデータを復元
            console.log('Attempting to restore plans from IndexedDB...');
            try {
                // IndexedDBからすべてのプランIDを取得
                const imageStorage = window.imageStorage || new ImageStorage();
                await imageStorage.init();
                
                // すべてのデータベースエントリを取得
                const transaction = imageStorage.db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
                const getAllRequest = store.getAll();
                
                const allImages = await new Promise((resolve, reject) => {
                    getAllRequest.onsuccess = () => resolve(getAllRequest.result);
                    getAllRequest.onerror = () => reject(getAllRequest.error);
                });
                
                if (allImages.length > 0) {
                    // プランIDごとにグループ化
                    const planGroups = {};
                    allImages.forEach(img => {
                        if (!planGroups[img.planId]) {
                            planGroups[img.planId] = [];
                        }
                        planGroups[img.planId].push(img);
                    });
                    
                    // 基本的なプラン情報を復元
                    const plans = Object.keys(planGroups).map(planId => ({
                        id: planId,
                        name: planId.replace(/^[A-Z]+-/, '').replace(/-/g, ' '),
                        tsubo: 30, // デフォルト値
                        width: 7280, // デフォルト値
                        depth: 10010, // デフォルト値
                        floors: {
                            building: 2,
                            ldk: 1,
                            bathroom: 1
                        },
                        category: 'general',
                        tags: ['restored'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));
                    
                    if (plans.length > 0) {
                        const data = { plans };
                        localStorage.setItem('plans_data', JSON.stringify(data));
                        console.log(`Restored ${plans.length} plans from IndexedDB`);
                        return data;
                    }
                }
            } catch (indexedDbError) {
                console.warn('Failed to restore from IndexedDB:', indexedDbError);
            }
            
            // 6. APIから取得を試みる（本番環境用）
            try {
                const response = await fetch('/api/plans');
                const contentType = response.headers.get('content-type');
                if (response.ok && contentType && contentType.includes('application/json')) {
                    console.log('Loaded plans from API');
                    return await response.json();
                }
            } catch (apiError) {
                console.debug('Plans API not available');
            }
            
        } catch (error) {
            console.error('Error in getPlansIndex:', error);
        }
        
        console.log('No plans data found, returning empty array');
        return { plans: [] };
    },

    // データバックアップ機能
    async createBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                localStorage: {},
                indexedDB: {}
            };

            // LocalStorageをバックアップ
            Object.keys(localStorage).forEach(key => {
                if (key.includes('plan') || key.includes('lifex') || key.includes('data')) {
                    try {
                        backupData.localStorage[key] = localStorage.getItem(key);
                    } catch (e) {
                        console.warn(`Failed to backup localStorage key ${key}:`, e);
                    }
                }
            });

            // IndexedDBをバックアップ
            try {
                const imageStorage = window.imageStorage || new ImageStorage();
                await imageStorage.init();
                
                const transaction = imageStorage.db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
                const getAllRequest = store.getAll();
                
                const allImages = await new Promise((resolve, reject) => {
                    getAllRequest.onsuccess = () => resolve(getAllRequest.result);
                    getAllRequest.onerror = () => reject(getAllRequest.error);
                });
                
                backupData.indexedDB.images = allImages;
            } catch (e) {
                console.warn('Failed to backup IndexedDB:', e);
            }

            // JSONファイルとしてダウンロード
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifex-backup-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true, message: 'バックアップが作成されました' };
        } catch (error) {
            console.error('Backup creation failed:', error);
            return { success: false, message: 'バックアップの作成に失敗しました: ' + error.message };
        }
    },

    // データリストア機能
    async restoreFromBackup(file) {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);

            if (!backupData.timestamp || !backupData.localStorage) {
                throw new Error('無効なバックアップファイルです');
            }

            // LocalStorageをリストア
            if (backupData.localStorage) {
                Object.entries(backupData.localStorage).forEach(([key, value]) => {
                    try {
                        localStorage.setItem(key, value);
                    } catch (e) {
                        console.warn(`Failed to restore localStorage key ${key}:`, e);
                    }
                });
            }

            // IndexedDBをリストア
            if (backupData.indexedDB && backupData.indexedDB.images) {
                const imageStorage = window.imageStorage || new ImageStorage();
                await imageStorage.init();

                for (const imageData of backupData.indexedDB.images) {
                    try {
                        await imageStorage.saveImage(imageData.id, imageData.planId, imageData.type, imageData.data);
                    } catch (e) {
                        console.warn(`Failed to restore image ${imageData.id}:`, e);
                    }
                }
            }

            return { success: true, message: 'データが復元されました。ページを再読み込みしてください。' };
        } catch (error) {
            console.error('Restore failed:', error);
            return { success: false, message: 'データの復元に失敗しました: ' + error.message };
        }
    },
    
    // プランデータ取得（画像付きの完全版）
    async getPlansWithImages() {
        try {
            const data = await this.getPlansIndex();
            if (data.plans && data.plans.length > 0) {
                // すべてのプランの画像を読み込み
                console.log('Loading images for all plans...');
                const plansWithImages = await this.loadMultiplePlanImages(data.plans);
                return { ...data, plans: plansWithImages };
            }
            return data;
        } catch (error) {
            console.error('Error loading plans with images:', error);
            return await this.getPlansIndex(); // エラー時は画像なし版にフォールバック
        }
    },
    
    // 単一プランを画像付きで取得
    async getPlanWithImages(planId) {
        try {
            const data = await this.getPlansIndex();
            const plan = data.plans.find(p => p.id === planId);
            if (plan) {
                console.log(`Loading images for plan: ${planId}`);
                return await this.loadPlanImages(plan);
            }
            return null;
        } catch (error) {
            console.error('Error loading plan with images:', error);
            return null;
        }
    },
    
    // プランを取得（getPlanのエイリアス）
    async getPlan(planId) {
        return await this.getPlanWithImages(planId);
    },

    // 価格フォーマット
    formatPrice(price) {
        if (!price && price !== 0) return '-';
        // 価格は円単位で保存されているので、万円単位に変換
        const priceInManYen = Math.round(price / 10000);
        return new Intl.NumberFormat('ja-JP').format(priceInManYen) + '万円';
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
            console.log('===== CREATE PLAN API CALL =====');
            console.log('[API] createPlan called with:', planData);
            console.log('[API] Environment:', {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
                protocol: window.location.protocol
            });
            
            // LocalStorageから既存のプランを取得
            const localData = localStorage.getItem('plans_data');
            let plansData = localData ? JSON.parse(localData) : { plans: [] };
            
            // 新しいプランを追加
            const planId = planData.id || `LX-${Date.now()}`;
            const newPlan = {
                ...planData,
                id: planId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: planData.status || 'published'
            };
            
            // 画像データを IndexedDB に保存し、LocalStorage からは除外
            const imagePromises = [];
            const imageIds = {};
            
            // 外観パース
            if (newPlan.exteriorImage && newPlan.exteriorImage.startsWith('data:image/')) {
                const imageId = imageStorage.generateImageId(planId, 'exterior');
                imagePromises.push(imageStorage.saveImage(imageId, planId, 'exterior', newPlan.exteriorImage));
                imageIds.exteriorImageId = imageId;
                delete newPlan.exteriorImage; // LocalStorageから除外
            }
            
            // 内観パース
            if (newPlan.interiorImage && newPlan.interiorImage.startsWith('data:image/')) {
                const imageId = imageStorage.generateImageId(planId, 'interior');
                imagePromises.push(imageStorage.saveImage(imageId, planId, 'interior', newPlan.interiorImage));
                imageIds.interiorImageId = imageId;
                delete newPlan.interiorImage; // LocalStorageから除外
            }
            
            // 間取り図
            if (newPlan.floorPlanImage && newPlan.floorPlanImage.startsWith('data:image/')) {
                const imageId = imageStorage.generateImageId(planId, 'floorPlan');
                imagePromises.push(imageStorage.saveImage(imageId, planId, 'floorPlan', newPlan.floorPlanImage));
                imageIds.floorPlanImageId = imageId;
                delete newPlan.floorPlanImage; // LocalStorageから除外
            }
            
            // images オブジェクト内の画像
            if (newPlan.images) {
                for (const [type, imageData] of Object.entries(newPlan.images)) {
                    if (imageData && imageData.startsWith('data:image/')) {
                        const imageId = imageStorage.generateImageId(planId, `images_${type}`);
                        imagePromises.push(imageStorage.saveImage(imageId, planId, `images_${type}`, imageData));
                        if (!imageIds.imagesIds) imageIds.imagesIds = {};
                        imageIds.imagesIds[type] = imageId;
                        newPlan.images[type] = ''; // LocalStorageからは除外
                    }
                }
            }
            
            // 間取り図配列
            if (newPlan.floorPlans && Array.isArray(newPlan.floorPlans)) {
                imageIds.floorPlanIds = [];
                newPlan.floorPlans.forEach((planImage, index) => {
                    if (planImage && planImage.startsWith('data:image/')) {
                        const imageId = imageStorage.generateImageId(planId, `floorPlan_${index}`);
                        imagePromises.push(imageStorage.saveImage(imageId, planId, `floorPlan_${index}`, planImage));
                        imageIds.floorPlanIds[index] = imageId;
                        newPlan.floorPlans[index] = ''; // LocalStorageからは除外
                    }
                });
            }
            
            // 画像IDをプランデータに追加
            newPlan.imageIds = imageIds;
            
            // 画像保存を待機
            if (imagePromises.length > 0) {
                await Promise.all(imagePromises);
                console.log(`Saved ${imagePromises.length} images to IndexedDB for plan ${planId}`);
            }
            
            plansData.plans.push(newPlan);
            
            // LocalStorageに保存（画像なしなので軽量）
            await this.saveWithQuotaManagement('plans_data', plansData);
            
            // 最新情報を追加
            this.addLatestUpdate({
                type: 'plan_created',
                title: `新しいプラン「${newPlan.name || newPlan.id}」が追加されました`,
                description: `新規プランが登録されました。プラン一覧でご確認ください。`,
                category: 'プラン',
                planId: newPlan.id
            });
            
            console.log('Plan created successfully with IndexedDB images');
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
                
                // プラン更新は最新情報に表示しない（ユーザー要求により）
                // this.addLatestUpdate({
                //     type: 'plan_updated',
                //     title: `プラン「${plansData.plans[index].name || plansData.plans[index].id}」が更新されました`,
                //     description: `プランの詳細情報が更新されました。`,
                //     category: 'プラン',
                //     planId: planId
                // });
            }
            
            // LocalStorageに保存（容量制限対応）
            await this.saveWithQuotaManagement('plans_data', plansData);
            
            return plansData.plans[index];
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    },
    
    // プランの画像を IndexedDB から取得して復元
    async loadPlanImages(plan) {
        if (!plan || !plan.imageIds) return plan;
        
        try {
            const loadedPlan = { ...plan };
            
            // 外観パース
            if (plan.imageIds.exteriorImageId) {
                const imageData = await imageStorage.getImage(plan.imageIds.exteriorImageId);
                if (imageData) {
                    loadedPlan.exteriorImage = imageData;
                    if (!loadedPlan.images) loadedPlan.images = {};
                    loadedPlan.images.exterior = imageData;
                }
            }
            
            // 内観パース
            if (plan.imageIds.interiorImageId) {
                const imageData = await imageStorage.getImage(plan.imageIds.interiorImageId);
                if (imageData) {
                    loadedPlan.interiorImage = imageData;
                    if (!loadedPlan.images) loadedPlan.images = {};
                    loadedPlan.images.interior = imageData;
                }
            }
            
            // 間取り図
            if (plan.imageIds.floorPlanImageId) {
                const imageData = await imageStorage.getImage(plan.imageIds.floorPlanImageId);
                if (imageData) {
                    loadedPlan.floorPlanImage = imageData;
                }
            }
            
            // images オブジェクト内の画像
            if (plan.imageIds.imagesIds) {
                if (!loadedPlan.images) loadedPlan.images = {};
                for (const [type, imageId] of Object.entries(plan.imageIds.imagesIds)) {
                    const imageData = await imageStorage.getImage(imageId);
                    if (imageData) {
                        loadedPlan.images[type] = imageData;
                    }
                }
            }
            
            // 間取り図配列
            if (plan.imageIds.floorPlanIds && Array.isArray(plan.imageIds.floorPlanIds)) {
                if (!loadedPlan.floorPlans) loadedPlan.floorPlans = [];
                for (const [index, imageId] of plan.imageIds.floorPlanIds.entries()) {
                    if (imageId) {
                        const imageData = await imageStorage.getImage(imageId);
                        if (imageData) {
                            loadedPlan.floorPlans[index] = imageData;
                        }
                    }
                }
            }
            
            return loadedPlan;
        } catch (error) {
            console.error('Error loading plan images:', error);
            return plan; // エラー時は元のプランを返す
        }
    },
    
    // 複数プランの画像を一括読み込み
    async loadMultiplePlanImages(plans) {
        if (!plans || !Array.isArray(plans)) return plans;
        
        const loadPromises = plans.map(plan => this.loadPlanImages(plan));
        try {
            return await Promise.all(loadPromises);
        } catch (error) {
            console.error('Error loading multiple plan images:', error);
            return plans; // エラー時は元の配列を返す
        }
    },

    // 最新情報の管理
    addLatestUpdate(updateData) {
        try {
            const updates = this.getLatestUpdates();
            const newUpdate = {
                id: Date.now().toString(),
                title: updateData.title,
                description: updateData.description,
                category: updateData.category,
                date: new Date().toISOString(),
                type: updateData.type,
                planId: updateData.planId || null
            };
            
            updates.unshift(newUpdate); // 最新を先頭に追加
            
            // 最大20件まで保持
            const limitedUpdates = updates.slice(0, 20);
            
            localStorage.setItem('latest_updates', JSON.stringify(limitedUpdates));
            
            // カスタムイベントを発火してホーム画面に通知
            window.dispatchEvent(new CustomEvent('updates-changed', { 
                detail: limitedUpdates 
            }));
            
            console.log('Latest update added:', newUpdate);
        } catch (error) {
            console.error('Error adding latest update:', error);
        }
    },

    // 最新情報の取得
    getLatestUpdates() {
        try {
            const data = localStorage.getItem('latest_updates');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting latest updates:', error);
            return [];
        }
    },

    // ダウンロード保存（管理画面用）
    async saveDownloads(downloadsData) {
        try {
            localStorage.setItem('downloads_data', JSON.stringify(downloadsData));
            
            // 最新情報を追加
            this.addLatestUpdate({
                type: 'downloads_updated',
                title: 'ダウンロード資料が更新されました',
                description: 'ダウンロードページに新しい資料が追加されました。',
                category: 'ダウンロード'
            });
            
            return downloadsData;
        } catch (error) {
            console.error('Error saving downloads:', error);
            throw error;
        }
    },

    // ルール保存（管理画面用）
    async saveRules(rulesData) {
        try {
            // 両方のキーに保存（互換性のため）
            localStorage.setItem('rules_data', JSON.stringify(rulesData));
            localStorage.setItem('rules_categories_data', JSON.stringify(rulesData));
            
            // 最新情報を追加
            this.addLatestUpdate({
                type: 'rules_updated',
                title: 'ルール・ガイドラインが更新されました',
                description: '新しいルールまたはガイドラインが追加・更新されました。',
                category: 'ルール'
            });
            
            return rulesData;
        } catch (error) {
            console.error('Error saving rules:', error);
            throw error;
        }
    },

    // FAQ保存（管理画面用）
    async saveFAQ(faqData) {
        try {
            localStorage.setItem('faq_data', JSON.stringify(faqData));
            
            // 最新情報を追加
            this.addLatestUpdate({
                type: 'faq_updated',
                title: 'よくある質問が更新されました',
                description: '新しいFAQが追加または既存のFAQが更新されました。',
                category: 'FAQ'
            });
            
            return faqData;
        } catch (error) {
            console.error('Error saving FAQ:', error);
            throw error;
        }
    },

    // LocalStorage容量制限対応の保存メソッド
    async saveWithQuotaManagement(key, data) {
        // 画像データを圧縮
        if (key === 'plans_data' && data.plans) {
            data = await this.compressPlanImages(data);
        }
        
        let dataString = JSON.stringify(data);
        let dataSize = new Blob([dataString]).size;
        
        console.log(`Attempting to save ${key} with size: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
        
        // 8MB以上の場合は事前に緊急圧縮を実行
        if (dataSize > 8 * 1024 * 1024 && key === 'plans_data' && data.plans) {
            console.log('Data size too large (8MB+), applying pre-emptive emergency compression...');
            
            for (const plan of data.plans) {
                if (plan.exteriorImage && plan.exteriorImage.length > 200000) { // 200KB以上
                    plan.exteriorImage = await this.emergencyCompressImage(plan.exteriorImage);
                }
                if (plan.interiorImage && plan.interiorImage.length > 200000) {
                    plan.interiorImage = await this.emergencyCompressImage(plan.interiorImage);
                }
                if (plan.floorPlanImage && plan.floorPlanImage.length > 200000) {
                    plan.floorPlanImage = await this.emergencyCompressImage(plan.floorPlanImage);
                }
                if (plan.images) {
                    for (const [imgKey, value] of Object.entries(plan.images)) {
                        if (value && value.length > 200000) {
                            plan.images[imgKey] = await this.emergencyCompressImage(value);
                        }
                    }
                }
            }
            
            dataString = JSON.stringify(data);
            dataSize = new Blob([dataString]).size;
            console.log(`After pre-emptive compression: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
        }
        
        try {
            // まず普通に保存を試す
            localStorage.setItem(key, dataString);
            console.log(`Successfully saved ${key}`);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, attempting cleanup...');
                
                // 容量不足の場合、古いプランを削除
                if (key === 'plans_data' && data.plans) {
                    // プランを更新日順でソートし、古い順に削除
                    const sortedPlans = [...data.plans].sort((a, b) => 
                        new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt)
                    );
                    
                    // より積極的な古いプラン削除（大きな画像対応）
                    let maxPlans = 30; // 最大プラン数をさらに削減
                    
                    // データサイズに応じて更に削減
                    if (dataSize > 8 * 1024 * 1024) { // 8MB以上の場合
                        maxPlans = 15;
                        console.log('Very large data detected (8MB+), reducing max plans to 15');
                    } else if (dataSize > 6 * 1024 * 1024) { // 6MB以上の場合
                        maxPlans = 20;
                        console.log('Large data detected (6MB+), reducing max plans to 20');
                    } else if (dataSize > 4 * 1024 * 1024) { // 4MB以上の場合
                        maxPlans = 25;
                        console.log('Medium-large data detected (4MB+), reducing max plans to 25');
                    }
                    
                    if (sortedPlans.length > maxPlans) {
                        const keptPlans = sortedPlans.slice(-maxPlans);
                        data.plans = keptPlans;
                        
                        const deletedCount = sortedPlans.length - maxPlans;
                        console.log(`Deleted ${deletedCount} old plans to free up space`);
                        
                        // 再度保存を試す
                        const newDataString = JSON.stringify(data);
                        localStorage.setItem(key, newDataString);
                        
                        this.showToast(`古いプラン${deletedCount}件を削除して保存しました`, 'warning');
                        return;
                    }
                }
                
                // その他のクリーンアップ
                this.clearOldCacheData();
                
                // 再度保存を試す
                try {
                    localStorage.setItem(key, dataString);
                    this.showToast('容量を確保して保存しました', 'success');
                } catch (secondError) {
                    console.error('Failed to save even after cleanup:', secondError);
                    
                    // 最終手段：追加の画像圧縮を試行
                    if (key === 'plans_data' && data.plans) {
                        console.log('Trying emergency compression...');
                        
                        // すべての画像をさらに圧縮 + 不要データ削除
                        for (const plan of data.plans) {
                            // 画像の緊急圧縮（すべて）
                            if (plan.exteriorImage && plan.exteriorImage.length > 50000) { // 50KB以上の場合
                                plan.exteriorImage = await this.emergencyCompressImage(plan.exteriorImage);
                            }
                            if (plan.interiorImage && plan.interiorImage.length > 50000) {
                                plan.interiorImage = await this.emergencyCompressImage(plan.interiorImage);
                            }
                            if (plan.floorPlanImage && plan.floorPlanImage.length > 50000) {
                                plan.floorPlanImage = await this.emergencyCompressImage(plan.floorPlanImage);
                            }
                            if (plan.images) {
                                for (const [key, value] of Object.entries(plan.images)) {
                                    if (value && value.length > 50000) {
                                        plan.images[key] = await this.emergencyCompressImage(value);
                                    }
                                }
                            }
                            
                            // 大容量のfiles.imagesデータを削除（表示には exteriorImage/images を使用）
                            if (plan.files && plan.files.images) {
                                for (const [key, fileObj] of Object.entries(plan.files.images)) {
                                    if (fileObj && fileObj.data && fileObj.data.length > 100000) {
                                        delete fileObj.data; // Base64データのみ削除、メタデータは保持
                                        console.log(`Removed large file data for ${key}`);
                                    }
                                }
                            }
                            
                            // 大容量の他のファイルデータも削除
                            if (plan.files && plan.files.drawings) {
                                for (const [category, files] of Object.entries(plan.files.drawings)) {
                                    if (Array.isArray(files)) {
                                        files.forEach(file => {
                                            if (file.data && file.data.length > 500000) {
                                                delete file.data;
                                            }
                                        });
                                    } else if (files && files.data && files.data.length > 500000) {
                                        delete files.data;
                                    }
                                }
                            }
                        }
                        
                        // 再々度保存を試す
                        try {
                            const emergencyDataString = JSON.stringify(data);
                            localStorage.setItem(key, emergencyDataString);
                            this.showToast('緊急圧縮を行い保存しました（画像品質が低下しています）', 'warning');
                            return;
                        } catch (thirdError) {
                            console.error('Emergency compression also failed:', thirdError);
                            
                            // 最終手段：LocalStorage全体をクリアして最低限のデータで再保存
                            console.log('Attempting complete LocalStorage cleanup...');
                            const currentPlans = data.plans || [];
                            const latestPlans = currentPlans.slice(-10); // 最新10件のみ保持
                            
                            // 他の全てのLocalStorageデータを削除
                            localStorage.clear();
                            
                            try {
                                // 最低限のデータで保存
                                const minimalData = { plans: latestPlans };
                                localStorage.setItem(key, JSON.stringify(minimalData));
                                this.showToast('緊急措置：全データをクリアし、最新10件のプランのみ保存しました', 'error');
                                return;
                            } catch (finalError) {
                                console.error('Final attempt also failed:', finalError);
                            }
                        }
                    }
                    
                    // より詳細なエラーメッセージ
                    const currentSize = (dataSize / 1024 / 1024).toFixed(2);
                    throw new Error(`プランの保存に失敗しました。データサイズ: ${currentSize}MB\n\n実行した対策：\n• 自動圧縮（画像を最小サイズに変換）\n• 古いプラン削除\n• 不要ファイルデータ削除\n• LocalStorageクリア\n\nそれでも容量不足です。ブラウザの制限に達しています。`);
                }
            } else {
                throw error;
            }
        }
    },

    // プラン画像の圧縮
    async compressPlanImages(data) {
        console.log('===== COMPRESS PLAN IMAGES STARTED =====');
        const compressedData = JSON.parse(JSON.stringify(data)); // Deep copy
        
        for (let i = 0; i < compressedData.plans.length; i++) {
            const plan = compressedData.plans[i];
            console.log(`Compressing plan ${i}: ${plan.id || 'unnamed'}`);
            console.log('Before compression - exteriorImage length:', plan.exteriorImage ? plan.exteriorImage.length : 0);
            console.log('Before compression - images.exterior length:', plan.images?.exterior ? plan.images.exterior.length : 0);
            
            // 画像フィールドを段階的圧縮
            if (plan.exteriorImage && plan.exteriorImage.startsWith('data:image/')) {
                console.log('Compressing exteriorImage...');
                plan.exteriorImage = await this.compressBase64Image(plan.exteriorImage);
                console.log('After compression - exteriorImage length:', plan.exteriorImage.length);
            }
            if (plan.interiorImage && plan.interiorImage.startsWith('data:image/')) {
                console.log('Compressing interiorImage...');
                plan.interiorImage = await this.compressBase64Image(plan.interiorImage);
                console.log('After compression - interiorImage length:', plan.interiorImage.length);
            }
            if (plan.floorPlanImage && plan.floorPlanImage.startsWith('data:image/')) {
                console.log('Compressing floorPlanImage...');
                plan.floorPlanImage = await this.compressBase64Image(plan.floorPlanImage);
                console.log('After compression - floorPlanImage length:', plan.floorPlanImage.length);
            }
            
            // imagesオブジェクトも圧縮
            if (plan.images) {
                console.log('Compressing images object...');
                for (const [key, value] of Object.entries(plan.images)) {
                    if (value && value.startsWith('data:image/')) {
                        console.log(`Compressing images.${key}...`);
                        const originalLength = value.length;
                        plan.images[key] = await this.compressBase64Image(value);
                        console.log(`After compression - images.${key} length: ${originalLength} -> ${plan.images[key].length}`);
                    }
                }
            }
            
            console.log('Final - exteriorImage length:', plan.exteriorImage ? plan.exteriorImage.length : 0);
            console.log('Final - images.exterior length:', plan.images?.exterior ? plan.images.exterior.length : 0);
        }
        
        console.log('===== COMPRESS PLAN IMAGES COMPLETED =====');
        return compressedData;
    },

    // Base64画像の段階的圧縮
    async compressBase64Image(base64String, initialQuality = 0.9, maxWidth = 2400) {
        return new Promise(async (resolve) => {
            console.log('compressBase64Image called with data length:', base64String ? base64String.length : 0);
            if (!base64String) {
                console.error('compressBase64Image: no data provided');
                resolve('');
                return;
            }
            
            const img = new Image();
            img.onload = async () => {
                console.log('Image loaded successfully for compression');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 元画像サイズを確認
                const originalSize = base64String.length;
                console.log(`Original image size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
                
                // より高品質な圧縮設定
                let targetWidth = maxWidth;
                let quality = initialQuality;
                
                if (originalSize > 15 * 1024 * 1024) { // 15MB以上
                    targetWidth = 1800;
                    quality = 0.85;
                    console.log('Very large image detected (15MB+) - using moderate compression');
                } else if (originalSize > 10 * 1024 * 1024) { // 10MB以上
                    targetWidth = 2000;
                    quality = 0.88;
                    console.log('Large image detected (10MB+) - using light compression');
                } else if (originalSize > 5 * 1024 * 1024) { // 5MB以上
                    targetWidth = 2200;
                    quality = 0.9;
                    console.log('Medium-large image detected (5MB+) - using minimal compression');
                } else if (originalSize > 3 * 1024 * 1024) { // 3MB以上
                    targetWidth = 2400;
                    quality = 0.92;
                    console.log('Medium image detected (3MB+) - using very light compression');
                } else if (originalSize > 1 * 1024 * 1024) { // 1MB以上
                    targetWidth = 2400;
                    quality = 0.95;
                    console.log('Small-medium image detected (1MB+) - using high quality compression');
                }
                
                // アスペクト比を維持してリサイズ
                const ratio = Math.min(targetWidth / img.width, targetWidth / img.height, 1);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 段階的圧縮 - より積極的な圧縮
                let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                let attempts = 0;
                const maxAttempts = 8; // 試行回数を増加
                const targetSize = 1.5 * 1024 * 1024; // 目標サイズを1.5MBに設定（Base64だと約2MB）
                
                console.log(`Initial compression: ${canvas.width}x${canvas.height}, quality=${quality}, size=${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`);
                
                // サイズが大きすぎる場合は品質を下げて再圧縮
                while (compressedBase64.length > targetSize && attempts < maxAttempts && quality > 0.2) {
                    quality -= 0.1;
                    compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    attempts++;
                    console.log(`Compression attempt ${attempts}: quality=${quality.toFixed(1)}, size=${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`);
                }
                
                // まだ大きすぎる場合は画像サイズをさらに縮小（段階的）
                if (compressedBase64.length > targetSize) {
                    const resizeSizes = [600, 500, 400, 300, 250, 200]; // より小さなサイズまで対応
                    
                    for (const maxSize of resizeSizes) {
                        if (compressedBase64.length <= targetSize) break;
                        
                        if (canvas.width > maxSize || canvas.height > maxSize) {
                            const newRatio = Math.min(maxSize / img.width, maxSize / img.height, 1);
                            canvas.width = img.width * newRatio;
                            canvas.height = img.height * newRatio;
                            
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // さらに低い品質を試す
                            let finalQuality = Math.max(quality, 0.2);
                            if (maxSize <= 300) finalQuality = 0.15; // 非常に小さい場合は品質を更に下げる
                            
                            compressedBase64 = canvas.toDataURL('image/jpeg', finalQuality);
                            console.log(`Resize to ${maxSize}px max: ${canvas.width}x${canvas.height}, quality=${finalQuality}, size=${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`);
                        }
                    }
                    
                    // 最終手段：WebP形式を試す（対応していればより圧縮効率が良い）
                    if (compressedBase64.length > targetSize) {
                        try {
                            const webpData = canvas.toDataURL('image/webp', 0.1);
                            if (webpData.startsWith('data:image/webp') && webpData.length < compressedBase64.length) {
                                compressedBase64 = webpData;
                                console.log(`WebP fallback used: size=${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`);
                            }
                        } catch (e) {
                            console.log('WebP not supported, using JPEG');
                        }
                    }
                }
                
                console.log(`Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedBase64);
            };
            
            img.onerror = (error) => {
                console.error('Image loading failed, returning original. Error:', error);
                console.error('Failed Base64 data starts with:', base64String ? base64String.substring(0, 100) : 'null');
                resolve(base64String);
            };
            
            img.src = base64String;
        });
    },

    // 緊急圧縮メソッド（極小サイズまで圧縮）
    async emergencyCompressImage(base64String) {
        if (!base64String || !base64String.startsWith('data:image/')) return base64String;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 極小サイズに設定（100px以下）
                const maxSize = 100;
                const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = Math.max(img.width * ratio, 50); // 最小50px
                canvas.height = Math.max(img.height * ratio, 50); // 最小50px
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 極低品質で圧縮
                let compressed = canvas.toDataURL('image/jpeg', 0.05); // 品質5%
                
                // まだ大きい場合はさらに小さく
                if (compressed.length > 50000) { // 50KB以上の場合
                    canvas.width = Math.max(canvas.width * 0.7, 30);
                    canvas.height = Math.max(canvas.height * 0.7, 30);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    compressed = canvas.toDataURL('image/jpeg', 0.05);
                }
                
                console.log(`Emergency compression: ${canvas.width}x${canvas.height}, ${(compressed.length / 1024).toFixed(1)}KB`);
                resolve(compressed);
            };
            img.onerror = () => resolve(''); // エラーの場合は空文字を返す
            img.src = base64String;
        });
    },

    // 古いキャッシュデータのクリーンアップ
    clearOldCacheData() {
        const keysToCheck = ['latest_updates', 'temp_images', 'cache_', 'backup_'];
        let clearedKeys = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && keysToCheck.some(prefix => key.startsWith(prefix))) {
                localStorage.removeItem(key);
                clearedKeys++;
            }
        }
        
        if (clearedKeys > 0) {
            console.log(`Cleared ${clearedKeys} cache entries`);
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

// Supabase初期化（即座に実行）
(function initializeSupabase() {
    const SUPABASE_URL = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

    // Supabase CDNライブラリを動的に読み込み
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.js';
    script.onload = function() {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized in common.js');
            window.dispatchEvent(new CustomEvent('supabase-ready'));
        } else {
            console.error('❌ Supabase library loaded but createClient not found');
        }
    };
    script.onerror = function() {
        console.error('❌ Failed to load Supabase library from CDN');
    };
    document.head.appendChild(script);
})();

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('LIFE X Common JS loaded');
});