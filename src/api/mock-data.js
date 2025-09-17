// APIモックデータ
const mockData = {
    faq: [
        {
            id: 1,
            category: "料金について",
            question: "LIFE Xの導入費用はいくらですか？",
            answer: "初期導入費用は無料です。月額利用料のみでご利用いただけます。"
        },
        {
            id: 2,
            category: "プランについて",
            question: "プランのカスタマイズは可能ですか？",
            answer: "はい、お客様のニーズに合わせてカスタマイズ可能です。"
        }
    ],
    plans: [
        {
            id: "LX-030A",
            planCode: "LX-030A",
            stories: 2,
            tsubo: 30,
            width: 5460,
            depth: 9100,
            layout: "3LDK",
            sellPrice: 25000000,
            cost: 18000000,
            status: "published",
            tags: ["吹抜", "パントリー", "ウォークインクローゼット"]
        },
        {
            id: "LX-033B",
            planCode: "LX-033B",
            stories: 2,
            tsubo: 33,
            width: 6370,
            depth: 9100,
            layout: "4LDK",
            sellPrice: 27000000,
            cost: 19500000,
            status: "published",
            tags: ["書斎", "シューズクローク", "バルコニー"]
        },
        {
            id: "LX-035C",
            planCode: "LX-035C",
            stories: 2,
            tsubo: 35,
            width: 6825,
            depth: 9100,
            layout: "4LDK",
            sellPrice: 28500000,
            cost: 20500000,
            status: "draft",
            tags: ["吹抜", "書斎", "パントリー", "ウッドデッキ"]
        }
    ],
    users: [
        {
            id: 1,
            name: "山田太郎",
            company: "山田工務店",
            email: "yamada@example.com",
            role: "admin"
        },
        {
            id: 2,
            name: "佐藤花子",
            company: "佐藤建設",
            email: "sato@example.com",
            role: "user"
        }
    ]
};

// グローバル変数として公開
window.mockAPI = mockData;