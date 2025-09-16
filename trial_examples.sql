-- =====================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ СИСТЕМЫ БЕСПЛАТНЫХ ТРИАЛОВ
-- =====================================================

-- 1. ПРОВЕРКА СТАТУСА ТРИАЛА ПО IP
-- Замените '192.168.1.1' на реальный IP адрес
SELECT get_trial_status_by_ip('192.168.1.1'::INET);

-- 2. НАЗНАЧЕНИЕ ТРИАЛА ПОЛЬЗОВАТЕЛЮ
-- Замените 'USER_UUID' на UUID пользователя и '192.168.1.1' на IP
SELECT assign_trial_to_user_by_ip('USER_UUID', '192.168.1.1'::INET);

-- 3. ПРОВЕРКА, МОЖНО ЛИ ДАТЬ ТРИАЛ С IP
SELECT can_give_trial_from_ip('192.168.1.1'::INET);

-- 4. ПРОСМОТР ВСЕХ ТРИАЛОВ ПО IP
SELECT 
    ip_address,
    u.email as user_email,
    trial_started_at,
    trial_ended_at,
    is_active,
    CASE 
        WHEN trial_ended_at > NOW() THEN 'active'
        ELSE 'expired'
    END as status
FROM ip_trials it
LEFT JOIN auth.users u ON it.user_id = u.id
WHERE ip_address = '192.168.1.1'::INET
ORDER BY trial_started_at DESC;

-- 5. ПОИСК ВСЕХ АКТИВНЫХ ТРИАЛОВ
SELECT 
    ip_address,
    u.email as user_email,
    trial_started_at,
    trial_ended_at,
    NOW() - trial_started_at as duration_so_far
FROM ip_trials it
LEFT JOIN auth.users u ON it.user_id = u.id
WHERE is_active = TRUE 
AND trial_ended_at > NOW()
ORDER BY trial_started_at DESC;

-- 6. ПОИСК ИСТЕКШИХ ТРИАЛОВ
SELECT 
    ip_address,
    u.email as user_email,
    trial_started_at,
    trial_ended_at,
    NOW() - trial_ended_at as time_since_expired
FROM ip_trials it
LEFT JOIN auth.users u ON it.user_id = u.id
WHERE is_active = TRUE 
AND trial_ended_at < NOW()
ORDER BY trial_ended_at DESC;

-- 7. СТАТИСТИКА ПО ТРИАЛАМ
SELECT 
    COUNT(*) as total_trials,
    COUNT(CASE WHEN trial_ended_at > NOW() THEN 1 END) as active_trials,
    COUNT(CASE WHEN trial_ended_at < NOW() THEN 1 END) as expired_trials,
    COUNT(DISTINCT ip_address) as unique_ips
FROM ip_trials
WHERE trial_started_at > NOW() - INTERVAL '30 days';

-- 8. ПОИСК ПОДОЗРИТЕЛЬНОЙ АКТИВНОСТИ (много триалов с одного IP)
SELECT 
    ip_address,
    COUNT(*) as trial_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(trial_started_at) as first_trial,
    MAX(trial_started_at) as last_trial
FROM ip_trials
WHERE trial_started_at > NOW() - INTERVAL '30 days'
GROUP BY ip_address
HAVING COUNT(*) > 3
ORDER BY trial_count DESC;

-- 9. ОЧИСТКА СТАРЫХ ТРИАЛОВ (старше 30 дней)
-- ВНИМАНИЕ: Это удалит данные! Используйте осторожно
-- DELETE FROM ip_trials 
-- WHERE trial_started_at < NOW() - INTERVAL '30 days';

-- 10. ОБНОВЛЕНИЕ СТАТУСА ТРИАЛА (пометить как неактивный)
-- UPDATE ip_trials 
-- SET is_active = FALSE 
-- WHERE ip_address = '192.168.1.1'::INET 
-- AND is_active = TRUE;

-- 11. ПРОСМОТР ТРИАЛОВ С ИНФОРМАЦИЕЙ О ПОДПИСКАХ
SELECT 
    it.ip_address,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    it.trial_started_at,
    it.trial_ended_at,
    s.status as subscription_status,
    p.name as plan_name,
    s.ends_at as subscription_ends_at
FROM ip_trials it
LEFT JOIN auth.users u ON it.user_id = u.id
LEFT JOIN subscriptions s ON it.user_id = s.user_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE it.trial_started_at > NOW() - INTERVAL '7 days'
ORDER BY it.trial_started_at DESC;

-- 12. ПОИСК ПОЛЬЗОВАТЕЛЕЙ С ТРИАЛАМИ, КОТОРЫЕ НЕ ОФОРМИЛИ ПОДПИСКУ
SELECT 
    it.ip_address,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    it.trial_started_at,
    it.trial_ended_at,
    CASE 
        WHEN it.trial_ended_at > NOW() THEN 'Триал активен'
        ELSE 'Триал истек'
    END as trial_status
FROM ip_trials it
LEFT JOIN auth.users u ON it.user_id = u.id
LEFT JOIN subscriptions s ON it.user_id = s.user_id AND s.status = 'active'
WHERE s.id IS NULL  -- Нет активной подписки
AND it.trial_started_at > NOW() - INTERVAL '7 days'
ORDER BY it.trial_started_at DESC;
