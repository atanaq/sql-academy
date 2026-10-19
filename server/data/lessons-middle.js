export const LESSONS_MIDDLE = [
  {
    id: 'window',
    title: 'Оконные функции',
    icon: '🪟',
    level: 'middle',
    dataset: 'company',
    intro: 'Оконные функции считают значения по набору строк, не сворачивая результат в группы: каждая строка остаётся в выводе и получает расчёт по своему окну.',
    sections: [
      {
        id: 'window-over',
        title: 'OVER, PARTITION BY и ORDER BY',
        blocks: [
          { t: 'p', text: 'Окно задаётся после имени функции: `OVER` определяет набор строк. `PARTITION BY` делит его на независимые группы, `ORDER BY` задаёт порядок внутри группы. Без `ORDER BY` окно включает все строки партиции.' },
          { t: 'sql', text: `SELECT e.name, d.name AS department, e.salary,
       row_number() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rn,
       rank()       OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk,
       dense_rank() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS drnk,
       ntile(4)     OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS quartile
FROM employees e
JOIN departments d ON d.id = e.department_id
ORDER BY department, e.salary DESC;` },
          { t: 'p', text: '`row_number` всегда даёт уникальный номер, `rank` оставляет пропуски после равных значений, `dense_rank` пропусков не делает. `ntile(n)` делит упорядоченные строки на n максимально равных buckets.' },
          { t: 'note', text: 'Окна вычисляются после `WHERE`, `GROUP BY` и `HAVING`, но до финального `ORDER BY`. Поэтому оконную функцию нельзя использовать в `WHERE` того же уровня — нужен подзапрос или CTE.', kind: 'tip' },
        ],
      },
      {
        id: 'window-offset',
        title: 'lag, lead и края окна',
        blocks: [
          { t: 'p', text: '`lag` и `lead` возвращают значение предыдущей или следующей строки в окне. Смещение по умолчанию 1, а третий аргумент задаёт значение по умолчанию вместо `NULL`.' },
          { t: 'sql', text: `SELECT name, department_id, hired_at, salary,
       lag(salary) OVER w AS prev_salary,
       lead(salary) OVER w AS next_salary,
       salary - lag(salary) OVER w AS delta
FROM employees
WINDOW w AS (PARTITION BY department_id ORDER BY hired_at, id)
ORDER BY department_id, hired_at;` },
          { t: 'p', text: 'Именованное окно `WINDOW w AS (...)` избавляет от повторения определения. `first_value` и `last_value` берут крайние значения рамки; по умолчанию рамка заканчивается текущей строкой, поэтому `last_value` часто требует явного `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.' },
          { t: 'sql', text: `SELECT name, department_id,
       first_value(name) OVER w AS first_hired,
       last_value(name) OVER w AS last_hired
FROM employees
WINDOW w AS (
  PARTITION BY department_id
  ORDER BY hired_at, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY department_id, hired_at;` },
          { t: 'note', text: 'Без явной рамки `last_value` вернёт текущую строку, а не последнюю в партиции.', kind: 'info' },
        ],
      },
      {
        id: 'window-aggregates',
        title: 'Агрегаты как оконные',
        blocks: [
          { t: 'p', text: 'Любой обычный агрегат можно превратить в оконный, добавив `OVER`. Это позволяет одновременно видеть детальную строку, итог группы и накопленную сумму, не выполняя несколько запросов.' },
          { t: 'sql', text: `SELECT e.name, e.department_id, e.hired_at, e.salary,
       sum(e.salary) OVER (
         PARTITION BY e.department_id
       ) AS dept_payroll,
       round(100.0 * e.salary / sum(e.salary) OVER (
         PARTITION BY e.department_id
       ), 2) AS pct_of_dept,
       sum(e.salary) OVER (
         ORDER BY e.hired_at, e.id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM employees e
ORDER BY e.hired_at, e.id;` },
          { t: 'p', text: '`running_total` здесь считается по всей компании в порядке найма, а `dept_payroll` и доля — внутри отдела. Деление выполнено на `100.0`, чтобы получить `numeric`, а не целочисленное деление.' },
          { t: 'note', text: 'Пустое окно `OVER ()` даёт итог по всем строкам результата. Если нужен итог после фильтрации, сначала примените `WHERE`, затем окно.', kind: 'tip' },
        ],
      },
      {
        id: 'window-frames',
        title: 'Рамки ROWS и RANGE',
        blocks: [
          { t: 'p', text: 'Рамка определяет, какие строки окна участвуют в расчёте для текущей строки. `ROWS` считает физические строки, `RANGE` — диапазон значений ключа сортировки, поэтому при равных значениях `RANGE` включает все строки-пиры.' },
          { t: 'sql', text: `SELECT name, hired_at, salary,
       round(avg(salary) OVER (
         ORDER BY hired_at, id
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ), 2) AS moving_avg_3,
       count(*) OVER (
         ORDER BY hired_at
         RANGE BETWEEN INTERVAL '1 year' PRECEDING AND CURRENT ROW
       ) AS hired_within_year
FROM employees
ORDER BY hired_at, id;` },
          { t: 'p', text: '`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` — скользящее среднее по трём последним строкам. `RANGE` с интервалом опирается на значение `hired_at`: в окно попадают все сотрудники, нанятые в пределах года до текущей даты.' },
          { t: 'note', text: 'Рамка по умолчанию при наличии `ORDER BY` — `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Она включает всех пиров текущей строки, поэтому суммы на одинаковых датах могут выглядеть не так, как ожидается.', kind: 'warn' },
        ],
      },
      {
        id: 'window-topn',
        title: 'Top-N по группе',
        blocks: [
          { t: 'p', text: 'Самый надёжный способ выбрать N лучших строк в каждой группе — сначала пронумеровать строки оконной функцией, а затем отфильтровать по номеру. Фильтровать `rank` напрямую в `WHERE` нельзя.' },
          { t: 'sql', text: `WITH ranked AS (
  SELECT e.name,
         d.name AS department,
         e.salary,
         row_number() OVER (
           PARTITION BY e.department_id
           ORDER BY e.salary DESC, e.id
         ) AS rn
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department, name, salary
FROM ranked
WHERE rn <= 2
ORDER BY department, rn;` },
          { t: 'note', text: 'Для «топ-2 с учётом равных зарплат» используйте `rank() <= 2`, а не `row_number`: `rank` сохранит все строки с одинаковым результатом.', kind: 'tip' },
          { t: 'table', headers: ['Функция', 'Поведение при равных значениях'], rows: [['row_number', 'Уникальный номер'], ['rank', 'Одинаковый ранг, затем пропуск'], ['dense_rank', 'Одинаковый ранг без пропуска']] },
        ],
      },
    ],
  },

  {
    id: 'cte',
    title: 'CTE и рекурсивные запросы',
    icon: '🌀',
    level: 'middle',
    dataset: 'company',
    intro: 'CTE делает сложный запрос читаемым: именованные блоки `WITH` можно переиспользовать, а рекурсивный вариант обходит иерархии и графы.',
    sections: [
      {
        id: 'cte-with',
        title: 'WITH: именованные подзапросы',
        blocks: [
          { t: 'p', text: '`WITH` объявляет временный именованный результат, доступный основному запросу. CTE не создаёт таблицу: это часть одного запроса, которая может быть встроена в план или материализована.' },
          { t: 'sql', text: `WITH dept_payroll AS (
  SELECT department_id, sum(salary) AS payroll, count(*) AS people
  FROM employees
  GROUP BY department_id
),
company_avg AS (
  SELECT avg(payroll) AS avg_payroll FROM dept_payroll
)
SELECT d.name, dp.payroll, dp.people, round(ca.avg_payroll, 2) AS avg_dept
FROM dept_payroll dp
JOIN departments d ON d.id = dp.department_id
CROSS JOIN company_avg ca
ORDER BY dp.payroll DESC;` },
          { t: 'note', text: 'В PostgreSQL 12+ CTE без побочных эффектов и использованный один раз обычно встраивается в основной запрос. Это не гарантирует материализацию и может менять план.', kind: 'info' },
          { t: 'p', text: 'CTE удобны для поэтапной логики: сначала агрегат, затем соединение, затем фильтрация. Но злоупотребление ими без необходимости может ухудшить план — проверяйте `EXPLAIN ANALYZE`.' },
        ],
      },
      {
        id: 'cte-chain',
        title: 'Несколько CTE и цепочка',
        blocks: [
          { t: 'p', text: 'CTE могут ссылаться на предыдущие блоки того же `WITH`. Это позволяет строить конвейер: сырые строки, агрегаты, расчёт долей. Главное — не забывать, что каждый блок видит только объявленные до него.' },
          { t: 'sql', text: `WITH emp AS (
  SELECT department_id, salary FROM employees
),
dept AS (
  SELECT department_id, sum(salary) AS payroll FROM emp GROUP BY department_id
),
ranked AS (
  SELECT department_id, payroll,
         rank() OVER (ORDER BY payroll DESC) AS place
  FROM dept
)
SELECT d.name, r.payroll, r.place
FROM ranked r
JOIN departments d ON d.id = r.department_id
WHERE r.place <= 3
ORDER BY r.place;` },
          { t: 'note', text: 'Несколько CTE не выполняются «по очереди» автоматически: планировщик может переставлять и объединять их. Детерминированный порядок нужен только при побочных эффектах, например в `INSERT ... RETURNING`.', kind: 'tip' },
        ],
      },
      {
        id: 'cte-recursive',
        title: 'Рекурсивный CTE',
        blocks: [
          { t: 'p', text: 'Рекурсивный CTE состоит из базового шага и рекурсивного шага, соединённых `UNION ALL`. Базовый шаг задаёт стартовые строки, рекурсивный ссылается на CTE и добавляет следующий уровень.' },
          { t: 'sql', text: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, o.depth + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT depth, repeat('  ', depth - 1) || name AS tree
FROM org
ORDER BY depth, name;` },
          { t: 'p', text: 'Здесь `org` — и якорь, и рекурсивная часть. `UNION ALL` быстрее и не удаляет дубликаты; `UNION` может остановить повтор, но добавляет сортировку и не заменяет защиту от циклов.' },
          { t: 'note', text: 'Рекурсия выполняется до пустого результата. Если в данных есть цикл `manager_id`, запрос может работать бесконечно — ограничивайте глубину или отслеживайте путь.', kind: 'warn' },
        ],
      },
      {
        id: 'cte-tree',
        title: 'Обход дерева и защита от циклов',
        blocks: [
          { t: 'p', text: 'Для дерева руководителей полезно хранить путь от корня в массиве. Проверка `NOT (e.id = ANY(o.path))` не даёт повторно войти в уже посещённый узел, а `depth` ограничивает аварийную глубину.' },
          { t: 'sql', text: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id,
         ARRAY[id] AS path,
         1 AS depth
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id,
         o.path || e.id,
         o.depth + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
  WHERE NOT (e.id = ANY(o.path))
    AND o.depth < 20
)
SELECT depth, array_to_string(path, ' -> ') AS chain, name
FROM org
ORDER BY path;` },
          { t: 'note', text: 'Массив `path` также позволяет найти всех потомков конкретного руководителя через `e.id = ANY(path)` или проверить, входит ли сотрудник в ветку.', kind: 'info' },
          { t: 'p', text: 'Для графов с несколькими связями вместо дерева храните посещённые вершины и применяйте `UNION` либо явную проверку пути. Универсального «автоматического» ограничителя рекурсии в PostgreSQL нет.' },
        ],
      },
      {
        id: 'cte-materialized',
        title: 'MATERIALIZED и NOT MATERIALIZED',
        blocks: [
          { t: 'p', text: 'По умолчанию PostgreSQL 12+ может встроить CTE в основной запрос. `MATERIALIZED` запрещает такое объединение и фиксирует результат, `NOT MATERIALIZED` явно разрешает встраивание.' },
          { t: 'sql', text: `WITH dept AS MATERIALIZED (
  SELECT department_id, avg(salary) AS avg_salary
  FROM employees
  GROUP BY department_id
)
SELECT e.name, e.salary, round(d.avg_salary, 2) AS avg_dept
FROM employees e
JOIN dept d ON d.department_id = e.department_id
WHERE e.salary > d.avg_salary;` },
          { t: 'p', text: '`MATERIALIZED` полезен, когда CTE дорогой и используется многократно, или когда нужно зафиксировать оценку кардинальности. `NOT MATERIALIZED` помогает, если встраивание даёт лучший план и позволяет протолкнуть фильтр внутрь.' },
          { t: 'note', text: 'Материализация — не «кэш навсегда»: результат живёт в пределах выполнения запроса. Принудительная материализация может увеличить потребление памяти и время.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'set-ops',
    title: 'UNION, INTERSECT, EXCEPT',
    icon: '🧮',
    level: 'middle',
    dataset: 'shop',
    intro: 'Операции над множествами объединяют результаты запросов по строкам. Они полезны для сравнения аудиторий, но требуют одинакового числа колонок и совместимых типов.',
    sections: [
      {
        id: 'set-union',
        title: 'UNION и UNION ALL',
        blocks: [
          { t: 'p', text: '`UNION` объединяет результаты и удаляет полные дубликаты строк, `UNION ALL` оставляет все строки. Для больших наборов `UNION ALL` дешевле: нет сортировки или хеширования для устранения дублей.' },
          { t: 'sql', text: `SELECT id, name, country
FROM customers
WHERE country IN ('Poland', 'Spain')
UNION ALL
SELECT id, name, country
FROM customers
WHERE vip
ORDER BY id;` },
          { t: 'p', text: 'Анна и Карла попадут в результат дважды: они удовлетворяют обоим условиям. Замените `UNION ALL` на `UNION` — каждая строка останется в одном экземпляре.' },
          { t: 'sql', text: `SELECT id, name, country
FROM customers
WHERE country IN ('Poland', 'Spain')
UNION
SELECT id, name, country
FROM customers
WHERE vip
ORDER BY id;` },
          { t: 'note', text: '`UNION` сравнивает всю строку целиком, а не только `id`. Если в выборках разный набор колонок, дубликаты могут не схлопнуться.', kind: 'info' },
        ],
      },
      {
        id: 'set-intersect',
        title: 'INTERSECT',
        blocks: [
          { t: 'p', text: '`INTERSECT` возвращает строки, которые присутствуют в обоих результатах. Как и `UNION`, он удаляет дубликаты; `INTERSECT ALL` сохраняет кратность.' },
          { t: 'sql', text: `SELECT id, name
FROM customers
WHERE country IN ('Poland', 'Spain')
INTERSECT
SELECT id, name
FROM customers
WHERE vip
ORDER BY id;` },
          { t: 'p', text: 'Результат — VIP-клиенты из Польши и Испании. Если нужны только идентификаторы, выбирайте одинаковый набор колонок в обеих частях: лишняя колонка участвует в сравнении.' },
          { t: 'note', text: '`INTERSECT` удобен для проверки пересечения аудиторий: например, клиенты, купившие и категорию A, и категорию B. Не путайте его с `INNER JOIN` — соединение размножает строки при нескольких совпадениях.', kind: 'tip' },
        ],
      },
      {
        id: 'set-except',
        title: 'EXCEPT',
        blocks: [
          { t: 'p', text: '`EXCEPT` возвращает строки первого запроса, которых нет во втором. Это разность множеств: порядок операндов важен.' },
          { t: 'sql', text: `SELECT id, name
FROM customers
WHERE country IN ('Poland', 'Spain', 'Russia')
EXCEPT
SELECT id, name
FROM customers
WHERE vip
ORDER BY id;` },
          { t: 'p', text: 'Здесь останутся не-VIP клиенты из выбранных стран — Борис и Дмитрий. `EXCEPT ALL` учитывает кратность: если строка встречается дважды слева и один раз справа, останется один экземпляр.' },
          { t: 'note', text: '`EXCEPT` не является анти-джойном с сохранением всех колонок: он сравнивает строки целиком. Для поиска отсутствующих заказов обычно понятнее `LEFT JOIN ... WHERE ... IS NULL` или `NOT EXISTS`.', kind: 'warn' },
        ],
      },
      {
        id: 'set-rules',
        title: 'Правила совместимости',
        blocks: [
          { t: 'p', text: 'В обоих запросах должно быть одинаковое число колонок, а типы — совместимы. Имена колонок берутся из первого запроса; `ORDER BY` в конце применяется ко всему объединению.' },
          { t: 'table', headers: ['Требование', 'Что происходит'], rows: [['Одинаковое число колонок', 'Иначе ошибка «each UNION query must have the same number of columns»'], ['Совместимые типы', 'PostgreSQL приводит типы к общему; несовместимые вызывает ошибку'], ['Порядок колонок', 'Сравниваются позиции, а не имена'], ['ORDER BY', 'Пишется один раз в конце; сортирует итог']] },
          { t: 'p', text: 'Чтобы отсортировать или ограничить отдельную часть, оберните её в подзапрос с `ORDER BY` и `LIMIT`. Сортировка внутри `UNION` без обёртки относится ко всему результату.' },
          { t: 'sql', text: `SELECT name, city FROM customers WHERE country = 'Poland'
UNION ALL
SELECT name, city FROM customers WHERE country = 'Spain'
ORDER BY name;` },
          { t: 'note', text: 'Для постраничного вывода сортируйте объединение и применяйте `LIMIT` после него, а не внутри каждой части.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'json',
    title: 'JSON и JSONB',
    icon: '🧩',
    level: 'middle',
    dataset: 'company',
    intro: '`json` и `jsonb` позволяют хранить полуструктурированные данные. В PostgreSQL почти всегда выбирают `jsonb`: он поддерживает индексы, операторы containment и эффективное изменение.',
    sections: [
      {
        id: 'json-types',
        title: 'json и jsonb',
        blocks: [
          { t: 'p', text: 'Тип `json` хранит исходный текст и проверяет синтаксис, но не предоставляет индексов и переписывает данные при каждом обращении. `jsonb` хранит разобранное двоичное представление: быстрее в операциях, поддерживает GIN и нормализует порядок ключей.' },
          { t: 'table', headers: ['Свойство', 'json', 'jsonb'], rows: [['Хранение', 'Исходный текст', 'Разобранное двоичное'], ['Дубли ключей', 'Сохраняются', 'Последний ключ побеждает'], ['Индексы GIN', 'Нет', 'Да'], ['Изменение', 'Дорогое переписывание', 'Эффективнее']] },
          { t: 'sql', text: `SELECT meta,
       meta -> 'level'        AS level_jsonb,
       meta ->> 'level'       AS level_text,
       meta #> '{tags,0}'     AS first_tag_jsonb,
       meta #>> '{tags,0}'    AS first_tag_text
FROM employees
WHERE meta IS NOT NULL
LIMIT 5;` },
          { t: 'note', text: '`->` и `#>` возвращают `jsonb`, `->>` и `#>>` — `text`. Для сравнения с числом или строкой чаще нужен `->>` с приведением типа.', kind: 'info' },
        ],
      },
      {
        id: 'json-filter',
        title: 'Фильтрация и проверка ключей',
        blocks: [
          { t: 'p', text: 'Оператор `@>` проверяет вложенность: слева объект или массив, справа — образец. Оператор `?` проверяет наличие ключа верхнего уровня, `?|` — любого из списка, `?&` — всех.' },
          { t: 'sql', text: `SELECT name, meta
FROM employees
WHERE meta @> '{"active": true}'::jsonb
  AND (meta->>'level')::int >= 4
  AND meta ? 'tags';` },
          { t: 'p', text: '`@>` для массива означает «массив содержит элемент». Это не то же самое, что `->> 0`, который проверяет только первый элемент.' },
          { t: 'sql', text: `SELECT name
FROM employees
WHERE meta->'tags' @> '["backend"]'::jsonb
ORDER BY name;` },
          { t: 'note', text: '`@>` для `jsonb` сравнивает структуру, а не диапазоны. Для поиска по значению внутри произвольного массива может понадобиться `jsonb_array_elements` и `EXISTS`.', kind: 'warn' },
        ],
      },
      {
        id: 'json-arrays',
        title: 'Разворачивание и сборка',
        blocks: [
          { t: 'p', text: 'Функция `jsonb_array_elements_text` превращает JSON-массив в строки. Обратная операция — `jsonb_agg`, а `jsonb_build_object` собирает объект из пар ключ-значение.' },
          { t: 'sql', text: `SELECT e.name, t.tag
FROM employees e
CROSS JOIN LATERAL jsonb_array_elements_text(e.meta->'tags') AS t(tag)
WHERE e.department_id = 1
ORDER BY e.name, t.tag;` },
          { t: 'p', text: 'Чтобы получить количество элементов массива тегов, используйте `jsonb_array_length` с путём к массиву. Если нужен массив объектов по группам, сначала постройте объект, затем агрегируйте его.' },
          { t: 'sql', text: `SELECT d.name AS department,
       jsonb_agg(
         jsonb_build_object(
           'name', e.name,
           'level', e.meta->'level',
           'tags_count', jsonb_array_length(e.meta->'tags')
         )
         ORDER BY e.salary DESC
       ) AS people
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY d.name;` },
          { t: 'note', text: '`jsonb_array_elements_text` разворачивает скалярные значения как текст. Для объектов используйте `jsonb_array_elements`; для массивов с вложенными объектами комбинируйте оба варианта.', kind: 'tip' },
        ],
      },
      {
        id: 'json-modify',
        title: 'Изменение jsonb',
        blocks: [
          { t: 'p', text: '`jsonb_set` заменяет значение по пути. Четвёртый аргумент `true` создаёт отсутствующие ключи; без него при отсутствии пути результат остаётся прежним.' },
          { t: 'sql', text: `SELECT name,
       jsonb_set(meta, '{level}', '5'::jsonb) AS level_up,
       jsonb_set(meta, '{remote}', 'true'::jsonb, true) AS with_remote,
       meta - 'active' AS without_active
FROM employees
WHERE id = 1;` },
          { t: 'p', text: 'Оператор `||` объединяет объекты верхнего уровня, причём правый объект переопределяет совпавшие ключи. Оператор `-` удаляет ключ или элемент массива.' },
          { t: 'sql', text: `UPDATE employees
SET meta = jsonb_set(meta, '{level}', '5'::jsonb, true)
WHERE id = 1
RETURNING id, meta;` },
          { t: 'note', text: '`jsonb_set` не работает с отрицательными индексами массивов. Для сложных преобразований пересоберите объект через `jsonb_build_object` или разверните данные в строки.', kind: 'warn' },
        ],
      },
      {
        id: 'json-index',
        title: 'GIN-индексы для jsonb',
        blocks: [
          { t: 'p', text: 'GIN-индекс ускоряет `@>`, `?`, `?|` и `?&` по `jsonb`. Класс `jsonb_path_ops` меньше и быстрее для containment, но не поддерживает операторы существования ключей.' },
          { t: 'sql', text: `CREATE INDEX idx_employees_meta_gin
  ON employees USING gin (meta);

CREATE INDEX idx_employees_meta_path
  ON employees USING gin (meta jsonb_path_ops);` },
          { t: 'p', text: 'Если запросы фильтруют по конкретному выражению, например `meta->>` по уровню, поможет B-tree по выражению. Для `jsonb`-массива, проверяемого через `@>`, GIN по колонке — правильный выбор.' },
          { t: 'sql', text: `CREATE INDEX idx_employees_level
  ON employees (((meta->>'level')::int));` },
          { t: 'note', text: 'Индекс не сработает, если в запросе тип или выражение не совпадает с индексом. Проверяйте план через `EXPLAIN (ANALYZE, BUFFERS)`.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'arrays',
    title: 'Массивы',
    icon: '📚',
    level: 'middle',
    dataset: 'company',
    intro: 'Массивы хранят несколько значений в одной ячейке. Они удобны для тегов и навыков, но требуют своих операторов, индексов и аккуратной работы с размерностью.',
    sections: [
      {
        id: 'array-basics',
        title: 'Литералы и индексация',
        blocks: [
          { t: 'p', text: 'Массив создаётся конструктором `ARRAY[...]` или строковым литералом. PostgreSQL нумерует элементы с 1, а не с 0. Срез задаётся через `[начало:конец]`.' },
          { t: 'sql', text: `SELECT ARRAY['sql', 'python'] AS by_constructor,
       '{sql,python,js}'::text[] AS by_literal,
       skills[1] AS first_skill,
       skills[2:3] AS slice
FROM employees
WHERE id = 1;` },
          { t: 'p', text: '`array_length(skills, 1)` возвращает длину первого измерения, а `cardinality(skills)` — общее число элементов. Для пустого массива `array_length` даёт `NULL`, а `cardinality` — 0.' },
          { t: 'sql', text: `SELECT name,
       array_length(skills, 1) AS len,
       cardinality(skills) AS total,
       skills[1] AS first
FROM employees
ORDER BY id
LIMIT 5;` },
          { t: 'note', text: 'Выход за границы массива возвращает `NULL`, а не ошибку. Многомерные массивы должны быть прямоугольными; для «списка списков» лучше `jsonb`.', kind: 'info' },
        ],
      },
      {
        id: 'array-ops',
        title: 'Операторы и проверки',
        blocks: [
          { t: 'p', text: '`@>` означает «содержит», `<@` — «содержится в», `&&` — «пересекается». Для проверки одного значения удобны `= ANY` и `<> ALL`.' },
          { t: 'table', headers: ['Оператор', 'Смысл', 'Когда применять'], rows: [['`@>`', 'Содержит правый массив', 'Все элементы образца присутствуют'], ['`<@`', 'Содержится в правом', 'Навыки входят в допустимый набор'], ['`&&`', 'Пересекается', 'Есть хотя бы один общий элемент'], ['`= ANY`', 'Равен любому элементу', 'Проверка одного значения']] },
          { t: 'sql', text: `SELECT name, skills
FROM employees
WHERE skills @> ARRAY['sql', 'python']
  AND skills && ARRAY['js', 'python']
ORDER BY name;` },
          { t: 'p', text: '`= ANY(skills)` эквивалентно проверке вхождения элемента. `<> ALL(skills)` истинно, только если значение не равно ни одному элементу; для пустого массива `ALL` даёт `TRUE`.' },
          { t: 'sql', text: `SELECT name
FROM employees
WHERE 'sql' = ANY(skills)
  AND NOT ('js' = ANY(skills))
ORDER BY name;` },
          { t: 'note', text: '`NULL` внутри массива делает проверки `ANY`/`ALL` трёхзначными. Если массив может содержать `NULL`, используйте `IS NULL` для элементов или очищайте данные.', kind: 'warn' },
        ],
      },
      {
        id: 'array-unnest',
        title: 'unnest и array_agg',
        blocks: [
          { t: 'p', text: '`unnest` превращает массив в набор строк, `array_agg` собирает строки обратно в массив. Вместе они позволяют нормализовать и денормализовать данные внутри запроса.' },
          { t: 'sql', text: `SELECT s.skill, count(*) AS employees
FROM employees e
CROSS JOIN LATERAL unnest(e.skills) AS s(skill)
GROUP BY s.skill
ORDER BY employees DESC, s.skill;` },
          { t: 'p', text: 'Обратная сборка полезна для отчёта: имена сотрудников отдела в одном массиве, упорядоченном по зарплате. `array_agg` можно комбинировать с `ORDER BY` внутри агрегата.' },
          { t: 'sql', text: `SELECT d.name AS department,
       array_agg(e.name ORDER BY e.salary DESC) AS people
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY d.name;` },
          { t: 'note', text: '`unnest` в `SELECT` размножает строки. Если массив пуст, `CROSS JOIN LATERAL` не даст ни одной строки; для сохранения сотрудника используйте `LEFT JOIN LATERAL ... ON true`.', kind: 'tip' },
        ],
      },
      {
        id: 'array-modify',
        title: 'Изменение и сериализация',
        blocks: [
          { t: 'p', text: '`array_append` добавляет элемент, `array_remove` удаляет все вхождения, `array_to_string` склеивает значения. Эти функции возвращают новый массив и не меняют исходный столбец без `UPDATE`.' },
          { t: 'sql', text: `SELECT name,
       array_append(skills, 'go') AS with_go,
       array_remove(skills, 'js') AS without_js,
       array_to_string(skills, ', ') AS csv
FROM employees
WHERE id IN (1, 4)
ORDER BY id;` },
          { t: 'p', text: 'Для замены по позиции комбинируйте срезы и `array_append`, а для вставки в середину — `array_cat` или конкатенацию массивов. Проверяйте длину: индексы за пределами массива дают `NULL`.' },
          { t: 'sql', text: `UPDATE employees
SET skills = array_append(skills, 'postgres')
WHERE id = 2
RETURNING id, skills;` },
          { t: 'note', text: 'GIN-индекс по массиву ускоряет `@>`, `<@` и `&&`. Создаётся так: `CREATE INDEX ... USING gin (skills)`.', kind: 'info' },
        ],
      },
    ],
  },

  {
    id: 'indexes',
    title: 'Индексы и EXPLAIN',
    icon: '⚡',
    level: 'middle',
    dataset: 'company',
    intro: 'Индекс — отдельная структура, которая ускоряет доступ к строкам ценой места на диске и замедления записи. Планировщик выбирает его только тогда, когда это дешевле последовательного чтения.',
    sections: [
      {
        id: 'index-btree',
        title: 'Зачем индекс и B-tree',
        blocks: [
          { t: 'p', text: 'B-tree — универсальный индекс для сравнений `=`, `<`, `>`, `BETWEEN`, `ORDER BY` и префиксов `LIKE`. Он хранит отсортированные ключи, поэтому может отдавать данные в нужном порядке без сортировки.' },
          { t: 'sql', text: `EXPLAIN
SELECT id, name, salary
FROM employees
WHERE salary > 100000
ORDER BY salary DESC;` },
          { t: 'p', text: '`EXPLAIN` показывает оценку плана без выполнения, `EXPLAIN ANALYZE` выполняет запрос и добавляет фактические строки и время. На маленькой таблице `Seq Scan` часто дешевле индекса.' },
          { t: 'sql', text: `EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, salary
FROM employees
WHERE salary > 100000
ORDER BY salary DESC;` },
          { t: 'note', text: 'Индекс не бесплатен: каждая вставка, обновление и удаление поддерживают структуру. Индексируйте колонки, по которым действительно фильтруют и сортируют.', kind: 'tip' },
        ],
      },
      {
        id: 'index-composite',
        title: 'Составной индекс и порядок колонок',
        blocks: [
          { t: 'p', text: 'В составном B-tree порядок колонок критичен. Индекс `(department_id, salary)` эффективен для фильтра по `department_id`, по паре `department_id + salary` и для сортировки зарплаты внутри отдела; один `salary` без первого столбца — уже нет.' },
          { t: 'sql', text: `CREATE INDEX idx_employees_dept_salary
  ON employees (department_id, salary DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT name, salary
FROM employees
WHERE department_id = 1
ORDER BY salary DESC;` },
          { t: 'p', text: 'Правило левого префикса: индекс можно использовать для первых колонок, но не для пропущенной. Если запросы фильтруют только по `salary`, нужен отдельный индекс по `salary`.' },
          { t: 'note', text: '`DESC` в индексе помогает сортировке по убыванию, но PostgreSQL умеет читать B-tree и в обратном направлении. Направление важно для смешанных `ORDER BY col1 ASC, col2 DESC`.', kind: 'info' },
        ],
      },
      {
        id: 'index-special',
        title: 'Уникальные, частичные и покрывающие',
        blocks: [
          { t: 'p', text: 'Уникальный индекс защищает от дублей на уровне БД. Частичный индекс индексирует только нужное подмножество строк, а покрывающий `INCLUDE` добавляет колонки в листья, чтобы избежать обращения к таблице.' },
          { t: 'sql', text: `CREATE UNIQUE INDEX idx_employees_email_unique
  ON employees (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX idx_employees_notnull_dept
  ON employees (department_id)
  INCLUDE (salary)
  WHERE email IS NOT NULL;` },
          { t: 'p', text: 'Функциональный индекс по `lower(email)` поддерживает поиск без учёта регистра. Частичный индекс работает, только если условие запроса совместимо с его предикатом.' },
          { t: 'sql', text: `SELECT id, name
FROM employees
WHERE lower(email) = 'alice@corp.io';` },
          { t: 'note', text: 'Уникальный индекс по `lower(email)` не позволит вставить `Alice@...`, если `alice@...` уже есть, но обычный `UNIQUE(email)` такое не поймает.', kind: 'warn' },
        ],
      },
      {
        id: 'index-types',
        title: 'GIN и GiST',
        blocks: [
          { t: 'p', text: 'GIN хорош для составных значений: `jsonb`, массивов, полнотекстовых векторов. Он хранит отдельные элементы и быстро отвечает на `@>`, `?`, `&&`. GiST применяют для триграмм, диапазонов и геометрии, где важны пересечения и ближайшие соседи.' },
          { t: 'sql', text: `CREATE INDEX idx_employees_meta_gin
  ON employees USING gin (meta);

CREATE INDEX idx_employees_skills_gin
  ON employees USING gin (skills);` },
          { t: 'p', text: 'Для нечёткого поиска по тексту нужен `pg_trgm` и GiST либо GIN с `gin_trgm_ops`. GIN обычно быстрее на чтение, но дороже на запись; GiST компактнее и поддерживает `KNN`-сортировку.' },
          { t: 'sql', text: `CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_employees_name_trgm
  ON employees USING gin (name gin_trgm_ops);

CREATE INDEX idx_employees_name_gist
  ON employees USING gist (name gist_trgm_ops);` },
          { t: 'note', text: 'GIN-индекс по `jsonb` с классом `jsonb_path_ops` поддерживает только containment `@>`, зато меньше. Выбирайте класс операторов под конкретные запросы.', kind: 'info' },
        ],
      },
      {
        id: 'index-explain',
        title: 'EXPLAIN и почему индекс не используется',
        blocks: [
          { t: 'p', text: 'Читайте план снизу вверх: `Seq Scan` — последовательное чтение, `Index Scan` — обход индекса с доступом к таблице, `Bitmap Heap Scan` — сначала битовая карта, затем пакетное чтение страниц. `EXPLAIN ANALYZE` показывает реальные строки и время.' },
          { t: 'table', headers: ['Узел', 'Когда появляется'], rows: [['`Seq Scan`', 'Нет подходящего индекса или таблица мала'], ['`Index Scan`', 'Высокая селективность, нужен порядок'], ['`Bitmap Heap Scan`', 'Много совпадений, дешевле пакетный доступ'], ['`Index Only Scan`', 'Все колонки покрыты индексом']] },
          { t: 'p', text: 'Индекс часто не используется, если условие обёрнуто функцией, типы не совпадают, статистика устарела или предикат не совместим с частичным индексом. Проверяйте `WHERE` и `ORDER BY`, а не только наличие индекса.' },
          { t: 'sql', text: `EXPLAIN (ANALYZE, BUFFERS)
SELECT name, salary
FROM employees
WHERE department_id = 1
  AND salary > 100000
ORDER BY salary DESC;` },
          { t: 'note', text: '`EXPLAIN ANALYZE` действительно выполняет запрос, включая `UPDATE` и `DELETE`. Для опасных операций используйте `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'transactions',
    title: 'Транзакции и изоляция',
    icon: '🔒',
    level: 'middle',
    dataset: 'shop',
    intro: 'Транзакция объединяет операции в атомарную единицу. Уровень изоляции и блокировки определяют, какие изменения видны параллельным сессиям и какие конфликты возможны.',
    sections: [
      {
        id: 'tx-acid',
        title: 'ACID и управление транзакцией',
        blocks: [
          { t: 'p', text: 'ACID — атомарность, согласованность, изолированность и долговечность. В PostgreSQL `BEGIN` начинает транзакцию, `COMMIT` фиксирует, `ROLLBACK` отменяет. Вне транзакции каждый запрос автоматически фиксируется.' },
          { t: 'table', headers: ['Свойство', 'Смысл'], rows: [['Atomicity', 'Всё или ничего'], ['Consistency', 'Ограничения БД соблюдены'], ['Isolation', 'Параллельные транзакции не видят незавершённые изменения'], ['Durability', 'Зафиксированные данные переживают сбой']] },
          { t: 'sql', text: `BEGIN;

UPDATE orders
SET status = 'shipped'
WHERE id = 5;

SAVEPOINT after_update;

UPDATE order_items
SET price = price * 1.1
WHERE order_id = 5;

ROLLBACK TO after_update;

COMMIT;` },
          { t: 'p', text: '`SAVEPOINT` позволяет откатить часть работы, не отменяя всю транзакцию. `RELEASE SAVEPOINT` убирает точку, а `ROLLBACK TO` возвращает состояние на момент её создания.' },
        ],
      },
      {
        id: 'tx-isolation',
        title: 'Уровни изоляции',
        blocks: [
          { t: 'p', text: 'PostgreSQL поддерживает `READ COMMITTED`, `REPEATABLE READ` и `SERIALIZABLE`. `READ UNCOMMITTED` принимается синтаксически, но работает как `READ COMMITTED`: грязное чтение в PostgreSQL невозможно.' },
          { t: 'table', headers: ['Уровень', 'Грязное чтение', 'Неповторяющееся чтение', 'Фантомы'], rows: [['READ COMMITTED', 'Нет', 'Да', 'Да'], ['REPEATABLE READ', 'Нет', 'Нет', 'Нет'], ['SERIALIZABLE', 'Нет', 'Нет', 'Нет']] },
          { t: 'p', text: 'По умолчанию используется `READ COMMITTED`: каждый запрос видит снимок, зафиксированный до его начала. `REPEATABLE READ` держит один снимок на всю транзакцию, а `SERIALIZABLE` дополнительно обнаруживает аномалии сериализации и может завершить транзакцию ошибкой.' },
          { t: 'sql', text: `BEGIN ISOLATION LEVEL REPEATABLE READ;

SELECT count(*) FROM orders WHERE status = 'new';

SELECT count(*) FROM orders WHERE status = 'new';

COMMIT;` },
          { t: 'note', text: '`REPEATABLE READ` в PostgreSQL не допускает фантомов, но не отменяет write skew. Если бизнес-правило зависит от нескольких строк, выбирайте `SERIALIZABLE` или явные блокировки и обрабатывайте ошибки сериализации повтором.', kind: 'warn' },
        ],
      },
      {
        id: 'tx-locks',
        title: 'Блокировки строк',
        blocks: [
          { t: 'p', text: '`SELECT ... FOR UPDATE` блокирует выбранные строки до конца транзакции и не даёт другим сессиям менять их. `FOR SHARE` разрешает параллельное чтение с блокировкой, но блокирует изменение. `SKIP LOCKED` пропускает уже заблокированные строки.' },
          { t: 'sql', text: `BEGIN;

SELECT id, status
FROM orders
WHERE status = 'new'
ORDER BY id
FOR UPDATE;

UPDATE orders
SET status = 'processing'
WHERE id = 10;

COMMIT;` },
          { t: 'p', text: '`FOR UPDATE` полезен для сценария «прочитать, проверить, изменить»: без блокировки между `SELECT` и `UPDATE` другая сессия может изменить ту же строку.' },
          { t: 'sql', text: `BEGIN;

SELECT id, total
FROM orders
WHERE customer_id = 1
FOR SHARE;

COMMIT;` },
          { t: 'sql', text: `BEGIN;

SELECT id
FROM orders
WHERE status = 'new'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;

COMMIT;` },
          { t: 'note', text: '`SKIP LOCKED` подходит для очередей задач, но не для согласованного чтения: вы сознательно пропускаете заблокированные строки. `FOR UPDATE` на большом наборе может удерживать много блокировок.', kind: 'warn' },
        ],
      },
      {
        id: 'tx-practice',
        title: 'Практика: очередь заказов',
        blocks: [
          { t: 'p', text: 'Типичный паттерн обработчика — захватить одну свободную строку, обновить её и зафиксировать. В PostgreSQL это можно сделать одним запросом с CTE и `RETURNING`.' },
          { t: 'sql', text: `WITH next_order AS (
  SELECT id
  FROM orders
  WHERE status = 'new'
  ORDER BY id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE orders o
SET status = 'shipped'
FROM next_order n
WHERE o.id = n.id
RETURNING o.id, o.customer_id, o.total;` },
          { t: 'p', text: 'Если две сессии запустят этот запрос одновременно, они получат разные заказы. Без `SKIP LOCKED` вторая сессия ждала бы освобождения блокировки.' },
          { t: 'note', text: 'Транзакция должна быть короткой: не держите открытой транзакцию во время сетевых вызовов или работы пользователя. Долгие транзакции мешают `VACUUM` и удерживают блокировки.', kind: 'info' },
        ],
      },
    ],
  },

  {
    id: 'views',
    title: 'Представления и материализованные представления',
    icon: '🧱',
    level: 'middle',
    dataset: 'company',
    intro: 'Представление — сохранённый запрос с именем. Оно скрывает сложность и ограничивает доступ, а материализованное представление дополнительно хранит результат на диске.',
    sections: [
      {
        id: 'view-create',
        title: 'CREATE VIEW',
        blocks: [
          { t: 'p', text: '`CREATE VIEW` сохраняет текст запроса, но не данные. При каждом обращении PostgreSQL выполняет запрос заново, поэтому представление всегда показывает актуальное состояние базовых таблиц.' },
          { t: 'sql', text: `CREATE VIEW department_stats AS
SELECT d.id AS department_id,
       d.name AS department,
       count(e.id) AS employees,
       round(avg(e.salary), 2) AS avg_salary,
       sum(e.salary) AS payroll
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name;

SELECT * FROM department_stats ORDER BY payroll DESC;` },
          { t: 'p', text: 'Представления удобны как стабильный интерфейс: можно менять внутренние таблицы, сохраняя имена и набор колонок для приложений. Права можно выдавать на представление, не открывая базовые таблицы.' },
          { t: 'note', text: '`CREATE OR REPLACE VIEW` меняет определение, но не позволяет менять порядок или типы существующих колонок. Для этого представление нужно удалить и создать заново.', kind: 'tip' },
        ],
      },
      {
        id: 'view-updatable',
        title: 'Обновляемые представления',
        blocks: [
          { t: 'p', text: 'Простое представление автоматически обновляемо, если оно построено на одной базовой таблице без `DISTINCT`, `GROUP BY`, агрегатов, `UNION` и оконных функций. `INSERT`, `UPDATE`, `DELETE` транслируются в базовую таблицу.' },
          { t: 'sql', text: `CREATE VIEW high_earners AS
SELECT id, name, department_id, salary
FROM employees
WHERE salary > 100000
WITH CHECK OPTION;

UPDATE high_earners
SET salary = 105000
WHERE id = 2;` },
          { t: 'p', text: '`WITH CHECK OPTION` не даёт изменить строку так, чтобы она перестала удовлетворять условию представления. Без него `UPDATE` может «вытолкнуть» строку из `high_earners`.' },
          { t: 'note', text: 'Представление с `JOIN`, агрегатами или `DISTINCT` по умолчанию только для чтения. Для записи нужны правила `INSTEAD OF` или триггеры, иначе PostgreSQL вернёт ошибку.', kind: 'warn' },
        ],
      },
      {
        id: 'view-matcreate',
        title: 'Материализованное представление',
        blocks: [
          { t: 'p', text: '`CREATE MATERIALIZED VIEW` выполняет запрос сразу и сохраняет результат. Чтение идёт из сохранённых строк, поэтому данные могут устареть до `REFRESH`.' },
          { t: 'sql', text: `CREATE MATERIALIZED VIEW mv_department_stats AS
SELECT d.id AS department_id,
       d.name AS department,
       count(e.id) AS employees,
       round(avg(e.salary), 2) AS avg_salary
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
WITH DATA;

CREATE UNIQUE INDEX mv_department_stats_pk
  ON mv_department_stats (department_id);

SELECT * FROM mv_department_stats ORDER BY department_id;` },
          { t: 'p', text: 'Уникальный индекс нужен не только для доступа, но и для `REFRESH MATERIALIZED VIEW CONCURRENTLY`. `WITH NO DATA` создаёт пустое представление: до первого `REFRESH` читать его нельзя.' },
          { t: 'note', text: 'Материализованное представление занимает место и требует обновления. Оно оправдано для дорогих агрегатов и отчётов, где допустима задержка данных.', kind: 'info' },
        ],
      },
      {
        id: 'view-refresh',
        title: 'Обновление и выбор подхода',
        blocks: [
          { t: 'p', text: '`REFRESH MATERIALIZED VIEW` полностью пересчитывает результат и блокирует чтение. Вариант `CONCURRENTLY` строит новую версию и переключает её, не блокируя читателей, но требует уникального индекса и работает медленнее.' },
          { t: 'sql', text: `REFRESH MATERIALIZED VIEW mv_department_stats;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_stats;` },
          { t: 'p', text: 'Если нужны всегда актуальные данные и запрос недорогой, используйте обычное представление. Если запрос тяжёлый, а небольшая задержка допустима — материализованное с регламентным `REFRESH`.' },
          { t: 'table', headers: ['Критерий', 'VIEW', 'MATERIALIZED VIEW'], rows: [['Хранение', 'Только запрос', 'Запрос и результат'], ['Актуальность', 'Всегда', 'До REFRESH'], ['Чтение', 'Выполняет запрос', 'Читает сохранённые строки'], ['Индексы', 'Нет своих данных', 'Можно создавать']] },
          { t: 'note', text: '`REFRESH ... CONCURRENTLY` не выполняется внутри блока транзакции и требует уникального индекса по всем строкам. Проверьте это до включения в ETL-процесс.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'upsert',
    title: 'UPSERT и массовые операции',
    icon: '♻️',
    level: 'middle',
    dataset: 'shop',
    intro: 'UPSERT объединяет вставку и обновление в один атомарный запрос. Он опирается на уникальное ограничение и позволяет безопасно обрабатывать повторяющиеся ключи.',
    sections: [
      {
        id: 'upsert-conflict',
        title: 'ON CONFLICT',
        blocks: [
          { t: 'p', text: '`INSERT ... ON CONFLICT` срабатывает, когда вставка нарушает уникальное ограничение или индекс. `DO NOTHING` пропускает конфликтную строку, `DO UPDATE` изменяет существующую.' },
          { t: 'sql', text: `INSERT INTO orders (id, customer_id, order_date, status, total)
VALUES (11, 1, DATE '2023-10-15', 'new', 199.90)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    total = EXCLUDED.total,
    order_date = EXCLUDED.order_date
RETURNING id, status, total;` },
          { t: 'p', text: '`EXCLUDED` — псевдотаблица с предложенной строкой, которую хотел вставить запрос. В `SET` можно использовать и `orders.total`, и `EXCLUDED.total`, но смысл у них разный.' },
          { t: 'sql', text: `INSERT INTO orders (id, customer_id, order_date, status, total)
VALUES (11, 1, DATE '2023-10-15', 'new', 199.90)
ON CONFLICT (id) DO NOTHING
RETURNING id;` },
          { t: 'note', text: 'Конфликт определяется только по уникальному индексу или ограничению. `ON CONFLICT (id)` требует уникальность `id`; для произвольного условия нужен частичный уникальный индекс.', kind: 'info' },
        ],
      },
      {
        id: 'upsert-where',
        title: 'DO UPDATE с условием',
        blocks: [
          { t: 'p', text: 'У `DO UPDATE` может быть собственный `WHERE`: обновление выполняется только для строк, удовлетворяющих условию. Если условие ложно, строка не обновляется и не возвращается через `RETURNING`.' },
          { t: 'sql', text: `INSERT INTO orders (id, customer_id, order_date, status, total)
VALUES (5, 4, DATE '2023-05-03', 'cancelled', 750)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    total = EXCLUDED.total
WHERE orders.status <> 'delivered'
RETURNING id, status, total;` },
          { t: 'p', text: 'Такой приём защищает финальные статусы от случайного перезаписывания. Условие может ссылаться на текущую строку и на `EXCLUDED`.' },
          { t: 'note', text: '`ON CONFLICT DO UPDATE` не может затронуть одну и ту же строку дважды в одном `INSERT ... VALUES`. Если входные данные содержат дубли ключа, сначала дедуплицируйте их.', kind: 'warn' },
        ],
      },
      {
        id: 'upsert-bulk',
        title: 'Массовая вставка',
        blocks: [
          { t: 'p', text: 'Многострочный `VALUES` уменьшает число сетевых обменов. Ещё быстрее `INSERT ... SELECT` из временной таблицы или `COPY`, который использует оптимизированный протокол загрузки.' },
          { t: 'sql', text: `INSERT INTO orders (id, customer_id, order_date, status, total)
VALUES (11, 1, DATE '2023-10-15', 'new', 199.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
  (11, 1, 1, 1800),
  (11, 2, 2, 45),
  (11, 3, 1, 120);

INSERT INTO orders (id, customer_id, order_date, status, total)
SELECT 12, c.id, DATE '2023-10-20', 'new', 0
FROM customers c
WHERE c.vip
ORDER BY c.id
LIMIT 1;` },
          { t: 'p', text: '`INSERT ... SELECT` удобен для переноса данных и пересчёта значений на лету. `COPY ... FROM` в серверном процессе быстрее массовых `INSERT`, но требует доступа к файлу или потоку и отдельной обработки ошибок.' },
          { t: 'sql', text: `COPY orders (id, customer_id, order_date, status, total)
FROM '/path/to/orders.csv'
WITH (FORMAT csv, HEADER true);` },
          { t: 'note', text: 'Для регулярной загрузки больших файлов используйте `COPY`, для сложной трансформации — `INSERT ... SELECT`, для небольших пакетов — многострочный `VALUES`.', kind: 'tip' },
        ],
      },
      {
        id: 'upsert-batch',
        title: 'Пакетный UPSERT',
        blocks: [
          { t: 'p', text: 'Массовый UPSERT обрабатывает пакет строк одним запросом. Каждая строка проверяется на конфликт, а `RETURNING` показывает, что реально вставлено или обновлено.' },
          { t: 'sql', text: `INSERT INTO orders (id, customer_id, order_date, status, total)
VALUES
  (11, 1, DATE '2023-10-15', 'new', 199.90),
  (12, 2, DATE '2023-10-20', 'new', 88.00)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    total = EXCLUDED.total
WHERE orders.status <> 'delivered'
RETURNING id, status, total;` },
          { t: 'p', text: 'Одна команда атомарна: либо весь пакет применится, либо (при ошибке) откатится. Для очень больших пакетов разбивайте работу на порции, чтобы не держать долгую транзакцию и не раздувать WAL.' },
          { t: 'note', text: 'Проверяйте план и количество конфликтов. Если конфликтов почти нет, `ON CONFLICT DO NOTHING` дешевле; если обновлений много, важен порядок строк и наличие нужных индексов.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'strings',
    title: 'Строки, регулярные выражения и поиск',
    icon: '🔤',
    level: 'middle',
    dataset: 'company',
    intro: 'Строковые функции PostgreSQL закрывают регистр, обрезку, разбиение, регулярные выражения и нечёткий поиск. Выбор инструмента зависит от того, ищете ли вы подстроку, шаблон или смысл.',
    sections: [
      {
        id: 'str-case',
        title: 'Регистр, обрезка и длина',
        blocks: [
          { t: 'p', text: '`lower`, `upper` и `initcap` меняют регистр, `trim`, `ltrim` и `rtrim` удаляют пробелы или указанные символы. `length` считает символы, `octet_length` — байты в кодировке БД.' },
          { t: 'sql', text: `SELECT name,
       lower(name) AS low,
       upper(name) AS up,
       initcap(lower(name)) AS title,
       trim('  ' || name || '  ') AS trimmed,
       ltrim('  ' || name) AS left_trimmed,
       rtrim(name || '  ') AS right_trimmed,
       length(name) AS chars,
       octet_length(name) AS bytes
FROM employees
ORDER BY id
LIMIT 5;` },
          { t: 'p', text: '`trim(both from name)` и `btrim(name)` эквивалентны для пробелов. `lpad` и `rpad` дополняют строку до нужной длины, а `repeat` повторяет её заданное число раз.' },
          { t: 'sql', text: `SELECT name,
       lpad(name, 20, '.') AS padded,
       repeat('-', 10) || ' ' || name AS decorated
FROM employees
WHERE id <= 3;` },
          { t: 'note', text: 'Длина в символах и байтах различается для кириллицы и эмодзи. Для ограничений хранения важны байты, для интерфейса — символы.', kind: 'info' },
        ],
      },
      {
        id: 'str-slice',
        title: 'Извлечение, замена и сборка',
        blocks: [
          { t: 'p', text: '`substring`, `left`, `right` и `substr` извлекают часть строки. `position` и `strpos` ищут подстроку, `replace` заменяет все вхождения, `translate` — посимвольно.' },
          { t: 'sql', text: `SELECT name,
       left(name, 3) AS first3,
       right(name, 3) AS last3,
       substring(name from 2 for 4) AS middle,
       position(' ' in name) AS space_pos
FROM employees
WHERE id <= 3;` },
          { t: 'p', text: '`split_part` режет строку по разделителю и возвращает нужный фрагмент. `concat`, `||` и `format` собирают значения; `format` удобен для шаблонов с `%s` и `%I`.' },
          { t: 'sql', text: `SELECT email,
       split_part(email, '@', 2) AS domain,
       strpos(email, '@') AS at_pos,
       replace(email, 'corp.io', 'example.com') AS new_email,
       translate(name, 'aeiou', '*****') AS vowels_masked,
       concat(name, ' <', email, '>') AS concat_contact,
       name || ' <' || email || '>' AS operator_contact,
       format('%s <%s>', name, email) AS formatted_contact
FROM employees
WHERE email IS NOT NULL
ORDER BY id
LIMIT 5;` },
          { t: 'note', text: '`concat` игнорирует `NULL`, а `||` возвращает `NULL`, если хотя бы один операнд `NULL`. Выбирайте поведение осознанно и используйте `coalesce`.', kind: 'warn' },
        ],
      },
      {
        id: 'str-regex',
        title: 'Регулярные выражения',
        blocks: [
          { t: 'p', text: 'Операторы `~` и `~*` проверяют совпадение с регулярным выражением с учётом и без учёта регистра, `!~` и `!~*` — отрицание. `regexp_replace` заменяет, `regexp_matches` извлекает группы, `regexp_split_to_table` разбивает на строки.' },
          { t: 'sql', text: `SELECT name, email
FROM employees
WHERE email ~* '^[a-z]+@CORP[.]IO$'
  AND email ~ '@corp[.]io$'
  AND email !~ '^(alice|bob)@'
ORDER BY name;` },
          { t: 'p', text: '`regexp_matches` возвращает массив групп, а с флагом `g` — все совпадения. `regexp_split_to_table` полезен, когда строка содержит список с разными разделителями.' },
          { t: 'sql', text: `SELECT name,
       regexp_replace(email, '@.*$', '') AS local_part,
       regexp_matches(email, '^([a-z]+)@([a-z.]+)$') AS parts
FROM employees
WHERE email IS NOT NULL
ORDER BY id
LIMIT 5;` },
          { t: 'sql', text: `SELECT name,
       regexp_split_to_table(array_to_string(skills, ','), ',') AS skill
FROM employees
WHERE id = 1;` },
          { t: 'note', text: 'Регулярные выражения мощнее `LIKE`, но дороже. Для простого поиска подстроки с шаблоном `%` используйте `LIKE` или `ILIKE`, для сложных правил — regexp.', kind: 'tip' },
        ],
      },
      {
        id: 'str-fuzzy',
        title: 'LIKE, pg_trgm и нечёткий поиск',
        blocks: [
          { t: 'p', text: '`LIKE` и `ILIKE` поддерживают `%` и `_`, но не классы символов и группы. Для поиска с опечатками подключают `pg_trgm`: триграммы позволяют индексировать сходство.' },
          { t: 'sql', text: `CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT name,
       similarity(name, 'Alise Johnson') AS sim
FROM employees
ORDER BY sim DESC
LIMIT 5;` },
          { t: 'p', text: 'Оператор `%` проверяет сходство выше порога, `similarity` возвращает число от 0 до 1. GIN- или GiST-индекс с `gin_trgm_ops`/`gist_trgm_ops` ускоряет `LIKE` и нечёткий поиск.' },
          { t: 'sql', text: `SELECT name
FROM employees
WHERE name ILIKE '%john%'
   OR name % 'Alise Johnson'
ORDER BY name;` },
          { t: 'note', text: 'Триграммы чувствительны к языку и регистру. Для русского текста качество зависит от данных; нормализуйте регистр и проверяйте порог `pg_trgm.similarity_threshold`.', kind: 'info' },
        ],
      },
      {
        id: 'str-fts',
        title: 'Полнотекстовый поиск',
        blocks: [
          { t: 'p', text: 'Полнотекстовый поиск работает с лексемами, а не подстроками: `to_tsvector` разбирает документ, `to_tsquery` — запрос, `@@` проверяет совпадение. Для английского данных используйте конфигурацию `english`.' },
          { t: 'sql', text: `SELECT name,
       to_tsvector('english', name) AS vector,
       to_tsquery('english', 'alice | bob') AS query
FROM employees
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'alice | bob');` },
          { t: 'p', text: '`ts_rank` упорядочивает результаты по релевантности, а `plainto_tsquery` безопасно превращает пользовательский текст в запрос без ручного синтаксиса. Для ускорения создайте GIN-индекс по выражению.' },
          { t: 'sql', text: `CREATE INDEX idx_employees_name_fts
  ON employees USING gin (to_tsvector('english', name));

SELECT name,
       ts_rank(
         to_tsvector('english', name),
         to_tsquery('english', 'alice')
       ) AS rank
FROM employees
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'alice')
ORDER BY rank DESC;` },
          { t: 'note', text: 'Полнотекстовый поиск не находит часть слова, если не настроен стемминг или префиксный запрос. Для поиска по подстроке и опечаткам лучше `pg_trgm`.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'patterns',
    title: 'SQL-паттерны: top-N, дедупликация, пивот',
    icon: '🧠',
    level: 'middle',
    dataset: 'shop',
    intro: 'Повторяющиеся аналитические задачи решаются типовыми SQL-конструкциями: нумерация, дедупликация, пивот, анпивот и поиск пропусков в календаре.',
    sections: [
      {
        id: 'patterns-topn',
        title: 'Top-N и DISTINCT ON',
        blocks: [
          { t: 'p', text: 'Top-N в группе строят через `row_number` в CTE и фильтр по номеру. Если нужно по одной последней строке на ключ, короче `DISTINCT ON`, но его `ORDER BY` должен начинаться с выражений в скобках.' },
          { t: 'sql', text: `WITH ranked AS (
  SELECT p.name, p.category, p.price,
         row_number() OVER (
           PARTITION BY p.category
           ORDER BY p.price DESC, p.id
         ) AS rn
  FROM products p
)
SELECT category, name, price
FROM ranked
WHERE rn <= 2
ORDER BY category, rn;` },
          { t: 'p', text: 'Для последнего заказа каждого клиента `DISTINCT ON` читается проще, чем оконная функция, и часто выполняется через индекс. Однако он возвращает ровно одну строку на ключ, а не N строк.' },
          { t: 'sql', text: `SELECT DISTINCT ON (o.customer_id)
       o.customer_id, o.id, o.order_date, o.total
FROM orders o
ORDER BY o.customer_id, o.order_date DESC, o.id DESC;` },
          { t: 'note', text: '`DISTINCT ON (customer_id)` требует, чтобы `ORDER BY` начинался с `customer_id`; иначе PostgreSQL выдаст ошибку. Для top-N по группе всё же нужен `row_number`.', kind: 'tip' },
        ],
      },
      {
        id: 'patterns-dedup',
        title: 'Дубликаты, дедупликация и running total',
        blocks: [
          { t: 'p', text: 'Дубликаты ищут группировкой по нормализованному ключу. В примере ключ — имя и город в нижнем регистре; в CTE добавлена синтетическая копия Анны, чтобы показать конфликт на реальной таблице `customers`.' },
          { t: 'sql', text: `WITH src AS (
  SELECT id, name, city,
         lower(name) || '|' || coalesce(city, '') AS dup_key
  FROM customers
  UNION ALL
  SELECT 999, 'Anna Novak', 'Warsaw', 'anna novak|warsaw'
)
SELECT dup_key, count(*) AS copies, array_agg(name ORDER BY id) AS names
FROM src
GROUP BY dup_key
HAVING count(*) > 1
ORDER BY copies DESC, dup_key;` },
          { t: 'p', text: 'Для дедупликации оставьте по одной строке на ключ. `row_number` даёт гибкий выбор: например, самую раннюю запись по `id`, а остальные можно удалить отдельным запросом.' },
          { t: 'sql', text: `WITH src AS (
  SELECT id, name, city,
         lower(name) || '|' || coalesce(city, '') AS dup_key
  FROM customers
  UNION ALL
  SELECT 999, 'Anna Novak', 'Warsaw', 'anna novak|warsaw'
),
ranked AS (
  SELECT *, row_number() OVER (
    PARTITION BY dup_key ORDER BY id
  ) AS rn
  FROM src
)
SELECT id, name, city
FROM ranked
WHERE rn = 1
ORDER BY dup_key;` },
          { t: 'sql', text: `SELECT o.id, o.customer_id, o.order_date, o.total,
       sum(o.total) OVER (
         ORDER BY o.order_date, o.id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders o
ORDER BY o.order_date, o.id;` },
          { t: 'note', text: 'Последний запрос считает running total: накопленный итог в порядке события. Рамка `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` не сворачивает строки. Порядок в `OVER` должен быть детерминированным: при равных датах добавьте `id`, иначе сумма между запусками может отличаться.', kind: 'info' },
        ],
      },
      {
        id: 'patterns-pivot',
        title: 'Пивот через FILTER и CASE',
        blocks: [
          { t: 'p', text: 'Пивот превращает значения строк в колонки. В PostgreSQL удобны агрегаты с `FILTER (WHERE ...)`; `CASE` внутри агрегата даёт тот же результат и полезен для вычисляемых условий.' },
          { t: 'sql', text: `SELECT c.country,
       count(*) AS orders,
       count(*) FILTER (WHERE o.status = 'delivered') AS delivered,
       count(*) FILTER (WHERE o.status = 'cancelled') AS cancelled,
       sum(o.total) FILTER (WHERE o.status = 'delivered') AS delivered_total,
       sum(CASE WHEN o.status = 'shipped' THEN o.total ELSE 0 END) AS shipped_total
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.country
ORDER BY c.country;` },
          { t: 'p', text: '`FILTER` выполняется только для строк, удовлетворяющих условию, и не требует `ELSE`. Для пивота с динамическим набором колонок SQL нужно генерировать в приложении или использовать `crosstab` из `tablefunc`.' },
          { t: 'note', text: 'Пивот всегда требует группировки по строкам, которые остаются колонками. Если категорий много и они меняются, фиксированный набор колонок становится хрупким.', kind: 'tip' },
        ],
      },
      {
        id: 'patterns-unpivot',
        title: 'Анпивот',
        blocks: [
          { t: 'p', text: 'Анпивот переводит колонки в строки. Сначала постройте широкую строку, затем разверните её через `CROSS JOIN LATERAL (VALUES ...)`: это компактнее цепочки `UNION ALL`.' },
          { t: 'sql', text: `WITH per_country AS (
  SELECT c.country,
         count(*) FILTER (WHERE o.status = 'delivered') AS delivered,
         count(*) FILTER (WHERE o.status = 'cancelled') AS cancelled,
         count(*) FILTER (WHERE o.status = 'shipped') AS shipped
  FROM customers c
  JOIN orders o ON o.customer_id = c.id
  GROUP BY c.country
)
SELECT country, status, cnt
FROM per_country
CROSS JOIN LATERAL (
  VALUES ('delivered', delivered),
         ('cancelled', cancelled),
         ('shipped', shipped)
) AS u(status, cnt)
ORDER BY country, status;` },
          { t: 'p', text: '`VALUES` в `LATERAL` видит колонки текущей строки, поэтому каждое значение превращается в отдельную строку результата. Пустые категории можно отфильтровать по `cnt > 0`.' },
          { t: 'note', text: 'При анпивоте легко потерять исходный ключ: включайте его в `SELECT` и в `ORDER BY`. Если колонок много, генерируйте список `VALUES` программно, чтобы не дублировать имена вручную.', kind: 'warn' },
        ],
      },
      {
        id: 'patterns-gaps',
        title: 'Пропуски и острова',
        blocks: [
          { t: 'p', text: 'Пропуски в календаре ищут через `generate_series` и `LEFT JOIN`: полный ряд дат соединяется с фактическими событиями, а отсутствие события определяется по `NULL` в правой таблице.' },
          { t: 'sql', text: `WITH calendar AS (
  SELECT d::date AS day
  FROM generate_series(
    DATE '2023-01-01',
    DATE '2023-03-31',
    INTERVAL '1 day'
  ) AS g(d)
)
SELECT c.day
FROM calendar c
LEFT JOIN orders o ON o.order_date = c.day
WHERE o.id IS NULL
ORDER BY c.day;` },
          { t: 'p', text: 'Острова — последовательные даты, сгруппированные в интервалы. Разность даты и `row_number` даёт постоянный ключ для каждой непрерывной серии; затем агрегируйте по этому ключу.' },
          { t: 'sql', text: `WITH days AS (
  SELECT DISTINCT order_date
  FROM orders
),
grouped AS (
  SELECT order_date,
         order_date - (row_number() OVER (ORDER BY order_date))::int AS grp
  FROM days
)
SELECT min(order_date) AS island_start,
       max(order_date) AS island_end,
       count(*) AS days
FROM grouped
GROUP BY grp
ORDER BY island_start;` },
          { t: 'note', text: 'Для интервалов по месяцам замените вычитание дней на `date_trunc` и нумерацию месяцев. Универсального оператора «остров» нет — важна монотонная нумерация и корректная арифметика дат.', kind: 'info' },
        ],
      },
    ],
  },

  {
    id: 'datetime-advanced',
    title: 'Даты и время: продвинуто',
    icon: '⏱️',
    level: 'middle',
    dataset: 'company',
    intro: 'Даты и время в PostgreSQL различают момент времени и календарную дату. Часовые пояса, границы периодов и интервалы требуют явных преобразований, иначе отчёты расходятся.',
    sections: [
      {
        id: 'dt-timestamptz',
        title: 'timestamptz и AT TIME ZONE',
        blocks: [
          { t: 'p', text: '`timestamptz` хранит момент времени в UTC и показывает его в часовом поясе сессии. `timestamp` хранит «настенное» время без зоны. `AT TIME ZONE` переводит одно в другое.' },
          { t: 'sql', text: `SHOW timezone;

SELECT now() AS session_time,
       now() AT TIME ZONE 'UTC' AS utc_wall_clock,
       TIMESTAMP '2024-01-15 10:00:00' AT TIME ZONE 'Europe/Moscow' AS moscow_instant;` },
          { t: 'p', text: 'Для `timestamptz` оператор `AT TIME ZONE` возвращает `timestamp` в указанной зоне; для `timestamp` — наоборот, интерпретирует его в зоне и возвращает `timestamptz`. Функция `timezone(zone, value)` делает то же самое.' },
          { t: 'table', headers: ['Тип', 'Что хранит', 'Когда использовать'], rows: [['`timestamp`', 'Дату и время без зоны', 'Календарные события, локальное время'], ['`timestamptz`', 'Момент времени, показываемый в зоне сессии', 'События, которые происходят в реальном мире']] },
          { t: 'note', text: 'Храните моменты времени в `timestamptz`, а зону для отображения выбирайте на границе приложения или в `AT TIME ZONE`. Не храните смещение строкой.', kind: 'tip' },
        ],
      },
      {
        id: 'dt-trunc',
        title: 'date_trunc и границы периодов',
        blocks: [
          { t: 'p', text: '`date_trunc` отбрасывает часть даты до указанной единицы: час, день, неделя, месяц, квартал, год. Это основа группировки по периодам без ручного форматирования.' },
          { t: 'sql', text: `SELECT date_trunc('month', hired_at)::date AS month,
       count(*) AS hired
FROM employees
GROUP BY 1
ORDER BY 1;` },
          { t: 'p', text: 'Границы периода удобно задавать полуинтервалом `[начало, начало + интервал)`: так в отчёт не попадут события следующего месяца. Для последнего дня месяца используйте `date_trunc` плюс интервал.' },
          { t: 'sql', text: `SELECT p.name,
       p.start_date,
       date_trunc('month', p.start_date)::date AS month_start,
       (date_trunc('month', p.start_date) + INTERVAL '1 month')::date AS next_month,
       (date_trunc('month', p.start_date) + INTERVAL '1 month - 1 day')::date AS month_end
FROM projects p
ORDER BY p.start_date;` },
          { t: 'note', text: '`date_trunc` для `timestamptz` зависит от часового пояса сессии. Если отчёт должен считаться по конкретной зоне, сначала примените `AT TIME ZONE`, затем `date_trunc`.', kind: 'info' },
        ],
      },
      {
        id: 'dt-series',
        title: 'Календарь через generate_series',
        blocks: [
          { t: 'p', text: '`generate_series` строит непрерывный ряд дат или чисел. Соединив его с таблицей, можно получить календарь без пропусков и посчитать проекты по месяцам, включая нулевые месяцы.' },
          { t: 'sql', text: `WITH months AS (
  SELECT g::date AS month
  FROM generate_series(
    DATE '2023-01-01',
    DATE '2023-12-01',
    INTERVAL '1 month'
  ) AS g
)
SELECT m.month,
       count(p.id) AS projects_started
FROM months m
LEFT JOIN projects p
  ON p.start_date >= m.month
 AND p.start_date < m.month + INTERVAL '1 month'
GROUP BY m.month
ORDER BY m.month;` },
          { t: 'p', text: 'Условие соединения должно быть диапазонным: сравнивать `date_trunc` с `=` тоже можно, но диапазон лучше использует индекс по `start_date`. `LEFT JOIN` сохраняет месяцы без проектов.' },
          { t: 'note', text: 'Для недель и кварталов меняйте шаг `generate_series`. Верхняя граница включается, поэтому для 12 месяцев берите первое число декабря, а не 31 декабря.', kind: 'tip' },
        ],
      },
      {
        id: 'dt-intervals',
        title: 'Интервалы, age и extract',
        blocks: [
          { t: 'p', text: 'Интервалы поддерживают арифметику: `date + interval` даёт `timestamp`, `date - date` — целое число дней. `age` возвращает разницу в годах, месяцах и днях, а `extract(epoch ...)` — секунды.' },
          { t: 'sql', text: `SELECT name, hired_at,
       DATE '2024-01-01' - hired_at AS days_employed,
       age(DATE '2024-01-01', hired_at) AS tenure,
       extract(epoch FROM (TIMESTAMP '2024-01-01 00:00:00' - TIMESTAMP '2023-01-01 00:00:00')) AS seconds_in_year
FROM employees
ORDER BY hired_at
LIMIT 5;` },
          { t: 'p', text: '`extract(epoch FROM interval)` возвращает число секунд в интервале. Для `timestamptz` `epoch` — секунды с 1970-01-01 UTC, что удобно для сравнения моментов и передачи в API.' },
          { t: 'sql', text: `SELECT name
FROM employees
WHERE hired_at >= DATE '2024-01-01' - INTERVAL '3 years'
ORDER BY hired_at;` },
          { t: 'note', text: 'Сложение `date + interval` возвращает `timestamp`, а не `date`. Если нужна календарная дата, приводите результат явно и учитывайте переходы на летнее время.', kind: 'warn' },
        ],
      },
      {
        id: 'dt-format',
        title: 'to_char, to_timestamp и LAST_DAY',
        blocks: [
          { t: 'p', text: '`to_char` форматирует дату и время по шаблону, `to_timestamp` разбирает строку или Unix-время. Шаблоны зависят от локали, поэтому для обмена данными используйте ISO-формат.' },
          { t: 'sql', text: `SELECT to_char(TIMESTAMP '2024-03-15 14:30:00', 'DD.MM.YYYY HH24:MI') AS formatted,
       to_char(now() AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD HH24:MI') AS moscow_time,
       to_timestamp('15.03.2024 14:30', 'DD.MM.YYYY HH24:MI') AS parsed;` },
          { t: 'p', text: 'В PostgreSQL нет функции `LAST_DAY`, но её роль выполняет начало следующего месяца минус один день. Для квартала и года замените единицу в `date_trunc` и интервале.' },
          { t: 'sql', text: `SELECT d AS day,
       (date_trunc('month', d) + INTERVAL '1 month - 1 day')::date AS last_day
FROM (VALUES
  (DATE '2024-02-10'),
  (DATE '2024-12-05')
) AS t(d);` },
          { t: 'p', text: '`to_timestamp(epoch)` принимает секунды с начала эпохи и возвращает `timestamptz` в зоне сессии. Для разбора строки с зоной используйте формат с `TZ` и проверяйте результат.' },
          { t: 'note', text: '`to_char` не меняет часовой пояс. Сначала приведите момент к нужной зоне через `AT TIME ZONE`, затем форматируйте; иначе вывод зависит от настроек сессии.', kind: 'info' },
        ],
      },
    ],
  },
];
