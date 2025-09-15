-- Добавляем недостающие колонки в таблицу subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Создаем представление subscriptions_view
CREATE OR REPLACE VIEW subscriptions_view AS
SELECT 
    s.id,
    s.user_id,
    s.status as "Статус",
    p.name as "Тариф",
    s.created_at as "Начало",
    COALESCE(s.ends_at, s.updated_at) as "Активна до",
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as "Имя и Фамилия",
    u.email
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN auth.users u ON s.user_id = u.id;
