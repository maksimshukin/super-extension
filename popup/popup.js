document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabaseClient) {
        document.body.innerHTML = `<div style="padding: 20px; color: red;">Ошибка: Клиент Supabase не был загружен.</div>`;
        return;
    }

    const supabase = window.supabaseClient;
    
    // Переменная для хранения информации о примененном промокоде
    let appliedPromocode = null;
    let userDataCache = null;
    let cacheTimestamp = null;
    const CACHE_DURATION = 30000; // 30 секунд

        const getEl = (id) => {
            const el = document.getElementById(id);
        if (!el) throw new Error(`Ошибка: Элемент с id="${id}" не найден.`);
            return el;
        };
        
    // Объявляем все переменные
        const authContainer = getEl('auth-container');
        const appView = getEl('app-view');
    const plansView = getEl('plans-view');
    const loginBtn = getEl('login-btn');
    const registerBtn = getEl('register-btn');
    const logoutBtn = getEl('logout-btn');
    const manageBtn = getEl('manage-btn');
    const backToUserViewBtn = getEl('back-to-user-view-btn');
    const plansContainer = getEl('plans-container');
    const plansErrorEl = getEl('plans-error');
    const promocodeInput = getEl('promocode-input');
    const applyPromocodeBtn = getEl('apply-promocode-btn');
    const resetPromocodeBtn = getEl('reset-promocode-btn');
    const promocodeMessage = getEl('promocode-message');
    const preloader = getEl('preloader');
    
    console.log('Элементы промокода найдены:', {
        promocodeInput: !!promocodeInput,
        applyPromocodeBtn: !!applyPromocodeBtn,
        promocodeMessage: !!promocodeMessage
    });
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

    const switchView = (viewToShow) => {
        [authContainer, appView, plansView, preloader].forEach(view => view.classList.add('hidden'));
        viewToShow.classList.remove('hidden');
    };
    
    const showPreloader = (text = 'Загрузка...') => {
        preloader.querySelector('.preloader-text').textContent = text;
        switchView(preloader);
    };
    
    const hidePreloader = () => {
        preloader.classList.add('hidden');
    };
    
    const clearUserCache = () => {
        userDataCache = null;
        cacheTimestamp = null;
        console.log('[CACHE] Кэш пользователя очищен');
    };

    const showError = (div, message) => {
        div.textContent = message;
        div.classList.remove('hidden');
    };

    const hideError = (div) => {
        div.textContent = '';
        div.classList.add('hidden');
    };
    
    const showPromocodeMessage = (message, isSuccess = true) => {
        console.log('showPromocodeMessage вызвана:', { message, isSuccess });
        promocodeMessage.textContent = message;
        promocodeMessage.className = `promocode-message ${isSuccess ? 'success' : 'error'}`;
        promocodeMessage.classList.remove('hidden');
        
        // Показываем кнопку сброса, если промокод применен успешно
        if (isSuccess && appliedPromocode) {
            resetPromocodeBtn.style.display = 'inline-block';
        } else {
            resetPromocodeBtn.style.display = 'none';
        }
        
        console.log('Сообщение должно быть видимым:', promocodeMessage.classList.contains('hidden'));
    };
    
    const hidePromocodeMessage = () => {
        promocodeMessage.textContent = '';
        promocodeMessage.classList.add('hidden');
    };
    
    const resetPromocode = () => {
        appliedPromocode = null;
        promocodeInput.value = '';
        hidePromocodeMessage();
        showPlansView(); // Обновляем тарифы без скидки
    };

    const checkUserStatus = async (useCache = true) => {
        try {
            // Проверяем кэш, если он еще актуален
            if (useCache && userDataCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
                console.log('[CACHE] Используем кэшированные данные пользователя');
                return userDataCache;
            }
            
            // Сначала проверяем сессию
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error("Ошибка получения сессии:", sessionError);
                return { status: 'logged_out' };
            }
            
            if (!session || !session.user) {
                return { status: 'logged_out' };
            }

            const user = session.user;
            
            // Проверяем подписку только если пользователь авторизован
            const { data, error } = await supabase.rpc('check_user_subscription_status', {
                user_uuid: user.id
            });
            
            if (error) {
                console.error("Ошибка получения данных о подписке:", error);
                return { status: 'error', error, email: user.email, "Имя и Фамилия": user.user_metadata?.full_name };
            }
            
            // Функция возвращает JSON объект
            const subscriptionData = data;
            const fullName = user.user_metadata?.full_name || subscriptionData?.full_name;
            
            const result = { 
                email: user.email, 
                "Имя и Фамилия": fullName,
                "Тариф": subscriptionData?.plan_name,
                "Активна до": subscriptionData?.ends_at
            };
            
            let finalResult;
            if (!subscriptionData || subscriptionData.status === 'free') {
                finalResult = { status: 'free', ...result };
            } else {
                const endsAt = subscriptionData.ends_at ? new Date(subscriptionData.ends_at) : null;
                if (subscriptionData.is_active && (endsAt === null || endsAt > new Date())) {
                    finalResult = { status: 'active', ...result };
                } else {
                    finalResult = { status: 'past_due', ...result };
                }
            }
            
            // Кэшируем результат
            userDataCache = finalResult;
            cacheTimestamp = Date.now();
            
            return finalResult;
        } catch (error) {
            console.error("Ошибка в checkUserStatus:", error);
            return { status: 'error', error: error.message };
        }
    };

    const updateUserUI = async () => {
        try {
            showPreloader('Загрузка данных пользователя...');
            
            const sub = await checkUserStatus();
            
            if (sub.status === 'logged_out') {
                switchView(authContainer);
                validateForms();
                return;
            }

            if (sub.status === 'error') {
                console.error('Ошибка загрузки данных пользователя:', sub.error);
                showPreloader('Ошибка загрузки данных');
                setTimeout(() => {
                    switchView(authContainer);
                }, 2000);
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
                    getEl('plan-name').textContent = 'Бесплатный';
                    getEl('expiry-date').textContent = 'Оформите подписку для полного доступа';
                    break;
            }
            
            // Небольшая задержка для плавного перехода
            setTimeout(() => {
                switchView(appView);
            }, 300);
            
        } catch (error) {
            console.error('Ошибка в updateUserUI:', error);
            showPreloader('Ошибка загрузки');
            setTimeout(() => {
                switchView(authContainer);
            }, 2000);
        }
    };
    
    // Функция для получения IP адреса пользователя
    const getUserIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Ошибка получения IP:', error);
            return '127.0.0.1'; // Fallback для локальной разработки
        }
    };
    
    // Функция для назначения бесплатного триала новому пользователю
    const assignFreeTrialToNewUser = async (userId) => {
        try {
            const userIP = await getUserIP();
            console.log('[TRIAL] Получен IP пользователя:', userIP);
            
            const { data, error } = await supabase.rpc('assign_trial_to_user_by_ip', {
                user_uuid: userId,
                ip_addr: userIP
            });
            
            if (error) {
                console.error('[TRIAL] Ошибка назначения триала:', error);
                return { success: false, message: error.message };
            }
            
            console.log('[TRIAL] Триал назначен:', data);
            return { success: true, data };
            
        } catch (error) {
            console.error('[TRIAL] Ошибка при назначении триала:', error);
            return { success: false, message: error.message };
        }
    };
    
    const showPlansView = async () => {
        try {
            switchView(plansView);
            hideError(plansErrorEl);
            // Не скрываем сообщение о промокоде, если он уже применен
            if (!appliedPromocode) {
                hidePromocodeMessage();
            }
            
            // Сбрасываем промокод при открытии экрана тарифов только если он не применен
            if (!appliedPromocode) {
                promocodeInput.value = '';
            }
            
            plansContainer.innerHTML = '<div class="skeleton-loader"></div><div class="skeleton-loader"></div>';

            const { data: plans, error } = await supabase.from('plans').select('*').neq('duration_months', 0).order('duration_months', { ascending: true });

            if (error) {
                plansContainer.innerHTML = '<p>Не удалось загрузить тарифы.</p>';
                return;
            }
    
        plansContainer.innerHTML = plans.map(plan => {
            const originalPrice = plan.price_per_month * plan.duration_months;
            let finalPrice = originalPrice;
            let priceDisplay = `${originalPrice} ₽`;
            
            // Применяем скидку от промокода, если он есть
            if (appliedPromocode && appliedPromocode.discount) {
                finalPrice = Math.max(0, originalPrice - appliedPromocode.discount.amount);
                if (finalPrice < originalPrice) {
                    priceDisplay = `<span style="text-decoration: line-through; color: #999;">${originalPrice} ₽</span> <span style="color: #059669; font-weight: bold;">${finalPrice} ₽</span>`;
                }
            }
            
            return `
                <div class="plan-card" data-plan-id="${plan.id}">
                    <div class="plan-card-info">
                        <h4>${plan.name}</h4>
                        <small>${plan.price_per_month} ₽/мес.</small>
                        <div class="price">${priceDisplay}</div>
                    </div>
                    <button class="dbm-btn-primary dbm-btn-sm select-plan-btn">Выбрать</button>
                </div>
            `;
        }).join('');
    
        plansContainer.querySelectorAll('.select-plan-btn').forEach(button => {
            button.addEventListener('click', handlePayment);
        });
        
        } catch (error) {
            console.error('Ошибка в showPlansView:', error);
            plansContainer.innerHTML = '<p>Ошибка загрузки тарифов.</p>';
        }
    };

    const applyPromocode = async () => {
        const promocode = promocodeInput.value.trim().toUpperCase();
        console.log('Пытаемся применить промокод:', promocode);
        
        if (!promocode) {
            showPromocodeMessage('Введите промокод', false);
            return;
        }
        
        applyPromocodeBtn.disabled = true;
        applyPromocodeBtn.textContent = '...';
        hidePromocodeMessage();
        
        try {
            // Получаем первый доступный тариф для проверки промокода
            console.log('Загружаем тарифы...');
            const { data: plans, error: plansError } = await supabase.from('plans').select('*').neq('duration_months', 0).order('duration_months', { ascending: true }).limit(1);
            
            if (plansError || !plans || plans.length === 0) {
                console.error('Ошибка загрузки тарифов:', plansError);
                throw new Error('Не удалось загрузить тарифы для проверки промокода');
            }
            
            console.log('Тарифы загружены:', plans);
            console.log('Используем тариф:', plans[0]);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) {
                console.error('Пользователь не авторизован');
                throw new Error('Пользователь не авторизован');
            }
            
            console.log('Пользователь авторизован:', session.user.id);
            console.log('Вызываем apply_promocode с параметрами:', {
                promocode_text: promocode,
                user_uuid: session.user.id,
                plan_id: plans[0].id
            });
            
            const { data, error } = await supabase.rpc('apply_promocode_with_subscription', {
                promocode_text: promocode,
                user_uuid: session.user.id,
                plan_id: plans[0].id
            });
            
            console.log('Результат apply_promocode_with_subscription:', { data, error });
            
            if (error) {
                console.error('Ошибка RPC:', error);
                throw new Error(error.message);
            }
            
            if (!data.success) {
                console.error('Промокод не применен:', data.message);
                throw new Error(data.message);
            }
            
            console.log('Промокод успешно применен:', data);
            
            // Если подписка была создана автоматически (бесплатные месяцы)
            if (data.subscription_created) {
                console.log('Подписка создана автоматически:', data.subscription);
                
                // Показываем сообщение об успехе
                showPromocodeMessage(data.message, true);
                
                // Обновляем UI пользователя
                setTimeout(async () => {
                    await updateUserUI();
                    switchView(appView);
                }, 2000);
                
                return; // Выходим из функции, так как подписка уже создана
            }
            
            // Для промокодов со скидкой сохраняем информацию
            appliedPromocode = data;
            
            // Показываем сообщение об успехе
            let message = data.message || 'Промокод применен успешно!';
            
            console.log('Показываем сообщение:', message);
            showPromocodeMessage(message, true);
            
            // Обновляем отображение тарифов с учетом скидки
            await showPlansView();
            
            // Показываем сообщение снова после обновления тарифов
            setTimeout(() => {
                showPromocodeMessage(message, true);
            }, 100);
            
        } catch (err) {
            console.error('Ошибка применения промокода:', err);
            showPromocodeMessage(err.message, false);
            appliedPromocode = null;
        } finally {
            applyPromocodeBtn.disabled = false;
            applyPromocodeBtn.textContent = 'Применить';
        }
    };

    const handlePayment = async (event) => {
        const button = event.currentTarget;
        const planCard = button.closest('.plan-card');
        const planId = planCard.dataset.planId;
    
        button.disabled = true;
        button.textContent = '...';
        hideError(plansErrorEl);
    
        try {
            // 2. Вызываем функцию, передавая plan_id и promocode
            const requestBody = {
                plan_id: planId
            };
            
            // Добавляем промокод только если он есть
            if (appliedPromocode && appliedPromocode.promocode) {
                requestBody.promocode = appliedPromocode.promocode.code;
            }
            
            console.log('Отправляем запрос:', requestBody);
            
            const { data, error } = await supabase.functions.invoke('create-payment', {
                method: 'POST', // Явно указать метод — хорошая практика
                body: requestBody,
            });
    
            console.log('Получен ответ:', { data, error });
            
            if (error) {
                // Если функция вернула ошибку (статус 4xx или 5xx), она попадет сюда
                console.error('Ошибка функции:', error);
                throw error;
            }
            
            // Эта проверка на случай, если функция отработала (статус 200),
            // но вернула JSON с полем error вместо confirmation_url
            if (data.error) {
                 throw new Error(data.error);
            }
            
            // Если подписка была создана автоматически (бесплатные месяцы)
            if (data.subscription_created) {
                showPromocodeMessage(data.message, true);
                setTimeout(() => {
                    updateUserUI();
                    switchView(appView);
                }, 2000);
                return;
            }
    
            if (data.confirmation_url) {
                chrome.tabs.create({ url: data.confirmation_url });
                window.close();
            } else {
                // На случай, если ответ не содержит ни ошибки, ни ссылки
                throw new Error('Не удалось получить ссылку на оплату.');
            }
    
        } catch (err) {
            showError(plansErrorEl, `Ошибка: ${err.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Выбрать';
        }
    };
    
    // ... (остальной код остается без изменений) ...

    getEl('version-display').textContent = 'v' + chrome.runtime.getManifest().version;
    getEl('close-btn').addEventListener('click', () => window.close());
    
    document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            getEl('login-form').classList.toggle('hidden', button.dataset.tab !== 'login-form');
            getEl('register-form').classList.toggle('hidden', button.dataset.tab !== 'register-form');
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
                handleAuthError(error, registerErrorDiv);
                } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                showError(registerErrorDiv, 'Пользователь с таким email уже существует, но требуется подтверждение. Проверьте почту.');
                } else {
                // Пытаемся назначить бесплатный триал новому пользователю
                if (data.user) {
                    const trialResult = await assignFreeTrialToNewUser(data.user.id);
                    if (trialResult.success) {
                        alert('Регистрация успешна! Вам предоставлен бесплатный триал на 3 дня. Проверьте почту для подтверждения аккаунта.');
                    } else {
                        alert('Регистрация успешна! Проверьте почту для подтверждения аккаунта.');
                        console.log('[TRIAL] Не удалось назначить триал:', trialResult.message);
                    }
                } else {
                    alert('Регистрация успешна! Проверьте почту для подтверждения аккаунта.');
                }
                
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
                handleAuthError(error, loginErrorDiv);
                } else {
                updateUserUI();
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти';
            }
        });

        logoutBtn.addEventListener('click', async () => {
        clearUserCache(); // Очищаем кэш при выходе
        await supabase.auth.signOut();
        updateUserUI();
    });
    
    manageBtn.addEventListener('click', showPlansView);
    backToUserViewBtn.addEventListener('click', () => switchView(appView));
    
    // Обработчики для промокода
    applyPromocodeBtn.addEventListener('click', applyPromocode);
    resetPromocodeBtn.addEventListener('click', resetPromocode);
    promocodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromocode();
        }
    });

    function handleAuthError(error, errorDiv) {
        let message = 'Произошла неизвестная ошибка. Попробуйте снова.';
        if (error.message.includes('User already registered')) message = 'Пользователь с таким email уже зарегистрирован.';
        else if (error.message.includes('Invalid login credentials')) message = 'Неверный email или пароль.';
        else if (error.message.includes('Password should be stronger')) message = 'Пароль слишком слабый. Используйте буквы, цифры и символы.';
        else if (error.message.includes('Unable to validate email address')) message = 'Некорректный формат email адреса.';
        else if (error.message.includes('Email rate limit exceeded')) message = 'Слишком много попыток. Пожалуйста, подождите.';
        showError(errorDiv, message);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ АВТОРИЗАЦИИ ---
    // Слушаем изменения в аутентификации
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AUTH] Auth state changed:', event, session?.user?.email);
        
        // Очищаем кэш при любых изменениях аутентификации
        clearUserCache();
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            updateUserUI();
        } else if (event === 'SIGNED_OUT') {
            // При выходе сразу показываем форму авторизации
            switchView(authContainer);
            validateForms();
        }
    });

    // --- ПЕРВЫЙ ЗАПУСК ---
    // Показываем прелоадер сразу при открытии
    showPreloader('Инициализация...');
    
    // Небольшая задержка для плавного старта
    setTimeout(() => {
        updateUserUI();
    }, 100);
});