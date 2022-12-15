const { isPathRelative } = require("../helpers");
const micromatch = require("micromatch");

module.exports = {
    meta: {
        type: null,
        docs: {
            description: "descript",
            recommended: false,
            url: null,
        },
        fixable: null,
        schema: [{
            // настраиваем линтер на работу с "alias", описываем, какие аргументы ожидаем на вход
            type: 'object',
            properties: {
                alias: {
                    type: 'string'
                },
                testFilesPatterns: {    // здесь передается регулярка из ".eslintrc.js" основного проекта:
                    type: 'array'       // "testFiles: ['**/*.test.*', '**/*.story.*', '**/StoreDecorator.tsx']"
                }                       // которые определяют, является ли файл тестовым
            }
        }],
    },

    create(context) {
        const { alias = '', testFilesPatterns = [] } = context.options[0] ?? {};          // tests/lib/rules/path-check.js :: alias: '@'

        const checkingLayers = {
            'entities': 'entities',
            'features': 'features',
            'pages': 'pages',
            'widgets': 'widgets',
        }


        return {
            ImportDeclaration(node) {                                                           // AST :: ImportDeclaration - работаем с нодами импорта
                const value = node.source.value
                const importTo = alias ? value.replace(`${alias}/`, '') : value;                // обрабатываем alias: если не пустой - удаляем

                if (isPathRelative(importTo)) {     // если путь относительный, то дальше делать проверку не имеет смысла
                    return;                         // т.к. проверяем абс.пути до внутренностей модуля, нас интересует импорт из public-api (index.ts)
                }                                   // все что не из public-api -- нарушение правила

                const segments = importTo.split('/');
                const layer = segments[0]

                if (!checkingLayers[layer]) {
                    return;
                }

                const isImportNotFromPublicApi = segments.length > 2;
                const isTestingPublicApi = segments[2] === 'testing' && segments.length < 4;      // т.е. [entities, article, testing], .length < 4 -- testing должен быть последним


                if (isImportNotFromPublicApi && !isTestingPublicApi) {
                    context.report(node, 'Абсолютный импорт разрешен только из public-api (index.ts)');
                }

                // проверка для testing-public-api
                if (isTestingPublicApi) {
                    // нам не достаточно проверить, что это tpa, нам необходимо проверить файл, в который идет импорт
                    // потому что из tpa можно делать импорты только в тестовые файлы: ".test, .story ..."

                    // Получаем информацию о файле, в который идет импорт
                    const currentFilePath = context.getFilename();                                     // текущий файл

                    // Проверяем, что текущий файл является тестовым.
                    // Для этого "проходимся" по массиву паттернов и хотя бы один паттерн из массива должен совпасть с текущим файлом, в котором мы находимся
                    const isCurrentFileTesting = testFilesPatterns.some(
                        pattern => micromatch.isMatch(currentFilePath, pattern)                         // файл, boolean-соответсвие файла паттерну
                    )

                    if (!isCurrentFileTesting) {
                        // если файл не тестовый, значит мы нарушили public-api и пытаемся в production-код затащить код из testing-файла
                        context.report(node, 'Тестовые данные необходимо импортировать из "PublicApi/testing.ts"');
                    }

                }
            }
        };
    },
};
