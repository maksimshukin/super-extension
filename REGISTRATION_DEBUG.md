# 🔧 Диагностика проблем с регистрацией SHIFT Extension

## 🎯 **Добавлено детальное логирование для диагностики**

### **✅ Что было добавлено:**

1. **Детальное логирование Supabase подключения:**
   ```javascript
   console.log('[POPUP] Supabase config:', { url: SUPABASE_URL, keyLength: SUPABASE_ANON_KEY.length });
   console.log('[POPUP] Supabase client created:', supabaseClient);
   ```

2. **Тест подключения к Supabase:**
   ```javascript
   const { data, error } = await supabaseClient.auth.getSession();
   console.log('[POPUP] Supabase connection test:', { data, error });
   ```

3. **Детальное логирование данных регистрации:**
   ```javascript
   console.log('[POPUP] Register data:', {
       email: registerEmailInput.value,
       name: registerNameInput.value,
       passwordLength: registerPasswordInput.value.length
   });
   ```

4. **Детальное логирование ответа Supabase:**
   ```javascript
   console.log('[POPUP] SignUp response:', { data, error });
   ```

5. **Улучшенная обработка ошибок:**
   ```javascript
   if (error.message.includes('already registered')) {
       errorMessage = 'Пользователь с таким email уже существует.';
   } else if (error.message.includes('Invalid email')) {
       errorMessage = 'Неверный формат email.';
   } else if (error.message.includes('Password')) {
       errorMessage = 'Пароль слишком слабый.';
   } else {
       errorMessage = `Ошибка: ${error.message}`;
   }
   ```

6. **Детальное логирование валидации формы:**
   ```javascript
   console.log('[POPUP] Form validation:', {
       name: { valid: isRegisterNameValid, length: registerNameInput.value.length },
       email: { valid: isRegisterEmailValid, value: registerEmailInput.value },
       password: { strength: passwordStrength, strong: isRegisterPasswordStrong },
       checkboxes: { checked: areCheckboxesChecked, tos: tosCheck.checked, privacy: privacyCheck.checked },
       formValid: isRegisterFormValid,
       buttonDisabled: registerBtn.disabled
   });
   ```

## 🧪 **Как диагностировать проблему:**

### **1. Открой popup расширения:**
- Кликни по иконке расширения
- Открой DevTools (F12) → Console

### **2. Проверь инициализацию Supabase:**
Должны появиться логи:
```
[POPUP] Supabase config: {url: "https://wddhjwzwxeucaynfxvjn.supabase.co", keyLength: 151}
[POPUP] Supabase client created: [object Object]
[POPUP] Supabase connection test: {data: {...}, error: null}
```

### **3. Переключись на вкладку "Регистрация":**
- Кликни на вкладку "Регистрация"
- Должны появиться логи валидации формы

### **4. Заполни форму регистрации:**
- Введи имя (минимум 2 символа)
- Введи email (правильный формат)
- Введи пароль (минимум 8 символов, с заглавными и строчными буквами)
- Поставь галочки на соглашения

### **5. Проверь валидацию:**
Должны появиться логи:
```
[POPUP] Form validation: {
  name: {valid: true, length: 5},
  email: {valid: true, value: "test@example.com"},
  password: {strength: 3, strong: true},
  checkboxes: {checked: true, tos: true, privacy: true},
  formValid: true,
  buttonDisabled: false
}
```

### **6. Нажми кнопку "Зарегистрироваться":**
Должны появиться логи:
```
[POPUP] Setting up register button listener
[POPUP] Register button element: [object HTMLButtonElement]
[POPUP] Register button clicked
[POPUP] Register data: {email: "test@example.com", name: "Test User", passwordLength: 12}
[POPUP] SignUp response: {data: {...}, error: null}
[POPUP] Registration successful
```

## 🔍 **Возможные проблемы и решения:**

### **Проблема 1: Supabase не подключается**
**Логи:**
```
[POPUP] Supabase connection error: [Error object]
```

**Решение:**
- Проверь интернет-соединение
- Проверь URL и API ключ в supabase.js
- Проверь, что проект Supabase активен

### **Проблема 2: Кнопка регистрации неактивна**
**Логи:**
```
[POPUP] Form validation: {formValid: false, buttonDisabled: true}
```

**Решение:**
- Проверь, что все поля заполнены корректно
- Проверь, что поставлены галочки на соглашения
- Проверь силу пароля (должна быть >= 2)

### **Проблема 3: Ошибка при регистрации**
**Логи:**
```
[POPUP] signUp error: [Error object]
```

**Решение:**
- Проверь сообщение об ошибке в логах
- Возможно, пользователь уже существует
- Возможно, пароль слишком слабый
- Возможно, email уже зарегистрирован

### **Проблема 4: Кнопка не реагирует на клик**
**Логи:**
```
[POPUP] Register button element: null
```

**Решение:**
- Проверь HTML структуру popup.html
- Проверь, что элемент с id="register-btn" существует
- Проверь, что скрипт загружается после HTML

## 📋 **Проверочный список:**

### **✅ HTML структура:**
```html
<button id="register-btn" class="dbm-btn dbm-btn-primary" disabled>Зарегистрироваться</button>
```

### **✅ JavaScript элементы:**
```javascript
const registerBtn = getEl('register-btn');
console.log('[POPUP] Register button element:', registerBtn);
```

### **✅ Supabase конфигурация:**
```javascript
const SUPABASE_CONFIG = {
    url: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### **✅ Обработчик событий:**
```javascript
registerBtn.addEventListener('click', async () => {
    console.log('[POPUP] Register button clicked');
    // ... логика регистрации
});
```

## 🚀 **Команды для тестирования в консоли:**

### **1. Проверь Supabase клиент:**
```javascript
console.log('Supabase config:', window.SUPABASE_CONFIG);
console.log('Supabase client:', window.supabase);
```

### **2. Проверь элементы формы:**
```javascript
console.log('Register button:', document.getElementById('register-btn'));
console.log('Register email:', document.getElementById('register-email'));
console.log('Register name:', document.getElementById('register-name'));
console.log('Register password:', document.getElementById('register-password'));
```

### **3. Проверь валидацию:**
```javascript
const email = document.getElementById('register-email').value;
const name = document.getElementById('register-name').value;
const password = document.getElementById('register-password').value;
console.log('Email valid:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
console.log('Name valid:', name.length >= 2);
console.log('Password length:', password.length);
```

### **4. Тест регистрации:**
```javascript
// Заполни форму и выполни:
document.getElementById('register-btn').click();
```

---

**Теперь с детальным логированием можно точно определить, где проблема с регистрацией!** 🔍
