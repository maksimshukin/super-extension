// supabase.js - Настоящий клиент для подключения к Supabase

console.log('[SUPABASE] Скрипт supabase.js загружается...');

// Функция для инициализации Supabase
const initSupabase = async () => {
    try {
        // Проверяем, что библиотека Supabase загружена
        if (typeof supabase === 'undefined') {
            throw new Error('Библиотека Supabase (supabase.min.js) не найдена. Убедитесь, что она загружена перед supabase.js');
        }

        // Получаем ключи из config.js
        const SUPABASE_URL = window.dbmSUPER_SUPABASE_CONFIG?.url;
        const SUPABASE_ANON_KEY = window.dbmSUPER_SUPABASE_CONFIG?.anonKey;

        // Проверяем, что конфигурация установлена
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('[SUPABASE] ❌ Конфигурация не найдена!');
            console.error('[SUPABASE] Убедитесь, что в popup/config.js установлены правильные значения:');
            console.error('[SUPABASE] - url: "https://your-project-id.supabase.co"');
            console.error('[SUPABASE] - anonKey: "your-anon-key-here"');
            console.error('[SUPABASE] Текущие значения:', { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY ? 'Установлен' : 'НЕ УСТАНОВЛЕН' });
            throw new Error('Конфигурация Supabase не найдена');
        }

        // Создаем и экспортируем единственный экземпляр клиента
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                // Настройки для расширений Chrome
                storage: {
                    getItem: (key) => {
                        return new Promise((resolve) => {
                            chrome.storage.local.get([key], (result) => {
                                resolve(result[key] || null);
                            });
                        });
                    },
                    setItem: (key, value) => {
                        return new Promise((resolve) => {
                            chrome.storage.local.set({ [key]: value }, () => {
                                resolve();
                            });
                        });
                    },
                    removeItem: (key) => {
                        return new Promise((resolve) => {
                            chrome.storage.local.remove([key], () => {
                                resolve();
                            });
                        });
                    }
                },
                // Автоматически обновлять сессию
                autoRefreshToken: true,
                // Сохранять сессию
                persistSession: true,
                // Обнаруживать сессию в URL (для OAuth)
                detectSessionInUrl: false
            }
        });

        // Делаем клиент доступным глобально для других скриптов
        window.supabaseClient = supabaseClient;

        console.log('[SUPABASE] ✅ Настоящий клиент Supabase инициализирован.');
        return supabaseClient;

        } catch (error) {
        console.error('[SUPABASE] ❌ Ошибка инициализации:', error);
            throw error;
    }
};

// Экспортируем функцию для вызова из main.js
window.initSupabase = initSupabase;
console.log('[SUPABASE] Функция initSupabase экспортирована в window');

// Автоматически инициализируем, если все зависимости готовы
if (typeof supabase !== 'undefined' && window.dbmSUPER_SUPABASE_CONFIG) {
    console.log('[SUPABASE] Автоматическая инициализация...');
    initSupabase();
} else {
    console.log('[SUPABASE] Автоматическая инициализация пропущена. supabase:', typeof supabase, 'config:', !!window.dbmSUPER_SUPABASE_CONFIG);
}