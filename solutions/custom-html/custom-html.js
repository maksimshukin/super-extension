// custom-html.js - Модификация для добавления кастомного HTML

console.log("SHIFT: Модификация 'Кастомный HTML' активирована!");

export function init() {
    console.log("SHIFT: Инициализация Кастомный HTML...");
    
    // Находим последний добавленный блок
    const lastBlock = document.querySelector('#rec' + window.afterid);
    if (!lastBlock) {
        console.error('SHIFT: Не удалось найти последний добавленный блок');
        return;
    }
    
    // Добавляем кастомный HTML с интерактивными элементами
    lastBlock.innerHTML = `
        <div class="t-container">
            <div class="custom-html-demo" style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white; text-align: center;">
                <h2 style="margin-bottom: 20px; font-size: 2.5em;">Кастомный HTML блок</h2>
                <p style="margin-bottom: 30px; font-size: 1.2em; opacity: 0.9;">Создан с помощью SHIFT расширения</p>
                
                <div class="interactive-demo" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
                    <button onclick="this.style.transform='scale(1.1)'; setTimeout(() => this.style.transform='scale(1)', 200)" 
                            style="padding: 15px 30px; background: rgba(255,255,255,0.2); border: 2px solid white; border-radius: 25px; color: white; cursor: pointer; transition: all 0.3s ease;">
                        Интерактивная кнопка
                    </button>
                    
                    <div class="counter-demo" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; min-width: 200px;">
                        <h4>Счетчик кликов:</h4>
                        <p id="click-counter" style="font-size: 2em; margin: 10px 0;">0</p>
                        <button onclick="document.getElementById('click-counter').textContent = parseInt(document.getElementById('click-counter').textContent) + 1"
                                style="padding: 10px 20px; background: white; color: #667eea; border: none; border-radius: 20px; cursor: pointer;">
                            +1
                        </button>
                    </div>
                </div>
                
                <div class="features" style="margin-top: 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
                        <h4>✨ Адаптивность</h4>
                        <p>Работает на всех устройствах</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
                        <h4>🎨 Кастомизация</h4>
                        <p>Полная свобода в дизайне</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
                        <h4>⚡ Производительность</h4>
                        <p>Быстрая загрузка и работа</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log("SHIFT: Кастомный HTML успешно применен!");
}
