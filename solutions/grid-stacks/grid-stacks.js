// grid-stacks.js - Модификация для создания грид-стеков

console.log("SHIFT: Модификация 'Грид-стеки' активирована!");

export function init() {
    console.log("SHIFT: Инициализация Грид-стеки...");
    
    // Находим последний добавленный блок
    const lastBlock = document.querySelector('#rec' + window.afterid);
    if (!lastBlock) {
        console.error('SHIFT: Не удалось найти последний добавленный блок');
        return;
    }
    
    // Создаем грид-стеки с разными размерами
    lastBlock.innerHTML = `
        <div class="t-container">
            <div class="grid-stacks" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px;">
                <div class="stack-item" style="grid-column: span 6; grid-row: span 2; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white;">
                    <h3>Большой блок</h3>
                    <p>Занимает 6 колонок и 2 ряда</p>
                </div>
                <div class="stack-item" style="grid-column: span 3; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white;">
                    <h4>Средний блок</h4>
                    <p>3 колонки</p>
                </div>
                <div class="stack-item" style="grid-column: span 3; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white;">
                    <h4>Средний блок</h4>
                    <p>3 колонки</p>
                </div>
                <div class="stack-item" style="grid-column: span 4; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 12px; color: white;">
                    <h4>Широкий блок</h4>
                    <p>4 колонки</p>
                </div>
                <div class="stack-item" style="grid-column: span 4; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white;">
                    <h4>Широкий блок</h4>
                    <p>4 колонки</p>
                </div>
                <div class="stack-item" style="grid-column: span 4; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 12px; color: #333;">
                    <h4>Широкий блок</h4>
                    <p>4 колонки</p>
                </div>
            </div>
        </div>
    `;
    
    console.log("SHIFT: Грид-стеки успешно применены!");
}
