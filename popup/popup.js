document.addEventListener('DOMContentLoaded', () => {
    // Функция для инициализации popup
    async function initPopup() {
        try {
        // --- НАСТРОЙКА ---
        // Используем ключи из файла config.js
        if (!window.SHIFT_SUPABASE_CONFIG) {
            throw new Error('SHIFT_SUPABASE_CONFIG is not defined. Ensure config.js is loaded before popup.js');
        }
        const SUPABASE_URL = window.SHIFT_SUPABASE_CONFIG.url;
        const SUPABASE_ANON_KEY = window.SHIFT_SUPABASE_CONFIG.anonKey;
        
        console.log('[POPUP] Supabase config:', { url: SUPABASE_URL, keyLength: SUPABASE_ANON_KEY.length });
        
        // Проверка, загрузился ли локальный Supabase клиент
        if (typeof window.supabaseClient === 'undefined' || window.supabaseClient === null) {
            throw new Error("Критическая ошибка: Локальный Supabase клиент не загружен. Проверьте файл supabase.js.");
        }
        
        const supabaseClient = window.supabaseClient;
        console.log('[POPUP] Локальный Supabase client используется:', supabaseClient);
        
        // Тестируем подключение к Supabase
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            console.log('[POPUP] Supabase connection test:', { data, error });
        } catch (err) {
            console.error('[POPUP] Supabase connection error:', err);
        }

        // --- ФУНКЦИЯ ДЛЯ НАДЕЖНОГО ПОЛУЧЕНИЯ ЭЛЕМЕНТОВ ---
        const getEl = (id) => {
            const el = document.getElementById(id);
            if (!el) {
                // Если элемент не найден, это критическая ошибка, останавливаем скрипт
                throw new Error(`Ошибка: Элемент с id="${id}" не найден в popup.html. Проверьте верстку.`);
            }
            return el;
        };
        
        // --- ПОЛУЧЕНИЕ ВСЕХ ЭЛЕМЕНТОВ UI ---
        const authContainer = getEl('auth-container');
        const appView = getEl('app-view');
        const versionDisplay = getEl('version-display');
        const closeBtn = getEl('close-btn');
        const loginForm = getEl('login-form');
        const registerForm = getEl('register-form');
        const loginEmailInput = getEl('login-email');
        const loginPasswordInput = getEl('login-password');
        const loginBtn = getEl('login-btn');
        const loginErrorDiv = getEl('login-error');
        const registerNameInput = getEl('register-name');
        const registerEmailInput = getEl('register-email');
        const registerPasswordInput = getEl('register-password');
        const tosCheck = getEl('tos-check');
        const privacyCheck = getEl('privacy-check');
        const registerBtn = getEl('register-btn');
        const registerErrorDiv = getEl('register-error');
        const strengthBar = getEl('strength-bar');
        const userNameEl = getEl('user-name');
        const userEmailEl = getEl('user-email');
        const planNameEl = getEl('plan-name');
        const expiryDateEl = getEl('expiry-date');
        const logoutBtn = getEl('logout-btn');
        const tabButtons = document.querySelectorAll('.tab-btn');

        // --- ОБЩАЯ ЛОГИКА ---
        versionDisplay.textContent = 'v' + chrome.runtime.getManifest().version;
        console.log('[POPUP] Version set:', versionDisplay.textContent);
        closeBtn.addEventListener('click', () => window.close());

        // --- ЛОГИКА ТАБОВ ---
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const targetTabId = button.dataset.tab;
                loginForm.classList.toggle('hidden', targetTabId !== 'login-form');
                registerForm.classList.toggle('hidden', targetTabId !== 'register-form');
            });
        });

        // --- ЛОГИКА ПОКАЗА/СКРЫТИЯ ПАРОЛЯ ---
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetInput = getEl(toggle.dataset.target);
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    toggle.classList.add('showing');
                } else {
                    targetInput.type = 'password';
                    toggle.classList.remove('showing');
                }
            });
        });

        // --- ЛОГИКА ВАЛИДАЦИИ ФОРМ ---
        const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const checkPasswordStrength = (password) => {
            let score = 0;
            if (password.length >= 8) score++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^a-zA-Z0-9]/.test(password)) score++;
            
            strengthBar.className = 'strength-bar';
            if (password.length > 0) {
                if (score <= 1) { strengthBar.classList.add('strength-weak'); }
                else if (score === 2) { strengthBar.classList.add('strength-fair'); }
                else if (score === 3) { strengthBar.classList.add('strength-good'); }
                else if (score >= 4) { strengthBar.classList.add('strength-strong'); }
            }
            return score;
        };

        function validateForms() {
            const isLoginEmailValid = validateEmail(loginEmailInput.value);
            const isLoginPasswordValid = loginPasswordInput.value.length >= 6;
            loginBtn.disabled = !(isLoginEmailValid && isLoginPasswordValid);

            const isRegisterNameValid = registerNameInput.value.length >= 2;
            const isRegisterEmailValid = validateEmail(registerEmailInput.value);
            const passwordStrength = checkPasswordStrength(registerPasswordInput.value);
            const isRegisterPasswordStrong = passwordStrength >= 2;
            const areCheckboxesChecked = tosCheck.checked && privacyCheck.checked;
            
            const isRegisterFormValid = isRegisterNameValid && isRegisterEmailValid && isRegisterPasswordStrong && areCheckboxesChecked;
            registerBtn.disabled = !isRegisterFormValid;
            
            console.log('[POPUP] Form validation:', {
                name: { valid: isRegisterNameValid, length: registerNameInput.value.length },
                email: { valid: isRegisterEmailValid, value: registerEmailInput.value },
                password: { strength: passwordStrength, strong: isRegisterPasswordStrong },
                checkboxes: { checked: areCheckboxesChecked, tos: tosCheck.checked, privacy: privacyCheck.checked },
                formValid: isRegisterFormValid,
                buttonDisabled: registerBtn.disabled
            });
        }
        
        [loginEmailInput, loginPasswordInput, registerNameInput, registerEmailInput, registerPasswordInput, tosCheck, privacyCheck]
            .forEach(input => input.addEventListener('input', validateForms));
        console.log('[POPUP] Form listeners attached.');

        // --- ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ---
        const showError = (div, message) => {
            div.textContent = message;
            div.classList.remove('hidden');
        };
        const hideError = (div) => {
            div.textContent = '';
            div.classList.add('hidden');
        };

        async function checkUserStatus() {
            console.log('[POPUP] Проверка статуса пользователя...');
            try {
                const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                console.log('[POPUP] Сессия:', session);
                if (sessionError) {
                    console.error('[POPUP] Ошибка получения сессии:', sessionError);
                    return;
                }
            if (session) {
                console.log('[POPUP] Session found. Rendering app view');
                authContainer.classList.add('hidden');
                appView.classList.remove('hidden');
                const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('*, plans (name)').eq('id', session.user.id).single();
                if (profileError) console.error('[POPUP] profile load error:', profileError);
                if (profile) {
                    userNameEl.textContent = profile.full_name || 'Пользователь';
                    userEmailEl.textContent = profile.email;
                    if (profile.plan_id && profile.plans) {
                        planNameEl.textContent = profile.plans.name;
                        if (profile.subscription_end_date) {
                            const endDate = new Date(profile.subscription_end_date);
                            expiryDateEl.textContent = `Доступ активен до: ${endDate.toLocaleDateString()}`;
                        } else {
                            expiryDateEl.textContent = 'Бессрочный доступ';
                        }
                    } else {
                        planNameEl.textContent = 'Бесплатный';
                        expiryDateEl.textContent = '';
                    }
                }
            } else {
                authContainer.classList.remove('hidden');
                appView.classList.add('hidden');
                validateForms();
            }
            } catch (error) {
                console.error('[POPUP] Ошибка в checkUserStatus:', error);
                authContainer.classList.remove('hidden');
                appView.classList.add('hidden');
            }
        }

        // --- ОБРАБОТЧИКИ КНОПОК ---
        console.log('[POPUP] Setting up register button listener');
        console.log('[POPUP] Register button element:', registerBtn);
        
        registerBtn.addEventListener('click', async () => {
            console.log('[POPUP] Register button clicked');
            console.log('[POPUP] Register data:', {
                email: registerEmailInput.value,
                name: registerNameInput.value,
                passwordLength: registerPasswordInput.value.length
            });
            
            hideError(registerErrorDiv);
            
            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: registerEmailInput.value,
                    password: registerPasswordInput.value,
                    options: { 
                        data: { 
                            full_name: registerNameInput.value 
                        } 
                    }
                });

                console.log('[POPUP] SignUp response:', { data, error });

                if (error) {
                    console.error('[POPUP] signUp error:', error);
                    let errorMessage = 'Ошибка регистрации.';
                    
                    if (error.message.includes('already registered')) {
                        errorMessage = 'Пользователь с таким email уже существует.';
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage = 'Неверный формат email.';
                    } else if (error.message.includes('Password')) {
                        errorMessage = 'Пароль слишком слабый.';
                    } else {
                        errorMessage = `Ошибка: ${error.message}`;
                    }
                    
                    showError(registerErrorDiv, errorMessage);
                } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                    console.log('[POPUP] User already exists (no identities)');
                    showError(registerErrorDiv, 'Пользователь с таким email уже существует.');
                } else {
                    console.log('[POPUP] Registration successful');
                    if (data.session === null) {
                        alert('Регистрация успешна! Пожалуйста, проверьте вашу почту и нажмите на ссылку для подтверждения аккаунта.');
                    } else {
                        alert('Регистрация успешна! Теперь вы можете войти.');
                    }
                }
            } catch (err) {
                console.error('[POPUP] Unexpected error during registration:', err);
                showError(registerErrorDiv, 'Произошла неожиданная ошибка. Попробуйте еще раз.');
            }
        });

        loginBtn.addEventListener('click', async () => {
            console.log('[POPUP] Login button clicked');
            console.log('[POPUP] Email:', loginEmailInput.value);
            console.log('[POPUP] Password length:', loginPasswordInput.value.length);
            console.log('[POPUP] supabaseClient:', supabaseClient);
            console.log('[POPUP] supabaseClient.auth:', supabaseClient?.auth);
            
            hideError(loginErrorDiv);
            
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: loginEmailInput.value,
                    password: loginPasswordInput.value,
                });

                console.log('[POPUP] signInWithPassword response:', { data, error });

                if (error) {
                    console.error('[POPUP] signInWithPassword error:', error);
                if (error.message.includes('Email not confirmed')) {
                    showError(loginErrorDiv, 'Ваш аккаунт не подтвержден. Пожалуйста, проверьте почту.');
                } else {
                    showError(loginErrorDiv, 'Неверный email или пароль.');
                }
                } else {
                    chrome.runtime.sendMessage({ type: 'USER_LOGGED_IN' });
                    console.log('[POPUP] USER_LOGGED_IN sent to background');
                    checkUserStatus();
                }
            } catch (err) {
                console.error('[POPUP] Unexpected error during login:', err);
                showError(loginErrorDiv, 'Произошла неожиданная ошибка. Попробуйте еще раз.');
            }
        });

        logoutBtn.addEventListener('click', async () => {
            console.log('[POPUP] Logout button clicked');
            await supabaseClient.auth.signOut();
            chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
            console.log('[POPUP] USER_LOGGED_OUT sent to background');
            window.location.reload();
        });

        // ПЕРВОНАЧАЛЬНЫЙ ЗАПУСК
        console.log('[POPUP] Initial checkUserStatus call');
        checkUserStatus();
        
        // Добавляем кнопки для тестирования
        const manageBtn = getEl('manage-btn');
        const supportBtn = getEl('support-btn');
        
        manageBtn.addEventListener('click', () => {
            console.log('[POPUP] Manage subscription clicked');
            alert('Функция управления подпиской будет добавлена позже');
        });
        
        supportBtn.addEventListener('click', () => {
            console.log('[POPUP] Support clicked');
            alert('Для поддержки напишите на support@example.com');
        });

        } catch (error) {
            console.error('[POPUP] UNHANDLED ERROR:', error);
            document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">${error.message}</div>`;
        }
    }

    // Ждем загрузки Supabase и инициализируем popup
    let supabaseWaitAttempts = 0;
    const maxSupabaseWaitAttempts = 50; // 5 секунд максимум
    
    async function waitForSupabase() {
        supabaseWaitAttempts++;
        
        console.log(`[POPUP] Попытка ${supabaseWaitAttempts}/${maxSupabaseWaitAttempts} загрузки Supabase...`);
        console.log('[POPUP] SHIFT_SUPABASE_CONFIG:', !!window.SHIFT_SUPABASE_CONFIG);
        console.log('[POPUP] window.supabaseClient:', !!window.supabaseClient);
        
        if (window.SHIFT_SUPABASE_CONFIG && window.supabaseClient) {
            console.log('[POPUP] Supabase загружен, инициализируем popup...');
            await initPopup();
        } else if (supabaseWaitAttempts >= maxSupabaseWaitAttempts) {
            console.warn('[POPUP] Таймаут ожидания Supabase, инициализируем popup без Supabase...');
            // Инициализируем popup даже без Supabase для базовой функциональности
            await initPopupWithoutSupabase();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    // Функция инициализации popup без Supabase (для базовой функциональности)
    async function initPopupWithoutSupabase() {
        try {
            console.log('[POPUP] Инициализация popup без Supabase...');
            
            // Получаем элементы
            const versionDisplay = document.getElementById('version-display');
            const closeBtn = document.getElementById('close-btn');
            const tabButtons = document.querySelectorAll('.tab-btn');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (versionDisplay) {
                versionDisplay.textContent = 'v' + chrome.runtime.getManifest().version;
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => window.close());
            }
            
            // Логика вкладок
            if (tabButtons.length > 0) {
                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        // Убираем active со всех кнопок
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        // Добавляем active на нажатую кнопку
                        button.classList.add('active');
                        
                        const targetTabId = button.dataset.tab;
                        if (loginForm) loginForm.classList.toggle('hidden', targetTabId !== 'login-form');
                        if (registerForm) registerForm.classList.toggle('hidden', targetTabId !== 'register-form');
                        
                        console.log('[POPUP] Переключена вкладка:', targetTabId);
                    });
                });
                console.log('[POPUP] Обработчики вкладок установлены');
            }
            
            // Показываем сообщение об ошибке Supabase
            const authContainer = document.getElementById('auth-container');
            if (authContainer) {
                authContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #666;">
                        <h3>⚠️ Ошибка подключения</h3>
                        <p>Не удалось подключиться к серверу аутентификации.</p>
                        <p>Попробуйте перезагрузить расширение.</p>
                        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px;">
                            <strong>Диагностика:</strong><br>
                            SHIFT_SUPABASE_CONFIG: ${window.SHIFT_SUPABASE_CONFIG ? '✅' : '❌'}<br>
                            window.supabaseClient: ${window.supabaseClient ? '✅' : '❌'}<br>
                            Попыток загрузки: ${supabaseWaitAttempts}
                        </div>
                        <button onclick="window.close()" style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Закрыть
                        </button>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('[POPUP] Ошибка инициализации без Supabase:', error);
        }
    }

    // Запускаем ожидание Supabase
    waitForSupabase();
});

