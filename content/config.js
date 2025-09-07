// Этот файл - ваш главный пульт управления модификациями.
// Чтобы добавить новое решение, просто скопируйте один из объектов ниже
// и измените его параметры.

// solutionCode: Должен ТОЧНО совпадать с 'solution_code' в вашей таблице 'solutions' в Supabase.
// tildaBlockId: ID блока Tilda, который будет добавлен на страницу при клике (например, '396' для Zero Block).
// title: Название, которое увидит пользователь.
// img: Иконка для карточки.

const shiftSolutionsConfig = [
    {
        solutionCode: 'super-slider',
        tildaBlockId: '396', // Добавляем Zero Block как основу для слайдера
        title: 'Супер Слайдер',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_21.png'
    },
    {
        solutionCode: 'super-grid',
        tildaBlockId: 'BF204',
        title: 'Создание своей грид-сетки',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_20.png'
    },
    {
        solutionCode: 'grid-stacks',
        tildaBlockId: '396',
        title: 'Грид-стеки',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_columns.png'
    },
    {
        solutionCode: 'custom-html',
        tildaBlockId: '131',
        title: 'Кастомный HTML',
        img: 'https://static.tildacdn.com/lib/tscripts/tplicons/tpl_html.png'
    }
    // Добавьте ваше следующее решение здесь
];
