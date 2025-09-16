-- =====================================================
-- СИСТЕМА АВТОМАТИЧЕСКОГО БЕСПЛАТНОГО ТРИАЛА
-- =====================================================

-- 1. Создаем таблицу для отслеживания IP адресов
CREATE TABLE IF NOT EXISTS ip_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Уникальность: один IP может иметь только один активный триал
    UNIQUE(ip_address, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Создаем специальный тариф "Бесплатный триал 3 дня"
-- Сначала проверяем, существует ли уже такой тариф
INSERT INTO plans (name, price_per_month, duration_months, is_free, description, features) 
SELECT 
    'Бесплатный триал', 
    0, 
    0, -- 0 означает, что длительность будет задана вручную
    TRUE, 
    '3 дня бесплатного доступа ко всем функциям', 
    '["Все функции", "Неограниченные эффекты", "3 дня доступа"]'
WHERE NOT EXISTS (
    SELECT 1 FROM plans WHERE name = 'Бесплатный триал'
);

-- 3. Создаем функцию для проверки, можно ли дать триал с этого IP
CREATE OR REPLACE FUNCTION can_give_trial_from_ip(ip_addr INET)
RETURNS BOOLEAN AS $$
DECLARE
    existing_trial_count INTEGER;
    trial_duration INTERVAL := '3 days';
BEGIN
    -- Проверяем, есть ли активный триал с этого IP за последние 30 дней
    SELECT COUNT(*) INTO existing_trial_count
    FROM ip_trials 
    WHERE ip_address = ip_addr 
    AND trial_started_at > NOW() - INTERVAL '30 days'
    AND is_active = TRUE;
    
    -- Если триал уже был использован, возвращаем FALSE
    RETURN existing_trial_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Создаем функцию для создания бесплатного триала
CREATE OR REPLACE FUNCTION create_free_trial(user_uuid UUID, ip_addr INET)
RETURNS UUID AS $$
DECLARE
    trial_plan_id UUID;
    subscription_id UUID;
    trial_ip_id UUID;
    trial_duration INTERVAL := '3 days';
BEGIN
    -- Проверяем, можно ли дать триал с этого IP
    IF NOT can_give_trial_from_ip(ip_addr) THEN
        RAISE EXCEPTION 'Триал с этого IP адреса уже был использован';
    END IF;
    
    -- Получаем ID тарифа "Бесплатный триал"
    SELECT id INTO trial_plan_id
    FROM plans 
    WHERE name = 'Бесплатный триал';
    
    IF trial_plan_id IS NULL THEN
        RAISE EXCEPTION 'Тариф "Бесплатный триал" не найден';
    END IF;
    
    -- Создаем запись об IP триале
    INSERT INTO ip_trials (ip_address, user_id, trial_ended_at)
    VALUES (ip_addr, user_uuid, NOW() + trial_duration)
    RETURNING id INTO trial_ip_id;
    
    -- Создаем подписку на триал
    INSERT INTO subscriptions (user_id, plan_id, status, starts_at, ends_at)
    VALUES (user_uuid, trial_plan_id, 'active', NOW(), NOW() + trial_duration)
    RETURNING id INTO subscription_id;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Создаем функцию для автоматического назначения триала новому пользователю
CREATE OR REPLACE FUNCTION auto_assign_trial_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_ip INET;
    subscription_id UUID;
BEGIN
    -- Получаем IP адрес пользователя из метаданных
    -- В Supabase IP обычно доступен через raw_app_meta_data
    user_ip := COALESCE(
        NEW.raw_app_meta_data->>'ip_address'::INET,
        '127.0.0.1'::INET  -- Fallback для локальной разработки
    );
    
    -- Пытаемся создать триал
    BEGIN
        SELECT create_free_trial(NEW.id, user_ip) INTO subscription_id;
        
        -- Логируем успешное создание триала
        RAISE NOTICE 'Создан бесплатный триал для пользователя % с IP %', NEW.email, user_ip;
        
    EXCEPTION WHEN OTHERS THEN
        -- Если триал не удалось создать (например, IP уже использовался), 
        -- просто логируем и продолжаем
        RAISE NOTICE 'Не удалось создать триал для пользователя %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Создаем триггер для автоматического назначения триала
-- ВНИМАНИЕ: Этот триггер будет срабатывать при создании нового пользователя
-- Но в Supabase auth.users защищена, поэтому создаем альтернативный подход

-- 7. Создаем функцию для ручного назначения триала (вызывается из приложения)
CREATE OR REPLACE FUNCTION assign_trial_to_user_by_ip(user_uuid UUID, ip_addr INET)
RETURNS JSON AS $$
DECLARE
    subscription_id UUID;
    result JSON;
BEGIN
    -- Проверяем, есть ли у пользователя уже активная подписка
    IF EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = user_uuid AND status = 'active'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'У пользователя уже есть активная подписка'
        );
    END IF;
    
    -- Создаем триал
    BEGIN
        SELECT create_free_trial(user_uuid, ip_addr) INTO subscription_id;
        
        result := json_build_object(
            'success', true,
            'subscription_id', subscription_id,
            'message', 'Бесплатный триал на 3 дня успешно создан'
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', SQLERRM
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Создаем функцию для проверки статуса триала по IP
CREATE OR REPLACE FUNCTION get_trial_status_by_ip(ip_addr INET)
RETURNS JSON AS $$
DECLARE
    trial_info RECORD;
    result JSON;
BEGIN
    SELECT 
        it.id,
        it.user_id,
        it.trial_started_at,
        it.trial_ended_at,
        it.is_active,
        u.email,
        CASE 
            WHEN it.trial_ended_at > NOW() THEN 'active'
            ELSE 'expired'
        END as status
    INTO trial_info
    FROM ip_trials it
    LEFT JOIN auth.users u ON it.user_id = u.id
    WHERE it.ip_address = ip_addr 
    AND it.trial_started_at > NOW() - INTERVAL '30 days'
    ORDER BY it.trial_started_at DESC
    LIMIT 1;
    
    IF trial_info IS NULL THEN
        result := json_build_object(
            'has_trial', false,
            'can_get_trial', true,
            'message', 'Триал с этого IP не использовался'
        );
    ELSE
        result := json_build_object(
            'has_trial', true,
            'can_get_trial', trial_info.status = 'expired' AND trial_info.trial_ended_at < NOW() - INTERVAL '30 days',
            'trial_info', json_build_object(
                'user_email', trial_info.email,
                'started_at', trial_info.trial_started_at,
                'ended_at', trial_info.trial_ended_at,
                'status', trial_info.status
            ),
            'message', CASE 
                WHEN trial_info.status = 'active' THEN 'Триал активен'
                ELSE 'Триал истек'
            END
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Настраиваем RLS для таблицы ip_trials
ALTER TABLE ip_trials ENABLE ROW LEVEL SECURITY;

-- Политики для ip_trials (только для чтения, создание через функции)
CREATE POLICY "Users can view own IP trials" ON ip_trials
    FOR SELECT USING (auth.uid() = user_id);

-- 10. Создаем индексы для оптимизации
CREATE INDEX idx_ip_trials_ip_address ON ip_trials(ip_address);
CREATE INDEX idx_ip_trials_user_id ON ip_trials(user_id);
CREATE INDEX idx_ip_trials_trial_started_at ON ip_trials(trial_started_at);
CREATE INDEX idx_ip_trials_is_active ON ip_trials(is_active);

-- 11. Комментарии для документации
COMMENT ON TABLE ip_trials IS 'Таблица для отслеживания бесплатных триалов по IP адресам';
COMMENT ON FUNCTION can_give_trial_from_ip IS 'Проверяет, можно ли дать триал с указанного IP';
COMMENT ON FUNCTION create_free_trial IS 'Создает бесплатный триал для пользователя с проверкой IP';
COMMENT ON FUNCTION assign_trial_to_user_by_ip IS 'Назначает триал пользователю с проверкой IP (вызывается из приложения)';
COMMENT ON FUNCTION get_trial_status_by_ip IS 'Получает статус триала по IP адресу';
