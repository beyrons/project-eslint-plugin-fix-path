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
    ],

    invalid: [
        {
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/model/file.ts'",
            errors: [{ message: "Абсолютный импорт разрешен только из public-api (index.ts)"}],
            options: aliasOptions,
        },
    ],
});
