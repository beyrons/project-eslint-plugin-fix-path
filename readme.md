```bash
# Публикация плагина:
https://www.npmjs.com/package/eslint-plugin-import-path-fix
```

---

#6. Autofix для public-api линтера. Фикс неправильного импорта:
```typesript
import { Counter } from '@/entities/Counter/ui/Counter';
import { ArticleList } from '@/entities/Article/ui/ArticleList/ArticleList';
```
к правильному типу:
```typesript
import { Counter } from '@/entities/Counter';
import { ArticleList } from '@/entities/Article';
```
