
console.log('[MAIN] SUPER расширение загружается...');

const dbmSUPER_APP = {
    isPanelOpen: false,
    elements: {},
    userSubscription: { status: 'logged_out' }, // Статус по умолчанию

    // Каталог решений с метками доступа (isPaid)
    solutions: {
        'super-hover': {
            title: 'Super Hover',
            description: 'Создание продвинутых hover-эффектов',
            js: 'features/super-hover/super-hover.js',
            css: 'features/super-hover/super-hover.css',
            initializer: 'dbmHoverArchitect',
            requiresSubscription: true // ПЛАТНОЕ РЕШЕНИЕ
        },
        'super-grid': {
            title: 'Super Grid',
            description: 'Продвинутая сеточная система (в разработке)',
            requiresSubscription: true // ПЛАТНОЕ РЕШЕНИЕ
        },
        'super-slider': {
            title: 'Super Slider',
            description: 'Мощный конструктор слайдеров',
            js: 'features/super-slider/super-slider.js',
            css: 'features/super-slider/super-slider.css',
            initializer: 'dbmSwiperArchitect',
            requiresSubscription: true // ПЛАТНОЕ РЕШЕНИЕ
        },
        'tilda-mods': {
            title: 'Tilda Mods',
            description: 'Запустить классические моды для Tilda',
            js: 'features/tilda-mods/tilda-mods.js',
            initializer: null,
            requiresSubscription: false // БЕСПЛАТНОЕ РЕШЕНИЕ
        }
    },

    async init() {
        console.log('[MAIN] dbmSUPER_APP инициализируется...');
        try {
            // Инициализируем Supabase клиент
            await this.initSupabaseClient();
            if (!window.supabaseClient) {
                throw new Error('Клиент Supabase не был создан.');
            }

            // ГЛАВНОЕ ИЗМЕНЕНИЕ: Слушаем изменения состояния авторизации В РЕАЛЬНОМ ВРЕМЕНИ
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log(`[MAIN] Auth state changed: ${event}`);
                // При любом изменении (вход, выход) полностью перепроверяем статус и перестраиваем UI
                this.handleUserStatusChange(session);
            });

            // Первоначальная проверка при загрузке страницы
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            await this.handleUserStatusChange(session);

        } catch (error) {
            console.error('[MAIN] Критическая ошибка при инициализации:', error);
            this.destroyUI(); // Если что-то пошло не так, убираем все элементы
        }
    },


    async initSupabaseClient() {
        try {
            console.log('[MAIN] Инициализируем Supabase клиент...');
            
            // Загружаем библиотеку Supabase
            await this.loadScript('lib/supabase.min.js', false);
            
            // Ждем, пока библиотека загрузится
            let attempts = 0;
            const maxAttempts = 50;
            while (typeof supabase === 'undefined' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof supabase === 'undefined') {
                throw new Error('Библиотека Supabase не загружена');
            }
            
            // Загружаем конфигурацию
            await this.loadScript('popup/config.js', false);
            
            // Ждем, пока конфигурация загрузится
            attempts = 0;
            while (!window.dbmSUPER_SUPABASE_CONFIG && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.dbmSUPER_SUPABASE_CONFIG) {
                throw new Error('Конфигурация Supabase не загружена');
            }
            
            const { url, anonKey } = window.dbmSUPER_SUPABASE_CONFIG;
            if (!url || !anonKey) {
                throw new Error('URL или anonKey не установлены в конфигурации');
            }
            
            // Создаем клиент Supabase
            window.supabaseClient = supabase.createClient(url, anonKey, {
                auth: {
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
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false
                }
            });
            
            console.log('[MAIN] ✅ Supabase клиент инициализирован');
            
        } catch (error) {
            console.error('[MAIN] ❌ Ошибка инициализации Supabase:', error);
            throw error;
        }
    },
    async handleUserStatusChange(session) {
        // Сначала всегда полностью очищаем старый UI, чтобы избежать дубликатов
        this.destroyUI();

        if (session) {
            // Пользователь залогинен, теперь проверяем подписку
            await this.checkSubscriptionStatus(session.user.id);
            // После проверки строим UI с учётом нового статуса
            this.buildUI();
        } else {
            // Пользователь не залогинен
            this.userSubscription.status = 'logged_out';
            console.log('[MAIN] Пользователь не авторизован. UI не будет создан.');
        }
    },
    async checkSubscriptionStatus(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('subscriptions')
                .select('status, ends_at')
                .eq('user_id', userId)
                .in('status', ['active', 'trialing'])
                .gt('ends_at', new Date().toISOString())
                .order('ends_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                this.userSubscription.status = data.status; // 'active' или 'trialing'
            } else {
                this.userSubscription.status = 'free'; // Активных подписок не найдено, значит статус "бесплатный"
            }
        } catch (e) {
            console.error('[MAIN] Ошибка проверки подписки:', e);
            this.userSubscription.status = 'error';
        }
        console.log(`[MAIN] Статус подписки установлен: ${this.userSubscription.status}`);
    },
// core/main.js - ЗАМЕНИТЬ ТОЛЬКО ЭТУ ФУНКЦИЮ

async checkAuthAndSubscription() {
    try {
        if (!window.supabaseClient) {
            this.isAuthorized = false;
            this.userSubscription.status = 'error';
            throw new Error('Клиент Supabase недоступен.');
        }
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            this.isAuthorized = false;
            this.userSubscription.status = 'logged_out';
            return;
        }

        this.isAuthorized = true;
        console.log('[MAIN] Пользователь авторизован:', session.user.email);

        // ОБНОВЛЕННЫЙ ЗАПРОС к новой таблице 'subscriptions'
        const { data, error } = await window.supabaseClient
            .from('subscriptions')
            .select('status, ends_at')
            .in('status', ['active', 'trialing']) // Ищем только активные или триальные
            .gt('ends_at', new Date().toISOString()) // Дата окончания должна быть в будущем
            .order('ends_at', { ascending: false }) // Берем самую "свежую" подписку
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Игнорируем ошибку "не найдено строк"
            throw error;
        }
        
        if (data) {
            this.userSubscription.status = data.status; // 'active' или 'trialing'
        } else {
            this.userSubscription.status = 'free'; // Если активных подписок не найдено
        }

    } catch (e) {
        console.error('[MAIN] Ошибка проверки статуса:', e);
        this.isAuthorized = false; // Считаем неавторизованным при ошибке
        this.userSubscription.status = 'error';
    }
},

buildUI() {
    const availableSolutions = this.getAvailableSolutions();
    if (availableSolutions.length === 0) {
        console.log('[MAIN] Нет доступных решений для текущего статуса подписки. UI не будет создан.');
        return;
    }

    console.log(`[MAIN] Доступно решений: ${availableSolutions.length}. Создаем UI...`);
    this.createFloatingIcon();
    this.createSolutionsWindow(availableSolutions);
    this.addEventListeners();
},
getAvailableSolutions() {
    const status = this.userSubscription.status;
    const allSolutions = Object.entries(this.solutions);

    if (status === 'active' || status === 'trialing') {
        // Если подписка активна, возвращаем ВСЕ решения
        return allSolutions;
    } else if (status === 'free') {
        // Если подписка истекла (статус 'free'), возвращаем ТОЛЬКО бесплатные
        return allSolutions.filter(([key, solution]) => !solution.requiresSubscription);
    } else {
        // Для всех остальных статусов ('logged_out', 'error') ничего не показываем
        return [];
    }
},
    destroyUI() {
        this.elements.floatingIcon?.remove();
        this.elements.solutionsWindow?.remove();
        this.elements = {};
    },

    createFloatingIcon() {
        this.elements.floatingIcon = document.createElement('div');
        this.elements.floatingIcon.id = 'super-floating-icon';
        this.elements.floatingIcon.innerHTML = `<div>SUPER</div>`;
        document.body.appendChild(this.elements.floatingIcon);
    },

    createSolutionsWindow(availableSolutions) {
        this.elements.solutionsWindow = document.createElement('div');
        this.elements.solutionsWindow.id = 'super-solutions-window';
        this.elements.solutionsWindow.classList.add('super-hidden');

        let cardsHTML = '';
        const hasActiveSubscription = this.userSubscription.status === 'active' || this.userSubscription.status === 'trialing';

        for (const [key, solution] of availableSolutions) {
            // Иконка замка 🔒 показывается только для платных решений, если у пользователя НЕТ активной подписки.
            // Но сама карточка будет неактивна (disabled) если у пользователя нет доступа
             const isPaid = solution.requiresSubscription;
             const isDisabled = isPaid && !hasActiveSubscription;
             const lockIcon = isPaid ? '🔒' : '';

            cardsHTML += `
                <div class="card ${isDisabled ? 'disabled' : ''}" data-solution-key="${key}">
                    <h4>${solution.title} ${lockIcon}</h4>
                    <p>${solution.description}</p>
                </div>`;
        }
        
        this.elements.solutionsWindow.innerHTML = cardsHTML;
        
        // Показываем призыв к покупке, только если у пользователя нет активной подписки
        if (!hasActiveSubscription) {
             this.elements.solutionsWindow.innerHTML += '<p class="upgrade-prompt">Оформите подписку для полного доступа ко всем решениям</p>';
        }

        document.body.appendChild(this.elements.solutionsWindow);
    },
    destroyUI() {
        console.log('[MAIN] Уничтожаем старый UI...');
        this.elements.floatingIcon?.remove();
        this.elements.solutionsWindow?.remove();
        this.elements = {}; // Очищаем объект
    },
    addEventListeners() {
        this.elements.floatingIcon.addEventListener('click', () => {
            if (this.isPanelOpen) return;
            this.elements.solutionsWindow.classList.toggle('super-hidden');
        });

        this.elements.solutionsWindow.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                if (card.classList.contains('disabled')) {
                    alert('Эта функция доступна только в платной подписке. Пожалуйста, откройте попап расширения и оформите подписку.');
                    return;
                }
                this.elements.solutionsWindow.classList.add('super-hidden');
                this.launchSolution(card.dataset.solutionKey);
            }
        });
    },

    launchSolution(solutionKey) {
        const solution = this.solutions[solutionKey];
        if (!solution) {
            console.error(`[MAIN] Решение "${solutionKey}" не найдено.`);
            return;
        }

        console.log(`[MAIN] Запускаем решение: ${solutionKey}`);

        // Загружаем CSS решения (если еще не загружен)
        if (solution.css) {
           this.loadStylesheet(solution.css);
        }
        // Загружаем CSS для панели (если еще не загружен)
       this.loadStylesheet('core/super-panel-manager.css');

        // Загружаем JS решения
        if (solution.js && solution.initializer) {
           // Сначала загружаем менеджеры, потом само решение
           this.loadScript('core/super-panel-manager.js', false, () => {
               this.loadScript('core/super-selection-manager.js', false, () => {
                   // После того, как все скрипты гарантированно загружены, вызываем init
                   this.loadScript(solution.js, true, () => {
                       console.log(`[MAIN] Все скрипты для ${solutionKey} готовы. Проверяем менеджеры...`);
                       
                       // Даем время скриптам на выполнение и отправляем событие инициализации
                       setTimeout(() => {
                           console.log(`[MAIN] Отправляем событие для инициализации ${solution.initializer}`);
                           
                           // Сохраняем текущее решение в SuperPanelManager
                           if (window.SuperPanelManager) {
                               window.SuperPanelManager.setCurrentSolution(solution.initializer);
                           }
                           
                           // Отправляем событие в "мир страницы", чтобы запустить нужный объект
                           window.dispatchEvent(new CustomEvent('dbmInitSolution', {
                               detail: {
                                   name: solution.initializer
                               }
                           }));
                       }, 300); // Увеличиваем задержку для надежности
                   });
               });
           });
        }
    },

    loadScript(path, isModule, callback) {
        const scriptId = `dbm-script-${path.split('/').pop()}`; // e.g., dbm-script-super-panel-manager.js
        
        // Проверяем не только наличие скрипта, но и наличие соответствующих объектов
        if (document.getElementById(scriptId)) {
            console.log(`[MAIN] Скрипт ${path} уже загружен.`);
            
            // Для менеджеров проверяем, что объекты действительно созданы
            if (path.includes('super-panel-manager.js') && typeof window.SuperPanelManager === 'undefined') {
                console.log(`[MAIN] Но объект SuperPanelManager не найден, перезагружаем...`);
                document.getElementById(scriptId).remove();
            } else if (path.includes('super-selection-manager.js') && typeof window.SuperSelectionManager === 'undefined') {
                console.log(`[MAIN] Но объект SuperSelectionManager не найден, перезагружаем...`);
                document.getElementById(scriptId).remove();
            } else {
                if (callback) {
                    callback();
                }
                return;
            }
        }

        const src = chrome.runtime.getURL(path);
        console.log(`[MAIN] Загружаем скрипт: ${src}`);
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = src;
        if (isModule) {
            script.type = 'module';
        }
        script.onload = () => {
            console.log(`[MAIN] Скрипт ${src} успешно загружен.`);
            if (callback) {
                callback();
            }
        };
        script.onerror = () => console.error(`[MAIN] Ошибка загрузки скрипта: ${src}`);
        document.head.appendChild(script);
    },

    loadStylesheet(path) {
        const styleId = `dbm-style-${path.split('/').pop()}`;
        if (document.getElementById(styleId)) {
            console.log(`[MAIN] Стили ${path} уже загружены.`);
            return;
        }
        const href = chrome.runtime.getURL(path);
        console.log(`[MAIN] Загружаем стили: ${href}`);
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
};

(async () => {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => dbmSUPER_APP.init());
    } else {
        dbmSUPER_APP.init();
    }
    window.dbmSUPER_APP = dbmSUPER_APP;
})();