// 新規プラン追加モーダル JavaScript
function planModalComponent() {
    return {
        showModal: false,
        editingPlan: null,
        saving: false,

        // セクション開閉状態
        sections: {
            price: false,
            features: false,
            documents: true // デフォルト開く
        },

        // フォームデータ
        formData: {
            planCode: '',
            stories: '',
            ldkFloor: '',
            wetAreaFloors: [],
            tsubo: '',
            width: '',
            depth: '',
            layout: '',
            status: 'draft',

            // 価格情報
            sellPrice: '',
            cost: '',

            // 特徴タグ
            featureTags: {
                living: [],
                storage: [],
                exterior: []
            },

            // 図面ファイル
            documents: {
                application: [],
                structure: [],
                precut: []
            },

            // その他追加ファイル
            extraFiles: []
        },

        // フォームエラー
        formErrors: {},

        // 計算値
        calculatedProfit: 0,

        // 階数オプション
        floorOptions: [],

        // タグカテゴリ
        tagCategories: {
            living: ['吹抜', 'フリースペース', '書斎', '畳スペース', 'ヌック', 'ロフト'],
            storage: ['パントリー', 'ウォークインクローゼット', 'シューズクローク', 'ファミリークローク', 'リビング収納', '小屋裏収納'],
            exterior: ['バルコニー', 'ウッドデッキ', 'ガレージ', 'カーポート', '庫裏']
        },

        // 初期化
        init() {
            // Alpine.js x-collapse プラグインを確認
            if (!Alpine.plugin) {
                console.warn('Alpine Collapse plugin is not loaded');
            }

            // ESCキーでモーダルを閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.showModal) {
                    this.closeModal();
                }
            });
        },

        // モーダルを開く
        openModal(plan = null) {
            this.editingPlan = plan;

            if (plan) {
                // 編集モード
                this.loadPlanData(plan);
            } else {
                // 新規作成モード
                this.resetForm();
            }

            this.showModal = true;
            document.body.style.overflow = 'hidden';
        },

        // モーダルを閉じる
        closeModal() {
            this.showModal = false;
            this.editingPlan = null;
            this.resetForm();
            document.body.style.overflow = 'auto';
        },

        // フォームリセット
        resetForm() {
            this.formData = {
                planCode: '',
                stories: '',
                ldkFloor: '',
                wetAreaFloors: [],
                tsubo: '',
                width: '',
                depth: '',
                layout: '',
                status: 'draft',
                sellPrice: '',
                cost: '',
                featureTags: {
                    living: [],
                    storage: [],
                    exterior: []
                },
                documents: {
                    application: [],
                    structure: [],
                    precut: []
                },
                extraFiles: []
            };

            this.formErrors = {};
            this.calculatedProfit = 0;
            this.floorOptions = [];

            // セクションをデフォルト状態に
            this.sections = {
                price: false,
                features: false,
                documents: true
            };
        },

        // 既存データ読み込み
        loadPlanData(plan) {
            this.formData = {
                planCode: plan.id || plan.planCode || '',
                stories: plan.floors || plan.stories || '',
                ldkFloor: plan.ldkFloor || '',
                wetAreaFloors: plan.wetAreaFloors || [],
                tsubo: plan.tsubo || '',
                width: plan.width || '',
                depth: plan.depth || '',
                layout: plan.layout || '',
                status: plan.status || 'draft',
                sellPrice: plan.sellPrice || '',
                cost: plan.cost || '',
                featureTags: plan.featureTags || {
                    living: [],
                    storage: [],
                    exterior: []
                },
                documents: plan.documents || {
                    application: [],
                    structure: [],
                    precut: []
                },
                extraFiles: plan.extraFiles || []
            };

            this.updateFloorOptions();
            this.calculateProfit();
        },

        // プランコードバリデーション
        async validatePlanCode() {
            const code = this.formData.planCode;

            if (!code) {
                this.formErrors.planCode = 'プランコードは必須です';
                return false;
            }

            if (!/^[A-Za-z0-9-]+$/.test(code)) {
                this.formErrors.planCode = '英数字とハイフンのみ使用できます';
                return false;
            }

            // 重複チェック (Supabase APIコール)
            await this.checkDuplicatePlanCode(code);

            if (this.formErrors.planCode) {
                return false;
            }

            delete this.formErrors.planCode;
            return true;
        },

        // プランコード重複チェック
        async checkDuplicatePlanCode(code) {
            try {
                const sb = await window.sbReady;

                // Supabaseでプランコードを検索
                const { data, error } = await sb
                    .from('plans')
                    .select('id, plan_code')
                    .eq('plan_code', code)
                    .limit(1);

                if (error) {
                    console.error('重複チェックエラー:', error);
                    return;
                }

                if (data && data.length > 0) {
                    // 重複が見つかった場合
                    this.formErrors.planCode = 'このプランコードは既に使用されています';
                } else {
                    // 重複なし
                    delete this.formErrors.planCode;
                }
            } catch (err) {
                console.error('重複チェック例外:', err);
            }
        },

        // 階数変更時の処理
        updateFloorOptions() {
            const stories = parseInt(this.formData.stories);

            if (stories) {
                this.floorOptions = Array.from({length: stories}, (_, i) => i + 1);

                // 選択済みの階数が範囲外の場合はリセット
                if (this.formData.ldkFloor > stories) {
                    this.formData.ldkFloor = '';
                }

                this.formData.wetAreaFloors = this.formData.wetAreaFloors.filter(f => f <= stories);
            } else {
                this.floorOptions = [];
            }
        },

        // 水廻り階数トグル
        toggleWetAreaFloor(floor) {
            const index = this.formData.wetAreaFloors.indexOf(floor);

            if (index > -1) {
                this.formData.wetAreaFloors.splice(index, 1);
            } else {
                this.formData.wetAreaFloors.push(floor);
            }
        },

        // 利益計算
        calculateProfit() {
            const sellPrice = parseFloat(this.formData.sellPrice) || 0;
            const cost = parseFloat(this.formData.cost) || 0;

            // 税込販売価格から税抜価格に変換
            const sellPriceTaxExcluded = sellPrice / 1.1;

            // 粗利益計算
            this.calculatedProfit = Math.round((sellPriceTaxExcluded - cost) * 10) / 10;
        },

        // タグトグル
        toggleTag(category, tag) {
            const tags = this.formData.featureTags[category];
            const index = tags.indexOf(tag);

            if (index > -1) {
                tags.splice(index, 1);
            } else {
                tags.push(tag);
            }
        },

        // ファイル選択処理
        handleFileSelect(event, category) {
            const files = Array.from(event.target.files);

            files.forEach(file => {
                // ファイルサイズチェック
                if (file.size > 200 * 1024 * 1024) {
                    alert(`${file.name} はファイルサイズが200MBを超えています`);
                    return;
                }

                // ファイル情報を保存
                this.formData.documents[category].push({
                    id: this.generateFileId(),
                    originalName: file.name,
                    displayName: file.name.replace(/\.[^/.]+$/, ''), // 拡張子を除いた名前
                    size: file.size,
                    type: file.type,
                    file: file // 実際のFileオブジェクト
                });
            });

            // inputをリセット
            event.target.value = '';
        },

        // ドラッグ&ドロップ処理
        handleDrop(event, category) {
            event.preventDefault();

            const files = Array.from(event.dataTransfer.files);

            files.forEach(file => {
                // ファイルサイズチェック
                if (file.size > 200 * 1024 * 1024) {
                    alert(`${file.name} はファイルサイズが200MBを超えています`);
                    return;
                }

                this.formData.documents[category].push({
                    id: this.generateFileId(),
                    originalName: file.name,
                    displayName: file.name.replace(/\.[^/.]+$/, ''),
                    size: file.size,
                    type: file.type,
                    file: file
                });
            });
        },

        // ファイル削除
        removeFile(category, index) {
            this.formData.documents[category].splice(index, 1);
        },

        // その他追加ファイル行を追加
        addExtraFileRow() {
            this.formData.extraFiles.push({
                label: '',
                files: []
            });
        },

        // その他追加ファイル行を削除
        removeExtraFileRow(index) {
            this.formData.extraFiles.splice(index, 1);
        },

        // その他ファイル選択
        handleExtraFileSelect(event, index) {
            const files = Array.from(event.target.files);

            files.forEach(file => {
                this.formData.extraFiles[index].files.push({
                    id: this.generateFileId(),
                    name: file.name,
                    size: file.size,
                    file: file
                });
            });

            event.target.value = '';
        },

        // その他ファイルのドロップ
        handleExtraDrop(event, index) {
            event.preventDefault();

            const files = Array.from(event.dataTransfer.files);

            files.forEach(file => {
                this.formData.extraFiles[index].files.push({
                    id: this.generateFileId(),
                    name: file.name,
                    size: file.size,
                    file: file
                });
            });
        },

        // その他ファイル削除
        removeExtraFile(rowIndex, fileIndex) {
            this.formData.extraFiles[rowIndex].files.splice(fileIndex, 1);
        },

        // ファイルID生成
        generateFileId() {
            return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        // フォームバリデーション
        isFormValid() {
            // 必須項目チェック
            if (!this.formData.planCode) return false;
            if (!this.formData.stories) return false;
            if (!this.formData.tsubo) return false;
            if (!this.formData.width) return false;
            if (!this.formData.depth) return false;
            if (!this.formData.layout) return false;
            if (!this.formData.sellPrice) return false;
            if (!this.formData.cost) return false;

            // プランコード形式チェック
            if (!/^[A-Za-z0-9-]+$/.test(this.formData.planCode)) return false;

            return true;
        },

        // 下書き保存
        async saveDraft() {
            this.formData.status = 'draft';
            await this.savePlan();
        },

        // 保存処理
        async savePlan() {
            if (!this.isFormValid()) {
                // エラー表示
                this.showValidationErrors();
                return;
            }

            this.saving = true;

            try {
                // FormDataオブジェクト作成 (ファイルアップロード用)
                const formData = new FormData();

                // 基本データ
                const planData = {
                    planCode: this.formData.planCode,
                    stories: parseInt(this.formData.stories),
                    ldkFloor: parseInt(this.formData.ldkFloor) || null,
                    wetAreaFloors: this.formData.wetAreaFloors,
                    tsubo: parseFloat(this.formData.tsubo),
                    width: parseInt(this.formData.width),
                    depth: parseInt(this.formData.depth),
                    layout: this.formData.layout,
                    status: this.formData.status,
                    priceInfo: {
                        sell: parseFloat(this.formData.sellPrice) * 10000, // 万円→円
                        cost: parseFloat(this.formData.cost) * 10000,
                        gross: this.calculatedProfit * 10000
                    },
                    featureTags: this.formData.featureTags
                };

                formData.append('data', JSON.stringify(planData));

                // ファイルアップロード
                ['application', 'structure', 'precut'].forEach(category => {
                    this.formData.documents[category].forEach((doc, index) => {
                        if (doc.file) {
                            formData.append(`documents.${category}[${index}]`, doc.file);
                            formData.append(`documents.${category}[${index}].displayName`, doc.displayName);
                        }
                    });
                });

                // その他ファイル
                this.formData.extraFiles.forEach((extra, i) => {
                    if (extra.label && extra.files.length > 0) {
                        formData.append(`extraFiles[${i}].label`, extra.label);
                        extra.files.forEach((file, j) => {
                            if (file.file) {
                                formData.append(`extraFiles[${i}].files[${j}]`, file.file);
                            }
                        });
                    }
                });

                // API送信
                const url = this.editingPlan
                    ? `/api/plans/${this.editingPlan.id}`
                    : '/api/plans';

                const method = this.editingPlan ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('保存に失敗しました');
                }

                const result = await response.json();

                // 成功通知
                this.showSuccessMessage();

                // モーダルを閉じる
                this.closeModal();

                // リスト更新
                this.$dispatch('plans-updated');

            } catch (error) {
                console.error('Save error:', error);
                alert('保存中にエラーが発生しました: ' + error.message);
            } finally {
                this.saving = false;
            }
        },

        // バリデーションエラー表示
        showValidationErrors() {
            // 必須項目チェック
            const requiredFields = {
                planCode: 'プランコード',
                stories: '階数',
                tsubo: '坪数',
                width: '間口',
                depth: '奥行',
                layout: '間取り',
                sellPrice: '想定販売価格',
                cost: '想定原価'
            };

            let hasError = false;

            Object.entries(requiredFields).forEach(([key, label]) => {
                if (!this.formData[key]) {
                    this.formErrors[key] = `${label}は必須です`;
                    hasError = true;
                }
            });

            if (hasError) {
                // 基本情報セクションを開く
                this.sections = { ...this.sections, price: true };

                // エラー位置までスクロール
                setTimeout(() => {
                    const firstError = document.querySelector('.border-red-500');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstError.focus();
                    }
                }, 100);
            }
        },

        // 成功メッセージ表示
        showSuccessMessage() {
            // トースト通知など
            if (window.lifeXAPI && window.lifeXAPI.showToast) {
                window.lifeXAPI.showToast(
                    this.editingPlan ? 'プランを更新しました' : '新規プランを作成しました',
                    'success'
                );
            }
        }
    };
}