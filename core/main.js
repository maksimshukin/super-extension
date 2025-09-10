// core/main.js
const SHIFT_APP = {
    isPanelOpen: false,
    elements: {},

    // Определите все доступные решения здесь
    solutions: {
        'super-hover': {
            title: 'Super Hover',
            description: 'Создание продвинутых hover-эффектов',
            js: 'features/super-hover/super-hover.js',
            css: 'features/super-hover/super-hover.css',
            initializer: 'HoverArchitect.init()' // Функция, которую нужно вызвать из скрипта
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
            description: 'Запустить классические SHIFT моды для Tilda',
            js: 'features/tilda-mods/tilda.js',
            css: 'features/tilda-mods/tilda.css',
            initializer: 'initShiftExtension()' // Ваш оригинальный инициализатор
        }
    },

    init() {
        this.createFloatingIcon();
        this.createSolutionsWindow();
        this.addEventListeners();

        // Слушаем, когда панель функции (например, Super Hover) закрывается
        document.addEventListener('shift-panel-closed', () => {
            this.isPanelOpen = false;
            this.elements.floatingIcon.classList.remove('shift-hidden');
        });
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
        // Создаем карточку для каждого решения
        for (const key in this.solutions) {
            const solution = this.solutions[key];
            // Добавляем специальное условие для модов только для Tilda
            if (key === 'tilda-mods' && !window.location.hostname.includes('tilda.cc')) {
                continue; // Не показывать карточку Tilda, если это не сайт Tilda
            }
            cardsHTML += `
                <div class="card" data-solution-key="${key}">
                    <h4>${solution.title}</h4>
                    <p>${solution.description}</p>
                </div>
            `;
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
        const solution = this.solutions[key];
        if (!solution || !solution.js) {
            alert(`${solution.title} находится в разработке!`);
            return;
        }

        this.isPanelOpen = true;
        this.elements.floatingIcon.classList.add('shift-hidden');

        // Динамически внедряем CSS
        if (solution.css) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = chrome.runtime.getURL(solution.css);
            document.head.appendChild(link);
        }

        // Динамически внедряем и выполняем JS
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(solution.js);
        script.onload = () => {
            if (solution.initializer) {
                // Выполняем конкретную функцию инициализации для этой функции
                new Function(solution.initializer)();
            }
            script.remove(); // Очищаем тег скрипта
        };
        document.body.appendChild(script);
    }
};

// Запускаем приложение
SHIFT_APP.init();