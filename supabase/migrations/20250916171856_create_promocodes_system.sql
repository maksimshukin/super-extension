-- =====================================================
-- СИСТЕМА ПРОМОКОДОВ
-- =====================================================

-- 1. Создаем таблицу промокодов
CREATE TABLE IF NOT EXISTS promocodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_months')),
    value DECIMAL(10,2) NOT NULL, -- Процент, сумма в рублях или количество месяцев
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER DEFAULT NULL, -- NULL = без ограничений
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создаем таблицу использования промокодов
CREATE TABLE IF NOT EXISTS promocode_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promocode_id UUID REFERENCES promocodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    free_months INTEGER DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Один пользователь может использовать промокод только один раз
    UNIQUE(promocode_id, user_id)
);

-- 3. Создаем функцию для проверки и применения промокода
CREATE OR REPLACE FUNCTION apply_promocode(
    promocode_text TEXT,
    user_uuid UUID,
    plan_id UUID
) RETURNS JSON AS $$
DECLARE
    promocode_record RECORD;
    plan_record RECORD;
    usage_record RECORD;
    discount_amount DECIMAL(10,2) := 0;
    free_months INTEGER := 0;
    final_price DECIMAL(10,2);
    result JSON;
BEGIN
    -- Проверяем, что пользователь запрашивает для себя
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only apply promocodes for yourself';
    END IF;
    
    -- Получаем информацию о промокоде
    SELECT * INTO promocode_record
    FROM promocodes 
    WHERE code = UPPER(TRIM(promocode_text))
    AND is_active = TRUE
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
    
    IF promocode_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Промокод не найден или недействителен'
        );
    END IF;
    
    -- Проверяем лимит использования
    IF promocode_record.usage_limit IS NOT NULL 
       AND promocode_record.used_count >= promocode_record.usage_limit THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Промокод исчерпан'
        );
    END IF;
    
    -- Проверяем, не использовал ли пользователь уже этот промокод
    SELECT * INTO usage_record
    FROM promocode_usage 
    WHERE promocode_id = promocode_record.id 
    AND user_id = user_uuid;
    
    IF usage_record.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Вы уже использовали этот промокод'
        );
    END IF;
    
    -- Получаем информацию о тарифе
    SELECT * INTO plan_record
    FROM plans 
    WHERE id = plan_id;
    
    IF plan_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Тариф не найден'
        );
    END IF;
    
    -- Вычисляем скидку или бесплатные месяцы
    CASE promocode_record.type
        WHEN 'percentage' THEN
            discount_amount := (plan_record.price_per_month * plan_record.duration_months) * (promocode_record.value / 100);
        WHEN 'fixed_amount' THEN
            discount_amount := LEAST(promocode_record.value, plan_record.price_per_month * plan_record.duration_months);
        WHEN 'free_months' THEN
            free_months := promocode_record.value::INTEGER;
    END CASE;
    
    final_price := GREATEST(0, (plan_record.price_per_month * plan_record.duration_months) - discount_amount);
    
    result := json_build_object(
        'success', true,
        'promocode', json_build_object(
            'id', promocode_record.id,
            'code', promocode_record.code,
            'name', promocode_record.name,
            'type', promocode_record.type,
            'value', promocode_record.value
        ),
        'discount', json_build_object(
            'amount', discount_amount,
            'free_months', free_months,
            'original_price', plan_record.price_per_month * plan_record.duration_months,
            'final_price', final_price
        ),
        'message', CASE 
            WHEN promocode_record.type = 'free_months' THEN 
                'Промокод применен! Вы получите ' || free_months || ' месяцев бесплатно.'
            WHEN discount_amount > 0 THEN 
                'Промокод применен! Скидка: ' || discount_amount || ' ₽'
            ELSE 
                'Промокод применен!'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Создаем функцию для применения промокода к подписке
CREATE OR REPLACE FUNCTION apply_promocode_to_subscription(
    promocode_text TEXT,
    user_uuid UUID,
    plan_id UUID
) RETURNS JSON AS $$
DECLARE
    promocode_result JSON;
    promocode_data JSON;
    subscription_id UUID;
    plan_record RECORD;
    new_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Проверяем промокод
    SELECT apply_promocode(promocode_text, user_uuid, plan_id) INTO promocode_result;
    
    IF (promocode_result->>'success')::BOOLEAN = FALSE THEN
        RETURN promocode_result;
    END IF;
    
    promocode_data := promocode_result->'promocode';
    
    -- Получаем информацию о тарифе
    SELECT * INTO plan_record FROM plans WHERE id = plan_id;
    
    -- Если это бесплатные месяцы, создаем подписку без оплаты
    IF (promocode_data->>'type') = 'free_months' THEN
        -- Создаем подписку
        INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at)
        VALUES (
            user_uuid, 
            plan_id, 
            'active', 
            NOW(), 
            NOW() + INTERVAL '1 month' * (promocode_data->>'value')::INTEGER
        )
        RETURNING id INTO subscription_id;
        
        -- Записываем использование промокода
        INSERT INTO promocode_usage (promocode_id, user_id, subscription_id, free_months)
        VALUES (
            (promocode_data->>'id')::UUID,
            user_uuid,
            subscription_id,
            (promocode_data->>'value')::INTEGER
        );
        
        -- Обновляем счетчик использования
        UPDATE promocodes 
        SET used_count = used_count + 1, updated_at = NOW()
        WHERE id = (promocode_data->>'id')::UUID;
        
        RETURN json_build_object(
            'success', true,
            'subscription_id', subscription_id,
            'message', 'Подписка активирована! Вы получили ' || (promocode_data->>'value') || ' месяцев бесплатно.',
            'promocode_info', promocode_result
        );
    ELSE
        -- Для скидок возвращаем информацию для оплаты
        RETURN json_build_object(
            'success', true,
            'requires_payment', true,
            'promocode_info', promocode_result
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Создаем функцию для ручного назначения подписки пользователю
CREATE OR REPLACE FUNCTION assign_subscription_manually(
    user_uuid UUID,
    plan_id UUID,
    duration_months INTEGER DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    plan_record RECORD;
    subscription_id UUID;
    ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Получаем информацию о тарифе
    SELECT * INTO plan_record FROM plans WHERE id = plan_id;
    
    IF plan_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Тариф не найден'
        );
    END IF;
    
    -- Вычисляем дату окончания
    IF duration_months IS NOT NULL THEN
        ends_at := NOW() + INTERVAL '1 month' * duration_months;
    ELSE
        ends_at := calculate_subscription_end_date(NOW(), plan_record.duration_months);
    END IF;
    
    -- Создаем подписку
    INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at)
    VALUES (user_uuid, plan_id, 'active', NOW(), ends_at)
    RETURNING id INTO subscription_id;
    
    RETURN json_build_object(
        'success', true,
        'subscription_id', subscription_id,
        'plan_name', plan_record.name,
        'ends_at', ends_at,
        'message', 'Подписка успешно назначена пользователю'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Вставляем примеры промокодов
INSERT INTO promocodes (code, name, description, type, value, usage_limit) VALUES
('WELCOME10', 'Добро пожаловать', 'Скидка 10% для новых пользователей', 'percentage', 10, 100),
('SAVE500', 'Экономия 500₽', 'Скидка 500 рублей', 'fixed_amount', 500, 50),
('FREE3MONTHS', '3 месяца бесплатно', '3 месяца бесплатного доступа', 'free_months', 3, 20),
('STUDENT50', 'Студенческая скидка', 'Скидка 50% для студентов', 'percentage', 50, 200);

-- 7. Настраиваем RLS
ALTER TABLE promocodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promocode_usage ENABLE ROW LEVEL SECURITY;

-- Политики для промокодов (все могут читать активные промокоды)
CREATE POLICY "Active promocodes are viewable by everyone" ON promocodes
    FOR SELECT USING (is_active = TRUE);

-- Политики для использования промокодов
CREATE POLICY "Users can view own promocode usage" ON promocode_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promocode usage" ON promocode_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Создаем индексы
CREATE INDEX idx_promocodes_code ON promocodes(code);
CREATE INDEX idx_promocodes_active ON promocodes(is_active);
CREATE INDEX idx_promocode_usage_user_id ON promocode_usage(user_id);
CREATE INDEX idx_promocode_usage_promocode_id ON promocode_usage(promocode_id);

-- 9. Комментарии
COMMENT ON TABLE promocodes IS 'Таблица промокодов с различными типами скидок';
COMMENT ON TABLE promocode_usage IS 'Таблица использования промокодов пользователями';
COMMENT ON FUNCTION apply_promocode IS 'Проверяет и возвращает информацию о применении промокода';
COMMENT ON FUNCTION apply_promocode_to_subscription IS 'Применяет промокод к подписке';
COMMENT ON FUNCTION assign_subscription_manually IS 'Ручное назначение подписки пользователю (для администраторов)';
