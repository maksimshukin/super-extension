-- Проверяем структуру таблицы plans
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'plans' 
ORDER BY ordinal_position;

-- Проверяем данные в таблице plans
SELECT * FROM plans ORDER BY duration_months;

-- Проверяем структуру таблицы promocodes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promocodes' 
ORDER BY ordinal_position;

-- Проверяем данные в таблице promocodes
SELECT * FROM promocodes WHERE code = 'FREE3MONTHS';
