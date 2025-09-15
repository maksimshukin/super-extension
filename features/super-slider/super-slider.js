/**
 * =================================================================================
 * SUPER SLIDER V12 - Новая архитектура, табы, ширина, кастомные стрелки
 * =================================================================================
 */
if (!window.dbmSwiperArchitect) {
    window.dbmSwiperArchitect = {
        // --- STATE & CONFIG ---
        allSliders: {},
        activeSliderKey: null,
        swiperInstance: null,
        originalContainerHTML: null,
        STORAGE_KEY: 'superSliderArchitect_v9',

        // Новая, расширенная структура конфига по умолчанию
        sliderConfig: {
            useBlockPrefix: true,
            // Основные
            general: {
                clipContent: true,
                speed: 400,
                loop: false,
                autoplay: false,
                autoplayDelay: 3000,
            },
            // Ширина
            width: {
                default: { type: 'flexible', sidePadding: 20 },
                breakpoints: {} // e.g., "768": { type: 'fixed', value: 500 }
            },
            // Навигация
            navigation: {
                enabled: true,
                prevElUrl: '',
                nextElUrl: '',
                hoverScale: 1.1,
                position: 'absolute', // absolute | relative
                location: 'bottom', // top | bottom (для relative)
                align: 'between', // start | center | end | between (для relative)
            },
            // Пагинация
            pagination: {
                enabled: true,
                type: "bullets",
                clickable: true,
                align: 'center', // start | center | end
                bullets: {
                    width: '25px', height: '5px', bgColor: '#e7e7e7',
                    activeWidth: '35px', activeHeight: '5px', activeBgColor: '#23272c',
                    radius: '10px', gap: '5px',
                },
                progressbar: {
                    height: '4px', bgColor: '#e0e0e0', fillColor: '#23272c', radius: '4px',
                },
            },
            // Адаптивность (базовые настройки)
            responsive: {
                default: {
                    slidesPerView: 3,
                    slidesPerGroup: 1,
                    spaceBetween: 20,
                    navigation: true,
                    pagination: true,
                },
                breakpoints: {
                    "1200": { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 20, navigation: true, pagination: true },
                    "768": { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 15, navigation: true, pagination: true },
                    "480": { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 10, navigation: true, pagination: true }
                }
            }
        },

        init() {
            console.log('[SwiperArchitect] 🚀 INIT V12: Инициализация Super Slider...');
            if (typeof SuperPanelManager === 'undefined' || typeof SuperSelectionManager === 'undefined') {
                console.error("[SwiperArchitect] ❌ Критическая ошибка: Менеджеры не найдены!");
                return;
            }
            this.loadSliders();
            SuperPanelManager.setSolutionTitle('Super Slider');
            this.showManagerView();
            SuperPanelManager.open();
        },

        // --- DATA PERSISTENCE ---
        saveSliders() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.allSliders));
        },
        loadSliders() {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                this.allSliders = JSON.parse(savedData);
            }
        },

        // --- UI & RENDERING ---
        showManagerView() {
            this.cleanupPreview();
            this.activeSliderKey = null;
        
            const sliderKeys = Object.keys(this.allSliders);
            let contentHTML = (sliderKeys.length === 0)
                ? `<div class="dbm-subsection"><div class="dbm-no-effects-placeholder"><h3>Слайдеров пока нет</h3><p>Нажмите "Создать новый слайдер", чтобы выбрать элемент на странице.</p></div></div>`
                : `<div class="dbm-subsection"><h3>Все слайдеры</h3><div id="dbm-effects-list" class="dbm-sliders-list">${sliderKeys.map(key => this.renderSliderCard(key, this.allSliders[key])).join('')}</div></div>`;
            
            const footerHTML = `<button id="dbm-create-new-slider-btn" class="dbm-btn dbm-btn-primary">Создать новый слайдер</button>`;
        
            SuperPanelManager.setHeader('');
            SuperPanelManager.setContent(contentHTML);
            SuperPanelManager.setFooter(footerHTML);
            SuperPanelManager.hideBackButton();
            this.addManagerEventListeners();
        },

        renderSliderCard(key, sliderData) {
            console.log('[DEBUG] renderSliderCard вызван с key:', key);
            const { slideSelector } = sliderData;
            const blockInfo = SuperSelectionManager.getBlockInfo(key);
            console.log('[DEBUG] blockInfo в renderSliderCard:', blockInfo);
        
            return `
                <div class="dbm-effect-item-card" data-slider-key="${key}">
                    <div class="dbm-effect-item-header">
                        <div class="dbm-effect-item-info">
                            <div class="dbm-effect-item-block-name">${blockInfo ? `${blockInfo.cod} | ${blockInfo.title}` : 'Пользовательский блок'}</div>
                            <div class="dbm-effect-item-selector" title="${key}">Контейнер: ${SuperSelectionManager.cleanSelectorForDisplay(key)}</div>
                            <div class="dbm-effect-item-selector" style="font-size: 12px; color: #6B7280;" title="${slideSelector}">Слайд: ${SuperSelectionManager.cleanSelectorForDisplay(slideSelector)}</div>
                        </div>
                        <div class="dbm-effect-item-actions">
                            <button class="dbm-delete-slider-btn dbm-btn-icon dbm-btn-secondary dbm-btn-sm" title="Удалить">${SuperSelectionManager.ICONS.trash || '🗑️'}</button>
                        </div>
                    </div>
                </div>`;
        },

        showEditorView(sliderKey) {
            this.activeSliderKey = sliderKey;
            const sliderData = this.allSliders[sliderKey];
            if (!sliderData) {
                console.error(`[SwiperArchitect] Не найдены данные для слайдера: ${sliderKey}`);
                this.showManagerView();
                return;
            }

            SuperPanelManager.setHeader(this.renderEditorHeader(sliderKey, sliderData));
            SuperPanelManager.setContent(this.renderEditorContent());
            SuperPanelManager.setFooter(`<button id="dbm-generate-slider-btn" class="dbm-btn dbm-btn-primary">💻 Сгенерировать код</button>`);
            SuperPanelManager.showBackButton();
            
            this.addEditorEventListeners();
            this.initPreview();
        },

        renderEditorHeader(key, data) {
            console.log('[DEBUG] renderEditorHeader вызван с key:', key);
            const containerElement = document.querySelector(key);
            const blockInfo = SuperSelectionManager.getBlockInfo(key);
            console.log('[DEBUG] blockInfo в renderEditorHeader:', blockInfo);
            const isPrefixEnabled = data.config.useBlockPrefix !== false;
            
            // Очищаем селектор для отображения (убираем ID)
            const cleanKey = this.cleanSelectorForDisplay(key);
            const cleanSlideSelector = this.cleanSelectorForDisplay(data.slideSelector);
            
            const controlsHTML = `
                <div class="dbm-editor-controls">
                    <div class="dbm-editor-control-row">
                        <span>Добавлять ID / класс блока</span>
                        <label class="dbm-switch as-label">
                            <input type="checkbox" id="dbm-prefix-toggle-checkbox" ${isPrefixEnabled ? 'checked' : ''}>
                            <span class="dbm-slider"></span>
                        </label>
                    </div>
                </div>`;
        
            return `
                <div class="dbm-header-main-row">
                    <div class="dbm-header-title-group">
                        <div class="dbm-header-title-text">
                            ${blockInfo ? `<div class="dbm-block-info" title="${blockInfo.title}">${blockInfo.cod} | ${blockInfo.title}</div>` : ''}
                            <h2 id="dbm-editable-selector-title" title="Нажмите, чтобы изменить контейнер слайдера" style="cursor: pointer;">${cleanKey}</h2>
                            <small>Контейнер слайдера</small>
                        </div>
                    </div>
                    ${controlsHTML}
                    <div class="dbm-form-group" style="margin-top: 10px;">
                        <label>Селектор для каждого слайда:</label>
                        <div class="dbm-editable-selector-input" data-selector-type="slide" title="Нажмите, чтобы изменить селектор слайда">${cleanSlideSelector}</div>
                    </div>
                </div>
            `;
        },

        cleanSelectorForDisplay(selector) {
            if (!selector || typeof selector !== 'string') return '';
            // Убираем префикс блока (#rec... или .uc-...) для отображения
            return selector.replace(/^(#rec[0-9]+|\.uc-[\w-]+)\s*/, '');
        },

        makeSelectorEditable(element, selectorType) {
            if (!element || !this.activeSliderKey) return;
            
            const currentText = element.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.className = 'dbm-editable-selector-input';
            
            element.replaceWith(input);
            input.focus();
            input.select();
            
            const saveChanges = () => {
                const newValue = input.value.trim();
                if (newValue && newValue !== currentText) {
                    // Обновляем селектор в данных
                    if (selectorType === 'container') {
                        // Для контейнера нужно обновить ключ
                        const oldKey = this.activeSliderKey;
                        const newKey = this.buildFullSelector(newValue);
                        
                        if (newKey !== oldKey) {
                            // Перемещаем данные на новый ключ
                            this.allSliders[newKey] = this.allSliders[oldKey];
                            delete this.allSliders[oldKey];
                            this.activeSliderKey = newKey;
                            this.saveSliders();
                            
                            // Обновляем заголовок
                            SuperPanelManager.setHeader(this.renderEditorHeader(newKey, this.allSliders[newKey]));
                            this.addEditorEventListeners();
                        }
                    } else if (selectorType === 'slide') {
                        // Для слайда обновляем slideSelector
                        this.allSliders[this.activeSliderKey].slideSelector = this.buildFullSelector(newValue);
                        this.saveSliders();
                        
                        // Обновляем заголовок
                        SuperPanelManager.setHeader(this.renderEditorHeader(this.activeSliderKey, this.allSliders[this.activeSliderKey]));
                        this.addEditorEventListeners();
                    }
                } else {
                    // Восстанавливаем исходный текст
                    input.replaceWith(element);
                }
            };
            
            input.addEventListener('blur', saveChanges);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveChanges();
                } else if (e.key === 'Escape') {
                    input.replaceWith(element);
                }
            });
        },

        buildFullSelector(cleanSelector) {
            if (!cleanSelector) return '';
            
            // Если селектор уже содержит ID, возвращаем как есть
            if (cleanSelector.startsWith('#rec')) {
                return cleanSelector;
            }
            
            // Ищем ID блока в текущем активном селекторе
            const currentKey = this.activeSliderKey;
            const idMatch = currentKey.match(/^(#rec[0-9]+)/);
            
            if (idMatch) {
                return `${idMatch[1]} ${cleanSelector}`;
            }
            
            return cleanSelector;
        },

        // Обновленный рендер карточек настроек
        renderEditorContent() {
            const categories = {
                general: 'Основные',
                width: 'Ширина',
                navigation: 'Навигация',
                pagination: 'Пагинация',
                responsive: 'Адаптивность',
            };
            const cardsHTML = Object.entries(categories).map(([key, title]) => `
                <div class="dbm-property-group-card" data-category="${key}">
                    <div class="dbm-card-header"><h4>${title}</h4></div>
                </div>`).join('');
            
            return `<div class="dbm-subsection"><h3>Настройки слайдера</h3><div class="dbm-controls-grid">${cardsHTML}</div></div>`;
        },
        
        addManagerEventListeners() {
            document.getElementById('dbm-create-new-slider-btn')?.addEventListener('click', () => this.startCardSelection());

            document.querySelectorAll('.dbm-sliders-list .dbm-effect-item-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.dbm-delete-slider-btn')) return;
                    this.showEditorView(e.currentTarget.dataset.sliderKey);
                });
            });
            
            document.querySelectorAll('.dbm-delete-slider-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.target.closest('.dbm-effect-item-card').dataset.sliderKey;
                    delete this.allSliders[key];
                    this.saveSliders();
                    this.showManagerView();
            });
        });
        },
        
        addEditorEventListeners() {
            document.getElementById('dbm-generate-slider-btn')?.addEventListener('click', () => this.generateSliderCode());
            document.querySelectorAll('.dbm-property-group-card').forEach(card => card.addEventListener('click', () => this.showSettingsModal(card.dataset.category)));
            document.querySelectorAll('.dbm-editable-selector-input').forEach(el => el.addEventListener('click', () => this.reselectSelector(el.dataset.selectorType)));
            document.getElementById('dbm-prefix-toggle-checkbox')?.addEventListener('change', (e) => {
                this.allSliders[this.activeSliderKey].config.useBlockPrefix = e.target.checked;
                this.saveSliders();
            });
            
            // Добавляем обработчик для редактирования заголовка контейнера
            const editableTitle = document.getElementById('dbm-editable-selector-title');
            if (editableTitle) {
                editableTitle.addEventListener('click', () => this.makeSelectorEditable(editableTitle, 'container'));
            }
        },
        
        startCardSelection() {
            this.cleanupPreview();
            SuperPanelManager.close();
            SuperSelectionManager.startSelection({
                onSelect: (element, selector) => {
                    const parentContainer = this.findParentContainer(element, selector);
                    if (!parentContainer) { alert('Не удалось найти родительский контейнер с несколькими такими элементами.'); SuperPanelManager.open(); return; }
                    const parentSelector = SuperSelectionManager.getUniqueSelector(parentContainer);
                    this.allSliders[parentSelector] = { 
                        slideSelector: selector, 
                        config: JSON.parse(JSON.stringify(this.sliderConfig)) 
                    };
                    this.saveSliders();
                    this.showEditorView(parentSelector);
                    SuperPanelManager.open();
                },
                onCancel: () => SuperPanelManager.open()
            });
        },

        reselectSelector(type) {
            const oldSliderKey = this.activeSliderKey;
            const oldSliderData = this.allSliders[oldSliderKey];
            
            SuperPanelManager.close();
            SuperSelectionManager.startSelection({
                onSelect: (element, selector) => {
                    this.cleanupPreview();
                    if (type === 'container') {
                        delete this.allSliders[oldSliderKey];
                        this.allSliders[selector] = oldSliderData;
                        this.activeSliderKey = selector;
                    } else if (type === 'slide') {
                        oldSliderData.slideSelector = selector;
                    }
                    this.saveSliders();
                    this.showEditorView(this.activeSliderKey);
                     SuperPanelManager.open();
                },
                onCancel: () => SuperPanelManager.open()
            });
        },

        findParentContainer(cardElement, cardSelector) {
            let parent = cardElement.parentElement;
            while (parent && parent !== document.body) {
                if (parent.querySelectorAll(cardSelector).length > 1) return parent;
                parent = parent.parentElement;
            }
            return cardElement.parentElement;
        },

        findParentBlockSelector(element) {
            const parentBlock = element.closest('.r');
            return (parentBlock && parentBlock.id) ? `#${parentBlock.id}` : '';
        },

        async initPreview() {
            try {
                if (typeof Swiper === 'undefined') await this.loadScript('https://unpkg.com/swiper/swiper-bundle.min.js');
                if (!document.querySelector('link[href="https://unpkg.com/swiper/swiper-bundle.min.css"]')) await this.loadStyles('https://unpkg.com/swiper/swiper-bundle.min.css');
            } catch (error) { console.error('[SwiperArchitect] Ошибка загрузки Swiper:', error); return; }

            const container = document.querySelector(this.activeSliderKey);
            if (!container) return;

            if (this.originalContainerHTML === null) this.originalContainerHTML = container.innerHTML;
            
            // Применяем стили контейнера для превью
            this.applyContainerStyles(container);

            this.prepareDOMForSwiper(container);
            this.swiperInstance = new Swiper(this.activeSliderKey, this.buildSwiperConfig());
        },
        
        // Новая функция для применения стилей к контейнеру в превью
        applyContainerStyles(container) {
            const config = this.allSliders[this.activeSliderKey].config;
            container.style.overflow = config.general.clipContent ? 'hidden' : 'visible';

            // Применяем ширину для текущего размера окна
            const currentWidth = window.innerWidth;
            const breakpoints = Object.keys(config.responsive.breakpoints).sort((a, b) => b - a);
            let activeBreakpoint = 'default';
            for (const bp of breakpoints) {
                if (currentWidth <= parseInt(bp)) {
                    activeBreakpoint = bp;
                }
            }
            
            const widthSetting = config.width.breakpoints[activeBreakpoint] || config.width.default;
            if (widthSetting.type === 'fixed') {
                container.style.width = `${widthSetting.value}px`;
                container.style.maxWidth = `${widthSetting.value}px`;
            } else {
                container.style.width = `calc(100% - ${widthSetting.sidePadding * 2}px)`;
                container.style.maxWidth = `calc(100vw - ${widthSetting.sidePadding * 2}px)`;
            }
        },

        updatePreview(forceReinit = false) {
            // Если требуется полное пересоздание (например, при смене loop), чистим и создаем заново
            if (forceReinit) {
                this.cleanupPreview();
                this.initPreview();
                return;
            }

            if (!this.swiperInstance || this.swiperInstance.destroyed) {
                this.initPreview();
                return;
            }

            // Для остальных случаев - простое обновление
            const container = document.querySelector(this.activeSliderKey);
            if (container) {
                this.applyContainerStyles(container);
                Object.assign(this.swiperInstance.params, this.buildSwiperConfig());
                this.swiperInstance.update();
            }
        },

        cleanupPreview() {
            if (this.swiperInstance && !this.swiperInstance.destroyed) {
                this.swiperInstance.destroy(true, true);
                this.swiperInstance = null;
            }
            if(this.activeSliderKey){
                const container = document.querySelector(this.activeSliderKey);
                if (container) {
                    container.style.cssText = ''; // Сбрасываем все инлайн-стили
                    if (this.originalContainerHTML !== null) {
                        container.innerHTML = this.originalContainerHTML;
                        container.className = container.className.replace(/\bswiper\S*\b/g, '').trim();
                    }
                }
            }
            this.originalContainerHTML = null;
        },

        prepareDOMForSwiper(container) {
            const sliderData = this.allSliders[this.activeSliderKey];
            if (!sliderData) return;
            const config = sliderData.config;

            container.innerHTML = this.originalContainerHTML;
            container.classList.add('swiper');
            
            const wrapper = document.createElement('div');
            wrapper.className = 'swiper-wrapper';
            const slides = container.querySelectorAll(sliderData.slideSelector);
            slides.forEach(slide => { 
                slide.classList.add('swiper-slide');
                slide.style.cssText = "max-width: 100% !important; padding: 0 !important; margin: 0 !important; height: auto; box-sizing: border-box;";
                wrapper.appendChild(slide); 
            });
            container.innerHTML = '';
            container.appendChild(wrapper);

            // Добавляем пагинацию и навигацию
            if (config.pagination.enabled) {
                container.insertAdjacentHTML('beforeend', '<div class="swiper-pagination"></div>');
            }
            if (config.navigation.enabled) {
                const navHTML = `<div class="swiper-button-prev"></div><div class="swiper-button-next"></div>`;
                // Для относительного позиционирования создаем отдельный контейнер
                if (config.navigation.position === 'relative') {
                    const navContainer = document.createElement('div');
                    navContainer.className = 'swiper-navigation-container';
                    navContainer.innerHTML = navHTML;
                    if (config.navigation.location === 'top') {
                        container.before(navContainer);
                    } else {
                        container.after(navContainer);
                    }
                } else {
                    container.insertAdjacentHTML('beforeend', navHTML);
                }
            }
        },

        buildSwiperConfig() {
            const config = this.allSliders[this.activeSliderKey].config;
            const finalConfig = {
                speed: config.general.speed,
                loop: config.general.loop,
                autoplay: config.general.autoplay ? { delay: config.general.autoplayDelay } : false,
            };

            // Собираем брейкпоинты
            const responsiveConf = { ...config.responsive.breakpoints };
            const allBreakpoints = { '0': config.responsive.default, ...responsiveConf }; // '0' для дефолта
            
            finalConfig.breakpoints = {};
            for (const bp in allBreakpoints) {
                const bpSettings = allBreakpoints[bp];
                finalConfig.breakpoints[bp] = {
                    slidesPerView: bpSettings.slidesPerView,
                    slidesPerGroup: bpSettings.slidesPerGroup,
                    spaceBetween: bpSettings.spaceBetween,
                };
            }
            
            // Навигация и пагинация (включаем/выключаем на основе текущего брейкпоинта в CSS)
            if (config.navigation.enabled) {
                finalConfig.navigation = {
                    nextEl: `${this.activeSliderKey} .swiper-button-next, .swiper-navigation-container .swiper-button-next`,
                    prevEl: `${this.activeSliderKey} .swiper-button-prev, .swiper-navigation-container .swiper-button-prev`
                };
            }
        
            if (config.pagination.enabled) {
                finalConfig.pagination = {
                    el: `${this.activeSliderKey} .swiper-pagination`,
                    type: config.pagination.type,
                    clickable: config.pagination.clickable
                };
            }
            return finalConfig;
        },
        
        // --- MODALS LOGIC ---
        
// --- MODALS LOGIC ---
        
showSettingsModal(category) {
    let modalBodyHTML = '';
    // Динамический вызов функции рендера для модального окна
    const renderFunction = this[`render${category.charAt(0).toUpperCase() + category.slice(1)}Modal`];
    if (typeof renderFunction === 'function') {
        // ИСПРАВЛЕНО: .call(this) сохраняет правильный контекст
        modalBodyHTML = renderFunction.call(this);
    } else {
        modalBodyHTML = `<p>Настройки для этого блока появятся в следующих версиях.</p>`;
    }

    SuperPanelManager.showModal(`<div class="dbm-modal-content"><div class="dbm-modal-header"><h4>Настройки: ${category}</h4><button class="dbm-modal-close-btn dbm-btn-icon dbm-btn-secondary">&times;</button></div><div class="dbm-modal-body">${modalBodyHTML}</div><div class="dbm-modal-footer"><button class="dbm-modal-close-btn dbm-btn dbm-btn-primary">Готово</button></div></div>`);
    
    // Динамический вызов обработчиков событий
     const eventsFunction = this[`add${category.charAt(0).toUpperCase() + category.slice(1)}EventListeners`];
     if (typeof eventsFunction === 'function') {
        // ИСПРАВЛЕНО: .call(this) сохраняет правильный контекст и здесь
        eventsFunction.call(this);
     } else {
        this.addGenericModalEventListeners(`config.${category}`);
     }
},
        // --- HELPERS ---

// НОВАЯ ФУНКЦИЯ для инициализации всех колорпикеров в модальном окне
initializeColorPickers() {
    const modal = SuperPanelManager.overlay;
    modal.querySelectorAll('.dbm-color-picker-wrapper').forEach(wrapper => {
        const textInput = wrapper.querySelector('input[type="text"]');
        const preview = wrapper.querySelector('.dbm-color-picker-preview');
        const nativePicker = wrapper.querySelector('input[type="color"]');

        if (!textInput || !preview || !nativePicker) return;

        // Открываем нативный колорпикер по клику на кружок
        preview.addEventListener('click', () => nativePicker.click());

        // Обновляем текстовое поле и кружок, когда меняется цвет в нативном пикере
        nativePicker.addEventListener('input', () => {
            const newColor = nativePicker.value;
            textInput.value = newColor;
            preview.style.backgroundColor = newColor;
            // Имитируем событие 'input' на текстовом поле, чтобы сработал наш generic-обработчик и сохранил значение
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Обновляем кружок и нативный пикер, когда меняется текст в поле (например, вставляется вручную)
        textInput.addEventListener('input', () => {
            const newColor = textInput.value;
            preview.style.backgroundColor = newColor;
            nativePicker.value = newColor;
        });
    });
},

addGenericModalEventListeners() {
    const modal = SuperPanelManager.overlay;
    modal.querySelectorAll('[data-config]').forEach(input => {
        input.addEventListener('input', (e) => {
            const keyPath = e.target.dataset.config;
            if (!keyPath) return; // Защита от случайных инпутов без data-config

            const value = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value);
            const keys = keyPath.split('.');
            
            let current = this.allSliders[this.activeSliderKey].config;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]] = current[keys[i]] || {};
            }
            current[keys[keys.length - 1]] = value;
            
            this.saveSliders();
            
            // Определяем, нужно ли полное пересоздание слайдера.
            // Критическими являются опции, меняющие структуру DOM или требующие перерасчета.
            const criticalOptions = [
                'general.loop', 
                'navigation.enabled', 
                'navigation.position',
                'pagination.enabled'
            ];
            const forceReinit = criticalOptions.includes(keyPath);
            
            this.updatePreview(forceReinit);
        });
    });
    modal.querySelectorAll('.dbm-modal-close-btn').forEach(btn => btn.onclick = () => SuperPanelManager.hideModal());
},

// --- MODAL RENDERERS & EVENT LISTENERS ---

// 1. Генератор HTML для модального окна "Основные"
// 1. Генератор HTML для модального окна "Основные"
renderGeneralModal() {
    const config = this.allSliders[this.activeSliderKey].config.general;
    return `
        <div class="dbm-form-group">
            <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>Обрезать контент (overflow: hidden)</span>
                <label class="dbm-switch">
                    <input type="checkbox" data-config="general.clipContent" ${config.clipContent ? 'checked' : ''}>
                    <span class="dbm-slider"></span>
                </label>
            </label>
        </div>
        <div class="dbm-form-group">
            <label>Скорость перехода (мс)</label>
            <input type="number" data-config="general.speed" value="${config.speed}">
        </div>
        <div class="dbm-form-group">
            <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>Бесконечный цикл</span>
                <label class="dbm-switch">
                    <input type="checkbox" data-config="general.loop" ${config.loop ? 'checked' : ''}>
                    <span class="dbm-slider"></span>
                </label>
            </label>
        </div>
        <div class="dbm-subsection">
            <h3>Автопрокрутка</h3>
            <div class="dbm-form-group">
                <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span>Включить</span>
                    <label class="dbm-switch">
                        <input type="checkbox" data-config="general.autoplay" ${config.autoplay ? 'checked' : ''}>
                        <span class="dbm-slider"></span>
                    </label>
                </label>
            </div>
            <div class="dbm-form-group">
                <label>Задержка (мс)</label>
                <input type="number" data-config="general.autoplayDelay" value="${config.autoplayDelay}">
            </div>
        </div>
    `;
},

// 2. Генератор HTML для модального окна "Ширина"
renderWidthModal() {
    const config = this.allSliders[this.activeSliderKey].config;
    // Собираем все брейкпоинты из раздела "Адаптивность"
    const breakpoints = { 'default': 'По умолчанию', ...config.responsive.breakpoints };

    let tabsHTML = '';
    let contentHTML = '';

    Object.keys(breakpoints).forEach((bpKey, index) => {
        const title = bpKey === 'default' ? 'По умолчанию' : `до ${bpKey}px`;
        const isActive = index === 0;
        tabsHTML += `<button class="dbm-tab-button ${isActive ? 'active' : ''}" data-tab="${bpKey}">${title}</button>`;
        
        // Получаем настройки ширины для текущего брейкпоинта, или используем дефолтные
        const widthSetting = config.width.breakpoints[bpKey] || config.width.default;
        
        contentHTML += `
            <div class="dbm-tab-content ${isActive ? 'active' : ''}" data-tab-content="${bpKey}">
                <div class="dbm-form-group">
                    <label>Тип ширины</label>
                    <select data-config="width.breakpoints.${bpKey}.type" data-bp="${bpKey}">
                        <option value="flexible" ${widthSetting.type === 'flexible' ? 'selected' : ''}>Гибкая (отступы)</option>
                        <option value="fixed" ${widthSetting.type === 'fixed' ? 'selected' : ''}>Фиксированная</option>
                    </select>
                </div>
                <div class="dbm-width-options">
                    <div class="dbm-form-group" style="display: ${widthSetting.type === 'flexible' ? 'block' : 'none'};" data-width-type="flexible-${bpKey}">
                        <label>Боковые отступы (px)</label>
                        <input type="number" data-config="width.breakpoints.${bpKey}.sidePadding" value="${widthSetting.sidePadding || 0}">
                    </div>
                    <div class="dbm-form-group" style="display: ${widthSetting.type === 'fixed' ? 'block' : 'none'};" data-width-type="fixed-${bpKey}">
                        <label>Ширина (px)</label>
                        <input type="number" data-config="width.breakpoints.${bpKey}.value" value="${widthSetting.value || 1200}">
                    </div>
                </div>
            </div>`;
    });

    return `<div class="dbm-tabs-container"><div class="dbm-tab-navigation">${tabsHTML}</div><div class="dbm-tabs-content">${contentHTML}</div></div>`;
},

// 3. Генератор HTML для модального окна "Навигация"
// 3. Генератор HTML для модального окна "Навигация"
renderNavigationModal() {
    const config = this.allSliders[this.activeSliderKey].config.navigation;
    return `
        <div class="dbm-form-group">
            <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>Включить навигацию</span>
                <label class="dbm-switch">
                    <input type="checkbox" data-config="navigation.enabled" ${config.enabled ? 'checked' : ''}>
                    <span class="dbm-slider"></span>
                </label>
            </label>
        </div>
        <div class="dbm-subsection">
            <h3>Внешний вид</h3>
            <div class="dbm-form-group">
                <label>URL стрелки "Назад"</label>
                <input type="text" data-config="navigation.prevElUrl" value="${config.prevElUrl || ''}" placeholder="https://...">
            </div>
            <div class="dbm-form-group">
                <label>URL стрелки "Вперед"</label>
                <input type="text" data-config="navigation.nextElUrl" value="${config.nextElUrl || ''}" placeholder="https://...">
            </div>
        </div>
        <div class="dbm-subsection">
            <h3>Эффекты</h3>
            <div class="dbm-form-group">
                <label>Масштаб при наведении</label>
                <input type="number" step="0.05" data-config="navigation.hoverScale" value="${config.hoverScale || 1.0}">
            </div>
        </div>
        <div class="dbm-subsection">
            <h3>Расположение</h3>
            <div class="dbm-form-group">
                <label>Позиционирование</label>
                <select data-config="navigation.position">
                    <option value="absolute" ${config.position === 'absolute' ? 'selected' : ''}>Абсолютное (внутри слайдера)</option>
                    <option value="relative" ${config.position === 'relative' ? 'selected' : ''}>Относительное (снаружи)</option>
                </select>
            </div>
            <div id="dbm-nav-relative-options" style="display: ${config.position === 'relative' ? 'block' : 'none'};">
                <div class="dbm-form-group">
                    <label>Место</label>
                    <select data-config="navigation.location">
                        <option value="top" ${config.location === 'top' ? 'selected' : ''}>Сверху</option>
                        <option value="bottom" ${config.location === 'bottom' ? 'selected' : ''}>Снизу</option>
                    </select>
                </div>
                <div class="dbm-form-group">
                    <label>Выравнивание</label>
                    <select data-config="navigation.align">
                        <option value="between" ${config.align === 'between' ? 'selected' : ''}>По краям</option>
                        <option value="start" ${config.align === 'start' ? 'selected' : ''}>Слева</option>
                        <option value="center" ${config.align === 'center' ? 'selected' : ''}>По центру</option>
                        <option value="end" ${config.align === 'end' ? 'selected' : ''}>Справа</option>
                    </select>
                </div>
            </div>
        </div>
    `;
},

// 4. Генератор HTML для модального окна "Пагинация"
renderPaginationModal() {
    const config = this.allSliders[this.activeSliderKey].config.pagination;
    const bullets = config.bullets || {};
    const progressbar = config.progressbar || {};

    // Вспомогательная функция для создания HTML-кода колорпикера
    const createColorPickerHTML = (label, dataConfig, value) => `
        <div class="dbm-form-group">
            <label>${label}</label>
            <div class="dbm-color-picker-wrapper">
                <input type="text" data-config="${dataConfig}" value="${value}">
                <div class="dbm-color-picker-preview" style="background-color: ${value};"></div>
                <input type="color" class="dbm-color-picker-native" value="${value}">
            </div>
        </div>
    `;

    return `
        <div class="dbm-form-group">
            <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>Включить пагинацию</span>
                <label class="dbm-switch">
                    <input type="checkbox" data-config="pagination.enabled" ${config.enabled ? 'checked' : ''}>
                    <span class="dbm-slider"></span>
                </label>
            </label>
        </div>
        <div class="dbm-form-group"><label>Тип пагинации</label><select data-config="pagination.type">
            <option value="bullets" ${config.type === 'bullets' ? 'selected' : ''}>Точки (Bullets)</option>
            <option value="fraction" ${config.type === 'fraction' ? 'selected' : ''}>Дробь (Fraction)</option>
            <option value="progressbar" ${config.type === 'progressbar' ? 'selected' : ''}>Прогресс-бар</option>
        </select></div>
        <div class="dbm-form-group"><label>Выравнивание</label><select data-config="pagination.align">
            <option value="start" ${config.align === 'start' ? 'selected' : ''}>Слева</option>
            <option value="center" ${config.align === 'center' ? 'selected' : ''}>По центру</option>
            <option value="end" ${config.align === 'end' ? 'selected' : ''}>Справа</option>
        </select></div>
        
        <div id="pagination-settings-bullets" style="display: ${config.type === 'bullets' ? 'block' : 'none'};">
            <div class="dbm-subsection"><h3>Стилизация (Bullets)</h3>
                <div class="dbm-grid-2">
                    <div class="dbm-form-group"><label>Ширина</label><input type="text" data-config="pagination.bullets.width" value="${bullets.width || '25px'}"></div>
                    <div class="dbm-form-group"><label>Высота</label><input type="text" data-config="pagination.bullets.height" value="${bullets.height || '5px'}"></div>
                </div>
                <div class="dbm-grid-2">
                    <div class="dbm-form-group"><label>Ширина (актив)</label><input type="text" data-config="pagination.bullets.activeWidth" value="${bullets.activeWidth || '35px'}"></div>
                    <div class="dbm-form-group"><label>Высота (актив)</label><input type="text" data-config="pagination.bullets.activeHeight" value="${bullets.activeHeight || '5px'}"></div>
                </div>
                <div class="dbm-grid-2">
                    ${createColorPickerHTML('Цвет', 'pagination.bullets.bgColor', bullets.bgColor || '#e7e7e7')}
                    ${createColorPickerHTML('Цвет (актив)', 'pagination.bullets.activeBgColor', bullets.activeBgColor || '#23272c')}
                </div>
                <div class="dbm-grid-2">
                    <div class="dbm-form-group"><label>Радиус</label><input type="text" data-config="pagination.bullets.radius" value="${bullets.radius || '10px'}"></div>
                    <div class="dbm-form-group"><label>Отступ</label><input type="text" data-config="pagination.bullets.gap" value="${bullets.gap || '5px'}"></div>
                </div>
            </div>
        </div>
        <div id="pagination-settings-progressbar" style="display: ${config.type === 'progressbar' ? 'block' : 'none'};">
             <div class="dbm-subsection"><h3>Стилизация (Progressbar)</h3>
                <div class="dbm-form-group"><label>Высота</label><input type="text" data-config="pagination.progressbar.height" value="${progressbar.height || '4px'}"></div>
                <div class="dbm-grid-2">
                    ${createColorPickerHTML('Цвет фона', 'pagination.progressbar.bgColor', progressbar.bgColor || '#e0e0e0')}
                    ${createColorPickerHTML('Цвет заливки', 'pagination.progressbar.fillColor', progressbar.fillColor || '#23272c')}
                </div>
                <div class="dbm-form-group"><label>Радиус</label><input type="text" data-config="pagination.progressbar.radius" value="${progressbar.radius || '4px'}"></div>
             </div>
        </div>
    `;
},

// 5. Генератор HTML для модального окна "Адаптивность"
renderResponsiveModal() {
    const config = this.allSliders[this.activeSliderKey].config.responsive;
    const sortedBreakpoints = Object.keys(config.breakpoints).sort((a, b) => b - a);

    const breakpoints = { 'default': 'По умолчанию' };
    sortedBreakpoints.forEach(bp => {
        breakpoints[bp] = `до ${bp}px`;
    });

    let tabsHTML = '';
    let contentHTML = '';

    Object.entries(breakpoints).forEach(([bpKey, title], index) => {
        const isActive = index === 0;
        const isDefault = bpKey === 'default';

        // ИСПРАВЛЕНО: Используем <button> с правильными классами для табов
        tabsHTML += `
            <button class="dbm-tab-button ${isActive ? 'active' : ''}" data-tab="${bpKey}">
                ${title}
                ${!isDefault ? `<span class="dbm-delete-bp-btn" data-bp="${bpKey}">&times;</span>` : ''}
            </button>`;
        
        const settings = isDefault ? config.default : config.breakpoints[bpKey];
        contentHTML += `
            <div class="dbm-tab-content ${isActive ? 'active' : ''}" data-tab-content="${bpKey}">
                <div class="dbm-grid-3">
                    <div class="dbm-form-group"><label>Слайдов видно</label><input type="number" step="0.1" data-config="responsive.${isDefault ? 'default' : 'breakpoints.'+bpKey}.slidesPerView" value="${settings.slidesPerView}"></div>
                    <div class="dbm-form-group"><label>Листать по</label><input type="number" data-config="responsive.${isDefault ? 'default' : 'breakpoints.'+bpKey}.slidesPerGroup" value="${settings.slidesPerGroup}"></div>
                    <div class="dbm-form-group"><label>Отступ (px)</label><input type="number" data-config="responsive.${isDefault ? 'default' : 'breakpoints.'+bpKey}.spaceBetween" value="${settings.spaceBetween}"></div>
                </div>
                <div class="dbm-subsection"><h3>Элементы управления</h3>
                    <div class="dbm-form-group">
                        <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span>Навигация</span>
                            <label class="dbm-switch">
                                <input type="checkbox" data-config="responsive.${isDefault ? 'default' : 'breakpoints.'+bpKey}.navigation" ${settings.navigation ? 'checked' : ''}>
                                <span class="dbm-slider"></span>
                            </label>
                        </label>
                    </div>
                    <div class="dbm-form-group">
                        <label style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span>Пагинация</span>
                            <label class="dbm-switch">
                                <input type="checkbox" data-config="responsive.${isDefault ? 'default' : 'breakpoints.'+bpKey}.pagination" ${settings.pagination ? 'checked' : ''}>
                                <span class="dbm-slider"></span>
                            </label>
                        </label>
                    </div>
                </div>
            </div>`;
    });
    
    // Блок добавления нового брейкпоинта
    tabsHTML += `
        <div class="dbm-tab-button dbm-add-bp-tab" data-tab="add-new-bp">
            <span class="plus-icon">+</span>
            <div class="dbm-add-bp-form" style="display: none;">
                <input type="number" placeholder="992" class="dbm-new-bp-input">
                <button class="dbm-confirm-bp-btn dbm-btn dbm-btn-sm dbm-btn-primary">✔</button>
            </div>
        </div>`;

    return `<div class="dbm-tabs-container"><div class="dbm-tab-navigation">${tabsHTML}</div><div class="dbm-tabs-content">${contentHTML}</div></div>`;
},

// --- MODAL EVENT LISTENERS ---

// 1. Обработчик событий для модального окна "Основные"
addGeneralEventListeners() {
    this.addGenericModalEventListeners();
},

// 2. Обработчик событий для модального окна "Ширина"
addWidthEventListeners() {
    this.addGenericModalEventListeners();
    const modal = SuperPanelManager.overlay;

    // Добавляем небольшую задержку для гарантии загрузки DOM
    setTimeout(() => {
        // Логика переключения табов
        modal.querySelectorAll('.dbm-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // Убираем активный класс со всех табов и контента
                modal.querySelectorAll('.dbm-tab-button').forEach(btn => btn.classList.remove('active'));
                modal.querySelectorAll('.dbm-tab-content').forEach(content => content.classList.remove('active'));
                
                // Добавляем активный класс к выбранному табу
                button.classList.add('active');
                
                // Показываем соответствующий контент
                const targetContent = modal.querySelector(`.dbm-tab-content[data-tab-content="${button.dataset.tab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                console.log('[DEBUG] Переключен таб ширины:', button.dataset.tab);
            });
        });
    }, 10);

    // Логика переключения типа ширины (гибкая/фиксированная)
    modal.querySelectorAll('select[data-config*="width.breakpoints"]').forEach(select => {
        select.addEventListener('change', (e) => {
            const type = e.target.value;
            const bp = e.target.dataset.bp;
            const content = e.target.closest('.dbm-tab-content');
            content.querySelector(`[data-width-type="flexible-${bp}"]`).style.display = type === 'flexible' ? 'block' : 'none';
            content.querySelector(`[data-width-type="fixed-${bp}"]`).style.display = type === 'fixed' ? 'block' : 'none';
        });
        });
    },
    
// 3. Обработчик событий для модального окна "Навигация"
addNavigationEventListeners() {
    this.addGenericModalEventListeners();
    const modal = SuperPanelManager.overlay;
    const positionSelect = modal.querySelector('select[data-config="navigation.position"]');
    
    // Показываем/скрываем настройки для относительного позиционирования
    positionSelect?.addEventListener('change', () => {
        modal.querySelector('#dbm-nav-relative-options').style.display = positionSelect.value === 'relative' ? 'block' : 'none';
    });
},

// 4. Обработчик событий для модального окна "Пагинация"
addPaginationEventListeners() {
    this.addGenericModalEventListeners();
    this.initializeColorPickers(); // <--- ДОБАВЛЕНО: Инициализация колорпикеров
    const modal = SuperPanelManager.overlay;
    const typeSelect = modal.querySelector('select[data-config="pagination.type"]');

    // Показываем/скрываем настройки для разных типов пагинации
    typeSelect?.addEventListener('change', () => {
        const type = typeSelect.value;
        modal.querySelector('#pagination-settings-bullets').style.display = type === 'bullets' ? 'block' : 'none';
        modal.querySelector('#pagination-settings-progressbar').style.display = type === 'progressbar' ? 'block' : 'none';
    });
},

// 5. Обработчик событий для модального окна "Адаптивность"
addResponsiveEventListeners() {
    this.addGenericModalEventListeners();
    const modal = SuperPanelManager.overlay;
    const config = this.allSliders[this.activeSliderKey].config;

    // Добавляем небольшую задержку для гарантии загрузки DOM
    setTimeout(() => {
        // ИСПРАВЛЕНО: Логика переключения табов теперь работает с .dbm-tab-button
        modal.querySelectorAll('.dbm-tab-button:not(.dbm-add-bp-tab)').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.target.classList.contains('dbm-delete-bp-btn')) return;
                
                // Скрываем форму добавления, если она была открыта
                const addBpForm = modal.querySelector('.dbm-add-bp-form');
                if (addBpForm) addBpForm.style.display = 'none';
                const plusIcon = modal.querySelector('.plus-icon');
                if (plusIcon) plusIcon.style.display = 'inline';

                // Убираем активный класс со всех табов и контента
                modal.querySelectorAll('.dbm-tab-button').forEach(btn => btn.classList.remove('active'));
                modal.querySelectorAll('.dbm-tab-content').forEach(content => content.classList.remove('active'));
                
                // Добавляем активный класс к выбранному табу
                button.classList.add('active');
                
                // Показываем соответствующий контент
                const targetContent = modal.querySelector(`.dbm-tab-content[data-tab-content="${button.dataset.tab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                console.log('[DEBUG] Переключен таб:', button.dataset.tab);
            });
        });
    }, 10);

    // Показ формы добавления нового брейкпоинта
    const addBpTab = modal.querySelector('.dbm-add-bp-tab');
    const addBpForm = modal.querySelector('.dbm-add-bp-form');
    const plusIcon = modal.querySelector('.plus-icon');
    const newBpInput = modal.querySelector('.dbm-new-bp-input');
    const confirmBtn = modal.querySelector('.dbm-confirm-bp-btn');

    addBpTab.addEventListener('click', (e) => {
        if (confirmBtn && (e.target === confirmBtn || newBpInput.contains(e.target))) return;
        if(plusIcon) plusIcon.style.display = 'none';
        if(addBpForm) addBpForm.style.display = 'flex';
        if(newBpInput) newBpInput.focus();
    });

    // Подтверждение и создание нового брейкпоинта
    confirmBtn?.addEventListener('click', () => {
        const newBreakpoint = newBpInput.value;
        if (newBreakpoint && !isNaN(newBreakpoint) && !config.responsive.breakpoints[newBreakpoint]) {
            const breakpoints = Object.keys(config.responsive.breakpoints).map(Number).sort((a, b) => a - b);
            const baseSettingsKey = breakpoints.find(bp => bp > newBreakpoint) || 'default';
            const baseSettings = baseSettingsKey === 'default' ? config.responsive.default : config.responsive.breakpoints[baseSettingsKey];
            
            config.responsive.breakpoints[newBreakpoint] = JSON.parse(JSON.stringify(baseSettings));
            this.saveSliders();
            this.showSettingsModal('responsive');
        } else if (newBreakpoint) {
            alert('Неверное значение или такой брейкпоинт уже существует.');
        }
    });
    
    // Удаление брейкпоинта
    modal.querySelectorAll('.dbm-delete-bp-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const bpToDelete = e.target.dataset.bp;
            if (confirm(`Вы уверены, что хотите удалить брейкпоинт ${bpToDelete}px?`)) {
                delete config.responsive.breakpoints[bpToDelete];
                if (config.width.breakpoints[bpToDelete]) {
                    delete config.width.breakpoints[bpToDelete];
                }
                this.saveSliders();
                this.showSettingsModal('responsive');
            }
        });
    });
},

        
        // --- CODE GENERATION ---
        
        generateSliderCode() {
            if (!this.activeSliderKey || !this.allSliders[this.activeSliderKey]) {
                console.error('Нет активного слайдера для генерации кода');
                return;
            }
            
            const sliderData = this.allSliders[this.activeSliderKey];
            const config = sliderData.config;
            const useBlockPrefix = config.useBlockPrefix !== false;
            
            // Определяем селекторы в зависимости от настройки
            const containerSelector = useBlockPrefix ? this.activeSliderKey : this.cleanSelectorForDisplay(this.activeSliderKey);
            const slideSelector = useBlockPrefix ? sliderData.slideSelector : this.cleanSelectorForDisplay(sliderData.slideSelector);
            
            // Генерируем уникальные CSS классы
            const sliderId = `slider-${Date.now()}`;
            const sliderClass = `swiper-${sliderId}`;
            
            const htmlCode = `<!-- HTML для слайдера -->
<div class="${sliderClass}">
    <div class="swiper-wrapper">
        <!-- Слайды будут автоматически найдены по селектору: ${slideSelector} -->
    </div>
    
    ${config.navigation ? `<!-- Навигация -->
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>` : ''}
    
    ${config.pagination ? `<!-- Пагинация -->
    <div class="swiper-pagination"></div>` : ''}
</div>`;

            const cssCode = `/* CSS для слайдера */
.${sliderClass} {
    width: 100%;
    height: 400px; /* Настройте по необходимости */
}

.${sliderClass} .swiper-slide {
    display: flex;
    align-items: center;
    justify-content: center;
}

${config.navigation ? `.${sliderClass} .swiper-button-next,
.${sliderClass} .swiper-button-prev {
    color: #007bff;
}` : ''}

${config.pagination ? `.${sliderClass} .swiper-pagination-bullet {
    background: #007bff;
}` : ''}`;

            const jsCode = `// JavaScript для инициализации слайдера
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Swiper
    const swiper = new Swiper('${containerSelector} .${sliderClass}', {
        // Основные настройки
        slidesPerView: ${config.slidesPerView || 1},
        spaceBetween: ${config.spaceBetween || 0},
        loop: ${config.loop || false},
        
        // Автопрокрутка
        ${config.autoplay ? `autoplay: {
            delay: ${config.autoplayDelay || 3000},
            disableOnInteraction: false,
        },` : ''}
        
        // Навигация
        ${config.navigation ? `navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },` : ''}
        
        // Пагинация
        ${config.pagination ? `pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },` : ''}
        
        // Адаптивность
        breakpoints: {
            ${config.breakpoints ? Object.entries(config.breakpoints).map(([breakpoint, settings]) => 
                `${breakpoint}: {
                    slidesPerView: ${settings.slidesPerView || 1},
                    spaceBetween: ${settings.spaceBetween || 0}
                }`
            ).join(',\n            ') : '768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }'}
        }
    });
});`;

            const fullCode = `${htmlCode}\n\n${cssCode}\n\n${jsCode}`;
            this.showCodeModal(fullCode);
        },

        showCodeModal(code) {
             const codeHTML = `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
            SuperPanelManager.showModal(`<div class="dbm-modal-content"><div class="dbm-modal-header"><h4>Код слайдера</h4><button class="dbm-modal-close-btn">&times;</button></div><div class="dbm-modal-body">${codeHTML}</div><div class="dbm-modal-footer"><button id="dbm-copy-code-modal-btn">Копировать код</button></div></div>`);
            
            document.getElementById('dbm-copy-code-modal-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(code).then(() => { /* ... */ });
            });
            document.querySelector('.dbm-modal-close-btn')?.addEventListener('click', () => SuperPanelManager.hideModal());
        },
        
        // --- HELPERS ---
        loadScript(src) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const script = document.createElement('script');
                script.src = src; script.onload = resolve; script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        loadStyles(href) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`link[href="${href}"]`)) return resolve();
                const link = document.createElement('link');
                link.rel = 'stylesheet'; link.href = href; link.onload = resolve; link.onerror = reject;
                document.head.appendChild(link);
            });
        }
    };
    
    // Вспомогательные функции для рендера и ивентов модалок будут здесь...
}

window.addEventListener('dbmInitSolution', (event) => {
    if (event.detail && event.detail.name === 'dbmSwiperArchitect') {
        window.dbmSwiperArchitect.init();
    }
});

document.addEventListener('dbmPanelFullClose', () => {
    if (window.dbmSwiperArchitect) {
        window.dbmSwiperArchitect.cleanupPreview();
    }
});

