const https = require('https');

// Gemini APIキーを環境変数から取得（またはここに直接設定）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY環境変数が設定されていません');
    console.log('   使用方法: GEMINI_API_KEY=your_key node scripts/list-gemini-models.cjs');
    process.exit(1);
}

async function listModels() {
    console.log('\n📋 利用可能なGemini AIモデルを確認中...\n');

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`❌ エラー: HTTP ${res.statusCode}`);
                    console.error(data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);

                    if (jsonData.models && jsonData.models.length > 0) {
                        console.log(`✅ ${jsonData.models.length}個のモデルが利用可能です:\n`);

                        jsonData.models.forEach((model, index) => {
                            console.log(`${index + 1}. ${model.name}`);
                            console.log(`   Display Name: ${model.displayName || 'N/A'}`);
                            console.log(`   Description: ${model.description || 'N/A'}`);

                            if (model.supportedGenerationMethods) {
                                console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
                            }

                            console.log('');
                        });

                        // generateContentをサポートするモデルをフィルタ
                        const contentGenModels = jsonData.models.filter(m =>
                            m.supportedGenerationMethods &&
                            m.supportedGenerationMethods.includes('generateContent')
                        );

                        console.log('\n🎯 generateContentをサポートするモデル:');
                        contentGenModels.forEach(m => {
                            console.log(`   - ${m.name}`);
                        });
                    } else {
                        console.log('⚠️ モデルが見つかりませんでした');
                    }

                    resolve();
                } catch (e) {
                    console.error('❌ JSONパースエラー:', e.message);
                    console.error(data);
                    reject(e);
                }
            });
        }).on('error', (error) => {
            console.error('❌ リクエストエラー:', error.message);
            reject(error);
        });
    });
}

listModels().catch(error => {
    console.error('\n💥 実行失敗:', error);
    process.exit(1);
});
