// Тестовый скрипт для проверки интеграции SHIFT с Tilda
// Запустите этот скрипт в консоли браузера на странице Tilda

console.log('🧪 Тестирование интеграции SHIFT с Tilda...');

// Проверяем наличие глобальных переменных Tilda
function testTildaGlobals() {
    console.log('📋 Проверка глобальных переменных Tilda:');
    
    const globals = [
        'dbmBlocks',
        'tp__addRecord',
        'tp__library__addEvents',
        'tp__library__addEvents__toCards',
        'tp__library__hide'
    ];
    
    globals.forEach(global => {
        const exists = typeof window[global] !== 'undefined';
        const type = exists ? typeof window[global] : 'undefined';
        console.log(`  ${exists ? '✅' : '❌'} ${global}: ${exists ? `найдено (${type})` : 'не найдено'}`);
        
        // Дополнительная информация для dbmBlocks
        if (global === 'dbmBlocks' && exists) {
            console.log(`    📦 Количество блоков: ${window[global].length}`);
            const shiftBlocks = window[global].filter(b => b.cod && b.cod.startsWith('SHF'));
            console.log(`    🧩 Блоков SHIFT: ${shiftBlocks.length}`);
        }
    });
}

// Проверяем данные расширения
function testExtensionData() {
    console.log('📊 Проверка данных расширения:');
    
    // Проверяем данные пользователя
    const userStatus = window.shiftUserStatus;
    const allSolutions = window.shiftAllSolutions;
    
    console.log(`  👤 Статус пользователя: ${userStatus || 'не определен'}`);
    console.log(`  📦 Количество решений: ${allSolutions ? allSolutions.length : 'не загружены'}`);
    
    if (allSolutions) {
        allSolutions.forEach(solution => {
            console.log(`    - ${solution.solution_code}: ${solution.name} (${solution.is_free ? 'бесплатно' : 'платно'})`);
        });
    }
}

// Проверяем блоки SHIFT
function testShiftBlocks() {
    console.log('🧩 Проверка блоков SHIFT:');
    
    if (typeof dbmBlocks !== 'undefined') {
        const shiftBlocks = dbmBlocks.filter(block => block.cod.startsWith('SHF'));
        console.log(`  📦 Найдено блоков SHIFT: ${shiftBlocks.length}`);
        
        shiftBlocks.forEach(block => {
            console.log(`    - ${block.cod}: ${block.name} (доступ: ${block.disableforplan0 === 'n' ? 'разрешен' : 'запрещен'})`);
        });
    } else {
        console.log('  ❌ dbmBlocks не найден');
    }
}

// Проверяем элементы DOM
function testDOMElements() {
    console.log('🌐 Проверка элементов DOM:');
    
    const elements = [
        '.tp-library',
        '.tp-library__type-body',
        '.tp-library__tpls-list-body',
        '#shift-category-container',
        '#tplslist-shift-mods'
    ];
    
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        console.log(`  ${element ? '✅' : '❌'} ${selector}: ${element ? 'найден' : 'не найден'}`);
    });
}

// Проверяем Chrome Extension API
function testChromeAPI() {
    console.log('🔧 Проверка Chrome Extension API:');
    
    const apis = [
        'chrome.runtime.getURL',
        'chrome.storage.local.get',
        'chrome.runtime.sendMessage'
    ];
    
    apis.forEach(api => {
        const exists = typeof eval(api) !== 'undefined';
        console.log(`  ${exists ? '✅' : '❌'} ${api}: ${exists ? 'доступен' : 'не доступен'}`);
    });
}

// Основная функция тестирования
function runAllTests() {
    console.log('🚀 Запуск всех тестов...\n');
    
    testTildaGlobals();
    console.log('');
    
    testExtensionData();
    console.log('');
    
    testShiftBlocks();
    console.log('');
    
    testDOMElements();
    console.log('');
    
    testChromeAPI();
    console.log('');
    
    console.log('✅ Тестирование завершено!');
}

// Запускаем тесты
runAllTests();

// Дополнительные утилиты для тестирования
window.testShiftIntegration = {
    runAllTests,
    testTildaGlobals,
    testExtensionData,
    testShiftBlocks,
    testDOMElements,
    testChromeAPI,
    
    // Функция для принудительного создания блоков SHIFT
    forceCreateBlocks: function() {
        console.log('🔄 Принудительное создание блоков SHIFT...');
        
        if (typeof dbmCreateShiftBlocks === 'function') {
            dbmCreateShiftBlocks();
            console.log('✅ Блоки SHIFT созданы');
        } else {
            console.log('❌ Функция dbmCreateShiftBlocks не найдена');
        }
    },
    
    // Функция для тестирования добавления блока
    testAddBlock: function(blockCode = 'SHF001') {
        console.log(`🧪 Тестирование добавления блока ${blockCode}...`);
        
        if (typeof tp__addRecord === 'function') {
            tp__addRecord(blockCode);
            console.log(`✅ Блок ${blockCode} добавлен`);
        } else {
            console.log('❌ Функция tp__addRecord не найдена');
        }
    },
    
    // Функция для ожидания Tilda API
    waitForTildaAPI: function() {
        return new Promise((resolve, reject) => {
            console.log('⏳ Ожидание загрузки Tilda API...');
            
            let attempts = 0;
            const maxAttempts = 30; // 3 секунды максимум
            const interval = 100;
            
            const checkAPI = () => {
                attempts++;
                
                // Проверяем tp__addRecord, но не критично если его нет
                const tpAddRecordLoaded = typeof window.tp__addRecord !== 'undefined';
                
                if (tpAddRecordLoaded) {
                    console.log(`✅ tp__addRecord загружен после ${attempts} попыток`);
                } else if (attempts >= maxAttempts) {
                    console.warn(`⚠️ tp__addRecord не загрузился за ${maxAttempts} попыток, продолжаем без него`);
                }
                
                // Создаем dbmBlocks если его нет
                if (typeof window.dbmBlocks === 'undefined') {
                    console.log('📦 Создаем dbmBlocks массив...');
                    window.dbmBlocks = [];
                }
                
                // Разрешаем Promise независимо от tp__addRecord
                resolve();
            };
            
            checkAPI();
        });
    }
};

console.log('💡 Доступные команды:');
console.log('  testShiftIntegration.runAllTests() - запустить все тесты');
console.log('  testShiftIntegration.forceCreateBlocks() - принудительно создать блоки');
console.log('  testShiftIntegration.testAddBlock("SHF001") - протестировать добавление блока');
console.log('  testShiftIntegration.waitForTildaAPI() - дождаться загрузки Tilda API');
console.log('');
console.log('🔧 Если tp__addRecord не найден:');
console.log('  1. Убедитесь, что вы на странице редактора Tilda');
console.log('  2. Попробуйте: testShiftIntegration.waitForTildaAPI()');
console.log('  3. Проверьте, что библиотека блоков открыта');
console.log('');
console.log('📋 Проверка блоков SHIFT:');
console.log('  console.log(dbmBlocks.filter(b => b.cod.startsWith("SHF")));');
