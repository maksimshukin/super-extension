// super-grid.js - Модификация для создания кастомной грид-сетки

console.log("SHIFT: Модификация 'Супер Грид' активирована!");

export function init() {
    console.log("SHIFT: Инициализация Супер Грид...");
    
    // Находим последний добавленный блок (обычно это Zero Block)
    const lastBlock = document.querySelector('#rec' + window.afterid);
    if (!lastBlock) {
        console.error('SHIFT: Не удалось найти последний добавленный блок');
        return;
    }
    
    // Превращаем Zero Block в кастомную грид-сетку
    lastBlock.innerHTML = `
        <div class="t-container">
            <div class="t-grid t-grid_3 t-grid_adaptive">
                <div class="t-grid__item">
                    <div class="t-grid__item-inner" style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <h3>Колонка 1</h3>
                        <p>Содержимое первой колонки</p>
                    </div>
                </div>
                <div class="t-grid__item">
                    <div class="t-grid__item-inner" style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <h3>Колонка 2</h3>
                        <p>Содержимое второй колонки</p>
                    </div>
                </div>
                <div class="t-grid__item">
                    <div class="t-grid__item-inner" style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <h3>Колонка 3</h3>
                        <p>Содержимое третьей колонки</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log("SHIFT: Супер Грид успешно применен!");
}
