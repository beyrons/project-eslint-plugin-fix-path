//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/pubic-api-imports"),
    RuleTester = require("eslint").RuleTester;



const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 6, sourceType: 'module' },            // указываем опции парсинга импорта
});

const aliasOptions = [
    {
        alias: '@'
    }
]

ruleTester.run("pubic-api-imports", rule, {
    valid: [
        {
            code: "import { addCommentFormActions, addCommentFormReducer } from '../../model/slices/addCommentFormSlice'",
            errors: [],
        },
        {
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article'",
            errors: [],
            options: aliasOptions,
        },
        {
            filename: '/home/projects/web/src/entities/file.test.ts',
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/testing'",
            errors: [],
            options: [{     // из "schema" pubic-api-imports.js
                alias: '@',
                testFilesPatterns: ['**/*.test.ts', '**/*.test.ts', '**/StoreDecorator.tsx']
            }],
        },
        {
            filename: '/home/projects/web/src/entities/StoreDecorator.tsx',
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/testing'",
            errors: [],
            options: [{
                alias: '@',
                testFilesPatterns: ['**/*.test.ts', '**/*.test.ts', '**/StoreDecorator.tsx']
            }],
        }
    ],

    invalid: [
        {
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/model/file.ts'",
            errors: [{ message: "Абсолютный импорт разрешен только из public-api (index.ts)"}],
            options: aliasOptions,
        },
        {
            filename: '/home/projects/web/src/entities/StoreDecorator.tsx',         //  if (isImportNotFromPublicApi && !isTestingPublicApi) -- pubic-api-imports.js
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/testing/file.tsx'",
            errors: [{message: 'Абсолютный импорт разрешен только из public-api (index.ts)'}],
            options: [{
                alias: '@',
                testFilesPatterns: ['**/*.test.ts', '**/*.test.ts', '**/StoreDecorator.tsx']
            }],
        },
        {
            filename: '/home/projects/web/src/entities/forbidden.ts',
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/testing'",
            errors: [{message: 'Тестовые данные необходимо импортировать из "PublicApi/testing.ts"'}],
            options: [{
                alias: '@',
                testFilesPatterns: ['**/*.test.ts', '**/*.test.ts', '**/StoreDecorator.tsx']
            }],
        }
    ],
});
