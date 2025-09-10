// core/main.js
const SHIFT_APP = {
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
            initializer: 'HoverArchitect'
        },
        'super-grid': {
            title: 'Super Grid',
            description: 'Продвинутая сеточная система (в разработке)',
        },
        'super-slider': {
            title: 'Super Slider',
            description: 'Мощный конструктор слайдеров (в разработке)',
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
        console.log('[MAIN] SHIFT_APP инициализируется...');
        
        // Ждем, пока пользователь войдет в систему
        chrome.storage.local.get('userStatus', (data) => {
            console.log('[MAIN] Проверка статуса пользователя:', data);
            if (data.userStatus === 'loggedIn') {
                console.log('[MAIN] Пользователь вошел в систему, создаем UI...');
                this.buildUI();
            } else {
                console.log('[MAIN] Пользователь не вошел в систему, UI не создается');
            }
        });

        // Слушаем сообщения от других частей расширения
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
        document.addEventListener('shift-panel-closed', () => {
            this.isPanelOpen = false;
            this.elements.floatingIcon.classList.remove('shift-hidden');
        });
    },

    destroyUI() {
        this.elements.floatingIcon?.remove();
        this.elements.solutionsWindow?.remove();
        this.elements = {};
    },

    createFloatingIcon() {
        this.elements.floatingIcon = document.createElement('div');
        this.elements.floatingIcon.id = 'shift-floating-icon';
        this.elements.floatingIcon.innerHTML = `<img src="${chrome.runtime.getURL('assets/icon128.png')}" alt="SHIFT">`;
        document.body.appendChild(this.elements.floatingIcon);
    },

    createSolutionsWindow() {
        this.elements.solutionsWindow = document.createElement('div');
        this.elements.solutionsWindow.id = 'shift-solutions-window';
        this.elements.solutionsWindow.classList.add('shift-hidden');

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
            this.elements.solutionsWindow.classList.toggle('shift-hidden');
        });

        this.elements.solutionsWindow.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                this.elements.solutionsWindow.classList.add('shift-hidden');
                const solutionKey = card.dataset.solutionKey;
                this.launchSolution(solutionKey);
            }
        });
    },

    async launchSolution(key) {
        console.log('[MAIN] launchSolution вызвана для:', key);
        const solution = this.solutions[key];
        if (!solution || !solution.js) {
            console.log('[MAIN] Решение не найдено или в разработке:', key);
            alert(`${solution.title} находится в разработке!`);
            return;
        }

        console.log('[MAIN] Запускаем решение:', solution.title);
        this.isPanelOpen = true;
        this.elements.floatingIcon.classList.add('shift-hidden');



        if (solution.css) {
            console.log('[MAIN] Загружаем CSS:', solution.css);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL(solution.css);
            document.head.appendChild(link);
        }

        console.log('[MAIN] Загружаем JS:', solution.js);
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(solution.js);
        script.onload = () => {
            console.log('[MAIN] Скрипт загружен, проверяем инициализатор:', solution.initializer);
            if (solution.initializer && window[solution.initializer]) {
                console.log('[MAIN] Вызываем инициализатор:', solution.initializer + '.init()');
                // Вызываем метод .init() у нужного объекта, например, HoverArchitect.init()
                window[solution.initializer].init();
            } else {
                console.log('[MAIN] Инициализатор не найден или не определен');
            }
            script.remove();
        };
        script.onerror = (error) => {
            console.error('[MAIN] Ошибка загрузки скрипта:', error);
        };
        document.body.appendChild(script);
    }
};

SHIFT_APP.init();