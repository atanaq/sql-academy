# 🛠️ Data Engineer Academy

Полноценная программа подготовки **Data Engineer с нуля до middle**, которая заменяет
ментора: учебный путь, теория по всем ключевым темам, тренажёры с автопроверкой,
проекты для портфолио и банк вопросов с собеседований.

Всё работает **в браузере**: PostgreSQL выполняется через **PGlite** (WASM), Python —
через **Pyodide** (WASM). Сервер для сайта не нужен.

**Опубликовано:** https://atanaq.github.io/sql-academy/

## Что внутри

| Раздел | Что умеет |
| --- | --- |
| 🧭 **Путь** | 12 фаз от «кто такой DE» до собеседования, с целями, неделями, чекпоинтами и прогрессом |
| 📚 **База знаний** | **55 модулей**: 34 по SQL (junior→senior) + **21 по Data Engineering** (Python, моделирование, ETL/ELT, Airflow, dbt, Spark, Kafka, хранилища, lakehouse, облака, качество, архитектура, аналитика, собеседование). Фильтры по уровню и треку, поиск по темам |
| 🎯 **SQL-тренажёр** | **42 задачи** с сюжетными условиями, проверкой результата, подсказками и решениями |
| 🐍 **Python-тренажёр** | **16 задач** с реальными тестами; Python выполняется в браузере (Pyodide) |
| 🧠 **Квизы** | **10 квизов × 6 вопросов** (60 вопросов) с разбором ответов и проходным баллом 70% |
| 💬 **Собеседование** | **58 вопросов** с эталонными ответами, поиском и фильтром по темам |
| 🛠️ **Проекты** | **4 end-to-end проекта** (ETL в Postgres, DWH/витрина, Kafka-стриминг, PySpark) с шагами, критериями приёмки и чек-листом |
| 🧪 **Песочница** | Свободные SQL-запросы, выбор БД, сброс данных, схема рядом |
| 📖 **Справочник** | Полный каталог операторов и функций PostgreSQL |
| 🗄️ **Схема БД** | Структура учебных баз данных |

## Учебные базы данных

1. **Компания (HR)** — `departments`, `employees`, `projects`, `employee_projects`.
2. **Магазин (E-commerce)** — `customers`, `products`, `orders`, `order_items`.

## Запуск

```bash
npm install
npm start        # Node-версия: http://localhost:4000
```

**Статическая версия (GitHub Pages):**

```bash
node build-docs.mjs   # собрать docs/ из public/
node serve-docs.mjs   # локально: http://localhost:5055
```

Папка `docs/` публикуется на GitHub Pages как есть (source: `main`, folder `/docs`).

## Структура проекта

```
server/
  index.js                 # Express API (для Node-версии)
  engine.js                # PGlite: инстансы, транзакции, сравнение результатов
  data/
    schema.js              # схемы и seed-данные
    lessons.js             # объединяет все модули
    lessons-junior/middle/senior.js  # SQL-модули (34)
    lessons-de-intro.js    # DE: основы, Linux/Git, форматы, Docker
    lessons-de-python.js   # DE: Python, файлы, pandas, тесты
    lessons-de-pipeline.js # DE: моделирование, ETL/ELT, Airflow, dbt
    lessons-de-bigdata.js  # DE: Spark, Kafka, хранилища, lakehouse, облака
    lessons-de-arch.js     # DE: качество, архитектура, аналитика, собеседование
    tasks.js               # 42 SQL-задачи
    reference.js           # справочник
public/
  index.html, styles.css, app.js   # SPA (Node-версия)
  data/                    # roadmap, quizzes, interview, projects, python-tasks
  vendor/codemirror/       # редактор
docs/                      # статическая сборка для GitHub Pages (+ vendor/pglite)
build-docs.mjs             # сборка docs/ из public/
```

## Технологии

- **PGlite** — PostgreSQL 18 в WebAssembly (полный SQL: оконные функции, JSONB, массивы, CTE…)
- **Pyodide** — Python 3 в WebAssembly (реальное выполнение кода и pandas)
- **CodeMirror 5** — редактор с подсветкой SQL и Python
- **Node.js + Express** — локальная версия с REST API

## Проверка

```bash
node test-tasks.mjs      # все эталонные SQL-запросы в транзакции с откатом
node validate-lessons.mjs
```

## Горячие клавиши

- `Ctrl+Enter` — выполнить / проверить
- `Ctrl+Space` — автодополнение SQL
- `Ctrl+/` — закомментировать строку
