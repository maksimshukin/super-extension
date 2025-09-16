-- Создаем отладочную функцию для проверки типов данных
CREATE OR REPLACE FUNCTION debug_apply_promocode_detailed(
    promocode_text TEXT,
    user_uuid UUID,
    plan_id TEXT
) RETURNS JSON AS $$
DECLARE
    promocode_record RECORD;
    plan_record RECORD;
    result JSON;
BEGIN
    -- Логируем входящие параметры
    RAISE NOTICE 'debug_apply_promocode_detailed called with: promocode_text=%, user_uuid=%, plan_id=%', 
        promocode_text, user_uuid, plan_id;
    
    -- Проверяем тип plan_id
    RAISE NOTICE 'plan_id type: %, value: %', pg_typeof(plan_id), plan_id;
    
    -- Получаем информацию о промокоде
    SELECT * INTO promocode_record
    FROM promocodes 
    WHERE code = UPPER(TRIM(promocode_text));
    
    -- Получаем информацию о тарифе
    SELECT * INTO plan_record
    FROM plans 
    WHERE id::TEXT = plan_id;
    
    RETURN json_build_object(
        'input_params', json_build_object(
            'promocode_text', promocode_text,
            'user_uuid', user_uuid::TEXT,
            'plan_id', plan_id,
            'plan_id_type', pg_typeof(plan_id)::TEXT
        ),
        'promocode_found', promocode_record.id IS NOT NULL,
        'promocode_data', CASE 
            WHEN promocode_record.id IS NOT NULL THEN
                json_build_object(
                    'id', promocode_record.id,
                    'code', promocode_record.code,
                    'type', promocode_record.type,
                    'value', promocode_record.value
                )
            ELSE NULL
        END,
        'plan_found', plan_record.id IS NOT NULL,
        'plan_data', CASE 
            WHEN plan_record.id IS NOT NULL THEN
                json_build_object(
                    'id', plan_record.id,
                    'name', plan_record.name,
                    'duration_months', plan_record.duration_months,
                    'price_per_month', plan_record.price_per_month
                )
            ELSE NULL
        END,
        'plans_table_structure', (
            SELECT json_agg(
                json_build_object(
                    'column_name', column_name,
                    'data_type', data_type
                )
            )
            FROM information_schema.columns 
            WHERE table_name = 'plans'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
