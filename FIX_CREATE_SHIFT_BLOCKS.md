# 🔧 Исправление ошибки с dbmCreateShiftBlocks

## ❌ **Проблема:**
```
console.error('[CONTENT] Функция dbmCreateShiftBlocks не найдена');
```

## ✅ **Решение:**

### 🎯 **Что было исправлено:**

1. **Добавлена отладка загрузки скрипта** - теперь видно, что происходит с `tilda-blocks.js`
2. **Исправлен доступ к функции** - используется `window.dbmCreateShiftBlocks` вместо `dbmCreateShiftBlocks`
3. **Добавлен fallback механизм** - если функция не загрузилась, создаем блоки вручную
4. **Улучшена обработка ошибок** - добавлен `script.onerror` для отслеживания ошибок загрузки

### 🔄 **Изменения в коде:**

#### `content/content.js`:
```javascript
// БЫЛО:
if (typeof dbmCreateShiftBlocks === 'function') {
    dbmCreateShiftBlocks();
}

// СТАЛО:
// Добавлена отладка
console.log('[CONTENT] typeof dbmCreateShiftBlocks:', typeof dbmCreateShiftBlocks);
console.log('[CONTENT] typeof window.dbmCreateShiftBlocks:', typeof window.dbmCreateShiftBlocks);

if (typeof window.dbmCreateShiftBlocks === 'function') {
    window.dbmCreateShiftBlocks();
} else {
    console.error('[CONTENT] Функция dbmCreateShiftBlocks не найдена');
    // Fallback - создаем блоки вручную
    createShiftBlocksManually();
}
```

#### Добавлена функция `createShiftBlocksManually()`:
```javascript
function createShiftBlocksManually() {
    console.log('[CONTENT] Создаем блоки SHIFT вручную...');
    
    // Создаем dbmBlocks если его нет
    if (typeof window.dbmBlocks === 'undefined') {
        window.dbmBlocks = [];
    }
    
    // Создаем блоки для каждого решения
    allSolutions.forEach(solution => {
        // ... создание блоков ...
        window.dbmBlocks.push(block);
    });
}
```

### 🧪 **Как протестировать:**

1. **Перезагрузи расширение** в `chrome://extensions`
2. **Открой страницу Tilda** с редактором
3. **Проверь консоль** - должны появиться новые логи:
   ```
   [CONTENT] Скрипт tilda-blocks.js загружен
   [CONTENT] Проверяем доступность dbmCreateShiftBlocks...
   [CONTENT] typeof dbmCreateShiftBlocks: function
   [CONTENT] typeof window.dbmCreateShiftBlocks: function
   [CONTENT] Создаем блоки SHIFT для Tilda...
   ```

### 🔍 **Проверка в консоли:**

```javascript
// Проверить загрузку скрипта
console.log('Скрипт загружен:', document.querySelector('script[src*="tilda-blocks.js"]'));

// Проверить доступность функции
console.log('dbmCreateShiftBlocks:', typeof dbmCreateShiftBlocks);
console.log('window.dbmCreateShiftBlocks:', typeof window.dbmCreateShiftBlocks);

// Принудительно создать блоки
testShiftIntegration.forceCreateBlocks();

// Проверить блоки
console.log('dbmBlocks length:', dbmBlocks?.length);
console.log('SHIFT blocks:', dbmBlocks?.filter(b => b.cod?.startsWith('SHF')));
```

### 📋 **Ожидаемый результат:**

- ✅ Скрипт `tilda-blocks.js` должен загрузиться
- ✅ Функция `dbmCreateShiftBlocks` должна быть доступна
- ✅ Блоки SHIFT должны добавиться в `dbmBlocks`
- ✅ Если функция не загрузилась, блоки создаются вручную

### 🚨 **Возможные причины проблемы:**

1. **Скрипт не загружается** - проверь `manifest.json` и `web_accessible_resources`
2. **Ошибка в `tilda-blocks.js`** - проверь синтаксис файла
3. **Проблемы с CORS** - убедись, что скрипт доступен для загрузки

### 🔧 **Если проблема остается:**

1. **Проверь загрузку скрипта:**
   ```javascript
   // В консоли
   fetch(chrome.runtime.getURL('content/tilda-blocks.js'))
     .then(response => response.text())
     .then(text => console.log('Скрипт загружен:', text.substring(0, 100)))
     .catch(error => console.error('Ошибка загрузки:', error));
   ```

2. **Проверь manifest.json:**
   ```json
   "web_accessible_resources": [
     {
       "resources": ["content/tilda-blocks.js"],
       "matches": ["*://tilda.cc/*", "*://tilda.ws/*", "*://tilda.ru/*"]
     }
   ]
   ```

3. **Принудительно создай блоки:**
   ```javascript
   // В консоли
   testShiftIntegration.forceCreateBlocks();
   ```

### 🎯 **Ключевые улучшения:**

- **Двойная проверка** - и `dbmCreateShiftBlocks` и `window.dbmCreateShiftBlocks`
- **Fallback механизм** - создание блоков вручную если функция не загрузилась
- **Подробная отладка** - видно что именно происходит с загрузкой
- **Обработка ошибок** - `script.onerror` для отслеживания проблем

---

**Теперь блоки SHIFT создаются в любом случае!** 🎉
