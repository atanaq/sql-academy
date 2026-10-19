export const LESSONS_JUNIOR = [
  {
    id: 'sql-intro',
    title: 'Введение: базы данных и SQL',
    icon: '🧭',
    level: 'junior',
    dataset: 'company',
    intro: 'Разбираемся, зачем нужны базы данных, как устроена реляционная модель и из каких частей состоит запрос SELECT.',
    sections: [
      {
        id: 'sql-intro-db',
        title: 'Базы данных и реляционная модель',
        blocks: [
          { t: 'p', text: 'База данных — это организованное хранилище данных, а **СУБД** — программа, которая этим хранилищем управляет. PostgreSQL относится к реляционным СУБД: данные в ней представлены таблицами, строка описывает один объект, а столбцы — его свойства.' },
          { t: 'list', items: ['**Таблица** хранит однотипные объекты: сотрудников, отделы, проекты.', '**Строка** — один объект, например конкретный сотрудник.', '**Столбец** — свойство объекта с определённым типом данных.', '**СУБД** обеспечивает хранение, целостность, конкурентный доступ и восстановление после сбоев.', '**SQL** — декларативный язык: вы описываете результат, а способ его получения выбирает планировщик.'] },
          { t: 'note', text: 'Слово «реляционная» происходит от английского relation — отношение, то есть таблица. Это не про связи между таблицами, хотя внешние ключи тоже важны.', kind: 'info' },
        ],
      },
      {
        id: 'sql-intro-select',
        title: 'Из чего состоит SELECT',
        blocks: [
          { t: 'p', text: 'Запрос на выборку начинается с `SELECT` и перечисляет, что вернуть. Остальные части уточняют источник данных, фильтры, группировку и порядок. Минимальный запрос может состоять только из `SELECT` и `FROM`.' },
          { t: 'table', headers: ['Часть запроса', 'Назначение'], rows: [['SELECT', 'какие столбцы и выражения вернуть'], ['FROM', 'откуда взять строки'], ['WHERE', 'какие строки оставить'], ['GROUP BY', 'как объединить строки в группы'], ['HAVING', 'какие группы оставить'], ['ORDER BY', 'в каком порядке вывести результат'], ['LIMIT / OFFSET', 'сколько строк вывести и сколько пропустить']] },
          { t: 'sql', text: `SELECT d.name AS department, d.city, d.budget
FROM departments AS d
ORDER BY d.budget DESC
LIMIT 3;` },
          { t: 'note', text: '`SELECT *` удобен для знакомства с таблицей, но в рабочем запросе лучше перечислять нужные столбцы: так результат стабильнее и понятнее.', kind: 'tip' },
        ],
      },
      {
        id: 'sql-intro-order',
        title: 'Логический порядок выполнения',
        blocks: [
          { t: 'p', text: 'Порядок, в котором части запроса записаны, не совпадает с логическим порядком их обработки. Полезно запомнить последовательность: **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**.' },
          { t: 'list', items: ['`FROM` — выбираются источники и выполняются соединения.', '`WHERE` — отбрасываются отдельные строки.', '`GROUP BY` — оставшиеся строки собираются в группы.', '`HAVING` — отбрасываются целые группы.', '`SELECT` — вычисляются выражения и алиасы.', '`ORDER BY` — результат сортируется.', '`LIMIT` / `OFFSET` — выдаётся нужная порция строк.'] },
          { t: 'note', text: 'Поэтому алиас из `SELECT` ещё не существует в `WHERE`, но доступен в `ORDER BY`: сортировка логически выполняется после вычисления столбцов.', kind: 'info' },
          { t: 'sql', text: `-- В WHERE повторяем выражение, а в ORDER BY уже можно использовать алиас
SELECT name, salary * 12 AS annual_salary
FROM employees
WHERE salary * 12 > 1000000
ORDER BY annual_salary DESC;` },
        ],
      },
      {
        id: 'sql-intro-first-query',
        title: 'Первая выборка',
        blocks: [
          { t: 'p', text: 'Первый запрос получит несколько столбцов из таблицы `departments`, отсортирует отделы по бюджету и оставит три самых крупных. Регистр ключевых слов не важен, но принято писать их заглавными.' },
          { t: 'sql', text: `SELECT name, city, budget
FROM departments
ORDER BY budget DESC
LIMIT 3;` },
          { t: 'note', text: 'Незаключённые в кавычки имена PostgreSQL приводит к нижнему регистру. Точка с запятой завершает запрос, но в интерактивной песочнице часто необязательна.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'data-types',
    title: 'Типы данных PostgreSQL',
    icon: '🏷️',
    level: 'junior',
    dataset: 'company',
    intro: 'Тип данных определяет допустимые значения, точность вычислений и занимаемое место. Научимся выбирать тип осознанно и безопасно приводить значения.',
    sections: [
      {
        id: 'data-types-numeric',
        title: 'Числовые типы',
        blocks: [
          { t: 'p', text: 'Для целых чисел служат `smallint`, `integer` и `bigint`. Для точных дробей с фиксированной точностью — `numeric`, а для приблизительных вычислений — `real` и `double precision`.' },
          { t: 'table', headers: ['Тип', 'Особенность', 'Когда использовать'], rows: [['smallint', '2 байта, примерно до 32 тысяч', 'небольшие счётчики'], ['integer', '4 байта, примерно до 2 млрд', 'обычные идентификаторы и количества'], ['bigint', '8 байт, очень большой диапазон', 'большие идентификаторы и суммы'], ['numeric(p, s)', 'точное число с p цифрами и s знаками после запятой', 'деньги, ставки, финансовые расчёты'], ['real', '4 байта, приблизительное значение', 'измерения и научные вычисления'], ['double precision', '8 байт, приблизительное значение', 'вычисления с высокой точностью, но без гарантии точного десятичного представления']] },
          { t: 'sql', text: `-- Точные и приблизительные числа
SELECT
  42::smallint AS small_value,
  2147483647::integer AS int_value,
  9223372036854775807::bigint AS big_value,
  125000.50::numeric(12, 2) AS exact_amount,
  0.1::real AS approximate_value;

-- Целочисленное деление и приведение к numeric
SELECT
  5 / 2 AS integer_division,
  5::numeric / 2 AS numeric_division;` },
          { t: 'note', text: 'Деньги и любые значения, где недопустима погрешность, храните в `numeric`, а не в `real`. Помните: `5 / 2` для целых даёт `2`, поэтому перед делением нужно привести хотя бы один операнд.', kind: 'warn' },
        ],
      },
      {
        id: 'data-types-text',
        title: 'Строки и логический тип',
        blocks: [
          { t: 'p', text: 'Строки обычно хранят в `text`: он не имеет искусственного ограничения длины. `varchar(n)` ограничивает значение n символами, а `char(n)` дополняет короткие значения пробелами. В PostgreSQL `text` и `varchar` практически не различаются по производительности.' },
          { t: 'table', headers: ['Тип', 'Особенность'], rows: [['text', 'переменная длина без заданного лимита'], ['varchar(n)', 'переменная длина, не более n символов'], ['char(n)', 'фиксированная длина, значения дополняются пробелами'], ['boolean', 'принимает TRUE, FALSE или NULL']] },
          { t: 'sql', text: `SELECT
  name,
  email,
  length(name) AS name_length,
  salary >= 100000 AS high_salary
FROM employees
ORDER BY name
LIMIT 5;` },
          { t: 'note', text: 'Логические флаги храните в `boolean`, а не в `text` со значениями вроде yes/no. Ограничение длины через `varchar(n)` — это проверка на уровне типа, а не оптимизация хранения.', kind: 'tip' },
        ],
      },
      {
        id: 'data-types-temporal',
        title: 'Дата, время и UUID',
        blocks: [
          { t: 'p', text: '`date` хранит только дату, `timestamp` — дату и время без часового пояса, `timestamptz` — момент времени с учётом часового пояса. `interval` описывает длительность, а `uuid` — 128-битный уникальный идентификатор.' },
          { t: 'table', headers: ['Тип', 'Что хранит'], rows: [['date', 'дату без времени'], ['timestamp', 'дату и время без часового пояса'], ['timestamptz', 'момент времени, внутренне приводимый к UTC'], ['interval', 'длительность, например 2 дня 3 часа'], ['uuid', '128-битный идентификатор']] },
          { t: 'sql', text: `SELECT
  DATE '2026-10-19' AS day,
  TIMESTAMP '2026-10-19 14:30:00' AS local_ts,
  TIMESTAMPTZ '2026-10-19 14:30:00+03' AS instant,
  INTERVAL '2 days 03:00' AS span,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid AS event_id;` },
          { t: 'note', text: 'Для событий, которые происходят в разных часовых поясах, выбирайте `timestamptz`. `uuid` удобен для публичных идентификаторов: его трудно угадать, и он уникален без координации с базой.', kind: 'info' },
        ],
      },
      {
        id: 'data-types-json-arrays',
        title: 'JSON, массивы и приведение типов',
        blocks: [
          { t: 'p', text: '`json` хранит исходный текст JSON, а `jsonb` — разобранное бинарное представление, которое поддерживает операторы поиска и индексы. Массивы PostgreSQL индексируются с единицы и могут хранить значения одного типа, например `text[]` в колонке `skills`.' },
          { t: 'sql', text: `SELECT
  name,
  (meta->>'level')::integer AS level,
  COALESCE((meta->>'active')::boolean, false) AS active,
  skills[1] AS first_skill,
  array_length(skills, 1) AS skill_count
FROM employees
WHERE skills @> ARRAY['sql']
ORDER BY name
LIMIT 5;` },
          { t: 'p', text: 'Приведение типов делают оператором `::` или функцией `CAST`. Явное приведение помогает сравнивать значения и управлять точностью результата.' },
          { t: 'sql', text: `SELECT
  '42'::integer + 1 AS int_sum,
  CAST('2026-10-19' AS date) AS parsed_date,
  1234.5678::numeric(8, 2) AS rounded_money;` },
          { t: 'note', text: 'Для новых JSON-колонок обычно выбирают `jsonb`; при частой фильтрации по ключам помогает GIN-индекс. Некорректное приведение текста выбрасывает ошибку, поэтому данные из внешних источников лучше проверять заранее.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'filtering',
    title: 'Фильтрация и сортировка',
    icon: '🔍',
    level: 'junior',
    dataset: 'company',
    intro: 'Учимся точно отбирать нужные строки, учитывать трёхзначную логику NULL и управлять порядком результата.',
    sections: [
      {
        id: 'filtering-comparisons',
        title: 'Сравнения и логические операторы',
        blocks: [
          { t: 'p', text: 'В `WHERE` используются операторы сравнения `=`, `<>`, `!=`, `<`, `<=`, `>`, `>=` и логические связки `AND`, `OR`, `NOT`. Условие пропускает только те строки, для которых результат равен `TRUE`.' },
          { t: 'sql', text: `SELECT name, salary, hired_at
FROM employees
WHERE salary >= 100000
  AND hired_at < DATE '2022-01-01'
ORDER BY salary DESC;

-- Скобки задают нужную группировку условий
SELECT name, city, budget
FROM departments
WHERE (city = 'Berlin' OR city = 'London')
  AND budget >= 300000
ORDER BY budget DESC;

-- NOT инвертирует результат условия
SELECT name, salary
FROM employees
WHERE NOT (salary < 100000)
ORDER BY salary DESC;` },
          { t: 'note', text: '`AND` выполняется раньше `OR`. Если смешиваете условия, ставьте скобки явно: это защищает от логических ошибок и делает запрос читаемее.', kind: 'warn' },
        ],
      },
      {
        id: 'filtering-null',
        title: 'NULL и трёхзначная логика',
        blocks: [
          { t: 'p', text: '`NULL` означает отсутствие значения, а не ноль или пустую строку. Сравнение с `NULL` даёт неопределённый результат `NULL`, который в `WHERE` не проходит как `TRUE`. Для проверки используют `IS NULL` и `IS NOT NULL`.' },
          { t: 'sql', text: `SELECT name, email
FROM employees
WHERE email IS NULL
ORDER BY name;

-- Так сравнивать нельзя: результат будет NULL, а не TRUE
SELECT name FROM employees WHERE email = NULL;

-- IS DISTINCT FROM считает NULL обычным значением
SELECT name, manager_id
FROM employees
WHERE manager_id IS DISTINCT FROM 1
ORDER BY name;` },
          { t: 'note', text: 'Условие `manager_id <> 1` пропустит строки с NULL, потому что `NULL <> 1` не равен TRUE. Если NULL должен считаться отдельным значением, используйте `IS DISTINCT FROM`.', kind: 'info' },
        ],
      },
      {
        id: 'filtering-patterns',
        title: 'IN, BETWEEN, LIKE и регулярные выражения',
        blocks: [
          { t: 'p', text: '`BETWEEN` включает обе границы. `IN` проверяет совпадение с набором значений. `LIKE` сравнивает с шаблоном, где `%` означает любую последовательность символов, а `_` — ровно один символ. `ILIKE` делает то же без учёта регистра.' },
          { t: 'table', headers: ['Оператор', 'Поведение'], rows: [['BETWEEN', 'диапазон, обе границы включены'], ['IN', 'совпадение хотя бы с одним значением из списка'], ['LIKE', 'шаблон с учётом регистра'], ['ILIKE', 'шаблон без учёта регистра'], ['~', 'регулярное выражение с учётом регистра'], ['~*', 'регулярное выражение без учёта регистра']] },
          { t: 'sql', text: `SELECT name, salary
FROM employees
WHERE salary BETWEEN 80000 AND 120000
  AND department_id IN (1, 2, 3)
  AND name ILIKE '%a%'
ORDER BY salary DESC;

-- Регулярное выражение: начинается с буквы и заканчивается доменом corp.io
SELECT name, email
FROM employees
WHERE email ~* '^[a-z].*@corp[.]io$'
ORDER BY name;` },
          { t: 'note', text: 'Регулярные выражения мощнее `LIKE`, но сложнее читаются и могут быть медленнее. Для простого поиска по префиксу обычно достаточно `LIKE` и индекса с подходящим классом операторов.', kind: 'tip' },
        ],
      },
      {
        id: 'filtering-sort',
        title: 'Сортировка, DISTINCT и пагинация',
        blocks: [
          { t: 'sql', text: `-- Уникальные значения отдела
SELECT DISTINCT department_id
FROM employees
ORDER BY department_id NULLS LAST;

-- NULLS FIRST: сначала строки без руководителя
SELECT name, manager_id
FROM employees
ORDER BY manager_id ASC NULLS FIRST, name
LIMIT 5;

-- Сортировка по двум ключам и порция строк
SELECT name, salary, hired_at
FROM employees
ORDER BY salary DESC NULLS LAST, name ASC
LIMIT 5 OFFSET 0;` },
          { t: 'p', text: '`ORDER BY` задаёт порядок, `LIMIT` ограничивает число строк, а `OFFSET` пропускает заданное количество. `DISTINCT` убирает повторяющиеся строки результата и применяется ко всему списку выбранных столбцов.' },
          { t: 'note', text: 'По умолчанию PostgreSQL считает NULL большим любого значения: при `ASC` они оказываются в конце, при `DESC` — в начале. `LIMIT` без детерминированного `ORDER BY` возвращает произвольные строки; при равных ключах добавляйте второй ключ сортировки.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'aggregation',
    title: 'Агрегация, GROUP BY и HAVING',
    icon: '📊',
    level: 'junior',
    dataset: 'company',
    intro: 'Сжимаем множество строк до полезных итогов: считаем, суммируем, группируем и фильтруем уже готовые группы.',
    sections: [
      {
        id: 'aggregation-functions',
        title: 'Базовые агрегатные функции',
        blocks: [
          { t: 'p', text: 'Агрегатная функция получает набор строк и возвращает одно значение. `count` считает, `sum` суммирует, `avg` вычисляет среднее, `min` и `max` находят минимум и максимум. Все они, кроме `count(*)`, игнорируют `NULL`.' },
          { t: 'table', headers: ['Функция', 'Результат'], rows: [['count(*)', 'число строк'], ['count(столбец)', 'число не-NULL значений в столбце'], ['sum(столбец)', 'сумма не-NULL значений'], ['avg(столбец)', 'среднее не-NULL значений'], ['min / max', 'наименьшее и наибольшее значение']] },
          { t: 'sql', text: `SELECT
  count(*) AS rows_total,
  count(email) AS emails_known,
  sum(salary) AS payroll,
  round(avg(salary), 2) AS avg_salary,
  min(hired_at) AS first_hire,
  max(hired_at) AS last_hire
FROM employees;` },
          { t: 'note', text: 'Агрегат без `GROUP BY` всегда возвращает ровно одну строку. На пустой таблице `count(*)` даёт `0`, а `sum`, `avg`, `min` и `max` — `NULL`.', kind: 'info' },
        ],
      },
      {
        id: 'aggregation-count',
        title: 'count(*) и count(столбец)',
        blocks: [
          { t: 'p', text: '`count(*)` считает строки независимо от содержимого. `count(email)` считает только строки, где `email` не NULL. `count(DISTINCT email)` дополнительно убирает повторы. Это различие часто приводит к неверным отчётам.' },
          { t: 'sql', text: `SELECT
  count(*) AS all_employees,
  count(email) AS with_email,
  count(DISTINCT department_id) AS departments,
  count(*) FILTER (WHERE salary > 100000) AS high_earners
FROM employees;` },
          { t: 'note', text: '`FILTER` — удобное расширение PostgreSQL: агрегат учитывает только строки, удовлетворяющие условию. Его можно заменить на `CASE`, но `FILTER` короче и яснее.', kind: 'tip' },
        ],
      },
      {
        id: 'aggregation-group-by',
        title: 'GROUP BY',
        blocks: [
          { t: 'p', text: '`GROUP BY` собирает строки с одинаковыми значениями указанных столбцов в одну группу. Затем для каждой группы вычисляются агрегаты, и в результате появляется одна строка на группу.' },
          { t: 'sql', text: `SELECT
  department_id,
  count(*) AS employees,
  round(avg(salary), 2) AS avg_salary,
  sum(salary) AS payroll
FROM employees
GROUP BY department_id
ORDER BY payroll DESC;` },
          { t: 'note', text: 'Каждое выражение в `SELECT`, не обёрнутое в агрегат, должно быть указано в `GROUP BY`. `WHERE` фильтрует строки до группировки, поэтому агрегаты в нём использовать нельзя. NULL при группировке образует отдельную группу.', kind: 'warn' },
        ],
      },
      {
        id: 'aggregation-having',
        title: 'HAVING и агрегация строк',
        blocks: [
          { t: 'p', text: '`HAVING` фильтрует уже сформированные группы, поэтому в нём можно использовать агрегаты. Логический порядок такой: сначала `WHERE` отбирает строки, затем `GROUP BY` строит группы, и только потом `HAVING` их отбрасывает.' },
          { t: 'sql', text: `SELECT
  department_id,
  count(*) AS employees,
  round(avg(salary), 2) AS avg_salary,
  string_agg(name, ', ' ORDER BY name) AS team
FROM employees
GROUP BY department_id
HAVING count(*) >= 2
   AND avg(salary) > 80000
ORDER BY avg_salary DESC;` },
          { t: 'sql', text: `SELECT
  department_id,
  array_agg(name ORDER BY salary DESC) AS by_salary,
  max(salary) AS top_salary
FROM employees
GROUP BY department_id
ORDER BY department_id;` },
          { t: 'note', text: '`string_agg` склеивает строки в один текст, `array_agg` — в массив. Внутри агрегата можно задать `ORDER BY`, чтобы порядок элементов был предсказуемым.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'joins',
    title: 'JOIN: соединения таблиц',
    icon: '🔗',
    level: 'junior',
    dataset: 'company',
    intro: 'Соединяем данные из нескольких таблиц и учимся отличать типы JOIN по тому, какие строки попадают в результат.',
    sections: [
      {
        id: 'joins-inner',
        title: 'INNER JOIN',
        blocks: [
          { t: 'p', text: '`INNER JOIN` возвращает только те пары строк, для которых условие соединения истинно. Если у сотрудника нет отдела или отдел не найден, такая строка в результат не попадёт.' },
          { t: 'sql', text: `SELECT
  e.name AS employee,
  d.name AS department,
  d.city
FROM employees AS e
INNER JOIN departments AS d ON e.department_id = d.id
ORDER BY d.name, e.name;` },
          { t: 'note', text: 'Условие соединения указывайте в `ON`, а не в `WHERE`. Для читаемости давайте таблицам короткие алиасы и явно перечисляйте столбцы: одинаковые имена вроде name лучше переименовывать через `AS`.', kind: 'tip' },
        ],
      },
      {
        id: 'joins-outer',
        title: 'LEFT, RIGHT и FULL JOIN',
        blocks: [
          { t: 'p', text: 'Внешние соединения сохраняют строки одной или обеих таблиц даже при отсутствии совпадения. На месте недостающих значений PostgreSQL подставляет `NULL`.' },
          { t: 'table', headers: ['Тип', 'Что сохраняется'], rows: [['INNER JOIN', 'только совпавшие пары строк'], ['LEFT JOIN', 'все строки левой таблицы плюс совпадения справа'], ['RIGHT JOIN', 'все строки правой таблицы плюс совпадения слева'], ['FULL JOIN', 'все строки обеих таблиц']] },
          { t: 'sql', text: `-- Все сотрудники, даже если отдел не найден
SELECT e.name AS employee, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d ON e.department_id = d.id
ORDER BY d.name NULLS FIRST, e.name;

-- Строки без пары с любой стороны
SELECT d.name AS department, e.name AS employee
FROM departments AS d
FULL JOIN employees AS e ON e.department_id = d.id
WHERE d.id IS NULL OR e.id IS NULL;` },
          { t: 'note', text: '`RIGHT JOIN` — зеркальный `LEFT JOIN`: проще переставить таблицы местами и использовать `LEFT JOIN`. Чтобы найти строки без пары после внешнего соединения, проверяйте `IS NULL` по столбцу противоположной таблицы.', kind: 'info' },
        ],
      },
      {
        id: 'joins-self-cross',
        title: 'Self-join и CROSS JOIN',
        blocks: [
          { t: 'p', text: 'Self-join — соединение таблицы с самой собой. Оно нужно для иерархий: например, чтобы рядом с сотрудником показать его руководителя. Обязательно используйте разные алиасы для двух ролей одной таблицы.' },
          { t: 'sql', text: `SELECT
  e.name AS employee,
  m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON e.manager_id = m.id
ORDER BY m.name NULLS FIRST, e.name;` },
          { t: 'sql', text: `-- Декартово произведение всех сотрудников и отделов
SELECT e.name AS employee, d.name AS department
FROM employees AS e
CROSS JOIN departments AS d
ORDER BY e.name, d.name
LIMIT 10;` },
          { t: 'note', text: '`CROSS JOIN` возвращает все возможные пары, поэтому его результат быстро растёт. Если при обычном соединении забыть условие в `ON`, PostgreSQL может фактически выполнить декартово произведение и вернуть огромный результат.', kind: 'warn' },
        ],
      },
      {
        id: 'joins-semi-anti',
        title: 'Полусоединения и типичные ошибки',
        blocks: [
          { t: 'p', text: 'Полусоединение возвращает строки левой таблицы, для которых есть совпадение справа, но не дублирует их. Антисоединение делает наоборот: оставляет строки без совпадений. В PostgreSQL их обычно выражают через `EXISTS` и `NOT EXISTS`.' },
          { t: 'sql', text: `-- Отделы, где есть хотя бы один сотрудник с зарплатой выше 120000
SELECT d.id, d.name
FROM departments AS d
WHERE EXISTS (
  SELECT 1
  FROM employees AS e
  WHERE e.department_id = d.id
    AND e.salary > 120000
)
ORDER BY d.name;

-- Отделы без сотрудников
SELECT d.id, d.name
FROM departments AS d
WHERE NOT EXISTS (
  SELECT 1
  FROM employees AS e
  WHERE e.department_id = d.id
)
ORDER BY d.name;` },
          { t: 'sql', text: `-- Ошибка: условие по правой таблице в WHERE превращает LEFT JOIN в INNER JOIN
SELECT e.name, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d ON e.department_id = d.id
WHERE d.city = 'Berlin';

-- Если нужны все сотрудники, условие правой таблицы переносим в ON
SELECT e.name, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d
  ON e.department_id = d.id
 AND d.city = 'Berlin'
ORDER BY e.name;` },
          { t: 'note', text: 'Фильтр по правой таблице в `WHERE` отбрасывает строки с `NULL` и уничтожает эффект `LEFT JOIN`. Условия, которые должны только ограничивать совпадения, размещайте в `ON`.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'subqueries',
    title: 'Подзапросы',
    icon: '🪆',
    level: 'junior',
    dataset: 'company',
    intro: 'Вкладываем один запрос в другой, чтобы сравнивать значения с агрегатами, проверять существование строк и вычислять условия отдельно для каждой строки.',
    sections: [
      {
        id: 'subqueries-scalar',
        title: 'Скалярный подзапрос',
        blocks: [
          { t: 'p', text: 'Подзапрос — это `SELECT` внутри другого запроса. **Скалярный** подзапрос возвращает ровно один столбец и не более одной строки, поэтому его результат можно использовать как обычное значение в сравнении или выражении.' },
          { t: 'sql', text: `-- Насколько зарплата отличается от средней по компании
SELECT
  name,
  salary,
  salary - (SELECT avg(salary) FROM employees) AS diff_from_avg
FROM employees
ORDER BY diff_from_avg DESC NULLS LAST;

-- Сотрудники с зарплатой выше средней
SELECT name, salary
FROM employees
WHERE salary > (SELECT avg(salary) FROM employees)
ORDER BY salary DESC;` },
          { t: 'note', text: 'Если скалярный подзапрос вернёт больше одной строки, PostgreSQL выдаст ошибку. Пустой результат даёт `NULL`. Некоррелированный подзапрос без зависимости от внешнего запроса обычно вычисляется один раз.', kind: 'info' },
        ],
      },
      {
        id: 'subqueries-in',
        title: 'IN и ловушка NOT IN',
        blocks: [
          { t: 'p', text: 'Подзапрос после `IN` возвращает один столбец с множеством значений. Условие истинно, если значение внешней строки совпадает хотя бы с одним из них. Это удобно, когда набор идентификаторов определяется отдельным запросом.' },
          { t: 'sql', text: `-- Сотрудники отделов, расположенных в Берлине
SELECT name, salary
FROM employees
WHERE department_id IN (
  SELECT id
  FROM departments
  WHERE city = 'Berlin'
)
ORDER BY salary DESC;

-- Если подзапрос содержит NULL, NOT IN не вернёт ни одной строки
SELECT name
FROM employees
WHERE manager_id NOT IN (
  SELECT manager_id
  FROM employees
  WHERE department_id = 2
);

-- Безопасная альтернатива для nullable-столбца
SELECT e.name
FROM employees AS e
WHERE NOT EXISTS (
  SELECT 1
  FROM employees AS e2
  WHERE e2.department_id = 2
    AND e2.manager_id = e.manager_id
);` },
          { t: 'note', text: '`NOT IN` сравнивает каждое значение с каждым элементом набора. Если среди них есть `NULL`, результат сравнения становится неопределённым и строка не проходит фильтр. Для nullable-столбцов используйте `NOT EXISTS`.', kind: 'warn' },
        ],
      },
      {
        id: 'subqueries-correlated',
        title: 'Коррелированный подзапрос',
        blocks: [
          { t: 'p', text: 'Коррелированный подзапрос ссылается на таблицу внешнего запроса. Логически он вычисляется для каждой строки внешнего запроса, поэтому его результат может зависеть от текущего сотрудника или отдела.' },
          { t: 'sql', text: `-- Сотрудники, получающие больше средней зарплаты своего отдела
SELECT e.name, e.salary, e.department_id
FROM employees AS e
WHERE e.salary > (
  SELECT avg(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e.department_id
)
ORDER BY e.department_id, e.salary DESC;` },
          { t: 'note', text: 'Алиас внешней таблицы виден во внутреннем запросе, но не наоборот. Коррелированные подзапросы могут выполняться много раз; индексы по столбцам связи помогают, а иногда запрос лучше переписать через соединение.', kind: 'tip' },
        ],
      },
      {
        id: 'subqueries-any-all',
        title: 'ANY и ALL',
        blocks: [
          { t: 'p', text: '`ANY` и `ALL` сравнивают значение с набором результатов подзапроса или с массивом. `> ANY` означает «больше хотя бы одного», `> ALL` — «больше каждого». `= ANY` эквивалентно `IN`, а `<> ALL` — `NOT IN`.' },
          { t: 'table', headers: ['Конструкция', 'Смысл'], rows: [['> ANY', 'больше минимального значения набора'], ['> ALL', 'больше максимального значения набора'], ['= ANY', 'совпадает хотя бы с одним значением'], ['<> ALL', 'не совпадает ни с одним значением']] },
          { t: 'sql', text: `SELECT name, salary
FROM employees
WHERE salary > ANY (
  SELECT salary
  FROM employees
  WHERE department_id = 3
)
ORDER BY salary DESC;

-- = ANY по массиву: альтернативная запись IN
SELECT name, department_id
FROM employees
WHERE department_id = ANY (ARRAY[1, 2, 3])
ORDER BY name;` },
          { t: 'note', text: 'NULL влияет и на `ANY`/`ALL`: если набор содержит NULL, сравнение может стать неопределённым. Когда NULL не должен участвовать в сравнении, отфильтруйте его внутри подзапроса.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'case-functions',
    title: 'CASE, NULL и базовые функции',
    icon: '🧰',
    level: 'junior',
    dataset: 'company',
    intro: 'Добавляем в запросы условную логику, аккуратно обрабатываем NULL и используем повседневные строковые и математические функции.',
    sections: [
      {
        id: 'case-functions-case',
        title: 'CASE: простое и поисковое',
        blocks: [
          { t: 'p', text: '`CASE` возвращает значение в зависимости от условий. В **простом** варианте значение сравнивается с набором констант, в **поисковом** — проверяются произвольные условия `WHEN`. Проверка идёт сверху вниз до первого совпадения.' },
          { t: 'sql', text: `-- Простой CASE: сравнение одного выражения
SELECT
  name,
  CASE department_id
    WHEN 1 THEN 'Engineering'
    WHEN 2 THEN 'Marketing'
    ELSE 'Other'
  END AS department_label
FROM employees
ORDER BY name
LIMIT 5;

-- Поисковый CASE: независимые условия
SELECT
  name,
  salary,
  CASE
    WHEN salary >= 120000 THEN 'high'
    WHEN salary >= 80000 THEN 'medium'
    ELSE 'low'
  END AS salary_band
FROM employees
ORDER BY salary DESC;` },
          { t: 'note', text: 'Без `ELSE` несовпавшая ветка вернёт `NULL`. Все ветки должны возвращать совместимые типы. Ставьте более строгие условия выше: после первого совпадения остальные уже не проверяются.', kind: 'tip' },
        ],
      },
      {
        id: 'case-functions-null',
        title: 'COALESCE, NULLIF, GREATEST и LEAST',
        blocks: [
          { t: 'p', text: '`COALESCE` возвращает первый аргумент, который не равен NULL. `NULLIF(a, b)` возвращает NULL, если значения равны, иначе — `a`. `GREATEST` и `LEAST` выбирают максимум и минимум, игнорируя NULL (если не все аргументы NULL).' },
          { t: 'sql', text: `SELECT
  name,
  COALESCE(email, 'not specified') AS contact,
  GREATEST(salary, 80000) AS at_least_80k,
  LEAST(salary, 200000) AS capped,
  NULLIF(department_id, 0) AS valid_department
FROM employees
ORDER BY name
LIMIT 5;

-- NULLIF защищает от деления на ноль
SELECT
  count(*) AS employees,
  count(email) AS emails,
  round(100.0 * count(email) / NULLIF(count(*), 0), 1) AS email_percent
FROM employees;` },
          { t: 'note', text: 'Не путайте `COALESCE` с `NULLIF`: первый подставляет запасное значение, второй превращает совпадение в NULL. Аргументы `GREATEST` и `LEAST` должны быть совместимы по типу.', kind: 'info' },
        ],
      },
      {
        id: 'case-functions-strings',
        title: 'Строковые функции',
        blocks: [
          { t: 'p', text: 'Строковые функции помогают нормализовать и разбирать текст. В PostgreSQL индексы строк начинаются с единицы, а `trim` без аргументов удаляет пробелы с обоих концов.' },
          { t: 'table', headers: ['Функция', 'Назначение'], rows: [['lower / upper', 'привести к нижнему или верхнему регистру'], ['trim', 'удалить пробелы по краям'], ['length', 'число символов'], ['substring', 'взять часть строки'], ['replace', 'заменить все вхождения'], ['split_part', 'разделить строку и взять часть'], ['position', 'найти позицию подстроки']] },
          { t: 'sql', text: `SELECT
  lower(trim(name)) AS normalized,
  upper(name) AS loud,
  length(name) AS chars,
  substring(email FROM 1 FOR 5) AS email_prefix,
  replace(email, '@corp.io', '@example.com') AS changed_email,
  split_part(email, '@', 2) AS domain,
  position('@' IN email) AS at_position
FROM employees
WHERE email IS NOT NULL
ORDER BY name
LIMIT 5;` },
          { t: 'note', text: '`length` считает символы, а `octet_length` — байты. `replace` заменяет все вхождения, а не только первое. Функции возвращают NULL, если аргумент NULL, поэтому иногда полезен `COALESCE`.', kind: 'tip' },
        ],
      },
      {
        id: 'case-functions-math',
        title: 'Математические функции',
        blocks: [
          { t: 'p', text: '`round` округляет число, `ceil` — вверх, `floor` — вниз, `abs` возвращает модуль, `mod` — остаток от деления, `power` — степень. Для денежных расчётов используйте `numeric`, иначе возможны сюрпризы с плавающей точкой.' },
          { t: 'sql', text: `SELECT
  name,
  salary,
  round(salary / 3.0, 2) AS monthly_third,
  ceil(salary / 1000.0) AS thousands_up,
  floor(salary / 1000.0) AS thousands_down,
  abs(salary - 100000) AS distance_to_100k,
  mod(salary::integer, 1000) AS remainder,
  power(1.1, 2) AS growth_factor
FROM employees
ORDER BY salary DESC
LIMIT 5;` },
          { t: 'note', text: 'Деление целых чисел отбрасывает дробную часть: сначала приведите операнд к `numeric`. `floor` всегда движется к минус бесконечности, а `ceil` — к плюс бесконечности; для отрицательных чисел это заметно.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'dml',
    title: 'INSERT, UPDATE, DELETE',
    icon: '✏️',
    level: 'junior',
    dataset: 'company',
    intro: 'Изменяем данные: добавляем строки, обновляем нужные записи и удаляем их, контролируя результат через RETURNING.',
    sections: [
      {
        id: 'dml-insert',
        title: 'INSERT',
        blocks: [
          { t: 'p', text: '`INSERT` добавляет новые строки. Всегда перечисляйте столбцы явно: так запрос не сломается при изменении структуры таблицы и не зависит от порядка колонок. Один `INSERT` может добавить сразу несколько строк.' },
          { t: 'sql', text: `-- Одна строка; RETURNING вернёт добавленные значения
INSERT INTO employee_projects (employee_id, project_id, role, hours)
VALUES (2, 5, 'dev', 120)
RETURNING employee_id, project_id, role, hours;

-- Несколько строк за один запрос
INSERT INTO employee_projects (employee_id, project_id, role, hours)
VALUES
  (3, 5, 'dev', 80),
  (5, 5, 'analyst', 60)
RETURNING employee_id, project_id, role;` },
          { t: 'note', text: '`RETURNING` — удобное расширение PostgreSQL: оно возвращает значения вставленных строк без отдельного `SELECT`. Если не указывать столбцы со значениями по умолчанию, PostgreSQL подставит `DEFAULT`, а для `serial` или identity-столбца сгенерирует новое значение.', kind: 'tip' },
        ],
      },
      {
        id: 'dml-update',
        title: 'UPDATE',
        blocks: [
          { t: 'p', text: '`UPDATE` изменяет строки, удовлетворяющие условию `WHERE`. Можно обновлять сразу несколько столбцов, а в выражениях использовать текущие значения. Без `WHERE` изменятся **все** строки таблицы.' },
          { t: 'sql', text: `UPDATE employees
SET salary = salary * 1.05
WHERE department_id = 1
RETURNING name, salary;` },
          { t: 'note', text: 'Перед массовым обновлением проверьте условие обычным `SELECT` с тем же `WHERE`. `RETURNING` показывает, какие строки реально изменились, но не отменяет необходимость резервной копии и транзакции.', kind: 'warn' },
        ],
      },
      {
        id: 'dml-update-from',
        title: 'UPDATE ... FROM',
        blocks: [
          { t: 'p', text: '`UPDATE ... FROM` позволяет вычислять новые значения по данным другой таблицы. Это аналог соединения в обновлении: таблица-источник указывается после `FROM`, а связь задаётся в `WHERE`.' },
          { t: 'sql', text: `UPDATE employees AS e
SET salary = e.salary * 1.10
FROM departments AS d
WHERE e.department_id = d.id
  AND d.name = 'Engineering'
RETURNING e.name, e.salary;` },
          { t: 'note', text: 'Если с одной строкой цели соединяется несколько строк источника, PostgreSQL обновит её только один раз, и выбор источника может быть непредсказуемым. Убедитесь, что условие соединения даёт не более одного совпадения на строку.', kind: 'warn' },
        ],
      },
      {
        id: 'dml-delete',
        title: 'DELETE',
        blocks: [
          { t: 'p', text: '`DELETE` удаляет строки по условию. Как и в `UPDATE`, отсутствие `WHERE` означает удаление всех строк. `RETURNING` помогает увидеть, что именно было удалено.' },
          { t: 'sql', text: `DELETE FROM employee_projects
WHERE project_id = 5
RETURNING employee_id, project_id, role;` },
          { t: 'sql', text: `-- Безопасная проверка в транзакции: изменения можно отменить
BEGIN;

DELETE FROM employees
WHERE id = 16;

SELECT count(*) AS remaining
FROM employees
WHERE id = 16;

ROLLBACK;` },
          { t: 'note', text: '`DELETE` без `WHERE` удаляет всё содержимое таблицы. `TRUNCATE` делает это быстрее, но тоже требует осторожности. Внешние ключи могут запретить удаление связанных строк или, наоборот, каскадно удалить их.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'constraints',
    title: 'Ключи и ограничения',
    icon: '🔑',
    level: 'junior',
    dataset: 'company',
    intro: 'Ограничения защищают данные от ошибок на уровне базы. Разбираем ключи, проверки, значения по умолчанию и нормализацию.',
    sections: [
      {
        id: 'constraints-keys',
        title: 'PRIMARY KEY и FOREIGN KEY',
        blocks: [
          { t: 'p', text: '`PRIMARY KEY` уникально идентифицирует строку и не допускает NULL. `FOREIGN KEY` требует, чтобы значение ссылалось на существующую строку родительской таблицы; при этом сама ссылающаяся колонка может быть NULL, если для неё не задан `NOT NULL`.' },
          { t: 'table', headers: ['Ограничение', 'Смысл'], rows: [['PRIMARY KEY', 'уникальность и NOT NULL для выбранного столбца или набора столбцов'], ['FOREIGN KEY', 'значение должно существовать в родительской таблице'], ['Составной ключ', 'уникальность определяется комбинацией нескольких столбцов']] },
          { t: 'sql', text: `-- Какие ограничения уже есть у таблицы назначений
SELECT
  conname,
  contype,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'employee_projects'::regclass
ORDER BY contype, conname;` },
          { t: 'note', text: 'Внешний ключ проверяет ссылку, но PostgreSQL не создаёт индекс на ссылающуюся колонку автоматически. Для быстрых соединений и каскадных операций индекс часто нужно добавить отдельно.', kind: 'warn' },
        ],
      },
      {
        id: 'constraints-check-default',
        title: 'UNIQUE, CHECK, NOT NULL и DEFAULT',
        blocks: [
          { t: 'p', text: '`UNIQUE` запрещает повторы, `NOT NULL` — отсутствие значения, `CHECK` — нарушение заданного условия. `DEFAULT` подставляет значение, если столбец не указан во вставке или явно использован `DEFAULT`.' },
          { t: 'sql', text: `BEGIN;

CREATE TEMP TABLE employees_constraints_demo (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text UNIQUE,
  salary numeric(10,2) NOT NULL CHECK (salary > 0),
  hired_at date NOT NULL DEFAULT current_date
);

INSERT INTO employees_constraints_demo (email, salary)
VALUES ('demo@corp.io', 100000)
RETURNING id, email, salary, hired_at;

ROLLBACK;` },
          { t: 'note', text: '`UNIQUE` в PostgreSQL разрешает несколько NULL: два отсутствующих email не считаются повтором. `CHECK` пропускает строку, если условие истинно или неопределённо, поэтому дополнительно нужен `NOT NULL`, если NULL недопустим.', kind: 'info' },
        ],
      },
      {
        id: 'constraints-normalization',
        title: 'Нормализация: 1НФ, 2НФ, 3НФ',
        blocks: [
          { t: 'p', text: 'Нормализация уменьшает дублирование и аномалии обновления. В двух словах: каждое значение должно быть атомарным, зависеть от всего ключа и не зависеть от неключевых столбцов.' },
          { t: 'list', items: ['**1НФ** — в ячейке одно атомарное значение, без повторяющихся групп столбцов.', '**2НФ** — выполнена 1НФ, и неключевые столбцы зависят от всего составного ключа, а не от его части.', '**3НФ** — выполнена 2НФ, и неключевые столбцы не зависят транзитивно от других неключевых столбцов.', '**Связь многие-ко-многим** выносится в отдельную таблицу: в схеме это `employee_projects` между сотрудниками и проектами.'] },
          { t: 'note', text: 'Массивы `skills` и JSONB `meta` — осознанная денормализация PostgreSQL. Она удобна для неоднородных данных, но для сущностей, по которым нужны частые связи и проверки, лучше отдельные таблицы.', kind: 'tip' },
        ],
      },
      {
        id: 'constraints-cascade',
        title: 'ON DELETE CASCADE',
        blocks: [
          { t: 'p', text: 'Внешний ключ может задавать поведение при удалении родительской строки. `ON DELETE CASCADE` удаляет связанные дочерние строки, `RESTRICT` и `NO ACTION` запрещают удаление при наличии ссылок, `SET NULL` обнуляет ссылку.' },
          { t: 'table', headers: ['Действие', 'Поведение'], rows: [['CASCADE', 'удалить связанные дочерние строки'], ['RESTRICT', 'немедленно запретить удаление родителя'], ['NO ACTION', 'проверить ограничение в конце операции'], ['SET NULL', 'записать NULL в ссылающийся столбец'], ['SET DEFAULT', 'записать значение по умолчанию']] },
          { t: 'sql', text: `BEGIN;

ALTER TABLE employee_projects
  DROP CONSTRAINT employee_projects_project_id_fkey,
  ADD CONSTRAINT employee_projects_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'employee_projects'::regclass
  AND conname = 'employee_projects_project_id_fkey';

ROLLBACK;` },
          { t: 'note', text: 'Каскадное удаление удобно для зависимых деталей, но опасно для истории: удаление проекта может незаметно стереть все назначения. Для финансовых и аудиторских данных чаще выбирают `RESTRICT` и мягкое удаление.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'dates-basics',
    title: 'Даты и время: основы',
    icon: '📅',
    level: 'junior',
    dataset: 'company',
    intro: 'Работаем с датами, моментами времени и интервалами: извлекаем части, группируем по месяцам, считаем стаж и форматируем вывод.',
    sections: [
      {
        id: 'dates-basics-types',
        title: 'date, timestamp, timestamptz, interval',
        blocks: [
          { t: 'p', text: '`date` хранит календарную дату, `timestamp` — дату и время без часового пояса, `timestamptz` — конкретный момент времени. `interval` описывает длительность, а не точку на календаре.' },
          { t: 'table', headers: ['Тип', 'Что хранит'], rows: [['date', 'год, месяц и день'], ['timestamp', 'дату и время без привязки к часовому поясу'], ['timestamptz', 'момент времени с внутренним хранением в UTC'], ['interval', 'длительность: дни, часы, месяцы']] },
          { t: 'sql', text: `SELECT
  hired_at AS hire_date,
  hired_at::timestamp AS hire_midnight,
  hired_at::timestamptz AS hire_instant,
  INTERVAL '1 year 6 months' AS plan
FROM employees
ORDER BY hired_at
LIMIT 3;` },
          { t: 'note', text: '`timestamptz` не хранит исходное смещение часового пояса: он хранит момент в UTC и показывает его в часовом поясе сессии. Для дат рождения и календарных дедлайнов обычно достаточно `date`.', kind: 'info' },
        ],
      },
      {
        id: 'dates-basics-extract',
        title: 'EXTRACT и date_trunc',
        blocks: [
          { t: 'p', text: '`extract` извлекает часть даты: год, месяц, день, час. `date_trunc` отбрасывает всё мельче указанной единицы и возвращает начало периода — удобно для группировки по месяцам или годам.' },
          { t: 'sql', text: `SELECT
  name,
  hired_at,
  extract(year FROM hired_at) AS hire_year,
  extract(month FROM hired_at) AS hire_month,
  date_trunc('month', hired_at)::date AS month_start,
  date_trunc('year', hired_at)::date AS year_start
FROM employees
ORDER BY hired_at
LIMIT 5;` },
          { t: 'sql', text: `-- Сколько сотрудников приняли в каждом году
SELECT
  date_trunc('year', hired_at)::date AS hire_year,
  count(*) AS employees
FROM employees
GROUP BY 1
ORDER BY 1;` },
          { t: 'note', text: '`date_trunc` возвращает `timestamp` или `timestamptz`, поэтому для получения даты результат часто приводят к `date`. `extract` возвращает числовое значение, и его можно сравнивать с числами.', kind: 'tip' },
        ],
      },
      {
        id: 'dates-basics-intervals',
        title: 'Интервалы и age()',
        blocks: [
          { t: 'p', text: 'Разность двух дат в PostgreSQL — целое число дней, а разность двух timestamp — интервал. К дате можно прибавить целое число дней или `interval`. Функция `age` показывает разницу в удобном виде: годы, месяцы, дни.' },
          { t: 'sql', text: `SELECT
  name,
  current_date - hired_at AS days_employed,
  age(current_date, hired_at) AS tenure,
  hired_at + INTERVAL '1 year' AS first_anniversary
FROM employees
ORDER BY hired_at
LIMIT 5;

SELECT
  name,
  end_date - start_date AS duration_days,
  end_date - start_date > 365 AS longer_than_year
FROM projects
WHERE end_date IS NOT NULL
ORDER BY duration_days DESC;` },
          { t: 'note', text: 'Месяц — не фиксированное число дней, поэтому интервал `1 month` нельзя надёжно заменить на 30 дней. Для календарных расчётов используйте интервалы и функции дат, а не приблизительные вычисления.', kind: 'warn' },
        ],
      },
      {
        id: 'dates-basics-format-now',
        title: 'Форматирование и текущий момент',
        blocks: [
          { t: 'p', text: '`to_char` превращает дату или время в текст по шаблону. `current_date` возвращает текущую дату, `now()` — начало текущей транзакции в виде `timestamptz`. Внутри одной транзакции `now()` не меняется.' },
          { t: 'sql', text: `SELECT
  name,
  to_char(hired_at, 'DD.MM.YYYY') AS hire_day,
  to_char(hired_at, 'YYYY-MM') AS hire_month,
  current_date AS today,
  now() AS transaction_start,
  to_char(now(), 'DD.MM.YYYY HH24:MI:SS') AS now_text
FROM employees
ORDER BY hired_at
LIMIT 5;` },
          { t: 'note', text: '`current_date` и `now()` зависят от часового пояса сессии. Если нужно реальное время выполнения, а не время начала транзакции, используйте `clock_timestamp()`. `to_char` меняет только представление, но не тип значения.', kind: 'tip' },
        ],
      },
    ],
  },
];

