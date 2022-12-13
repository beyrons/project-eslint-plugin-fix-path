"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/path-check"),
    RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 6, sourceType: 'module' },            // указываем опции парсинга импорта
});

ruleTester.run("path-check", rule, {
    // правильный импорт
    valid: [
        {
            filename: '/home/projects/web/src/entities/Article',       // Чтобы корректно протестировать работу линтера, нам нужно знать изкакого файла импорт проверяется
            code: "import { addCommentFormActions, addCommentFormReducer } from '../../model/slices/addCommentFormSlice'",
            errors: [],
        }
    ],

    // неправильный импорт
    invalid: [
        {
            filename: '/home/projects/web/src/entities/Article',
            code: "import { addCommentFormActions, addCommentFormReducer } from '@/entities/Article/model/slices/addCommentFormSlice'",
            errors: [{ message: "В рамках одного модуля импорты должны быть относительными"}],
            options: [
                {
                    alias: '@'       // schema :: "lib/rules/path-check.js"
                }
            ]
        },
        {
            filename: '/home/projects/web/src/entities/Article',
            code: "import { addCommentFormActions, addCommentFormReducer } from 'entities/Article/model/slices/addCommentFormSlice'",
            errors: [{ message: "В рамках одного модуля импорты должны быть относительными"}],
        },
    ],
});
