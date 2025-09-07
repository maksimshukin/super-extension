// shift.js - Единый файл для всех функций SHIFT Extension

console.log('SHIFT Extension: Загружен shift.js');

// ============================================================================
// КОНФИГУРАЦИЯ РЕШЕНИЙ
// ============================================================================

const SHIFT_SOLUTIONS = [
    {
        solutionCode: 'super-slider',
        blockCode: 'SHF001',
        title: 'Супер Слайдер',
        description: 'Создание красивых слайдеров с автопрокруткой',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_21.png',
        isFree: true,
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
        blockCode: 'SHF002',
        title: 'Супер Грид',
        description: 'Создание кастомной грид-сетки',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_20.png',
        isFree: true,
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
        blockCode: 'SHF003',
        title: 'Грид-стеки',
        description: 'Создание стекированной сетки с карточками',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_columns.png',
        isFree: true,
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
        blockCode: 'T123',
        title: 'Кастомный HTML',
        description: 'Свободный HTML блок с возможностями',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_html.png',
        isFree: true,
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

// ============================================================================
// УТИЛИТЫ
// ============================================================================

/**
 * Генерирует уникальный ID для блока
 */
function generateUniqueId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return timestamp + random;
}

/**
 * Ожидает появления элемента на странице
 */
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

/**
 * Ожидает загрузки Tilda API
 */
function waitForTildaAPI() {
    return new Promise((resolve) => {
        console.log('[SHIFT] Ожидание загрузки официального Tilda API...');
        
        let attempts = 0;
        const maxAttempts = 100; // 10 секунд максимум
        const interval = 100; // проверяем каждые 100мс
        
        const checkAPI = () => {
            attempts++;
            
            // Проверяем все ключевые функции Tilda API
            const tpAddRecord = typeof window.tp__addRecord === 'function';
            const panelEditRecord = typeof window.panel__editrecord === 'function';
            const tpLibraryHide = typeof window.tp__library__hide === 'function';
            const recordDel = typeof window.record__del === 'function';
            const recordOnoff = typeof window.record__onoff === 'function';
            
            if (tpAddRecord && panelEditRecord) {
                console.log('[SHIFT] Основной Tilda API загружен за', attempts, 'попыток');
                console.log('[SHIFT] Доступные функции:', {
                    tpAddRecord,
                    panelEditRecord,
                    tpLibraryHide,
                    recordDel,
                    recordOnoff
                });
                resolve({
                    tpAddRecord,
                    panelEditRecord,
                    tpLibraryHide,
                    recordDel,
                    recordOnoff
                });
            } else if (attempts >= maxAttempts) {
                console.log('[SHIFT] Tilda API не загрузился за', maxAttempts, 'попыток, продолжаем без него');
                resolve({
                    tpAddRecord: false,
                    panelEditRecord: false,
                    tpLibraryHide: false,
                    recordDel: false,
                    recordOnoff: false
                });
            } else {
                setTimeout(checkAPI, interval);
            }
        };
        
        checkAPI();
    });
}

/**
 * Получает код решения по коду блока
 */
function getSolutionCodeFromBlockCode(blockCode) {
    const solution = SHIFT_SOLUTIONS.find(s => s.blockCode === blockCode);
    return solution ? solution.solutionCode : null;
}

// ============================================================================
// СОЗДАНИЕ БЛОКОВ В TILDA
// ============================================================================

/**
 * Создает блоки SHIFT в dbmBlocks
 */
function createShiftBlocks() {
    console.log('[SHIFT] Создаем блоки SHIFT...');
    
    // Инициализируем dbmBlocks если его нет
    if (!window.dbmBlocks) {
        window.dbmBlocks = [];
    }
    
    // Очищаем старые блоки SHIFT
    window.dbmBlocks = window.dbmBlocks.filter(block => 
        !block.cod.startsWith('SHF') && block.cod !== 'T123'
    );
    
    // Добавляем новые блоки
    SHIFT_SOLUTIONS.forEach(solution => {
        const block = {
            name: solution.title,
            cod: solution.blockCode,
            descr: solution.description,
            descr_ru: solution.description,
            disableforplan0: '', // Все блоки доступны
            icon: solution.img,
            icon2: '',
            id: "131", // Всегда data-tpl-id="131"
            inlib: 'y',
            filter: 'SHIFT Модификации',
            title: solution.title,
            modsettings: [],
            moddemolive: `<div class="shift-demo">Демо блока ${solution.title}</div>`,
            moddefaultsettings: {},
            runDemo: function() {
                console.log('[SHIFT] Запуск демо для блока:', solution.blockCode);
            },
            modInputChange: function() {
                console.log('[SHIFT] Изменение настроек блока:', solution.blockCode);
            },
            modcontent: function() {
                return solution.htmlContent;
            }
        };
        
        window.dbmBlocks.push(block);
        console.log('[SHIFT] Блок добавлен:', solution.blockCode, solution.title);
    });
    
    console.log('[SHIFT] Всего блоков SHIFT создано:', SHIFT_SOLUTIONS.length);
}

/**
 * Создает категорию SHIFT в библиотеке Tilda
 */
function createShiftCategory() {
    console.log('[SHIFT] Создаем категорию SHIFT в библиотеке...');
    
    const libraryBody = document.querySelector('.tp-library__body');
    if (!libraryBody) {
        console.error('[SHIFT] Не удалось найти .tp-library__body');
        return;
    }
    
    // Проверяем, не создана ли уже категория
    const existingCategory = libraryBody.querySelector('[data-category="SHIFT Модификации"]');
    if (existingCategory) {
        console.log('[SHIFT] Категория SHIFT уже существует');
        return;
    }
    
    // Создаем HTML категории
    const categoryHTML = `
        <div class="tp-library__category" data-category="SHIFT Модификации">
            <div class="tp-library__category-header">
                <h3 class="tp-library__category-title">SHIFT Модификации</h3>
                <p class="tp-library__category-description">Кастомные блоки для Tilda</p>
            </div>
            <div class="tp-library__category-content">
                ${SHIFT_SOLUTIONS.map(solution => `
                    <div class="tp-library__card" data-block-code="${solution.blockCode}" data-solution-code="${solution.solutionCode}">
                        <div class="tp-library__card-wrapper">
                            <div class="tp-library__card-image">
                                <img src="${solution.img}" alt="${solution.title}">
                            </div>
                            <div class="tp-library__card-content">
                                <h4 class="tp-library__card-title">${solution.title}</h4>
                                <p class="tp-library__card-description">${solution.description}</p>
                                ${!solution.isFree ? '<span class="tp-library__card-premium">Premium</span>' : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Вставляем категорию в библиотеку
    libraryBody.insertAdjacentHTML('beforeend', categoryHTML);
    console.log('[SHIFT] Категория SHIFT создана');
    
    // Добавляем обработчики событий
    addShiftCardEventListeners();
}

/**
 * Добавляет обработчики событий для карточек SHIFT
 */
function addShiftCardEventListeners() {
    console.log('[SHIFT] Добавляем обработчики событий для карточек...');
    
    const shiftCards = document.querySelectorAll('.tp-library__card[data-block-code^="SHF"], .tp-library__card[data-block-code="T123"]');
    
    shiftCards.forEach(card => {
        card.addEventListener('click', async function() {
            const blockCode = this.getAttribute('data-block-code');
            const solutionCode = this.getAttribute('data-solution-code');
            
            console.log('[SHIFT] Клик по карточке блока:', blockCode);
            
            // Находим конфигурацию решения
            const solution = SHIFT_SOLUTIONS.find(s => s.solutionCode === solutionCode);
            if (!solution) {
                console.error(`[SHIFT] Решение "${solutionCode}" не найдено.`);
                return;
            }
            
            console.log(`[SHIFT] Добавляем блок для "${solution.title}"`);
            
            try {
                // Ждем загрузки официального Tilda API
                const tildaAPI = await waitForTildaAPI();
                
                if (tildaAPI.tpAddRecord && tildaAPI.panelEditRecord) {
                    // Используем официальный Tilda API (рекомендуемый способ)
                    console.log('[SHIFT] Используем официальный Tilda API для создания блока');
                    await addBlockWithTildaAPI(solution, tildaAPI);
                } else {
                    // Используем альтернативный способ (только для отладки)
                    console.warn('[SHIFT] Официальный Tilda API недоступен, используем отладочный режим');
                    await addBlockAlternative(solution);
                }
                
            } catch (error) {
                console.error('[SHIFT] Ошибка при добавлении блока:', error);
            }
        });
    });
    
    console.log('[SHIFT] Обработчики событий добавлены для', shiftCards.length, 'карточек');
}

/**
 * Добавляет блок через официальный Tilda API
 */
async function addBlockWithTildaAPI(solution, tildaAPI) {
    console.log('[SHIFT] Добавляем блок через официальный Tilda API...');
    
    try {
        // 1. Добавляем пустой блок T123 через официальную функцию
        console.log('[SHIFT] Вызываем tp__addRecord...');
        window.tp__addRecord('123', window.afterid || '', true);
        
        // 2. Ждем создания блока на сервере
        console.log('[SHIFT] Ожидаем создания блока на сервере...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. Получаем ID нового блока (генерируется сервером Tilda)
        const newRecId = $("#allrecords .r").last().attr("id");
        if (!newRecId) {
            console.error("[SHIFT] Не удалось получить ID нового блока от сервера Tilda!");
            return;
        }
        console.log(`[SHIFT] Сервер Tilda создал блок с ID: ${newRecId}`);
        
        // 4. Открываем панель настроек через официальную функцию
        console.log('[SHIFT] Открываем панель настроек...');
        window.panel__editrecord(newRecId, 'content');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Вставляем HTML-код в настройки
        const htmlTextarea = document.querySelector('#ts-control-html-code');
        if (htmlTextarea) {
            htmlTextarea.value = solution.htmlContent;
            htmlTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[SHIFT] HTML-код вставлен в настройки блока.');
            
            // 6. Сохраняем блок через официальную кнопку
            const saveButton = document.querySelector('.ts-btn-pro-close');
            if (saveButton) {
                console.log('[SHIFT] Сохраняем блок через официальную кнопку...');
                saveButton.click();
                
                // 7. Ждем сохранения на сервере
                await new Promise(resolve => setTimeout(resolve, 800));
                console.log('[SHIFT] Блок успешно сохранен на сервере Tilda.');
                
                // 8. Обновляем метаданные блока
                updateBlockMetadata(newRecId, solution);
            } else {
                console.error('[SHIFT] Кнопка сохранения не найдена!');
            }
        } else {
            console.error('[SHIFT] Поле для HTML-кода не найдено!');
        }
        
        // 9. Закрываем библиотеку блоков
        if (tildaAPI.tpLibraryHide) {
            window.tp__library__hide();
            console.log('[SHIFT] Библиотека блоков закрыта.');
        }
        
    } catch (error) {
        console.error('[SHIFT] Ошибка при работе с официальным Tilda API:', error);
        throw error;
    }
}

/**
 * Обновляет метаданные блока (название, описание)
 */
function updateBlockMetadata(recId, solution) {
    console.log('[SHIFT] Обновляем метаданные блока:', recId);
    
    try {
        const record = document.querySelector(`#${recId}`);
        if (!record) {
            console.error('[SHIFT] Блок не найден:', recId);
            return;
        }
        
        // Обновляем только метаданные блока
        record.setAttribute('data-title', solution.title);
        
        // Обновляем заголовок в интерфейсе если есть
        const titleElement = record.querySelector('[data-title]');
        if (titleElement) {
            titleElement.setAttribute('data-title', solution.title);
        }
        
        console.log('[SHIFT] Метаданные блока обновлены:', {
            recId: recId,
            title: solution.title,
            blockCode: solution.blockCode
        });
        
    } catch (error) {
        console.error('[SHIFT] Ошибка при обновлении метаданных блока:', error);
    }
}

/**
 * Удаляет блок через официальный Tilda API
 */
function deleteBlock(recId) {
    console.log('[SHIFT] Удаляем блок через официальный Tilda API:', recId);
    
    try {
        if (typeof window.record__del === 'function') {
            window.record__del(recId);
            console.log('[SHIFT] Блок удален:', recId);
        } else {
            console.error('[SHIFT] Функция record__del не найдена в Tilda API');
        }
    } catch (error) {
        console.error('[SHIFT] Ошибка при удалении блока:', error);
    }
}

/**
 * Переключает видимость блока (включить/выключить)
 */
function toggleBlockVisibility(recId) {
    console.log('[SHIFT] Переключаем видимость блока:', recId);
    
    try {
        // Находим блок по ID
        const blockElement = document.getElementById(recId);
        if (!blockElement) {
            console.error('[SHIFT] Блок не найден:', recId);
            return;
        }
        
        // Находим кнопку выключения внутри блока
        const toggleButton = blockElement.querySelector('.tp-record-edit-icons__item_off');
        if (toggleButton && typeof window.record__onoff === 'function') {
            window.record__onoff(toggleButton);
            console.log('[SHIFT] Видимость блока переключена:', recId);
        } else {
            console.error('[SHIFT] Кнопка выключения или функция record__onoff не найдены');
        }
    } catch (error) {
        console.error('[SHIFT] Ошибка при переключении видимости блока:', error);
    }
}

/**
 * Открывает панель настроек блока
 */
function openBlockSettings(recId, panelType = 'content') {
    console.log('[SHIFT] Открываем панель настроек блока:', recId, 'тип:', panelType);
    
    try {
        if (typeof window.panel__editrecord === 'function') {
            window.panel__editrecord(recId, panelType);
            console.log('[SHIFT] Панель настроек открыта для блока:', recId);
        } else {
            console.error('[SHIFT] Функция panel__editrecord не найдена в Tilda API');
        }
    } catch (error) {
        console.error('[SHIFT] Ошибка при открытии панели настроек:', error);
    }
}

/**
 * Добавляет блок альтернативным способом (только для отладки)
 * ВНИМАНИЕ: Этот метод НЕ рекомендуется для продакшена!
 * Используйте только для тестирования, когда официальный API недоступен.
 */
async function addBlockAlternative(solution) {
    console.warn('[SHIFT] ВНИМАНИЕ: Используется альтернативный способ создания блока!');
    console.warn('[SHIFT] Этот блок НЕ будет сохранен на сервере Tilda!');
    console.log('[SHIFT] Добавляем блок альтернативным способом (только для отладки)...');
    
    try {
        // Проверяем, есть ли официальный API
        if (typeof window.tp__addRecord === 'function') {
            console.error('[SHIFT] Официальный Tilda API доступен! Используйте addBlockWithTildaAPI() вместо этого метода.');
            return;
        }
        
        // Создаем блок с полной структурой Tilda (только для отладки)
        const blockContainer = document.querySelector('#allrecords') || 
                              document.querySelector('.t-container') || 
                              document.querySelector('body');
        
        if (!blockContainer) {
            console.error('[SHIFT] Контейнер для блоков не найден');
            return;
        }
        
        // Генерируем уникальный ID для блока
        const uniqueId = generateUniqueId();
        const recordId = 'record' + uniqueId;
        const recId = 'rec' + uniqueId;
        
        console.log('[SHIFT] Генерируем уникальные ID для блока (отладка):', {
            uniqueId: uniqueId,
            recordId: recordId,
            recId: recId,
            blockCode: solution.blockCode
        });
        
        // Создаем HTML блока с полной структурой Tilda
        const uniqueBlockCode = solution.blockCode + '_' + uniqueId;
        const blockHTML = `
            <div class="record" id="${recordId}" recordid="${recordId}" off="n" data-record-type="131" data-record-category="12" data-record-cod="${uniqueBlockCode}" data-title="${solution.title}" style="z-index: 1000; position: relative;">
                <div class="t-record-container">
                    <div id="${recId}" class="r t-rec t-rec_pt_210" style="padding-top:210px;" data-animationappear="off">
                        <!-- ${uniqueBlockCode} (ОТЛАДКА) -->
                        <div class="t-container">
                            <div class="t-col t-col_10 t-prefix_1">
                                <div class="tmod" style="background-color:#fff3cd; border: 2px dashed #ffc107;">
                                    <div class="tmod__header">
                                        <div class="tmod__img" style="background-image:url('${solution.img}')"></div>
                                        <div class="tmod__text">
                                            <div>⚠️ ОТЛАДОЧНЫЙ БЛОК: ${solution.description}</div>
                                        </div>
                                    </div>
                                    <div class="tmod__cards">
                                        <div class="tmod__card tmod__card_large">
                                            <pre><code class="hljs xml">${solution.htmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <script type="text/javascript">
                            t_onReady(function () {
                                var rec = document.querySelector('#${recId}');
                                if (!rec) return;
                                var codeBlocks = rec.querySelectorAll('pre code');
                                Array.prototype.forEach.call(codeBlocks, function (block) {
                                    t_onFuncLoadObj(function () {
                                        if (typeof hljs !== 'undefined' && hljs.highlightBlock) {
                                            hljs.highlightBlock(block);
                                        }
                                    });
                                });
                            });
                            
                            function t_onFuncLoadObj(okFunc) {
                                if (typeof hljs !== 'undefined' && hljs.highlightBlock === 'function') {
                                    okFunc();
                                } else {
                                    setTimeout(function checkFuncExist() {
                                        if (typeof hljs !== 'undefined' && hljs.highlightBlock === 'function') {
                                            okFunc();
                                            return;
                                        }
                                        if (document.readyState === 'complete' && typeof hljs !== 'undefined' && hljs.highlightBlock !== 'function') {
                                            console.warn('hljs.highlightBlock is undefined');
                                        }
                                        setTimeout(checkFuncExist, 100);
                                    });
                                }
                            }
                        </script>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем блок в контейнер
        blockContainer.insertAdjacentHTML('beforeend', blockHTML);
        console.warn('[SHIFT] ОТЛАДОЧНЫЙ блок создан в DOM:', {
            recordId: recordId,
            recId: recId,
            uniqueBlockCode: uniqueBlockCode,
            solution: solution.title,
            warning: 'Этот блок НЕ будет сохранен на сервере!'
        });
        
        // Прокручиваем к блоку
        const newBlock = document.querySelector(`#${recId}`);
        if (newBlock) {
            newBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
    } catch (error) {
        console.error('[SHIFT] Ошибка при создании отладочного блока:', error);
        throw error;
    }
}

// ============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ОТЛАДКИ
// ============================================================================

// Экспортируем функции в глобальную область видимости для отладки
window.shiftDebug = {
    // Основные функции
    addBlockWithTildaAPI,
    addBlockAlternative,
    deleteBlock,
    toggleBlockVisibility,
    openBlockSettings,
    updateBlockMetadata,
    
    // Утилиты
    waitForTildaAPI,
    generateUniqueId,
    getSolutionCodeFromBlockCode,
    
    // Данные
    SHIFT_SOLUTIONS,
    
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
    
    testAddBlock: function(solutionCode) {
        const solution = SHIFT_SOLUTIONS.find(s => s.solutionCode === solutionCode);
        if (solution) {
            console.log('[SHIFT DEBUG] Тестируем добавление блока:', solution.title);
            addBlockWithTildaAPI(solution, { tpAddRecord: true, panelEditRecord: true, tpLibraryHide: true });
        } else {
            console.error('[SHIFT DEBUG] Решение не найдено:', solutionCode);
        }
    },
    
    listBlocks: function() {
        const blocks = document.querySelectorAll('.record[data-record-cod^="SHF"], .record[data-record-cod^="T123_"]');
        console.log('[SHIFT DEBUG] Найденные SHIFT блоки:', blocks.length);
        blocks.forEach((block, index) => {
            const recId = block.id;
            const recordCod = block.getAttribute('data-record-cod');
            const title = block.getAttribute('data-title');
            console.log(`[SHIFT DEBUG] Блок ${index + 1}:`, { recId, recordCod, title });
        });
        return blocks;
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
    
    try {
        // Ждем загрузки элементов Tilda
        console.log('[SHIFT] Ожидание элементов Tilda...');
        const tildaLibraryContainer = await waitForElement('.tp-library__body');
        console.log('[SHIFT] Библиотека Tilda найдена');
        
        // Создаем блоки SHIFT
        createShiftBlocks();
        
        // Создаем категорию в библиотеке
        createShiftCategory();
        
        console.log('[SHIFT] SHIFT Extension успешно инициализирован!');
        
    } catch (error) {
        console.error('[SHIFT] Ошибка инициализации:', error);
    }
}

// ============================================================================
// ЗАПУСК
// ============================================================================

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShiftExtension);
} else {
    initShiftExtension();
}

// Экспортируем для глобального доступа
window.SHIFT_EXTENSION = {
    init: initShiftExtension,
    solutions: SHIFT_SOLUTIONS,
    createBlocks: createShiftBlocks,
    createCategory: createShiftCategory
};
