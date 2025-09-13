// core/main.js
console.log('[MAIN] SUPER расширение загружается...');
console.log('[MAIN] URL:', window.location.href);
console.log('[MAIN] Chrome доступен:', !!window.chrome);
console.log('[MAIN] Chrome storage доступен:', !!window.chrome?.storage);

const dbmSUPER_APP = {
    isPanelOpen: false,
    elements: {},

    // Каталог всех ваших решений. Легко добавить новое!
    solutions: {
        'super-hover': {
            title: 'Super Hover',
            description: 'Создание продвинутых hover-эффектов',
            js: 'features/super-hover/super-hover.js',
            css: 'features/super-hover/super-hover.css',
            // Имя объекта, у которого нужно вызвать метод .init() после загрузки скрипта
            initializer: 'dbmHoverArchitect'
        },
        'super-grid': {
            title: 'Super Grid',
            description: 'Продвинутая сеточная система (в разработке)',
        },
        'super-slider': {
            title: 'Super Slider',
            description: 'Мощный конструктор слайдеров (в разработке)',
            js: 'features/super-slider/super-slider.js',
            css: 'features/super-slider/super-slider.css',
            // Имя объекта, у которого нужно вызвать метод .init() после загрузки скрипта
            initializer: 'dbmSwiperArchitect'
        },
        'tilda-mods': {
            title: 'Tilda Mods',
            description: 'Запустить классические моды для Tilda',
            js: 'features/tilda-mods/tilda-mods.js',
            css: 'features/tilda-mods/tilda-mods.css',
            // У старого кода нет объекта, он выполняется сразу
            initializer: null
        }
    },

    init() {
        console.log('[MAIN] dbmSUPER_APP инициализируется...');
        console.log('[MAIN] Проверяем доступность chrome.storage:', !!chrome?.storage);
        
        // Ждем, пока пользователь войдет в систему
        try {
            if (chrome?.storage?.local) {
                chrome.storage.local.get('userStatus', (data) => {
                    console.log('[MAIN] Проверка статуса пользователя:', data);
                    if (data.userStatus === 'loggedIn') {
                        console.log('[MAIN] Пользователь вошел в систему, создаем UI...');
                        this.buildUI();
                    } else {
                        console.log('[MAIN] Пользователь не вошел в систему, UI не создается');
                        console.log('[MAIN] Для тестирования можно установить статус: chrome.storage.local.set({userStatus: "loggedIn"})');
                    }
                });
            } else {
                console.error('[MAIN] chrome.storage недоступен!');
            }
        } catch (error) {
            console.error('[MAIN] Ошибка при работе с chrome.storage:', error);
        }

        // Слушаем сообщения от других частей расширения
        if (chrome?.runtime?.onMessage) {
            chrome.runtime.onMessage.addListener((message) => {
                console.log('[MAIN] Получено сообщение:', message);
                if (message.type === 'USER_LOGGED_IN') {
                    console.log('[MAIN] Получен сигнал входа, создаем UI...');
                    this.buildUI();
                }
                if (message.type === 'USER_LOGGED_OUT') {
                    console.log('[MAIN] Получен сигнал выхода, уничтожаем UI...');
                    this.destroyUI();
                }
            });
        } else {
            console.error('[MAIN] chrome.runtime недоступен!');
        }
    },

    buildUI() {
        console.log('[MAIN] buildUI() вызвана');
        if (this.elements.floatingIcon) {
            console.log('[MAIN] UI уже создан, пропускаем');
            return; // UI уже создан
        }

        console.log('[MAIN] Создаем плавающую иконку...');
        this.createFloatingIcon();
        console.log('[MAIN] Создаем окно решений...');
        this.createSolutionsWindow();
        console.log('[MAIN] Добавляем обработчики событий...');
        this.addEventListeners();
        console.log('[MAIN] UI успешно создан!');

        // Слушаем, когда панель Super Hover (или другая) закроется
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
        console.log('[MAIN] Создаем плавающую иконку...');
        this.elements.floatingIcon = document.createElement('div');
        this.elements.floatingIcon.id = 'super-floating-icon';
        
        // Используем текст вместо картинки для надежности
        this.elements.floatingIcon.innerHTML = `
            <div style="color: white; font-weight: bold; font-size: 14px;">SUPER</div>
        `;
        
        document.body.appendChild(this.elements.floatingIcon);
        console.log('[MAIN] Плавающая иконка добавлена в DOM');
        
        // Проверяем, что иконка действительно в DOM
        setTimeout(() => {
            const icon = document.getElementById('super-floating-icon');
            if (icon) {
                console.log('[MAIN] ✅ Иконка найдена в DOM:', icon);
                console.log('[MAIN] Стили иконки:', window.getComputedStyle(icon));
            } else {
                console.error('[MAIN] ❌ Иконка НЕ найдена в DOM!');
            }
        }, 100);
    },

    createSolutionsWindow() {
        this.elements.solutionsWindow = document.createElement('div');
        this.elements.solutionsWindow.id = 'super-solutions-window';
        this.elements.solutionsWindow.classList.add('super-hidden');

        let cardsHTML = '';
        for (const key in this.solutions) {
            const solution = this.solutions[key];
            
            // Умное условие: показывать Tilda моды только на сайтах Tilda
            if (key === 'tilda-mods' && !window.location.hostname.includes('tilda.cc')) {
                continue;
            }

            cardsHTML += `
                <div class="card" data-solution-key="${key}">
                    <h4>${solution.title}</h4>
                    <p>${solution.description}</p>
                </div>`;
        }
        this.elements.solutionsWindow.innerHTML = cardsHTML;
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
                this.elements.solutionsWindow.classList.add('super-hidden');
                const solutionKey = card.dataset.solutionKey;
                this.launchSolution(solutionKey);
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

// Безопасная инициализация
try {
    console.log('[MAIN] Начинаем инициализацию dbmSUPER_APP...');
    dbmSUPER_APP.init();
    console.log('[MAIN] Инициализация dbmSUPER_APP завершена успешно');
    
    // Делаем dbmSUPER_APP доступным глобально для отладки
    window.dbmSUPER_APP = dbmSUPER_APP;
    console.log('[MAIN] dbmSUPER_APP доступен как window.dbmSUPER_APP');
    console.log('[MAIN] Для принудительного создания UI: dbmSUPER_APP.buildUI()');
} catch (error) {
    console.error('[MAIN] Ошибка при инициализации dbmSUPER_APP:', error);
}