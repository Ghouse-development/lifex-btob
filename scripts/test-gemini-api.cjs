const https = require('https');

const BASE_URL = 'https://lifex-btob.vercel.app';
const API_URL = `${BASE_URL}/api/gemini-chat`;

async function testGeminiAPI() {
    console.log('\n🧪 Testing Gemini Chat API Endpoint...\n');
    console.log(`📍 URL: ${API_URL}`);

    const testMessage = {
        message: 'こんにちは。テストメッセージです。'
    };

    const postData = JSON.stringify(testMessage);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(API_URL, options, (res) => {
            console.log(`\n📊 Response Status: ${res.statusCode}`);
            console.log(`📋 Response Headers:`, res.headers);

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`\n📄 Response Body:`);
                try {
                    const jsonData = JSON.parse(data);
                    console.log(JSON.stringify(jsonData, null, 2));

                    if (res.statusCode === 200) {
                        console.log('\n✅ API call successful!');
                    } else {
                        console.log(`\n❌ API returned error status: ${res.statusCode}`);
                        if (jsonData.error) {
                            console.log(`   Error message: ${jsonData.error}`);
                        }
                    }
                } catch (e) {
                    console.log(data);
                    console.log('\n⚠️ Response is not valid JSON');
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log('\n❌ Request Error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

testGeminiAPI().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});
