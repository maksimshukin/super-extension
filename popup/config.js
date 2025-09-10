// config.js - Конфиг только для popup (без экспортов)
// Делаем конфиг доступным глобально для popup.js
window.SHIFT_SUPABASE_CONFIG = {
    url: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};
console.log('[POPUP CONFIG] Конфигурация Supabase загружена:', window.SHIFT_SUPABASE_CONFIG);
