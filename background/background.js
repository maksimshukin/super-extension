
import '../supabase.js';
import { SUPABASE_CONFIG } from '../popup/config.js';

// Функция для определения статуса доступа (как в popup.js)
function getUserAccessStatus(profile) {
  if (!profile || !profile.plan_id || !profile.subscription_end_date) return 'free';
  const endDate = new Date(profile.subscription_end_date);
  return endDate > new Date() ? 'advanced' : 'expired';
}

// Инициализация Supabase с проверкой ошибок
let supabase;
try {
  if (!self.supabase) {
    throw new Error('Supabase library not loaded. Check supabase.js import.');
  }
  if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
    throw new Error('SUPABASE_CONFIG is missing or incomplete.');
  }
  supabase = self.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
  console.log('[BG] Service worker started. Supabase client initialized successfully.');
} catch (error) {
  console.error('[BG] CRITICAL ERROR: Failed to initialize Supabase:', error);
  // Создаем заглушку для предотвращения дальнейших ошибок
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } })
        })
      })
    })
  };
}

// Функция для получения и сохранения данных о пользователе и решениях
async function fetchAndStoreUserData() {
  console.log('[BG] fetchAndStoreUserData: start');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[BG] getSession error:', sessionError);
    }
    console.log('[BG] getSession result:', { hasSession: !!session, userId: session?.user?.id });
    
    if (session) {
      console.log('[BG] Fetching profile and solutions for user:', session.user.id);
      const [profileResponse, solutionsResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('solutions').select('*')
      ]);
      
      console.log('[BG] Profile response:', { data: profileResponse.data, error: profileResponse.error });
      console.log('[BG] Solutions response:', { count: solutionsResponse.data?.length, error: solutionsResponse.error });
      
      if (profileResponse.error) console.error('[BG] profiles error:', profileResponse.error);
      if (solutionsResponse.error) console.error('[BG] solutions error:', solutionsResponse.error);
      
      // Определяем статус пользователя на основе профиля
      const userStatus = getUserAccessStatus(profileResponse.data);
      console.log('[BG] Calculated userStatus:', userStatus);
      
      const dataToStore = {
        userProfile: profileResponse.data,
        allSolutions: solutionsResponse.data || [],
        userStatus: userStatus
      };
      
      console.log('[BG] Storing data to chrome.storage.local:', dataToStore);
      chrome.storage.local.set(dataToStore, () => {
        console.log('[BG] Storage set complete.');
        // Проверяем, что данные действительно сохранились
        chrome.storage.local.get(['userStatus', 'allSolutions', 'userProfile'], (stored) => {
          console.log('[BG] Verification - stored data:', stored);
        });
      });
    } else {
      console.log('[BG] No session. Clearing storage keys.');
      chrome.storage.local.remove(['userProfile', 'allSolutions', 'userStatus'], () => console.log('[BG] Storage cleared.'));
      
      // Для тестирования добавляем тестовые данные, если нет сессии
      console.log('[BG] Adding test data for development...');
      const testData = {
        userProfile: {
          id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          plan_id: null,
          subscription_end_date: null
        },
        allSolutions: [
          {
            id: 1,
            solution_code: 'super-slider',
            name: 'Супер Слайдер',
            description: 'Создание красивых слайдеров',
            is_free: true
          },
          {
            id: 2,
            solution_code: 'super-grid',
            name: 'Супер Грид',
            description: 'Адаптивная сетка',
            is_free: false
          },
          {
            id: 3,
            solution_code: 'grid-stacks',
            name: 'Грид-стеки',
            description: 'Стеки с разными размерами',
            is_free: true
          },
          {
            id: 4,
            solution_code: 'custom-html',
            name: 'Кастомный HTML',
            description: 'Свободный HTML блок',
            is_free: true
          }
        ],
        userStatus: 'free'
      };
      
      chrome.storage.local.set(testData, () => {
        console.log('[BG] Test data stored for development');
      });
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
  } else if (message.type === 'REQUEST_USER_DATA') {
    console.log('[BG] Content script запросил данные пользователя');
    fetchAndStoreUserData().then(() => {
      console.log('[BG] Данные обновлены по запросу content script');
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('[BG] Ошибка при обновлении данных по запросу:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Указываем, что ответ будет асинхронным
  }
});

// Также запускаем проверку при первом запуске браузера
console.log('[BG] Initial fetchAndStoreUserData call');
fetchAndStoreUserData().then(() => console.log('[BG] Initial fetch complete.'));
