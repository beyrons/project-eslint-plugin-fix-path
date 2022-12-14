const { isPathRelative } = require("../helpers");

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
                    type: 'string',
                }
            }
        }],
    },

    create(context) {
        const alias = context.options[0]?.alias || '';          // tests/lib/rules/path-check.js :: alias: '@'

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


                if (isImportNotFromPublicApi) {
                    context.report(node, 'Абсолютный импорт разрешен только из public-api (index.ts)');
                }
            }
        };
    },
};
