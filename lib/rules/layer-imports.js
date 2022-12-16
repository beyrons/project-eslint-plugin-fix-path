const path = require('path');
const {isPathRelative} = require('../helpers');
const micromatch = require('micromatch');

module.exports = {
    meta: {
        type: null,
        docs: {
            description: "Нельзя использовать 'feature' внутри 'entity', 'pages' нельзя использовать внутри 'shared', etc... " +
                "Нижележащие слои должны использоваться в вышележащих, а наоборот это работать не должно",
            recommended: false,
            url: null,
        },
        fixable: null,
        schema: [
            {
                type: 'object',
                properties: {
                    alias: {
                        type: 'string',
                    },
                    ignoreImportPatterns: {   // паттерны, которые игнорируем (исключения)
                        type: 'array',
                    }
                },
            }
        ],
    },

    create(context) {
        // правила, по которым сущности могут включать в себя другие сущности:
        const layers = {
            'app': ['pages', 'widgets', 'features', 'shared', 'entities'],
            'pages': ['widgets', 'features', 'shared', 'entities'],
            'widgets': ['features', 'shared', 'entities'],
            'features': ['shared', 'entities'],
            'entities': ['shared', 'entities'],     // здесь исключение, т.к. пересечения иногда случаются
            'shared': ['shared'],
        }

        // описываем типы сегментов, для того, чтобы не проверять сторонние бибилотеки, а только импорты из наших слоев
        const availableLayers = {
            'app': 'app',
            'entities': 'entities',
            'features': 'features',
            'shared': 'shared',
            'pages': 'pages',
            'widgets': 'widgets',
        }

        const {alias = '', ignoreImportPatterns = []} = context.options[0] ?? {};

        // получаем layer
        const getCurrentFileLayer = () => {
            const currentFilePath = context.getFilename();                  // получаем текущий файл

            const normalizedPath = path.toNamespacedPath(currentFilePath);
            const projectPath = normalizedPath?.split('src')[1];
            const segments = projectPath?.split('/')

            return segments?.[1];
        }

        // откуда идет импорт
        const getImportLayer = (value) => {
            const importPath = alias ? value.replace(`${alias}/`, '') : value;
            const segments = importPath?.split('/')

            return segments?.[0]
        }

        return {
            ImportDeclaration(node) {                                           // AST :: ImportDeclaration - работаем с нодами импорта
                const importPath = node.source.value;
                const currentFileLayer = getCurrentFileLayer();
                const importLayer = getImportLayer(importPath);

                // проверяем, является ли путь относительным, если true - дальше не проверяем
                if(isPathRelative(importPath)) {
                    return;
                }

                // Проверка абсолютных путей: оба слоя импортированный и в котором находимся являются разрешенными
                // Т.е., чтобы отсечь всякие бибилиотеки (import redux from 'redux'... etc)
                if(!availableLayers[importLayer] || !availableLayers[currentFileLayer]) {
                    return;
                }

                // соответствие файла паттерну, паттерны задаем в ".eslintrc" основного проекта
                const isIgnored = ignoreImportPatterns.some(pattern => {
                    return micromatch.isMatch(importPath, pattern)
                });

                if(isIgnored) {
                    return;
                }

                // "главная" проерка, где проверяем: можно ли использовать на текущем слое слой, который мы пытаемся импортировать
                if(!layers[currentFileLayer]?.includes(importLayer)) {
                    context.report(node, 'Слой может импортировать в себя только нижележащие слои (shared, entities, features, widgets, pages, app)');
                }
            }
        };
    },
};
