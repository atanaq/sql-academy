# Публикация на GitHub Pages

Сайт **уже опубликован**:

- Репозиторий: https://github.com/atanaq/sql-academy
- Сайт: **https://atanaq.github.io/sql-academy/**
- Источник Pages: ветка `main`, папка `/docs`

Статическая сборка лежит в [`docs/`](docs/). Сервер не нужен: PostgreSQL
(PGlite) выполняется прямо в браузере.

## Как это было сделано

1. Создан репозиторий `atanaq/sql-academy`.
2. Проект запушен в ветку `main`.
3. Settings → Pages → Source: Deploy from a branch → `main` → `/docs`.

## Обновление сайта

После изменений в `docs/`:

```bash
git add -A
git commit -m "update"
git push
```

GitHub Pages пересоберёт сайт автоматически за 1–2 минуты.

## Если делаете с нуля

1. Создайте репозиторий на GitHub.
2. Запушьте проект (или содержимое `docs/`).
3. Settings → Pages → Deploy from a branch → `main` → `/docs` → Save.

## Локальная проверка

```bash
node serve-docs.mjs    # http://localhost:5055
```
