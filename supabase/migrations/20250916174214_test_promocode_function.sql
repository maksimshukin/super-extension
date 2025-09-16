-- Тестовая функция для проверки промокодов
CREATE OR REPLACE FUNCTION test_apply_promocode(
    promocode_text TEXT,
    user_uuid UUID,
    plan_id UUID
) RETURNS JSON AS $$
DECLARE
    promocode_record RECORD;
    plan_record RECORD;
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
    AND is_active = TRUE;
    
    IF promocode_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Промокод не найден или недействителен'
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
    
    -- Возвращаем успешный результат
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
            'amount', 0,
            'free_months', CASE WHEN promocode_record.type = 'free_months' THEN promocode_record.value::INTEGER ELSE 0 END
        ),
        'message', 'Промокод найден и действителен'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
