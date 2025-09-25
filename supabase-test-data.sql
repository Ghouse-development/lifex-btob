-- ===========================================
-- LIFE X テストデータ投入SQL
-- Supabase Test Data
-- ===========================================

-- 既存のテストデータをクリア（必要に応じてコメントアウト）
-- TRUNCATE TABLE plans CASCADE;
-- TRUNCATE TABLE faqs CASCADE;
-- TRUNCATE TABLE rules CASCADE;
-- TRUNCATE TABLE downloads CASCADE;

-- ===========================================
-- 1. FAQカテゴリデータ
-- ===========================================
INSERT INTO faq_categories (id, name, description, display_order) VALUES
    ('11111111-1111-1111-1111-111111111111', 'プランについて', 'プランに関するよくある質問', 1),
    ('22222222-2222-2222-2222-222222222222', '契約・価格について', '契約や価格に関するよくある質問', 2),
    ('33333333-3333-3333-3333-333333333333', '施工について', '施工に関するよくある質問', 3),
    ('44444444-4444-4444-4444-444444444444', 'アフターサービス', 'アフターサービスに関するよくある質問', 4),
    ('55555555-5555-5555-5555-555555555555', 'その他', 'その他のよくある質問', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- ===========================================
-- 2. FAQテストデータ
-- ===========================================
INSERT INTO faqs (question, answer, category_id, status, display_order, view_count, helpful_count) VALUES
    ('プランの変更は可能ですか？', '契約前であればプランの変更は可能です。お客様のご要望に応じて、間取りの変更や設備のグレードアップなど、柔軟に対応させていただきます。詳しくは担当者にご相談ください。', '11111111-1111-1111-1111-111111111111', 'published', 1, 150, 45),
    ('標準プランから変更した場合、追加費用はどのくらいかかりますか？', '変更内容により異なりますが、一般的な変更であれば50万円～200万円程度の追加費用となることが多いです。具体的な金額は、変更内容を確認した上でお見積もりいたします。', '22222222-2222-2222-2222-222222222222', 'published', 2, 230, 67),
    ('着工から完成までどのくらいの期間がかかりますか？', '標準的な2階建て住宅の場合、着工から完成まで約4～5ヶ月程度です。天候や仕様変更により前後する場合があります。詳細な工程表は着工前にお渡しします。', '33333333-3333-3333-3333-333333333333', 'published', 3, 189, 52),
    ('建築中の現場見学は可能ですか？', 'はい、可能です。安全確保のため事前予約制となっておりますが、お客様のご都合に合わせて現場見学の日程を調整させていただきます。', '33333333-3333-3333-3333-333333333333', 'published', 4, 145, 38),
    ('引き渡し後の保証期間はどのくらいですか？', '構造躯体は10年間、防水は10年間、その他の部分は2年間の保証をお付けしています。また、定期点検サービスも実施しており、6ヶ月、1年、2年、5年、10年の節目で点検を行います。', '44444444-4444-4444-4444-444444444444', 'published', 5, 312, 89),
    ('アフターメンテナンスの対応時間は？', '平日9:00～18:00、土曜日9:00～17:00で対応しております。緊急を要する場合は、24時間対応のコールセンターもご利用いただけます。', '44444444-4444-4444-4444-444444444444', 'published', 6, 198, 61),
    ('住宅ローンの相談もできますか？', 'はい、提携金融機関のご紹介や、ローンアドバイザーによる無料相談サービスを行っております。お客様に最適な資金計画をご提案させていただきます。', '55555555-5555-5555-5555-555555555555', 'published', 7, 267, 78),
    ('土地探しから相談できますか？', '土地探しからお手伝いさせていただきます。ご希望のエリアや予算に応じて、最適な土地をご提案いたします。土地と建物のトータルプランニングが可能です。', '55555555-5555-5555-5555-555555555555', 'published', 8, 234, 71),
    ('見積もりは無料ですか？', 'はい、お見積もりは無料です。プランのご相談から概算見積もり、詳細見積もりまで、費用はいただいておりません。', '22222222-2222-2222-2222-222222222222', 'published', 9, 356, 92),
    ('モデルハウスの見学はできますか？', '各地にモデルハウスをご用意しております。実際の住まいをご体感いただけます。見学は予約制となっておりますので、事前にご連絡ください。', '55555555-5555-5555-5555-555555555555', 'published', 10, 178, 43);

-- ===========================================
-- 3. ルールカテゴリデータ
-- ===========================================
INSERT INTO rule_categories (id, name, description, icon, display_order, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '営業ルール', '営業活動に関するルールとガイドライン', '💼', 1, 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '施工ルール', '施工に関するルールと注意事項', '🔨', 2, 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '品質管理', '品質管理に関するルール', '✅', 3, 'active'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '安全管理', '安全管理に関するルール', '⚠️', 4, 'active'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '顧客対応', '顧客対応に関するルール', '🤝', 5, 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status;

-- ===========================================
-- 4. ルールテストデータ
-- ===========================================
INSERT INTO rules (category_id, title, content, priority, status, display_order) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '初回訪問時の対応', '初回訪問時は必ず会社パンフレットと名刺を持参し、丁寧な挨拶から始めること。お客様の要望を十分にヒアリングし、押し売りは厳禁。', 'high', 'active', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '見積書の作成期限', '見積依頼を受けてから3営業日以内に提出すること。やむを得ず遅れる場合は、必ず事前にお客様に連絡を入れる。', 'high', 'active', 2),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '着工前の近隣挨拶', '着工の1週間前までに、施工現場の近隣住民への挨拶回りを必ず実施すること。工事期間と作業時間を明確に伝える。', 'high', 'active', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '作業時間の厳守', '作業時間は平日8:00～18:00、土曜日8:00～17:00とする。日曜・祝日の作業は原則禁止。', 'normal', 'active', 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '検査記録の保管', 'すべての検査記録は、デジタルと紙の両方で5年間保管すること。お客様から要求があれば速やかに開示する。', 'high', 'active', 1),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '材料の品質確認', '使用する材料は必ず納品時に品質証明書を確認し、不良品は即座に交換を要求すること。', 'normal', 'active', 2),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ヘルメットの着用', '現場内では必ずヘルメットを着用すること。来客者にも必ずヘルメットを貸与する。', 'high', 'active', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '高所作業の安全確保', '2m以上の高所作業時は必ず安全帯を着用し、2人以上で作業を行うこと。', 'high', 'active', 2),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'クレーム対応の初動', 'クレームを受けた場合、24時間以内に上司に報告し、48時間以内にお客様に初回対応を行うこと。', 'high', 'active', 1),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '電話応対のマナー', '電話は3コール以内に出ること。社名と自分の名前を明確に名乗り、丁寧な言葉遣いを心がける。', 'normal', 'active', 2);

-- ===========================================
-- 5. ダウンロードカテゴリデータ
-- ===========================================
INSERT INTO download_categories (id, name, description, display_order) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'カタログ・パンフレット', '製品カタログやパンフレット', 1),
    ('d2222222-2222-2222-2222-222222222222', '技術資料', '技術仕様書や図面', 2),
    ('d3333333-3333-3333-3333-333333333333', '営業資料', '営業用プレゼンテーション資料', 3),
    ('d4444444-4444-4444-4444-444444444444', '契約書類', '契約関連の書類テンプレート', 4),
    ('d5555555-5555-5555-5555-555555555555', 'マニュアル', '各種マニュアルやガイドライン', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- ===========================================
-- 6. ダウンロード資料テストデータ
-- ===========================================
INSERT INTO downloads (category_id, title, description, file_type, file_url, file_name, file_size, status) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'LIFE X 総合カタログ2024', '全商品ラインナップを網羅した総合カタログ', 'pdf', '/downloads/catalog_2024.pdf', 'catalog_2024.pdf', 25600000, 'active'),
    ('d1111111-1111-1111-1111-111111111111', 'エクステリアカタログ', '外構・エクステリア専用カタログ', 'pdf', '/downloads/exterior_catalog.pdf', 'exterior_catalog.pdf', 15360000, 'active'),
    ('d2222222-2222-2222-2222-222222222222', '構造計算書テンプレート', '構造計算書の標準テンプレート', 'excel', '/downloads/structure_calc.xlsx', 'structure_calc.xlsx', 2048000, 'active'),
    ('d2222222-2222-2222-2222-222222222222', 'CAD図面集', '標準プランのCAD図面データ集', 'other', '/downloads/cad_drawings.zip', 'cad_drawings.zip', 102400000, 'active'),
    ('d3333333-3333-3333-3333-333333333333', '営業提案書テンプレート', 'パワーポイント形式の営業提案書', 'powerpoint', '/downloads/proposal_template.pptx', 'proposal_template.pptx', 5120000, 'active'),
    ('d3333333-3333-3333-3333-333333333333', '価格表2024年度版', '2024年度の標準価格表', 'excel', '/downloads/price_list_2024.xlsx', 'price_list_2024.xlsx', 1024000, 'active'),
    ('d4444444-4444-4444-4444-444444444444', '工事請負契約書', '標準工事請負契約書のテンプレート', 'word', '/downloads/contract_template.docx', 'contract_template.docx', 512000, 'active'),
    ('d4444444-4444-4444-4444-444444444444', '重要事項説明書', '重要事項説明書のテンプレート', 'word', '/downloads/important_matters.docx', 'important_matters.docx', 256000, 'active'),
    ('d5555555-5555-5555-5555-555555555555', '施工マニュアル', '標準施工手順を解説したマニュアル', 'pdf', '/downloads/construction_manual.pdf', 'construction_manual.pdf', 30720000, 'active'),
    ('d5555555-5555-5555-5555-555555555555', '営業マニュアル', '営業活動の基本マニュアル', 'pdf', '/downloads/sales_manual.pdf', 'sales_manual.pdf', 10240000, 'active');

-- ===========================================
-- 7. プランテストデータ
-- ===========================================
INSERT INTO plans (id, name, category, description, tsubo, width, depth, floors, price, price_without_tax, bedrooms, status) VALUES
    ('LX-001A', 'スタンダード30坪プラン', 'スタンダード', 'コストパフォーマンスに優れた標準的な住宅プラン', 30.5, 9.1, 10.0, 2, 18500000, 16818182, 3, 'published'),
    ('LX-002B', 'コンパクト25坪プラン', 'コンパクト', '小さな敷地でも快適に暮らせるコンパクト設計', 25.0, 7.28, 10.92, 2, 15800000, 14363636, 2, 'published'),
    ('LX-003C', 'ファミリー35坪プラン', 'ファミリー', '家族4人でゆったり暮らせる充実の間取り', 35.0, 10.0, 11.0, 2, 22000000, 20000000, 4, 'published'),
    ('LX-004D', '平屋20坪プラン', '平屋', 'シンプルで暮らしやすい平屋建てプラン', 20.0, 8.0, 8.0, 1, 14500000, 13181818, 2, 'published'),
    ('LX-005E', 'ラグジュアリー40坪プラン', 'プレミアム', '高級仕様の広々とした住宅プラン', 40.0, 11.0, 11.5, 2, 28500000, 25909091, 4, 'published'),
    ('LX-006F', '二世帯住宅45坪プラン', '二世帯', '二世帯が快適に暮らせる独立型プラン', 45.0, 10.92, 12.74, 2, 32000000, 29090909, 5, 'published'),
    ('LX-007G', '狭小住宅18坪プラン', 'コンパクト', '都市部の狭小地に最適なプラン', 18.0, 5.46, 10.92, 2, 13200000, 12000000, 2, 'published'),
    ('LX-008H', 'モダン32坪プラン', 'モダン', 'スタイリッシュなデザインの現代的住宅', 32.0, 9.1, 11.0, 2, 20500000, 18636364, 3, 'published'),
    ('LX-009I', 'エコ住宅28坪プラン', 'エコ', '省エネ性能に優れた環境配慮型住宅', 28.0, 8.19, 10.92, 2, 19800000, 18000000, 3, 'published'),
    ('LX-010J', 'ガレージハウス33坪プラン', 'ガレージ付き', 'ビルトインガレージ付きの実用的プラン', 33.0, 9.1, 11.83, 2, 23500000, 21363636, 3, 'published');

-- ===========================================
-- 8. プラン画像データ（サンプルURL）
-- ===========================================
INSERT INTO plan_images (plan_id, type, url, file_name, display_order) VALUES
    ('LX-001A', 'exterior', 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=LX-001A+Exterior', 'lx001a_exterior.jpg', 1),
    ('LX-001A', 'interior', 'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=LX-001A+Interior', 'lx001a_interior.jpg', 2),
    ('LX-001A', 'floor_plan_1f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-001A+1F', 'lx001a_1f.jpg', 3),
    ('LX-001A', 'floor_plan_2f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-001A+2F', 'lx001a_2f.jpg', 4),

    ('LX-002B', 'exterior', 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=LX-002B+Exterior', 'lx002b_exterior.jpg', 1),
    ('LX-002B', 'interior', 'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=LX-002B+Interior', 'lx002b_interior.jpg', 2),
    ('LX-002B', 'floor_plan_1f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-002B+1F', 'lx002b_1f.jpg', 3),
    ('LX-002B', 'floor_plan_2f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-002B+2F', 'lx002b_2f.jpg', 4),

    ('LX-003C', 'exterior', 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=LX-003C+Exterior', 'lx003c_exterior.jpg', 1),
    ('LX-003C', 'interior', 'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=LX-003C+Interior', 'lx003c_interior.jpg', 2),
    ('LX-003C', 'floor_plan_1f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-003C+1F', 'lx003c_1f.jpg', 3),
    ('LX-003C', 'floor_plan_2f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-003C+2F', 'lx003c_2f.jpg', 4),

    ('LX-004D', 'exterior', 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=LX-004D+Exterior', 'lx004d_exterior.jpg', 1),
    ('LX-004D', 'interior', 'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=LX-004D+Interior', 'lx004d_interior.jpg', 2),
    ('LX-004D', 'floor_plan_1f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-004D+Floor', 'lx004d_floor.jpg', 3),

    ('LX-005E', 'exterior', 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=LX-005E+Exterior', 'lx005e_exterior.jpg', 1),
    ('LX-005E', 'interior', 'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=LX-005E+Interior', 'lx005e_interior.jpg', 2),
    ('LX-005E', 'floor_plan_1f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-005E+1F', 'lx005e_1f.jpg', 3),
    ('LX-005E', 'floor_plan_2f', 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=LX-005E+2F', 'lx005e_2f.jpg', 4);

-- ===========================================
-- 9. データ投入完了メッセージ
-- ===========================================
-- テストデータの投入が完了しました。
-- 以下のデータが作成されました：
-- - FAQカテゴリ: 5件
-- - FAQ: 10件
-- - ルールカテゴリ: 5件
-- - ルール: 10件
-- - ダウンロードカテゴリ: 5件
-- - ダウンロード資料: 10件
-- - プラン: 10件
-- - プラン画像: 19件