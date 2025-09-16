-- Исправление функции apply_promocode для правильной проверки использования
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
