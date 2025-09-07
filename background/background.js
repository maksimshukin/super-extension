// Импортируем библиотеку и ключи (в Service Worker это делается так)
import { createClient } from '../supabase.js';
import { SUPABASE_CONFIG } from '../popup/config.js';

const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Функция для получения и сохранения данных о пользователе и решениях
async function fetchAndStoreUserData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Одновременно запрашиваем профиль и все решения
    const [profileResponse, solutionsResponse] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('solutions').select('*')
    ]);

    // Сохраняем все в локальное хранилище расширения
    chrome.storage.local.set({
      userProfile: profileResponse.data,
      allSolutions: solutionsResponse.data
    });
  } else {
    // Если сессии нет, очищаем хранилище
    chrome.storage.local.remove(['userProfile', 'allSolutions']);
  }
}

// Слушаем сообщения от других частей расширения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'USER_LOGGED_IN' || message.type === 'USER_LOGGED_OUT') {
    console.log('Background: Получено сообщение, обновляю данные пользователя...');
    fetchAndStoreUserData();
  }
});

// Также запускаем проверку при первом запуске браузера
fetchAndStoreUserData();
