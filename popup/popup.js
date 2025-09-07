document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- НАСТРОЙКА ---
        // Используем ключи из файла config.js
        if (!self.SUPABASE_CONFIG) {
            throw new Error('SUPABASE_CONFIG is not defined. Ensure popup/config.js is loaded before popup.js');
        }
        const SUPABASE_URL = self.SUPABASE_CONFIG.URL;
        const SUPABASE_ANON_KEY = self.SUPABASE_CONFIG.ANON_KEY;
        
        // Проверка, загрузилась ли библиотека Supabase
        if (typeof supabase === 'undefined') {
            throw new Error("Критическая ошибка: Библиотека Supabase (supabase.js) не загружена. Проверьте путь к файлу в popup.html.");
        }
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[POPUP] Supabase client created.');

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
        const eyeIconVisible = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'%3E%3C/path%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3C/svg%3E")`;
        const eyeIconHidden = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07l-2.22-2.22'%3E%3C/path%3E%3Cline x1='1' y1='1' x2='23' y2='23'%3E%3C/line%3E%3C/svg%3E")`;

        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.style.backgroundImage = eyeIconHidden;
            toggle.addEventListener('click', () => {
                const targetInput = getEl(toggle.dataset.target);
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    toggle.style.backgroundImage = eyeIconVisible;
                } else {
                    targetInput.type = 'password';
                    toggle.style.backgroundImage = eyeIconHidden;
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
                if (score <= 2) { strengthBar.classList.add('weak'); strengthBar.style.width = '25%'; }
                else if (score === 3) { strengthBar.classList.add('medium'); strengthBar.style.width = '60%'; }
                else if (score >= 4) { strengthBar.classList.add('strong'); strengthBar.style.width = '100%'; }
            } else {
                strengthBar.style.width = '0%';
            }
            return score;
        };

        function validateForms() {
            const isLoginEmailValid = validateEmail(loginEmailInput.value);
            const isLoginPasswordValid = loginPasswordInput.value.length >= 6;
            loginBtn.disabled = !(isLoginEmailValid && isLoginPasswordValid);

            const isRegisterNameValid = registerNameInput.value.length >= 2;
            const isRegisterEmailValid = validateEmail(registerEmailInput.value);
            const isRegisterPasswordStrong = checkPasswordStrength(registerPasswordInput.value) >= 2;
            const areCheckboxesChecked = tosCheck.checked && privacyCheck.checked;
            registerBtn.disabled = !(isRegisterNameValid && isRegisterEmailValid && isRegisterPasswordStrong && areCheckboxesChecked);
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
            console.log('[POPUP] Checking session...');
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError) console.error('[POPUP] getSession error:', sessionError);
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
        }

        // --- ОБРАБОТЧИКИ КНОПОК ---
        registerBtn.addEventListener('click', async () => {
            console.log('[POPUP] Register button clicked');
            hideError(registerErrorDiv);
            const { data, error } = await supabaseClient.auth.signUp({
                email: registerEmailInput.value,
                password: registerPasswordInput.value,
                options: { data: { full_name: registerNameInput.value } }
            });

            if (error) {
                console.error('[POPUP] signUp error:', error);
                showError(registerErrorDiv, 'Пользователь с таким email уже существует.');
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                showError(registerErrorDiv, 'Пользователь с таким email уже существует.');
            } else {
                if (data.session === null) {
                    alert('Регистрация успешна! Пожалуйста, проверьте вашу почту и нажмите на ссылку для подтверждения аккаунта.');
                } else {
                    alert('Регистрация успешна! Теперь вы можете войти.');
                }
            }
        });

        loginBtn.addEventListener('click', async () => {
            console.log('[POPUP] Login button clicked');
            hideError(loginErrorDiv);
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: loginEmailInput.value,
                password: loginPasswordInput.value,
            });

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

    } catch (error) {
        console.error('[POPUP] UNHANDLED ERROR:', error);
        document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">${error.message}</div>`;
    }
});

