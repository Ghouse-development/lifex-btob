const https = require('https');

const BASE_URL = 'https://lifex-btob.vercel.app';
const API_URL = `${BASE_URL}/api/gemini-chat`;

const testQuestions = [
    {
        question: 'LIFE Xのプランは何種類ありますか？',
        expectedKeywords: ['プラン', '登録', '件']
    },
    {
        question: 'FAQはいくつ登録されていますか？',
        expectedKeywords: ['FAQ', '登録', '件']
    },
    {
        question: 'ダウンロードできる資料はありますか？',
        expectedKeywords: ['ダウンロード', '資料', '件']
    },
    {
        question: 'プランの変更はできますか？',
        expectedKeywords: ['規格住宅', '変更', '担当者', '確認']
    }
];

async function askQuestion(question) {
    console.log(`\n📝 質問: ${question}\n`);

    const postData = JSON.stringify({ message: question });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(API_URL, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);

                    if (res.statusCode === 200 && jsonData.success) {
                        console.log(`✅ 回答:\n${jsonData.response}\n`);
                        console.log(`📊 モデル: ${jsonData.model}`);
                        resolve({ success: true, response: jsonData.response });
                    } else {
                        console.log(`❌ エラー: ${jsonData.error || jsonData.message}`);
                        resolve({ success: false, error: jsonData.error });
                    }
                } catch (e) {
                    console.log(`❌ JSONパースエラー: ${e.message}`);
                    console.log(`レスポンス: ${data}`);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ リクエストエラー: ${error.message}`);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 AI正確性テスト開始\n');
    console.log(`📍 API URL: ${API_URL}\n`);
    console.log('='.repeat(80));

    let passCount = 0;
    let failCount = 0;

    for (const test of testQuestions) {
        try {
            const result = await askQuestion(test.question);

            if (result.success) {
                // キーワードチェック
                const response = result.response.toLowerCase();
                const matchedKeywords = test.expectedKeywords.filter(keyword =>
                    response.includes(keyword.toLowerCase())
                );

                if (matchedKeywords.length > 0) {
                    console.log(`✅ 期待キーワード検出: ${matchedKeywords.join(', ')}`);
                    passCount++;
                } else {
                    console.log(`⚠️  期待キーワードが見つかりませんでした`);
                    console.log(`   期待: ${test.expectedKeywords.join(', ')}`);
                    failCount++;
                }
            } else {
                failCount++;
            }

            console.log('='.repeat(80));

            // 次の質問まで少し待機
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`💥 テスト失敗: ${error.message}`);
            failCount++;
        }
    }

    console.log(`\n\n📊 テスト結果:`);
    console.log(`   ✅ 成功: ${passCount}/${testQuestions.length}`);
    console.log(`   ❌ 失敗: ${failCount}/${testQuestions.length}`);

    if (failCount === 0) {
        console.log(`\n🎉 すべてのテストに合格しました！`);
    } else {
        console.log(`\n⚠️  一部のテストが失敗しました。`);
    }
}

runTests().catch(console.error);
