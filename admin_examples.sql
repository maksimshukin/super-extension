-- =====================================================
-- ПРИМЕРЫ ДЛЯ АДМИНИСТРАТОРОВ
-- =====================================================

-- 1. ПОИСК ПОЛЬЗОВАТЕЛЯ ПО EMAIL
SELECT id, email, raw_user_meta_data->>'full_name' as full_name, created_at
FROM auth.users 
WHERE email = 'user@example.com';

-- 2. РУЧНОЕ НАЗНАЧЕНИЕ ПОДПИСКИ ПОЛЬЗОВАТЕЛЮ
-- Замените 'USER_UUID' на UUID пользователя и 'PLAN_UUID' на UUID тарифа
SELECT assign_subscription_manually(
    'USER_UUID'::UUID, 
    'PLAN_UUID'::UUID, 
    12, -- количество месяцев (опционально)
    'Назначено администратором' -- заметки (опционально)
);

-- 3. ПРОСМОТР ВСЕХ ПОДПИСОК ПОЛЬЗОВАТЕЛЯ
SELECT 
    s.id,
    s.status,
    p.name as plan_name,
    s.starts_at,
    s.ends_at,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY s.created_at DESC;

-- 4. ПРОДЛЕНИЕ ПОДПИСКИ НА N МЕСЯЦЕВ
UPDATE subscriptions 
SET ends_at = ends_at + INTERVAL '1 month' * 3, -- продлить на 3 месяца
    updated_at = NOW()
WHERE user_id = 'USER_UUID' 
AND status = 'active';

-- 5. ОТМЕНА ПОДПИСКИ
UPDATE subscriptions 
SET status = 'canceled', 
    updated_at = NOW()
WHERE user_id = 'USER_UUID' 
AND status = 'active';

-- 6. СОЗДАНИЕ НОВОГО ПРОМОКОДА
INSERT INTO promocodes (code, name, description, type, value, usage_limit, valid_until) VALUES
('NEWYEAR2024', 'Новогодняя скидка', 'Скидка 25% на все тарифы', 'percentage', 25, 100, '2024-12-31 23:59:59+00');

-- 7. ПРОСМОТР ВСЕХ ПРОМОКОДОВ
SELECT 
    code,
    name,
    type,
    value,
    is_active,
    used_count,
    usage_limit,
    valid_from,
    valid_until
FROM promocodes 
ORDER BY created_at DESC;

-- 8. СТАТИСТИКА ПО ПРОМОКОДАМ
SELECT 
    p.code,
    p.name,
    p.type,
    p.value,
    p.used_count,
    p.usage_limit,
    CASE 
        WHEN p.usage_limit IS NULL THEN 'Без ограничений'
        ELSE ROUND((p.used_count::DECIMAL / p.usage_limit) * 100, 2) || '%'
    END as usage_percentage
FROM promocodes p
WHERE p.is_active = TRUE
ORDER BY p.used_count DESC;

-- 9. ПРОСМОТР ИСПОЛЬЗОВАНИЯ ПРОМОКОДОВ
SELECT 
    p.code,
    p.name,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    pu.discount_amount,
    pu.free_months,
    pu.used_at
FROM promocode_usage pu
JOIN promocodes p ON pu.promocode_id = p.id
JOIN auth.users u ON pu.user_id = u.id
ORDER BY pu.used_at DESC;

-- 10. ПОИСК ПОЛЬЗОВАТЕЛЕЙ С ИСТЕКШИМИ ПОДПИСКАМИ
SELECT 
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    p.name as plan_name,
    s.ends_at,
    NOW() - s.ends_at as time_since_expired
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active' 
AND s.ends_at < NOW()
ORDER BY s.ends_at ASC;

-- 11. ПОИСК ПОЛЬЗОВАТЕЛЕЙ С АКТИВНЫМИ ПОДПИСКАМИ
SELECT 
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    p.name as plan_name,
    s.starts_at,
    s.ends_at,
    CASE 
        WHEN s.ends_at IS NULL THEN 'Бессрочно'
        ELSE s.ends_at - NOW()::DATE || ' дней'
    END as days_remaining
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active' 
AND (s.ends_at IS NULL OR s.ends_at > NOW())
ORDER BY s.ends_at ASC;

-- 12. ОБНОВЛЕНИЕ ПРОМОКОДА
UPDATE promocodes 
SET 
    is_active = FALSE,
    updated_at = NOW()
WHERE code = 'OLD_PROMOCODE';

-- 13. ДЕАКТИВАЦИЯ ПРОМОКОДА
UPDATE promocodes 
SET 
    is_active = FALSE,
    updated_at = NOW()
WHERE code = 'PROMOCODE_TO_DEACTIVATE';

-- 14. ПОИСК ПОЛЬЗОВАТЕЛЕЙ БЕЗ ПОДПИСКИ
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.created_at
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
WHERE s.id IS NULL
ORDER BY u.created_at DESC;

-- 15. МАССОВОЕ ПРОДЛЕНИЕ ПОДПИСОК
-- Продлить все активные подписки на 1 месяц
UPDATE subscriptions 
SET 
    ends_at = ends_at + INTERVAL '1 month',
    updated_at = NOW()
WHERE status = 'active' 
AND ends_at IS NOT NULL;

-- 16. ПОИСК ПОДОЗРИТЕЛЬНОЙ АКТИВНОСТИ (много подписок с одного IP)
SELECT 
    it.ip_address,
    COUNT(DISTINCT it.user_id) as unique_users,
    COUNT(*) as total_trials,
    MIN(it.trial_started_at) as first_trial,
    MAX(it.trial_started_at) as last_trial
FROM ip_trials it
WHERE it.trial_started_at > NOW() - INTERVAL '30 days'
GROUP BY it.ip_address
HAVING COUNT(DISTINCT it.user_id) > 3
ORDER BY unique_users DESC;

-- 17. СОЗДАНИЕ ПРОМОКОДА НА БЕСПЛАТНЫЕ МЕСЯЦЫ
INSERT INTO promocodes (code, name, description, type, value, usage_limit) VALUES
('FREEMONTH', 'Бесплатный месяц', '1 месяц бесплатного доступа', 'free_months', 1, 50);

-- 18. СОЗДАНИЕ ПРОМОКОДА НА ФИКСИРОВАННУЮ СКИДКУ
INSERT INTO promocodes (code, name, description, type, value, usage_limit) VALUES
('SAVE1000', 'Скидка 1000₽', 'Скидка 1000 рублей', 'fixed_amount', 1000, 25);

-- 19. ПРОВЕРКА СТАТУСА ПРОМОКОДА
SELECT 
    code,
    name,
    is_active,
    used_count,
    usage_limit,
    valid_from,
    valid_until,
    CASE 
        WHEN NOT is_active THEN 'Неактивен'
        WHEN valid_until < NOW() THEN 'Истек'
        WHEN usage_limit IS NOT NULL AND used_count >= usage_limit THEN 'Исчерпан'
        ELSE 'Активен'
    END as status
FROM promocodes 
WHERE code = 'PROMOCODE_TO_CHECK';

-- 20. ОЧИСТКА СТАРЫХ ДАННЫХ (ОСТОРОЖНО!)
-- Удалить старые записи об использовании промокодов (старше 1 года)
-- DELETE FROM promocode_usage WHERE used_at < NOW() - INTERVAL '1 year';

-- Удалить старые записи о триалах (старше 6 месяцев)
-- DELETE FROM ip_trials WHERE trial_started_at < NOW() - INTERVAL '6 months';
