
console.log('[MAIN] SUPER расширение загружается...');

const dbmSUPER_APP = {
    isPanelOpen: false,
    elements: {},
    userSubscription: { status: 'free' }, // Статус по умолчанию

    // Каталог решений с метками доступа (isPaid)
    solutions: {
        'super-hover': {
            title: 'Super Hover',
            description: 'Создание продвинутых hover-эффектов',
            js: 'features/super-hover/super-hover.js',
            css: 'features/super-hover/super-hover.css',
            initializer: 'dbmHoverArchitect',
            isPaid: true // Платное решение
        },
        'super-grid': {
            title: 'Super Grid',
            description: 'Продвинутая сеточная система (в разработке)',
            isPaid: true
        },
        'super-slider': {
            title: 'Super Slider',
            description: 'Мощный конструктор слайдеров',
            js: 'features/super-slider/super-slider.js',
            css: 'features/super-slider/super-slider.css',
            initializer: 'dbmSwiperArchitect',
            isPaid: true // Платное решение
        },
        'tilda-mods': {
            title: 'Tilda Mods',
            description: 'Запустить классические моды для Tilda',
            js: 'features/tilda-mods/tilda-mods.js',
            initializer: null,
            isPaid: false // Бесплатное решение
        }
    },

    async init() {
        console.log('[MAIN] dbmSUPER_APP инициализируется...');
        
        // Загружаем клиент Supabase, если его еще нет
        if (!window.supabaseClient) {
            await this.loadScript('../supabase.js', false);
        }

        // Проверяем статус пользователя и его подписку
        this.userSubscription = await this.checkAuthAndSubscription();

        // **ГЛАВНАЯ ЛОГИКА**: Показываем UI только если пользователь авторизован
        if (this.userSubscription.status !== 'logged_out' && this.userSubscription.status !== 'error') {
            console.log(`[MAIN] Пользователь авторизован. Статус подписки: ${this.userSubscription.status}`);
            this.buildUI();
        } else {
            console.log('[MAIN] Пользователь не авторизован, UI не будет создан.');
        }
    },

    async checkAuthAndSubscription() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return { status: 'logged_out' };

            const { data, error } = await window.supabaseClient
                .from('subscriptions_view')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
            
            if (error || !data) return { status: 'free' };
            
            const endsAt = data['Активна до'] ? new Date(data['Активна до']) : null;
            if (data['Статус'] === 'active' && endsAt > new Date()) {
                return { status: 'active' };
            }

            return { status: 'free' }; // Если подписка истекла или неактивна
        } catch (e) {
            console.error('[MAIN] Ошибка проверки статуса:', e);
            return { status: 'error' };
        }
    },

    buildUI() {
        if (this.elements.floatingIcon) return; // UI уже создан
        this.createFloatingIcon();
        this.createSolutionsWindow();
        this.addEventListeners();

        document.addEventListener('super-panel-closed', () => {
            this.isPanelOpen = false;
            this.elements.floatingIcon.classList.remove('super-hidden');
        });
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

    createSolutionsWindow() {
        this.elements.solutionsWindow = document.createElement('div');
        this.elements.solutionsWindow.id = 'super-solutions-window';
        this.elements.solutionsWindow.classList.add('super-hidden');

        let cardsHTML = '';
        for (const key in this.solutions) {
            const solution = this.solutions[key];
            const hasAccess = this.userSubscription.status === 'active' || !solution.isPaid;
            
            cardsHTML += `
                <div class="card ${hasAccess ? '' : 'disabled'}" data-solution-key="${key}">
                    <h4>${solution.title} ${!hasAccess ? '🔒' : ''}</h4>
                    <p>${solution.description}</p>
                </div>`;
        }
        
        this.elements.solutionsWindow.innerHTML = cardsHTML;
        if (this.userSubscription.status !== 'active') {
             this.elements.solutionsWindow.innerHTML += '<p class="upgrade-prompt">Оформите подписку для полного доступа</p>';
        }

        document.body.appendChild(this.elements.solutionsWindow);
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

// --- Безопасная инициализация ---
try {
    dbmSUPER_APP.init();
    window.dbmSUPER_APP = dbmSUPER_APP;
} catch (error) {
    console.error('[MAIN] Ошибка при инициализации dbmSUPER_APP:', error);
}