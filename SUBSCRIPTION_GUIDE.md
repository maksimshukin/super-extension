# 🎯 Руководство по системе подписок

## 📋 Что было создано

### Таблицы:
- **`plans`** - тарифные планы
- **`subscriptions`** - подписки пользователей
- **`subscriptions_view`** - представление для удобного просмотра

### Тарифы:
- **Бесплатно** (0₽, бессрочно)
- **1 месяц** (300₽)
- **3 месяца** (300₽/мес, скидка 10%)
- **12 месяцев** (300₽/мес, скидка 20%)

## 🚀 Как назначить тариф пользователю

### 1. Найдите UUID пользователя:
```sql
SELECT id, email, raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'user@example.com';
```

### 2. Найдите UUID тарифа:
```sql
SELECT id, name FROM plans WHERE name = '1 месяц';
```

### 3. Назначьте тариф:
```sql
SELECT assign_plan_to_user('USER_UUID', 'PLAN_UUID');
```

## 📊 Полезные запросы

### Просмотр всех подписок:
```sql
SELECT * FROM subscriptions_view ORDER BY "Начало" DESC;
```

### Активные подписки:
```sql
SELECT * FROM subscriptions_view 
WHERE "Статус доступа" = 'Активна';
```

### Истекшие подписки:
```sql
SELECT * FROM subscriptions_view 
WHERE "Активна до" < NOW() AND "Статус" = 'active';
```

### Проверка доступа пользователя:
```sql
SELECT check_user_access('USER_UUID');
```

## 🔧 Функции

- **`assign_plan_to_user(user_uuid, plan_uuid)`** - назначить тариф
- **`get_user_active_subscription(user_uuid)`** - получить активную подписку
- **`check_user_access(user_uuid)`** - проверить доступ
- **`get_user_subscription_info(user_uuid)`** - получить полную информацию

## ⚡ Автоматические функции

- **Автоматическое вычисление даты окончания** подписки
- **Автоматическое обновление** поля `updated_at`
- **Уникальность** - один пользователь = одна активная подписка
- **RLS политики** для безопасности

## 🎯 Примеры использования

Смотрите файл `supabase_examples.sql` для подробных примеров всех запросов.
