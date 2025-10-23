// Supabase API Service Layer
import { supabase, handleError } from './supabase-client.js';

// ===========================================
// プラン関連API
// ===========================================
export const plansAPI = {
    // 全プラン取得
    async getAllPlans() {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching plans:', handleError(error));
            return [];
        }
    },

    // プラン検索
    async searchPlans(filters = {}) {
        try {
            let query = supabase
                .from('plans')
                .select('*');

            // 坪数フィルタ
            if (filters.tsuboMin) {
                query = query.gte('tsubo', filters.tsuboMin);
            }
            if (filters.tsuboMax) {
                query = query.lte('tsubo', filters.tsuboMax);
            }

            // 間口フィルタ
            if (filters.maguchiMin || filters.widthMin) {
                query = query.gte('maguchi', filters.maguchiMin || filters.widthMin);
            }
            if (filters.maguchiMax || filters.widthMax) {
                query = query.lte('maguchi', filters.maguchiMax || filters.widthMax);
            }

            // 奥行フィルタ
            if (filters.okuYukiMin || filters.depthMin) {
                query = query.gte('oku_yuki', filters.okuYukiMin || filters.depthMin);
            }
            if (filters.okuYukiMax || filters.depthMax) {
                query = query.lte('oku_yuki', filters.okuYukiMax || filters.depthMax);
            }

            // カテゴリフィルタ
            if (filters.category || filters.plan_category) {
                query = query.eq('plan_category', filters.category || filters.plan_category);
            }

            // サブカテゴリフィルタ
            if (filters.plan_sub_category) {
                query = query.eq('plan_sub_category', filters.plan_sub_category);
            }

            // キーワード検索（プラン名または備考）
            if (filters.keyword) {
                query = query.or(`plan_name.ilike.%${filters.keyword}%,remarks.ilike.%${filters.keyword}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching plans:', handleError(error));
            return [];
        }
    },

    // 単一プラン取得
    async getPlanById(planId) {
        try {
            const { data, error} = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching plan:', handleError(error));
            return null;
        }
    },

    // プラン名で取得
    async getPlanByName(planName) {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('plan_name', planName)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching plan by name:', handleError(error));
            return null;
        }
    },

    // プラン作成
    async createPlan(planData) {
        try {
            const { data, error } = await supabase
                .from('plans')
                .insert([planData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // プラン更新
    async updatePlan(planId, updates) {
        try {
            const { data, error } = await supabase
                .from('plans')
                .update(updates)
                .eq('id', planId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // プラン画像アップロード
    async uploadPlanImage(planId, file, type) {
        try {
            const fileName = `${planId}/${type}_${Date.now()}_${file.name}`;

            // Storage にアップロード
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('plan-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // URLを取得
            const { data: { publicUrl } } = supabase.storage
                .from('plan-images')
                .getPublicUrl(fileName);

            // データベースに保存
            const { data, error } = await supabase
                .from('plan_images')
                .insert([{
                    plan_id: planId,
                    type: type,
                    url: publicUrl,
                    file_name: file.name,
                    file_size: file.size,
                    mime_type: file.type
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // プラン削除（ソフトデリート）
    async deletePlan(planId) {
        try {
            // ソフトデリート: statusを'deleted'に変更
            const { data, error } = await supabase
                .from('plans')
                .update({
                    status: 'deleted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', planId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // プラン完全削除（ハードデリート）※管理者専用
    async hardDeletePlan(planId) {
        try {
            // ハードデリート: レコードを完全削除
            // 注意: CASCADE設定により、関連する plan_images, matrix_cells なども削除される
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// ===========================================
// 間取マトリックス関連API
// ===========================================
export const matrixAPI = {
    // マトリックス設定取得
    async getMatrixSettings() {
        try {
            const { data, error } = await supabase
                .from('matrix_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || { width_ranges: [], depth_ranges: [] };
        } catch (error) {
            console.error('Error fetching matrix settings:', handleError(error));
            return { width_ranges: [], depth_ranges: [] };
        }
    },

    // マトリックスセル取得
    async getMatrixCells() {
        try {
            const { data, error } = await supabase
                .from('matrix_cells')
                .select(`
                    *,
                    plans!inner(
                        *,
                        plan_images(*)
                    )
                `)
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching matrix cells:', handleError(error));
            return [];
        }
    },

    // マトリックスセル更新
    async updateMatrixCell(cellId, planId) {
        try {
            const { data, error } = await supabase
                .from('matrix_cells')
                .update({ plan_id: planId })
                .eq('id', cellId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// ===========================================
// デザインカテゴリ関連API
// ===========================================
export const designAPI = {
    // デザインカテゴリ取得
    async getDesignCategories(type = null) {
        try {
            let query = supabase
                .from('design_categories')
                .select('*')
                .eq('status', 'active')
                .order('display_order');

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching design categories:', handleError(error));
            return [];
        }
    },

    // カテゴリ別プラン取得
    async getPlansByDesignCategory(categoryId) {
        try {
            const { data, error } = await supabase
                .from('plan_design_categories')
                .select(`
                    plans!inner(
                        *,
                        plan_images(*)
                    )
                `)
                .eq('category_id', categoryId);

            if (error) throw error;
            return data.map(item => item.plans);
        } catch (error) {
            console.error('Error fetching plans by design:', handleError(error));
            return [];
        }
    }
};

// ===========================================
// ルール関連API
// ===========================================
export const rulesAPI = {
    // ルールカテゴリ取得
    async getRuleCategories() {
        try {
            const { data, error } = await supabase
                .from('rule_categories')
                .select(`
                    *,
                    rules(*)
                `)
                .eq('status', 'active')
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching rule categories:', handleError(error));
            return [];
        }
    },

    // ルール検索
    async searchRules(keyword) {
        try {
            const { data, error } = await supabase
                .from('rules')
                .select(`
                    *,
                    rule_categories(name)
                `)
                .eq('status', 'active')
                .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching rules:', handleError(error));
            return [];
        }
    },

    // ルール作成
    async createRule(ruleData) {
        try {
            const { data, error } = await supabase
                .from('rules')
                .insert([ruleData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ルール更新
    async updateRule(ruleId, updates) {
        try {
            const { data, error } = await supabase
                .from('rules')
                .update(updates)
                .eq('id', ruleId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ルール削除
    async deleteRule(ruleId) {
        try {
            const { error } = await supabase
                .from('rules')
                .delete()
                .eq('id', ruleId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ルールカテゴリ作成
    async createRuleCategory(categoryData) {
        try {
            const { data, error } = await supabase
                .from('rule_categories')
                .insert([categoryData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ルールカテゴリ更新
    async updateRuleCategory(categoryId, updates) {
        try {
            const { data, error } = await supabase
                .from('rule_categories')
                .update(updates)
                .eq('id', categoryId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ルールカテゴリ削除
    async deleteRuleCategory(categoryId) {
        try {
            const { error } = await supabase
                .from('rule_categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// ===========================================
// ダウンロード関連API
// ===========================================
export const downloadsAPI = {
    // ダウンロード資料取得
    async getDownloads(categoryId = null) {
        try {
            let query = supabase
                .from('downloads')
                .select(`
                    *,
                    download_categories(name)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching downloads:', handleError(error));
            return [];
        }
    },

    // ダウンロードカテゴリ取得
    async getDownloadCategories() {
        try {
            const { data, error } = await supabase
                .from('download_categories')
                .select('*')
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching download categories:', handleError(error));
            return [];
        }
    },

    // ダウンロード記録
    async recordDownload(downloadId, userId = null) {
        try {
            // ダウンロード数をインクリメント
            await supabase.rpc('increment_download_count', { download_id: downloadId });

            // 履歴を記録
            const { error } = await supabase
                .from('download_history')
                .insert([{
                    download_id: downloadId,
                    user_id: userId,
                    user_agent: navigator.userAgent
                }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error recording download:', handleError(error));
            return { success: false, error: handleError(error) };
        }
    },

    // ファイルアップロード
    async uploadFile(file, category) {
        try {
            const fileName = `${category}/${Date.now()}_${file.name}`;

            // Storage にアップロード
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('downloads')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // URLを取得
            const { data: { publicUrl } } = supabase.storage
                .from('downloads')
                .getPublicUrl(fileName);

            return { success: true, url: publicUrl };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ダウンロード作成
    async createDownload(downloadData) {
        try {
            const { data, error } = await supabase
                .from('downloads')
                .insert([downloadData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ダウンロード更新
    async updateDownload(downloadId, updates) {
        try {
            const { data, error } = await supabase
                .from('downloads')
                .update(updates)
                .eq('id', downloadId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ダウンロード削除
    async deleteDownload(downloadId) {
        try {
            const { error } = await supabase
                .from('downloads')
                .delete()
                .eq('id', downloadId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// ===========================================
// FAQ関連API
// ===========================================
export const faqAPI = {
    // FAQ取得
    async getFAQs(categoryId = null) {
        try {
            let query = supabase
                .from('faqs')
                .select(`
                    *,
                    faq_categories(name)
                `)
                .eq('status', 'published')
                .order('display_order');

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching FAQs:', handleError(error));
            return [];
        }
    },

    // FAQカテゴリ取得
    async getFAQCategories() {
        try {
            const { data, error } = await supabase
                .from('faq_categories')
                .select('*')
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching FAQ categories:', handleError(error));
            return [];
        }
    },

    // FAQ検索
    async searchFAQs(keyword) {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select(`
                    *,
                    faq_categories(name)
                `)
                .eq('status', 'published')
                .or(`question.ilike.%${keyword}%,answer.ilike.%${keyword}%`)
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching FAQs:', handleError(error));
            return [];
        }
    },

    // FAQ作成
    async create(faqData) {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .insert([{
                    question: faqData.question,
                    answer: faqData.answer,
                    category_id: faqData.category_id || null,
                    tags: faqData.tags || [],
                    status: faqData.status || 'published',
                    display_order: faqData.display_order || 0
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // FAQ更新
    async update(faqId, updates) {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .update(updates)
                .eq('id', faqId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // FAQ削除
    async delete(faqId) {
        try {
            const { error } = await supabase
                .from('faqs')
                .delete()
                .eq('id', faqId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // FAQ評価送信
    async submitFeedback(faqId, isHelpful, comment = null) {
        try {
            const { error } = await supabase
                .from('faq_feedback')
                .insert([{
                    faq_id: faqId,
                    is_helpful: isHelpful,
                    comment: comment
                }]);

            if (error) throw error;

            // helpful_countを更新
            if (isHelpful) {
                await supabase.rpc('increment_helpful_count', { faq_id: faqId });
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // FAQ閲覧数インクリメント
    async incrementViewCount(faqId) {
        try {
            await supabase.rpc('increment_view_count', { faq_id: faqId });
            return { success: true };
        } catch (error) {
            console.error('Error incrementing view count:', handleError(error));
            return { success: false };
        }
    }
};

// ===========================================
// ユーザー管理API
// ===========================================
export const usersAPI = {
    // ユーザー情報取得
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', handleError(error));
            return null;
        }
    },

    // ユーザー情報更新
    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('auth_id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // アクティビティログ記録
    async logActivity(action, targetType = null, targetId = null, details = {}) {
        try {
            const user = await supabase.auth.getUser();
            const userId = user?.data?.user?.id;

            const { error } = await supabase
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    action: action,
                    target_type: targetType,
                    target_id: targetId,
                    details: details,
                    user_agent: navigator.userAgent
                }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error logging activity:', handleError(error));
            return { success: false };
        }
    }
};

// ===========================================
// システム設定API
// ===========================================
export const systemAPI = {
    // システム設定取得
    async getSettings(key = null) {
        try {
            let query = supabase
                .from('system_settings')
                .select('*');

            if (key) {
                query = query.eq('key', key).single();
            }

            const { data, error } = await query;

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error fetching system settings:', handleError(error));
            return null;
        }
    },

    // システム設定更新
    async updateSetting(key, value) {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .upsert([{
                    key: key,
                    value: value,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// デフォルトエクスポート
export default {
    plansAPI,
    matrixAPI,
    designAPI,
    rulesAPI,
    downloadsAPI,
    faqAPI,
    usersAPI,
    systemAPI
};