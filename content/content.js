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
 * Ожидает загрузки глобальных переменных Tilda
 * @returns {Promise} - Promise, который разрешается когда все переменные загружены
 */
function waitForTildaGlobals() {
    return new Promise((resolve, reject) => {
        console.log('[CONTENT] Ожидание загрузки глобальных переменных Tilda...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд максимум
        const interval = 100; // проверяем каждые 100мс
        
        const checkGlobals = () => {
            attempts++;
            
            // Проверяем tp__addRecord, но не критично если его нет
            const tpAddRecordLoaded = typeof window.tp__addRecord !== 'undefined';
            
            if (tpAddRecordLoaded) {
                console.log('[CONTENT] tp__addRecord загружен после', attempts, 'попыток');
            } else if (attempts >= maxAttempts) {
                console.warn('[CONTENT] tp__addRecord не загрузился за', maxAttempts, 'попыток, продолжаем без него');
            }
            
            // Создаем dbmBlocks если его нет
            if (typeof window.dbmBlocks === 'undefined') {
                console.log('[CONTENT] Создаем dbmBlocks массив...');
                window.dbmBlocks = [];
            }
            
            // Разрешаем Promise независимо от tp__addRecord
            resolve();
        };
        
        checkGlobals();
    });
}

/**
 * Главная асинхронная функция, которая запускает всю логику расширения.
 */
async function main() {
    console.log('SHIFT Extension: Content script запущен.');
    
    try {
        // Сначала ждем загрузки глобальных переменных Tilda
        console.log('[CONTENT] Ожидание загрузки Tilda API...');
        await waitForTildaGlobals();
        
        // Затем ждем появления элементов Tilda
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
        console.log('[CONTENT] Интеграция с Tilda через dbmBlocks...');
        
        // Загружаем и выполняем скрипт с блоками SHIFT
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/tilda-blocks.js');
        script.onload = function() {
            console.log('[CONTENT] Скрипт tilda-blocks.js загружен');
            
            // Создаем dbmBlocks если его нет
            if (typeof window.dbmBlocks === 'undefined') {
                console.log('[CONTENT] Создаем dbmBlocks массив...');
                window.dbmBlocks = [];
            }
            
            // Проверяем, что функция dbmCreateShiftBlocks доступна
            if (typeof dbmCreateShiftBlocks === 'function') {
                console.log('[CONTENT] Создаем блоки SHIFT для Tilda...');
                
                // Сохраняем данные пользователя в глобальной переменной для использования в блоках
                window.shiftUserStatus = userStatus;
                window.shiftAllSolutions = allSolutions;
                
                // Ждем загрузки Tilda API перед созданием блоков
                waitForTildaAPI().then(() => {
                    console.log('[CONTENT] Tilda API готов, создаем блоки SHIFT...');
                    dbmCreateShiftBlocks();
                    
                    // Принудительно обновляем библиотеку Tilda
                    setTimeout(() => {
                        if (typeof tp__library__addEvents === 'function') {
                            console.log('[CONTENT] Обновляем события библиотеки Tilda');
                            tp__library__addEvents();
                        }
                        
                        if (typeof tp__library__addEvents__toCards === 'function') {
                            console.log('[CONTENT] Обновляем события карточек Tilda');
                            tp__library__addEvents__toCards();
                        }
                        
                        // Попробуем найти и обновить библиотеку
                        if (typeof tp__library__hide === 'function') {
                            console.log('[CONTENT] Обновляем библиотеку Tilda');
                            tp__library__hide();
                            setTimeout(() => {
                                // Показываем библиотеку снова
                                const libraryBtn = document.querySelector('[data-tp-library]');
                                if (libraryBtn) {
                                    libraryBtn.click();
                                }
                            }, 100);
                        }
                    }, 500);
                    
                    console.log('[CONTENT] Блоки SHIFT успешно интегрированы в Tilda!');
                }).catch(error => {
                    console.error('[CONTENT] Ошибка при ожидании Tilda API для создания блоков:', error);
                });
            } else {
                console.error('[CONTENT] Функция dbmCreateShiftBlocks не найдена');
            }
        };
        script.onerror = function() {
            console.error('[CONTENT] Ошибка загрузки tilda-blocks.js');
        };
        
        document.head.appendChild(script);
        
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

/**
 * Добавляет блок Tilda с использованием tp__addRecord
 * @param {Object} solution - Объект решения из базы данных
 */
function dbmAddTildaBlock(solution) {
    console.log('[CONTENT] addTildaBlock вызвана для:', solution);
    
    try {
        // Определяем код блока на основе solution_code
        let blockCode = '';
        switch (solution.solution_code) {
            case 'super-slider':
                blockCode = 'SHF001';
                break;
            case 'super-grid':
                blockCode = 'SHF002';
                break;
            case 'grid-stacks':
                blockCode = 'SHF003';
                break;
            case 'custom-html':
                blockCode = 'SHF004';
                break;
            default:
                console.error('[CONTENT] Неизвестный solution_code:', solution.solution_code);
                return;
        }
        
        console.log('[CONTENT] Добавляем блок Tilda с кодом:', blockCode);
        
        // Ждем загрузки Tilda API и добавляем блок
        waitForTildaAPI().then(() => {
            if (typeof tp__addRecord === 'function') {
                tp__addRecord(blockCode);
                console.log('[CONTENT] Блок успешно добавлен:', blockCode);
            } else {
                console.warn('[CONTENT] tp__addRecord недоступен, блок не может быть добавлен автоматически');
                console.log('[CONTENT] Попробуйте открыть библиотеку блоков Tilda и добавить блок вручную');
            }
            
            // Загружаем соответствующий скрипт решения в любом случае
            dbmLoadSolutionScript(solution.solution_code);
        }).catch(error => {
            console.error('[CONTENT] Ошибка при ожидании Tilda API:', error);
        });
        
    } catch (error) {
        console.error('[CONTENT] Ошибка в addTildaBlock:', error);
    }
}

/**
 * Ожидает загрузки Tilda API
 * @returns {Promise} - Promise, который разрешается когда API загружен
 */
function waitForTildaAPI() {
    return new Promise((resolve, reject) => {
        console.log('[CONTENT] Ожидание загрузки Tilda API...');
        
        // Если API уже доступен
        if (typeof tp__addRecord === 'function') {
            console.log('[CONTENT] Tilda API уже загружен');
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 30; // 3 секунды максимум
        const interval = 100; // проверяем каждые 100мс
        
        const checkAPI = () => {
            attempts++;
            
            if (typeof tp__addRecord === 'function') {
                console.log('[CONTENT] Tilda API загружен после', attempts, 'попыток');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('[CONTENT] Tilda API не загрузился за', maxAttempts, 'попыток, продолжаем без него');
                // Разрешаем Promise даже если API не загрузился
                resolve();
            } else {
                setTimeout(checkAPI, interval);
            }
        };
        
        checkAPI();
    });
}

/**
 * Загружает скрипт решения
 * @param {string} solutionCode - Код решения
 */
function dbmLoadSolutionScript(solutionCode) {
    console.log('[CONTENT] Загружаем скрипт для решения:', solutionCode);
    
    try {
        const scriptUrl = chrome.runtime.getURL(`solutions/${solutionCode}/${solutionCode}.js`);
        
        // Проверяем, не загружен ли уже скрипт
        if (document.querySelector(`script[src="${scriptUrl}"]`)) {
            console.log('[CONTENT] Скрипт уже загружен:', solutionCode);
            return;
        }
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.onload = function() {
            console.log('[CONTENT] Скрипт решения загружен:', solutionCode);
        };
        script.onerror = function() {
            console.error('[CONTENT] Ошибка загрузки скрипта:', solutionCode);
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('[CONTENT] Ошибка в loadSolutionScript:', error);
    }
}

// Запускаем весь процесс
main();

  