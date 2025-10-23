// Supabase Client Configuration (ブラウザ用グローバル版)

(function() {
    'use strict';

    // Supabase接続情報
    const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

    // Supabase CDNが読み込まれるまで待機
    function waitForSupabaseCDN() {
        return new Promise((resolve, reject) => {
            let retries = 0;
            const maxRetries = 50;

            const checkSupabase = setInterval(() => {
                if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                    clearInterval(checkSupabase);
                    resolve();
                } else if (retries >= maxRetries) {
                    clearInterval(checkSupabase);
                    reject(new Error('Supabase CDN not loaded'));
                }
                retries++;
            }, 100);
        });
    }

    // 初期化
    waitForSupabaseCDN().then(() => {
        const { createClient } = window.supabase;

        const client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: { 'x-application-name': 'LIFE-X' }
            }
        });

        // グローバル変数に設定
        window.supabaseClient = client;

        console.log('✅ Supabase client initialized');

        // 初期化完了イベントを発火
        window.dispatchEvent(new Event('supabase-ready'));
    }).catch(error => {
        console.error('❌ Failed to initialize Supabase:', error);
    });
})();
