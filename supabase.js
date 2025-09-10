// supabase.js - Локальная реализация Supabase для SHIFT Extension

// Конфигурация Supabase
const SHIFT_SUPABASE_CONFIG = {
    url: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};

// Создание локального Supabase клиента
let supabase = null;

// Функция для инициализации Supabase
function initSupabase() {
    try {
        console.log('[SUPABASE] Начинаем инициализацию...');
        // Создаем локальную реализацию Supabase
        supabase = createLocalSupabaseClient();
        console.log('[SUPABASE] Локальный клиент создан успешно:', supabase);
        console.log('[SUPABASE] supabase.auth:', supabase?.auth);
        return true;
    } catch (error) {
        console.error('[SUPABASE] Ошибка при создании клиента:', error);
        return false;
    }
}

// Создание локального Supabase клиента
function createLocalSupabaseClient() {
    return {
        auth: {
            getSession: async function() {
                console.log('[SUPABASE] Получение сессии...');
                
                // Проверяем, есть ли сохраненная сессия в localStorage
                const savedSession = localStorage.getItem('shift_demo_session');
                if (savedSession) {
                    try {
                        const session = JSON.parse(savedSession);
                        console.log('[SUPABASE] Найдена сохраненная сессия');
                        return { data: { session }, error: null };
                    } catch (e) {
                        console.log('[SUPABASE] Ошибка парсинга сохраненной сессии');
                    }
                }
                
                // Возвращаем пустую сессию
                return { data: { session: null }, error: null };
            },
            
            signInWithPassword: async function(credentials) {
                console.log('[SUPABASE] Попытка входа с email:', credentials.email);
                console.log('[SUPABASE] Полученные credentials:', credentials);
                
                // Валидация входных данных
                if (!credentials.email || !credentials.password) {
                    console.log('[SUPABASE] Ошибка валидации: отсутствуют email или пароль');
                    return {
                        data: { user: null, session: null },
                        error: { message: 'Email и пароль обязательны' }
                    };
                }
                
                // Демо-логика входа
                console.log('[SUPABASE] Проверяем демо-данные...');
                console.log('[SUPABASE] Email совпадает:', credentials.email === 'demo@example.com');
                console.log('[SUPABASE] Пароль совпадает:', credentials.password === 'demo123');
                
                if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
                    console.log('[SUPABASE] Успешный вход с демо-данными');
                    
                    const session = { 
                        access_token: 'demo-token',
                        refresh_token: 'demo-refresh-token',
                        user: { 
                            id: 'demo-user', 
                            email: credentials.email,
                            user_metadata: { full_name: 'Demo User' }
                        }
                    };
                    
                    // Сохраняем сессию в localStorage
                    localStorage.setItem('shift_demo_session', JSON.stringify(session));
                    
                    return {
                        data: {
                            user: session.user,
                            session: session
                        },
                        error: null
                    };
                }
                
                // Для любых других данных возвращаем ошибку
                console.log('[SUPABASE] Неверные учетные данные');
                console.log('[SUPABASE] Ожидалось: demo@example.com / demo123');
                console.log('[SUPABASE] Получено:', credentials.email, '/', credentials.password);
                return {
                    data: { user: null, session: null },
                    error: { message: 'Неверные учетные данные' }
                };
            },
            
            signUp: async function(credentials) {
                console.log('[SUPABASE] Попытка регистрации с email:', credentials.email);
                console.log('[SUPABASE] Полученные credentials для регистрации:', credentials);
                
                // Валидация входных данных
                if (!credentials.email || !credentials.password) {
                    console.log('[SUPABASE] Ошибка валидации регистрации: отсутствуют email или пароль');
                    return {
                        data: { user: null, session: null },
                        error: { message: 'Email и пароль обязательны' }
                    };
                }
                
                // Проверка формата email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(credentials.email)) {
                    return {
                        data: { user: null, session: null },
                        error: { message: 'Invalid email' }
                    };
                }
                
                // Проверка силы пароля
                if (credentials.password.length < 6) {
                    return {
                        data: { user: null, session: null },
                        error: { message: 'Password should be at least 6 characters' }
                    };
                }
                
                // Демо-логика регистрации
                console.log('[SUPABASE] Успешная регистрация');
                return {
                    data: {
                        user: { 
                            id: 'new-user-' + Date.now(), 
                            email: credentials.email,
                            user_metadata: credentials.options?.data || {}
                        },
                        session: null
                    },
                    error: null
                };
            },
            
            signOut: async function() {
                console.log('[SUPABASE] Выход из системы...');
                
                // Очищаем сохраненную сессию
                localStorage.removeItem('shift_demo_session');
                
                return { error: null };
            }
        },
        
        from: function(table) {
            return {
                select: function(columns) {
                    return {
                        eq: function(column, value) {
                            return {
                                single: async function() {
                                    console.log('[SUPABASE] Запрос к таблице:', table, 'колонка:', column, 'значение:', value);
                                    return { data: null, error: null };
                                }
                            };
                        }
                    };
                }
            };
        }
    };
}

// Инициализируем Supabase сразу
if (typeof window !== 'undefined') {
    initSupabase();
}

// Экспортируем конфигурацию и клиент
if (typeof window !== 'undefined') {
    window.SHIFT_SUPABASE_CONFIG = SHIFT_SUPABASE_CONFIG;
    window.supabaseClient = supabase;
    
    // Также создаем window.supabase для совместимости
    window.supabase = {
        createClient: function(url, anonKey) {
            return supabase;
        }
    };
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
