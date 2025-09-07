// content.js - Главный скрипт, встраиваемый в Tilda

/**
 * Функция для надежного ожидания появления элемента на странице.
 * Она следит за изменениями на странице и возвращает элемент, как только он появится.
 * @param {string} selector - CSS-селектор элемента, который мы ждем.
 * @returns {Promise<Element>}
 */
function waitForElement(selector) {
    return new Promise(resolve => {
        // Если элемент уже есть на странице, сразу его возвращаем.
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        // Если элемента еще нет, создаем наблюдателя.
        const observer = new MutationObserver(mutations => {
            // Как только в DOM происходят изменения, проверяем, не появился ли наш элемент.
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect(); // Прекращаем наблюдение, чтобы не тратить ресурсы.
            }
        });

        // Начинаем наблюдение за всем документом.
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

/**
 * Главная асинхронная функция, которая запускает всю логику расширения.
 */
async function main() {
    console.log('SHIFT Extension: Content script запущен.');
    
    try {
        // 1. Ждем, пока Tilda полностью отрисует свою библиотеку блоков.
        console.log('[CONTENT] Ожидание элементов Tilda...');
        const tildaLibraryContainer = await waitForElement('.tp-library__body');
        const rightSideContainer = await waitForElement('.tp-library-rightside');
        console.log('[CONTENT] Библиотека Tilda найдена. Начинаем интеграцию.');
        
        if (!tildaLibraryContainer || !rightSideContainer) {
            throw new Error('Не удалось найти контейнеры библиотеки Tilda');
        }

        // 2. Слушаем изменения в хранилище (когда пользователь входит/выходит).
        // Это позволяет панели обновляться в реальном времени без перезагрузки страницы.
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && (changes.userStatus || changes.allSolutions)) {
                console.log('[CONTENT] Данные пользователя изменились. Перерисовываем панель...', changes);
                // Запрашиваем свежие данные и перерисовываем панель.
                chrome.storage.local.get(['userStatus', 'allSolutions'], (storage) => {
                    try {
                        renderShiftPanel(tildaLibraryContainer, rightSideContainer, storage.userStatus, storage.allSolutions);
                    } catch (error) {
                        console.error('[CONTENT] Ошибка при перерисовке панели:', error);
                    }
                });
            }
        });

        // 3. Первоначальная загрузка данных при открытии страницы Tilda.
        chrome.storage.local.get(['userStatus', 'allSolutions', 'userProfile'], (storage) => {
            try {
                console.log('[CONTENT] Загружены данные из storage:', {
                    userStatus: storage.userStatus,
                    allSolutionsCount: storage.allSolutions?.length,
                    userProfile: !!storage.userProfile,
                    allKeys: Object.keys(storage)
                });
                
                if (storage.userStatus && storage.allSolutions) {
                    console.log('[CONTENT] Найдены данные пользователя. Рисуем панель.', storage);
                    renderShiftPanel(tildaLibraryContainer, rightSideContainer, storage.userStatus, storage.allSolutions);
                } else {
                    console.log('[CONTENT] Данные пользователя не найдены. Панель не будет отрисована до входа.');
                    console.log('[CONTENT] Попробуем запросить данные у background...');
                    
                    // Запрашиваем обновление данных у background
                    chrome.runtime.sendMessage({ type: 'REQUEST_USER_DATA' }, (response) => {
                        console.log('[CONTENT] Ответ от background:', response);
                        if (response && response.success) {
                            // Ждем немного и проверяем данные снова
                            setTimeout(() => {
                                chrome.storage.local.get(['userStatus', 'allSolutions'], (updatedStorage) => {
                                    console.log('[CONTENT] Обновленные данные после запроса:', updatedStorage);
                                    if (updatedStorage.userStatus && updatedStorage.allSolutions) {
                                        console.log('[CONTENT] Данные получены! Рисуем панель.');
                                        renderShiftPanel(tildaLibraryContainer, rightSideContainer, updatedStorage.userStatus, updatedStorage.allSolutions);
                                    }
                                });
                            }, 1000);
                        }
                    });
                }
            } catch (error) {
                console.error('[CONTENT] Ошибка при первоначальной загрузке:', error);
            }
        });
        
    } catch (error) {
        console.error('[CONTENT] КРИТИЧЕСКАЯ ОШИБКА в main():', error);
    }
}

/**
 * Функция отрисовки кастомной категории SHIFT и ее содержимого.
 * @param {Element} libraryContainer - Левая панель библиотеки Tilda (с категориями).
 * @param {Element} rightSideContainer - Правая панель, где отображаются блоки.
 * @param {string} userStatus - Статус пользователя ('free', 'advanced', 'expired').
 * @param {Array} allSolutions - Массив всех решений из базы данных Supabase.
 */
function renderShiftPanel(libraryContainer, rightSideContainer, userStatus, allSolutions) {
    console.log('[CONTENT] renderShiftPanel вызвана с параметрами:', { userStatus, allSolutions: allSolutions?.length });
    
    // Если данных нет, ничего не делаем.
    if (!userStatus || !allSolutions) {
        console.log('[CONTENT] renderShiftPanel: недостаточно данных для отрисовки');
        return;
    }
    
    try {

    // Удаляем старые версии панели, если они есть, чтобы избежать дублирования.
    const oldCategory = document.getElementById('shift-category-container');
    if (oldCategory) oldCategory.remove();
    const oldBlocks = document.getElementById('tplslist-shift-mods');
    if (oldBlocks) oldBlocks.remove();

    // --- Создание категории в левой панели ---
    const categoryHTML = `
        <div class="tp-library__type-body" id="shift-category-container" data-library-type-id="-shift-mods">
            <div class="tp-library__type">
                <div class="tp-library__type-title-wrapper">
                    <div class="tp-library__type-title" style="font-weight: 600;">SHIFT Модификации</div>
                </div>
                <div class="tp-library__type-icon-wrapper">
                    <div class="tp-library__type-icon-plus">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="11" viewBox="0 0 20 11"><path d="m.83422852.66864726 9.15974111 9.15974112L19.2407318.58162626" stroke="#000" opacity=".9" fill="none"/></svg>
                    </div>
                </div>
            </div>
        </div>
    `;
    libraryContainer.insertAdjacentHTML('afterbegin', categoryHTML);

    // --- Создание контейнера для карточек в правой панели ---
    const shiftBlocksContainerHTML = `
        <div class="tp-library__tpls-list-body" id="tplslist-shift-mods" data-tpls-for-type="-shift-mods">
            <div class="tp-library__tpls-list-body__container">
                <!-- Сюда будут вставлены карточки решений -->
            </div>
        </div>
    `;
    rightSideContainer.insertAdjacentHTML('beforeend', shiftBlocksContainerHTML);
    const blocksContainer = rightSideContainer.querySelector('#tplslist-shift-mods .tp-library__tpls-list-body__container');

    // --- Генерация и вставка карточек решений ---
    // Проверяем, что конфиг загружен
    if (typeof shiftSolutionsConfig === 'undefined') {
        console.error('SHIFT: shiftSolutionsConfig не найден. Убедитесь, что content/config.js загружен перед content.js');
        return;
    }
    
    shiftSolutionsConfig.forEach(configBlock => {
        const solutionFromDB = allSolutions.find(s => s.solution_code === configBlock.solutionCode);
        if (!solutionFromDB) {
            console.warn(`SHIFT: Решение "${configBlock.solutionCode}" из config.js не найдено в базе данных.`);
            return;
        }

        const hasAccess = (userStatus === 'advanced' || solutionFromDB.is_free);
        const isFreeTier = solutionFromDB.is_free;
        const icon = configBlock.img || 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_html.png';
        const lockIcon = hasAccess ? '' : '🔒';
        const cardClass = hasAccess ? '' : 'locked';

        const blockCardHTML = `
            <div class="tp-library__tpl-body" data-solution-code="${configBlock.solutionCode}" data-tilda-block-id="${configBlock.tildaBlockId}">
                <div class="tp-library__tpl-wrapper ${cardClass}">
                    <div class="tp-library__tpl-icon__wrapper">
                        <img class="tp-library__tpl-icon" src="${icon}">
                    </div>
                    <div class="tp-library__tpl-bottom-wrapper">
                        <div class="tp-library__tpl-caption">
                            <span class="tp-library__tpl-title">${lockIcon} ${configBlock.title}</span>
                        </div>
                    </div>
                    <div class="solution-tier" style="${isFreeTier ? '' : 'background-color: #D1FAE5; color: #065F46;'}">
                        ${isFreeTier ? 'Бесплатно' : 'Продвинутый'}
                    </div>
                </div>
            </div>
        `;
        blocksContainer.insertAdjacentHTML('beforeend', blockCardHTML);
    });

        // "Оживляем" все элементы
        addPanelListeners();
        console.log('[CONTENT] renderShiftPanel завершена успешно');
        
    } catch (error) {
        console.error('[CONTENT] Ошибка в renderShiftPanel:', error);
    }
}

/**
 * Добавляет обработчики событий для новой категории и карточек.
 */
function addPanelListeners() {
    console.log('[CONTENT] addPanelListeners: добавление обработчиков событий');
    
    try {
        const categoryButton = document.getElementById('shift-category-container');
        const blocksPanel = document.getElementById('tplslist-shift-mods');
        
        if (!categoryButton || !blocksPanel) {
            console.error('[CONTENT] addPanelListeners: не найдены элементы для добавления обработчиков');
            return;
        }

    // Клик по категории "SHIFT Модификации"
    if (categoryButton) {
        categoryButton.addEventListener('click', () => {
            // Логика Tilda для переключения активной категории
            document.querySelectorAll('.tp-library__type-body_active').forEach(el => el.classList.remove('tp-library__type-body_active'));
            categoryButton.classList.add('tp-library__type-body_active');
            
            document.querySelectorAll('.tp-library__tpls-list-body_active').forEach(el => el.classList.remove('tp-library__tpls-list-body_active'));
            blocksPanel.classList.add('tp-library__tpls-list-body_active');
            
            document.querySelector('.tp-library').classList.add('tp-library_rightsideopened');
        });
    }

    // Клик по карточке решения
    document.querySelectorAll('#tplslist-shift-mods .tp-library__tpl-body').forEach(card => {
        card.addEventListener('click', () => {
            const wrapper = card.querySelector('.tp-library__tpl-wrapper');
            if (wrapper.classList.contains('locked')) {
                alert('Для доступа к этой модификации необходим "Продвинутый" тариф. Пожалуйста, обновите вашу подписку.');
                return;
            }

            const tildaBlockId = card.dataset.tildaBlockId;
            const solutionCode = card.dataset.solutionCode;

            // Используем встроенную функцию Tilda для добавления блока
            if (typeof window.tp__addRecord === 'function') {
                console.log(`SHIFT: Добавляем блок Tilda с ID: ${tildaBlockId}`);
                window.tp__addRecord(tildaBlockId, window.afterid || '');

                // Динамически загружаем и выполняем скрипт для этой модификации
                const scriptPath = `solutions/${solutionCode}/${solutionCode}.js`;
                const scriptUrl = chrome.runtime.getURL(scriptPath);
                
                const script = document.createElement('script');
                script.src = scriptUrl;
                script.type = 'module'; // Важно, если ваши модули используют import/export
                document.head.appendChild(script);
                script.onload = () => console.log(`SHIFT: Скрипт для "${solutionCode}" успешно загружен и выполнен.`);
                script.onerror = () => console.error(`SHIFT: Не удалось загрузить скрипт: ${scriptPath}`);
                
                // Закрываем библиотеку блоков
                if (typeof window.tp__library__hide === 'function') {
                    window.tp__library__hide();
                }
            } else {
                console.error('[CONTENT] Функция Tilda `tp__addRecord` не найдена.');
            }
        });
    });
    
    } catch (error) {
        console.error('[CONTENT] Ошибка в addPanelListeners:', error);
    }
}

// Запускаем весь процесс
main();

  