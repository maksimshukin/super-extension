// Конфигурация блоков SHIFT для интеграции с Tilda
// Этот файл содержит блоки в формате dbmBlocks.push()

// Функция для создания блоков SHIFT
function dbmCreateShiftBlocks() {
    console.log('[SHIFT] Создание блоков для Tilda...');
    
    // Получаем данные пользователя из глобальных переменных
    const userStatus = window.shiftUserStatus || 'free';
    const allSolutions = window.shiftAllSolutions || [];
    
    console.log('[SHIFT] Данные пользователя:', { userStatus, solutionsCount: allSolutions.length });
    
    // Проверяем доступ к каждому решению
    const superSliderSolution = allSolutions.find(s => s.solution_code === 'super-slider');
    const superGridSolution = allSolutions.find(s => s.solution_code === 'super-grid');
    const gridStacksSolution = allSolutions.find(s => s.solution_code === 'grid-stacks');
    const customHtmlSolution = allSolutions.find(s => s.solution_code === 'custom-html');
    
    // Блок Супер Слайдер
    const superSliderAccess = superSliderSolution ? (userStatus === 'advanced' || superSliderSolution.is_free) : true;
    dbmBlocks.push({
        name: "Супер Слайдер",
        cod: "SHF001",
        descr: "Создание красивых слайдеров с настройками",
        descr_ru: "Создание красивых слайдеров с настройками",
        disableforplan0: superSliderAccess ? "n" : "y", // Доступ на основе подписки
        icon: "https://static.tildacdn.com/tild6136-3535-4537-a132-396530656362/slider-icon.svg",
        icon2: "",
        id: "201",
        inlib: "y",
        filter: "SHIFT Модификации",
        title: "Супер Слайдер",
        modsettings: [{
            id: "1",
            title: "Тип слайдера",
            name: "sliderType",
            type: "select",
            options: {
                "Горизонтальный": "horizontal",
                "Вертикальный": "vertical",
                "Fade": "fade"
            },
            value: "horizontal"
        }, {
            id: "2",
            title: "Автопрокрутка",
            name: "autoplay",
            type: "checkbox",
            value: "1"
        }, {
            id: "3",
            title: "Скорость автопрокрутки (сек)",
            name: "autoplaySpeed",
            type: "number",
            placeholder: "3",
            value: "3"
        }, {
            id: "4",
            title: "Показывать точки навигации",
            name: "showDots",
            type: "checkbox",
            value: "1"
        }, {
            id: "5",
            title: "Показывать стрелки",
            name: "showArrows",
            type: "checkbox",
            value: "1"
        }],
        moddemolive: `
            <div class="shift-slider-demo">
                <div class="slider-container">
                    <div class="slide active">Слайд 1</div>
                    <div class="slide">Слайд 2</div>
                    <div class="slide">Слайд 3</div>
                </div>
                <div class="slider-dots">
                    <span class="dot active"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
            <style>
                .shift-slider-demo {
                    width: 100%;
                    height: 200px;
                    position: relative;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .slider-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                .slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                .slide.active {
                    opacity: 1;
                }
                .slider-dots {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                }
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .dot.active {
                    background: white;
                }
            </style>
        `,
        moddefaultsettings: '{"sliderType":"horizontal","autoplay":"1","autoplaySpeed":"3","showDots":"1","showArrows":"1"}',
        runDemo: function(settings) {
            console.log('[SHIFT] Запуск демо Супер Слайдер с настройками:', settings);
            // Здесь будет логика демо
        },
        modInputChange: function(settings) {
            console.log('[SHIFT] Изменение настроек Супер Слайдер:', settings);
            // Здесь будет логика изменения настроек
        },
        modcontent: function(settings) {
            console.log('[SHIFT] Генерация контента Супер Слайдер:', settings);
            return `
                <div class="shift-super-slider" data-settings='${JSON.stringify(settings)}'>
                    <div class="slider-wrapper">
                        <div class="slider-track">
                            <div class="slide">Слайд 1</div>
                            <div class="slide">Слайд 2</div>
                            <div class="slide">Слайд 3</div>
                        </div>
                        ${settings.showArrows === "1" ? `
                            <button class="slider-arrow prev">‹</button>
                            <button class="slider-arrow next">›</button>
                        ` : ''}
                    </div>
                    ${settings.showDots === "1" ? `
                        <div class="slider-dots">
                            <span class="dot active"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    ` : ''}
                </div>
                <style>
                    .shift-super-slider {
                        position: relative;
                        width: 100%;
                        overflow: hidden;
                    }
                    .slider-wrapper {
                        position: relative;
                        width: 100%;
                    }
                    .slider-track {
                        display: flex;
                        transition: transform 0.5s ease;
                    }
                    .slide {
                        min-width: 100%;
                        height: 300px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .slider-arrow {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5);
                        color: white;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                        z-index: 10;
                    }
                    .slider-arrow.prev {
                        left: 10px;
                    }
                    .slider-arrow.next {
                        right: 10px;
                    }
                    .slider-dots {
                        display: flex;
                        justify-content: center;
                        gap: 8px;
                        margin-top: 15px;
                    }
                    .dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #ccc;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }
                    .dot.active {
                        background: #667eea;
                    }
                </style>
                <script>
                    (function() {
                        const slider = document.querySelector('.shift-super-slider');
                        const track = slider.querySelector('.slider-track');
                        const slides = slider.querySelectorAll('.slide');
                        const dots = slider.querySelectorAll('.dot');
                        const prevBtn = slider.querySelector('.slider-arrow.prev');
                        const nextBtn = slider.querySelector('.slider-arrow.next');
                        const settings = JSON.parse(slider.dataset.settings);
                        
                        let currentSlide = 0;
                        let autoplayInterval;
                        
                        function updateSlider() {
                            track.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
                            dots.forEach((dot, index) => {
                                dot.classList.toggle('active', index === currentSlide);
                            });
                        }
                        
                        function nextSlide() {
                            currentSlide = (currentSlide + 1) % slides.length;
                            updateSlider();
                        }
                        
                        function prevSlide() {
                            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                            updateSlider();
                        }
                        
                        function startAutoplay() {
                            if (settings.autoplay === "1") {
                                autoplayInterval = setInterval(nextSlide, settings.autoplaySpeed * 1000);
                            }
                        }
                        
                        function stopAutoplay() {
                            clearInterval(autoplayInterval);
                        }
                        
                        // Event listeners
                        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
                        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
                        
                        dots.forEach((dot, index) => {
                            dot.addEventListener('click', () => {
                                currentSlide = index;
                                updateSlider();
                            });
                        });
                        
                        slider.addEventListener('mouseenter', stopAutoplay);
                        slider.addEventListener('mouseleave', startAutoplay);
                        
                        startAutoplay();
                    })();
                </script>
            `;
        },
        instruction: "Супер Слайдер - создает красивый слайдер с настройками автопрокрутки, навигации и стилизации."
    });

    // Блок Супер Грид
    const superGridAccess = superGridSolution ? (userStatus === 'advanced' || superGridSolution.is_free) : false;
    dbmBlocks.push({
        name: "Супер Грид",
        cod: "SHF002",
        descr: "Адаптивная сетка с настройками",
        descr_ru: "Адаптивная сетка с настройками",
        disableforplan0: superGridAccess ? "n" : "y", // Доступ на основе подписки
        icon: "https://static.tildacdn.com/tild6136-3535-4537-a132-396530656362/grid-icon.svg",
        icon2: "",
        id: "202",
        inlib: "y",
        filter: "SHIFT Модификации",
        title: "Супер Грид",
        modsettings: [{
            id: "1",
            title: "Количество колонок",
            name: "columns",
            type: "select",
            options: {
                "2 колонки": "2",
                "3 колонки": "3",
                "4 колонки": "4",
                "5 колонок": "5",
                "6 колонок": "6"
            },
            value: "3"
        }, {
            id: "2",
            title: "Отступ между элементами (px)",
            name: "gap",
            type: "number",
            placeholder: "20",
            value: "20"
        }, {
            id: "3",
            title: "Высота элементов (px)",
            name: "itemHeight",
            type: "number",
            placeholder: "200",
            value: "200"
        }, {
            id: "4",
            title: "Анимация появления",
            name: "animation",
            type: "select",
            options: {
                "Без анимации": "none",
                "Fade In": "fade",
                "Slide Up": "slideUp",
                "Scale": "scale"
            },
            value: "fade"
        }],
        moddemolive: `
            <div class="shift-grid-demo">
                <div class="grid-item">Элемент 1</div>
                <div class="grid-item">Элемент 2</div>
                <div class="grid-item">Элемент 3</div>
                <div class="grid-item">Элемент 4</div>
                <div class="grid-item">Элемент 5</div>
                <div class="grid-item">Элемент 6</div>
            </div>
            <style>
                .shift-grid-demo {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    padding: 20px;
                }
                .grid-item {
                    height: 100px;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    font-weight: bold;
                }
            </style>
        `,
        moddefaultsettings: '{"columns":"3","gap":"20","itemHeight":"200","animation":"fade"}',
        runDemo: function(settings) {
            console.log('[SHIFT] Запуск демо Супер Грид с настройками:', settings);
        },
        modInputChange: function(settings) {
            console.log('[SHIFT] Изменение настроек Супер Грид:', settings);
        },
        modcontent: function(settings) {
            console.log('[SHIFT] Генерация контента Супер Грид:', settings);
            return `
                <div class="shift-super-grid" data-settings='${JSON.stringify(settings)}'>
                    <div class="grid-item">Элемент 1</div>
                    <div class="grid-item">Элемент 2</div>
                    <div class="grid-item">Элемент 3</div>
                    <div class="grid-item">Элемент 4</div>
                    <div class="grid-item">Элемент 5</div>
                    <div class="grid-item">Элемент 6</div>
                </div>
                <style>
                    .shift-super-grid {
                        display: grid;
                        grid-template-columns: repeat(${settings.columns}, 1fr);
                        gap: ${settings.gap}px;
                        padding: 20px;
                    }
                    .grid-item {
                        height: ${settings.itemHeight}px;
                        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        font-weight: bold;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: all 0.6s ease;
                    }
                    .grid-item.animate {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    @media (max-width: 768px) {
                        .shift-super-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    @media (max-width: 480px) {
                        .shift-super-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
                <script>
                    (function() {
                        const grid = document.querySelector('.shift-super-grid');
                        const items = grid.querySelectorAll('.grid-item');
                        const settings = JSON.parse(grid.dataset.settings);
                        
                        function animateItems() {
                            items.forEach((item, index) => {
                                setTimeout(() => {
                                    item.classList.add('animate');
                                }, index * 100);
                            });
                        }
                        
                        // Запуск анимации при загрузке
                        setTimeout(animateItems, 100);
                    })();
                </script>
            `;
        },
        instruction: "Супер Грид - создает адаптивную сетку с настройками колонок, отступов и анимации."
    });

    // Блок Грид-стеки
    const gridStacksAccess = gridStacksSolution ? (userStatus === 'advanced' || gridStacksSolution.is_free) : true;
    dbmBlocks.push({
        name: "Грид-стеки",
        cod: "SHF003",
        descr: "Стеки с разными размерами",
        descr_ru: "Стеки с разными размерами",
        disableforplan0: gridStacksAccess ? "n" : "y", // Доступ на основе подписки
        icon: "https://static.tildacdn.com/tild6136-3535-4537-a132-396530656362/stack-icon.svg",
        icon2: "",
        id: "203",
        inlib: "y",
        filter: "SHIFT Модификации",
        title: "Грид-стеки",
        modsettings: [{
            id: "1",
            title: "Стиль стеков",
            name: "stackStyle",
            type: "select",
            options: {
                "Маленькие": "small",
                "Средние": "medium",
                "Большие": "large",
                "Смешанные": "mixed"
            },
            value: "mixed"
        }, {
            id: "2",
            title: "Цветовая схема",
            name: "colorScheme",
            type: "select",
            options: {
                "Синяя": "blue",
                "Зеленая": "green",
                "Красная": "red",
                "Фиолетовая": "purple"
            },
            value: "blue"
        }],
        moddemolive: `
            <div class="shift-stacks-demo">
                <div class="stack-item large">Большой</div>
                <div class="stack-item small">Малый</div>
                <div class="stack-item medium">Средний</div>
                <div class="stack-item small">Малый</div>
                <div class="stack-item large">Большой</div>
            </div>
            <style>
                .shift-stacks-demo {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    padding: 20px;
                }
                .stack-item {
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    font-weight: bold;
                }
                .stack-item.large { height: 120px; }
                .stack-item.medium { height: 80px; }
                .stack-item.small { height: 60px; }
            </style>
        `,
        moddefaultsettings: '{"stackStyle":"mixed","colorScheme":"blue"}',
        runDemo: function(settings) {
            console.log('[SHIFT] Запуск демо Грид-стеки с настройками:', settings);
        },
        modInputChange: function(settings) {
            console.log('[SHIFT] Изменение настроек Грид-стеки:', settings);
        },
        modcontent: function(settings) {
            console.log('[SHIFT] Генерация контента Грид-стеки:', settings);
            return `
                <div class="shift-grid-stacks" data-settings='${JSON.stringify(settings)}'>
                    <div class="stack-item large">Большой элемент</div>
                    <div class="stack-item small">Малый</div>
                    <div class="stack-item medium">Средний</div>
                    <div class="stack-item small">Малый</div>
                    <div class="stack-item large">Большой элемент</div>
                    <div class="stack-item medium">Средний</div>
                </div>
                <style>
                    .shift-grid-stacks {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        padding: 20px;
                    }
                    .stack-item {
                        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        font-weight: bold;
                        transition: transform 0.3s ease;
                    }
                    .stack-item:hover {
                        transform: translateY(-5px);
                    }
                    .stack-item.large { height: 120px; }
                    .stack-item.medium { height: 80px; }
                    .stack-item.small { height: 60px; }
                </style>
            `;
        },
        instruction: "Грид-стеки - создает сетку с элементами разных размеров для интересного дизайна."
    });

    // Блок Кастомный HTML
    const customHtmlAccess = customHtmlSolution ? (userStatus === 'advanced' || customHtmlSolution.is_free) : true;
    dbmBlocks.push({
        name: "Кастомный HTML",
        cod: "SHF004",
        descr: "Свободный HTML блок",
        descr_ru: "Свободный HTML блок",
        disableforplan0: customHtmlAccess ? "n" : "y", // Доступ на основе подписки
        icon: "https://static.tildacdn.com/tild6136-3535-4537-a132-396530656362/html-icon.svg",
        icon2: "",
        id: "204",
        inlib: "y",
        filter: "SHIFT Модификации",
        title: "Кастомный HTML",
        modsettings: [{
            id: "1",
            title: "HTML код",
            name: "htmlCode",
            type: "textarea",
            placeholder: "Введите ваш HTML код здесь...",
            value: "<div class='custom-block'><h3>Кастомный блок</h3><p>Это ваш HTML контент</p></div>"
        }, {
            id: "2",
            title: "CSS стили",
            name: "cssCode",
            type: "textarea",
            placeholder: "Введите CSS стили здесь...",
            value: ".custom-block { padding: 20px; background: #f0f0f0; border-radius: 8px; }"
        }],
        moddemolive: `
            <div class="shift-custom-demo">
                <h3>Кастомный блок</h3>
                <p>Это ваш HTML контент</p>
            </div>
            <style>
                .shift-custom-demo {
                    padding: 20px;
                    background: #f0f0f0;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
            </style>
        `,
        moddefaultsettings: '{"htmlCode":"<div class=\\"custom-block\\"><h3>Кастомный блок</h3><p>Это ваш HTML контент</p></div>","cssCode":".custom-block { padding: 20px; background: #f0f0f0; border-radius: 8px; }"}',
        runDemo: function(settings) {
            console.log('[SHIFT] Запуск демо Кастомный HTML с настройками:', settings);
        },
        modInputChange: function(settings) {
            console.log('[SHIFT] Изменение настроек Кастомный HTML:', settings);
        },
        modcontent: function(settings) {
            console.log('[SHIFT] Генерация контента Кастомный HTML:', settings);
            return `
                <div class="shift-custom-html" data-settings='${JSON.stringify(settings)}'>
                    ${settings.htmlCode || '<div class="custom-block"><h3>Кастомный блок</h3><p>Это ваш HTML контент</p></div>'}
                </div>
                <style>
                    ${settings.cssCode || '.custom-block { padding: 20px; background: #f0f0f0; border-radius: 8px; }'}
                </style>
            `;
        },
        instruction: "Кастомный HTML - позволяет вставить любой HTML код с CSS стилями."
    });

    console.log('[SHIFT] Блоки SHIFT успешно добавлены в Tilda!');
}

// Экспортируем функцию для использования в content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dbmCreateShiftBlocks };
} else {
    window.dbmCreateShiftBlocks = dbmCreateShiftBlocks;
}
