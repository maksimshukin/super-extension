/**
 * =================================================================================
 * SUPER SLIDER V4 - Финальная версия с сохранением, полными настройками и исправлениями
 * =================================================================================
 */
if (!window.dbmSwiperArchitect) {
    window.dbmSwiperArchitect = {
        // --- STATE & CONFIG ---
        allSliders: {},
        activeSliderKey: null,
        swiperInstance: null,
        originalContainerHTML: null,
        STORAGE_KEY: 'superSliderArchitect_v1',

        sliderConfig: {
            speed: 400,
            loop: false,
            navigation: true,
            pagination: true,
            "pagination.type": "bullets",
            "pagination.clickable": true,
            autoplay: false,
            "autoplay.delay": 3000,
            "autoplay.disableOnInteraction": true,
            effect: "slide",
            effectFade: { crossFade: true },
            effectCube: { shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 },
            effectCoverflow: { rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true },
            effectFlip: { slideShadows: true, limitRotation: true },
            slidesPerView: 3,
            slidesPerGroup: 1,
            spaceBetween: 20,
            centeredSlides: false,
            freeMode: false,
            breakpoints: {
                320: { slidesPerView: 1, spaceBetween: 10 },
                768: { slidesPerView: 2, spaceBetween: 15 },
                1024: { slidesPerView: 3, spaceBetween: 20 }
            }
        },

        init() {
            console.log('[SwiperArchitect] 🚀 INIT V4: Инициализация Super Slider...');
            if (typeof SuperPanelManager === 'undefined' || typeof SuperSelectionManager === 'undefined') {
                console.error("[SwiperArchitect] ❌ Critical Error: Managers not found!");
                return;
            }
            this.loadSliders(); // Загружаем сохраненные слайдеры
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
            const { slideSelector } = sliderData;
            return `
                <div class="dbm-effect-item-card" data-slider-key="${key}">
                    <div class="dbm-effect-item-header">
                        <div class="dbm-effect-item-info">
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
            return `<div class="dbm-header-main-row" style="flex-direction: column; align-items: flex-start; gap: 8px; background-color: white; padding: 12px; border-radius: 16px;">
                        <div class="dbm-form-group" style="width: 100%; margin:0;">
                            <label>Контейнер:</label>
                            <div class="dbm-editable-selector" data-selector-type="container" title="Нажмите, чтобы изменить">${key}</div>
                        </div>
                        <div class="dbm-form-group" style="width: 100%; margin:0;">
                            <label>Слайд:</label>
                            <div class="dbm-editable-selector" data-selector-type="slide" title="Нажмите, чтобы изменить">${data.slideSelector}</div>
                        </div>
                    </div>`;
        },

        renderEditorContent() {
            const categories = {
                general: 'Основные',
                layout: 'Внешний вид',
                navigation: 'Навигация',
                pagination: 'Пагинация',
                effects: 'Эффекты',
                autoplay: 'Автопрокрутка',
            };
            return `<div class="dbm-subsection"><h3>Настройки слайдера</h3><div class="dbm-controls-grid">${Object.entries(categories).map(([key, title]) => `<div class="dbm-property-group-card" data-category="${key}"><div class="dbm-card-header"><h4>${title}</h4></div></div>`).join('')}</div></div>`;
        },
        
        addManagerEventListeners() {
            const createBtn = document.getElementById('dbm-create-new-slider-btn');
            if (createBtn) createBtn.addEventListener('click', () => this.startCardSelection());

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
            document.getElementById('dbm-generate-slider-btn').addEventListener('click', () => this.generateSliderCode());
            document.querySelectorAll('.dbm-property-group-card').forEach(card => card.addEventListener('click', () => this.showSettingsModal(card.dataset.category)));
            document.querySelectorAll('.dbm-editable-selector').forEach(el => el.addEventListener('click', () => this.reselectSelector(el.dataset.selectorType)));
        },
        
        startCardSelection() {
            this.cleanupPreview();
            SuperPanelManager.close();
            SuperSelectionManager.startSelection({
                onSelect: (element, selector) => {
                    const parentContainer = this.findParentContainer(element, selector);
                    if (!parentContainer) { alert('Не удалось найти родительский контейнер с несколькими такими элементами.'); SuperPanelManager.open(); return; }
                    const parentSelector = SuperSelectionManager.getUniqueSelector(parentContainer);
                    this.allSliders[parentSelector] = { slideSelector: selector, config: JSON.parse(JSON.stringify(this.sliderConfig)) };
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
                    } else { oldSliderData.slideSelector = selector; }
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

        async initPreview() {
            console.log('[SwiperArchitect] PREVIEW: Инициализация предпросмотра...');
            try {
                if (typeof Swiper === 'undefined') await this.loadScript('https://unpkg.com/swiper/swiper-bundle.min.js');
                if (!document.querySelector('link[href="https://unpkg.com/swiper/swiper-bundle.min.css"]')) await this.loadStyles('https://unpkg.com/swiper/swiper-bundle.min.css');
            } catch (error) { console.error('[SwiperArchitect] Ошибка загрузки Swiper:', error); return; }

            const container = document.querySelector(this.activeSliderKey);
            if (!container) return;

            if (this.originalContainerHTML === null) this.originalContainerHTML = container.innerHTML;
            
            this.prepareDOMForSwiper(container);
            this.swiperInstance = new Swiper(this.activeSliderKey, this.buildSwiperConfig());
            console.log('[SwiperArchitect] PREVIEW: Swiper инициализирован.', this.swiperInstance);
        },

        updatePreview() {
            if (!this.swiperInstance || this.swiperInstance.destroyed) { this.initPreview(); return; }
            console.log('[SwiperArchitect] PREVIEW: Обновление предпросмотра...');
            Object.assign(this.swiperInstance.params, this.buildSwiperConfig());
            this.swiperInstance.update();
            console.log('[SwiperArchitect] PREVIEW: Swiper обновлен.');
        },

        cleanupPreview() {
            if (this.swiperInstance && !this.swiperInstance.destroyed) {
                this.swiperInstance.destroy(true, true);
                this.swiperInstance = null;
            }
            if(this.activeSliderKey){
                const container = document.querySelector(this.activeSliderKey);
                if (container && this.originalContainerHTML !== null) {
                    container.innerHTML = this.originalContainerHTML;
                    container.className = container.className.replace(/swiper-container\S*/g, '').trim();
                }
            }
            this.originalContainerHTML = null;
            console.log('[SwiperArchitect] PREVIEW: Предпросмотр очищен.');
        },

        prepareDOMForSwiper(container) {
            const sliderData = this.allSliders[this.activeSliderKey];
            if (!sliderData) return;
            container.innerHTML = this.originalContainerHTML;
            container.classList.add('swiper-container');
            const wrapper = document.createElement('div');
            wrapper.className = 'swiper-wrapper';
            const slides = container.querySelectorAll(sliderData.slideSelector);
            slides.forEach(slide => { slide.classList.add('swiper-slide'); wrapper.appendChild(slide); });
            container.innerHTML = '';
            container.appendChild(wrapper);
            if (sliderData.config.navigation) container.insertAdjacentHTML('beforeend', '<div class="swiper-button-next"></div><div class="swiper-button-prev"></div>');
            if (sliderData.config.pagination) container.insertAdjacentHTML('beforeend', '<div class="swiper-pagination"></div>');
        },

        buildSwiperConfig() {
            const config = { ...this.allSliders[this.activeSliderKey].config };
            const finalConfig = {};
            for (const key in config) {
                if (key.includes('.')) {
                    const [mainKey, subKey] = key.split('.');
                    if (!finalConfig[mainKey] || typeof finalConfig[mainKey] !== 'object') finalConfig[mainKey] = {};
                    finalConfig[mainKey][subKey] = config[key];
                } else if(key.startsWith('effect')) {
                    // ignore effect settings here
                }
                else { finalConfig[key] = config[key]; }
            }

            if (finalConfig.navigation) finalConfig.navigation = { nextEl: `${this.activeSliderKey} .swiper-button-next`, prevEl: `${this.activeSliderKey} .swiper-button-prev` };
            else finalConfig.navigation = false;
            
            if (finalConfig.pagination) {
                if (typeof finalConfig.pagination !== 'object') finalConfig.pagination = {};
                finalConfig.pagination.el = `${this.activeSliderKey} .swiper-pagination`;
            } else { finalConfig.pagination = false; }

            if (finalConfig.autoplay) {
                if (typeof finalConfig.autoplay !== 'object') finalConfig.autoplay = {};
                finalConfig.autoplay.delay = config['autoplay.delay'] || 3000;
                finalConfig.autoplay.disableOnInteraction = config['autoplay.disableOnInteraction'];
            } else { finalConfig.autoplay = false; }
            
            const effect = finalConfig.effect;
            if(effect && effect !== 'slide' && config[`effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`]) {
                finalConfig[`${effect}Effect`] = config[`effect${effect.charAt(0).toUpperCase() + effect.slice(1)}`];
            }

            return finalConfig;
        },
        
        showSettingsModal(category) {
            const config = this.allSliders[this.activeSliderKey].config;
            let modalBodyHTML = '';

            switch (category) {
                 case 'general':
                    modalBodyHTML = `
                        <div class="dbm-form-group"><label>Скорость (мс)</label><input type="number" data-config="speed" value="${config.speed || 400}"></div>
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Бесконечный луп</span><input type="checkbox" data-config="loop" ${config.loop ? 'checked' : ''}><span class="dbm-slider"></span></label></div>
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Центрировать слайды</span><input type="checkbox" data-config="centeredSlides" ${config.centeredSlides ? 'checked' : ''}><span class="dbm-slider"></span></label></div>
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Свободный режим</span><input type="checkbox" data-config="freeMode" ${config.freeMode ? 'checked' : ''}><span class="dbm-slider"></span></label></div>`;
                    break;
                case 'layout':
                    modalBodyHTML = `
                        <div class="dbm-grid-2">
                            <div class="dbm-form-group"><label>Отступ (px)</label><input type="number" data-config="spaceBetween" value="${config.spaceBetween || 20}"></div>
                            <div class="dbm-form-group"><label>Слайдов в группе</label><input type="number" data-config="slidesPerGroup" value="${config.slidesPerGroup || 1}"></div>
                        </div>
                        <div class="dbm-subsection"><h3>Адаптивность (кол-во слайдов)</h3>
                            <div class="dbm-grid-3">
                                <div class="dbm-form-group"><label>📱 (до 768px):</label><input type="number" data-config="breakpoints.320.slidesPerView" value="${config.breakpoints[320]?.slidesPerView || 1}"></div>
                                <div class="dbm-form-group"><label>💻 (до 1024px):</label><input type="number" data-config="breakpoints.768.slidesPerView" value="${config.breakpoints[768]?.slidesPerView || 2}"></div>
                                <div class="dbm-form-group"><label>🖥️ (1024px+):</label><input type="number" data-config="slidesPerView" value="${config.slidesPerView || 3}"></div>
                            </div>
                        </div>`;
                    break;
                case 'navigation':
                     modalBodyHTML = `<div class="dbm-form-group"><label class="dbm-switch as-label"><span>Включить стрелки</span><input type="checkbox" data-config="navigation" ${config.navigation ? 'checked' : ''}><span class="dbm-slider"></span></label></div>`;
                    break;
                case 'pagination':
                    modalBodyHTML = `
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Включить пагинацию</span><input type="checkbox" data-config="pagination" ${config.pagination ? 'checked' : ''}><span class="dbm-slider"></span></label></div>
                        <div class="dbm-form-group"><label>Тип пагинации</label><select data-config="pagination.type"><option value="bullets" ${config['pagination.type'] === 'bullets' ? 'selected' : ''}>Точки</option><option value="fraction" ${config['pagination.type'] === 'fraction' ? 'selected' : ''}>Дробь (1 / 5)</option><option value="progressbar" ${config['pagination.type'] === 'progressbar' ? 'selected' : ''}>Прогресс-бар</option></select></div>
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Кликабельные буллеты</span><input type="checkbox" data-config="pagination.clickable" ${config['pagination.clickable'] ? 'checked' : ''}><span class="dbm-slider"></span></label></div>`;
                    break;
                case 'effects':
                     modalBodyHTML = `<div class="dbm-form-group"><label>Эффект перехода</label><select data-config="effect"><option value="slide" ${config.effect === 'slide' ? 'selected' : ''}>Листание</option><option value="fade" ${config.effect === 'fade' ? 'selected' : ''}>Затухание</option><option value="cube" ${config.effect === 'cube' ? 'selected' : ''}>Куб</option><option value="coverflow" ${config.effect === 'coverflow' ? 'selected' : ''}>Поток</option><option value="flip" ${config.effect === 'flip' ? 'selected' : ''}>Переворот</option></select></div>`;
                    break;
                case 'autoplay':
                     modalBodyHTML = `
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Включить автопрокрутку</span><input type="checkbox" data-config="autoplay" ${config.autoplay ? 'checked' : ''}><span class="dbm-slider"></span></label></div>
                        <div class="dbm-form-group"><label>Задержка (мс)</label><input type="number" data-config="autoplay.delay" value="${config['autoplay.delay'] || 3000}"></div>
                        <div class="dbm-form-group"><label class="dbm-switch as-label"><span>Останавливать при взаимодействии</span><input type="checkbox" data-config="autoplay.disableOnInteraction" ${config['autoplay.disableOnInteraction'] ? 'checked' : ''}><span class="dbm-slider"></span></label></div>`;
                    break;
            }

            SuperPanelManager.showModal(`<div class="dbm-modal-content"><div class="dbm-modal-header"><h4>Настройки: ${category}</h4><button class="dbm-modal-close-btn dbm-btn-icon dbm-btn-secondary">&times;</button></div><div class="dbm-modal-body">${modalBodyHTML}</div><div class="dbm-modal-footer"><button class="dbm-modal-close-btn dbm-btn dbm-btn-primary">Готово</button></div></div>`);
            this.addModalEventListeners();
        },
        
        addModalEventListeners() {
            const modal = SuperPanelManager.overlay;
            modal.querySelectorAll('[data-config]').forEach(input => {
                const keyPath = input.dataset.config;
                const isCheckbox = input.type === 'checkbox';
                input.addEventListener('input', () => {
                    const value = isCheckbox ? input.checked : (input.type === 'number' && input.value !== '' ? parseFloat(input.value) : input.value);
                    const keys = keyPath.split('.');
                    let current = this.allSliders[this.activeSliderKey].config;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    current[keys[keys.length - 1]] = value;
                    this.saveSliders();
                    this.updatePreview();
                });
            });
            modal.querySelectorAll('.dbm-modal-close-btn').forEach(btn => btn.onclick = () => SuperPanelManager.hideModal());
        },

        generateSliderCode() {
            console.log('[SwiperArchitect] CODE: Генерация кода слайдера...');
            const sliderData = this.allSliders[this.activeSliderKey];
            const containerSelector = this.activeSliderKey;
            const slideSelector = sliderData.slideSelector;
            const sliderClass = 'super-slider-' + Math.random().toString(36).substr(2, 9);
            const swiperConfig = this.buildSwiperConfig();

            const code = `\n<link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css">\n<style>\n    ${containerSelector} { position: relative; overflow: hidden; }\n    ${containerSelector} .swiper-wrapper { display: flex; }\n    ${slideSelector} { flex-shrink: 0; width: 100%; height: auto; box-sizing: border-box; }\n</style>\n<script src="https://unpkg.com/swiper/swiper-bundle.min.js"><\/script>\n<script>\ndocument.addEventListener('DOMContentLoaded', function() {\n    const sliderContainer = document.querySelector('${containerSelector}');\n    if (sliderContainer) {\n        sliderContainer.classList.add('${sliderClass}', 'swiper-container');\n        const wrapper = document.createElement('div');\n        wrapper.className = 'swiper-wrapper';\n        const slides = Array.from(sliderContainer.querySelectorAll('${slideSelector}'));\n        slides.forEach(slide => { slide.classList.add('swiper-slide'); wrapper.appendChild(slide); });\n        sliderContainer.innerHTML = '';\n        sliderContainer.appendChild(wrapper);\n        ${swiperConfig.navigation ? `sliderContainer.insertAdjacentHTML('beforeend', '<div class="swiper-button-next"></div><div class="swiper-button-prev"></div>');\n` : ''}        ${swiperConfig.pagination ? `sliderContainer.insertAdjacentHTML('beforeend', '<div class="swiper-pagination"></div>');\n` : ''}        const swiper = new Swiper('.${sliderClass}', ${JSON.stringify(swiperConfig, null, 2)});\n    }\n});\n<\/script>`;
            this.showCodeModal(code);
        },

        showCodeModal(code) {
             const codeHTML = `<pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.4;"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
            SuperPanelManager.showModal(`<div class="dbm-modal-content" style="max-width: 800px; max-height: 90%;"><div class="dbm-modal-header"><h4>Код слайдера</h4><button class="dbm-modal-close-btn dbm-btn-icon dbm-btn-secondary">&times;</button></div><div class="dbm-modal-body"><p>Скопируйте этот код и вставьте в блок T123 (HTML) на вашей странице:</p>${codeHTML}</div><div class="dbm-modal-footer"><button class="dbm-modal-close-btn dbm-btn dbm-btn-secondary">Закрыть</button><button id="dbm-copy-code-modal-btn" class="dbm-btn dbm-btn-primary">Копировать код</button></div></div>`);
            
            const copyBtn = document.getElementById('dbm-copy-code-modal-btn');
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.textContent = 'Скопировано!';
                    setTimeout(() => { copyBtn.textContent = 'Копировать код'; }, 2000);
                });
            };
            
            document.querySelectorAll('.dbm-modal-close-btn').forEach(btn => btn.onclick = () => SuperPanelManager.hideModal());
        },
        
        loadScript(src) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        
        loadStyles(href) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`link[href="${href}"]`)) return resolve();
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            });
        }
    };
}

// --- HOOKS FOR PANEL LIFECYCLE ---
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