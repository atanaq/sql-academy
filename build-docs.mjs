// Собирает статическую версию в docs/ из public/.
import fs from 'node:fs';
import path from 'node:path';

const pub = 'public';
const docs = 'docs';
fs.mkdirSync(path.join(docs, 'data'), { recursive: true });

// 1) app.js: добавляем localApi и заменяем fetch-обёртку
let app = fs.readFileSync(path.join(pub, 'app.js'), 'utf8');
if (!app.includes("from './browser-api.js'")) {
  app = "import { localApi } from './browser-api.js';\n\n" + app;
}
app = app.replace(
  /async function api\(path, opts = \{\}\) \{[\s\S]*?\n\}/,
  '// В статической сборке запросы обслуживает браузерный движок (PGlite).\nconst api = localApi;'
);
fs.writeFileSync(path.join(docs, 'app.js'), app);

// 2) данные (серверные уроки/задачи + фронтенд-данные)
for (const dir of ['server/data', 'public/data']) {
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.js')) fs.copyFileSync(path.join(dir, f), path.join(docs, 'data', f));
  }
}

// 3) index.html: абсолютные пути -> относительные
let html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
html = html.replace(/(href|src)="\/([^"]+)"/g, '$1="$2"');
fs.writeFileSync(path.join(docs, 'index.html'), html);

// 4) стили
fs.copyFileSync(path.join(pub, 'styles.css'), path.join(docs, 'styles.css'));

// 5) vendor CodeMirror (PGlite живёт только в docs/vendor и не перезаписывается)
fs.cpSync(path.join(pub, 'vendor'), path.join(docs, 'vendor'), { recursive: true });

console.log('docs build done');
