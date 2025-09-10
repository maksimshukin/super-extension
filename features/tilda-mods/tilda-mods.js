// Вставить в начало файла shift.js

/**
 * Вспомогательная функция для ожидания доступности глобальной функции.
 * @param {string} functionName - Имя функции в window.
 * @returns {Promise<Function>}
 */
function waitForFunction(functionName) {
    return new Promise(resolve => {
        if (window[functionName] && typeof window[functionName] === 'function') {
            return resolve(window[functionName]);
        }
        const interval = setInterval(() => {
            if (window[functionName] && typeof window[functionName] === 'function') {
                clearInterval(interval);
                resolve(window[functionName]);
            }
        }, 100); // Проверяем каждые 100мс
    });
}  


window.shiftSolutionsConfig = [
    {
        solutionCode: 'super-slider',
        cod: 'SHF001', // Номер блока
        title: 'Супер Слайдер',
        icon: 'assets/icon128.png', // Иконка для карточки
        htmlContent: `
<div id="solution-super-slider" class="feature-block">
    <h3>🎠 Супер Слайдер</h3>
    <p>Здесь находятся настройки и инструменты для Супер Слайдера.</p>
    
    <style>
        .shift-slider { position: relative; overflow: hidden; border-radius: 8px; margin: 20px 0; }
        .shift-slider__container { display: flex; transition: transform 0.3s ease; }
        .shift-slider__slide { min-width: 100%; padding: 40px; color: white; text-align: center; }
        .shift-slider__controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
        .shift-slider__btn { width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; background: transparent; cursor: pointer; }
        .shift-slider__btn.active { background: white; }
    </style>
    
    <div class="shift-slider">
        <div class="shift-slider__container">
            <div class="shift-slider__slide" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h2>Слайд 1</h2>
                <p>Первый слайд с красивым градиентом</p>
            </div>
            <div class="shift-slider__slide" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h2>Слайд 2</h2>
                <p>Второй слайд с другим градиентом</p>
            </div>
            <div class="shift-slider__slide" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <h2>Слайд 3</h2>
                <p>Третий слайд с синим градиентом</p>
            </div>
        </div>
        <div class="shift-slider__controls">
            <button class="shift-slider__btn active" data-slide="0"></button>
            <button class="shift-slider__btn" data-slide="1"></button>
            <button class="shift-slider__btn" data-slide="2"></button>
        </div>
    </div>
    
    <script>
        (function() {
            var currentSlide = 0;
            var container = document.querySelector('.shift-slider__container');
            var buttons = document.querySelectorAll('.shift-slider__btn');
            
            if (!container || !buttons.length) return;
            
            function showSlide(index) {
                currentSlide = index;
                container.style.transform = 'translateX(-' + (index * 100) + '%)';
                buttons.forEach(function(btn, i) {
                    btn.classList.toggle('active', i === index);
                });
            }
            
            buttons.forEach(function(btn, index) {
                btn.addEventListener('click', function() { showSlide(index); });
            });
            
            setInterval(function() {
                currentSlide = (currentSlide + 1) % 3;
                showSlide(currentSlide);
            }, 5000);
        })();
    </script>
</div>
        `
    },
    {
        solutionCode: 'super-grid',
        cod: 'SHF002',
        title: 'Супер Грид',
        icon: 'assets/icon128.png',
        htmlContent: `
<div id="solution-super-grid" class="feature-block">
    <h3>📐 Супер Грид</h3>
    <p>Здесь находятся настройки и инструменты для Супер Грида.</p>
    
    <style>
        .shift-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; padding: 20px; margin: 20px 0; }
        .shift-grid__item { padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0; }
    </style>
    
    <div class="shift-grid">
        <div class="shift-grid__item" style="grid-column: span 4;">
            <h3>Колонка 1</h3>
            <p>Содержимое первой колонки</p>
        </div>
        <div class="shift-grid__item" style="grid-column: span 4;">
            <h3>Колонка 2</h3>
            <p>Содержимое второй колонки</p>
        </div>
        <div class="shift-grid__item" style="grid-column: span 4;">
            <h3>Колонка 3</h3>
            <p>Содержимое третьей колонки</p>
        </div>
    </div>
</div>
        `
    },
    {
        solutionCode: 'grid-stacks',
        cod: 'SHF003',
        title: 'Грид-стеки',
        icon: 'assets/icon128.png',
        htmlContent: `
<div id="solution-grid-stacks" class="feature-block">
    <h3>📚 Грид-стеки</h3>
    <p>Здесь находятся настройки и инструменты для Грид-стеков.</p>
    
    <style>
        .shift-grid-stacks { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; margin: 20px 0; }
        .shift-stack { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease; }
        .shift-stack:hover { transform: translateY(-5px); }
        .shift-stack__header { color: white; padding: 20px; }
        .shift-stack__content { padding: 20px; }
    </style>
    
    <div class="shift-grid-stacks">
        <div class="shift-stack">
            <div class="shift-stack__header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h3 style="margin: 0; font-size: 18px;">Стек 1</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Описание первого стека</p>
            </div>
            <div class="shift-stack__content">
                <p>Содержимое первого стека с полезной информацией.</p>
                <button style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Подробнее</button>
            </div>
        </div>
        <div class="shift-stack">
            <div class="shift-stack__header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h3 style="margin: 0; font-size: 18px;">Стек 2</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Описание второго стека</p>
            </div>
            <div class="shift-stack__content">
                <p>Содержимое второго стека с другой информацией.</p>
                <button style="background: #f093fb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Подробнее</button>
            </div>
        </div>
        <div class="shift-stack">
            <div class="shift-stack__header" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <h3 style="margin: 0; font-size: 18px;">Стек 3</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Описание третьего стека</p>
            </div>
            <div class="shift-stack__content">
                <p>Содержимое третьего стека с дополнительной информацией.</p>
                <button style="background: #4facfe; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Подробнее</button>
            </div>
        </div>
    </div>
</div>
        `
    },
    {
        solutionCode: 'custom-html',
        cod: 'T123',
        title: 'Кастомный HTML',
        icon: 'assets/icon128.png',
        htmlContent: `
<div id="solution-custom-html" class="feature-block">
    <h3>🔧 Кастомный HTML</h3>
    <p>Здесь находятся настройки и инструменты для Кастомного HTML.</p>
    
    <style>
        .shift-custom-html { padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin: 20px 0; }
        .shift-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .shift-feature { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px); }
        .shift-cta { background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 15px 30px; border-radius: 25px; font-size: 16px; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .shift-cta:hover { background: white; color: #667eea; transform: translateY(-2px); }
    </style>
    
    <div class="shift-custom-html">
        <div class="shift-custom-content">
            <h2 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 300;">Кастомный HTML</h2>
            <p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9;">Этот блок создан с помощью SHIFT Extension</p>
            
            <div class="shift-features">
                <div class="shift-feature">
                    <div style="font-size: 24px; margin-bottom: 10px;">🚀</div>
                    <h4 style="margin: 0 0 10px 0;">Быстро</h4>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">Мгновенное создание блоков</p>
                </div>
                <div class="shift-feature">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎨</div>
                    <h4 style="margin: 0 0 10px 0;">Красиво</h4>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">Современный дизайн</p>
                </div>
                <div class="shift-feature">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚡</div>
                    <h4 style="margin: 0 0 10px 0;">Эффективно</h4>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">Оптимизированный код</p>
                </div>
            </div>
            
            <button class="shift-cta">Начать работу</button>
        </div>
    </div>
    
    <script>
        (function() {
            var ctaButton = document.querySelector('.shift-cta');
            if (ctaButton) {
                ctaButton.addEventListener('click', function() {
                    alert('SHIFT Extension работает! 🎉');
                });
            }
        })();
    </script>
</div>
        `
    }
];

console.log('[SHIFT CONFIG] Конфигурация загружена:', window.shiftSolutionsConfig.length, 'решений');

/**
 * Вспомогательная функция для "умного" и быстрого ожидания элемента в DOM.
 * РЕШАЕТ ПРОБЛЕМУ №1: Убирает задержки, работая мгновенно.
 * @param {string} selector - CSS-селектор элемента.
 * @returns {Promise<Element>}
 */
function waitForElement(selector) {
    return new Promise(resolve => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

/**
 * Главная функция отрисовки. Создает вкладку и карточки модов.
 * РЕШАЕТ ПРОБЛЕМЫ №4 и №9: Создает вкладку и карточки по структуре Tilda.
 */
async function renderShiftPanel() {
    console.log('[SHIFT] Начинаем отрисовку панели SHIFT...');
    
    // Ждем, пока Tilda загрузит свою библиотеку
    const libraryContainer = await waitForElement('.tp-library__body');
    const rightSideContainer = await waitForElement('.tp-library-rightside');

    console.log('[SHIFT] Контейнеры Tilda найдены, создаем интерфейс...');

    // --- 1. Создание кастомной вкладки "SHIFT" ---
    const categoryHTML = `
        <div class="tp-library__type-body" id="shift-category-tab" data-library-type-id="-shift-mods">
            <div class="tp-library__type">
                <div class="tp-library__type-title-wrapper">
                    <div class="tp-library__type-title" style="font-weight: 600;">SHIFT Моды</div>
                </div>
            </div>
        </div>
    `;
    libraryContainer.insertAdjacentHTML('afterbegin', categoryHTML);

    // --- 2. Создание контейнера для карточек наших модов ---
    const shiftBlocksContainerHTML = `
        <div class="tp-library__tpls-list-body" id="tplslist-shift-mods" data-tpls-for-type="-shift-mods" style="display: none;">
            <div class="tp-library__tpls-list-body__container">
                </div>
        </div>
    `;
    rightSideContainer.insertAdjacentHTML('beforeend', shiftBlocksContainerHTML);
    const blocksContainer = rightSideContainer.querySelector('#tplslist-shift-mods .tp-library__tpls-list-body__container');

    // --- 3. Генерация и вставка карточек модов ---
    // Убедитесь, что у вас в проекте есть файл config.js с этой переменной
    if (typeof window.shiftSolutionsConfig === 'undefined') {
        console.error('SHIFT: Конфиг shiftSolutionsConfig не найден!');
        return;
    }

    console.log('[SHIFT] Создаем карточки для', window.shiftSolutionsConfig.length, 'решений...');

    window.shiftSolutionsConfig.forEach(config => {
        // РЕШАЕТ ПРОБЛЕМУ №8 и №9: Используем структуру Tilda для карточки и подтягиваем данные (cod, title)
        const cardHTML = `
            <div class="tp-library__tpl-body" data-solution-code="${config.solutionCode}" data-tpl-id="131">
                <div class="tp-library__tpl-wrapper">
                    <div class="tp-library__tpl-secwrapper">
                        <div class="tp-library__tpl-thirdwrapper">
                             <img class="tp-library__tpl-icon" src="${chrome.runtime.getURL(config.icon)}">
                             <div class="tp-library__tpl-bottom-wrapper">
                                <div class="tp-library__tpl-caption">
                                    <span class="tp-library__tpl-cod">${config.cod}</span>
                                    <span class="tp-library__tpl-title">${config.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        blocksContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    console.log('[SHIFT] Карточки созданы, добавляем обработчики событий...');
    addEventListeners();
}

/**
 * Добавляет все необходимые обработчики событий.
 */
function addEventListeners() {
    const shiftTab = document.getElementById('shift-category-tab');
    const shiftBlocksPanel = document.getElementById('tplslist-shift-mods');

    // --- Логика переключения вкладок ---
    // РЕШАЕТ ПРОБЛЕМУ №5: Добавляет/убирает классы для корректного отображения.
    shiftTab.addEventListener('click', () => {
        console.log('[SHIFT] Переключаемся на вкладку SHIFT...');
        
        document.querySelectorAll('.tp-library__type-body_active').forEach(el => el.classList.remove('tp-library__type-body_active'));
        shiftTab.classList.add('tp-library__type-body_active');
        
        document.querySelectorAll('.tp-library__tpls-list-body_active').forEach(el => el.classList.remove('tp-library__tpls-list-body_active'));
        shiftBlocksPanel.classList.add('tp-library__tpls-list-body_active');
        shiftBlocksPanel.style.display = 'block';
        
        document.querySelector('.tp-library').classList.add('tp-library_rightsideopened');
        
        console.log('[SHIFT] Вкладка SHIFT активирована');
    });

    // --- Логика добавления блока по клику на карточку ---
    // РЕШАЕТ ПРОБЛЕМЫ №2, №6, №7: Полный цикл добавления и сохранения блока.
    document.querySelectorAll('#tplslist-shift-mods .tp-library__tpl-body').forEach(card => {
        card.addEventListener('click', async () => {
            const solutionCode = card.dataset.solutionCode;
            const config = window.shiftSolutionsConfig.find(s => s.solutionCode === solutionCode);

            if (!config) {
                console.error('[SHIFT] Конфигурация не найдена для:', solutionCode);
                return;
            }

            console.log(`[SHIFT] Добавляем блок для мода "${config.title}"`);

            try {
                // 1. Скрываем библиотеку самым надежным способом - симуляцией клика.
                const closeButton = document.querySelector('.tp-library__header-close-wrapper .tp-library__header-close');
                if (closeButton) {
                    closeButton.click();
                } else {
                    console.error('[SHIFT] Кнопка закрытия библиотеки не найдена.');
                    // Попытка вызова функции напрямую как запасной вариант
                    const tildaHideLibrary = window.tp__library__hide || window.tp__library__close || window.tpgallery_close;
                    if (typeof tildaHideLibrary === 'function') {
                        tildaHideLibrary();
                    } else {
                        return; // Прерываем выполнение, если ничего не сработало
                    }
                }
                console.log('[SHIFT] Библиотека скрыта');
            
                // 2. Ждем готовности API Tilda для сохранения данных.
                await waitForFunction('tp__addRecord');
                await waitForFunction('panel__editrecord_saveval');
                await waitForFunction('tp__updateRecord');
                console.log('[SHIFT] Tilda API готово.');
            
                // 3. Добавляем пустой блок и получаем его ID.
                const newRecId = window.tp__addRecord('123', window.afterid || '', true);
                const fullRecId = `rec${newRecId}`;
                console.log(`[SHIFT] Блок создан с ID: ${fullRecId}`);
            
                // 4. Получаем HTML-контент (динамически или статически).
                const htmlContent = typeof config.getHtmlContent === 'function' 
                    ? config.getHtmlContent() 
                    : config.htmlContent;
            
                if (!htmlContent) {
                    console.error('[SHIFT] HTML-контент для блока не определен!');
                    return;
                }
                
                // 5. ПОСЛЕДОВАТЕЛЬНО СОХРАНЯЕМ ДАННЫЕ НАПРЯМУЮ
                console.log('[SHIFT] Сохраняем HTML контент...');
                await window.panel__editrecord_saveval(fullRecId, 'html', htmlContent);
                console.log('[SHIFT] HTML контент сохранен.');
            
                console.log('[SHIFT] Добавляем CSS класс "dbm-block"...');
                await window.panel__editrecord_saveval(fullRecId, 'cssclassname', 'dbm-block');
                console.log('[SHIFT] CSS класс "dbm-block" добавлен.');
                
                // 6. Обновляем блок на странице, чтобы все изменения отобразились.
                await window.tp__updateRecord(fullRecId);
                
                console.log(`[SHIFT] Мод "${config.title}" успешно добавлен и сохранен!`);
            
            } catch (error) {
                console.error('[SHIFT] Ошибка при добавлении блока:', error);
            }
        });
    });

    console.log('[SHIFT] Обработчики событий добавлены');
}

// ============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ОТЛАДКИ
// ============================================================================

// Экспортируем функции в глобальную область видимости для отладки
window.shiftDebug = {
    // Основные функции
    renderShiftPanel,
    addEventListeners,
    waitForElement,
    
    // Данные
    shiftSolutionsConfig: () => window.shiftSolutionsConfig,
    
    // Функции для тестирования
    testTildaAPI: function() {
        console.log('[SHIFT DEBUG] Проверяем доступность Tilda API...');
        const api = {
            tpAddRecord: typeof window.tp__addRecord === 'function',
            panelEditRecord: typeof window.panel__editrecord === 'function',
            tpLibraryHide: typeof window.tp__library__hide === 'function',
            recordDel: typeof window.record__del === 'function',
            recordOnoff: typeof window.record__onoff === 'function'
        };
        console.log('[SHIFT DEBUG] Tilda API статус:', api);
        return api;
    },
    
    testWaitForElement: async function(selector, timeout = 5000) {
        console.log(`[SHIFT DEBUG] Тестируем ожидание элемента: ${selector}`);
        const startTime = Date.now();
        const element = await waitForElement(selector);
        const elapsedTime = Date.now() - startTime;
        
        if (element) {
            console.log(`[SHIFT DEBUG] Элемент найден за ${elapsedTime}мс:`, element);
        } else {
            console.log(`[SHIFT DEBUG] Элемент не найден за ${elapsedTime}мс`);
        }
        
        return element;
    },
    
    testAddBlock: async function(solutionCode) {
        const config = window.shiftSolutionsConfig.find(s => s.solutionCode === solutionCode);
        if (!config) {
            console.error('[SHIFT DEBUG] Решение не найдено:', solutionCode);
            return;
        }
        
        console.log('[SHIFT DEBUG] Тестируем добавление блока:', config.title);
        
        try {
            // 1. Скрываем библиотеку
            window.tp__library__hide();
            
            // 2. Добавляем блок
            const newRecId = window.tp__addRecord('123', window.afterid || '', true);
            const fullRecId = `rec${newRecId}`;
            
            // 3. Открываем настройки
            window.panel__editrecord(fullRecId, 'content');
            
            // 4. Ждем поле для HTML
            const htmlTextarea = await waitForElement('#ts-control-html-code');
            
            // 5. Вставляем код
            htmlTextarea.value = config.htmlContent;
            htmlTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 6. Сохраняем
            const saveButton = await waitForElement('.ts-btn-pro-close');
            if (saveButton) {
                saveButton.click();
                console.log('[SHIFT DEBUG] Блок успешно создан и сохранен!');
            }
            
        } catch (error) {
            console.error('[SHIFT DEBUG] Ошибка при тестировании:', error);
        }
    },
    
    listBlocks: function() {
        const blocks = document.querySelectorAll('.record[data-record-cod^="SHF"], .record[data-record-cod="T123"]');
        console.log('[SHIFT DEBUG] Найденные SHIFT блоки:', blocks.length);
        blocks.forEach((block, index) => {
            const recId = block.id;
            const recordCod = block.getAttribute('data-record-cod');
            const title = block.getAttribute('data-title');
            console.log(`[SHIFT DEBUG] Блок ${index + 1}:`, { recId, recordCod, title });
        });
        return blocks;
    },
    
    testFullFlow: async function(solutionCode) {
        console.log('[SHIFT DEBUG] Тестируем полный поток создания блока...');
        const config = window.shiftSolutionsConfig.find(s => s.solutionCode === solutionCode);
        if (!config) {
            console.error('[SHIFT DEBUG] Решение не найдено:', solutionCode);
            return;
        }
        
        console.log('[SHIFT DEBUG] Начинаем тест для:', config.title);
        
        // Проверяем API
        const api = this.testTildaAPI();
        if (!api.tpAddRecord || !api.panelEditRecord) {
            console.error('[SHIFT DEBUG] Tilda API недоступен');
            return;
        }
        
        // Тестируем создание блока
        await this.testAddBlock(solutionCode);
        
        // Проверяем результат
        setTimeout(() => {
            this.listBlocks();
        }, 2000);
    }
};

console.log('[SHIFT] Функции отладки доступны в window.shiftDebug');

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

/**
 * Главная функция инициализации
 */
async function initShiftExtension() {
    console.log('[SHIFT] Инициализация SHIFT Extension...');
    console.log('[SHIFT] Текущий URL:', window.location.href);
    console.log('[SHIFT] Document ready state:', document.readyState);
    
    try {
        // Проверяем, что мы на странице Tilda
        const isTildaPage = window.location.href.includes('tilda.cc') || 
                           window.location.href.includes('tilda.ws') || 
                           window.location.href.includes('tilda.ru');
        
        if (!isTildaPage) {
            console.log('[SHIFT] Не на странице Tilda, пропускаем инициализацию');
            console.log('[SHIFT] Текущий URL:', window.location.href);
            return;
        }
        
        console.log('[SHIFT] На странице Tilda, продолжаем инициализацию');
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        // Ждем загрузки конфигурации
        let attempts = 0;
        while (typeof window.shiftSolutionsConfig === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.shiftSolutionsConfig === 'undefined') {
            console.error('[SHIFT] Конфигурация shiftSolutionsConfig не загружена!');
            return;
        }
        
        console.log('[SHIFT] Конфигурация загружена, начинаем отрисовку...');
        
        // Запускаем отрисовку панели
        await renderShiftPanel();
        
        console.log('[SHIFT] SHIFT Extension успешно инициализирован!');
        
    } catch (error) {
        console.error('[SHIFT] Ошибка при инициализации:', error);
    }
}

// Запускаем инициализацию
console.log('[SHIFT] Запускаем инициализацию SHIFT Extension...');
initShiftExtension();
console.log('[SHIFT] Файл shift.js загружен полностью');