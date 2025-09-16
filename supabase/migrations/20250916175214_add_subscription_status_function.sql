-- Функция для получения текущего статуса подписки пользователя
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    subscription_record RECORD;
    plan_record RECORD;
    result JSON;
BEGIN
    -- Проверяем, что пользователь запрашивает для себя
    IF user_uuid != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied: You can only check your own subscription'
        );
    END IF;
    
    -- Получаем активную подписку пользователя
    SELECT s.*, p.name as plan_name, p.price_per_month, p.duration_months
    INTO subscription_record
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND (s.ends_at IS NULL OR s.ends_at > NOW())
    ORDER BY s.ends_at DESC
    LIMIT 1;
    
    IF subscription_record.id IS NULL THEN
        -- Проверяем, был ли когда-либо триал для этого пользователя
        IF EXISTS (SELECT 1 FROM ip_trials WHERE user_id = user_uuid) THEN
            RETURN json_build_object(
                'success', true,
                'has_subscription', false,
                'status', 'free',
                'plan_name', 'Бесплатный (триал истек)',
                'ends_at', NULL,
                'is_active', FALSE
            );
        ELSE
            RETURN json_build_object(
                'success', true,
                'has_subscription', false,
                'status', 'free',
                'plan_name', 'Бесплатный',
                'ends_at', NULL,
                'is_active', FALSE
            );
        END IF;
    END IF;
    
    -- Возвращаем информацию о подписке
    RETURN json_build_object(
        'success', true,
        'has_subscription', true,
        'status', subscription_record.status,
        'plan_name', subscription_record.plan_name,
        'ends_at', subscription_record.ends_at,
        'is_active', TRUE,
        'subscription_id', subscription_record.id,
        'starts_at', subscription_record.starts_at,
        'price_per_month', subscription_record.price_per_month,
        'duration_months', subscription_record.duration_months
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
