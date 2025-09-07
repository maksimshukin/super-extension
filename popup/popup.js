document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- НАСТРОЙКА ---
        const SUPABASE_URL = 'https://wddhjwzwxeucaynfxvjn.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8';
        
        if (typeof supabase === 'undefined') {
            throw new Error("Критическая ошибка: Библиотека Supabase (supabase.js) не загружена.");
        }
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // --- ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ UI ---
        const authContainer = document.getElementById('auth-container');
        const appView = document.getElementById('app-view');
        const versionDisplay = document.getElementById('version-display');
        const closeBtn = document.getElementById('close-btn');
        const tabButtons = document.querySelectorAll('.tab-btn');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const loginBtn = document.getElementById('login-btn');
        const loginErrorDiv = document.getElementById('login-error');
        const registerNameInput = document.getElementById('register-name');
        const registerEmailInput = document.getElementById('register-email');
        const registerPasswordInput = document.getElementById('register-password');
        const tosCheck = document.getElementById('tos-check');
        const privacyCheck = document.getElementById('privacy-check');
        const registerBtn = document.getElementById('register-btn');
        const registerErrorDiv = document.getElementById('register-error');
        const strengthBar = document.getElementById('strength-bar');
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        const planNameEl = document.getElementById('plan-name');
        const expiryDateEl = document.getElementById('expiry-date');
        const logoutBtn = document.getElementById('logout-btn');

        const eyeIconVisible = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'%3E%3C/path%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3C/svg%3E")`;
        const eyeIconHidden = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07l-2.22-2.22'%3E%3C/path%3E%3Cline x1='1' y1='1' x2='23' y2='23'%3E%3C/line%3E%3C/svg%3E")`;

        // --- ОБЩАЯ ЛОГИКА ---
        versionDisplay.textContent = 'v' + chrome.runtime.getManifest().version;
        closeBtn.addEventListener('click', () => window.close());

        // --- ИСПРАВЛЕННАЯ ЛОГИКА ТАБОВ ---
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 1. Убираем класс 'active' у всех кнопок
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // 2. Скрываем обе формы
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');

                // 3. Добавляем класс 'active' только нажатой кнопке
                button.classList.add('active');
                // 4. Показываем нужную форму на основе data-tab атрибута
                const targetForm = document.getElementById(button.dataset.tab);
                if (targetForm) {
                    targetForm.classList.remove('hidden');
                }
            });
        });

        // --- ЛОГИКА ПОКАЗА/СКРЫТИЯ ПАРОЛЯ ---
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.style.backgroundImage = eyeIconHidden;
            toggle.addEventListener('click', () => {
                const targetInput = document.getElementById(toggle.dataset.target);
                if (targetInput) {
                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        toggle.style.backgroundImage = eyeIconVisible;
                    } else {
                        targetInput.type = 'password';
                        toggle.style.backgroundImage = eyeIconHidden;
                    }
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
            } else { strengthBar.style.width = '0%'; }
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
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                authContainer.classList.add('hidden');
                appView.classList.remove('hidden');
                const { data: profile } = await supabaseClient.from('profiles').select('*, plans (name)').eq('id', session.user.id).single();
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

        // --- ОБРАБОТЧИКИ КНОПОК С ОТПРАВКОЙ СООБЩЕНИЙ ---
        registerBtn.addEventListener('click', async () => {
            hideError(registerErrorDiv);
            const { error } = await supabaseClient.auth.signUp({
                email: registerEmailInput.value,
                password: registerPasswordInput.value,
                options: { data: { full_name: registerNameInput.value } }
            });
            if (error) { showError(registerErrorDiv, 'Пользователь с таким email уже существует.'); }
            else { alert('Регистрация успешна! Проверьте почту для подтверждения.'); }
        });

        loginBtn.addEventListener('click', async () => {
            hideError(loginErrorDiv);
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: loginEmailInput.value,
                password: loginPasswordInput.value,
            });
            if (error) { showError(loginErrorDiv, 'Неверный email или пароль.'); }
            else {
                chrome.runtime.sendMessage({ type: 'USER_LOGGED_IN' });
                checkUserStatus();
            }
        });

        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            chrome.runtime.sendMessage({ type: 'USER_LOGGED_OUT' });
            window.location.reload();
        });

        // Первоначальный запуск
        checkUserStatus();

    } catch(error) {
        console.error("Произошла критическая ошибка:", error);
        document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">${error.message}</div>`;
    }
});

