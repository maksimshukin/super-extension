-- =====================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ СИСТЕМЫ ПОДПИСОК
-- =====================================================

-- 1. ПРОСМОТР ВСЕХ ДОСТУПНЫХ ТАРИФОВ
SELECT 
    id,
    name,
    price_per_month,
    duration_months,
    is_free,
    description,
    features
FROM plans 
ORDER BY duration_months, price_per_month;

-- 2. НАЗНАЧЕНИЕ ТАРИФА ПОЛЬЗОВАТЕЛЮ
-- Замените 'USER_UUID' на реальный UUID пользователя
-- Замените 'PLAN_UUID' на UUID нужного тарифа

-- Пример: назначить тариф "1 месяц" пользователю
-- SELECT assign_plan_to_user('USER_UUID', (SELECT id FROM plans WHERE name = '1 месяц'));

-- 3. ПРОСМОТР АКТИВНОЙ ПОДПИСКИ ПОЛЬЗОВАТЕЛЯ
-- Замените 'USER_UUID' на реальный UUID пользователя
-- SELECT * FROM get_user_active_subscription('USER_UUID');

-- 4. ПРОСМОТР ВСЕХ ПОДПИСОК ПОЛЬЗОВАТЕЛЯ
-- Замените 'USER_UUID' на реальный UUID пользователя
-- SELECT * FROM subscriptions_view WHERE user_id = 'USER_UUID';

-- 5. ПРОСМОТР ВСЕХ ПОДПИСОК (для администратора)
SELECT 
    "Имя и Фамилия",
    email,
    "Тариф",
    "Статус",
    "Начало",
    "Активна до",
    "Статус доступа"
FROM subscriptions_view 
ORDER BY "Начало" DESC;

-- 6. ПОИСК ПОЛЬЗОВАТЕЛЕЙ С ИСТЕКШИМИ ПОДПИСКАМИ
SELECT 
    "Имя и Фамилия",
    email,
    "Тариф",
    "Активна до"
FROM subscriptions_view 
WHERE "Активна до" < NOW() 
AND "Статус" = 'active'
ORDER BY "Активна до" ASC;

-- 7. ПОИСК ПОЛЬЗОВАТЕЛЕЙ С АКТИВНЫМИ ПОДПИСКАМИ
SELECT 
    "Имя и Фамилия",
    email,
    "Тариф",
    "Активна до"
FROM subscriptions_view 
WHERE ("Активна до" IS NULL OR "Активна до" > NOW()) 
AND "Статус" = 'active'
ORDER BY "Активна до" ASC;

-- 8. СТАТИСТИКА ПО ТАРИФАМ
SELECT 
    p.name as "Тариф",
    COUNT(s.id) as "Количество подписок",
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as "Активные",
    COUNT(CASE WHEN s.status = 'past_due' THEN 1 END) as "Просроченные",
    COUNT(CASE WHEN s.status = 'canceled' THEN 1 END) as "Отмененные"
FROM plans p
LEFT JOIN subscriptions s ON p.id = s.plan_id
GROUP BY p.id, p.name
ORDER BY p.duration_months;

-- 9. ОБНОВЛЕНИЕ СТАТУСА ПОДПИСКИ
-- Пример: пометить подписку как просроченную
-- UPDATE subscriptions 
-- SET status = 'past_due', updated_at = NOW() 
-- WHERE user_id = 'USER_UUID' AND status = 'active';

-- 10. ПРОДЛЕНИЕ ПОДПИСКИ
-- Пример: продлить подписку на 1 месяц
-- UPDATE subscriptions 
-- SET ends_at = ends_at + INTERVAL '1 month', updated_at = NOW()
-- WHERE user_id = 'USER_UUID' AND status = 'active';

-- 11. ОТМЕНА ПОДПИСКИ
-- Пример: отменить подписку пользователя
-- UPDATE subscriptions 
-- SET status = 'canceled', updated_at = NOW()
-- WHERE user_id = 'USER_UUID' AND status = 'active';

-- 12. СОЗДАНИЕ НОВОГО ТАРИФА
-- INSERT INTO plans (name, price_per_month, duration_months, is_free, description, features)
-- VALUES ('6 месяцев', 300, 6, FALSE, 'Полный доступ на 6 месяцев', '["Все функции", "Неограниченные эффекты", "Приоритетная поддержка", "Скидка 15%"]');

-- 13. ПОИСК ПОЛЬЗОВАТЕЛЯ ПО EMAIL
-- SELECT id, email, raw_user_meta_data->>'full_name' as full_name
-- FROM auth.users 
-- WHERE email = 'user@example.com';

-- 14. ПОЛУЧЕНИЕ UUID ТАРИФА ПО НАЗВАНИЮ
-- SELECT id FROM plans WHERE name = '1 месяц';

-- 15. ПРОВЕРКА ДОСТУПА ПОЛЬЗОВАТЕЛЯ
-- Функция для проверки, есть ли у пользователя активная подписка
CREATE OR REPLACE FUNCTION check_user_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = user_uuid 
        AND s.status = 'active'
        AND (s.ends_at IS NULL OR s.ends_at > NOW())
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пример использования функции проверки доступа:
-- SELECT check_user_access('USER_UUID');

-- 16. ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОДПИСКЕ ДЛЯ API
-- Функция для получения информации о подписке пользователя
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'has_access', check_user_access(user_uuid),
        'subscription', (
            SELECT json_build_object(
                'plan_name', p.name,
                'status', s.status,
                'ends_at', s.ends_at,
                'is_active', CASE 
                    WHEN s.ends_at IS NULL THEN TRUE
                    WHEN s.ends_at > NOW() THEN TRUE
                    ELSE FALSE
                END
            )
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = user_uuid 
            AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пример использования:
-- SELECT get_user_subscription_info('USER_UUID');