-- Отладочная функция для проверки промокодов
CREATE OR REPLACE FUNCTION debug_apply_promocode(
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
    
    -- Возвращаем отладочную информацию
    result := json_build_object(
        'success', true,
        'debug_info', json_build_object(
            'promocode_found', TRUE,
            'promocode_id', promocode_record.id,
            'promocode_code', promocode_record.code,
            'promocode_type', promocode_record.type,
            'promocode_value', promocode_record.value,
            'plan_found', TRUE,
            'plan_id', plan_record.id,
            'plan_name', plan_record.name,
            'plan_duration', plan_record.duration_months,
            'user_id', user_uuid
        ),
        'message', 'Отладочная информация получена успешно'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
