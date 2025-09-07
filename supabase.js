// supabase.js - Конфигурация и клиент Supabase для SHIFT Extension

// Конфигурация Supabase
const SUPABASE_CONFIG = {
    url: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};

// Создание клиента Supabase
let supabase = null;

// Функция для инициализации Supabase
function initSupabase() {
    try {
        // Проверяем, доступен ли Supabase в глобальной области
        if (typeof window !== 'undefined' && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('[SUPABASE] Клиент создан успешно');
            return true;
        } else {
            console.warn('[SUPABASE] Библиотека Supabase не найдена в window.supabase');
            return false;
        }
    } catch (error) {
        console.error('[SUPABASE] Ошибка при создании клиента:', error);
        return false;
    }
}

// Ждем загрузки DOM и библиотеки Supabase
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        // DOM уже загружен, пытаемся инициализировать
        setTimeout(initSupabase, 100);
    }
}

// Экспортируем конфигурацию и клиент
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.supabaseClient = supabase;
}

// Функции для работы с Supabase
const SupabaseService = {
    // Проверка доступности Supabase
    isAvailable: function() {
        return supabase !== null;
    },

    // Получение клиента
    getClient: function() {
        return supabase;
    },

    // Аутентификация пользователя
    signIn: async function(email, password) {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[SUPABASE] Ошибка входа:', error);
            throw error;
        }
    },

    // Регистрация пользователя
    signUp: async function(email, password, userData = {}) {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[SUPABASE] Ошибка регистрации:', error);
            throw error;
        }
    },

    // Выход из системы
    signOut: async function() {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('[SUPABASE] Ошибка выхода:', error);
            throw error;
        }
    },

    // Получение текущей сессии
    getSession: async function() {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[SUPABASE] Ошибка получения сессии:', error);
            throw error;
        }
    },

    // Получение профиля пользователя
    getUserProfile: async function(userId) {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[SUPABASE] Ошибка получения профиля:', error);
            throw error;
        }
    },

    // Получение решений пользователя
    getUserSolutions: async function(userId) {
        if (!this.isAvailable()) {
            throw new Error('Supabase не доступен');
        }

        try {
            const { data, error } = await supabase
                .from('user_solutions')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[SUPABASE] Ошибка получения решений:', error);
            throw error;
        }
    }
};

// Экспортируем сервис
if (typeof window !== 'undefined') {
    window.SupabaseService = SupabaseService;
}

console.log('[SUPABASE] Модуль Supabase загружен');

// Проверяем доступность при загрузке
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        if (SupabaseService.isAvailable()) {
            console.log('[SUPABASE] Сервис готов к использованию');
        } else {
            console.warn('[SUPABASE] Сервис недоступен - проверьте подключение библиотеки Supabase');
        }
    });
}
