const tweakUiCheckbox = document.getElementById('tweak-ui');

// Загружаем сохраненные настройки
chrome.storage.local.get(['tweakUiEnabled'], (result) => {
  tweakUiCheckbox.checked = !!result.tweakUiEnabled;
});

// Сохраняем настройки при изменении
tweakUiCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ tweakUiEnabled: tweakUiCheckbox.checked });
});
