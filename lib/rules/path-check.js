"use strict";

const path = require('path');

module.exports = {
    meta: {
        type: null,         // `problem`, `suggestion`, or `layout`
        docs: {
            description: "relative import check",
            recommended: false,
            url: null,      // URL to the documentation page for this rule
        },
        fixable: null,      // Or `code` or `whitespace`
        schema: [],         // Add a schema if the rule has options
    },

    create(context) {

        return {
            ImportDeclaration(node) {                           // AST :: ImportDeclaration - работаем с нодами импорта
                const importTo = node.source.value;             // example :: app/entities/Article
                const fromFilename = context.getFilename();     // текущий файл

                if (shouldBeRelative(fromFilename, importTo)) {
                    context.report(node, 'В рамках одного модуля импорты должны быть относительными!');   // "Within a single module, imports must be relative"
                }
            }
        };
    },
};


// ===================================================== //
// === Пишем логику, по которой будем проверять ноды === //
// ===================================================== //

// Если путь начинается с указанных шаблонов, то мы считаем, что путь относительный
function isPathRelative(path) {
    return path === '.' || path.startsWith('./') || path.startsWith('../')      //
}

// описываем типы сегментов
const layers = {
    'entities': 'entities',
    'features': 'features',
    'shared': 'shared',
    'pages': 'pages',
    'widgets': 'widgets',
}


// === Правило на проверку относительных путей === //
// Проверяем, должен ли путь быть относительным (т.е. в рамках модуля. В остальных случаях используется абсолютный путь из public-api - "index.ts")
// from -- полный путь до файла (относительно ОС), например: /home/projects/web/src/entities/Article
// to -- импорт, который указали в файле проекта,  например: /entities/Article
function shouldBeRelative(from, to) {

    if (isPathRelative(to)) {                               // делаем проверку - если путь уже является относительным, то завершаем проверку и возвращаем false
        return false;
    }


    // == to == :: /entities/Article
    const toArray = to.split('/')                           // делим строку на сегменты.  example :: entities/Articles
    // вытаскиваем из участков сегментов слои и слайсы:
    const toLayer = toArray[0];                             // entities
    const toSlice = toArray[1];                             // Articles

    // если по какой то причине нет "toLayer" или "toSlice" или нет слова в "layers"
    if (!toLayer || !toSlice || !layers[toLayer]) {
        return false;
    }


    // == from == :: /web/src/entities/Article
    const normalizedPath = path.toNamespacedPath(from);     // Сначала нормализуем путь(OS).
    const projectFrom = normalizedPath.split('src')[1];     // Забираем часть пути, которая идет после "src/":

    const fromArray = projectFrom.split('/');               // Делим на сегменты
    const fromLayer = fromArray[1];
    const fromSlice = fromArray[2];

    if (!fromLayer || !fromSlice || !layers[fromLayer]) {   // если по какой то причине нет "toLayer" или "toSlice" или нет слова в "layers"
        return false;
    }


    // если "true" - путь относительный
    return fromSlice === toSlice && toLayer === fromLayer;
}

//  Первым аргументом передаем файл, в котором находимся сейчас, вторым - импорт, который проверяем
// console.log(shouldBeRelative('/home/projects/web/src/entities/Article', 'entities/Article/fasfasfas'))
// console.log(shouldBeRelative('/home/projects/web/src/entities/Article/', 'entities/ASdasd/fasfasfas'))
// console.log(shouldBeRelative('/home/projects/web/src/features/Article/', 'features/Article/fasfasfas'))
// console.log(shouldBeRelative('/home/projects/web/src/entities/Article/', 'entities/Article/fasfasfas'))
// console.log(shouldBeRelative('/home/projects/web/src/entities/Article/', 'app/index.tsx'))

