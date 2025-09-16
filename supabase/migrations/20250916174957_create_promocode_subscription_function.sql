-- Функция для применения промокода с созданием подписки
CREATE OR REPLACE FUNCTION apply_promocode_with_subscription(
    promocode_text TEXT,
    user_uuid UUID,
    plan_id UUID
) RETURNS JSON AS $$
DECLARE
    promocode_record RECORD;
    plan_record RECORD;
    usage_record RECORD;
    subscription_id UUID;
    new_ends_at TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Проверяем, что пользователь запрашивает для себя
    IF user_uuid != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied: You can only apply promocodes for yourself'
        );
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
    
    -- Если это бесплатные месяцы, создаем подписку
    IF promocode_record.type = 'free_months' THEN
        -- Вычисляем дату окончания
        new_ends_at := NOW() + INTERVAL '1 month' * promocode_record.value::INTEGER;
        
        -- Создаем подписку
        INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at)
        VALUES (user_uuid, plan_id, 'active', NOW(), new_ends_at)
        RETURNING id INTO subscription_id;
        
        -- Записываем использование промокода
        INSERT INTO promocode_usage (promocode_id, user_id, subscription_id, free_months)
        VALUES (promocode_record.id, user_uuid, subscription_id, promocode_record.value::INTEGER);
        
        -- Обновляем счетчик использования
        UPDATE promocodes 
        SET used_count = used_count + 1, updated_at = NOW()
        WHERE id = promocode_record.id;
        
        RETURN json_build_object(
            'success', true,
            'subscription_created', true,
            'subscription_id', subscription_id,
            'promocode', json_build_object(
                'id', promocode_record.id,
                'code', promocode_record.code,
                'name', promocode_record.name,
                'type', promocode_record.type,
                'value', promocode_record.value
            ),
            'subscription', json_build_object(
                'plan_name', plan_record.name,
                'ends_at', new_ends_at,
                'status', 'active'
            ),
            'message', 'Подписка активирована! Вы получили ' || promocode_record.value || ' месяцев бесплатно.'
        );
    ELSE
        -- Для других типов промокодов возвращаем информацию для оплаты
        RETURN json_build_object(
            'success', true,
            'subscription_created', false,
            'promocode', json_build_object(
                'id', promocode_record.id,
                'code', promocode_record.code,
                'name', promocode_record.name,
                'type', promocode_record.type,
                'value', promocode_record.value
            ),
            'message', 'Промокод применен! Скидка будет учтена при оплате.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
