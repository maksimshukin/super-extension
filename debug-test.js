// debug-test.js - Скрипт для тестирования расширения
// Запустите этот код в консоли браузера на странице Tilda для диагностики

console.log('=== SUPER EXTENSION DEBUG TEST ===');

// 1. Проверяем, загружен ли content script
console.log('1. Content script загружен:', !!window.superSolutionsConfig);

// 2. Проверяем данные в storage
chrome.storage.local.get(['userStatus', 'allSolutions', 'userProfile'], (data) => {
    console.log('2. Данные в storage:', data);
    
    if (!data.userStatus || !data.allSolutions) {
        console.log('❌ Данные пользователя отсутствуют');
        console.log('💡 Решение: Войдите в систему через popup расширения');
    } else {
        console.log('✅ Данные пользователя найдены');
        console.log('   - Статус:', data.userStatus);
        console.log('   - Решений:', data.allSolutions.length);
    }
});

// 3. Проверяем элементы Tilda
setTimeout(() => {
    const libraryBody = document.querySelector('.tp-library__body');
    const rightSide = document.querySelector('.tp-library-rightside');
    const superCategory = document.getElementById('super-category-container');
    
    console.log('3. Элементы Tilda:');
    console.log('   - .tp-library__body:', !!libraryBody);
    console.log('   - .tp-library-rightside:', !!rightSide);
    console.log('   - SUPER категория:', !!superCategory);
    
    if (!libraryBody || !rightSide) {
        console.log('❌ Библиотека Tilda не найдена');
        console.log('💡 Решение: Откройте библиотеку блоков в Tilda');
    } else {
        console.log('✅ Библиотека Tilda найдена');
    }
    
    if (!superCategory) {
        console.log('❌ SUPER категория не создана');
        console.log('💡 Решение: Проверьте логи content script');
    } else {
        console.log('✅ SUPER категория создана');
    }
}, 1000);

// 4. Проверяем функции Tilda
setTimeout(() => {
    console.log('4. Функции Tilda:');
    console.log('   - tp__addRecord:', typeof window.tp__addRecord);
    console.log('   - tp__library__hide:', typeof window.tp__library__hide);
    
    if (typeof window.tp__addRecord !== 'function') {
        console.log('❌ Функции Tilda недоступны');
        console.log('💡 Решение: Убедитесь, что вы на странице редактора Tilda');
    } else {
        console.log('✅ Функции Tilda доступны');
    }
}, 2000);

console.log('=== КОНЕЦ ТЕСТА ===');
console.log('Проверьте результаты выше и следуйте рекомендациям');
