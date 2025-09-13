/**
 * =================================================================================
 * DBM SWIPER ARCHITECT (Super Slider)
 * =================================================================================
 * Инструмент для создания Swiper.js слайдеров, интегрированный в общую панель.
 * Использует логику выбора элементов из Hover Architect для удобства.
 * =================================================================================
 */
if (!window.dbmSwiperArchitect) {
    window.dbmSwiperArchitect = {
        // --- STATE & CONFIG ---
        isSelectionMode: false,
        highlightedElement: null,
        selectedBlockSelector: null, // Хранит селектор главного блока

        // --- UI ELEMENTS ---
        els: {},

        // --- DATA & CONSTANTS ---
        CLASS_BLOCKLIST: ['r', 't-rec', 't-records', 't-container', 't-align_center', 't-align_left', 't-margin_auto', 'dbm-highlight-element'],
        TRANSLATION_MAP: { /* ... (можно скопировать из super-hover.js если нужно) ... */ },
        
        /**
         * Инициализация инструмента. Вызывается из main.js
         * @param {HTMLElement} wrapperElement - Контейнер, куда будет встроен инструмент.
         */
        init() {
            console.log('[SwiperArchitect] Инициализация...');
            
            // Проверяем наличие необходимых менеджеров
            if (typeof SuperPanelManager === 'undefined') {
                console.error("[SwiperArchitect] SuperPanelManager не найден!");
                return;
            }
            
            if (typeof SuperSelectionManager === 'undefined') {
                console.error("[SwiperArchitect] SuperSelectionManager не найден!");
                return;
            }
            
            console.log('[SwiperArchitect] ✅ Все менеджеры найдены, продолжаем инициализацию...');
            
            // Устанавливаем название решения в панели
            SuperPanelManager.setSolutionTitle('Super Slider');
            
            // Устанавливаем заголовок и контент через SuperPanelManager
            SuperPanelManager.setHeader('<h2 class="dbm-panel-main-title">Super Slider</h2>');
            SuperPanelManager.setContent(this.getPanelHTML());
            SuperPanelManager.open();
            
            // 2. Кэшируем все нужные нам DOM-элементы
            this.cacheDOMElements();
            
            // 3. Навешиваем обработчики событий
            this.setupEventListeners();

            // 4. (Опционально) Загружаем дефолтное состояние или настройки
            // this.loadStateIntoForm();
            this.generateCode(); // Генерируем код с плейсхолдерами
        },

        getPanelHTML() {
            // HTML-структура панели управления слайдером
            return `
                <div id="swiper-architect-panel">
                    <header id="swiper-panel-header">
                        <h2 class="dbm-panel-main-title">Конструктор слайдеров</h2>
                        <button id="close-swiper-panel" class="dbm-icon-btn" title="Закрыть">&times;</button>
                    </header>
                    <div id="swiper-panel-content">
                        <div class="dbm-subsection">
                            <h3>1. Выбор блока</h3>
                            <p>Нажмите на кнопку и выберите на странице блок, который нужно превратить в слайдер.</p>
                            <div id="selected-block-info">Блок не выбран</div>
                            <button id="select-block-btn" class="dbm-btn dbm-btn-primary">Выбрать блок на странице</button>
                        </div>
                        <div class="dbm-subsection">
                            <h3>2. Уточнение селекторов</h3>
                            <div class="dbm-form-group">
                                <label>Селектор контейнера (обертка для слайдов)</label>
                                <input type="text" id="containerClass" placeholder="Напр., .t774__container">
                            </div>
                            <div class="dbm-form-group">
                                <label>Селектор слайда (каждый отдельный элемент)</label>
                                <input type="text" id="slideClass" placeholder="Напр., .t774__col">
                            </div>
                        </div>
                        <div class="dbm-subsection">
                            <h3>3. Готовый код</h3>
                            <p>Скопируйте и вставьте этот код в блок T123 (HTML).</p>
                            <div class="code-output-wrapper">
                                <pre><code id="dbm-generated-code-output"></code></pre>
                                <button id="dbm-copy-btn" title="Копировать код">Копировать</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        cacheDOMElements() {
            // Используем SuperPanelManager.contentContainer или ищем в документе
            const wrapper = SuperPanelManager.contentContainer || document;
            
            this.els.panel = wrapper.querySelector('#swiper-architect-panel');
            this.els.selectBlockBtn = wrapper.querySelector('#select-block-btn');
            this.els.selectedBlockInfo = wrapper.querySelector('#selected-block-info');
            this.els.containerClassInput = wrapper.querySelector('#containerClass');
            this.els.slideClassInput = wrapper.querySelector('#slideClass');
            this.els.generatedCodeOutput = wrapper.querySelector('#dbm-generated-code-output');
            this.els.copyBtn = wrapper.querySelector('#dbm-copy-btn');
            this.els.closeBtn = wrapper.querySelector('#close-swiper-panel');
            
            // Глобальные элементы для режима выбора, создаем если их нет
            this.els.inspector = document.getElementById('dbm-inspector-tooltip') || this.createGlobalElement('dbm-inspector-tooltip', 'div');
            this.els.dynamicStyles = document.getElementById('dbm-dynamic-tool-styles') || this.createGlobalElement('dbm-dynamic-tool-styles', 'style');
        },

        setupEventListeners() {
            this.els.selectBlockBtn.addEventListener('click', () => this.startSelectionMode());
            this.els.closeBtn.addEventListener('click', () => this.closePanel());

            const updateOnChange = () => this.generateCode();
            this.els.containerClassInput.addEventListener('input', updateOnChange);
            this.els.slideClassInput.addEventListener('input', updateOnChange);

            this.els.copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(this.els.generatedCodeOutput.textContent).then(() => {
                    this.els.copyBtn.textContent = 'Скопировано!';
                    setTimeout(() => { this.els.copyBtn.textContent = 'Копировать'; }, 2000);
                });
            });
        },

        closePanel() {
            this.els.panel.parentElement.innerHTML = ''; // Очищаем контейнер
            const event = new CustomEvent('shift-panel-closed');
            document.dispatchEvent(event);
    },

    /**
     * =========================================================================
         * SELECTION LOGIC (Заимствовано из dbmHoverArchitect)
     * =========================================================================
     */
        startSelectionMode() {
            this.isSelectionMode = true;
            document.body.classList.add('selection-active-slider'); // Используем свой класс
            document.addEventListener('mousemove', this._boundMouseMove = this.handleMouseMove.bind(this));
            document.addEventListener('click', this._boundBodyClick = this.handleBodyClick.bind(this), true);
        },

        endSelectionMode() {
            this.isSelectionMode = false;
            document.body.classList.remove('selection-active-slider');
            this.updateHighlight(null);
            document.removeEventListener('mousemove', this._boundMouseMove);
            document.removeEventListener('click', this._boundBodyClick, true);
        },
        
        handleMouseMove(e) {
            if (!this.isSelectionMode) return;
            const target = e.target.closest('.r.t-rec'); // Подсвечиваем только целые блоки
            if (target && !target.closest('#dbm-main-panel')) {
                 this.updateHighlight(target);
            }
        },

        handleBodyClick(e) {
            if (!this.isSelectionMode || !this.highlightedElement || this.highlightedElement.closest('#dbm-main-panel')) return;
            e.preventDefault();
            e.stopPropagation();
            this.finalizeSelection(this.highlightedElement);
        },

        finalizeSelection(selectedBlock) {
            this.selectedBlockSelector = this.getUniqueSelector(selectedBlock, false); // Получаем селектор без префикса t-rec
            this.els.selectedBlockInfo.textContent = `Выбран блок: ${this.selectedBlockSelector}`;

            // Авто-поиск контейнера и слайдов
            const potentialContainer = selectedBlock.querySelector('[class*="__container"]');
            const potentialSlide = selectedBlock.querySelector('[class*="__col"], [class*="__item"]');
            
            if (potentialContainer) {
                this.els.containerClassInput.value = this.getSelectorPart(potentialContainer).value;
            }
            if (potentialSlide) {
                this.els.slideClassInput.value = this.getSelectorPart(potentialSlide).value;
            }

            this.endSelectionMode();
            this.generateCode();
        },

        updateHighlight(element) {
            if (this.highlightedElement === element) return;
            if (this.highlightedElement) this.highlightedElement.classList.remove('dbm-highlight-element');
            this.highlightedElement = element;
            if (this.highlightedElement) this.highlightedElement.classList.add('dbm-highlight-element');
        },

        getUniqueSelector(el, useBlockPrefix = true) {
            // ... (Вставьте сюда вашу полную функцию getUniqueSelector из dbmHoverArchitect) ...
            // Для краткости я использую упрощенную версию:
             if (!el) return '';
             const tildaBlock = el.closest('.r.t-rec');
             if (!tildaBlock) return '';
             if (useBlockPrefix) {
                 return `#${tildaBlock.id}`;
             }
             const customClass = Array.from(tildaBlock.classList).find(c => c.startsWith('uc-'));
             return customClass ? `.${customClass}` : `#${tildaBlock.id}`;
        },

        getSelectorPart(el) {
            // ... (Вставьте сюда вашу полную функцию getSelectorPart из dbmHoverArchitect) ...
            if (!el || !el.tagName) return { value: '' };
            const classes = Array.from(el.classList).filter(c => !this.CLASS_BLOCKLIST.includes(c));
            const bestClass = classes.find(c => c.includes('__')) || classes.find(c => c.startsWith('t')) || classes[0];
            return bestClass ? { value: `.${bestClass}` } : { value: el.tagName.toLowerCase() };
        },
        
        createGlobalElement(id, tagName) {
            let el = document.getElementById(id);
            if(el) return el;
            el = document.createElement(tagName);
            el.id = id;
            document.body.appendChild(el);
            return el;
        },
        
        generateCode() {
            // Здесь будет ваша логика генерации кода из второго скрипта
            const customClass = (this.selectedBlockSelector || '.my-slider').replace(/[#.]/, 'uc-');
            const containerSelector = this.els.containerClassInput.value || '.swiper-container';
            const slideSelector = this.els.slideClassInput.value || '.swiper-slide';

            // ... ваша сложная логика формирования jsConfig из настроек ...
            
            const finalCode = `<style>
    /* ... Стили для слайдера ... */
</style>
<script src="https://unpkg.com/swiper/swiper-bundle.min.js"><\/script>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const sliderBlock = document.querySelector('${this.selectedBlockSelector || '.your-block-selector'}');
    if(sliderBlock){
        sliderBlock.classList.add('${customClass}');
        // ... остальная логика инициализации Swiper с вашими селекторами ...
        // const swiper = new Swiper('${containerSelector}', { ... });
    }
});
<\/script>`;
            this.els.generatedCodeOutput.textContent = finalCode;
        }
    };
}

console.log('[SUPER-SLIDER] Файл super-slider.js (новая архитектура) загружен.');

const dbmSliderArchitect = {
    // --- STATE & CONFIG ---
    selectedCardSelector: null,
    parentContainerSelector: null,
    sliderConfig: {
        slidesPerView: 3,
        spaceBetween: 20,
        loop: false,
        autoplay: false,
        autoplayDelay: 3000,
        navigation: true,
        pagination: true,
        breakpoints: {
            320: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    },

    init() {
        console.log('[SliderArchitect] 🚀 INIT: Инициализация Super Slider...');
        this.renderInitialView();
    },

    renderInitialView() {
        console.log('[SliderArchitect] VIEW: Отображение начального экрана.');
        const contentHTML = `
            <div class="dbm-subsection">
                <div class="dbm-no-effects-placeholder">
                    <h3>Super Slider</h3>
                    <p>Выберите карточку на странице, и мы автоматически найдем её родителя для создания слайдера.</p>
                </div>
            </div>
            <div class="dbm-subsection">
                <button id="dbm-select-card-btn" class="dbm-btn dbm-btn-primary">
                    ${window.SuperSelectionManager?.ICONS?.target || '🎯'} Выбрать карточку
                </button>
            </div>
        `;

        SuperPanelManager.setHeader('');
        SuperPanelManager.setContent(contentHTML);
        this.addEventListeners();
        SuperPanelManager.open();
    },

    addEventListeners() {
        console.log('[SliderArchitect] EVENTS: Инициализация обработчиков.');
        document.getElementById('dbm-select-card-btn').addEventListener('click', () => {
            this.startCardSelection();
        });
    },

    startCardSelection() {
        console.log('[SliderArchitect] SELECTION: Запрос на выбор карточки.');
        SuperPanelManager.close();
        SuperSelectionManager.startSelection({
            onSelect: (element, selector) => {
                console.log(`[SliderArchitect] SELECTION: Карточка выбрана: ${selector}`);
                this.selectedCardSelector = selector;
                this.findParentContainer(element);
                this.renderSettingsView();
                SuperPanelManager.open();
            },
            onCancel: () => {
                console.log('[SliderArchitect] SELECTION: Выбор отменен.');
                SuperPanelManager.open();
            }
        });
    },
    
    findParentContainer(cardElement) {
        console.log('[SliderArchitect] PARENT: Поиск родительского контейнера...');
        
        // Ищем родительский контейнер, который содержит несколько карточек
        let parent = cardElement.parentElement;
        let foundParent = null;
        
        while (parent && parent !== document.body) {
            // Проверяем, содержит ли родитель несколько похожих элементов
            const similarElements = parent.querySelectorAll(this.getCardSelector(cardElement));
            if (similarElements.length > 1) {
                foundParent = parent;
                break;
            }
            parent = parent.parentElement;
        }
        
        if (foundParent) {
            this.parentContainerSelector = this.getUniqueSelector(foundParent);
            console.log(`[SliderArchitect] PARENT: Найден контейнер: ${this.parentContainerSelector}`);
        } else {
            // Если не нашли автоматически, используем родителя карточки
            this.parentContainerSelector = this.getUniqueSelector(cardElement.parentElement);
            console.log(`[SliderArchitect] PARENT: Используем родителя карточки: ${this.parentContainerSelector}`);
        }
    },

    getCardSelector(element) {
        // Получаем селектор для поиска похожих элементов
        const classes = Array.from(element.classList);
        const tagName = element.tagName.toLowerCase();
        
        // Ищем наиболее специфичный класс
        const specificClass = classes.find(cls => 
            cls.includes('__') || cls.startsWith('t') || cls.startsWith('uc-')
        );
        
        if (specificClass) {
            return `.${specificClass}`;
        }
        
        return tagName;
    },

    getUniqueSelector(element) {
        if (!element) return '';
        
        // Сначала пробуем ID
        if (element.id) {
            return `#${element.id}`;
        }
        
        // Затем ищем уникальный класс
        const classes = Array.from(element.classList);
        const uniqueClass = classes.find(cls => 
            cls.startsWith('uc-') || cls.includes('__')
        );
        
        if (uniqueClass) {
            return `.${uniqueClass}`;
        }
        
        // Если ничего не нашли, используем тег с индексом
        const tagName = element.tagName.toLowerCase();
        const siblings = Array.from(element.parentElement?.children || []);
        const index = siblings.indexOf(element);
        
        return `${tagName}:nth-child(${index + 1})`;
    },
    
    renderSettingsView() {
        console.log(`[SliderArchitect] VIEW: Отображение настроек слайдера.`);
        const contentHTML = `
            <div class="dbm-subsection">
                <h3>Выбранные элементы</h3>
                <div class="dbm-form-group">
                    <label>Карточка:</label>
                    <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; display: block; margin-top: 4px;">${this.selectedCardSelector}</code>
                </div>
                <div class="dbm-form-group">
                    <label>Контейнер:</label>
                    <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; display: block; margin-top: 4px;">${this.parentContainerSelector}</code>
                </div>
                <button id="dbm-reselect-card-btn" class="dbm-btn dbm-btn-secondary dbm-btn-sm">
                    ${window.SuperSelectionManager?.ICONS?.target || '🎯'} Выбрать другую карточку
                </button>
            </div>
            
            <div class="dbm-subsection">
                <h3>Настройки слайдера</h3>
                
                <div class="dbm-form-group">
                    <label>Слайдов на экране:</label>
                    <input type="number" id="slides-per-view" value="${this.sliderConfig.slidesPerView}" min="1" max="10">
                </div>
                
                <div class="dbm-form-group">
                    <label>Расстояние между слайдами (px):</label>
                    <input type="number" id="space-between" value="${this.sliderConfig.spaceBetween}" min="0" max="100">
                </div>
                
                <div class="dbm-form-group">
                    <label class="dbm-switch">
                        <input type="checkbox" id="loop-enabled" ${this.sliderConfig.loop ? 'checked' : ''}>
                        <span class="dbm-slider"></span>
                        Бесконечная прокрутка
                    </label>
                </div>
                
                <div class="dbm-form-group">
                    <label class="dbm-switch">
                        <input type="checkbox" id="autoplay-enabled" ${this.sliderConfig.autoplay ? 'checked' : ''}>
                        <span class="dbm-slider"></span>
                        Автопрокрутка
                    </label>
                </div>
                
                <div class="dbm-form-group" id="autoplay-delay-group" style="${this.sliderConfig.autoplay ? '' : 'display: none;'}">
                    <label>Задержка автопрокрутки (мс):</label>
                    <input type="number" id="autoplay-delay" value="${this.sliderConfig.autoplayDelay}" min="1000" max="10000" step="500">
                </div>
                
                <div class="dbm-form-group">
                    <label class="dbm-switch">
                        <input type="checkbox" id="navigation-enabled" ${this.sliderConfig.navigation ? 'checked' : ''}>
                        <span class="dbm-slider"></span>
                        Стрелки навигации
                    </label>
                </div>
                
                <div class="dbm-form-group">
                    <label class="dbm-switch">
                        <input type="checkbox" id="pagination-enabled" ${this.sliderConfig.pagination ? 'checked' : ''}>
                        <span class="dbm-slider"></span>
                        Точки пагинации
                    </label>
                </div>
            </div>
            
            <div class="dbm-subsection">
                <h3>Адаптивность</h3>
                <div class="dbm-form-group">
                    <label>Мобильные (320px+):</label>
                    <input type="number" id="breakpoint-mobile" value="${this.sliderConfig.breakpoints[320].slidesPerView}" min="1" max="3">
                </div>
                <div class="dbm-form-group">
                    <label>Планшеты (768px+):</label>
                    <input type="number" id="breakpoint-tablet" value="${this.sliderConfig.breakpoints[768].slidesPerView}" min="1" max="4">
                </div>
                <div class="dbm-form-group">
                    <label>Десктоп (1024px+):</label>
                    <input type="number" id="breakpoint-desktop" value="${this.sliderConfig.breakpoints[1024].slidesPerView}" min="1" max="6">
                </div>
            </div>
            
            <div class="dbm-subsection">
                <button id="dbm-generate-slider-btn" class="dbm-btn dbm-btn-primary">
                    ${window.SuperSelectionManager?.ICONS?.code || '💻'} Сгенерировать слайдер
                </button>
                <button id="dbm-preview-slider-btn" class="dbm-btn dbm-btn-secondary">
                    ${window.SuperSelectionManager?.ICONS?.eye || '👁️'} Предпросмотр
                </button>
            </div>
        `;
        
        SuperPanelManager.setContent(contentHTML);
        this.addSettingsEventListeners();
    },

    addSettingsEventListeners() {
        // Обработчик для выбора другой карточки
        document.getElementById('dbm-reselect-card-btn').addEventListener('click', () => {
            this.startCardSelection();
        });
        
        // Обработчики для настроек
        document.getElementById('slides-per-view').addEventListener('input', (e) => {
            this.sliderConfig.slidesPerView = parseInt(e.target.value);
        });
        
        document.getElementById('space-between').addEventListener('input', (e) => {
            this.sliderConfig.spaceBetween = parseInt(e.target.value);
        });
        
        document.getElementById('loop-enabled').addEventListener('change', (e) => {
            this.sliderConfig.loop = e.target.checked;
        });
        
        document.getElementById('autoplay-enabled').addEventListener('change', (e) => {
            this.sliderConfig.autoplay = e.target.checked;
            const delayGroup = document.getElementById('autoplay-delay-group');
            delayGroup.style.display = e.target.checked ? 'block' : 'none';
        });
        
        document.getElementById('autoplay-delay').addEventListener('input', (e) => {
            this.sliderConfig.autoplayDelay = parseInt(e.target.value);
        });
        
        document.getElementById('navigation-enabled').addEventListener('change', (e) => {
            this.sliderConfig.navigation = e.target.checked;
        });
        
        document.getElementById('pagination-enabled').addEventListener('change', (e) => {
            this.sliderConfig.pagination = e.target.checked;
        });
        
        // Обработчики для адаптивности
        document.getElementById('breakpoint-mobile').addEventListener('input', (e) => {
            this.sliderConfig.breakpoints[320].slidesPerView = parseInt(e.target.value);
        });
        
        document.getElementById('breakpoint-tablet').addEventListener('input', (e) => {
            this.sliderConfig.breakpoints[768].slidesPerView = parseInt(e.target.value);
        });
        
        document.getElementById('breakpoint-desktop').addEventListener('input', (e) => {
            this.sliderConfig.breakpoints[1024].slidesPerView = parseInt(e.target.value);
        });
        
        // Обработчики для генерации и предпросмотра
        document.getElementById('dbm-generate-slider-btn').addEventListener('click', () => {
            this.generateSliderCode();
        });
        
        document.getElementById('dbm-preview-slider-btn').addEventListener('click', () => {
            this.previewSlider();
        });
    },

    generateSliderCode() {
        console.log('[SliderArchitect] CODE: Генерация кода слайдера...');
        
        const containerSelector = this.parentContainerSelector;
        const slideSelector = this.selectedCardSelector;
        
        // Создаем уникальный класс для слайдера
        const sliderClass = 'super-slider-' + Math.random().toString(36).substr(2, 9);
        
        // Генерируем конфигурацию Swiper
        const swiperConfig = {
            slidesPerView: this.sliderConfig.slidesPerView,
            spaceBetween: this.sliderConfig.spaceBetween,
            loop: this.sliderConfig.loop,
            autoplay: this.sliderConfig.autoplay ? {
                delay: this.sliderConfig.autoplayDelay,
                disableOnInteraction: false
            } : false,
            navigation: this.sliderConfig.navigation ? {
                nextEl: `.${sliderClass} .swiper-button-next`,
                prevEl: `.${sliderClass} .swiper-button-prev`
            } : false,
            pagination: this.sliderConfig.pagination ? {
                el: `.${sliderClass} .swiper-pagination`,
                clickable: true
            } : false,
            breakpoints: this.sliderConfig.breakpoints
        };
        
        const code = `<!-- Super Slider Generated Code -->
<style>
.${sliderClass} {
    position: relative;
    overflow: hidden;
}

.${sliderClass} .swiper-wrapper {
    display: flex;
    transition-timing-function: ease-in-out;
}

.${sliderClass} .swiper-slide {
    flex-shrink: 0;
    width: 100%;
    height: auto;
}

.${sliderClass} .swiper-button-next,
.${sliderClass} .swiper-button-prev {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 18px;
    transition: all 0.3s ease;
}

.${sliderClass} .swiper-button-next:hover,
.${sliderClass} .swiper-button-prev:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.${sliderClass} .swiper-button-next {
    right: 10px;
}

.${sliderClass} .swiper-button-prev {
    left: 10px;
}

.${sliderClass} .swiper-button-next:after,
.${sliderClass} .swiper-button-prev:after {
    font-family: swiper-icons;
    font-size: 18px;
}

.${sliderClass} .swiper-button-next:after {
    content: 'next';
}

.${sliderClass} .swiper-button-prev:after {
    content: 'prev';
}

.${sliderClass} .swiper-pagination {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
}

.${sliderClass} .swiper-pagination-bullet {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    margin: 0 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.${sliderClass} .swiper-pagination-bullet-active {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.2);
}
</style>

<script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const sliderContainer = document.querySelector('${containerSelector}');
    if (sliderContainer) {
        // Добавляем класс слайдера
        sliderContainer.classList.add('${sliderClass}');
        
        // Создаем обертку для Swiper
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';
        
        // Перемещаем слайды в обертку
        const slides = sliderContainer.querySelectorAll('${slideSelector}');
        slides.forEach(slide => {
            slide.classList.add('swiper-slide');
            wrapper.appendChild(slide);
        });
        
        sliderContainer.appendChild(wrapper);
        
        // Добавляем навигацию если включена
        ${this.sliderConfig.navigation ? `
        const nextBtn = document.createElement('div');
        nextBtn.className = 'swiper-button-next';
        sliderContainer.appendChild(nextBtn);
        
        const prevBtn = document.createElement('div');
        prevBtn.className = 'swiper-button-prev';
        sliderContainer.appendChild(prevBtn);
        ` : ''}
        
        // Добавляем пагинацию если включена
        ${this.sliderConfig.pagination ? `
        const pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';
        sliderContainer.appendChild(pagination);
        ` : ''}
        
        // Инициализируем Swiper
        const swiper = new Swiper('.${sliderClass}', ${JSON.stringify(swiperConfig, null, 2)});
    }
});
</script>`;

        this.showCodeModal(code);
    },

    previewSlider() {
        console.log('[SliderArchitect] PREVIEW: Создание предпросмотра слайдера...');
        
        const container = document.querySelector(this.parentContainerSelector);
        if (!container) {
            alert('Контейнер не найден на странице!');
            return;
        }
        
        // Создаем предпросмотр
        this.createSliderPreview(container);
        
        // Показываем уведомление
        this.showPreviewNotification();
    },

    createSliderPreview(container) {
        // Удаляем предыдущий предпросмотр если есть
        const existingPreview = document.querySelector('.super-slider-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Создаем временный слайдер
        const previewClass = 'super-slider-preview';
        container.classList.add(previewClass);
        
        // Применяем базовые стили
        const style = document.createElement('style');
        style.textContent = `
            .${previewClass} {
                position: relative;
                overflow: hidden;
            }
            .${previewClass} .swiper-wrapper {
                display: flex;
                transition: transform 0.3s ease;
            }
            .${previewClass} .swiper-slide {
                flex-shrink: 0;
                width: ${100 / this.sliderConfig.slidesPerView}%;
                padding-right: ${this.sliderConfig.spaceBetween}px;
            }
            .${previewClass} .swiper-slide:last-child {
                padding-right: 0;
            }
        `;
        document.head.appendChild(style);
        
        // Создаем обертку
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';
        
        // Перемещаем слайды
        const slides = container.querySelectorAll(this.selectedCardSelector);
        slides.forEach(slide => {
            slide.classList.add('swiper-slide');
            wrapper.appendChild(slide);
        });
        
        container.appendChild(wrapper);
        
        // Добавляем индикатор предпросмотра
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        `;
        indicator.textContent = 'Предпросмотр слайдера';
        container.appendChild(indicator);
    },

    showPreviewNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 5px;">Предпросмотр активен</div>
            <div style="font-size: 14px; opacity: 0.9;">Слайдер создан на странице</div>
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    showCodeModal(code) {
        SuperPanelManager.overlay.innerHTML = `
            <div class="dbm-modal-content-wrapper">
                <div class="dbm-modal-content" style="max-width: 800px; max-height: 90%;">
                    <div class="dbm-modal-header">
                        <h4>Код слайдера</h4>
                        <button class="dbm-btn-icon dbm-btn-secondary dbm-modal-close-btn">×</button>
                    </div>
                    <div class="dbm-modal-body">
                        <p>Скопируйте этот код и вставьте в блок T123 (HTML) на вашей странице:</p>
                        <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.4;"><code>${code}</code></pre>
                    </div>
                    <div class="dbm-modal-footer">
                        <button id="dbm-modal-cancel-btn" class="dbm-btn dbm-btn-secondary">Закрыть</button>
                        <button id="dbm-copy-code-btn" class="dbm-btn dbm-btn-primary">Копировать код</button>
                    </div>
                </div>
            </div>`;
        
        SuperPanelManager.overlay.classList.add('visible');
        
        // Обработчики
        const closeBtn = SuperPanelManager.overlay.querySelector('.dbm-modal-close-btn');
        const cancelBtn = SuperPanelManager.overlay.querySelector('#dbm-modal-cancel-btn');
        const copyBtn = SuperPanelManager.overlay.querySelector('#dbm-copy-code-btn');
        
        const cleanup = () => {
            SuperPanelManager.overlay.classList.remove('visible');
            SuperPanelManager.overlay.innerHTML = '';
        };
        
        closeBtn.onclick = cleanup;
        cancelBtn.onclick = cleanup;
        
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.textContent = 'Скопировано!';
                setTimeout(() => {
                    copyBtn.textContent = 'Копировать код';
                }, 2000);
            });
        };
        
        // Закрытие по клику вне модального окна
        SuperPanelManager.overlay.onclick = (e) => {
            if (e.target === SuperPanelManager.overlay) {
                cleanup();
            }
        };
        
        // Предотвращаем всплытие событий от содержимого модального окна
        const modalContent = SuperPanelManager.overlay.querySelector('.dbm-modal-content');
        if (modalContent) {
            modalContent.onclick = (e) => {
                e.stopPropagation();
            };
        }
    }
};

// Слушаем команду на запуск от main.js
window.addEventListener('dbmInitSolution', (event) => {
    // Проверяем что это именно наше событие
    if (event.detail && event.detail.name === 'dbmSwiperArchitect') {
        console.log('[SUPER-SLIDER] Получено событие dbmInitSolution для нас:', event.detail);
        console.log('[SUPER-SLIDER] Получена команда на инициализацию.');
        if (typeof SuperPanelManager !== 'undefined' && typeof SuperSelectionManager !== 'undefined') {
    dbmSwiperArchitect.init();
        } else {
            console.error('[SUPER-SLIDER] ❌ Менеджеры не найдены! Инициализация отменена.');
        }
    }
});

// Объявляем объект в window
if (typeof window.dbmSwiperArchitect === 'undefined') {
    console.log('[SUPER-SLIDER] Создаем объект dbmSwiperArchitect и добавляем в window.');
    window.dbmSwiperArchitect = dbmSliderArchitect;
}