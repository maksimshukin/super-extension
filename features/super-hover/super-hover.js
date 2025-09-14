console.log('[SUPER-HOVER] Создаем объект dbmHoverArchitect...');
console.log('[SUPER-HOVER] Контекст window:', window === top.window ? 'основное окно' : 'iframe/изолированный');
   const dbmHoverArchitect = {
        // --- STATE ---
        isSelectionMode: false,
        isReselectMode: false,
        highlightedElement: null,
        pinnedElement: null,
        activeParentSelector: null, // The selector for the element being edited
            activeKey: 'parent',         // The specific layer being edited ('parent', 'child:.class', '_has:0')
            allEffects: {},                 // All stored effects, keyed by parent selector
        userPresets: [],
        hasUnsavedChanges: false,
        useBlockPrefix: true,
        // --- UI ELEMENTS ---
        els: {},
        // --- CONSTANTS ---
        STORAGE_KEY: 'hoverArchitectUserPresets_v5',
        PANEL_WIDTH_KEY: 'hoverArchitectPanelWidth',
            //    DEFAULT_PRESETS: {
            //        "Плавный подъем": {
            //            effects: {
            //                parent: {
            //                    transformEnabled: true,
            //                    translateY: -10,
            //                    boxShadowEnabled: true,
            //                    boxShadowY: 20,
            //                    boxShadowBlur: 30,
            //                    boxShadowSpread: -10,
            //                    boxShadowColor: "rgba(0,0,0,0.15)",
            //                    duration: 300,
            //                    easing: 'ease-out'
            //                }
            //            }
            //        },
            //        "Синий текст при наведении": {
            //            effects: {
            //                parent: {
            //                    duration: 250,
            //                    easing: 'ease-in-out'
            //                },
            //                children: {
            //                    '.t-descr': {
            //                        textEnabled: true,
            //                        color: '#007bff',
            //                        duration: 250,
            //                        easing: 'ease-in-out'
            //                    }
            //                }
            //            }
            //        }
            //    },    

// ✅ ЗАМЕНИ СВОЙ ОБЪЕКТ DEFAULT_PRESETS НА ЭТОТ
                DEFAULT_PRESETS: {
                    "Плавный подъем": {
        // Это просто набор стилей для ОДНОГО слоя
        styles: {
                                transformEnabled: true,
                                translateY: -10,
                                boxShadowEnabled: true,
                                boxShadowY: 20,
                                boxShadowBlur: 30,
                                boxShadowSpread: -10,
                                boxShadowColor: "rgba(0,0,0,0.15)",
            animationEnabled: true,
                                duration: 300,
                                easing: 'ease-out'
                        }
                    },
                    "Синий текст при наведении": {
        styles: {
                                    textEnabled: true,
                                    color: '#007bff',
            animationEnabled: true,
                                    duration: 250,
                                    easing: 'ease-in-out'
                                }
    },
    "Легкое приближение с тенью": {
        styles: {
            transformEnabled: true,
            scaleX: 1.05,
            scaleY: 1.05,
            boxShadowEnabled: true,
            boxShadowY: 15,
            boxShadowBlur: 25,
            boxShadowSpread: -5,
            boxShadowColor: "rgba(0,0,0,0.1)",
            animationEnabled: true,
            duration: 250,
            easing: 'ease-out'
        }
    }
},
        // --- HTML TEMPLATES ---
        dbmGetPanelHTML() {
            return `
                <div id="dbm-hover-content">
                    <div id="dbm-manager-view">
                        <div id="dbm-manager-header" class="dbm-subsection-header" style="display: none;">
                            <h3>Все эффекты</h3>
                    </div>
                        <div id="dbm-effects-list"></div>
    </div>
                    <div id="dbm-editor-view" class="hidden">
<div class="dbm-subsection">
                            <h3 class="dbm-layers-title">Слои анимации</h3>
                            <div id="dbm-elements-tabs"></div>
                            <div id="dbm-elements-tabs-actions">
                    
                                <button id="dbm-add-child-btn" class="dbm-btn dbm-btn-secondary  dbm-btn-sm">Дочерний элемент${window.SuperSelectionManager?.ICONS?.add || ''}</button>
                                <button id="dbm-add-has-btn" class="dbm-btn dbm-btn-secondary dbm-btn-sm">Эффект :has ${window.SuperSelectionManager?.ICONS?.magic || ''}</button>
    </div>
</div>
                        <div class="dbm-subsection">
                            <div id="dbm-preset-indicator-container"></div>
                            <div class="dbm-subsection-header">
                                <h3>Свойства</h3>
                                <div class="dbm-subsection-actions">
                                    
                                     <button id="dbm-ai-helper-btn" class="dbm-btn dbm-btn-secondary dbm-btn-sm">AI ${window.SuperSelectionManager?.ICONS?.ai || ''}</button>
                                     <button id="dbm-open-presets-btn" class="dbm-btn dbm-btn-secondary dbm-btn-sm">Пресеты ${window.SuperSelectionManager?.ICONS?.palette || ''}</button>
                                     <button id="dbm-create-preset-btn" class="dbm-btn-sm dbm-btn-icon dbm-btn-secondary" title="Создать пресет из изменений">${window.SuperSelectionManager?.ICONS?.savePreset || ''}</button>
</div>
                        </div>
                            <div id="dbm-controls-container"></div>
                    </div>
                </div>
            `;
        },
        
        dbmGetFooterHTML() {
            return `
                <button id="dbm-copy-code-btn" class="dbm-btn-icon dbm-btn-secondary" title="Копировать CSS">${window.SuperSelectionManager?.ICONS?.copyCode || '📋'}</button>
                <button id="dbm-add-new-effect-btn" class="dbm-btn dbm-btn-primary">Создать новый эффект</button>
            `;
        },
        
dbmGetControlsHTML() {
        const groups = [
        { name: 'animation', title: 'Анимация' },
        { name: 'transform', title: 'Трансформация' },
        { name: 'style', title: 'Фон' },
        { name: 'text', title: 'Типографика' },
        { name: 'marginPadding', title: 'Отступы' },
        { name: 'border', title: 'Границы и углы' },
        { name: 'boxShadow', title: 'Тень' },
        { name: 'filter', title: 'Фильтры'},
        ];
            return `
            <div class="dbm-subsection">
                
                <div class="dbm-controls-grid">
                    ${groups.map(g => `
                        <div class="dbm-property-group-card" data-group-name="${g.name}">
                            <div class="dbm-card-header">
                                <h4>${g.title}</h4>
                            </div>
                            <p class="dbm-card-effect-count">0 эффектов</p>
                            <label class="dbm-switch"><input type="checkbox" data-switch="${g.name}"><span class="dbm-slider"></span></label>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        },
        // --- INITIALIZATION ---
        dbmInit() {
            console.log('[SUPER-HOVER] dbmInit() вызван');
            
            // Проверяем наличие необходимых менеджеров
            if (typeof window.SuperPanelManager === 'undefined') {
                console.error('[SUPER-HOVER] ❌ SuperPanelManager не найден!');
                return;
            }
            
            if (typeof window.SuperSelectionManager === 'undefined') {
                console.error('[SUPER-HOVER] ❌ SuperSelectionManager не найден!');
                return;
            }
            
            console.log('[SUPER-HOVER] ✅ Все менеджеры найдены, продолжаем инициализацию...');
            
            // Устанавливаем название решения в панели
            window.SuperPanelManager.setSolutionTitle('Super Hover');
            
            // Синхронизируем настройку useBlockPrefix с SuperSelectionManager
            window.SuperSelectionManager.useBlockPrefix = this.useBlockPrefix;
            
            // Используем панель от SuperPanelManager вместо создания собственной
            this.els.panel = document.getElementById('dbm-editor-panel');
            if (!this.els.panel) {
                console.error('[SUPER-HOVER] ❌ Панель не найдена');
                return;
            }
            // Инициализируем элементы для совместимости с существующим кодом
            // Создаем необходимые элементы для совместимости
            if (!document.getElementById('dbm-inspector-tooltip')) {
                const inspector = document.createElement('div');
                inspector.id = 'dbm-inspector-tooltip';
                document.body.appendChild(inspector);
            }
            
            if (!document.getElementById('dbm-dynamic-hover-styles')) {
                const styles = document.createElement('style');
                styles.id = 'dbm-dynamic-hover-styles';
                document.head.appendChild(styles);
            }
            
            // Используем SuperPanelManager для отображения контента
            this.els.inspector = document.getElementById('dbm-inspector-tooltip');
            this.els.dynamicStyles = document.getElementById('dbm-dynamic-hover-styles');
            
            window.SuperPanelManager.setContent(this.dbmGetPanelHTML());
            window.SuperPanelManager.setFooter(this.dbmGetFooterHTML());
            window.SuperPanelManager.open();
            
            // Кэшируем элементы панели для совместимости с существующим кодом
            this.els.panel = window.SuperPanelManager.contentContainer;
            
            Object.assign(this.els, {
                managerView: document.getElementById('dbm-manager-view'),
                editorView: document.getElementById('dbm-editor-view'),
                effectsList: document.getElementById('dbm-effects-list'),
                elementsTabs: document.getElementById('dbm-elements-tabs'),
                addNewBtn: document.getElementById('dbm-add-new-effect-btn'),
                footer: window.SuperPanelManager.footerContainer,
                copyCodeBtn: document.getElementById('dbm-copy-code-btn'),
                closePanelBtn: document.getElementById('dbm-close-panel-btn'),
                createPresetBtn: document.getElementById('dbm-create-preset-btn'),
                panelOverlay: window.SuperPanelManager.overlay,
                resizeHandle: document.getElementById('dbm-panel-resize-handle'),
                presetIndicatorContainer: document.getElementById('dbm-preset-indicator-container'),
                backToManagerBtn: document.getElementById('dbm-back-to-manager-btn')
            });
            
            const savedWidth = localStorage.getItem(this.PANEL_WIDTH_KEY);
            if (savedWidth) {
                this.els.panel.style.width = savedWidth;
            }

            this.loadUserPresets();
            this.dbmInitEventListeners();
            this.dbmAddBackButtonListener();
            this.dbmShowManagerView();
        },
        
        dbmAddBackButtonListener() {
            // Добавляем обработчик события кнопки "Назад"
            document.addEventListener('dbmPanelBack', (e) => {
                console.log('[SUPER-HOVER] Получено событие возврата назад');
                // Проверяем, что мы в режиме редактора
                if (!this.els.managerView.classList.contains('hidden')) {
                    // Мы уже в менеджере - игнорируем
                    return;
                }
                
                // Переходим к менеджеру
                this.dbmShowManagerView();
            });
        },
        
        dbmInitEventListeners() {
            if (this.els.addNewBtn) {
            this.els.addNewBtn.addEventListener('click', () => this.startSelectionMode());
            }
        
            const copyCodeBtn = document.getElementById('dbm-copy-code-btn');
            if (copyCodeBtn) {
                copyCodeBtn.addEventListener('click', () => this.copyCSS());
            }
        
            if (this.els.closePanelBtn) {
                this.els.closePanelBtn.addEventListener('click', () => {
                    this.els.panel.classList.add('collapsed');
                });
            }
            
            if (this.els.panelToggle) {
                this.els.panelToggle.addEventListener('click', () => {
                     this.els.panel.classList.remove('collapsed');
                });
            }
            
            if (this.els.createPresetBtn) {
            this.els.createPresetBtn.addEventListener('click', () => this.showCreatePresetModal());
            }

            // Убираем старые обработчики mousemove и click, так как выбор теперь управляется через SuperSelectionManager
            // document.body.addEventListener('mousemove', e => this.handleMouseMove(e));
            // document.body.addEventListener('click', e => this.handleBodyClick(e), true);
            document.body.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    if (this.isSelectionMode) this.endSelectionMode(true);
                    this.removeModal();
                }
            }, true);

            const resizePanel = (e) => {
                const newWidth = window.innerWidth - e.clientX;
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
            if (this.els.resizeHandle) {
            this.els.resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                document.body.style.cursor = 'col-resize';
                window.addEventListener('mousemove', resizePanel);
                window.addEventListener('mouseup', stopResize);
            });
            }
        },
        
        dbmShowManagerView() {
            if (this.els.backToManagerBtn) {
                this.els.backToManagerBtn.classList.remove('visible');
                this.els.backToManagerBtn.onclick = null;
            }
            
            // Скрываем кнопку "Назад" в SuperPanelManager и очищаем заголовок
            if (window.SuperPanelManager) {
                window.SuperPanelManager.hideBackButton();
                window.SuperPanelManager.setHeader(''); // Очищаем заголовок на первом экране
            }
            
            this.activeParentSelector = null;
            this.els.managerView.classList.remove('hidden');
            this.els.editorView.classList.add('hidden');
            this.els.footer.style.display = 'flex'; 
            this.updateManagerList();
            this.clearAllOverlays();
            this.generateAndApplyCSS();
            this.updateDynamicButtons(); 
        },
        dbmShowEditorView(selector, options = {}) {
            if (this.els.backToManagerBtn) {
                this.els.backToManagerBtn.classList.add('visible');
                this.els.backToManagerBtn.onclick = () => this.dbmShowManagerView();
            }
            
            // Показываем кнопку "Назад" в SuperPanelManager
            if (window.SuperPanelManager) {
                window.SuperPanelManager.showBackButton();
            }
        
    this.els.panel.classList.remove('collapsed');
    const { isPresetEdit = false, presetName = '' } = options;
    this.activeParentSelector = selector;
    this.activeKey = 'parent'; // ✅ ИСПРАВЛЕНИЕ: Инициализируем activeKey
    this.hasUnsavedChanges = false;
            this.dbmUpdateHeader(selector, !isPresetEdit, presetName);
    this.els.managerView.classList.add('hidden');
    this.els.editorView.classList.remove('hidden');
            this.els.footer.style.display = 'flex';
            
            document.getElementById('dbm-open-presets-btn').onclick = () => this.showPresetsManagerModal({ context: 'apply' });
            document.getElementById('dbm-ai-helper-btn').onclick = () => this.showAIAssistantModal();
            if(this.els.createPresetBtn) {
                this.els.createPresetBtn.onclick = () => this.showCreatePresetModal();
            }

    if (isPresetEdit) {
        this.hasUnsavedChanges = true;
                // this.updatePresetButtonVisibility(); // <- Старый вызов
                document.getElementById('dbm-open-presets-btn').style.display = 'none';
    } else {
                // this.updatePresetButtonVisibility(); // <- Старый вызов
                document.getElementById('dbm-open-presets-btn').style.display = 'inline-flex';
        this.updatePresetIndicatorUI();
    }

    const parentNode = document.querySelector(selector);
    if (parentNode || isPresetEdit) {
        this.buildEffectTree(parentNode);
        
        // Определяем, какой tab должен быть активным
        const targetTab = this.determineActiveTab(selector);
        console.log('[SUPER-HOVER] Определенный активный tab:', targetTab);
        
        // Активируем соответствующий tab
        setTimeout(() => {
            const tabElement = this.els.elementsTabs.querySelector(`[data-key="${targetTab}"]`);
            if (tabElement) {
                this.activeKey = targetTab;
                tabElement.click();
                console.log('[SUPER-HOVER] Активирован tab:', targetTab);
            } else {
                // Fallback на parent tab
        this.els.elementsTabs.querySelector('[data-key="parent"]')?.click();
                console.log('[SUPER-HOVER] Fallback на parent tab');
    }
        }, 10);
    }

            this.updateDynamicButtons(); // ✅ ИСПРАВЛЕНИЕ: Вызываем новую единую функцию
        },
        dbmUpdateHeader(title, isEditor = false, subtitle = '') {
    const blockInfo = this.getBlockInfo(title);
    const cleanedTitle = this.cleanSelectorForDisplay(title);
            const titleText = isEditor ? (cleanedTitle || 'Редактор эффектов') : '';
        
            // ✅ Переменная backButton и ее обработчик полностью удалены отсюда
        
            const effectState = this.allEffects[this.activeParentSelector] || {};
            const isMobileDisabled = effectState.disableOnMobile === undefined ? true : effectState.disableOnMobile;
        
            const controlsHTML = isEditor ? `
                <div class="dbm-editor-controls">
                    <div class="dbm-editor-control-row">
                <span>Добавлять ID / класс блока</span>
                        <label class="dbm-switch as-label">
                            <input type="checkbox" id="dbm-prefix-toggle-checkbox" ${this.useBlockPrefix ? 'checked' : ''}>
                            <span class="dbm-slider"></span>
            </label>
                    </div>
                    <div class="dbm-editor-control-row">
                        <span>Выключить на мобильных</span>
                        <label class="dbm-switch as-label">
                            <input type="checkbox" id="dbm-mobile-disable-checkbox" ${isMobileDisabled ? 'checked' : ''}>
                            <span class="dbm-slider"></span>
                        </label>
                    </div>
        </div>` : '';

    const headerHTML = `
                <div class="dbm-header-main-row">
                    <div class="dbm-header-title-group">
                        <div class="dbm-header-title-text">
                            ${blockInfo ? `<div class="dbm-block-info" title="${blockInfo.title}">${blockInfo.cod} | ${blockInfo.title}</div>` : ''}
                            ${subtitle ? `<div class="dbm-block-info">Пресет: <strong>${subtitle}</strong></div>` : ''}
                            ${isEditor ? `<h2 id="dbm-editable-selector-title" title="${title}">${titleText}</h2>` : ''}
                    </div>
                </div>
                ${controlsHTML}
    `;
    
    // Используем SuperPanelManager для установки заголовка
    if (window.SuperPanelManager) {
        window.SuperPanelManager.setHeader(headerHTML);
    }
    
    if (isEditor) {
                const h2Element = document.querySelector('#dbm-editable-selector-title');
        this.makeSelectorEditable(h2Element);

                document.getElementById('dbm-prefix-toggle-checkbox').addEventListener('change', (e) => {
            this.useBlockPrefix = e.target.checked;
            // Синхронизируем с SuperSelectionManager
            if (window.SuperSelectionManager) {
                window.SuperSelectionManager.useBlockPrefix = e.target.checked;
            }
            const oldSelector = this.activeParentSelector;
            const element = document.querySelector(oldSelector);
            if (element) {
                const newSelector = this.getUniqueSelector(element);
                if (newSelector && newSelector !== oldSelector) {
                    this.allEffects[newSelector] = this.allEffects[oldSelector];
                    delete this.allEffects[oldSelector];
                            this.dbmShowEditorView(newSelector);
                }
            }
        });
                
                document.getElementById('dbm-mobile-disable-checkbox').addEventListener('change', (e) => {
                    if (this.allEffects[this.activeParentSelector]) {
                        this.allEffects[this.activeParentSelector].disableOnMobile = e.target.checked;
                        this.generateAndApplyCSS();
    }
                });
            }
},
        dbmUpdateState(key, prop, value) {
    const effects = this.allEffects[this.activeParentSelector];
    if (!effects) return;

            const targetState = this._getStateObjectRef(key);
            if (!targetState) {
                console.error("Не удалось найти состояние для ключа:", key);
                return;
            }
        
            if (targetState._appliedPreset) {
                delete targetState._appliedPreset;
                if (key === this.activeKey) {
        this.updatePresetIndicatorUI();
                }
    }

    if (!this.activeParentSelector.startsWith('__PRESET_EDIT_MODE__')) {
        this.hasUnsavedChanges = true;
                
                // ✅ ИСПРАВЛЕНИЕ: Вызываем новую единую функцию вместо старой
                this.updateDynamicButtons();
            }
        
        targetState[prop] = value;

    this.generateAndApplyCSS();
    this.updateEffectCountInCards();
},

// ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ updatePresetIndicatorUI НА ЭТУ
updatePresetIndicatorUI() {
   // ✨ ИЗМЕНЕНИЕ ЗДЕСЬ: Получаем состояние для АКТИВНОГО слоя, а не для всего эффекта.
   const currentState = this.getCurrentStateForKey(this.activeKey);
   const container = this.els.presetIndicatorContainer;

   // Проверяем наличие пресета в состоянии текущего слоя.
   if (currentState && currentState._appliedPreset) {
       container.innerHTML = `<div id="dbm-preset-indicator"><span>Применен пресет: <strong>${currentState._appliedPreset}</strong></span><button id="dbm-reset-preset-btn">Сбросить</button></div>`;
       container.querySelector('#dbm-reset-preset-btn').onclick = () => this.resetPreset();
    } else {
       container.innerHTML = '';
   }
},

resetPreset() {
   // Находим объект состояния для активного слоя.
   const targetState = this._getStateObjectRef(this.activeKey);
   if (targetState && targetState._appliedPreset) {
       // Удаляем "стикер" с конкретного слоя.
       delete targetState._appliedPreset;
       // Обновляем UI, который теперь тоже смотрит на конкретный слой.
       this.updatePresetIndicatorUI();
   }
},
        // Определяет, какой tab должен быть активным после выбора селектора
        determineActiveTab(selectedSelector) {
            // Если это основной селектор (равен activeParentSelector), возвращаем 'parent'
            if (selectedSelector === this.activeParentSelector) {
                return 'parent';
            }
            
            // Проверяем, является ли это дочерним элементом
            const effects = this.allEffects[this.activeParentSelector];
            if (effects && effects.parent && effects.parent.children) {
                // Ищем среди дочерних элементов
                for (const childKey in effects.parent.children) {
                    const fullChildSelector = this.buildFullChildSelector(childKey);
                    if (fullChildSelector === selectedSelector) {
                        return `parent|child:${childKey}`;
                    }
                }
                
                // Рекурсивно ищем во вложенных дочерних элементах
                const findInChildren = (children, parentPath) => {
                    for (const childKey in children) {
                        const currentPath = `${parentPath}|child:${childKey}`;
                        const fullSelector = this.buildFullChildSelector(childKey);
                        if (fullSelector === selectedSelector) {
                            return currentPath;
                        }
                        if (children[childKey].children) {
                            const found = findInChildren(children[childKey].children, currentPath);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                
                const found = findInChildren(effects.parent.children, 'parent');
                if (found) return found;
            }
            
            // По умолчанию возвращаем 'parent'
            return 'parent';
        },

        // Вспомогательный метод для построения полного селектора дочернего элемента
        buildFullChildSelector(childKey) {
            // Если это относительный селектор, добавляем родительский селектор
            if (childKey.startsWith('.') || childKey.startsWith('[') || childKey.startsWith(':')) {
                return `${this.activeParentSelector} ${childKey}`;
            }
            return childKey;
},

        // --- SELECTION LOGIC ---
        startSelectionMode(isReselect = false) {
            console.log('[SUPER-HOVER] startSelectionMode вызван, isReselect:', isReselect);
            
            if (!window.SuperSelectionManager) {
                console.error('[SUPER-HOVER] SuperSelectionManager не найден');
                return;
            }
            
            this.isSelectionMode = true;
            this.isReselectMode = isReselect;
            
            // Закрываем панель на время выбора
            window.SuperPanelManager.close();
            
            window.SuperSelectionManager.startSelection({
                onSelect: (selectedElement, selector) => {
                    console.log('[SUPER-HOVER] Элемент выбран:', selectedElement, 'Селектор:', selector);
                    this.isSelectionMode = false;
                    this.finalizeSelection(selector, isReselect);
                },
                onCancel: () => {
                    console.log('[SUPER-HOVER] Выбор отменен');
                    this.isSelectionMode = false;
                    window.SuperPanelManager.open();
                },
                blacklist: ['.dbm-editor-panel', '#dbm-inspector-tooltip', '.dbm-modal-overlay', '#dbm-panel-toggle-collapsed']
            });
        },
        endSelectionMode(cancelled = false) {
            console.log('[DEBUG] endSelectionMode вызван, cancelled:', cancelled);
            
            this.isSelectionMode = false;
            this.isReselectMode = false;
            this.pinnedElement = null;
            
            // Убеждаемся, что SuperSelectionManager тоже завершает работу
            if (window.SuperSelectionManager && window.SuperSelectionManager.isActive) {
                window.SuperSelectionManager.endSelection();
            }
            
            if (!cancelled || this.activeParentSelector) {
                window.SuperPanelManager.open();
            }
        },
        // Устаревшая функция handleMouseMove (теперь не используется, логика в SuperSelectionManager)
        handleMouseMove(e) {
            // Функция отключена - логика выбора перенесена в SuperSelectionManager
                return;
        },
        // Устаревшая функция handleBodyClick (теперь не используется, логика в SuperSelectionManager)
handleBodyClick(e) {
           console.log('[DEBUG] handleBodyClick вызван, isSelectionMode:', this.isSelectionMode);
           // Функция отключена - логика выбора перенесена в SuperSelectionManager
           return;
        },
        
        finalizeSelection(selector, isReselect = false) {
    console.log('[SUPER-HOVER] finalizeSelection вызван с селектором:', selector);
    
    // Используем переданный селектор от SuperSelectionManager
    const finalSelector = selector;
    if (!finalSelector) {
        console.error('[SUPER-HOVER] Получен пустой селектор');
        window.SuperPanelManager.open();
        return;
    }
    
    this.isReselectMode = isReselect;
    
    // Если это режим пересмотра (reselect), меняем activeParentSelector
    if (this.isReselectMode) {
        const oldSelector = this.activeParentSelector;
        if (oldSelector && finalSelector !== oldSelector) {
            this.allEffects[finalSelector] = this.allEffects[oldSelector];
            delete this.allEffects[oldSelector];
            this.activeParentSelector = finalSelector;
            }
        } else {
        // Обычный режим выбора - определяем, это новый родитель или дочерний элемент
        if (!this.activeParentSelector) {
            // Первый выбор - это всегда родитель
            this.activeParentSelector = finalSelector;
            if (!this.allEffects[finalSelector]) {
                this.allEffects[finalSelector] = this.getDefaultEffectState();
            }
        } else {
            // Уже есть активный родитель - проверяем, что выбрано
            if (finalSelector === this.activeParentSelector) {
                // Выбран тот же родитель - просто переходим к редактированию
                console.log('[SUPER-HOVER] Выбран существующий родительский элемент');
            } else {
                // Выбран другой элемент - либо новый родитель, либо дочерний
                // Определяем относительный селектор дочернего элемента
                const parentElement = document.querySelector(this.activeParentSelector);
                const selectedElement = document.querySelector(finalSelector);
                
                if (parentElement && selectedElement && parentElement.contains(selectedElement)) {
                    // Это дочерний элемент - добавляем его как child
                    const relativeSelector = this.getRelativeSelector(selectedElement, parentElement);
                    console.log('[SUPER-HOVER] Добавляем дочерний элемент:', relativeSelector);
                    
                    // Добавляем дочерний элемент в структуру эффектов
                    const parentEffects = this.allEffects[this.activeParentSelector];
                    if (!parentEffects.parent.children) {
                        parentEffects.parent.children = {};
                    }
                    if (!parentEffects.parent.children[relativeSelector]) {
                        parentEffects.parent.children[relativeSelector] = this.getDefaultState();
                        console.log('[SUPER-HOVER] Дочерний элемент добавлен в структуру:', relativeSelector);
                        console.log('[SUPER-HOVER] Текущая структура children:', parentEffects.parent.children);
                    }
                } else {
                    // Это новый родительский элемент
                    this.activeParentSelector = finalSelector;
                    if (!this.allEffects[finalSelector]) {
                        this.allEffects[finalSelector] = this.getDefaultEffectState();
                    }
                }
            }
        }
    }
            
    // Открываем панель через SuperPanelManager
    window.SuperPanelManager.open();
    
    this.dbmShowEditorView(this.activeParentSelector);
    this.endSelectionMode();
    this.updateDynamicButtons(); 
},


getRelativeSelector(childElement, parentElement) {
   if (!childElement || !parentElement) {
       console.log('[DEBUG] getRelativeSelector: пустые элементы');
       return '';
   }
   
   // Получаем полные селекторы, используя ВАШУ оригинальную логику
   const parentSelector = this.getUniqueSelector(parentElement);
   const childSelector = this.getUniqueSelector(childElement);
   
   console.log('[DEBUG] getRelativeSelector: parentSelector:', parentSelector);
   console.log('[DEBUG] getRelativeSelector: childSelector:', childSelector);
   
   // Самый надежный способ получить относительный путь:
   // Просто отрезаем родительскую часть от селектора дочернего элемента.
   if (childSelector.startsWith(parentSelector)) {
       const relative = childSelector.substring(parentSelector.length).trim();
       console.log('[DEBUG] getRelativeSelector: relative (startsWith):', relative);
       return relative;
   }
   
   // Если по какой-то причине селекторы не вложены (например, из-за сокращения),
   // возвращаем последнюю, самую конкретную часть селектора ребенка.
   const fallback = childSelector.split(' ').pop();
   console.log('[DEBUG] getRelativeSelector: fallback (split):', fallback);
   return fallback;
        },

        updateHighlight(element) {
            if (this.highlightedElement === element) return;
           if (this.highlightedElement) this.highlightedElement.classList.remove('dbm-highlight-element');
            this.highlightedElement = element;
           if (this.highlightedElement) this.highlightedElement.classList.add('dbm-highlight-element');
        },
    updateInspector(element) {
        if (!element) {
            this.els.inspector.style.display = 'none';
            return;
        }
        const hierarchyHTML = this.buildSelectorHierarchyHTML(element);
        if (!hierarchyHTML) {
            this.els.inspector.style.display = 'none';
            return;
        }
        this.els.inspector.innerHTML = `
           <div class="dbm-inspector-section">
                <h4>Выберите элемент для создания эффекта</h4>
                <div>${hierarchyHTML}</div>
            </div>`;
        this.els.inspector.style.display = 'block';
        const elRect = element.getBoundingClientRect();
        const inspectorRect = this.els.inspector.getBoundingClientRect();
        const panelRect = this.els.panel.getBoundingClientRect();
        let top = elRect.bottom + 10 + window.scrollY;
        let left = elRect.left + window.scrollX;
        if (top + inspectorRect.height > window.innerHeight + window.scrollY) {
            top = elRect.top - inspectorRect.height - 10 + window.scrollY;
        }
        if (left + inspectorRect.width > window.innerWidth) {
            left = window.innerWidth - inspectorRect.width - 10;
        }
        if (left < 0) left = 10;
        if (!this.els.panel.classList.contains('collapsed') && left + inspectorRect.width > panelRect.left) {
            left = panelRect.left - inspectorRect.width - 10;
        }
        this.els.inspector.style.top = `${Math.max(0, top)}px`;
        this.els.inspector.style.left = `${Math.max(0, left)}px`;
        this.addHighlightEventListeners(this.els.inspector);
    },
        // --- SELECTOR GENERATION (REWRITTEN) ---
// ЗАМЕНИТЕ getSelectorForParent и getRelativeSelectorForChild НА ЭТИ ДВЕ ФУНКЦИИ

getUniqueSelector(el) {
    if (!el || el.closest('#dbm-editor-panel')) return '';
        
            const tildaBlock = el.closest('.r.t-rec');
            if (!tildaBlock) return '';
        
            // 1. Определяем префикс блока
            let blockPrefix = '';
            if (this.useBlockPrefix) {
                const customClass = Array.from(tildaBlock.classList).find(c => c.startsWith('uc-'));
                blockPrefix = customClass ? `.${customClass}` : `#${tildaBlock.id}`;
            }
        
    // 2. Собираем полный путь от элемента до блока
            let path = [];
            let current = el;
            while (current && current !== tildaBlock && current.parentElement) {
                const part = this.getSelectorPart(current).value;
                if (part && !path.includes(part)) { // Проверяем на дубликаты
                    path.unshift(part);
                }
                current = current.parentElement;
            }
        
    // 3. Формируем финальный селектор по вашей логике
            let finalParts = [];
        
            // Добавляем префикс, если нужно
            if (blockPrefix) {
                finalParts.push(blockPrefix);
            }
        
    // Логика для структуры [префикс] .t-xxx .родитель .цель
            if (path.length >= 3) {
        // Находим первый общий класс блока, например, .t-cards
                const tBlock = path.find(p => p.startsWith('.t') && !p.includes('__'));
                if (tBlock) finalParts.push(tBlock);
                
        // Добавляем предпоследний элемент (родитель), если он не совпадает с t-блоком
                if (path.length > 1 && path[path.length - 2] !== tBlock) {
                    finalParts.push(path[path.length - 2]);
                }
                // Добавляем целевой элемент
                finalParts.push(path[path.length - 1]);

            } else {
                // Если путь короткий, просто добавляем все его части
                path.forEach(p => finalParts.push(p));
            }

            // Убираем дубликаты, которые могли появиться
            finalParts = [...new Set(finalParts)]; 
        
            const result = finalParts.join(' ').replace(/\s+/g, ' ');
            console.log('[DEBUG] getUniqueSelector результат:', result, 'для элемента:', el);
            return result;
        },

getRelativeSelector(childElement, parentElement) {
   if (!childElement || !parentElement) return '';
   const parentSelector = this.getUniqueSelector(parentElement);
   const childSelector = this.getUniqueSelector(childElement);
   
   // Надежно отрезаем родительскую часть от полного селектора ребенка
   if (childSelector.startsWith(parentSelector)) {
       const relative = childSelector.substring(parentSelector.length).trim();
       // Если что-то осталось, возвращаем это. Иначе возвращаем самую последнюю часть.
       return relative || childSelector.split(' ').pop();
   }
   
   // Запасной вариант, если селекторы не вложены напрямую
   return childSelector.split(' ').pop();
},
        getSelectorPart(el) {
            if (!el || !el.tagName) return { type: 'tag', value: '' };

            const classes = Array.from(el.classList).filter(c =>
                !window.SuperSelectionManager?.CLASS_BLOCKLIST?.includes(c) &&
                !c.startsWith('t-col_') &&
                !c.startsWith('t-prefix_') &&
                !c.startsWith('t-animate')
            );

            const parentBlock = el.closest('.r.t-rec');
            const recordType = parentBlock ? parentBlock.dataset.recordType : '';

            let bestClass = null;
            
            // Приоритет 1: Классы с двойным подчеркиванием (БЭМ модификаторы)
            bestClass = classes.find(c => c.includes('__'));
            
            // Приоритет 2: Классы, начинающиеся с 't-' (Tilda классы)
            if (!bestClass) {
                bestClass = classes.find(c => c.startsWith('t-'));
            }
            
            // Приоритет 3: Любой доступный класс
            if (!bestClass) {
                bestClass = classes[0];
            }
            
            // Приоритет 4: Поиск по data-record-type
            if (!bestClass && recordType) {
                bestClass = classes.find(c => {
                    const parts = recordType.replace(/[0-9]/g, '').split('');
                    return parts.some(part => c.includes(part));
                });
            }

            if (bestClass) {
                return { type: 'class', value: `.${bestClass}` };
            }

            return { type: 'tag', value: el.tagName.toLowerCase() };
        },
buildSelectorHierarchyHTML(element, isModal = false) {
            if (!element) return '';
            const tildaBlock = element.closest('.r.t-rec');
            if (!tildaBlock) return '';
            // 1. Собираем родителей
            const parents = [];
            let currentParent = element.parentElement;
            while (currentParent && currentParent !== tildaBlock) {
                const selector = this.getUniqueSelector(currentParent);
                if (selector) {
                    parents.unshift({ el: currentParent, selector }); // unshift добавляет в начало
                }
                currentParent = currentParent.parentElement;
            }
            // 2. Собираем дочерние элементы
            const children = [];
            const childElements = element.querySelectorAll('*');
            const childSelectors = new Set(); // Чтобы избежать дубликатов селекторов
            childElements.forEach(child => {
                const selector = this.getUniqueSelector(child);
                if (selector && !childSelectors.has(selector)) {
                    childSelectors.add(selector);
                    children.push({ el: child, selector });
                }
            });
            const createTagHTML = (item, type) => {
                const { selector } = item;
                const translation = this.getTranslationForSelector(selector);
               const badge = translation ? `<span class="dbm-translation-badge">${translation}</span>` : '';
                const typeBadgeClass = type === 'target' ? 'is-target' : '';
                let typeText = 'Элемент';
                if (type === 'parent') typeText = 'Родитель';
                if (type === 'child') typeText = 'Дочерний';
               return `<div class="dbm-selector-tag ${typeBadgeClass}" data-selector="${selector.replace(/"/g, '&quot;')}">
                           <span class="dbm-element-type-badge">${typeText}</span> ${this.cleanSelectorForDisplay(selector)} ${badge}
                        </div>`;
            };
            const parentsHTML = parents.map(p => createTagHTML(p, 'parent')).join('');
            const targetHTML = createTagHTML({ el: element, selector: this.getUniqueSelector(element) }, 'target');
            const childrenHTML = children.map(c => createTagHTML(c, 'child')).join('');
            return `
               ${parents.length > 0 ? `<div class="dbm-selector-list-group">${parentsHTML}</div>` : ''}
               <div class="dbm-selector-list-group">${targetHTML}</div>
               ${children.length > 0 ? `<div class="dbm-selector-list-group">${childrenHTML}</div>` : ''}
           `;
       },
        // --- CSS GENERATION ---
 // generateAndApplyCSS() {
//             let finalCss = '';
            
//             // Получаем все реальные селекторы, игнорируя служебные
//     const allSelectors = Object.keys(this.allEffects).filter(key => !key.startsWith('__'));

//             // ✅ ИСПРАВЛЕНИЕ (Шаг 1): Если существует временный AI-эффект, добавляем его ключ в список для обработки
//     if (this.allEffects['__AI_PREVIEW__']) {
//                 allSelectors.push('__AI_PREVIEW__');
//             }
        
// const getStyles = (state) => {
//                 let styles = '', transforms = [], filters = [], backdropFilters = [];
//                 if(!state) return '';
//     if (state.transformEnabled) {
//         if (state.translateX || state.translateY) transforms.push(`translate(${state.translateX || 0}px, ${state.translateY || 0}px)`);
//                     if (state.scaleX != 1 && state.scaleX !== undefined) transforms.push(`scaleX(${state.scaleX})`);
//                     if (state.scaleY != 1 && state.scaleY !== undefined) transforms.push(`scaleY(${state.scaleY})`);
//         if (state.skewX || state.skewY) transforms.push(`skew(${state.skewX || 0}deg, ${state.skewY || 0}deg)`);
//         if (state.rotateX) transforms.push(`rotateX(${state.rotateX}deg)`);
//         if (state.rotateY) transforms.push(`rotateY(${state.rotateY}deg)`);
//         if (state.rotateZ) transforms.push(`rotateZ(${state.rotateZ}deg)`);
//     }
//     if (state.filterEnabled) {
//         if (state.blur > 0) filters.push(`blur(${state.blur}px)`);
//                     if (state.brightness != 1 && state.brightness !== undefined) filters.push(`brightness(${state.brightness})`);
//                     if (state.contrast != 1 && state.contrast !== undefined) filters.push(`contrast(${state.contrast})`);
//                     if (state.saturate != 1 && state.saturate !== undefined) filters.push(`saturate(${state.saturate})`);
//         if (state.grayscale > 0) filters.push(`grayscale(${state.grayscale})`);
//         if (state.backdropBlur > 0) backdropFilters.push(`blur(${state.backdropBlur}px)`);
//     }
//     if (transforms.length) styles += `transform: ${transforms.join(' ')};`;
//     if (filters.length) styles += `filter: ${filters.join(' ')};`;
//     if (backdropFilters.length) styles += `backdrop-filter: ${backdropFilters.join(' ')}; -webkit-backdrop-filter: ${backdropFilters.join(' ')};`;
//     if (state.styleEnabled) {
//                     if (state.opacity != 1 && state.opacity !== undefined) styles += `opacity: ${state.opacity};`;
//         if (state.backgroundType === 'solid' && state.backgroundColor) {
//             styles += `background-color: ${state.backgroundColor} !important;`;
//         } else if (state.backgroundType === 'gradient') {
//             const gradType = state.gradientType === 'linear' ? 'linear-gradient' : 'radial-gradient';
//             const angle = state.gradientType === 'linear' ? `${state.gradientAngle}deg, ` : '';
//             styles += `background-image: ${gradType}(${angle}${state.gradientColor1}, ${state.gradientColor2}) !important;`;
//         }
//     }
//     if (state.boxShadowEnabled) {
//         const inset = state.boxShadowInset ? 'inset ' : '';
//         styles += `box-shadow: ${inset}${state.boxShadowX || 0}px ${state.boxShadowY || 0}px ${state.boxShadowBlur || 0}px ${state.boxShadowSpread || 0}px ${state.boxShadowColor || 'rgba(0,0,0,0.1)'};`;
//     }
//     if (state.textEnabled) {
//         if (state.color) styles += `color: ${state.color} !important;`;
//         if (state.fontSize) styles += `font-size: ${state.fontSize}px;`;
//         if (state.fontWeight) styles += `font-weight: ${state.fontWeight};`;
//         if (state.letterSpacing) styles += `letter-spacing: ${state.letterSpacing}px;`;
//         if (state.lineHeight) styles += `line-height: ${state.lineHeight};`;
//         if (state.textDecorationLine && state.textDecorationLine !== 'none') {
//             styles += `text-decoration: ${state.textDecorationLine} ${state.textDecorationStyle} ${state.textDecorationColor || 'currentColor'};`;
//         }
//     }
//     if (state.borderEnabled) {
//         if (state.borderTopLeftRadius) styles += `border-top-left-radius: ${state.borderTopLeftRadius}px;`;
//         if (state.borderTopRightRadius) styles += `border-top-right-radius: ${state.borderTopRightRadius}px;`;
//         if (state.borderBottomRightRadius) styles += `border-bottom-right-radius: ${state.borderBottomRightRadius}px;`;
//         if (state.borderBottomLeftRadius) styles += `border-bottom-left-radius: ${state.borderBottomLeftRadius}px;`;
//         if (state.borderWidth && state.borderStyle && state.borderColor) {
//             styles += `border: ${state.borderWidth}px ${state.borderStyle} ${state.borderColor};`;
//         }
//     }
//     if (state.marginPaddingEnabled) {
//         if(state.marginTop) styles += `margin-top: ${state.marginTop}px !important;`;
//         if(state.marginRight) styles += `margin-right: ${state.marginRight}px !important;`;
//         if(state.marginBottom) styles += `margin-bottom: ${state.marginBottom}px !important;`;
//         if(state.marginLeft) styles += `margin-left: ${state.marginLeft}px !important;`;
//         if(state.paddingTop) styles += `padding-top: ${state.paddingTop}px !important;`;
//         if(state.paddingRight) styles += `padding-right: ${state.paddingRight}px !important;`;
//         if(state.paddingBottom) styles += `padding-bottom: ${state.paddingBottom}px !important;`;
//         if(state.paddingLeft) styles += `padding-left: ${state.paddingLeft}px !important;`;
//     }
//     return styles;
// };
    
//     const getTransition = (state) => {
//         if (!state || !state.animationEnabled) return `transition: all 200ms ease;`;
//         let easing = state.easing || 'ease';
//         if (easing === 'custom' && state.bezier1 !== undefined) {
//             easing = `cubic-bezier(${state.bezier1 || 0}, ${state.bezier2 || 0}, ${state.bezier3 || 1}, ${state.bezier4 || 1})`;
//         }
//         return `transition: all ${state.duration || 200}ms ${easing};`;
//     };

//             allSelectors.forEach(key => {
//                 let baseSelector = key;
//                 const effect = this.allEffects[key];
        
//                 // ✅ ИСПРАВЛЕНИЕ (Шаг 2): Если это ключ предпросмотра, используем целевой селектор, сохраненный ранее
//                 if (key === '__AI_PREVIEW__') {
//                     baseSelector = effect._targetSelector;
//                     if (!baseSelector) return; // Пропускаем, если селектор не найден
//                 }
                
//                 if (!effect || !effect.parent) return;
        
//                 let effectCss = ''; 
                
//                 const processState = (state, path = '') => {
//                     const fullSelector = (baseSelector + path).trim();
                    
//                     let initialStyles = getTransition(state);
//                     if (state.overflowHidden) {
//                         initialStyles += ` overflow: hidden !important;`;
//                     }
//                     if (state.perspectiveEnabled) {
//                         initialStyles += ` perspective: ${state.perspectiveValue || 1000}px;`;
//                     }
        
//                     effectCss += `${fullSelector} { ${initialStyles} }\n`;
                    
//                     const hoverStyles = getStyles(state);
//                     if (hoverStyles) {
//                         effectCss += `${baseSelector}:hover${path} { ${hoverStyles} }\n`;
//                     }
                    
//             if (state.children) {
//                         Object.keys(state.children).forEach(childKey => {
//                             const newPath = `${path} ${childKey.trim()}`;
//                             processState(state.children[childKey], newPath);
//                         });
//                     }
//                 };
                
//                 processState(effect.parent);

//         if (effect._hasEffects) {
//             effect._hasEffects.forEach(he => {
//                 const hasStyles = getStyles(he.styles);
//                 if (hasStyles) {
//                     const relativeTrigger = this.getSubtitleFromKey(he.triggerKey);
//                     const relativeTarget = he.target;
//                     const fullTargetSelector = `${baseSelector} ${relativeTarget}`;
                            
//                             let initialHasStyles = getTransition(he.styles);
//                             if (he.styles.overflowHidden) {
//                                  initialHasStyles += ` overflow: hidden !important;`;
//                             }
//                             if (he.styles.perspectiveEnabled) {
//                                 initialHasStyles += ` perspective: ${he.styles.perspectiveValue || 1000}px;`;
//                             }
                            
//                             effectCss += `${fullTargetSelector} { ${initialHasStyles} }\n`;
//                             effectCss += `${baseSelector}:has(${relativeTrigger}:hover) ${relativeTarget} { ${hasStyles} }\n`;
//                 }
//             });
//         }

//                 if (effect.disableOnMobile) {
//                     finalCss += `@media (hover:hover) {\n${effectCss}}\n`;
//                 } else {
//                     finalCss += effectCss;
//                 }
//             });
        
//             this.els.dynamicStyles.innerHTML = finalCss;
//         },

generateAndApplyCSS() {
    let finalCss = '';
    
    // Получаем все реальные селекторы, игнорируя служебные
    const allSelectors = Object.keys(this.allEffects).filter(key => !key.startsWith('__'));

    // ✅ ИСПРАВЛЕНИЕ (Шаг 1): Если существует временный AI-эффект, добавляем его ключ в список для обработки
    if (this.allEffects['__AI_PREVIEW__']) {
        allSelectors.push('__AI_PREVIEW__');
    }
    
    // Вспомогательные функции getStyles и getTransition остаются без изменений,
    // поэтому здесь для краткости я их опускаю.
    // Убедитесь, что они присутствуют в вашей версии.
const getStyles = (state) => {
        let styles = '', transforms = [], filters = [], backdropFilters = [];
        if(!state) return '';
    if (state.transformEnabled) {
        if (state.translateX || state.translateY) transforms.push(`translate(${state.translateX || 0}px, ${state.translateY || 0}px)`);
            if (state.scaleX != 1 && state.scaleX !== undefined) transforms.push(`scaleX(${state.scaleX})`);
            if (state.scaleY != 1 && state.scaleY !== undefined) transforms.push(`scaleY(${state.scaleY})`);
        if (state.skewX || state.skewY) transforms.push(`skew(${state.skewX || 0}deg, ${state.skewY || 0}deg)`);
        if (state.rotateX) transforms.push(`rotateX(${state.rotateX}deg)`);
        if (state.rotateY) transforms.push(`rotateY(${state.rotateY}deg)`);
        if (state.rotateZ) transforms.push(`rotateZ(${state.rotateZ}deg)`);
    }
    if (state.filterEnabled) {
        if (state.blur > 0) filters.push(`blur(${state.blur}px)`);
            if (state.brightness != 1 && state.brightness !== undefined) filters.push(`brightness(${state.brightness})`);
            if (state.contrast != 1 && state.contrast !== undefined) filters.push(`contrast(${state.contrast})`);
            if (state.saturate != 1 && state.saturate !== undefined) filters.push(`saturate(${state.saturate})`);
        if (state.grayscale > 0) filters.push(`grayscale(${state.grayscale})`);
        if (state.backdropBlur > 0) backdropFilters.push(`blur(${state.backdropBlur}px)`);
    }
    if (transforms.length) styles += `transform: ${transforms.join(' ')};`;
    if (filters.length) styles += `filter: ${filters.join(' ')};`;
    if (backdropFilters.length) styles += `backdrop-filter: ${backdropFilters.join(' ')}; -webkit-backdrop-filter: ${backdropFilters.join(' ')};`;
    if (state.styleEnabled) {
            if (state.opacity != 1 && state.opacity !== undefined) styles += `opacity: ${state.opacity};`;
        if (state.backgroundType === 'solid' && state.backgroundColor) {
            styles += `background-color: ${state.backgroundColor} !important;`;
        } else if (state.backgroundType === 'gradient') {
            const gradType = state.gradientType === 'linear' ? 'linear-gradient' : 'radial-gradient';
            const angle = state.gradientType === 'linear' ? `${state.gradientAngle}deg, ` : '';
            styles += `background-image: ${gradType}(${angle}${state.gradientColor1}, ${state.gradientColor2}) !important;`;
        }
    }
    if (state.boxShadowEnabled) {
        const inset = state.boxShadowInset ? 'inset ' : '';
        styles += `box-shadow: ${inset}${state.boxShadowX || 0}px ${state.boxShadowY || 0}px ${state.boxShadowBlur || 0}px ${state.boxShadowSpread || 0}px ${state.boxShadowColor || 'rgba(0,0,0,0.1)'};`;
    }
    if (state.textEnabled) {
        if (state.color) styles += `color: ${state.color} !important;`;
        if (state.fontSize) styles += `font-size: ${state.fontSize}px;`;
        if (state.fontWeight) styles += `font-weight: ${state.fontWeight};`;
        if (state.letterSpacing) styles += `letter-spacing: ${state.letterSpacing}px;`;
        if (state.lineHeight) styles += `line-height: ${state.lineHeight};`;
        if (state.textDecorationLine && state.textDecorationLine !== 'none') {
            styles += `text-decoration: ${state.textDecorationLine} ${state.textDecorationStyle} ${state.textDecorationColor || 'currentColor'};`;
        }
    }
    if (state.borderEnabled) {
        if (state.borderTopLeftRadius) styles += `border-top-left-radius: ${state.borderTopLeftRadius}px;`;
        if (state.borderTopRightRadius) styles += `border-top-right-radius: ${state.borderTopRightRadius}px;`;
        if (state.borderBottomRightRadius) styles += `border-bottom-right-radius: ${state.borderBottomRightRadius}px;`;
        if (state.borderBottomLeftRadius) styles += `border-bottom-left-radius: ${state.borderBottomLeftRadius}px;`;
        if (state.borderWidth && state.borderStyle && state.borderColor) {
            styles += `border: ${state.borderWidth}px ${state.borderStyle} ${state.borderColor};`;
        }
    }
    if (state.marginPaddingEnabled) {
        if(state.marginTop) styles += `margin-top: ${state.marginTop}px !important;`;
        if(state.marginRight) styles += `margin-right: ${state.marginRight}px !important;`;
        if(state.marginBottom) styles += `margin-bottom: ${state.marginBottom}px !important;`;
        if(state.marginLeft) styles += `margin-left: ${state.marginLeft}px !important;`;
        if(state.paddingTop) styles += `padding-top: ${state.paddingTop}px !important;`;
        if(state.paddingRight) styles += `padding-right: ${state.paddingRight}px !important;`;
        if(state.paddingBottom) styles += `padding-bottom: ${state.paddingBottom}px !important;`;
        if(state.paddingLeft) styles += `padding-left: ${state.paddingLeft}px !important;`;
    }
    return styles;
};
    const getTransition = (state) => {
        if (!state || !state.animationEnabled) return `transition: all 200ms ease;`;
        let easing = state.easing || 'ease';
        if (easing === 'custom' && state.bezier1 !== undefined) {
            easing = `cubic-bezier(${state.bezier1 || 0}, ${state.bezier2 || 0}, ${state.bezier3 || 1}, ${state.bezier4 || 1})`;
        }
        return `transition: all ${state.duration || 200}ms ${easing};`;
    };

    allSelectors.forEach(key => {
        let baseSelector = key;
        const effect = this.allEffects[key];
    
        // ✅ ИСПРАВЛЕНИЕ (Шаг 2): Если это ключ предпросмотра, используем целевой селектор, сохраненный ранее
        if (key === '__AI_PREVIEW__') {
            baseSelector = effect._targetSelector;
            if (!baseSelector) return; // Пропускаем, если селектор не найден
        }
        
        if (!effect || !effect.parent) return;

        let effectCss = ''; 
        
        const processState = (state, path = '') => {
            const fullSelector = (baseSelector + path).trim();
            
            let initialStyles = getTransition(state);
            if (state.overflowHidden) {
                initialStyles += ` overflow: hidden !important;`;
            }
            if (state.perspectiveEnabled) {
                initialStyles += ` perspective: ${state.perspectiveValue || 1000}px;`;
            }

            effectCss += `${fullSelector} { ${initialStyles} }\n`;
            
            const hoverStyles = getStyles(state);
            if (hoverStyles) {
                effectCss += `${baseSelector}:hover${path} { ${hoverStyles} }\n`;
            }
            
            if (state.children) {
                Object.keys(state.children).forEach(childKey => {
                    const newPath = `${path} ${childKey.trim()}`;
                    processState(state.children[childKey], newPath);
                });
            }
        };
        
        processState(effect.parent);

        if (effect._hasEffects) {
            effect._hasEffects.forEach(he => {
                const hasStyles = getStyles(he.styles);
                if (hasStyles) {
                    const relativeTrigger = this.getSubtitleFromKey(he.triggerKey);
                    const relativeTarget = he.target;
                    const fullTargetSelector = `${baseSelector} ${relativeTarget}`;
                            
                    let initialHasStyles = getTransition(he.styles);
                    if (he.styles.overflowHidden) {
                         initialHasStyles += ` overflow: hidden !important;`;
                    }
                    if (he.styles.perspectiveEnabled) {
                       initialHasStyles += ` perspective: ${he.styles.perspectiveValue || 1000}px;`;
                    }
                    
                    effectCss += `${fullTargetSelector} { ${initialHasStyles} }\n`;
                    effectCss += `${baseSelector}:has(${relativeTrigger}:hover) ${relativeTarget} { ${hasStyles} }\n`;
                }
            });
        }

        if (effect.disableOnMobile) {
            finalCss += `@media (hover:hover) {\n${effectCss}}\n`;
        } else {
            finalCss += effectCss;
        }
    });
    
    this.els.dynamicStyles.innerHTML = finalCss;
},

buildEffectTree(parentNode) {
      console.log('[DEBUG] buildEffectTree вызван с parentNode:', parentNode);
      console.log('[DEBUG] elementsTabs:', !!this.els.elementsTabs);
      console.log('[DEBUG] activeParentSelector:', this.activeParentSelector);
      if (!this.els.elementsTabs) {
          console.log('[DEBUG] elementsTabs не найден!');
          return;
      }
      
      const currentActiveKey = this.activeKey;
    this.els.elementsTabs.innerHTML = '';
    const effects = this.allEffects[this.activeParentSelector];
    console.log('[DEBUG] effects для activeParentSelector:', effects);
    if (!effects) {
        console.log('[DEBUG] effects не найдены для селектора:', this.activeParentSelector);
        return;
    }
    console.log('[DEBUG] effects.parent:', effects.parent);
    console.log('[DEBUG] effects.parent.children:', effects.parent.children);
    // Собираем все ключи, которые используются как триггеры
    const triggerKeys = new Set((effects._hasEffects || []).map(he => he.triggerKey));
    const buildTreeRecursive = (key, state, container, level) => {
        console.log('[DEBUG] buildTreeRecursive вызван с key:', key, 'state:', state, 'level:', level);
        if (!state.children) {
            console.log('[DEBUG] Нет children в state для key:', key);
            return;
        }
        console.log('[DEBUG] Children для key', key, ':', Object.keys(state.children));
        for (const childKey in state.children) {
            const childState = state.children[childKey];
            const fullPathKey = `${key}|child:${childKey}`;
            console.log('[DEBUG] Создаем дочерний элемент:', fullPathKey, 'childKey:', childKey);
            // Проверяем, является ли этот элемент триггером
            const isTrigger = triggerKeys.has(fullPathKey);
            const { wrapper } = this.createItem(fullPathKey, childKey, level, true, '', isTrigger);
            container.appendChild(wrapper);
            buildTreeRecursive(fullPathKey, childState, container, level + 1);
        }
    };
    // 1. Создаем родительский элемент
    const { wrapper: parentWrapper } = this.createItem('parent', this.activeParentSelector, 0, false);
    this.els.elementsTabs.appendChild(parentWrapper);
    // 2. Рекурсивно строим всех потомков
    buildTreeRecursive('parent', effects.parent, this.els.elementsTabs, 1);
    // 3. Добавляем сами :has эффекты в список
    if (effects._hasEffects) {
        effects._hasEffects.forEach((has, i) => {
            const triggerElSubtitle = this.getSubtitleFromKey(has.triggerKey);
            const title = `${this.cleanSelectorForDisplay(triggerElSubtitle)} ➔ ${this.cleanSelectorForDisplay(has.target)}`;
            const { wrapper } = this.createItem(`_has:${i}`, title, 0, true, 'Условие :has');
            this.els.elementsTabs.appendChild(wrapper);
        });
    }

   // Удаляем дублирующиеся табы
   const seenKeys = new Set();
   const tabs = Array.from(this.els.elementsTabs.querySelectorAll('.dbm-element-tab'));
   tabs.forEach(tab => {
       const key = tab.dataset.key;
       if (seenKeys.has(key)) {
           tab.remove();
       } else {
           seenKeys.add(key);
       }
   });
   
   // Восстанавливаем активный таб
   setTimeout(() => {
       const activeTab = this.els.elementsTabs.querySelector(`[data-key="${currentActiveKey}"]`);
       if (activeTab) {
           this.activeKey = currentActiveKey;
       } else {
           // ✅ ИСПРАВЛЕНИЕ: Если активный таб не найден, устанавливаем 'parent' по умолчанию
           const parentTab = this.els.elementsTabs.querySelector(`[data-key="parent"]`);
           if (parentTab) {
               this.activeKey = 'parent';
               parentTab.click();
           }
       }
   }, 5);
},
// ПОЛНОСТЬЮ ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ createItem НА ЭТУ
createItem(key, subtitle, level = 0, isDeletable = false, overrideTitle = '', isTrigger = false) {
    const item = document.createElement('button');
    item.className = 'dbm-element-tab';
    item.dataset.key = key;
    let titleHTML = '';
    let subtitleHTML = '';
    const indicatorHTML = isTrigger ? '<span class="dbm-element-tab-indicator">🔗</span>' : '';
    const selectors = subtitle.split(',').map(s => s.trim());
    if (selectors.length > 1) {
        let titleText = overrideTitle || 'Сгруппированные элементы';
        titleHTML = `<span class="dbm-element-tab-title">${indicatorHTML}${titleText}</span>`;
        subtitleHTML = selectors.map(selector => {
            const translation = this.getTranslationForSelector(selector);
           const badge = translation ? `<span class="dbm-translation-badge-small">${translation}</span>` : '';
            return `<div class="dbm-element-tab-subtitle is-grouped"><span class="dbm-element-tab-title">${this.cleanSelectorForDisplay(selector)} ${badge}</span></div>`;
        }).join('');
    } else {
        const singleSelector = selectors[0];
        let titleText = overrideTitle || (level === 0 ? 'Основной элемент' : 'Дочерний элемент');
        const translation = this.getTranslationForSelector(singleSelector);
       const badge = translation ? `<span class="dbm-translation-badge-small">${translation}</span>` : '';
        titleHTML = `<span class="dbm-element-tab-title">${indicatorHTML}${titleText} ${badge}</span>`;
        subtitleHTML = `<div class="dbm-element-tab-subtitle">${this.cleanSelectorForDisplay(singleSelector)}</div>`;
    }
    // --- ЛОГИКА ОТОБРАЖЕНИЯ КНОПОК (БЕЗ КНОПКИ ДЛЯ PARENT) ---
    let actionsHTML = '<div></div>';
   const reselectIcon = `<svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.7077 15C17.7077 14.6548 17.9875 14.375 18.3327 14.375C18.6778 14.375 18.9577 14.6548 18.9577 15C18.9576 15.8286 18.6283 16.6242 18.0422 17.2102C17.4927 17.7595 16.7596 18.0827 15.9873 18.1209L15.8327 18.125H15.6748L15.8579 18.3081C16.102 18.5521 16.102 18.9478 15.8579 19.1918C15.6138 19.4359 15.2182 19.4359 14.9741 19.1918L13.7241 17.9418C13.48 17.6978 13.48 17.3021 13.7241 17.0581L14.9741 15.8081C15.2182 15.564 15.6138 15.564 15.8579 15.8081C16.102 16.0521 16.102 16.4478 15.8579 16.6918L15.6748 16.875H15.8327C16.3299 16.875 16.8067 16.6772 17.1584 16.3256C17.5099 15.9741 17.7076 15.4972 17.7077 15ZM16.8743 5.20829C16.8743 4.51796 16.3147 3.95829 15.6243 3.95829H9.37435C9.04284 3.95829 8.72497 4.09009 8.49056 4.3245C8.25615 4.55891 8.12435 4.87678 8.12435 5.20829V8.95829C8.12444 9.64853 8.68408 10.2083 9.37435 10.2083H15.6243C16.3146 10.2083 16.8743 9.64853 16.8743 8.95829V5.20829ZM1.04102 4.99995C1.04107 4.17128 1.37042 3.37571 1.95654 2.78967C2.54257 2.20386 3.3374 1.87491 4.16602 1.87495H4.32389L4.14079 1.69185C3.89671 1.44777 3.89671 1.05214 4.14079 0.808058C4.38487 0.563981 4.7805 0.563981 5.02458 0.808058L6.27458 2.05806C6.51865 2.30214 6.51865 2.69777 6.27458 2.94185L5.02458 4.19185C4.7805 4.43593 4.38487 4.43593 4.14079 4.19185C3.89671 3.94777 3.89671 3.55214 4.14079 3.30806L4.32389 3.12495H4.16602C3.66878 3.12492 3.19196 3.32269 2.84033 3.67427C2.48883 4.02577 2.29106 4.50268 2.29102 4.99995C2.29099 5.34512 2.01118 5.62495 1.66602 5.62495C1.32085 5.62493 1.04102 5.34511 1.04102 4.99995ZM3.12435 14.7924C3.12444 15.1238 3.25618 15.442 3.49056 15.6762C3.72492 15.9104 4.04306 16.0417 4.37435 16.0416H10.6243C11.3147 16.0416 11.8743 15.4819 11.8743 14.7916V11.4583H9.37435C8.28623 11.4583 7.36267 10.7621 7.01921 9.79162H4.37354C4.04217 9.79171 3.72399 9.92345 3.48975 10.1578C3.2556 10.3922 3.12426 10.7103 3.12435 11.0416V14.7924ZM18.1243 8.95829C18.1243 10.3389 17.005 11.4583 15.6243 11.4583H13.1243V14.7916L13.1211 14.9202C13.0563 16.1986 12.0313 17.2236 10.7529 17.2884L10.6243 17.2916H4.37435C3.7115 17.2918 3.07561 17.0286 2.60677 16.56C2.13804 16.0915 1.87463 15.456 1.87435 14.7932V11.0416C1.8742 10.3788 2.13738 9.74288 2.60596 9.27404C3.07447 8.80532 3.71 8.5419 4.37272 8.54162H6.87435V5.20829C6.87435 4.54526 7.13794 3.90954 7.60677 3.44071C8.0756 2.97188 8.71132 2.70829 9.37435 2.70829H15.6243C17.005 2.70829 18.1243 3.82761 18.1243 5.20829V8.95829Z" fill="#96A2AB"/>
</svg>
`;
    if (isDeletable) { // Кнопки теперь показываются только для дочерних элементов
        actionsHTML = `
        <div class="dbm-effect-item-actions">
            <button class="dbm-btn-icon dbm-btn-secondary reselect-target-btn dbm-btn-sm" title="Перевыбрать элемент">${reselectIcon}</button>
           <button class="dbm-delete-target-btn dbm-btn-sm" title="Удалить цель">
           <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6553 3.43457C12.6551 3.26203 12.5153 3.12221 12.3428 3.12207H7.65332C7.57034 3.12207 7.49032 3.15519 7.43164 3.21387C7.37316 3.27244 7.33995 3.3518 7.33984 3.43457V4.68555H12.6553V3.43457ZM5.79785 15.7227C5.84798 16.3743 6.39135 16.8779 7.04492 16.8779H12.9492C13.6028 16.8779 14.1462 16.3743 14.1963 15.7227L14.9492 5.93555H5.04492L5.79785 15.7227ZM11.6641 13.543C12.0091 13.543 12.2888 13.823 12.2891 14.168C12.2891 14.5131 12.0092 14.793 11.6641 14.793H8.33008C7.9849 14.793 7.70508 14.5131 7.70508 14.168C7.7053 13.823 7.98504 13.543 8.33008 13.543H11.6641ZM13.9053 4.68555H16.667C17.0122 4.68555 17.292 4.96537 17.292 5.31055C17.292 5.65572 17.0122 5.93555 16.667 5.93555H16.2041L15.4434 15.8193C15.343 17.1221 14.2559 18.1279 12.9492 18.1279H7.04492C5.7383 18.1279 4.65217 17.122 4.55176 15.8193L3.79102 5.93555H3.32812C2.98295 5.93555 2.70312 5.65572 2.70312 5.31055C2.70313 4.96537 2.98295 4.68555 3.32812 4.68555H6.08984V3.43457C6.08995 3.02028 6.25495 2.62307 6.54785 2.33008C6.84095 2.03698 7.23882 1.87207 7.65332 1.87207H12.3428C13.2057 1.87221 13.9051 2.57168 13.9053 3.43457V4.68555Z" fill="#96A2AB"/>
</svg>
</button>
        </div>`;
    }
    item.innerHTML = `
        <div class="dbm-element-tab-info">${titleHTML}${subtitleHTML}</div>
        ${actionsHTML}
    `;
    item.onclick = (e) => {
        e.stopPropagation();
        if (e.target.closest('.dbm-delete-target-btn')) {
            this.deleteTarget(key);
        } else if (e.target.closest('.reselect-target-btn')) {
            this.reselectChildTarget(key);
        } else {
            this.activateEditorFor(item);
        }
    };
    const wrapper = document.createElement('div');
    if (level > 0) {
        wrapper.className = 'dbm-element-tab-wrapper';
        wrapper.style.paddingLeft = `${level * 20}px`;
    }
    wrapper.appendChild(item);
    return { item, wrapper };
},
// Добавь этого маленького помощника куда-нибудь в конец объекта dbmHoverArchitect
getSubtitleFromKey(key) {
    if (!key) return '';
    const parts = key.split('|');
    const lastPart = parts[parts.length - 1];
    return lastPart.startsWith('child:') ? lastPart.slice(6) : lastPart;
},
// ЗАМЕНИ СТАРУЮ ФУНКЦИЮ getEffectDataForKey
getEffectDataForKey(key, parentData = null) {
    const effects = this.allEffects[this.activeParentSelector];
    if (!effects) return null;
    let state, subtitle, domNode;
    const keyParts = key.split('|');
    const lastKeyPart = keyParts[keyParts.length - 1];
    if (lastKeyPart === 'parent') {
        state = effects.parent;
        subtitle = this.activeParentSelector;
        domNode = document.querySelector(this.activeParentSelector);
        return {
            title: 'Основной элемент',
            subtitle: subtitle,
            isDeletable: false,
            state: state,
            domNode: domNode
        };
    }
    if (lastKeyPart.startsWith('child:')) {
        const childSel = lastKeyPart.slice(6);
        let parentState = effects.parent;
        let parentNode = document.querySelector(this.activeParentSelector);
        // Проходим по пути, чтобы найти родительское состояние и DOM-узел
        if (parentData) {
             parentState = parentData.state;
             parentNode = parentData.domNode;
        }
        state = parentState.children ? parentState.children[childSel] : null;
        domNode = parentNode ? parentNode.querySelector(childSel.split(',')[0].trim()) : null; // Для множественных селекторов берем первый
        return {
            title: 'Дочерний элемент',
            subtitle: childSel,
            isDeletable: true,
            state: state,
            domNode: domNode,
        };
    }
    return null;
},
// ✅ ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ createItem НА ЭТУ
createItem(key, subtitle, level = 0, isDeletable = false, overrideTitle = '', isTrigger = false) {
    const item = document.createElement('button');
    item.className = 'dbm-element-tab';
    item.dataset.key = key;

    let titleHTML = '';
    let subtitleHTML = '';
    const indicatorHTML = isTrigger ? '<span class="dbm-element-tab-indicator">🔗</span>' : '';

    const selectors = subtitle.split(',').map(s => s.trim());
    if (selectors.length > 1) {
        let titleText = overrideTitle || 'Сгруппированные элементы';
        titleHTML = `<span class="dbm-element-tab-title">${indicatorHTML}${titleText}</span>`;
        subtitleHTML = selectors.map(selector => {
            const translation = this.getTranslationForSelector(selector);
            const badge = translation ? `<span class="dbm-translation-badge-small">${translation}</span>` : '';
            return `<div class="dbm-element-tab-subtitle is-grouped"><span class="dbm-element-tab-title">${this.cleanSelectorForDisplay(selector)} ${badge}</span></div>`;
        }).join('');
    } else {
        const singleSelector = selectors[0];
        let titleText = overrideTitle || (level === 0 ? 'Основной элемент' : 'Дочерний элемент');
        const translation = this.getTranslationForSelector(singleSelector);
        const badge = translation ? `<span class="dbm-translation-badge-small">${translation}</span>` : '';
        titleHTML = `<span class="dbm-element-tab-title">${indicatorHTML}${titleText} ${badge}</span>`;
        subtitleHTML = `<div class="dbm-element-tab-subtitle">${this.cleanSelectorForDisplay(singleSelector)}</div>`;
    }

    let actionsHTML = '<div class="dbm-effect-item-actions"></div>';

    if (key === 'parent') {
        actionsHTML = `
        <div class="dbm-effect-item-actions">
            <button class="dbm-btn-icon dbm-btn-secondary reselect-parent-btn dbm-btn-sm" title="Перевыбрать основной элемент">${window.SuperSelectionManager?.ICONS?.reselect || ''}</button>
        </div>`;
    } else if (isDeletable) {
        actionsHTML = `
        <div class="dbm-effect-item-actions">
            <button class="dbm-btn-icon dbm-btn-secondary reselect-target-btn dbm-btn-sm" title="Перевыбрать элемент">${window.SuperSelectionManager?.ICONS?.reselect || ''}</button>
            <button class="dbm-delete-target-btn dbm-btn-icon dbm-btn-sm" title="Удалить цель">${window.SuperSelectionManager?.ICONS?.deleteCross || ''}</button>
        </div>`;
    }

    item.innerHTML = `
        <div class="dbm-element-tab-info">${titleHTML}${subtitleHTML}</div>
        ${actionsHTML}
    `;

    item.onclick = (e) => {
        e.stopPropagation();
        if (e.target.closest('.dbm-delete-target-btn')) {
            this.deleteTarget(key);
        } else if (e.target.closest('.reselect-target-btn')) {
            this.reselectChildTarget(key);
        } else if (e.target.closest('.reselect-parent-btn')) {
            this.reselectParentTarget();
        } else {
            this.activateEditorFor(item);
        }
    };
    
    const wrapper = document.createElement('div');
    if (level > 0) {
        wrapper.className = 'dbm-element-tab-wrapper';
        wrapper.style.paddingLeft = `${level * 20}px`;
    }
    wrapper.appendChild(item);
    return { item, wrapper };
},

activateEditorFor(tabItem) {
    this.activeKey = tabItem.dataset.key;
    document.querySelectorAll('#dbm-elements-tabs .dbm-element-tab.active').forEach(i => i.classList.remove('active'));
    tabItem.classList.add('active');
    this.clearAllOverlays();

    const activeDomNode = this.getDomNodeForKey(this.activeKey);
    if (activeDomNode) activeDomNode.classList.add('dbm-currently-editing-element');

    const controlsContainer = document.getElementById('dbm-controls-container');
    controlsContainer.innerHTML = this.dbmGetControlsHTML();

    document.getElementById('dbm-open-presets-btn').onclick = () => this.showPresetsManagerModal({ context: 'apply' });
    document.getElementById('dbm-ai-helper-btn').onclick = () => this.showAIAssistantModal();

    const addHasBtn = document.getElementById('dbm-add-has-btn');
    const effects = this.allEffects[this.activeParentSelector];
    const children = effects?.parent?.children;

    if (this.activeKey === 'parent' && children && Object.keys(children).length > 0) {
        addHasBtn.disabled = false;
        addHasBtn.onclick = () => this.startHasEffectWorkflow();
    } else {
        addHasBtn.disabled = true;
    }

    document.getElementById('dbm-add-child-btn').onclick = () => {
        const rootParentDomNode = this.getDomNodeForKey('parent');
        if (!rootParentDomNode) {
            console.error("dbmHoverArchitect Error: Не удалось найти основной родительский элемент на странице.");
            return;
        }
        this.showChildTargetModal(rootParentDomNode, 'parent');
    };

    controlsContainer.querySelectorAll('.dbm-property-group-card').forEach(card => {
        const groupName = card.dataset.groupName;
        const switchInput = card.querySelector(`[data-switch="${groupName}"]`);
        card.addEventListener('click', (e) => {
            if (e.target.closest('.dbm-switch')) return;
            this.showPropsEditModal(groupName);
        });
        switchInput.addEventListener('change', (e) => {
            this.dbmUpdateState(this.activeKey, `${groupName}Enabled`, e.target.checked);
            card.classList.toggle('active', e.target.checked);
        });
    });

    this.loadStateIntoControls(this.activeKey);
    this.updatePresetIndicatorUI();

    this.updateDynamicButtons();
},
        loadStateIntoControls(key) {
            const state = this.getCurrentStateForKey(key);
            if(!state) return;
            document.querySelectorAll('.dbm-property-group-card').forEach(card => {
                const groupName = card.dataset.groupName;
                const switchInput = card.querySelector(`[data-switch="${groupName}"]`);
                const isEnabled = state[`${groupName}Enabled`] || false;
                switchInput.checked = isEnabled;
                card.classList.toggle('active', isEnabled);
            });
            this.updateEffectCountInCards();
        },
updateManagerList() {
    this.els.effectsList.innerHTML = '';
    const effectKeys = Object.keys(this.allEffects).filter(key => !key.startsWith('__'));
            const managerHeader = document.getElementById('dbm-manager-header');

    if (effectKeys.length === 0) {
                if (managerHeader) managerHeader.style.display = 'none';
                
                // Восстановленный текст для пустого состояния
                this.els.effectsList.innerHTML = `<div class="dbm-no-effects-placeholder">
                    <div class="icon">🎨</div>
                    <h3>Эффектов пока нет</h3>
                    <p>Нажмите "Создать новый эффект", чтобы выбрать элемент на странице.</p>
                </div>`;
                
                this.updateDynamicButtons(); // Обновляем видимость кнопок в футере
        return;
    }

            if (managerHeader) managerHeader.style.display = 'flex';
        
            // Цикл для отрисовки всех созданных эффектов
            for (const selector of effectKeys) {
                const effect = this.allEffects[selector];
                const blockInfo = this.getBlockInfo(selector);
                
                // Вспомогательная функция для подсчета активных слоев
    const countActiveLayersAndChildren = (state) => {
        let total = { activeLayers: 0, children: 0 };
                    const hasActiveEffects = (s) => Object.keys(this.getDefaultState()).some(key => {
                        return s[key] !== undefined && s[key] !== this.getDefaultState()[key] && key !== 'children';
                    });

        if (hasActiveEffects(state)) {
            total.activeLayers++;
        }

        if (state.children) {
            const childKeys = Object.keys(state.children);
            total.children += childKeys.length;
            childKeys.forEach(key => {
                const childStats = countActiveLayersAndChildren(state.children[key]);
                total.activeLayers += childStats.activeLayers;
                total.children += childStats.children;
            });
        }
        return total;
    };

        const stats = countActiveLayersAndChildren(effect.parent);
        const hasEffectsCount = (effect._hasEffects || []).length;

        const item = document.createElement('div');
                item.className = 'dbm-effect-item-card';
        item.dataset.selector = selector;
        item.innerHTML = `
                    <div class="dbm-effect-item-header">
                        <div class="dbm-effect-item-info">
                            <div class="dbm-effect-item-block-name">${blockInfo ? `${blockInfo.cod} | ${blockInfo.title}` : 'Пользовательский блок'}</div>
                            <div class="dbm-effect-item-selector">${this.cleanSelectorForDisplay(selector)}</div>
                </div>
                        <div class="dbm-effect-item-actions">
                    <button data-selector-delete="${selector}" class="dbm-btn-icon dbm-btn-secondary delete-effect-btn  dbm-btn-sm" title="Удалить">
                                ${window.SuperSelectionManager?.ICONS?.trash || ''}
                    </button>
                </div>
            </div>
                    <div class="dbm-effect-item-stats">
                        <span class="dbm-effect-item-badge">Активных слоев: <strong>${stats.activeLayers}</strong></span>
                        <span class="dbm-effect-item-badge">Дочерних: <strong>${stats.children}</strong></span>
                        <span class="dbm-effect-item-badge">:has(): <strong>${hasEffectsCount}</strong></span>
            </div>
        `;
        this.els.effectsList.appendChild(item);

                // Добавляем подсветку на странице при наведении
        item.addEventListener('mouseenter', () => {
            try {
                        document.querySelectorAll(selector).forEach(el => el.classList.add('dbm-highlight-element-manager'));
                    } catch (e) { console.error("Некорректный селектор для подсветки:", selector); }
        });
        item.addEventListener('mouseleave', () => {
             try {
                        document.querySelectorAll(selector).forEach(el => el.classList.remove('dbm-highlight-element-manager'));
            } catch (e) {}
        });
    }

            // Назначаем обработчики кликов на карточки и кнопки удаления
            this.els.effectsList.querySelectorAll('.dbm-effect-item-card').forEach(card => card.addEventListener('click', e => {
        if (e.target.closest('.delete-effect-btn')) return;
                this.dbmShowEditorView(e.currentTarget.dataset.selector);
    }));

    this.els.effectsList.querySelectorAll('.delete-effect-btn').forEach(b => b.addEventListener('click', async (e) => {
        e.stopPropagation();
        const selector = e.currentTarget.dataset.selectorDelete;
        const confirmed = await this.showModalConfirm("Удалить эффект?", `Вы уверены, что хотите удалить эффект для селектора <strong>${this.cleanSelectorForDisplay(selector)}</strong>?`);
        if (confirmed) {
            delete this.allEffects[selector];
            this.generateAndApplyCSS();
            this.updateManagerList();
                    this.updateDynamicButtons(); // Обновляем кнопки после удаления
        }
    }));
},
        deleteTarget(key) {
            const effects = this.allEffects[this.activeParentSelector];
            if (!effects) return;
            if (key.startsWith('_has:')) {
                effects._hasEffects.splice(parseInt(key.slice(5), 10), 1);
            } else {
                const keyParts = key.split('|');
                let currentState = effects.parent;
                // Идем до предпоследнего элемента
                for (let i = 1; i < keyParts.length - 1; i++) {
                    const childSel = keyParts[i].slice(6);
                    currentState = currentState.children[childSel];
                }
                // Удаляем последний
                const lastPart = keyParts[keyParts.length - 1];
                const childToDelete = lastPart.slice(6);
                delete currentState.children[childToDelete];
            }
            // Переключаемся на родителя, если удалили активный таб
            this.activeKey = 'parent';
            this.buildEffectTree(document.querySelector(this.activeParentSelector));
            this.generateAndApplyCSS();
        },
        // --- HELPERS ---
        // ЗАМЕНИ СТАРУЮ ФУНКЦИЮ getDomNodeForKey
        getDomNodeForKey(key) {
            if (this.activeParentSelector.startsWith('__')) return null;
            try {
                let currentNode = document.querySelector(this.activeParentSelector);
                if (!currentNode) return null;
                if (key === 'parent') return currentNode;
                if (key.startsWith('_has:')) {
                     const effect = this.allEffects[this.activeParentSelector]._hasEffects[parseInt(key.slice(5), 10)];
                     if (!effect || !effect.target) return null;
                     return effect.target === '.' ? currentNode : currentNode.querySelector(effect.target);
                }
                const keyParts = key.split('|');
                // Начинаем с 1, потому что 0-й элемент это всегда 'parent'
                for (let i = 1; i < keyParts.length; i++) {
                    const part = keyParts[i];
                    if (part.startsWith('child:')) {
                        const childSel = part.slice(6).split(',')[0].trim(); // Берем первый селектор для подсветки
                        if (currentNode && childSel) {
                            currentNode = currentNode.querySelector(childSel);
                        } else {
                            return null; // Если на каком-то этапе элемент не найден
                        }
                    }
                }
                return currentNode;
            } catch (e) { return null; }
        },
        async copyCSS() {
            const isInEditor = !!this.activeParentSelector;
            let cssToCopy = '';
        
            if (isInEditor) {
                const choice = await this.showModalCopy(); // Показываем новый попап
                if (choice === 'cancel') return;
                
                // Генерируем CSS в зависимости от выбора пользователя
                cssToCopy = this.generateCssForScope(choice);
        
            } else {
                // Если мы на главном экране, всегда копируем всё
                cssToCopy = this.generateCssForScope('all');
            }
        
            if (!cssToCopy.trim()) {
                    this.showModalPrompt("Нечего копировать", "Вы еще не создали ни одного эффекта.", null, false, 'OK', true);
                    return;
                }

            const formattedCss = `<style>\n${cssToCopy.trim()}\n</style>`;
                navigator.clipboard.writeText(formattedCss).then(() => {
                this.showModalPrompt("Скопировано!", "CSS-код скопирован в буфер обмена.", null, false, 'OK');
                }, () => {
                this.showModalPrompt("Ошибка", "Не удалось скопировать код. Пожалуйста, скопируйте его вручную.", null, false, 'OK', true);
                });
        },
        // Helper to clean selector for display purposes (использует глобальный метод)
        cleanSelectorForDisplay(selector) {
            if (window.SuperSelectionManager) {
                return window.SuperSelectionManager.cleanSelectorForDisplay(selector);
            }
            if (!selector || typeof selector !== 'string') return '';
            return selector.replace(/^(#rec[0-9]+|\.uc-[\w-]+)\s*/, '');
        },
        getTranslationForSelector(selector) {
            if (window.SuperSelectionManager) {
                return window.SuperSelectionManager.getTranslationForSelector(selector);
            }
            // Fallback если SuperSelectionManager недоступен
            for (const key in window.SuperSelectionManager?.TRANSLATION_MAP || {}) {
                if (selector.toLowerCase().includes(key)) return window.SuperSelectionManager.TRANSLATION_MAP[key];
            }
            return '';
        },
        getBlockInfo(selector) {
            if (window.SuperSelectionManager) {
                return window.SuperSelectionManager.getBlockInfo(selector);
            }
            // Fallback если SuperSelectionManager недоступен
            if (!selector || typeof selector !== 'string' || selector.startsWith('__')) return null;
            try {
                const el = document.querySelector(selector);
                if (!el) return null;
                const tildaBlock = el.closest('.r.t-rec');
                if (tildaBlock) {
                    const recordType = tildaBlock.getAttribute('data-record-type');
                    return window.SuperSelectionManager?.TILDA_BLOCK_MAP?.[recordType] || null;
                }
            } catch(e) { return null; }
            return null;
        },
        addHighlightEventListeners(containerElement) {
            containerElement.querySelectorAll('[data-selector]').forEach(item => {
                const selector = item.dataset.selector;
                let elementToHighlight; // Используем let, так как будем искать элемент
                try {
                    elementToHighlight = document.querySelector(selector);
                } catch (e) {
                    console.error("Invalid selector for highlighting:", selector, e);
                    return; // Пропускаем этот элемент, если селектор невалидный
                }
                if (elementToHighlight) {
                    item.addEventListener('mouseenter', () => {
                        // Используем стандартный класс подсветки, чтобы не плодить стили
                       elementToHighlight.classList.add('dbm-highlight-element');
                    });
                    item.addEventListener('mouseleave', () => {
                       elementToHighlight.classList.remove('dbm-highlight-element');
                    });
                }
            });
        },
       // ✅ ИЗМЕНЕНИЕ: Добавлено свойство disableOnMobile
getDefaultEffectState: () => ({
    parent: dbmHoverArchitect.getDefaultState(),
    children: {},
    _hasEffects: [],
    disableOnMobile: true 
}),
getDefaultState: () => ({
    // Animation
    animationEnabled: true, duration: 300, easing: 'ease',
    bezier1: 0.25, bezier2: 0.1, bezier3: 0.25, bezier4: 1.0,
    // Transform
    transformEnabled: false, translateX: 0, translateY: 0,
    rotateX: 0, rotateY: 0, rotateZ: 0,
    scaleX: 1, scaleY: 1,
    skewX: 0, skewY: 0,
    perspectiveEnabled: false,
    perspectiveValue: 1000,
        // Margins & Padding
    marginPaddingEnabled: false,
    marginTop: '', marginRight: '', marginBottom: '', marginLeft: '',
    paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '',
        // Background & Gradient
    styleEnabled: false, opacity: 1,
        backgroundType: 'solid',
    backgroundColor: '',
        gradientType: 'linear',
    gradientAngle: 90,
    gradientColor1: '#ffffff',
    gradientColor2: '#000000',
    // Typography
    textEnabled: false, color: '', fontSize: '', fontWeight: '',
        letterSpacing: '',
        lineHeight: '',
        textDecorationLine: 'none',
        textDecorationStyle: 'solid',
        textDecorationColor: '',
    // Borders & Corners
    borderEnabled: false,
    borderTopLeftRadius: '', borderTopRightRadius: '',
    borderBottomLeftRadius: '', borderBottomRightRadius: '',
    borderWidth: '',
    borderStyle: 'solid',
    borderColor: '',
    // Shadow
    boxShadowEnabled: false, boxShadowX: 0, boxShadowY: 10, boxShadowBlur: 20, boxShadowSpread: 0, boxShadowColor: 'rgba(0,0,0,0.15)',
        boxShadowInset: false,
    // Filters
    filterEnabled: false, blur: 0, brightness: 1, contrast: 1, saturate: 1, grayscale: 0,
        backdropBlur: 0,
        
        // ✅ НОВОЕ СВОЙСТВО
        overflowHidden: false,

    // Internal
    children: {}
}),
        // --- MODALS & PRESETS ---
showModalConfirm(title, text) {
                  return new Promise(resolve => {
                        this.els.panelOverlay.innerHTML = `
                    <div class="dbm-modal-content-wrapper">
                        <div class="dbm-modal-content">
                            <div class="dbm-modal-header">
                                <h4>${title}</h4>
                                <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                                          </div>
                            <div class="dbm-modal-body">
                                <p>${text}</p>
                                    </div>
                            <div class="dbm-modal-footer">
                                <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                                <button id="dbm-modal-confirm-btn" class="dbm-btn dbm-btn-primary" style="background-color: var(--dbm-danger-color);">Подтвердить</button>
                            </div>
                        </div>
                              </div>`;
                        this.els.panelOverlay.classList.add('visible');
                        const cleanup = (val) => { this.removeModal(); resolve(val); };

                        // Добавляем обработчики закрытия
                        this.addModalCloseListeners(cleanup);

                this.els.panelOverlay.querySelector('#dbm-modal-confirm-btn').onclick = () => cleanup(true);
                this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn').onclick = () => cleanup(false);
                  });
            },
 showModalPrompt(title, text, onConfirm = null, showCancel = false, confirmText = 'OK', isError = false) {
                        this.els.panelOverlay.innerHTML = `
                                <div class="dbm-modal-content-wrapper">
                                        <div class="dbm-modal-content">
                                            <div class="dbm-modal-header">
                                                <h4 style="color: ${isError ? 'var(--dbm-danger-color)' : 'inherit'}">${title}</h4>
                                                <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                                            </div>
                                            <div class="dbm-modal-body">
                                                <div>${text}</div>
                                                </div>
                                            <div class="dbm-modal-footer">
                                                ${showCancel ? `<button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>` : ''}
                                                <button id="dbm-modal-ok-btn" class="dbm-btn dbm-btn-primary">${confirmText}</button>
                                        </div>
                                        </div>
                                </div>`;
                        this.els.panelOverlay.classList.add('visible');
                        const cleanup = () => this.removeModal();

                        // Добавляем обработчики закрытия
                        this.addModalCloseListeners(cleanup);

                        this.els.panelOverlay.querySelector('#dbm-modal-ok-btn').onclick = () => { if (onConfirm) onConfirm(); else cleanup(); };
                        if (showCancel) this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn').onclick = cleanup;
                },
 removeModal() {
                        if (this.els.panelOverlay.classList.contains('visible')) {
                                this.els.panelOverlay.classList.remove('visible');
                        }
                        this.updateHighlight(null);
                },

showSelectorModal(title, parentElement, onConfirm, options = {}) {
    const { singleSelection = false, confirmText = 'Добавить', allowParentSelection = false, onCancel = () => {} } = options;
    let elements = [];
    if (allowParentSelection) {
        elements.push(parentElement);
    }
    parentElement.querySelectorAll('*').forEach(child => {
        if(!child.closest('#dbm-editor-panel')) {
            elements.push(child);
        }
    });
    const selectorToElementMap = new Map();
    elements.forEach(el => {
        const selector = this.getUniqueSelector(el);
        if (selector && !selectorToElementMap.has(selector)) {
            selectorToElementMap.set(selector, el);
        }
    });
    const uniqueSelectors = Array.from(selectorToElementMap.keys());
    const listItemsHTML = uniqueSelectors.map(selector => {
        const isParent = selector === this.activeParentSelector;
        const translation = this.getTranslationForSelector(selector);
        const badge = translation ? `<span class="dbm-translation-badge">${translation}</span>` : '';
        const typeBadge = `<span class="dbm-element-type-badge">${isParent ? 'ОСНОВНОЙ' : 'Дочерний'}</span>`;
        const cleanPart = isParent ? this.cleanSelectorForDisplay(selector) : selector.split(' ').pop();
        return `<div class="dbm-modal-list-item can-apply" data-selector="${selector.replace(/"/g, '&quot;')}">
                    <div class="dbm-modal-list-item-info">
                    ${typeBadge} ${cleanPart} ${badge}
                    </div>
                </div>`;
    }).join('');

    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content">
                <div class="dbm-modal-header">
                <h4>${title}</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <div class="dbm-modal-list">${listItemsHTML}</div>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                    <button id="dbm-modal-confirm-btn" class="dbm-btn dbm-btn-primary" disabled>${confirmText}</button>
                </div>
            </div>
        </div>`;
    this.els.panelOverlay.classList.add('visible');

    const confirmBtn = this.els.panelOverlay.querySelector('#dbm-modal-confirm-btn');
    const cancelBtn = this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn');
    const allListItems = this.els.panelOverlay.querySelectorAll('.dbm-modal-list-item');

        allListItems.forEach(item => {
        const elementToHighlight = selectorToElementMap.get(item.dataset.selector);
        if (elementToHighlight) {
            item.addEventListener('mouseenter', () => elementToHighlight.classList.add('dbm-highlight-element-child'));
            item.addEventListener('mouseleave', () => elementToHighlight.classList.remove('dbm-highlight-element-child'));
        }
        item.addEventListener('click', () => {
            console.log('[SUPER-HOVER] Клик по элементу списка:', item.dataset.selector);
            if (singleSelection) {
                allListItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            } else {
                item.classList.toggle('selected');
            }
            const hasSelected = this.els.panelOverlay.querySelector('.dbm-modal-list-item.selected');
            confirmBtn.disabled = !hasSelected;
            console.log('[SUPER-HOVER] Кнопка подтверждения активна:', !confirmBtn.disabled);
        });
    });

    const cleanup = () => {
        selectorToElementMap.forEach(el => el.classList.remove('dbm-highlight-element-child'));
        this.removeModal();
    };

    // Добавляем обработчики закрытия
    this.addModalCloseListeners(() => {
        onCancel();
        cleanup();
    });

    confirmBtn.onclick = () => {
        const selectedSelectors = Array.from(this.els.panelOverlay.querySelectorAll('.dbm-modal-list-item.selected')).map(i => i.dataset.selector);
        console.log('[SUPER-HOVER] Выбранные селекторы:', selectedSelectors);
        onConfirm(selectedSelectors);
        cleanup();
    };
    
    cancelBtn.onclick = () => {
        onCancel();
        cleanup();
    };
},
showChildTargetModal(parentNode, parentKey, options = {}) {
    if (!parentNode) return;
    const { singleSelection = false, confirmText = 'Добавить выбранные', onConfirm: onConfirmCallback } = options;

    const onConfirm = (selectedFullSelectors) => {
        if (typeof onConfirmCallback === 'function') {
            onConfirmCallback(selectedFullSelectors);
            return;
        }

        const parentState = this._getStateObjectRef(parentKey);
        if (!parentState) return;
        if (!parentState.children) {
            parentState.children = {};
        }

        let lastCreatedKey = null;

        selectedFullSelectors.forEach(selector => {
            const childElement = document.querySelector(selector);
            if (!childElement) return;
            const relativeSelector = this.getRelativeSelector(childElement, parentNode);
            if (relativeSelector && !parentState.children[relativeSelector]) {
                parentState.children[relativeSelector] = this.getDefaultState();
                lastCreatedKey = `${parentKey}|child:${relativeSelector}`;
            }
        });

        this.buildEffectTree(document.querySelector(this.activeParentSelector));
        this.generateAndApplyCSS();

        setTimeout(() => {
            if (lastCreatedKey) {
                try {
                    const newTab = this.els.elementsTabs.querySelector(`[data-key="${lastCreatedKey.replace(/"/g, '\\"')}"]`);
                    if (newTab) {
                        newTab.click();
                    }
                } catch (e) {
                    console.error("Не удалось выбрать созданный слой:", e);
                }
            }
        }, 50);
    };

    this.showSelectorModal(
        singleSelection ? 'Выберите новый элемент' : 'Выберите дочерний элемент(ы)',
        parentNode,
        onConfirm,
        { singleSelection, confirmText }
    );
},


showModalCopy() {
    return new Promise(resolve => {
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content">
                <div class="dbm-modal-header">
                    <h4>Скопировать CSS</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <p>Выберите, какие стили вы хотите скопировать:</p>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-copy-current" class="dbm-btn dbm-btn-secondary">Только для текущего</button>
                    <button id="dbm-copy-all" class="dbm-btn dbm-btn-primary">Все эффекты</button>
                </div>
            </div>
        </div>`;
        this.els.panelOverlay.classList.add('visible');
        
        const cleanup = (val) => { this.removeModal(); resolve(val); };
        
        // Добавляем обработчики закрытия
        this.addModalCloseListeners(() => cleanup('cancel'));
        
        this.els.panelOverlay.querySelector('#dbm-copy-current').onclick = () => cleanup('current');
        this.els.panelOverlay.querySelector('#dbm-copy-all').onclick = () => cleanup('all');
    });
},

generateCssForScope(scope) {
    const selectors = scope === 'all' 
        ? Object.keys(this.allEffects).filter(key => !key.startsWith('__'))
        : [this.activeParentSelector];
    
    let finalCss = '';

    // Вспомогательные функции, которые нужны для генерации
    const getStyles = (state) => {
        let styles = '', transforms = [], filters = [], backdropFilters = [];
        if(!state) return '';
        if (state.transformEnabled) {
            if (state.translateX || state.translateY) transforms.push(`translate(${state.translateX || 0}px, ${state.translateY || 0}px)`);
            if (state.scaleX != 1 && state.scaleX !== undefined) transforms.push(`scaleX(${state.scaleX})`);
            if (state.scaleY != 1 && state.scaleY !== undefined) transforms.push(`scaleY(${state.scaleY})`);
            if (state.skewX || state.skewY) transforms.push(`skew(${state.skewX || 0}deg, ${state.skewY || 0}deg)`);
            if (state.rotateX) transforms.push(`rotateX(${state.rotateX}deg)`);
            if (state.rotateY) transforms.push(`rotateY(${state.rotateY}deg)`);
            if (state.rotateZ) transforms.push(`rotateZ(${state.rotateZ}deg)`);
        }
        if (state.filterEnabled) {
            if (state.blur > 0) filters.push(`blur(${state.blur}px)`);
            if (state.brightness != 1 && state.brightness !== undefined) filters.push(`brightness(${state.brightness})`);
            if (state.contrast != 1 && state.contrast !== undefined) filters.push(`contrast(${state.contrast})`);
            if (state.saturate != 1 && state.saturate !== undefined) filters.push(`saturate(${state.saturate})`);
            if (state.grayscale > 0) filters.push(`grayscale(${state.grayscale})`);
            if (state.backdropBlur > 0) backdropFilters.push(`blur(${state.backdropBlur}px)`);
        }
        if (transforms.length) styles += `transform: ${transforms.join(' ')};`;
        if (filters.length) styles += `filter: ${filters.join(' ')};`;
        if (backdropFilters.length) styles += `backdrop-filter: ${backdropFilters.join(' ')}; -webkit-backdrop-filter: ${backdropFilters.join(' ')};`;
        if (state.styleEnabled) {
            if (state.opacity != 1 && state.opacity !== undefined) styles += `opacity: ${state.opacity};`;
            if (state.backgroundType === 'solid' && state.backgroundColor) {
                styles += `background-color: ${state.backgroundColor} !important;`;
            } else if (state.backgroundType === 'gradient') {
                const gradType = state.gradientType === 'linear' ? 'linear-gradient' : 'radial-gradient';
                const angle = state.gradientType === 'linear' ? `${state.gradientAngle}deg, ` : '';
                styles += `background-image: ${gradType}(${angle}${state.gradientColor1}, ${state.gradientColor2}) !important;`;
            }
        }
        if (state.boxShadowEnabled) {
            const inset = state.boxShadowInset ? 'inset ' : '';
            styles += `box-shadow: ${inset}${state.boxShadowX || 0}px ${state.boxShadowY || 0}px ${state.boxShadowBlur || 0}px ${state.boxShadowSpread || 0}px ${state.boxShadowColor || 'rgba(0,0,0,0.1)'};`;
        }
        if (state.textEnabled) {
            if (state.color) styles += `color: ${state.color} !important;`;
            if (state.fontSize) styles += `font-size: ${state.fontSize}px;`;
            if (state.fontWeight) styles += `font-weight: ${state.fontWeight};`;
            if (state.letterSpacing) styles += `letter-spacing: ${state.letterSpacing}px;`;
            if (state.lineHeight) styles += `line-height: ${state.lineHeight};`;
            if (state.textDecorationLine && state.textDecorationLine !== 'none') {
                styles += `text-decoration: ${state.textDecorationLine} ${state.textDecorationStyle} ${state.textDecorationColor || 'currentColor'};`;
            }
        }
        if (state.borderEnabled) {
            if (state.borderTopLeftRadius) styles += `border-top-left-radius: ${state.borderTopLeftRadius}px;`;
            if (state.borderTopRightRadius) styles += `border-top-right-radius: ${state.borderTopRightRadius}px;`;
            if (state.borderBottomRightRadius) styles += `border-bottom-right-radius: ${state.borderBottomRightRadius}px;`;
            if (state.borderBottomLeftRadius) styles += `border-bottom-left-radius: ${state.borderBottomLeftRadius}px;`;
            if (state.borderWidth && state.borderStyle && state.borderColor) {
                styles += `border: ${state.borderWidth}px ${state.borderStyle} ${state.borderColor};`;
            }
        }
        if (state.marginPaddingEnabled) {
            if(state.marginTop) styles += `margin-top: ${state.marginTop}px !important;`;
            if(state.marginRight) styles += `margin-right: ${state.marginRight}px !important;`;
            if(state.marginBottom) styles += `margin-bottom: ${state.marginBottom}px !important;`;
            if(state.marginLeft) styles += `margin-left: ${state.marginLeft}px !important;`;
            if(state.paddingTop) styles += `padding-top: ${state.paddingTop}px !important;`;
            if(state.paddingRight) styles += `padding-right: ${state.paddingRight}px !important;`;
            if(state.paddingBottom) styles += `padding-bottom: ${state.paddingBottom}px !important;`;
            if(state.paddingLeft) styles += `padding-left: ${state.paddingLeft}px !important;`;
        }
        return styles;
    };
    const getTransition = (state) => {
        if (!state || !state.animationEnabled) return `transition: all 200ms ease;`;
        let easing = state.easing || 'ease';
        if (easing === 'custom' && state.bezier1 !== undefined) {
            easing = `cubic-bezier(${state.bezier1 || 0}, ${state.bezier2 || 0}, ${state.bezier3 || 1}, ${state.bezier4 || 1})`;
        }
        return `transition: all ${state.duration || 200}ms ${easing};`;
    };

    selectors.forEach(baseSelector => {
        const effect = this.allEffects[baseSelector];
        if (!effect || !effect.parent) return;
        let effectCss = '';
        const processState = (state, path = '') => {
            const fullSelector = (baseSelector + path).trim();
            let initialStyles = getTransition(state);
            if (state.overflowHidden) {
                initialStyles += ` overflow: hidden !important;`;
            }
            if (state.perspectiveEnabled) {
                initialStyles += ` perspective: ${state.perspectiveValue || 1000}px;`;
            }
            effectCss += `${fullSelector} { ${initialStyles} }\n`;
            const hoverStyles = getStyles(state);
            if (hoverStyles) {
                effectCss += `${baseSelector}:hover${path} { ${hoverStyles} }\n`;
            }
            if (state.children) {
                Object.keys(state.children).forEach(childKey => {
                    const newPath = `${path} ${childKey.trim()}`;
                    processState(state.children[childKey], newPath);
                });
            }
        };
        processState(effect.parent);
        if (effect._hasEffects) {
            effect._hasEffects.forEach(he => {
                const hasStyles = getStyles(he.styles);
                if (hasStyles) {
                    const relativeTrigger = this.getSubtitleFromKey(he.triggerKey);
                    const relativeTarget = he.target;
                    const fullTargetSelector = `${baseSelector} ${relativeTarget}`;
                    let initialHasStyles = getTransition(he.styles);
                    if (he.styles.overflowHidden) {
                         initialHasStyles += ` overflow: hidden !important;`;
                    }
                    if (he.styles.perspectiveEnabled) {
                        initialHasStyles += ` perspective: ${he.styles.perspectiveValue || 1000}px;`;
                    }
                    effectCss += `${fullTargetSelector} { ${initialHasStyles} }\n`;
                    effectCss += `${baseSelector}:has(${relativeTrigger}:hover) ${relativeTarget} { ${hasStyles} }\n`;
                }
            });
        }
        if (effect.disableOnMobile) {
            finalCss += `@media (hover:hover) {\n${effectCss}}\n`;
        } else {
            finalCss += effectCss;
        }
    });
    return finalCss;
},





startHasEffectWorkflow() {
    const parentNode = this.getDomNodeForKey('parent');
    if (!parentNode) return;
    this.showHasTriggerModal((triggerKey) => {
        if (!triggerKey) return;
        this.showSelectorModal('Шаг 2: Выберите ЦЕЛЬ (что анимировать)', parentNode, (selectedTargets) => {
            if (selectedTargets.length === 0) return;
            const effects = this.allEffects[this.activeParentSelector];
            if (!effects._hasEffects) effects._hasEffects = [];
            const parentParts = this.activeParentSelector.split(' ').filter(Boolean);
            let lastCreatedIndex = -1; // Запомним индекс последнего созданного эффекта
            selectedTargets.forEach(targetSelector => {
                const childParts = targetSelector.split(' ').filter(Boolean);
                let relativeParts = [...childParts];
                for (let i = 0; i < parentParts.length; i++) {
                    if (relativeParts.length > 0 && relativeParts[0] === parentParts[i]) {
                        relativeParts.shift();
                    } else {
                        relativeParts = [childParts.pop()];
                        break;
                    }
                }
                const relativeTarget = relativeParts.join(' ').trim();
                if (relativeTarget) {
                    effects._hasEffects.push({
                        triggerKey: triggerKey,
                        target: relativeTarget,
                        styles: this.getDefaultState()
                    });
                    // Обновляем индекс последнего созданного
                    lastCreatedIndex = effects._hasEffects.length - 1;
                }
            });
            this.buildEffectTree(parentNode);
            // --- НОВАЯ ЛОГИКА АКТИВАЦИИ :has ---
            if (lastCreatedIndex !== -1) {
                const newHasKey = `_has:${lastCreatedIndex}`;
                const newHasTab = this.els.elementsTabs.querySelector(`[data-key="${newHasKey}"]`);
                if (newHasTab) {
                    newHasTab.click();
                }
            }
            // --- КОНЕЦ НОВОЙ ЛОГИКИ ---
            this.generateAndApplyCSS();
        }, { singleSelection: false, confirmText: 'Применить к выбранным', allowParentSelection: true });
    });
},
// ЗАМЕНИ СТАРУЮ ФУНКЦИЮ showHasTriggerModal НА ЭТУ
showHasTriggerModal(onConfirm) {
    const effects = this.allEffects[this.activeParentSelector];
    const parentState = effects.parent;
    let listItems = '';
    // Рекурсивно собираем все дочерние слои для списка
    const findChildren = (state, keyPrefix) => {
        if (!state.children) return;
        for (const childKey in state.children) {
            const fullKey = `${keyPrefix}|child:${childKey}`;
            listItems += `
                <div class="dbm-modal-list-item can-apply" data-key="${fullKey}">
                    ${this.cleanSelectorForDisplay(childKey)}
                </div>`;
            findChildren(state.children[childKey], fullKey);
        }
    };
    findChildren(parentState, 'parent');
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content">
                <div class="dbm-modal-header">
                <h4>Шаг 1: Выберите триггерный Hover-эффект</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <div class="dbm-modal-list">${listItems}</div>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                </div>
            </div>
        </div>`;
    this.els.panelOverlay.classList.add('visible');
    this.els.panelOverlay.querySelectorAll('.dbm-modal-list-item').forEach(item => {
        item.onclick = () => {
            // Вот здесь было изменение:
            onConfirm(item.dataset.key); // Просто вызываем колбэк
                  // this.removeModal();            // <--- ЭТА СТРОКА УДАЛЕНА
        };
    });
    this.els.panelOverlay.querySelector('#modal-cancel-btn').onclick = () => this.removeModal();
},




        loadUserPresets() { this.userPresets = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; },
        saveUserPresets() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userPresets)); },


        showCreatePresetModal() {
    // Получаем все стили текущего активного слоя
    const stylesToSave = this.getCurrentStateForKey(this.activeKey);
    
    // Удаляем служебное поле, чтобы не сохранять его в пресете
    delete stylesToSave._appliedPreset;

            const isEditMode = this.activeParentSelector.startsWith('__PRESET_EDIT_MODE__');
            const presetName = isEditMode ? this.activeParentSelector.slice(20) : '';

            this.els.panelOverlay.innerHTML = `
    <div class="dbm-modal-content-wrapper">
        <div class="dbm-modal-content">
            <div class="dbm-modal-header">
                    <h4>${isEditMode ? 'Сохранить пресет' : 'Создать новый пресет'}</h4>
                <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
            </div>
            <div class="dbm-modal-body">
                    <div class="dbm-form-group">
                        <label>Название пресета</label>
                        <input type="text" id="preset-name-input" value="${presetName}" placeholder="Например, 'Плавный подъем'">
                    </div>
                    </div>
            <div class="dbm-modal-footer">
                <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                <button id="dbm-modal-confirm-btn" class="dbm-btn dbm-btn-primary">${isEditMode ? 'Сохранить' : 'Создать'}</button>
                </div>
        </div>
            </div>`;

            this.els.panelOverlay.classList.add('visible');

    const confirmBtn = this.els.panelOverlay.querySelector('#dbm-modal-confirm-btn');
    const cancelBtn = this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn'); 
            const nameInput = this.els.panelOverlay.querySelector('#preset-name-input');
            nameInput.focus();

            const onConfirm = () => {
                const newName = nameInput.value.trim();
                if (!newName) return;

        const newPreset = { name: newName, styles: stylesToSave };
                
        const existingIndex = this.userPresets.findIndex(p => p.name === newName);

                    if (existingIndex !== -1) {
            if(!isEditMode || this.userPresets[existingIndex].name !== presetName) {
                        this.showModalPrompt("Ошибка", "Пресет с таким именем уже существует.", null, false, 'OK', true);
                        return;
            }
            this.userPresets[existingIndex] = newPreset;
        } else {
            this.userPresets.push(newPreset);
                }

                this.saveUserPresets();
                this.removeModal();

                if (isEditMode) {
            this.dbmShowManagerView();
                } else {
                    this.hasUnsavedChanges = false;
                    this.updatePresetButtonVisibility();
            const targetState = this._getStateObjectRef(this.activeKey);
            if (targetState) {
                targetState._appliedPreset = newName;
            }
                    this.updatePresetIndicatorUI();
                }
            };

            // Добавляем обработчики закрытия
            this.addModalCloseListeners(() => this.removeModal());

            confirmBtn.onclick = onConfirm;

    if (cancelBtn) {
        cancelBtn.onclick = () => this.removeModal();
    }
        },


        showPresetsManagerModal(options = {}) {
            const { context = 'apply' } = options;
            const isApplyContext = context === 'apply';
            const createList = (title, presets, isUser) => {
                if (Object.keys(presets).length === 0 && (!isUser || presets.length === 0)) return '';
                
                const listItems = Object.entries(presets).map(([key, data]) => {
                    const presetName = isUser ? data.name : key;
                    return `<div class="dbm-modal-list-item ${isApplyContext ? 'can-apply' : ''}" data-name="${presetName}" data-user="${isUser}">
                                <div class="dbm-modal-list-item-info">${presetName}</div>
                                ${!isApplyContext && isUser ? `<div class="dbm-effect-item-actions">
                            <button class="dbm-btn-icon dbm-btn-secondary edit-preset-btn"><lord-icon src="https://cdn.lordicon.com/pflszmr5.json" trigger="hover" style="width:20px;height:20px"></lord-icon></button>
                                    <button class="dbm-btn-icon dbm-btn-secondary delete-preset-btn">${window.SuperSelectionManager?.ICONS?.trash || ''}</button>
                        </div>` : ''}
                    </div>`;
                }).join('');
                return `<h4>${title}</h4><div class="dbm-modal-list">${listItems}</div>`;
            };

            const modalContent = `
                <div class="dbm-modal-content-wrapper">
                    <div class="dbm-modal-content">
                        <div class="dbm-modal-header">
                            <h4>${isApplyContext ? 'Применить пресет' : 'Управление пресетами'}</h4>
                            <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                        </div>
                        <div class="dbm-modal-body">
                    ${createList('Ваши пресеты', this.userPresets, true)}
                    ${createList('Стандартные пресеты', this.DEFAULT_PRESETS, false)}
                </div>
                        <div class="dbm-modal-footer">
                            <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Закрыть</button>
                        </div>
                    </div>
            </div>`;
            this.els.panelOverlay.innerHTML = modalContent;
            this.els.panelOverlay.classList.add('visible');

            // Добавляем обработчики закрытия
            this.addModalCloseListeners(() => this.removeModal());

            this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn').onclick = () => this.removeModal();

            if (isApplyContext) {
                this.els.panelOverlay.querySelectorAll('.dbm-modal-list-item.can-apply').forEach(item => {
                    item.onclick = () => {
                        this.applyPreset(item.dataset.name, item.dataset.user === 'true');
                        this.removeModal();
                    };
                });
            } else {
                this.els.panelOverlay.querySelectorAll('.edit-preset-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        const name = e.currentTarget.closest('.dbm-modal-list-item').dataset.name;
                        const preset = this.userPresets.find(p => p.name === name);
                        if (preset) {
                            const editKey = `__PRESET_EDIT_MODE__${name}`;
                            this.allEffects[editKey] = JSON.parse(JSON.stringify(preset.styles));
                            this.removeModal();
                            this.dbmShowEditorView(editKey, { isPresetEdit: true, presetName: name });
                        }
                    };
                });
                this.els.panelOverlay.querySelectorAll('.delete-preset-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        const name = e.currentTarget.closest('.dbm-modal-list-item').dataset.name;
                        if (await this.showModalConfirm("Удалить пресет?", `Вы уверены, что хотите удалить пресет <strong>${name}</strong>?`)) {
                            this.userPresets = this.userPresets.filter(p => p.name !== name);
                            this.saveUserPresets();
                            this.removeModal();
                            this.showPresetsManagerModal({ context: 'manage' });
                        }
                    };
                });
            }
        },

updateDynamicButtons() {
    // Логика для кнопки "Копировать код"
    const hasAnyEffects = Object.keys(this.allEffects).filter(key => !key.startsWith('__')).length > 0;
    if (this.els.copyCodeBtn) {
        this.els.copyCodeBtn.classList.toggle('visible', hasAnyEffects);
            }

    // Логика для кнопки "Создать пресет"
    if (this.els.createPresetBtn) {
        const isInEditor = !this.els.editorView.classList.contains('hidden');
        this.els.createPresetBtn.classList.toggle('visible', this.hasUnsavedChanges && isInEditor);
    }
        },


        applyPreset(name, isUser) {
    const presetSource = isUser ? this.userPresets : this.DEFAULT_PRESETS;
    // Находим пресет по имени в пользовательских или стандартных
    const preset = presetSource[name] || (isUser ? presetSource.find(p => p.name === name) : null);

    // Проверяем, что пресет найден и имеет правильную структуру (со свойством styles)
    if (!preset || !preset.styles) {
        console.error("Пресет не найден или имеет неверную структуру:", name);
        return;
    }

    // Находим объект стилей для ТЕКУЩЕГО АКТИВНОГО СЛОЯ в редакторе
    const targetStateObject = this._getStateObjectRef(this.activeKey);
    if (!targetStateObject) {
        console.error("Не удалось найти активный слой для применения пресета.");
        return;
    }

    // ГЛАВНАЯ ЛОГИКА:
    // Просто берем стили из пресета и применяем их к текущему слою.
    // Object.assign() идеально подходит: он перезапишет существующие значения и добавит новые.
    Object.assign(targetStateObject, JSON.parse(JSON.stringify(preset.styles)));

    // Ставим метку в UI, что пресет был применен
    targetStateObject._appliedPreset = name;

    // Обновляем всё, чтобы увидеть изменения на странице и в панели
                this.generateAndApplyCSS();
    this.loadStateIntoControls(this.activeKey); // Перезагружаем контролы (карточки и переключатели)
    this.updatePresetIndicatorUI();
},

           _getStateObjectRef(key = this.activeKey) {
            const effects = this.allEffects[this.activeParentSelector];
               if (!effects) return null;
               if (key.startsWith('_has:')) {
                   const hasEffect = effects._hasEffects[parseInt(key.slice(5), 10)];
                   return hasEffect ? hasEffect.styles : null;
               }
               let currentState = effects.parent;
               if (key === 'parent') {
                   return currentState;
               }
               const keyParts = key.split('|');
               for (let i = 1; i < keyParts.length; i++) {
                   const part = keyParts[i];
                   if (part.startsWith('child:')) {
                       const childSel = part.slice(6);
                       if (currentState && currentState.children && currentState.children[childSel]) {
                           currentState = currentState.children[childSel];
                       } else {
                           return null; 
                       }
                   }
               }
               return currentState;
           },

        resetPreset() {
               // ✨ ИЗМЕНЕНИЕ ЗДЕСЬ: Находим объект состояния для активного слоя.
               const targetState = this._getStateObjectRef(this.activeKey);
               if (targetState && targetState._appliedPreset) {
                   // Удаляем "стикер" с конкретного слоя.
                   delete targetState._appliedPreset;
                   // Обновляем UI, который теперь тоже смотрит на конкретный слой.
                this.updatePresetIndicatorUI();
            }
        },
        updatePresetIndicatorUI() {
               // Получаем состояние для АКТИВНОГО слоя, а не для всего эффекта.
               const currentState = this.getCurrentStateForKey(this.activeKey);
            const container = this.els.presetIndicatorContainer;

               // Проверяем наличие пресета в состоянии текущего слоя.
               if (currentState && currentState._appliedPreset) {
                   container.innerHTML = `<div id="dbm-preset-indicator"><span>Применен пресет: <strong>${currentState._appliedPreset}</strong></span><button id="dbm-reset-preset-btn">Сбросить</button></div>`;
                container.querySelector('#dbm-reset-preset-btn').onclick = () => this.resetPreset();
            } else {
                container.innerHTML = '';
            }
        },
        clearAllOverlays() {
           document.querySelectorAll('.dbm-currently-editing-element').forEach(el => el.classList.remove('dbm-currently-editing-element'));
        },
        
        // Универсальная функция для добавления обработчиков закрытия модальных окон
        addModalCloseListeners(onClose) {
            // Удаляем старые обработчики, если они есть
            this.els.panelOverlay.onclick = null;
            
            // Закрытие по клику на кнопку ×
            const closeBtn = this.els.panelOverlay.querySelector('.dbm-modal-close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => onClose(false);
            }
            
            // Закрытие по клику вне модального окна
            this.els.panelOverlay.onclick = (e) => {
                // Проверяем, что клик был именно на overlay, а не на его дочерние элементы
                if (e.target === this.els.panelOverlay) {
                    onClose(false);
                }
            };
            
            // Предотвращаем всплытие событий от содержимого модального окна
            const modalContent = this.els.panelOverlay.querySelector('.dbm-modal-content');
            if (modalContent) {
                modalContent.onclick = (e) => {
                    e.stopPropagation();
                };
            }
            
            // Закрытие по ESC (обработчик уже есть в dbmInitEventListeners)
        },
        setupColorPicker(wrapper) {
            const textInput = wrapper.querySelector('input[type="text"]');
            const colorInput = wrapper.querySelector('input[type="color"]');
            if (!textInput || !colorInput) return;
            const sync = (from, to) => {
                to.value = from.value;
                to.dispatchEvent(new Event('input', { bubbles: true }));
            };
            textInput.addEventListener('input', () => {
                colorInput.value = textInput.value;
            });
            colorInput.addEventListener('input', () => sync(colorInput, textInput));
        },
        setupEasingControls(container) {
            const presets = container.querySelectorAll('.dbm-easing-preset');
            const customInputs = container.querySelector('#dbm-custom-bezier-inputs');
            presets.forEach(btn => {
                btn.addEventListener('click', () => {
                    presets.forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const easing = btn.dataset.easing;
                    // Скрываем стандартные инпуты, так как у нас есть редактор
                    customInputs.classList.remove('active');
                    if (easing === 'custom') {
                        // Вместо показа инпутов, открываем наш новый редактор
                        this.showBezierEditorModal();
                    } else {
                       this.dbmUpdateState(this.activeKey, 'easing', easing);
                    }
                });
            });
        },
            // ДОБАВЬТЕ ЭТУ НОВУЮ ВСПОМОГАТЕЛЬНУЮ ФУНКЦИЮ В ВАШ КОД
getRelativeSelector(childElement, parentElement) {
   if (!childElement || !parentElement) return '';

   // Получаем полный селектор для родителя и ребенка
   const parentSelector = this.getUniqueSelector(parentElement);
   const childSelector = this.getUniqueSelector(childElement);

   // Самый надежный способ получить относительный путь:
   // Если селектор ребенка начинается с селектора родителя, просто отрезаем эту часть.
   if (childSelector.startsWith(parentSelector)) {
       return childSelector.substring(parentSelector.length).trim();
   }

   // Если по какой-то причине логика выше не сработала (редкий случай),
   // возвращаем самую простую часть селектора ребенка.
   return childSelector.split(' ').pop();
},
        // ПОЛНОСТЬЮ ЗАМЕНИТЕ СТАРУЮ ФУНКЦИЮ getGroupPropsHTML
        getGroupPropsHTML(groupName) {
            const groupData = {
                'animation': `<div class="dbm-form-group"><label>Длительность (ms)</label><input type="number" data-prop="duration" step="50" class="!text-left"></div><div class="dbm-form-group"><label>Плавность</label><div class="dbm-easing-presets"><button class="dbm-easing-preset" data-easing="ease">Ease</button><button class="dbm-easing-preset" data-easing="ease-in-out">Ease-In-Out</button><button class="dbm-easing-preset" data-easing="ease-in">Ease-In</button><button class="dbm-easing-preset" data-easing="ease-out">Ease-Out</button><button class="dbm-easing-preset" data-easing="linear">Linear</button><button class="dbm-easing-preset" data-easing="custom">Custom</button></div><div id="dbm-custom-bezier-inputs" class="dbm-grid-4"><input type="number" step="0.01" min="0" max="1" data-prop="bezier1" placeholder="x1"><input type="number" step="0.01" min="-1" max="2" data-prop="bezier2" placeholder="y1"><input type="number" step="0.01" min="0" max="1" data-prop="bezier3" placeholder="x2"><input type="number" step="0.01" min="-1" max="2" data-prop="bezier4" placeholder="y2"></div></div>`,
                
                // ✅ ИЗМЕНЕНИЕ: Добавлен переключатель "Обрезать контент"
                'transform': `<div class="dbm-form-group"><label>Сдвиг X/Y (px)</label><div class="dbm-grid-2"><input type="number" data-prop="translateX" placeholder="X"><input type="number" data-prop="translateY" placeholder="Y"></div></div><div class="dbm-form-group"><label>Искажение X/Y (deg)</label><div class="dbm-grid-2"><input type="number" data-prop="skewX" placeholder="X"><input type="number" data-prop="skewY" placeholder="Y"></div></div><div class="dbm-form-group"><label>Масштаб X/Y</label><div class="dbm-grid-2"><input type="number" step="0.01" data-prop="scaleX" placeholder="X"><input type="number" step="0.01" data-prop="scaleY" placeholder="Y"></div></div><div class="dbm-form-group"><label>Поворот X/Y/Z (deg)</label><div class="dbm-grid-2" style="grid-template-columns: repeat(3, 1fr);"><input type="number" data-prop="rotateX" placeholder="X"><input type="number" data-prop="rotateY" placeholder="Y"><input type="number" data-prop="rotateZ" placeholder="Z"></div></div><div class="dbm-subsection"><div class="dbm-form-group"><label style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span>Обрезать контент</span><label class="dbm-switch"><input type="checkbox" data-prop="overflowHidden"><span class="dbm-slider"></span></label></label></div><div class="dbm-form-group"><label style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span>Включить перспективу</span><label class="dbm-switch"><input type="checkbox" data-prop="perspectiveEnabled"><span class="dbm-slider"></span></label></label></div><div class="dbm-form-group" id="perspective-value-group" style="display: none;"><label>Сила перспективы (px)</label><input type="number" data-prop="perspectiveValue" step="50" class="!text-left"></div></div>`,
                
                'style': `<div class="dbm-form-group"><label>Прозрачность (0-1)</label><input type="number" step="0.1" max="1" min="0" data-prop="opacity" class="!text-left"></div><div class="dbm-subsection"><div class="dbm-form-group"><label>Тип фона</label><div class="dbm-easing-presets" id="background-type-selector"><button class="dbm-easing-preset" data-bg-type="solid">Сплошной</button><button class="dbm-easing-preset" data-bg-type="gradient">Градиент</button></div></div><div id="solid-color-controls"><div class="dbm-form-group"><label>Цвет фона</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="backgroundColor"><input type="color" data-color-for="backgroundColor"></div></div></div><div id="gradient-controls" class="hidden"><div class="dbm-form-group"><label>Тип градиента</label><div class="dbm-easing-presets" id="gradient-type-selector"><button class="dbm-easing-preset" data-grad-type="linear">Линейный</button><button class="dbm-easing-preset" data-grad-type="radial">Радиальный</button></div></div><div class="dbm-form-group" id="gradient-angle-control"><label>Угол (deg)</label><input type="number" data-prop="gradientAngle"></div><div class="dbm-grid-2"><div class="dbm-form-group"><label>Цвет 1</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="gradientColor1"><input type="color" data-color-for="gradientColor1"></div></div><div class="dbm-form-group"><label>Цвет 2</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="gradientColor2"><input type="color" data-color-for="gradientColor2"></div></div></div></div></div>`,
                
                'text': `<div class="dbm-grid-2"><div class="dbm-form-group"><label>Цвет текста</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="color"><input type="color" data-color-for="color"></div></div><div class="dbm-form-group"><label>Насыщенность</label><input type="number" step="100" min="100" max="900" data-prop="fontWeight" class="!text-left"></div></div><div class="dbm-grid-2"><div class="dbm-form-group"><label>Размер (px)</label><input type="number" data-prop="fontSize" class="!text-left"></div><div class="dbm-form-group"><label>Межбукв. (px)</label><input type="number" step="0.1" data-prop="letterSpacing" class="!text-left"></div></div><div class="dbm-form-group"><label>Межстрочный инт.</label><input type="number" step="0.1" data-prop="lineHeight" class="!text-left"></div><div class="dbm-subsection"><div class="dbm-grid-2"><div class="dbm-form-group"><label>Линия</label><select data-prop="textDecorationLine"><option value="none">Нет</option><option value="underline">Подчеркнутая</option><option value="overline">Надчеркнутая</option><option value="line-through">Зачеркнутая</option></select></div><div class="dbm-form-group"><label>Стиль линии</label><select data-prop="textDecorationStyle"><option value="solid">Сплошная</option><option value="wavy">Волнистая</option><option value="dotted">Точками</option><option value="dashed">Пунктир</option><option value="double">Двойная</option></select></div></div><div class="dbm-form-group"><label>Цвет линии</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="textDecorationColor"><input type="color" data-color-for="textDecorationColor"></div></div></div>`,
                
                'marginPadding': `<div class="dbm-subsection"><h4 style="font-size: 1rem; margin-bottom: 12px;">Внешние отступы (Margin)</h4><div class="dbm-grid-4"><div class="dbm-form-group"><label>Top</label><input type="text" data-prop="marginTop"></div><div class="dbm-form-group"><label>Right</label><input type="text" data-prop="marginRight"></div><div class="dbm-form-group"><label>Bottom</label><input type="text" data-prop="marginBottom"></div><div class="dbm-form-group"><label>Left</label><input type="text" data-prop="marginLeft"></div></div></div><div class="dbm-subsection"><h4 style="font-size: 1rem; margin-bottom: 12px;">Внутренние отступы (Padding)</h4><div class="dbm-grid-4"><div class="dbm-form-group"><label>Top</label><input type="text" data-prop="paddingTop"></div><div class="dbm-form-group"><label>Right</label><input type="text" data-prop="paddingRight"></div><div class="dbm-form-group"><label>Bottom</label><input type="text" data-prop="paddingBottom"></div><div class="dbm-form-group"><label>Left</label><input type="text" data-prop="paddingLeft"></div></div></div>`,
                
                // ✅ ИЗМЕНЕНИЕ: Добавлен переключатель "Обрезать контент"
                'border': `<div class="dbm-subsection"><h4 style="font-size: 1rem; margin-bottom: 12px;">Скругление углов (px)</h4><div class="dbm-grid-4"><div class="dbm-form-group"><label>◰</label><input type="text" data-prop="borderTopLeftRadius"></div><div class="dbm-form-group"><label>◳</label><input type="text" data-prop="borderTopRightRadius"></div><div class="dbm-form-group"><label>◲</label><input type="text" data-prop="borderBottomRightRadius"></div><div class="dbm-form-group"><label>◱</label><input type="text" data-prop="borderBottomLeftRadius"></div></div></div><div class="dbm-subsection"><div class="dbm-form-group"><label style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span>Обрезать контент</span><label class="dbm-switch"><input type="checkbox" data-prop="overflowHidden"><span class="dbm-slider"></span></label></label></div></div>`,
                
                'boxShadow': `<div class="dbm-form-group"><label style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span>Внутренняя тень</span><label class="dbm-switch"><input type="checkbox" data-prop="boxShadowInset"><span class="dbm-slider"></span></label></label></div><div class="dbm-grid-4"><div class="dbm-form-group"><label>X</label><input type="number" data-prop="boxShadowX"></div><div class="dbm-form-group"><label>Y</label><input type="number" data-prop="boxShadowY"></div><div class="dbm-form-group"><label>Blur</label><input type="number" data-prop="boxShadowBlur"></div><div class="dbm-form-group"><label>Spread</label><input type="number" data-prop="boxShadowSpread"></div></div><div class="dbm-form-group"><label>Цвет тени</label><div class="dbm-color-input-wrapper"><input type="text" data-prop="boxShadowColor"><input type="color" data-color-for="boxShadowColor"></div></div>`,
                
                'filter': `<div class="dbm-subsection"><h4 style="font-size: 1rem; margin-bottom: 12px;">Filter</h4><div class="dbm-form-group"><label>Размытие (px)</label><input type="number" step="0.1" min="0" data-prop="blur"></div><div class="dbm-grid-2"><div class="dbm-form-group"><label>Яркость</label><input type="number" step="0.1" min="0" data-prop="brightness"></div><div class="dbm-form-group"><label>Контраст</label><input type="number" step="0.1" min="0" data-prop="contrast"></div></div><div class="dbm-grid-2"><div class="dbm-form-group"><label>Насыщенность</label><input type="number" step="0.1" min="0" data-prop="saturate"></div><div class="dbm-form-group"><label>Оттенки серого</label><input type="number" step="0.1" min="0" max="1" data-prop="grayscale"></div></div></div><div class="dbm-subsection"><h4 style="font-size: 1rem; margin-bottom: 12px;">Backdrop Filter</h4><div class="dbm-form-group"><label>Размытие фона (px)</label><input type="number" step="1" min="0" data-prop="backdropBlur"></div></div>`,
            };
            return groupData[groupName] || '';
        },
// ПОЛНОСТЬЮ ЗАМЕНИТЕ СТАРУЮ ФУНКЦИЮ showPropsEditModal
showPropsEditModal(groupName) {
    const groupTitles = { animation: 'Анимация', transform: 'Трансформация', style: 'Фон', text: 'Типографика', marginPadding: 'Отступы', border: 'Границы и углы', boxShadow: 'Тень', filter: 'Фильтры' };
    const propsHTML = this.getGroupPropsHTML(groupName);
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content modal-props-editor">
                <div class="dbm-modal-header">
                    <h4>${groupTitles[groupName]}</h4>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <label class="dbm-switch"><input type="checkbox" id="dbm-modal-prop-switch"><span class="dbm-slider"></span></label>
                        <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                </div>
                <div class="dbm-modal-body">${propsHTML}</div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-close-btn" class="dbm-btn dbm-btn-primary">Готово</button>
                </div>
            </div>
        </div>`;
    this.els.panelOverlay.classList.add('visible');
    this.els.panelOverlay.querySelector('#dbm-modal-close-btn').onclick = () => this.removeModal();
    const modalBody = this.els.panelOverlay.querySelector('.dbm-modal-body');
    const modalSwitch = this.els.panelOverlay.querySelector('#dbm-modal-prop-switch');
    const currentState = this.getCurrentStateForKey();
    const isEnabled = currentState[`${groupName}Enabled`] || false;
    modalSwitch.checked = isEnabled;
    modalBody.classList.toggle('disabled', !isEnabled);
    modalSwitch.addEventListener('change', () => {
       this.dbmUpdateState(this.activeKey, `${groupName}Enabled`, modalSwitch.checked);
        modalBody.classList.toggle('disabled', !modalSwitch.checked);
        const cardSwitch = document.querySelector(`.dbm-property-group-card[data-group-name="${groupName}"] [data-switch]`);
        if(cardSwitch) {
            cardSwitch.checked = modalSwitch.checked;
            cardSwitch.closest('.dbm-property-group-card').classList.toggle('active', modalSwitch.checked);
        }
    });
    this.loadPropsIntoModal(modalBody);
    // --- ДОПОЛНИТЕЛЬНАЯ ЛОГИКА ДЛЯ ИНТЕРАКТИВНЫХ МОДАЛЬНЫХ ОКОН ---
    // Логика для "Фон и градиент"
    if (groupName === 'style') {
        const bgTypeSelector = modalBody.querySelector('#background-type-selector');
        const gradTypeSelector = modalBody.querySelector('#gradient-type-selector');
        const solidControls = modalBody.querySelector('#solid-color-controls');
        const gradientControls = modalBody.querySelector('#gradient-controls');
        const angleControl = modalBody.querySelector('#gradient-angle-control');
        const updateStyleUI = () => {
            const state = this.getCurrentStateForKey();
            // Установка активных кнопок
            bgTypeSelector.querySelector(`[data-bg-type="${state.backgroundType}"]`).classList.add('active');
            gradTypeSelector.querySelector(`[data-grad-type="${state.gradientType}"]`).classList.add('active');
            // Показ/скрытие блоков
            solidControls.classList.toggle('hidden', state.backgroundType !== 'solid');
            gradientControls.classList.toggle('hidden', state.backgroundType !== 'gradient');
            angleControl.classList.toggle('hidden', state.gradientType !== 'linear');
        };
        bgTypeSelector.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
            bgTypeSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
           this.dbmUpdateState(this.activeKey, 'backgroundType', btn.dataset.bgType);
            updateStyleUI();
        }));
        gradTypeSelector.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
            gradTypeSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
           this.dbmUpdateState(this.activeKey, 'gradientType', btn.dataset.gradType);
            updateStyleUI();
        }));
        updateStyleUI();
    }
    // Логика для "Трансформация"
    if (groupName === 'transform') {
        const perspectiveSwitch = modalBody.querySelector('[data-prop="perspectiveEnabled"]');
        const perspectiveValueGroup = modalBody.querySelector('#perspective-value-group');
        const toggleValueVisibility = () => {
            perspectiveValueGroup.style.display = perspectiveSwitch.checked ? 'block' : 'none';
        };
        toggleValueVisibility(); // Устанавливаем начальное состояние
        perspectiveSwitch.addEventListener('change', toggleValueVisibility);
    }
},
        getCurrentStateForKey(key = this.activeKey) {
            const effects = this.allEffects[this.activeParentSelector];
            if (!effects) return this.getDefaultState();
            if (key.startsWith('_has:')) {
                const hasEffect = effects._hasEffects[parseInt(key.slice(5), 10)];
                return { ...this.getDefaultState(), ...(hasEffect ? hasEffect.styles : {}) };
            }
            let currentState = effects.parent;
            const keyParts = key.split('|');
            // Проходим по пути, кроме последнего элемента (это 'parent' или 'child:...')
            for (let i = 1; i < keyParts.length; i++) {
                const part = keyParts[i];
                if (part.startsWith('child:')) {
                    const childSel = part.slice(6);
                    if (currentState && currentState.children && currentState.children[childSel]) {
                        currentState = currentState.children[childSel];
                    } else {
                        return this.getDefaultState(); // Если путь не найден, возвращаем дефолт
                    }
                }
            }
            return { ...this.getDefaultState(), ...currentState };
            },

       _getStateObjectRef(key = this.activeKey) {
           const effects = this.allEffects[this.activeParentSelector];
           if (!effects) return null;
           if (key.startsWith('_has:')) {
               const hasEffect = effects._hasEffects[parseInt(key.slice(5), 10)];
               return hasEffect ? hasEffect.styles : null;
           }
           let currentState = effects.parent;
           if (key === 'parent') {
               return currentState;
           }
           const keyParts = key.split('|');
           for (let i = 1; i < keyParts.length; i++) {
               const part = keyParts[i];
               if (part.startsWith('child:')) {
                   const childSel = part.slice(6);
                   if (currentState && currentState.children && currentState.children[childSel]) {
                       currentState = currentState.children[childSel];
                   } else {
                       return null; 
                   }
               }
           }
           return currentState;
        },

loadPropsIntoModal(modalBody) {
    const state = this.getCurrentStateForKey();
    // Обрабатываем обычные инпуты
    modalBody.querySelectorAll('[data-prop]').forEach(input => {
        const prop = input.dataset.prop;
        if (state[prop] !== undefined) {
            input.value = state[prop];
        }
        input.addEventListener('input', () => {
            // Преобразуем значение в число, если это возможно и нужно
            const value = (input.type === 'number') ? parseFloat(input.value) : input.value;
           this.dbmUpdateState(this.activeKey, prop, input.type === 'checkbox' ? input.checked : value);
        });
    });
    // Обрабатываем инпуты для выбора цвета
    modalBody.querySelectorAll('input[type="color"]').forEach(colorInput => {
        const propName = colorInput.dataset.colorFor;
        const textInput = modalBody.querySelector(`[data-prop="${propName}"]`);
        if (textInput) {
            colorInput.value = textInput.value || '#000000';
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                textInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
            textInput.addEventListener('input', () => {
                try { colorInput.value = textInput.value; } catch (e) { /* ignore */ }
            });
        }
    });
    // --- НОВАЯ ЛОГИКА ДЛЯ ПЛАВНОСТИ ---
    // Вызываем настройщик, если он есть в модальном окне
    if (modalBody.querySelector('.dbm-easing-presets')) {
        this.setupEasingControls(modalBody);
        // Устанавливаем активную кнопку
        const currentEasing = state.easing || 'ease';
        const activeButton = modalBody.querySelector(`.dbm-easing-preset[data-easing="${currentEasing}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        // Показываем/скрываем кастомные поля
        const customInputs = modalBody.querySelector('#dbm-custom-bezier-inputs');
        if (customInputs) {
            customInputs.classList.toggle('active', currentEasing === 'custom');
        }
    }
},
    updateEffectCountInCards() {
            const state = this.getCurrentStateForKey();
    if (!state) return;
    const effectCounts = {
        transform: 0,
        style: 0,
        text: 0,
        border: 0,
        boxShadow: 0,
        animation: 0,
        filter: 0,
        marginPadding: 0
    };
    if (state.animationEnabled) {
        effectCounts.animation++;
            }
            if (state.transformEnabled) {
                if (state.translateX != 0 || state.translateY != 0) effectCounts.transform++;
                if (state.scaleX != 1 || state.scaleY != 1) effectCounts.transform++;
                if (state.skewX != 0 || state.skewY != 0) effectCounts.transform++;
                if (state.rotateX != 0 || state.rotateY != 0 || state.rotateZ != 0) effectCounts.transform++;
            }
            if (state.styleEnabled) {
        if (state.opacity != 1 && state.opacity !== undefined) effectCounts.style++;
        if (state.backgroundColor || state.backgroundType === 'gradient') effectCounts.style++;
            }
            if (state.textEnabled) {
                if (state.color) effectCounts.text++;
                if (state.fontSize) effectCounts.text++;
                if (state.fontWeight) effectCounts.text++;
            }
    if (state.borderEnabled) {
        if (state.borderTopLeftRadius || state.borderTopRightRadius || state.borderBottomLeftRadius || state.borderBottomRightRadius) effectCounts.border++;
        if (state.borderWidth) effectCounts.border++;
    }
            if (state.boxShadowEnabled) effectCounts.boxShadow++;
    if (state.filterEnabled) {
        if (state.blur > 0 || state.brightness != 1 || state.contrast != 1 || state.saturate != 1 || state.grayscale > 0 || state.backdropBlur > 0) effectCounts.filter++;
    }
    if (state.marginPaddingEnabled) {
        if(state.marginTop || state.marginRight || state.marginBottom || state.marginLeft || state.paddingTop || state.paddingRight || state.paddingBottom || state.paddingLeft) effectCounts.marginPadding++;
    }

    document.querySelectorAll('.dbm-property-group-card').forEach(card => {
                const groupName = card.dataset.groupName;
                const count = effectCounts[groupName] || 0;
                const text = count === 1 ? `${count} эффект` : (count > 1 && count < 5 ? `${count} эффекта` : `${count} эффектов`);
        
        // ✅ ИСПРАВЛЕНИЕ: Добавлен недостающий префикс `dbm-`
        const countElement = card.querySelector('.dbm-card-effect-count');
        if (countElement) {
            countElement.textContent = text;
        }
            });
        },
showBezierEditorModal() {
    const currentState = this.getCurrentStateForKey();
    const initialValues = {
        x1: parseFloat(currentState.bezier1 || 0.25),
        y1: parseFloat(currentState.bezier2 || 0.1),
        x2: parseFloat(currentState.bezier3 || 0.25),
        y2: parseFloat(currentState.bezier4 || 1.0)
    };

    const modalHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content" style="max-width: 600px;">
                <div class="dbm-modal-header">
                <h4>Настройка кривой Безье</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body" style="display: flex; gap: 24px; align-items: stretch;">
                    <div style="flex-basis: 50%;">
                        <div class="dbm-form-group">
                            <label>Настройки</label>
                            <div class="dbm-grid-2">
                                <input type="number" step="0.01" min="0" max="1" id="bezier-x1" title="X1">
                                <input type="number" step="0.01" id="bezier-y1" title="Y1">
                                <input type="number" step="0.01" min="0" max="1" id="bezier-x2" title="X2">
                                <input type="number" step="0.01" id="bezier-y2" title="Y2">
                            </div>
                        </div>
                        <div class="dbm-form-group">
                           <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                               <span>Превью анимации</span>
                               <button id="bezier-play-btn" class="dbm-btn-icon dbm-btn-secondary" title="Проиграть">
                                                                            ${window.SuperSelectionManager?.ICONS?.play || '▶️'}
                               </button>
                           </label>
                           <div id="bezier-preview-wrapper" style="height: 40px; background: #f3f4f6; border-radius: 12px; padding: 10px;">
                               <div id="bezier-preview-ball" style="width: 20px; height: 20px; background: var(--dbm-primary-color); border-radius: 50%;"></div>
                           </div>
                        </div>
                    </div>
                    <div id="bezier-visual-editor" style="flex-basis: 50%; aspect-ratio: 1/1; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; cursor: grab; touch-action: none;">
                       <svg width="100%" height="100%" viewBox="0 0 100 100">
                           <path d="M 0 100 C 25 10, 25 100, 100 0" stroke="#ddd" fill="none" stroke-width="1" />
                           <line id="line1" x1="0" y1="100" x2="25" y2="10" stroke="#9ca3af" stroke-width="0.5" stroke-dasharray="2"/>
                           <line id="line2" x1="100" y1="0" x2="25" y2="100" stroke="#9ca3af" stroke-width="0.5" stroke-dasharray="2"/>
                           <path id="bezier-curve" d="" stroke="var(--dbm-primary-color)" stroke-width="1.5" fill="none"/>
                           <circle id="handle1" cx="25" cy="10" r="3" fill="white" stroke="var(--dbm-primary-color)" stroke-width="1" style="cursor: grab;"/>
                           <circle id="handle2" cx="25" cy="100" r="3" fill="white" stroke="var(--dbm-primary-color)" stroke-width="1" style="cursor: grab;"/>
                       </svg>
                    </div>
                </div>
                <div class="dbm-modal-footer">
                     <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                     <button id="dbm-modal-confirm-btn" class="dbm-btn dbm-btn-primary">Применить</button>
                </div>
            </div>
            <style id="bezier-preview-style"></style>
        </div>
    `;
    this.els.panelOverlay.innerHTML = modalHTML;
    this.els.panelOverlay.classList.add('visible');

    const editor = document.getElementById('bezier-visual-editor');
    const svg = editor.querySelector('svg');
    const curve = document.getElementById('bezier-curve');
    const handle1 = document.getElementById('handle1');
    const handle2 = document.getElementById('handle2');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const x1_input = document.getElementById('bezier-x1');
    const y1_input = document.getElementById('bezier-y1');
    const x2_input = document.getElementById('bezier-x2');
    const y2_input = document.getElementById('bezier-y2');
    const previewBall = document.getElementById('bezier-preview-ball');
    const previewStyle = document.getElementById('bezier-preview-style');
    const playBtn = document.getElementById('bezier-play-btn');
    let p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };

    const updateAll = (values, source = 'init') => {
        if (isNaN(values.x1) || isNaN(values.y1) || isNaN(values.x2) || isNaN(values.y2)) {
            return;
        }
        p1 = { x: values.x1, y: values.y1 };
        p2 = { x: values.x2, y: values.y2 };

        const svgP1 = { x: p1.x * 100, y: 100 - (p1.y * 100) };
        const svgP2 = { x: p2.x * 100, y: 100 - (p2.y * 100) };
        curve.setAttribute('d', `M 0 100 C ${svgP1.x} ${svgP1.y}, ${svgP2.x} ${svgP2.y}, 100 0`);
        handle1.setAttribute('cx', svgP1.x); handle1.setAttribute('cy', svgP1.y);
        handle2.setAttribute('cx', svgP2.x); handle2.setAttribute('cy', svgP2.y);
        line1.setAttribute('x2', svgP1.x); line1.setAttribute('y2', svgP1.y);
        line2.setAttribute('x2', svgP2.x); line2.setAttribute('y2', svgP2.y);

        if (source !== 'input') {
            x1_input.value = p1.x.toFixed(2); y1_input.value = p1.y.toFixed(2);
            x2_input.value = p2.x.toFixed(2); y2_input.value = p2.y.toFixed(2);
        }

        previewStyle.innerHTML = `
           @keyframes bezier-ball-move {
                from { transform: translateX(0px); }
                to { transform: translateX(calc(100% - 20px)); }
            }
            #bezier-preview-ball.animate {
                animation: bezier-ball-move 1.5s ${`cubic-bezier(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y})`} forwards;
            }
        `;
    };

    let activeHandle = null;
    const startDrag = (e, handle) => {
        e.preventDefault();
        activeHandle = handle;
        editor.style.cursor = 'grabbing';
        handle.style.cursor = 'grabbing';
    };
    const drag = (e) => {
        if (!activeHandle) return;
        const rect = svg.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width;
        let y = (e.clientY - rect.top) / rect.height;
                    x = Math.max(0, Math.min(1, x));
        const currentValues = { 
            x1: parseFloat(x1_input.value), y1: parseFloat(y1_input.value),
            x2: parseFloat(x2_input.value), y2: parseFloat(y2_input.value)
        };
        if (activeHandle === handle1) {
            currentValues.x1 = x;
            currentValues.y1 = 1 - y;
        } else {
            currentValues.x2 = x;
            currentValues.y2 = 1 - y;
        }
        updateAll(currentValues, 'drag');
    };
    const endDrag = () => {
        if (!activeHandle) return;
        editor.style.cursor = 'grab';
        activeHandle.style.cursor = 'grab';
        activeHandle = null;
    };
    handle1.addEventListener('mousedown', (e) => startDrag(e, handle1));
    handle2.addEventListener('mousedown', (e) => startDrag(e, handle2));
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);

    [x1_input, y1_input, x2_input, y2_input].forEach(input => {
        input.addEventListener('input', () => {
            const newValues = {
                x1: parseFloat(x1_input.value || 0), y1: parseFloat(y1_input.value || 0),
                x2: parseFloat(x2_input.value || 0), y2: parseFloat(y2_input.value || 0),
            };
            updateAll(newValues, 'input');
        });
    });
    
    playBtn.addEventListener('click', () => {
        previewBall.classList.remove('animate');
                    void previewBall.offsetWidth;
        previewBall.classList.add('animate');
    });

    const cleanup = () => {
        window.removeEventListener('mousemove', drag);
        window.removeEventListener('mouseup', endDrag);
        this.removeModal();
    };
    document.getElementById('dbm-modal-confirm-btn').onclick = () => {
                    this.dbmUpdateState(this.activeKey, 'bezier1', p1.x);
                    this.dbmUpdateState(this.activeKey, 'bezier2', p1.y);
                    this.dbmUpdateState(this.activeKey, 'bezier3', p2.x);
                    this.dbmUpdateState(this.activeKey, 'bezier4', p2.y);
        cleanup();
    };
    document.getElementById('dbm-modal-cancel-btn').onclick = cleanup;
    
    updateAll(initialValues);
},   
showPerspectiveParentModal(targetElement, onConfirm) {
    if (!targetElement) return;
    const parents = [];
    let current = targetElement.parentElement;
    const blockRoot = targetElement.closest('.r.t-rec');
    // Поднимаемся вверх по DOM-дереву до корневого блока Tilda
    while (current && current.contains(targetElement) && current !== blockRoot) {
        const selector = this.getUniqueSelector(current);
        if (selector) {
            parents.push(selector);
        }
        current = current.parentElement;
    }
    if (blockRoot) {
        parents.push(this.getUniqueSelector(blockRoot));
    }
    const listItemsHTML = parents.map(selector => `
        <div class="dbm-modal-list-item can-apply" data-selector="${selector.replace(/"/g, '&quot;')}">
            ${this.cleanSelectorForDisplay(selector) || "Основной блок"}
        </div>
    `).join('');
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content">
                <div class="dbm-modal-header">
                <h4>Выберите родительский элемент для перспективы</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <div class="dbm-modal-list">${listItemsHTML}</div>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                </div>
            </div>
        </div>
    `;
    this.els.panelOverlay.classList.add('visible');
    this.els.panelOverlay.querySelectorAll('.dbm-modal-list-item').forEach(item => {
        item.addEventListener('click', () => {
            onConfirm(item.dataset.selector);
            this.removeModal();
        });
        const elToHighlight = document.querySelector(item.dataset.selector);
        if (elToHighlight) {
           item.addEventListener('mouseenter', () => elToHighlight.classList.add('dbm-highlight-element-child'));
           item.addEventListener('mouseleave', () => elToHighlight.classList.remove('dbm-highlight-element-child'));
        }
    });
    this.els.panelOverlay.querySelector('#dbm-cancel-btn').onclick = () => this.removeModal();
},
reselectChildTarget(key) {
    const keyParts = key.split('|');
   if (keyParts.length < 2) return;
    
   const oldChildSelector = keyParts.pop().slice(6);
   const parentKey = keyParts.join('|');
    const parentDomNode = this.getDomNodeForKey(parentKey);
    if (!parentDomNode) return;
    
    this.showChildTargetModal(parentDomNode, parentKey, {
        singleSelection: true,
        confirmText: 'Заменить',
       onConfirm: (newSelectedFullSelectors) => {
           if (newSelectedFullSelectors.length === 0) return;
            
           const newChildElement = document.querySelector(newSelectedFullSelectors[0]);
           // Используем нашу новую надежную функцию
           const newChildRelativeSelector = this.getRelativeSelector(newChildElement, parentDomNode);

           if (!newChildRelativeSelector || newChildRelativeSelector === oldChildSelector) return;

           const parentState = this._getStateObjectRef(parentKey);
            if (parentState && parentState.children && parentState.children[oldChildSelector]) {
               parentState.children[newChildRelativeSelector] = parentState.children[oldChildSelector];
                delete parentState.children[oldChildSelector];
            }

            this.buildEffectTree(document.querySelector(this.activeParentSelector));
            this.generateAndApplyCSS();
        }
    });
},
reselectParentTarget() {
    const currentElement = document.querySelector(this.activeParentSelector);
    if (!currentElement) {
        // Если элемент не найден, запускаем стандартный режим выбора
        this.startSelectionMode(true);
        return;
    }
    // 1. Генерируем HTML со всеми родителями, как мы делали это раньше
    const hierarchyHTML = this.buildSelectorHierarchyHTML(currentElement, true);
    // 2. Создаем и показываем модальное окно
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content">
                <div class="dbm-modal-header">
                <h4>Сменить основной элемент</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <div class="dbm-modal-list">${hierarchyHTML}</div>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                </div>
            </div>
        </div>`;
    this.els.panelOverlay.classList.add('visible');
    // 3. Добавляем подсветку элементов на странице при наведении в модальном окне
    this.addHighlightEventListeners(this.els.panelOverlay.querySelector('.dbm-modal-list'));
    // 4. Навешиваем обработчики на каждый селектор в списке
   this.els.panelOverlay.querySelectorAll('.dbm-selector-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const newSelector = tag.dataset.selector;
            const oldSelector = this.activeParentSelector;
            if (newSelector && newSelector !== oldSelector) {
                // Переносим настройки на новый селектор
                this.allEffects[newSelector] = this.allEffects[oldSelector];
                delete this.allEffects[oldSelector];
                // Перезагружаем редактор с новым селектором
               this.dbmShowEditorView(newSelector);
            }
            this.removeModal();
        });
    });
    this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn').onclick = () => {
       document.querySelectorAll('.dbm-highlight-element').forEach(el => el.classList.remove('dbm-highlight-element'));
        this.removeModal();
    };
},
reselectChildTarget(key) {
    const keyParts = key.split('|');
    if (keyParts.length < 2) return;
    const oldChildSelector = keyParts.pop().slice(6);
    const parentKey = keyParts.join('|');
    const parentDomNode = this.getDomNodeForKey(parentKey);
    if (!parentDomNode) return;
    this.showChildTargetModal(parentDomNode, parentKey, {
        singleSelection: true,
        confirmText: 'Заменить',
        onConfirm: (newSelectedFullSelectors) => {
            if (newSelectedFullSelectors.length === 0) return;
            const newFullSelector = newSelectedFullSelectors[0];
            const parentSelector = this.getUniqueSelector(parentDomNode);
            const newChildRelativeSelector = newFullSelector.replace(parentSelector, '').trim();
            if (newChildRelativeSelector === oldChildSelector) return;
            const parentState = this.getCurrentStateForKey(parentKey);
            if (parentState && parentState.children && parentState.children[oldChildSelector]) {
                parentState.children[newChildRelativeSelector] = parentState.children[oldChildSelector];
                delete parentState.children[oldChildSelector];
            }
            this.buildEffectTree(document.querySelector(this.activeParentSelector));
            this.generateAndApplyCSS();
            const newFullKey = `${parentKey}|child:${newChildRelativeSelector}`;
            const newTab = this.els.elementsTabs.querySelector(`[data-key="${newFullKey}"]`);
            if (newTab) {
                newTab.click();
            }
        }
    });
},
// ✅ ЗАМЕНИТЕ ВАШУ ФУНКЦИЮ makeSelectorEditable НА ЭТУ
makeSelectorEditable(h2Element) {
    if (!h2Element) return;

    h2Element.style.cursor = 'pointer';
    h2Element.title = 'Нажмите, чтобы редактировать селектор';

    h2Element.addEventListener('click', () => {
        const oldFullSelector = this.activeParentSelector;
        const oldCleanSelector = this.cleanSelectorForDisplay(oldFullSelector);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldCleanSelector;
        input.className = 'dbm-editable-selector-input';

        h2Element.replaceWith(input);
        input.focus();
        input.select();

        const saveChanges = () => {
            const newCleanSelector = input.value.trim();
            if (newCleanSelector === oldCleanSelector || !newCleanSelector) {
                input.replaceWith(h2Element); // Возвращаем заголовок, если ничего не изменилось
                return;
            }

            const blockPrefixMatch = oldFullSelector.match(/^(#rec[0-9]+|\.uc-[\w-]+)\s*/);
            const blockPrefix = blockPrefixMatch ? blockPrefixMatch[0] : '';
            const newFullSelector = blockPrefix + newCleanSelector;
            
            const oldEffectData = this.allEffects[oldFullSelector];
            if (!oldEffectData) {
                input.replaceWith(h2Element);
                return;
            }
            
            // ✅ КЛЮЧЕВАЯ ЛОГИКА: Вместо простого переименования ключа,
            // мы создаем новый объект и переносим данные.
            // Это гарантирует, что все относительные селекторы останутся верными
            // по отношению к новому родительскому селектору.
            this.allEffects[newFullSelector] = oldEffectData;
            delete this.allEffects[oldFullSelector];
            
            // Перезагружаем редактор с новым селектором, который перестроит все дерево
            this.dbmShowEditorView(newFullSelector);
        };

        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveChanges();
            } else if (e.key === 'Escape') {
                input.replaceWith(h2Element);
            }
        });
    });
},




showAIAssistantModal() {
    this.els.panelOverlay.innerHTML = `
        <div class="dbm-modal-content-wrapper">
            <div class="dbm-modal-content" style="max-width: 500px;">
                <div class="dbm-modal-header">
                    <h4>AI Помощник</h4>
                    <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                </div>
                <div class="dbm-modal-body">
                    <div class="dbm-form-group">
                        <label>Опишите эффект, который хотите создать:</label>
                        <textarea id="dbm-ai-prompt-textarea" placeholder="Например: легкий подъем с тенью и поворотом на 5 градусов" rows="3"></textarea>
                    </div>
                    <div id="dbm-ai-status-message" style="margin: 12px 0; font-size: 14px; color: #666;"></div>
                </div>
                <div class="dbm-modal-footer">
                    <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Отмена</button>
                    <button id="dbm-ai-random-btn" class="dbm-btn dbm-btn-secondary">Случайный</button>
                    <button id="dbm-ai-generate-btn" class="dbm-btn dbm-btn-primary">Сгенерировать</button>
                    <button id="dbm-ai-apply-btn" class="dbm-btn dbm-btn-primary" disabled>Применить</button>
                </div>
            </div>
        </div>`;
    this.els.panelOverlay.classList.add('visible');

    const promptTextarea = this.els.panelOverlay.querySelector('#dbm-ai-prompt-textarea');
    const generateBtn = this.els.panelOverlay.querySelector('#dbm-ai-generate-btn');
    const randomBtn = this.els.panelOverlay.querySelector('#dbm-ai-random-btn');
    const applyBtn = this.els.panelOverlay.querySelector('#dbm-ai-apply-btn');
    const cancelBtn = this.els.panelOverlay.querySelector('#dbm-modal-cancel-btn');
    const statusMessage = this.els.panelOverlay.querySelector('#dbm-ai-status-message');
    
    let generatedJson = null; // Будем хранить сырой JSON ответа
    const targetSelector = this.activeParentSelector;
    const activeKeyForAI = this.activeKey; // Запоминаем активный слой на момент вызова

    const cleanup = () => {
        if (this.allEffects['__AI_PREVIEW__']) {
            delete this.allEffects['__AI_PREVIEW__'];
            this.generateAndApplyCSS();
        }
        this.removeModal();
    };

    const handleGeneration = async (isRandom = false) => {
        const prompt = isRandom 
            ? 'Сгенерируй случайный, стильный и красивый hover-эффект для карточки на сайте' 
            : promptTextarea.value.trim();
        if (!prompt) {
            statusMessage.textContent = 'Пожалуйста, опишите эффект.';
            return;
        }
        statusMessage.textContent = 'Магия AI в процессе... ✨';
        generateBtn.disabled = true;
        randomBtn.disabled = true;
        applyBtn.disabled = true;
        try {
            const effectJson = await this.generateAIEffect(prompt);
            generatedJson = effectJson; // Сохраняем "сырой" JSON
            
            // Логика предпросмотра будет простой - покажет только стили для текущего элемента
            const previewState = this.getDefaultState();
            // Стили для предпросмотра - это либо объект "current", либо весь объект, если он плоский
            const stylesForPreview = generatedJson.current || (generatedJson.parent ? {} : generatedJson);

            // "Распаковываем" и применяем стили для предпросмотра
            const processAndFlatten = (source, target) => {
                 for (const key in source) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        for (const subKey in source[key]) {
                            target[subKey] = source[key][subKey];
                        }
                    } else {
                        target[key] = source[key];
                    }
                }
            };
            processAndFlatten(stylesForPreview, previewState);

            this.allEffects['__AI_PREVIEW__'] = this.getDefaultEffectState();
            this.allEffects['__AI_PREVIEW__'].parent = previewState;
            this.allEffects['__AI_PREVIEW__']._targetSelector = targetSelector;

            this.generateAndApplyCSS();
            statusMessage.textContent = 'Эффект сгенерирован! Наведите на элемент.';
            applyBtn.disabled = false;
        } catch (error) {
            statusMessage.textContent = `Ошибка: ${error.message}`;
            console.error(error);
        } finally {
            generateBtn.disabled = false;
            randomBtn.disabled = false;
        }
    };

    if (generateBtn) generateBtn.onclick = () => handleGeneration(false);
    if (randomBtn) randomBtn.onclick = () => handleGeneration(true);
    if (cancelBtn) cancelBtn.onclick = cleanup;
    
    if (applyBtn) applyBtn.onclick = () => {
        if (!generatedJson) {
            cleanup();
            return;
        }

        // Вспомогательная функция для применения стилей и включения нужных групп
        const applyStyles = (stylesObject, targetKey) => {
            if (!stylesObject || typeof stylesObject !== 'object') return;

            const targetState = this._getStateObjectRef(targetKey);
            if (!targetState) return;

            // "Распаковываем" стили, если они вложенные (например, "transform": {...})
            const flattenedStyles = {};
            for (const key in stylesObject) {
                if (typeof stylesObject[key] === 'object' && stylesObject[key] !== null && !Array.isArray(stylesObject[key])) {
                    for (const subKey in stylesObject[key]) {
                        flattenedStyles[subKey] = stylesObject[key][subKey];
                    }
                } else {
                    flattenedStyles[key] = stylesObject[key];
                }
            }

            // Применяем "распакованные" стили к состоянию слоя
            Object.assign(targetState, flattenedStyles);
            
            // Карта для автоматического включения групп свойств
            const propToGroupMap = {
                'translateX': 'transformEnabled', 'translateY': 'transformEnabled', 'scaleX': 'transformEnabled', 'scaleY': 'transformEnabled', 'rotateX': 'transformEnabled', 'rotateY': 'transformEnabled', 'rotateZ': 'transformEnabled', 'skewX': 'transformEnabled', 'skewY': 'transformEnabled', 'perspective': 'transformEnabled',
                'opacity': 'styleEnabled', 'backgroundColor': 'styleEnabled', 'gradientColor1': 'styleEnabled',
                'color': 'textEnabled', 'fontSize': 'textEnabled', 'fontWeight': 'textEnabled', 'letterSpacing': 'textEnabled', 'lineHeight': 'textEnabled',
                'borderWidth': 'borderEnabled', 'borderRadius': 'borderEnabled', 'borderTopLeftRadius': 'borderEnabled',
                'boxShadow': 'boxShadowEnabled', 'boxShadowColor': 'boxShadowEnabled',
                'blur': 'filterEnabled', 'brightness': 'filterEnabled', 'contrast': 'filterEnabled', 'saturate': 'filterEnabled', 'grayscale': 'filterEnabled', 'backdropBlur': 'filterEnabled',
                'duration': 'animationEnabled', 'easing': 'animationEnabled'
            };

            // Включаем нужные группы
            for (const prop in flattenedStyles) {
                if (propToGroupMap[prop] && flattenedStyles[prop] !== this.getDefaultState()[prop]) {
                    targetState[propToGroupMap[prop]] = true;
                }
            }
        };

        // 1. Применяем стили для текущего слоя
        const currentStyles = generatedJson.current || (generatedJson.parent ? null : generatedJson);
        if (currentStyles) {
            applyStyles(currentStyles, activeKeyForAI);
        }

        // 2. Применяем стили для родительского слоя, если AI их предоставил
        if (generatedJson.parent) {
            applyStyles(generatedJson.parent, 'parent');
        }
        
        // 3. Обновляем весь интерфейс
        this.generateAndApplyCSS();
        this.loadStateIntoControls(activeKeyForAI);
        this.updatePresetIndicatorUI();
        this.hasUnsavedChanges = true;
        this.updateDynamicButtons();
        
        cleanup();
    };
    
    // Добавляем обработчики закрытия
    this.addModalCloseListeners(cleanup);
},
async generateAIEffect(prompt) {
    // Улучшенная, более строгая инструкция для AI
    const systemPrompt = `
        You are a CSS effects generator. Your response must be ONLY a JSON object inside a markdown block.
        The user will describe a hover effect. Generate CSS properties for it.
        
        RULES:
        1.  NEVER use the 'transform' property directly. 
        2.  ALWAYS provide individual transform functions like 'translateX', 'rotateY', 'scaleX'.
        3.  If the user asks for an effect on the PARENT element (like perspective), put those styles in a "parent" object.
        4.  Put all other styles for the CURRENT element in a "current" object.
        5.  If the prompt is simple (e.g., "slight lift and shadow"), you can just return the properties at the top level.

        EXAMPLE: User prompt is "slight lift, shadow, and rotate 10 degrees".
        Your response:
        \`\`\`json
        {
            "translateY": -10,
            "rotateZ": 10,
            "boxShadow": "0 10px 20px rgba(0,0,0,0.1)"
        }
        \`\`\`
    `;

    const PROXY_URL = 'https://super-hover.vercel.app/api/generate';
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
             system: systemPrompt,
             prompt: prompt 
        }) 
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сети или сервера.');
    }
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
         throw new Error('AI не вернул подходящего ответа.');
    }
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
        throw new Error('AI вернул некорректный формат JSON.');
    }
    try {
        const effectJson = JSON.parse(jsonMatch[1]);
        const newEffect = this.getDefaultEffectState();

        // Вспомогательная функция для разбора строки transform
        const parseTransformString = (transformString) => {
            const result = {};
            const regex = /(\w+)\(([^)]+)\)/g;
            let match;
            while ((match = regex.exec(transformString)) !== null) {
                const func = match[1];
                const values = match[2].split(',').map(v => parseFloat(v.trim()));
                switch(func) {
                    case 'translateX': result.translateX = values[0]; break;
                    case 'translateY': result.translateY = values[0]; break;
                    case 'translate': result.translateX = values[0]; result.translateY = values[1] || 0; break;
                    case 'scaleX': result.scaleX = values[0]; break;
                    case 'scaleY': result.scaleY = values[0]; break;
                    case 'scale': result.scaleX = values[0]; result.scaleY = values[1] || values[0]; break;
                    case 'rotate':
                    case 'rotateZ': result.rotateZ = values[0]; break;
                    case 'rotateX': result.rotateX = values[0]; break;
                    case 'rotateY': result.rotateY = values[0]; break;
                    case 'skewX': result.skewX = values[0]; break;
                    case 'skewY': result.skewY = values[0]; break;
                    case 'skew': result.skewX = values[0]; result.skewY = values[1] || 0; break;
                }
            }
            return result;
        };
        
        // Вспомогательная функция для "выравнивания" вложенных объектов и применения стилей
        const processAndFlatten = (source, target) => {
            for (const key in source) {
                if (key === 'transform' && typeof source[key] === 'string') {
                    const parsedTransforms = parseTransformString(source[key]);
                    Object.assign(target, parsedTransforms);
                } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    for (const subKey in source[key]) {
                        target[subKey] = source[key][subKey];
                    }
                } else {
                    target[key] = source[key];
                }
            }
        };

        // Вспомогательная функция для автоматического включения групп свойств
        const checkAndEnableGroups = (stateObject) => {
            const propToGroupMap = {
                'translateX': 'transformEnabled', 'translateY': 'transformEnabled', 'scaleX': 'transformEnabled', 'scaleY': 'transformEnabled', 'rotateX': 'transformEnabled', 'rotateY': 'transformEnabled', 'rotateZ': 'transformEnabled', 'skewX': 'transformEnabled', 'skewY': 'transformEnabled', 'perspective': 'transformEnabled',
                'opacity': 'styleEnabled', 'backgroundColor': 'styleEnabled', 'gradientColor1': 'styleEnabled',
                'color': 'textEnabled', 'fontSize': 'textEnabled', 'fontWeight': 'textEnabled', 'letterSpacing': 'textEnabled', 'lineHeight': 'textEnabled',
                'borderWidth': 'borderEnabled', 'borderRadius': 'borderEnabled', 'borderTopLeftRadius': 'borderEnabled',
                'boxShadow': 'boxShadowEnabled', 'boxShadowColor': 'boxShadowEnabled',
                'blur': 'filterEnabled', 'brightness': 'filterEnabled', 'contrast': 'filterEnabled', 'saturate': 'filterEnabled', 'grayscale': 'filterEnabled', 'backdropBlur': 'filterEnabled',
                'duration': 'animationEnabled', 'easing': 'animationEnabled'
            };
            for (const prop in stateObject) {
                if (propToGroupMap[prop] && stateObject[prop] !== this.getDefaultState()[prop]) {
                    stateObject[propToGroupMap[prop]] = true;
                }
            }
        };

        if (effectJson.parent && typeof effectJson.parent === 'object') {
            processAndFlatten(effectJson.parent, newEffect.parent);
            checkAndEnableGroups(newEffect.parent);
        }
        if (effectJson.children && typeof effectJson.children === 'object') {
            newEffect.parent.children = {};
            for(const childKey in effectJson.children) {
                 newEffect.parent.children[childKey] = this.getDefaultState();
                 processAndFlatten(effectJson.children[childKey], newEffect.parent.children[childKey]);
                 checkAndEnableGroups(newEffect.parent.children[childKey]);
            }
        }
        
        // Обрабатываем случай, когда AI возвращает "плоский" объект без вложенности
        if (!effectJson.parent && !effectJson.children) {
            processAndFlatten(effectJson, newEffect.parent);
            checkAndEnableGroups(newEffect.parent);
        }
        
        return newEffect;
    } catch (e) {
       console.error("Ошибка парсинга JSON от AI:", e);
        throw new Error('Не удалось разобрать JSON от AI.');
    }
}




};
window.dbmHoverArchitect = dbmHoverArchitect;
console.log('[SUPER-HOVER] Объект dbmHoverArchitect создан и добавлен в window.');
// Слушаем событие инициализации от main.js
window.addEventListener('dbmInitSolution', (event) => {
    console.log('[SUPER-HOVER] Получено событие dbmInitSolution:', event.detail);
    if (event.detail && event.detail.name === 'dbmHoverArchitect') {
        console.log('[SUPER-HOVER] Получена команда инициализации от main.js');
        try {
            window.dbmHoverArchitect.dbmInit();
            console.log('[SUPER-HOVER] ✅ dbmHoverArchitect.init() успешно вызван.');
        } catch (e) {
            console.error('[SUPER-HOVER] ❌ Ошибка при вызове init():', e);
        }
    }
});

console.log('[SUPER-HOVER] ✅ Скрипт загружен, ожидаем команду инициализации...');
console.log('[SUPER-HOVER] ✅ Скрипт загружен, ожидаем команду инициализации...');