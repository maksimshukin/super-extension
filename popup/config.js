// config.js (popup) — подключается обычным <script>
// Делаем конфиг доступным глобально для popup.js и экспортируем для background
const SUPABASE_CONFIG = {
	URL: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
	ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};

// Глобально для popup.js
self.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Экспорт для background.js (ESM)
export { SUPABASE_CONFIG };
