
console.log('[SUPER-PANEL-MANAGER] Загружается...');

window.SuperPanelManager = {
    panel: null,
    overlay: null,
    contentContainer: null,
    headerContainer: null,
    isDragging: false,
    startX: 0,
    startWidth: 0,
    currentSolution: null, // Сохраняем текущее решение
    isOpen: false,
    isMinimized: false,


init() {
    if (document.getElementById('dbm-editor-panel')) {
        this.panel = document.getElementById('dbm-editor-panel');
        this.contentContainer = this.panel.querySelector('#dbm-panel-content');
        this.headerContainer = this.panel.querySelector('#dbm-panel-header-content');
        // FIX: Добавляем кеширование футера и оверлея при повторной инициализации
        this.footerContainer = this.panel.querySelector('#dbm-panel-footer');
        this.overlay = this.panel.querySelector('#dbm-panel-overlay');
        this.addEventListeners();
        return;
    }

    this.createPanel();
    this.addEventListeners();
    console.log('[SuperPanelManager] Панель инициализирована');
},

    createPanel() {
        const panelHTML = `
            <div id="dbm-editor-panel" class="collapsed">
                <div id="dbm-panel-resize-handle"></div>
                <div id="dbm-panel-top-toolbar">
                    <div class="dbm-panel-main-title-wrapper">
                        <button id="dbm-panel-back-btn" class="dbm-icon-btn dbm-btn-sm" title="Назад" style="display: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <h3 class="dbm-panel-main-title"><!-- Название решения будет здесь --></h3>
                    </div>
                    <div class="dbm-panel-controls">
                        <button id="dbm-panel-minimize-btn" class="dbm-icon-btn dbm-btn-sm" title="Свернуть панель">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        </button>
                        <button id="dbm-panel-close-btn" class="dbm-icon-btn dbm-btn-sm" title="Закрыть панель">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>


                <div id="dbm-panel-header">
                    <div id="dbm-panel-header-content">
                        <!-- Заголовок будет вставляться сюда -->
                    </div>
                </div>





                <div class="dbm-content-and-footer-wrapper">
                    <div id="dbm-panel-content">
                        <!-- Контент решения будет вставляться сюда -->
                    </div>
                    <div id="dbm-panel-footer">
                        <!-- Футер решения будет вставляться сюда -->
                    </div>
                </div>
                <div id="dbm-panel-overlay"></div>
            </div>
            <button id="dbm-panel-toggle-collapsed">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
        `;
        document.body.insertAdjacentHTML('beforeend', panelHTML);

        this.panel = document.getElementById('dbm-editor-panel');
        this.contentContainer = document.getElementById('dbm-panel-content');
        this.headerContainer = document.getElementById('dbm-panel-header-content');
        this.footerContainer = document.getElementById('dbm-panel-footer');
        this.overlay = document.getElementById('dbm-panel-overlay');
    },

    addEventListeners() {
        const resizeHandle = document.getElementById('dbm-panel-resize-handle');
        const toggleButton = document.getElementById('dbm-panel-toggle-collapsed');
        const closeButton = document.getElementById('dbm-panel-close-btn');
        const minimizeButton = document.getElementById('dbm-panel-minimize-btn');
        const backButton = document.getElementById('dbm-panel-back-btn');

        resizeHandle.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));

        toggleButton.addEventListener('click', () => this.open());
        closeButton.addEventListener('click', () => this.fullClose());
        minimizeButton.addEventListener('click', () => this.minimize());
        backButton.addEventListener('click', () => this.goBack());

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideModal();
            }
        });
    },

    open() {
        this.panel.classList.remove('collapsed');
        this.hideFloatingIcon();
        this.showToggleButton();
        this.isOpen = true;
        this.isMinimized = false;
        
        // Если есть сохраненное решение, восстанавливаем его
        if (this.currentSolution) {
            console.log(`[SUPER-PANEL-MANAGER] Восстанавливаем решение: ${this.currentSolution}`);
            // Отправляем событие для восстановления решения
            window.dispatchEvent(new CustomEvent('dbmInitSolution', {
                detail: {
                    name: this.currentSolution
                }
            }));
        }
    },

    close() {
        this.panel.classList.add('collapsed');
        this.isOpen = false;
    },

    fullClose() {
        // Полное закрытие панели с очисткой содержимого
        this.panel.classList.add('collapsed');
        this.clearContent();
        this.clearHeader();
        this.clearFooter();
        this.clearSolutionTitle();
        this.hideBackButton();
        
        // Скрываем кнопку toggle-collapsed при полном закрытии
        this.hideToggleButton();
        
        // Показываем плавающую иконку снова
        this.showFloatingIcon();
        
        // НЕ очищаем currentSolution - оставляем для восстановления
        console.log('[SuperPanelManager] Панель полностью закрыта, текущее решение сохранено:', this.currentSolution);
    },

    minimize() {
        // Сворачивание панели (НЕ показываем плавающую иконку)
        this.panel.classList.add('collapsed');
        this.isOpen = false;
        this.isMinimized = true;
        console.log('[SuperPanelManager] Панель свернута');
    },

    goBack() {
        // Вызываем событие для возврата назад - решения сами должны на него реагировать
        const backEvent = new CustomEvent('dbmPanelBack', {
            detail: { source: 'SuperPanelManager' }
        });
        document.dispatchEvent(backEvent);
        console.log('[SuperPanelManager] Отправлено событие возврата назад');
    },

    showBackButton() {
        const backButton = document.getElementById('dbm-panel-back-btn');
        if (backButton) {
            backButton.style.display = 'flex';
        }
    },

    hideBackButton() {
        const backButton = document.getElementById('dbm-panel-back-btn');
        if (backButton) {
            backButton.style.display = 'none';
        }
    },

    showFloatingIcon() {
        const floatingIcon = document.getElementById('super-floating-icon');
        if (floatingIcon) {
            floatingIcon.classList.remove('super-hidden');
            console.log('[SuperPanelManager] Плавающая иконка показана');
        }
    },

    hideFloatingIcon() {
        const floatingIcon = document.getElementById('super-floating-icon');
        if (floatingIcon) {
            floatingIcon.classList.add('super-hidden');
            console.log('[SuperPanelManager] Плавающая иконка скрыта');
        }
    },

    showToggleButton() {
        const toggleButton = document.getElementById('dbm-panel-toggle-collapsed');
        if (toggleButton) {
            toggleButton.style.display = 'flex';
        }
    },

    hideToggleButton() {
        const toggleButton = document.getElementById('dbm-panel-toggle-collapsed');
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
    },

    setHeader(headerHTML) {
        if (!this.headerContainer) {
            console.error('[SuperPanelManager] Header container не найден!');
            return;
        }
        console.log('[SuperPanelManager] Устанавливаем заголовок...');
        this.headerContainer.innerHTML = headerHTML;
    },

    setContent(contentHTML) {
        if (!this.contentContainer) {
            console.error('[SuperPanelManager] Content container не найден!');
            return;
        }
        console.log('[SuperPanelManager] Устанавливаем контент...');
        this.contentContainer.innerHTML = contentHTML;
    },

    setFooter(footerHTML) {
        if (!this.footerContainer) {
            console.error('[SuperPanelManager] Footer container не найден!');
            return;
        }
        console.log('[SuperPanelManager] Устанавливаем футер...');
        this.footerContainer.innerHTML = footerHTML;
    },

    clearFooter() {
        if (this.footerContainer) {
            this.footerContainer.innerHTML = '';
        }
    },

    setSolutionTitle(title) {
        const titleElement = document.querySelector('.dbm-panel-main-title');
        if (titleElement) {
            titleElement.textContent = title;
            console.log('[SuperPanelManager] Установлен заголовок решения:', title);
        }
    },

    setCurrentSolution(solutionKey) {
        this.currentSolution = solutionKey;
        console.log(`[SUPER-PANEL-MANAGER] Сохранено текущее решение: ${solutionKey}`);
    },

    getCurrentSolution() {
        return this.currentSolution;
    },

    clearContent() {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }
    },

    clearHeader() {
        if (this.headerContainer) {
            this.headerContainer.innerHTML = '';
        }
    },

    clearSolutionTitle() {
        const titleElement = document.querySelector('.dbm-panel-main-title');
        if (titleElement) {
            titleElement.textContent = '';
        }
    },

    showModal(modalHTML) {
        this.overlay.innerHTML = modalHTML;
        this.overlay.classList.add('visible');
    },

    hideModal() {
        this.overlay.classList.remove('visible');
        this.overlay.innerHTML = '';
    },
    
    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startWidth = this.panel.offsetWidth;
        this.panel.style.transition = 'none';
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    },

    drag(e) {
        if (!this.isDragging) return;
        const newWidth = this.startWidth - (e.clientX - this.startX);
        if (newWidth > 380 && newWidth < 800) { // Min and Max width
            this.panel.style.width = newWidth + 'px';
        }
    },

    stopDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            this.panel.style.transition = '';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }
};

// Сразу инициализируем, чтобы панель была готова
SuperPanelManager.init();

console.log('[SUPER-PANEL-MANAGER] ✅ Загружен и инициализирован');
