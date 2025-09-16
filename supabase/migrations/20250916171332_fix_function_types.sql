-- =====================================================
-- ИСПРАВЛЕНИЕ ТИПОВ ДАННЫХ В ФУНКЦИЯХ
-- =====================================================

-- 1. Исправляем функцию get_user_active_subscription_data
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
        s.status::TEXT as "Статус",
        p.name::TEXT as "Тариф",
        s.starts_at as "Начало",
        s.ends_at as "Активна до",
        COALESCE(u.raw_user_meta_data->>'full_name', '')::TEXT as "Имя и Фамилия",
        u.email::TEXT as email,
        CASE 
            WHEN s.ends_at IS NULL THEN 'Бессрочно'::TEXT
            WHEN s.ends_at > NOW() THEN 'Активна'::TEXT
            ELSE 'Истекла'::TEXT
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

-- 2. Исправляем функцию get_user_subscription_data
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
        s.status::TEXT as "Статус",
        p.name::TEXT as "Тариф",
        p.price_per_month as "Цена за месяц",
        p.duration_months as "Длительность (мес)",
        s.starts_at as "Начало",
        s.ends_at as "Активна до",
        COALESCE(u.raw_user_meta_data->>'full_name', '')::TEXT as "Имя и Фамилия",
        u.email::TEXT as email,
        CASE 
            WHEN p.is_free THEN 'Бесплатно'::TEXT
            ELSE (p.price_per_month * p.duration_months)::TEXT || ' ₽'
        END as "Общая стоимость",
        CASE 
            WHEN s.ends_at IS NULL THEN 'Бессрочно'::TEXT
            WHEN s.ends_at > NOW() THEN 'Активна'::TEXT
            ELSE 'Истекла'::TEXT
        END as "Статус доступа"
    FROM subscriptions s
    LEFT JOIN plans p ON s.plan_id = p.id
    LEFT JOIN auth.users u ON s.user_id = u.id
    WHERE s.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создаем упрощенную функцию для проверки статуса подписки
CREATE OR REPLACE FUNCTION check_user_subscription_status(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    subscription_record RECORD;
BEGIN
    -- Проверяем, что пользователь запрашивает свои данные
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only view your own subscription data';
    END IF;
    
    -- Получаем активную подписку
    SELECT 
        s.id,
        s.status,
        p.name as plan_name,
        s.starts_at,
        s.ends_at,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.email
    INTO subscription_record
    FROM subscriptions s
    LEFT JOIN plans p ON s.plan_id = p.id
    LEFT JOIN auth.users u ON s.user_id = u.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Формируем результат
    IF subscription_record.id IS NOT NULL THEN
        result := json_build_object(
            'id', subscription_record.id,
            'status', subscription_record.status,
            'plan_name', subscription_record.plan_name,
            'starts_at', subscription_record.starts_at,
            'ends_at', subscription_record.ends_at,
            'full_name', subscription_record.full_name,
            'email', subscription_record.email,
            'is_active', CASE 
                WHEN subscription_record.ends_at IS NULL THEN true
                WHEN subscription_record.ends_at > NOW() THEN true
                ELSE false
            END
        );
    ELSE
        result := json_build_object(
            'id', null,
            'status', 'free',
            'plan_name', null,
            'starts_at', null,
            'ends_at', null,
            'full_name', (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid),
            'email', (SELECT email FROM auth.users WHERE id = user_uuid),
            'is_active', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
