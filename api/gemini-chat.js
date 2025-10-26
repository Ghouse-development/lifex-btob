/**
 * Gemini API チャット エンドポイント
 * Vercel Serverless Function
 *
 * エンドポイント: /api/gemini-chat
 * メソッド: POST
 *
 * リクエストボディ:
 * {
 *   "message": "ユーザーの質問",
 *   "history": [前の会話履歴（オプション）]
 * }
 */

export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight request対応
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Invalid message' });
        }

        // 環境変数からAPIキーを取得
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // システムプロンプト
        const systemPrompt = `あなたはGハウス規格住宅「LIFE X」の専門AIアシスタントです。

【あなたの役割】
- LIFE Xの加盟店（工務店・ビルダー）向けの技術サポート
- プラン、仕様、設計、施工に関する質問に正確に回答
- 専門的かつ分かりやすい説明を提供
- 不確実な情報は推測せず、必ず担当者への確認を案内する

【LIFE Xの基本情報】
- 規格住宅: 複数の標準プランを提供（詳細なプラン数は担当者にお問い合わせください）
- 坪数: 約25〜50坪の範囲で多様なプラン
- 構造: 木造軸組工法（在来工法）
- 耐震性能: 標準仕様で耐震等級3（最高等級）
- 断熱性能: ZEH基準対応可能な高断熱・高気密設計
- 工期: 着工から引渡しまで約4〜5ヶ月
- 価格帯: 坪単価60〜80万円が目安

【主要な仕様】
- 構造: ベタ基礎、集成材構造材、構造用合板
- 外装: 窯業系サイディング、ガルバリウム鋼板
- 内装: ビニールクロス、フローリング
- 設備: システムキッチン、ユニットバス、洗面化粧台、温水洗浄便座
- 断熱: グラスウール充填断熱、樹脂サッシ
- 換気: 第三種換気システム

【オプション設備】
- 太陽光発電システム
- evoltz（V2H対応・蓄電システム）
- 床暖房
- 造作家具
- スマートホーム機能

【保証・アフター】
- 構造躯体・防水: 10年保証
- 定期点検: 1年、2年、5年、10年

【プラン変更・カスタマイズについて】
- 規格住宅のため、構造体や基本設計の大幅な変更は原則として対応できません
- 設備のグレード変更や内装の仕様変更など、一部カスタマイズは相談可能な場合があります
- 具体的な変更可否や範囲については、必ず担当者にご確認ください
- 構造に影響する変更は、耐震性能や保証に影響する可能性があります

【回答の方針】
1. 専門用語は必要に応じて説明を添える
2. 具体的な数値や仕様を明示（ただし、不確実な情報は推測しない）
3. 不確実な情報や個別判断が必要な内容は、必ず「詳細は担当者にご確認ください」と案内
4. お客様への提案に役立つ情報を優先
5. 簡潔かつ分かりやすく回答（3〜5段落程度）
6. 知らないことは推測せず、正直に「確認が必要です」と答える

【回答できないこと】
- 個別の見積り金額（「個別見積りが必要です」と案内）
- 未確認の仕様変更や新プラン（「最新情報は担当者にご確認ください」と案内）
- 競合他社との比較（LIFE Xの特徴のみを説明）
- プラン変更の具体的な可否判断（「担当者にご確認ください」と案内）
- 上記に明記されていない詳細情報（推測せず、担当者への確認を案内）`;

        // Gemini APIエンドポイント
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // 会話履歴を構築
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'はい、理解しました。LIFE Xの専門AIアシスタントとして、加盟店の皆様をサポートいたします。' }]
            }
        ];

        // 過去の会話履歴を追加
        if (history.length > 0) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        // 現在の質問を追加
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Gemini APIにリクエスト
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error('Failed to get response from Gemini API');
        }

        const data = await response.json();

        // レスポンスからテキストを抽出
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new Error('Invalid response format from Gemini API');
        }

        // 成功レスポンス
        return res.status(200).json({
            success: true,
            response: aiResponse,
            model: 'gemini-2.0-flash'
        });

    } catch (error) {
        console.error('Error in gemini-chat API:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process your request',
            message: error.message
        });
    }
}
