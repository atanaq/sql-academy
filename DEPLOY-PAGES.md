# Публикация на GitHub Pages

Готовая **статическая** сборка лежит в папке [`docs/`](docs/). Сервер не нужен:
PostgreSQL (PGlite) выполняется прямо в браузере пользователя.

## 1. Создайте репозиторий

На GitHub: **New repository** → имя (например, `sql-academy`) → **Public** → Create.

## 2. Загрузите проект

Вариант A — через git (из папки проекта):

```bash
git remote add origin https://github.com/<USER>/<REPO>.git
git branch -M main
git push -u origin main
```

(Репозиторий уже инициализирован и закоммичен.)

Вариант B — через веб-интерфейс: загрузите **содержимое папки `docs/`** в корень
репозитория. Тогда на шаге 3 выберите папку `/ (root)`.

## 3. Включите Pages

**Settings → Pages → Build and deployment**:

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/docs**
- **Save**

## 4. Откройте сайт

Через 1–2 минуты:

```
https://<USER>.github.io/<REPO>/
```

## Важно

- Первый запуск скачивает WASM PostgreSQL (~15–20 МБ) — на мобильном интернете
  возможна пауза. Дальше браузер кэширует.
- `docs/.nojekyll` уже добавлен, чтобы GitHub Pages не обрабатывал файлы через Jekyll.
- Все запросы (тренажёр, песочница, справочник) выполняются локально в браузере;
  сеть после загрузки не нужна.
- Локальная проверка статической сборки:

  ```bash
  node serve-docs.mjs      # http://localhost:5055
  ```
