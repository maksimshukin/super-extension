-- =====================================================
-- ПОЛНАЯ ПЕРЕСТРОЙКА СИСТЕМЫ ПОДПИСОК
-- =====================================================

-- 1. Удаляем существующие таблицы и представления
DROP VIEW IF EXISTS subscriptions_view CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- 2. Создаем таблицу планов (тарифов)
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_per_month INTEGER NOT NULL DEFAULT 0,
    duration_months INTEGER NOT NULL DEFAULT 1,
    is_free BOOLEAN DEFAULT FALSE,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем таблицу подписок
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Уникальность: один пользователь может иметь только одну активную подписку
    UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- 4. Создаем функцию для автоматического вычисления даты окончания подписки
CREATE OR REPLACE FUNCTION calculate_subscription_end_date(
    start_date TIMESTAMP WITH TIME ZONE,
    duration_months INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    -- Если это бесплатный план (0 месяцев), возвращаем NULL (бессрочно)
    IF duration_months = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Иначе добавляем указанное количество месяцев
    RETURN start_date + INTERVAL '1 month' * duration_months;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггер для автоматического вычисления даты окончания
CREATE OR REPLACE FUNCTION set_subscription_end_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Получаем информацию о плане
    SELECT duration_months INTO NEW.ends_at
    FROM plans 
    WHERE id = NEW.plan_id;
    
    -- Вычисляем дату окончания
    NEW.ends_at := calculate_subscription_end_date(NEW.starts_at, NEW.ends_at);
    
    -- Обновляем updated_at
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
CREATE TRIGGER trigger_set_subscription_end_date
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION set_subscription_end_date();

-- 6. Создаем представление для удобного просмотра подписок
CREATE VIEW subscriptions_view AS
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
    -- Дополнительные поля для удобства
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

-- 7. Вставляем тарифы
INSERT INTO plans (name, price_per_month, duration_months, is_free, description, features) VALUES
-- Бесплатный тариф
('Бесплатно', 0, 0, TRUE, 'Базовый доступ к расширению', '["Базовые функции", "Ограниченное количество эффектов"]'),

-- Платные тарифы
('1 месяц', 300, 1, FALSE, 'Полный доступ на 1 месяц', '["Все функции", "Неограниченные эффекты", "Приоритетная поддержка"]'),
('3 месяца', 300, 3, FALSE, 'Полный доступ на 3 месяца', '["Все функции", "Неограниченные эффекты", "Приоритетная поддержка", "Скидка 10%"]'),
('12 месяцев', 300, 12, FALSE, 'Полный доступ на 12 месяцев', '["Все функции", "Неограниченные эффекты", "Приоритетная поддержка", "Скидка 20%"]');

-- 8. Настраиваем RLS (Row Level Security)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы планов (все могут читать)
CREATE POLICY "Plans are viewable by everyone" ON plans
    FOR SELECT USING (true);

-- Политики для таблицы подписок
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Политики для представления subscriptions_view (будет создана после представления)
-- CREATE POLICY "Users can view own subscription data" ON subscriptions_view
--     FOR SELECT USING (auth.uid() = user_id);

-- 9. Создаем функцию для назначения тарифа пользователю
CREATE OR REPLACE FUNCTION assign_plan_to_user(
    user_uuid UUID,
    plan_uuid UUID
) RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    existing_subscription_id UUID;
BEGIN
    -- Проверяем, есть ли у пользователя активная подписка
    SELECT id INTO existing_subscription_id
    FROM subscriptions 
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Если есть активная подписка, отменяем её
    IF existing_subscription_id IS NOT NULL THEN
        UPDATE subscriptions 
        SET status = 'canceled', updated_at = NOW()
        WHERE id = existing_subscription_id;
    END IF;
    
    -- Создаем новую подписку
    INSERT INTO subscriptions (user_id, plan_id, status, starts_at)
    VALUES (user_uuid, plan_uuid, 'active', NOW())
    RETURNING id INTO subscription_id;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Создаем функцию для получения активной подписки пользователя
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    status TEXT,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        p.name,
        s.status,
        s.ends_at,
        CASE 
            WHEN s.ends_at IS NULL THEN TRUE
            WHEN s.ends_at > NOW() THEN TRUE
            ELSE FALSE
        END
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Создаем индексы для оптимизации
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);
CREATE INDEX idx_plans_is_free ON plans(is_free);

-- 12. Представления не поддерживают RLS политики напрямую
-- Безопасность обеспечивается через политики базовых таблиц

-- 13. Комментарии для документации
COMMENT ON TABLE plans IS 'Таблица тарифных планов';
COMMENT ON TABLE subscriptions IS 'Таблица подписок пользователей';
COMMENT ON VIEW subscriptions_view IS 'Представление для удобного просмотра подписок с информацией о пользователе и плане';
COMMENT ON FUNCTION assign_plan_to_user IS 'Функция для назначения тарифа пользователю';
COMMENT ON FUNCTION get_user_active_subscription IS 'Функция для получения активной подписки пользователя';
