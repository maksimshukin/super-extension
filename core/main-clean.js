const dbmSUPER_APP = {
    isPanelOpen: false,
    elements: {},
    solutions: {
        'super-hover': {
            title: 'Super Hover',
            description: 'Создание продвинутых hover-эффектов',
            js: 'features/super-hover/super-hover.js',
            css: 'features/super-hover/super-hover.css',
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
            initializer: null
        }
    },
    init() {
        try {
            if (chrome?.storage?.local) {
                chrome.storage.local.get('userStatus', (data) => {
                    if (data.userStatus === 'loggedIn') {
                        this.buildUI();
                    }
                });
            }
        } catch (error) {
            // Ignore
        }
        if (chrome?.runtime?.onMessage) {
            chrome.runtime.onMessage.addListener((message) => {
                if (message.type === 'USER_LOGGED_IN') {
                    this.buildUI();
                }
                if (message.type === 'USER_LOGGED_OUT') {
                    this.destroyUI();
                }
            });
        }
    },
    buildUI() {
        if (this.elements.floatingIcon) {
            return;
        }
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
        this.elements.floatingIcon.innerHTML = `<div style="color: white; font-weight: bold; font-size: 14px;">SUPER</div>`;
        document.body.appendChild(this.elements.floatingIcon);
        setTimeout(() => {
            const icon = document.getElementById('super-floating-icon');
            if (!icon) {
                // Retry once
                document.body.appendChild(this.elements.floatingIcon);
            }
        }, 100);
    },
    createSolutionsWindow() {
        this.elements.solutionsWindow = document.createElement('div');
        this.elements.solutionsWindow.id = 'super-solutions-window';
        this.elements.solutionsWindow.classList.add('super-hidden');
        this.elements.solutionsWindow.innerHTML = Object.entries(this.solutions).map(([key, solution]) => `
            <div class="card" data-solution="${key}">
                <h4>${solution.title}</h4>
                <p>${solution.description}</p>
            </div>
        `).join('');
        document.body.appendChild(this.elements.solutionsWindow);
    },
    addEventListeners() {
        this.elements.floatingIcon.addEventListener('click', () => {
            this.elements.solutionsWindow.classList.toggle('super-hidden');
        });
        this.elements.solutionsWindow.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const solutionKey = card.dataset.solution;
                this.elements.solutionsWindow.classList.add('super-hidden');
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
        this.elements.floatingIcon.classList.add('super-hidden');
        if (solution.css) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL(solution.css);
            document.head.appendChild(link);
        }
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(solution.js);
        script.type = 'module';
        script.onload = () => {
            // Script loaded successfully
        };
        script.onerror = (error) => {
            // Script failed to load
        };
        document.head.appendChild(script);
    }
};
try {
    dbmSUPER_APP.init();
    window.dbmSUPER_APP = dbmSUPER_APP;
} catch (error) {
    // Ignore initialization errors
}
