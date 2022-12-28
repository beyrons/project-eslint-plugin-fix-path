"use strict";

const path = require('path');
const { isPathRelative } = require('../helpers')

module.exports = {
    meta: {
        type: null,
        docs: {
            description: "relative import check",
            recommended: false,
            url: null,
        },
        fixable: 'code',    // для того, чтобы сработал autofix
        schema: [{
            // настраиваем линтер на работу с "alias", описываем, какие аргументы ожидаем на вход
            type: 'object',
            properties: {
                alias: {
                    type: 'string',
                }
            }
        }],
    },

    create(context) {
        const alias = context.options[0]?.alias || '';          // tests/lib/rules/path-check.js :: alias: '@'

        return {
            ImportDeclaration(node) {                                                           // AST :: ImportDeclaration - работаем с нодами импорта
                const value = node.source.value
                const importTo = alias ? value.replace(`${alias}/`, '') : value;                // обрабатываем alias: если не пустой - удаляем
                const fromFilename = context.getFilename();                                     // текущий файл

                if (shouldBeRelative(fromFilename, importTo)) {
                    context.report({
                        node,
                        message: 'В рамках одного модуля импорты должны быть относительными',
                        fix: (fixer) => {
                            const normalizedPath = getNormalizedCurrentFilePath(fromFilename)   // Получаем нормализованный путь файла в котором исправляем импорт /entities/Article/Article.tsx
                                .split('/')                                                     // и избавляемся от названия файла - /Article.tsx
                                .slice(0, -1)                                                   // оставляем только путь к директории
                                .join('/');

                            let relativePath = path.relative(normalizedPath, `/${importTo}`)    // relative -- позволяет наложить два пути друг на друга :: https://nodejs.org/api/path.html#pathrelativefrom-to
                                .split('\\')                                            // и получить относительный путь от одного к другому
                                .join('/');                                                     // linux ?

                            if(!relativePath.startsWith('.')) {                                 // relative не подставляет точку в начале импорта при движении "вверх"
                                relativePath = './' + relativePath;                             // например: 'a/bb' -> '.a/bb'
                            }

                            return fixer.replaceText(node.source, `'${relativePath}'`)
                        }
                    });
                }
            }
        };
    },
};


// ===================================================== //
// === Пишем логику, по которой будем проверять ноды === //
// ===================================================== //

// описываем типы сегментов
const layers = {
    'entities': 'entities',
    'features': 'features',
    'shared': 'shared',
    'pages': 'pages',
    'widgets': 'widgets',
}

function getNormalizedCurrentFilePath(currentFilePath) {
    // == from == :: /web/src/entities/Article
    const normalizedPath = path.toNamespacedPath(currentFilePath);     // Сначала нормализуем путь(OS).
    const projectFrom = normalizedPath.split('src')[1];     // Забираем часть пути, которая идет после "src/":
    return projectFrom.split('\\').join('/')
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

    const projectFrom = getNormalizedCurrentFilePath(from);
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

