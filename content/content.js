// content.js - Главный скрипт, встраиваемый в Tilda (РЕЖИМ ОТЛАДКИ)
console.log('SHIFT Extension: Content script loaded and running.');

/**
 * Функция для надежного ожидания появления элемента на странице.
 */
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

/**
 * Главная функция инициализации панели SHIFT.
 */
async function initShiftPanel() {
    console.log('[DEBUG] 1. Waiting for Tilda library container (.tp-library__body)...');
    const tildaLibraryContainer = await waitForElement('.tp-library__body');
    console.log('[DEBUG] 2. Tilda library container FOUND!');

    // Слушаем изменения в хранилище (когда пользователь входит/выходит).
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('[DEBUG] 5. Storage data changed! Re-rendering panel.');
            const oldPanel = document.getElementById('shift-category-container');
            if (oldPanel) oldPanel.remove();
            const oldBlocks = document.getElementById('tplslistshift-mods');
            if (oldBlocks) oldBlocks.remove();

            chrome.storage.local.get(['userStatus', 'allSolutions'], (storage) => {
                renderShiftPanel(tildaLibraryContainer, storage.userStatus, storage.allSolutions);
            });
        }
    });

    // Первоначальная загрузка данных при открытии страницы Tilda.
    console.log('[DEBUG] 3. Requesting initial data from storage...');
    chrome.storage.local.get(['userStatus', 'allSolutions'], (storage) => {
        if (storage.userStatus && storage.allSolutions) {
            console.log('[DEBUG] 4. Initial data FOUND in storage. Rendering panel.', storage);
            renderShiftPanel(tildaLibraryContainer, storage.userStatus, storage.allSolutions);
        } else {
            console.error('[DEBUG] 4. CRITICAL: No initial user data found. Panel will not be rendered. Please log in via the popup.');
        }
    });
}

/**
 * Функция отрисовки кастомной категории SHIFT и ее содержимого.
 */
function renderShiftPanel(libraryContainer, userStatus, allSolutions) {
    if (!userStatus || !allSolutions) {
        console.error('[DEBUG] RENDER CANCELED: Missing userStatus or allSolutions.');
        return;
    }

    if (document.getElementById('shift-category-container')) {
        console.log('[DEBUG] Panel already exists. Skipping render.');
        return;
    }

    console.log('[DEBUG] 6. Rendering panel with userStatus:', userStatus, 'and', allSolutions.length, 'solutions from DB.');

    // 1. Создаем и вставляем нашу кастомную категорию
    const categoryHTML = `...`; // (HTML-код категории)
    libraryContainer.insertAdjacentHTML('afterbegin', categoryHTML);
    console.log('[DEBUG] 7. Injected category "SHIFT Модификации".');

    // 2. Генерируем карточки для решений
    const blocksHTML = shiftSolutionsConfig.map(configBlock => {
        const solutionFromDB = allSolutions.find(s => s.solution_code === configBlock.solutionCode);
        if (!solutionFromDB) {
            console.warn(`[DEBUG] Solution "${configBlock.solutionCode}" from config.js not found in database.`);
            return '';
        }
        const hasAccess = (userStatus === 'advanced' || solutionFromDB.is_free);
        return `...`; // (HTML-код карточки)
    }).join('');

    if (!blocksHTML.trim()) {
        console.warn('[DEBUG] No blocks were generated. Check if solution codes in config.js match those in the database.');
    }

    // 3. Создаем контейнер для карточек в правой панели
    const rightSideContainer = document.querySelector('.tp-library-rightside');
    if (!rightSideContainer) {
        console.error('[DEBUG] CRITICAL: Could not find Tilda\'s right side container (.tp-library-rightside)!');
        return;
    }
    const shiftBlocksContainerHTML = `...`; // (HTML-код контейнера)
    rightSideContainer.insertAdjacentHTML('beforeend', shiftBlocksContainerHTML);
    console.log('[DEBUG] 8. Injected blocks container into right side panel.');
    
    // 4. "Оживляем" элементы
    addPanelListeners();
}

/**
 * Добавляет обработчики событий.
 */
function addPanelListeners() {
    // ... (код этой функции остается без изменений)
}

// Запускаем весь процесс
initShiftPanel();

