-- =====================================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ПРЕДСТАВЛЕНИЯ
-- =====================================================

-- 1. Удаляем существующие политики для subscriptions_view
DROP POLICY IF EXISTS "Users can view own subscription data" ON subscriptions_view;

-- 2. Создаем новое представление с правильными RLS политиками
-- Представления в PostgreSQL не поддерживают RLS напрямую,
-- поэтому создаем функцию для безопасного доступа к данным

CREATE OR REPLACE FUNCTION get_user_subscription_data(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    "Статус" TEXT,
    "Тариф" TEXT,
    "Цена за месяц" INTEGER,
    "Длительность (мес)" INTEGER,
    "Начало" TIMESTAMP WITH TIME ZONE,
    "Активна до" TIMESTAMP WITH TIME ZONE,
    "Имя и Фамилия" TEXT,
    email TEXT,
    "Общая стоимость" TEXT,
    "Статус доступа" TEXT
) AS $$
BEGIN
    -- Проверяем, что пользователь запрашивает свои данные
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only view your own subscription data';
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.status as "Статус",
        p.name as "Тариф",
        p.price_per_month as "Цена за месяц",
        p.duration_months as "Длительность (мес)",
        s.starts_at as "Начало",
        s.ends_at as "Активна до",
        u.raw_user_meta_data->>'full_name' as "Имя и Фамилия",
        u.email,
        CASE 
            WHEN p.is_free THEN 'Бесплатно'
            ELSE p.price_per_month * p.duration_months || ' ₽'
        END as "Общая стоимость",
        CASE 
            WHEN s.ends_at IS NULL THEN 'Бессрочно'
            WHEN s.ends_at > NOW() THEN 'Активна'
            ELSE 'Истекла'
        END as "Статус доступа"
    FROM subscriptions s
    LEFT JOIN plans p ON s.plan_id = p.id
    LEFT JOIN auth.users u ON s.user_id = u.id
    WHERE s.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создаем функцию для получения активной подписки пользователя
CREATE OR REPLACE FUNCTION get_user_active_subscription_data(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    "Статус" TEXT,
    "Тариф" TEXT,
    "Начало" TIMESTAMP WITH TIME ZONE,
    "Активна до" TIMESTAMP WITH TIME ZONE,
    "Имя и Фамилия" TEXT,
    email TEXT,
    "Статус доступа" TEXT
) AS $$
BEGIN
    -- Проверяем, что пользователь запрашивает свои данные
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only view your own subscription data';
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.status as "Статус",
        p.name as "Тариф",
        s.starts_at as "Начало",
        s.ends_at as "Активна до",
        u.raw_user_meta_data->>'full_name' as "Имя и Фамилия",
        u.email,
        CASE 
            WHEN s.ends_at IS NULL THEN 'Бессрочно'
            WHEN s.ends_at > NOW() THEN 'Активна'
            ELSE 'Истекла'
        END as "Статус доступа"
    FROM subscriptions s
    LEFT JOIN plans p ON s.plan_id = p.id
    LEFT JOIN auth.users u ON s.user_id = u.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Обновляем представление subscriptions_view для административного доступа
-- (только для чтения, без RLS)
CREATE OR REPLACE VIEW subscriptions_view AS
SELECT 
    s.id,
    s.user_id,
    s.status as "Статус",
    p.name as "Тариф",
    p.price_per_month as "Цена за месяц",
    p.duration_months as "Длительность (мес)",
    s.starts_at as "Начало",
    s.ends_at as "Активна до",
    u.raw_user_meta_data->>'full_name' as "Имя и Фамилия",
    u.email,
    CASE 
        WHEN p.is_free THEN 'Бесплатно'
        ELSE p.price_per_month * p.duration_months || ' ₽'
    END as "Общая стоимость",
    CASE 
        WHEN s.ends_at IS NULL THEN 'Бессрочно'
        WHEN s.ends_at > NOW() THEN 'Активна'
        ELSE 'Истекла'
    END as "Статус доступа"
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN auth.users u ON s.user_id = u.id;

-- 5. Комментарии для документации
COMMENT ON FUNCTION get_user_subscription_data IS 'Безопасная функция для получения данных подписки пользователя';
COMMENT ON FUNCTION get_user_active_subscription_data IS 'Безопасная функция для получения активной подписки пользователя';
