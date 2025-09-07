// Загружаем библиотеку Supabase как сайд-эффект (UMD выставляет глобальный supabase)
import '../supabase.js';
// Импортируем конфиг (ESM экспорт)
// Дублируем конфиг локально для service worker, чтобы не зависеть от глобали popup
const SUPABASE_CONFIG = {
  URL: 'https://wddhjwzwxeucaynfxvjn.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGhqd3p3eGV1Y2F5bmZ4dmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjc0NTQsImV4cCI6MjA3Mjc0MzQ1NH0.dfM39SUyQWQLi8fuZLbjA4COdNBwxoWk_sa4SI6a_u8'
};

// Используем глобальный supabase из загруженного UMD-скрипта
const supabase = self.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
console.log('[BG] Service worker started. Supabase client initialized.');

// Функция для получения и сохранения данных о пользователе и решениях
async function fetchAndStoreUserData() {
  console.log('[BG] fetchAndStoreUserData: start');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[BG] getSession error:', sessionError);
    }
    console.log('[BG] getSession:', !!session);
    if (session) {
      console.log('[BG] Fetching profile and solutions for user:', session.user.id);
      const [profileResponse, solutionsResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('solutions').select('*')
      ]);
      if (profileResponse.error) console.error('[BG] profiles error:', profileResponse.error);
      if (solutionsResponse.error) console.error('[BG] solutions error:', solutionsResponse.error);
      console.log('[BG] Storing userProfile and allSolutions to chrome.storage.local');
      chrome.storage.local.set({
        userProfile: profileResponse.data,
        allSolutions: solutionsResponse.data
      }, () => console.log('[BG] Storage set complete.'));
    } else {
      console.log('[BG] No session. Clearing storage keys.');
      chrome.storage.local.remove(['userProfile', 'allSolutions'], () => console.log('[BG] Storage cleared.'));
    }
  } catch (err) {
    console.error('[BG] fetchAndStoreUserData UNHANDLED ERROR:', err);
  }
}

// Слушаем сообщения от других частей расширения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BG] onMessage:', message);
  if (message.type === 'USER_LOGGED_IN' || message.type === 'USER_LOGGED_OUT') {
    console.log('[BG] USER_* message received. Updating user data...');
    fetchAndStoreUserData();
  }
});

// Также запускаем проверку при первом запуске браузера
console.log('[BG] Initial fetchAndStoreUserData call');
fetchAndStoreUserData().then(() => console.log('[BG] Initial fetch complete.'));
