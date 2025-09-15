// config.js - Конфигурация Supabase
// ВАЖНО: Замените эти значения на ваши реальные данные из Supabase

window.dbmSUPER_SUPABASE_CONFIG = {
    // URL вашего проекта Supabase (найдите в настройках проекта)
    url: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
    
    // Anon key из настроек API вашего проекта Supabase
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};

console.log('[POPUP CONFIG] Конфигурация Supabase загружена:', !!window.dbmSUPER_SUPABASE_CONFIG);
console.log('[POPUP CONFIG] URL:', window.dbmSUPER_SUPABASE_CONFIG?.url);
console.log('[POPUP CONFIG] Anon Key:', window.dbmSUPER_SUPABASE_CONFIG?.anonKey ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
