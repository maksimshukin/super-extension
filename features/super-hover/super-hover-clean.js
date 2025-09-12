const HoverArchitect = {
    isSelectionMode: false,
    isReselectMode: false,
    highlightedElement: null,
    pinnedElement: null,
    activeParentSelector: null,
    activeKey: 'parent',
    allEffects: {},
    userPresets: [],
    hasUnsavedChanges: false,
    useBlockPrefix: true,
    els: {},
    STORAGE_KEY: 'hoverArchitectUserPresets_v5',
    PANEL_WIDTH_KEY: 'hoverArchitectPanelWidth',
    CLASS_BLOCKLIST: ['r', 't-rec', 't-records', 't-container', 't-align_center', 't-align_left', 't-margin_auto', 'highlight-element', 'currently-editing-element'],
    TRANSLATION_MAP: {
        card: 'Карточка',
        item: 'Элемент',
        product: 'Товар',
        post: 'Пост',
        title: 'Заголовок',
        name: 'Имя',
        descr: 'Описание',
        text: 'Текст',
        wrapper: 'Обертка',
        container: 'Контейнер',
        cover: 'Обложка',
        button: 'Кнопка',
        btn: 'Кнопка',
        link: 'Ссылка',
        image: 'Изображение',
        img: 'Изображение',
        icon: 'Иконка'
    },
    TILDA_BLOCK_MAP: {
        'BL01.': 'Header',
        'BL02.': 'Hero section',
        'BL03.': 'Image gallery',
        'BL04.': 'Content block',
        'BL05.': 'Footer'
    },
    DEFAULT_PRESETS: [
        {
            name: 'Lift Up',
            description: 'Легкое поднятие элемента',
            state: {
                animationEnabled: true,
                duration: 300,
                easing: 'ease',
                transformEnabled: true,
                translateY: -10,
                boxShadowEnabled: true,
                boxShadowY: 10,
                boxShadowBlur: 20,
                boxShadowColor: 'rgba(0,0,0,0.15)'
            }
        }
    ],
    getPanelHTML() {
        return `
            <div id="panel-resize-handle"></div>
            <header id="panel-top-toolbar">
                <button id="manage-presets-btn" class="dbm-toolbar-btn" title="Управление пресетами">
                    <lord-icon src="https://cdn.lordicon.com/asyunleq.json" trigger="hover" style="width:24px;height:24px"></lord-icon>
                </button>
                <button id="copy-code-btn" class="dbm-toolbar-btn" title="Копировать CSS">
                    <lord-icon src="https://cdn.lordicon.com/wloilxuq.json" trigger="hover" style="width:24px;height:24px"></lord-icon>
                </button>
            </header>
            <header id="panel-header"></header>
            <div id="panel-content">
                <div id="manager-view">
                    <div id="effects-list" class="flex flex-col gap-4"></div>
                </div>
                <div id="editor-view" class="hidden">
                    <div id="main-editor-content">
                        <div class="dbm-subsection">
                            <h3 class="!mb-0">Слои анимации</h3>
                            <div id="elements-tabs" class="mt-4"></div>
                            <div class="dbm-grid-2 mt-4">
                                <button id="add-child-target-btn" class="dbm-btn dbm-btn-secondary w-full !text-sm !py-2">
                                    ➕ Дочерний элемент
                                </button>
                                <button id="add-has-effect-btn" class="dbm-btn dbm-btn-secondary w-full !text-sm !py-2">
                                    ✨ Эффект :has
                                </button>
                            </div>
                        </div>
                        <div class="dbm-subsection">
                            <div id="preset-indicator-container"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 class="!mb-0">Свойства анимации</h3>
                                <div class="flex items-center gap-2">
                                    <button id="ai-helper-btn" class="dbm-btn dbm-btn-secondary !py-2 !px-4 !text-sm">
                                        ✨ AI-помощник
                                    </button>
                                    <button id="open-presets-modal-btn" class="dbm-btn dbm-btn-secondary !py-2 !px-4 !text-sm">
                                        🎨 Пресеты
                                    </button>
                                </div>
                            </div>
                            <div id="controls-container"></div>
                        </div>
                    </div>
                </div>
            </div>
            <footer id="panel-footer">
                <button id="add-new-effect-btn" class="dbm-btn dbm-btn-primary w-full">Создать новый эффект</button>
            </footer>
            <div id="create-preset-container">
              <button id="create-preset-btn" class="dbm-btn dbm-btn-secondary w-full">Создать пресет из изменений</button>
            </div>
            <div id="panel-overlay"></div>
        `;
    },
    getControlsHTML() {
        const groups = [
            {
                title: 'Анимация',
                controls: [
                    { key: 'animationEnabled', type: 'toggle', label: 'Включить анимацию' },
                    { key: 'duration', type: 'slider', label: 'Длительность', min: 100, max: 2000, step: 50, unit: 'ms' },
                    { key: 'easing', type: 'select', label: 'Тип анимации', options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'] }
                ]
            }
        ];
        return `
            <div class="dbm-controls-grid">
                ${groups.map(g => `
                    <div class="dbm-control-group">
                        <h4>${g.title}</h4>
                        ${g.controls.map(c => this.renderControl(c)).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    },
    init() {
        if (document.getElementById('editor-panel')) {
            this.els.panel = document.getElementById('editor-panel');
            this.els.panel.classList.remove('collapsed');
            return;
        }
        const container = document.createElement('div');
        container.innerHTML = `
            <aside id="editor-panel"></aside>
            <button id="panel-toggle-collapsed" title="Развернуть панель"></button>
            <div id="inspector-tooltip"></div>
            <style id="dynamic-hover-styles"></style>
            <template id="ai-assistant-modal-template">
                <div class="modal-content-wrapper"></div>
            </template>
        `;
        document.body.appendChild(container);
        this.els.panel = document.getElementById('editor-panel');
        this.els.panelToggle = document.getElementById('panel-toggle-collapsed');
        this.els.inspector = document.getElementById('inspector-tooltip');
        this.els.dynamicStyles = document.getElementById('dynamic-hover-styles');
        this.els.panel.innerHTML = this.getPanelHTML();
        this.els.panelToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>`;
        Object.assign(this.els, {
            header: document.getElementById('panel-header'),
            managerView: document.getElementById('manager-view'),
            editorView: document.getElementById('editor-view'),
            effectsList: document.getElementById('effects-list'),
            elementsTabs: document.getElementById('elements-tabs'),
            addNewBtn: document.getElementById('add-new-effect-btn'),
            footer: document.getElementById('panel-footer'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            managePresetsBtn: document.getElementById('manage-presets-btn'),
            createPresetContainer: document.getElementById('create-preset-container'),
            createPresetBtn: document.getElementById('create-preset-btn'),
            panelOverlay: document.getElementById('panel-overlay'),
            presetIndicatorContainer: document.getElementById('preset-indicator-container'),
            resizeHandle: document.getElementById('panel-resize-handle')
        });
        const savedWidth = localStorage.getItem(this.PANEL_WIDTH_KEY);
        if (savedWidth) {
            this.els.panel.style.width = savedWidth;
        }
        this.loadUserPresets();
        this.initEventListeners();
        this.showManagerView();
    },
    initEventListeners() {
        if (this.els.addNewBtn) {
            this.els.addNewBtn.addEventListener('click', () => this.startSelectionMode());
        }
        if (this.els.copyCodeBtn) {
            this.els.copyCodeBtn.addEventListener('click', () => this.copyCSS());
        }
        if (this.els.panelToggle) {
            this.els.panelToggle.addEventListener('click', () => this.els.panel.classList.remove('collapsed'));
        }
        if (this.els.managePresetsBtn) {
            this.els.managePresetsBtn.addEventListener('click', () => this.showPresetsManagerModal({ context: 'manage' }));
        }
        this.els.createPresetBtn.addEventListener('click', () => this.showCreatePresetModal());
        document.body.addEventListener('mousemove', e => this.handleMouseMove(e));
        document.body.addEventListener('click', e => this.handleBodyClick(e), true);
        document.body.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (this.isSelectionMode) this.endSelectionMode(true);
                this.removeModal();
            }
        }, true);
        const resizePanel = (e) => {
            const newWidth = window.innerWidth - e.clientX - 20;
            if (newWidth > 380 && newWidth < 800) {
                this.els.panel.style.width = `${newWidth}px`;
            }
        };
        const stopResize = () => {
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', resizePanel);
            window.removeEventListener('mouseup', stopResize);
            localStorage.setItem(this.PANEL_WIDTH_KEY, this.els.panel.style.width);
        };
        this.els.resizeHandle.addEventListener('mousedown', () => {
            document.body.style.cursor = 'ew-resize';
            window.addEventListener('mousemove', resizePanel);
            window.addEventListener('mouseup', stopResize);
        });
    },
    startSelectionMode() {
        this.isSelectionMode = true;
        document.body.style.cursor = 'crosshair';
    },
    endSelectionMode(cancelled = false) {
        this.isSelectionMode = false;
        document.body.style.cursor = 'default';
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('highlight-element');
            this.highlightedElement = null;
        }
    },
    handleMouseMove(e) {
        if (!this.isSelectionMode) return;
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('highlight-element');
        }
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && !element.closest('#editor-panel')) {
            element.classList.add('highlight-element');
            this.highlightedElement = element;
        }
    },
    handleBodyClick(e) {
        if (!this.isSelectionMode) return;
        e.preventDefault();
        e.stopPropagation();
        const element = e.target;
        if (element.closest('#editor-panel')) return;
        this.selectElement(element);
        this.endSelectionMode();
    },
    selectElement(element) {
        const selector = this.generateSelector(element);
        this.activeParentSelector = selector;
        this.activeKey = 'parent';
        if (!this.allEffects[selector]) {
            this.allEffects[selector] = this.getDefaultEffectState();
        }
        this.showEditorView();
    },
    generateSelector(element) {
        if (element.id) return `#${element.id}`;
        const classes = Array.from(element.classList).filter(cls => !this.CLASS_BLOCKLIST.includes(cls));
        if (classes.length > 0) return `.${classes[0]}`;
        return element.tagName.toLowerCase();
    },
    showManagerView() {
        this.els.managerView.classList.remove('hidden');
        this.els.editorView.classList.add('hidden');
        this.buildEffectsList();
    },
    showEditorView() {
        this.els.managerView.classList.add('hidden');
        this.els.editorView.classList.remove('hidden');
        this.buildEffectTree();
        this.loadStateIntoControls(this.activeKey);
    },
    buildEffectsList() {
        const effects = Object.keys(this.allEffects);
        if (effects.length === 0) {
            this.els.effectsList.innerHTML = '<p class="text-center text-gray-500">Нет созданных эффектов</p>';
            return;
        }
        this.els.effectsList.innerHTML = effects.map(selector => `
            <div class="effect-card" data-selector="${selector}">
                <h4>${selector}</h4>
                <button class="edit-btn">Редактировать</button>
                <button class="delete-btn">Удалить</button>
            </div>
        `).join('');
    },
    buildEffectTree() {
        const effect = this.allEffects[this.activeParentSelector];
        if (!effect) return;
        const tabs = ['parent'];
        Object.keys(effect.children).forEach(key => tabs.push(`child:${key}`));
        effect._hasEffects.forEach((_, index) => tabs.push(`_has:${index}`));
        this.els.elementsTabs.innerHTML = tabs.map(key => `
            <button class="element-tab ${key === this.activeKey ? 'active' : ''}" data-key="${key}">
                ${this.getTabDisplayName(key)}
            </button>
        `).join('');
    },
    getTabDisplayName(key) {
        if (key === 'parent') return 'Основной';
        if (key.startsWith('child:')) return `Дочерний: ${key.slice(6)}`;
        if (key.startsWith('_has:')) return `Has: ${key.slice(5)}`;
        return key;
    },
    loadStateIntoControls(key) {
        const state = this.getCurrentStateForKey(key);
        if (!state) return;
        this.els.controlsContainer = document.getElementById('controls-container');
        this.els.controlsContainer.innerHTML = this.getControlsHTML();
    },
    getCurrentStateForKey(key = this.activeKey) {
        const effect = this.allEffects[this.activeParentSelector];
        if (!effect) return null;
        if (key === 'parent') return effect.parent;
        if (key.startsWith('child:')) {
            const childKey = key.slice(6);
            return effect.children[childKey] || this.getDefaultState();
        }
        if (key.startsWith('_has:')) {
            const index = parseInt(key.slice(5));
            return effect._hasEffects[index] || this.getDefaultState();
        }
        return null;
    },
    getDefaultState() {
        return {
            animationEnabled: true,
            duration: 300,
            easing: 'ease',
            transformEnabled: false,
            translateX: 0,
            translateY: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            styleEnabled: false,
            opacity: 1,
            backgroundColor: '',
            textEnabled: false,
            color: '',
            fontSize: '',
            fontWeight: '',
            borderEnabled: false,
            borderTopLeftRadius: '',
            borderTopRightRadius: '',
            borderBottomLeftRadius: '',
            borderBottomRightRadius: '',
            borderWidth: '',
            borderStyle: 'solid',
            borderColor: '',
            boxShadowEnabled: false,
            boxShadowX: 0,
            boxShadowY: 10,
            boxShadowBlur: 20,
            boxShadowSpread: 0,
            boxShadowColor: 'rgba(0,0,0,0.15)',
            filterEnabled: false
        };
    },
    getDefaultEffectState() {
        return {
            parent: this.getDefaultState(),
            children: {},
            _hasEffects: []
        };
    },
    renderControl(control) {
        return `<div class="dbm-control">${control.label}</div>`;
    },
    copyCSS() {
        const css = this.generateCSS();
        navigator.clipboard.writeText(css);
    },
    generateCSS() {
        let css = '';
        for (const [selector, effect] of Object.entries(this.allEffects)) {
            css += this.generateCSSForEffect(selector, effect);
        }
        return css;
    },
    generateCSSForEffect(selector, effect) {
        return `${selector}:hover { transform: translateY(-10px); }`;
    },
    loadUserPresets() {
        this.userPresets = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    },
    saveUserPresets() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userPresets));
    },
    showPresetsManagerModal() {
        const modal = document.createElement('div');
        modal.innerHTML = '<div>Presets Manager</div>';
        document.body.appendChild(modal);
    },
    showCreatePresetModal() {
        const modal = document.createElement('div');
        modal.innerHTML = '<div>Create Preset</div>';
        document.body.appendChild(modal);
    },
    removeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.remove());
    }
};
window.HoverArchitect = HoverArchitect;
if (typeof globalThis !== 'undefined') {
    globalThis.HoverArchitect = HoverArchitect;
}
setTimeout(() => {
    window.dispatchEvent(new CustomEvent('HoverArchitectReady', {
        detail: { 
            ready: true,
            HoverArchitect: HoverArchitect
        }
    }));
}, 10);
