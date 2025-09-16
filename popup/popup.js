document.addEventListener('DOMContentLoaded', () => {
    // Ждем, пока config.js и supabase.js точно загрузятся
    if (!window.supabaseClient) {
        document.body.innerHTML = `<div style="padding: 20px; color: red;">Ошибка: Клиент Supabase не был загружен. Проверьте консоль.</div>`;
        return;
    }

    const supabase = window.supabaseClient;

    // --- ФУНКЦИЯ ДЛЯ НАДЕЖНОГО ПОЛУЧЕНИЯ ЭЛЕМЕНТОВ ---
    const getEl = (id) => {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Ошибка: Элемент с id="${id}" не найден.`);
        return el;
    };
    
    // --- ПОЛУЧЕНИЕ ВСЕХ ЭЛЕМЕНТОВ UI ---
    const authContainer = getEl('auth-container');
    const appView = getEl('app-view');
    const plansView = getEl('plans-view');
    const loginBtn = getEl('login-btn');
    const registerBtn = getEl('register-btn');
    const logoutBtn = getEl('logout-btn');
    const manageBtn = getEl('manage-btn');
    const backToUserViewBtn = getEl('back-to-user-view-btn');
    const plansContainer = getEl('plans-container');
    const promocodeInput = getEl('promocode-input');
    const plansErrorEl = getEl('plans-error');
    const loginEmailInput = getEl('login-email');
    const loginPasswordInput = getEl('login-password');
    const registerNameInput = getEl('register-name');
    const registerEmailInput = getEl('register-email');
    const registerPasswordInput = getEl('register-password');
    const tosCheck = getEl('tos-check');
    const privacyCheck = getEl('privacy-check');
    const strengthBar = getEl('strength-bar');
    const loginErrorDiv = getEl('login-error');
    const registerErrorDiv = getEl('register-error');

    // --- УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ И ДАННЫМИ ---
    const switchView = (viewToShow) => {
        [authContainer, appView, plansView].forEach(view => view.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
    };

    const showError = (div, message) => {
        div.textContent = message;
        div.classList.remove('hidden');
    };

    const hideError = (div) => {
        div.textContent = '';
        div.classList.add('hidden');
    };

    // --- ЛОГИКА ПОДПИСКИ ---
    const checkUserStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { status: 'logged_out' };

        const { data, error } = await supabase
            .from('subscriptions_view')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        const result = { email: user.email, ...data };
        if (error || !data) return { status: 'free', ...result };
        
        const endsAt = data['Активна до'] ? new Date(data['Активна до']) : null;
        const now = new Date();
        
        if (data['Статус'] === 'active' && endsAt > now) {
            return { status: 'active', ...result };
        }
        return { status: 'past_due', ...result };
    };

    const updateUserUI = async () => {
        const sub = await checkUserStatus();
        if (sub.status === 'logged_out') {
            switchView(authContainer);
            validateForms();
            return;
        }

        getEl('user-name').textContent = sub['Имя и Фамилия'] || 'Пользователь';
        getEl('user-email').textContent = sub.email;

        switch(sub.status) {
            case 'active':
                getEl('plan-name').textContent = sub['Тариф'];
                getEl('expiry-date').textContent = `Доступ до: ${new Date(sub['Активна до']).toLocaleDateString()}`;
                break;
            case 'past_due':
                getEl('plan-name').textContent = `Истекла (${sub['Тариф'] || 'неизвестный'})`;
                getEl('expiry-date').textContent = 'Пожалуйста, продлите подписку';
                break;
            default:
                getEl('plan-name').textContent = 'Бесплатный (триал)';
                getEl('expiry-date').textContent = 'Ограниченный доступ';
                break;
        }
        switchView(appView);
    };
    
    // --- ФУНКЦИИ ДЛЯ РАБОТЫ С ТАРИФАМИ ---
    const showPlansView = async () => {
        switchView(plansView);
        plansErrorEl.classList.add('hidden');
        plansContainer.innerHTML = '<div class="skeleton-loader"></div><div class="skeleton-loader"></div>';

        const { data: plans, error } = await supabase
            .from('plans')
            .select('*')
            .neq('duration_months', 0)
            .order('duration_months', { ascending: true });

        if (error) {
            plansContainer.innerHTML = '<p>Не удалось загрузить тарифы.</p>';
            return;
        }
    
        plansContainer.innerHTML = plans.map(plan => `
            <div class="plan-card" data-plan-id="${plan.id}">
                <div class="plan-card-info">
                    <h4>${plan.name}</h4>
                    <small>${plan.price_per_month} ₽/мес.</small>
                </div>
                <div class="price">${plan.price_per_month * plan.duration_months} ₽</div>
            </div>
        `).join('');
    
        plansContainer.querySelectorAll('.plan-card').forEach(card => {
            card.addEventListener('click', handlePayment);
        });
    };

    const handlePayment = async (event) => {
        const planCard = event.currentTarget;
        const planId = planCard.dataset.planId;
        const promoCode = promocodeInput.value.trim();
        
        planCard.classList.add('loading');
        plansErrorEl.classList.add('hidden');

        try {
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: { plan_id: planId, promocode: promoCode || null },
            });

            if (error) throw new Error(error.message);

            if (data.confirmation_url) {
                chrome.tabs.create({ url: data.confirmation_url });
                window.close();
            } else {
                throw new Error('Не удалось получить ссылку на оплату.');
            }
        } catch (err) {
            plansErrorEl.textContent = `Ошибка: ${err.message}`;
            plansErrorEl.classList.remove('hidden');
        } finally {
            planCard.classList.remove('loading');
        }
    };

    // --- ЛОГИКА ВАЛИДАЦИИ И ИНТЕРФЕЙСА ---
    getEl('version-display').textContent = 'v' + chrome.runtime.getManifest().version;
    getEl('close-btn').addEventListener('click', () => window.close());
    
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetTabId = button.dataset.tab;
            getEl('login-form').classList.toggle('hidden', targetTabId !== 'login-form');
            getEl('register-form').classList.toggle('hidden', targetTabId !== 'register-form');
        });
    });

    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetInput = getEl(toggle.dataset.target);
            targetInput.type = targetInput.type === 'password' ? 'text' : 'password';
            toggle.classList.toggle('showing');
        });
    });

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        strengthBar.className = 'strength-bar';
        if (password.length > 0) {
            if (score <= 1) strengthBar.classList.add('strength-weak');
            else if (score === 2) strengthBar.classList.add('strength-fair');
            else if (score === 3) strengthBar.classList.add('strength-good');
            else if (score >= 4) strengthBar.classList.add('strength-strong');
        }
        return score;
    };

    function validateForms() {
        loginBtn.disabled = !(validateEmail(loginEmailInput.value) && loginPasswordInput.value.length >= 6);
        registerBtn.disabled = !(
            registerNameInput.value.length >= 2 &&
            validateEmail(registerEmailInput.value) &&
            checkPasswordStrength(registerPasswordInput.value) >= 2 &&
            tosCheck.checked &&
            privacyCheck.checked
        );
    }
    [loginEmailInput, loginPasswordInput, registerNameInput, registerEmailInput, registerPasswordInput, tosCheck, privacyCheck]
        .forEach(input => input.addEventListener('input', validateForms));

    // --- ОБРАБОТЧИКИ СОБЫТИЙ АВТОРИЗАЦИИ ---
    registerBtn.addEventListener('click', async () => {
        hideError(registerErrorDiv);
        registerBtn.disabled = true;
        registerBtn.textContent = 'Регистрация...';

        try {
            const { data, error } = await supabase.auth.signUp({
                email: registerEmailInput.value,
                password: registerPasswordInput.value,
                options: { data: { full_name: registerNameInput.value } }
            });

            if (error) {
                // Вызываем новую функцию для детальной обработки ошибок
                handleAuthError(error, registerErrorDiv);
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                showError(registerErrorDiv, 'Пользователь с таким email уже существует, но требуется подтверждение. Проверьте почту.');
            }
             else {
                alert('Регистрация успешна! Проверьте почту для подтверждения аккаунта.');
                // Опционально: можно автоматически переключить на вкладку входа
                getEl('login-email').value = registerEmailInput.value;
                document.querySelector('.tab-btn[data-tab="login-form"]').click();
            }
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
        }
    });

    loginBtn.addEventListener('click', async () => {
        hideError(loginErrorDiv);
        loginBtn.disabled = true;
        loginBtn.textContent = 'Вход...';

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmailInput.value,
                password: loginPasswordInput.value,
            });

            if (error) {
                // Вызываем новую функцию для детальной обработки ошибок
                handleAuthError(error, loginErrorDiv);
            } else {
                updateUserUI(); // Обновляем UI после входа
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти';
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        updateUserUI(); // Обновляем UI после выхода
    });
    
    // --- ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ ПОДПИСКИ ---
    manageBtn.addEventListener('click', showPlansView);
    backToUserViewBtn.addEventListener('click', () => switchView(appView));

    // --- НОВАЯ ФУНКЦИЯ ОБРАБОТКИ ОШИБОК ---
    function handleAuthError(error, errorDiv) {
        let message = 'Произошла неизвестная ошибка. Попробуйте снова.';

        // Анализируем текст ошибки от Supabase
        if (error.message.includes('User already registered')) {
            message = 'Пользователь с таким email уже зарегистрирован.';
        } else if (error.message.includes('Invalid login credentials')) {
            message = 'Неверный email или пароль.';
        } else if (error.message.includes('Password should be stronger')) {
            message = 'Пароль слишком слабый. Используйте буквы, цифры и символы.';
        } else if (error.message.includes('Unable to validate email address')) {
            message = 'Некорректный формат email адреса.';
        } else if (error.message.includes('Email rate limit exceeded')) {
            message = 'Слишком много попыток. Пожалуйста, подождите и попробуйте снова.';
        } else if (error.message.includes('Email link is invalid or has expired')) {
            message = 'Ссылка для подтверждения недействительна или устарела.';
        } else if (error.message.includes('user is banned')) {
            message = 'Этот пользователь заблокирован.';
        }
        
        showError(errorDiv, message);
    }


    // --- ПЕРВЫЙ ЗАПУСК ---
    updateUserUI();
});