// База знаний: модули SENIOR-уровня по PostgreSQL.
// Блоки: {t:'p'} абзац, {t:'h'} подзаголовок, {t:'sql'} код, {t:'list'} список,
// {t:'note'} заметка (kind: tip|warn|info), {t:'table'} таблица.
// Инлайн-разметка: **жирный**, `код`. SQL — только в шаблонных строках.

export const LESSONS_SENIOR = [
  {
    id: 'planner',
    title: 'Планировщик и EXPLAIN',
    icon: '🧭',
    level: 'senior',
    dataset: 'company',
    intro: 'Разбираем путь от текста запроса до физического плана: стоимости, оценки кардинальности, типы сканирований и соединений. Учимся читать EXPLAIN и понимать, где оценка расходится с реальностью.',
    sections: [
      {
        id: 'planner-logical',
        title: 'Логический и физический план',
        blocks: [
          { t: 'p', text: 'Запрос проходит стадии разбора, переписывания, планирования и выполнения. Планировщик строит дерево физических узлов: каждый узел умеет отдавать строки наверх, а родитель читает их через `EXPLAIN`-цепочку снизу вверх.' },
          { t: 'sql', text: `-- Форма плана без стоимостей: так удобно разбирать структуру
EXPLAIN (COSTS OFF)
SELECT e.name, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary > 90000
ORDER BY e.salary DESC;

-- Sort
--   Sort Key: e.salary DESC
--   ->  Hash Join
--         Hash Cond: (e.department_id = d.id)
--         ->  Seq Scan on employees e
--               Filter: (salary > 90000)
--         ->  Hash
--               ->  Seq Scan on departments d` },
          { t: 'p', text: 'Читайте план **снизу вверх и изнутри наружу**: сначала выполняются дочерние узлы, затем родитель потребляет их вывод. `actual time` относится к одному вызову узла, а `loops` показывает, сколько раз узел вызывался — итоговое время узла примерно равно `actual time × loops`.' },
          { t: 'table', headers: ['Узел', 'Что делает', 'Когда появляется'], rows: [['Seq Scan', 'Читает heap целиком, фильтрует строки', 'Нет подходящего индекса или нужна большая доля таблицы'], ['Index Scan', 'Идёт по индексу и за каждой строкой — в heap', 'Высокая селективность, нужен порядок'], ['Bitmap Heap Scan', 'Сначала битовая карта страниц, потом пакетное чтение heap', 'Средняя селективность, много строк из разных страниц'], ['Nested Loop', 'Для каждой внешней строки ищет внутренние', 'Маленький внешний набор плюс индекс'], ['Hash Join', 'Строит хеш по меньшей стороне', 'Большие наборы без индексов, равенство'], ['Gather', 'Собирает строки от параллельных воркеров', 'Параллельный план']] },
          { t: 'note', text: '`EXPLAIN` только оценивает план, `EXPLAIN ANALYZE` реально выполняет запрос. Для `UPDATE`/`DELETE` это меняет данные — оборачивайте в транзакцию с `ROLLBACK`.', kind: 'info' },
        ],
      },
      {
        id: 'planner-cost',
        title: 'Стоимость, rows и width',
        blocks: [
          { t: 'p', text: 'Стоимость — условная величина. Планировщик складывает цену чтения страниц и обработки строк: `seq_page_cost` = 1.0, `random_page_cost` = 4.0, `cpu_tuple_cost` = 0.01, `cpu_index_tuple_cost` = 0.005, `cpu_operator_cost` = 0.0025. Это не миллисекунды, а относительные единицы.' },
          { t: 'sql', text: `EXPLAIN
SELECT * FROM employees WHERE salary > 90000;

-- В выводе у каждого узла:
--   cost=0.00..1.20  — стартовая и полная стоимость
--   rows=16          — ожидаемое число строк
--   width=...        — средняя ширина строки в байтах` },
          { t: 'table', headers: ['Параметр', 'По умолчанию', 'Смысл'], rows: [['seq_page_cost', '1.0', 'Стоимость последовательного чтения страницы'], ['random_page_cost', '4.0', 'Стоимость случайного чтения; для SSD занижают до 1.1–1.5'], ['cpu_tuple_cost', '0.01', 'Обработка одной строки в heap'], ['cpu_index_tuple_cost', '0.005', 'Обработка одной записи индекса'], ['effective_cache_size', '4GB', 'Подсказка планировщику, сколько данных вероятно в кэше ОС']] },
          { t: 'p', text: '`rows` берётся из статистики (`pg_statistic`, просмотр `pg_stats`): гистограммы, список частых значений, `n_distinct`, корреляция. `width` влияет на выбор Hash Join и на стоимость передачи строк между узлами.' },
          { t: 'note', text: 'Не сравнивайте абсолютные `cost` у разных запросов и не используйте их как прогноз времени. Сравнивайте **варианты одного запроса** при одинаковых настройках.', kind: 'warn' },
        ],
      },
      {
        id: 'planner-scans',
        title: 'Seq Scan, Index Scan, Bitmap, Index Only Scan',
        blocks: [
          { t: 'p', text: 'Выбор способа доступа — компромисс между последовательным чтением и точечными обращениями. Index Scan выгоден, когда нужна малая доля строк; Bitmap Heap Scan — когда строк много, но они разбросаны по страницам; Index Only Scan возможен, если все нужные колонки есть в индексе и страницы помечены как видимые в visibility map.' },
          { t: 'sql', text: `-- Принудительно смотрим индексный путь на маленькой таблице
SET enable_seqscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 1;
RESET enable_seqscan;

-- Index Scan: случайные чтения heap по каждой найденной строке` },
          { t: 'sql', text: `-- Средняя селективность: Bitmap Index Scan + Bitmap Heap Scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products
WHERE category = 'electronics' OR price < 100;

-- BitmapOr собирает страницы обоих условий в одну битовую карту` },
          { t: 'sql', text: `-- Покрывающий индекс: все колонки запроса присутствуют в индексе
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
VACUUM orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, order_date
FROM orders
WHERE customer_id = 1;

-- Index Only Scan; смотрите Heap Fetches — если он большой,
-- visibility map устарел и индексного чтения фактически нет` },
          { t: 'table', headers: ['Способ', 'Сильные стороны', 'Слабые стороны'], rows: [['Seq Scan', 'Последовательное I/O, дешёвый старт', 'Читает всю таблицу'], ['Index Scan', 'Точечный доступ, готовый порядок', 'Много random I/O при большой выборке'], ['Bitmap Heap Scan', 'Пакетное чтение, меньше random I/O', 'Нагрузка на память, теряет порядок'], ['Index Only Scan', 'Не читает heap', 'Требует visibility map и все колонки в индексе']] },
          { t: 'note', text: 'Корреляция `correlation` в `pg_stats` близка к 1 или -1, если физический порядок строк совпадает с индексом. В этом случае индексный доступ дешевле, и `random_page_cost` можно снижать для SSD.', kind: 'tip' },
        ],
      },
      {
        id: 'planner-joins',
        title: 'Nested Loop, Hash Join, Merge Join',
        blocks: [
          { t: 'p', text: 'Nested Loop выгоден при маленьком внешнем наборе и индексе на внутренней стороне: сложность примерно `внешние строки × стоимость поиска`. Hash Join строит хеш-таблицу по меньшей стороне и подходит для больших наборов с равенством. Merge Join требует отсортированных входов и удобен, когда сортировка уже есть или даёт индекс.' },
          { t: 'sql', text: `EXPLAIN (COSTS OFF)
SELECT c.name, o.id, o.total
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE c.country = 'Germany';

-- Hash Join
--   Hash Cond: (o.customer_id = c.id)
--   ->  Seq Scan on orders o
--   ->  Hash
--         ->  Seq Scan on customers c
--               Filter: (country = 'Germany')` },
          { t: 'sql', text: `-- Top-N на группу: внешний цикл по клиентам, внутренний — индексный поиск
EXPLAIN (COSTS OFF)
SELECT c.name, last_order.total
FROM customers c
CROSS JOIN LATERAL (
  SELECT o.total
  FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY o.order_date DESC
  LIMIT 1
) AS last_order;

-- Nested Loop
--   ->  Seq Scan on customers c
--   ->  Limit
--         ->  Index Scan using idx_orders_customer on orders o` },
          { t: 'table', headers: ['Алгоритм', 'Условие', 'Риск'], rows: [['Nested Loop', 'Мало внешних строк, индекс на внутренней стороне', 'Взрывная сложность при недооценке внешнего набора'], ['Hash Join', 'Равенство, большие наборы', 'Переполнение `work_mem`, узел уходит на диск (Batches > 1)'], ['Merge Join', 'Отсортированные входы, неравенства и равенства', 'Явные сортировки, если порядок не обеспечен индексом']] },
          { t: 'note', text: 'В `EXPLAIN ANALYZE` у Hash Join смотрите `Batches`: больше 1 означает сброс на диск и рост времени. `Memory Usage` показывает, сколько ушло в `work_mem`.', kind: 'warn' },
        ],
      },
      {
        id: 'planner-stats-parallel',
        title: 'Параллельные планы и статистика',
        blocks: [
          { t: 'p', text: 'Параллельный план появляется, когда таблица достаточно велика (`min_parallel_table_scan_size`, по умолчанию 8MB), а `parallel_setup_cost` и `parallel_tuple_cost` окупаются. Узлы `Gather` и `Gather Merge` собирают вывод воркеров; число воркеров ограничено `max_parallel_workers_per_gather`.' },
          { t: 'sql', text: `-- Демонстрация: снимаем пороги, чтобы увидеть Gather на учебных данных
SET parallel_setup_cost = 0;
SET min_parallel_table_scan_size = 0;
EXPLAIN (COSTS OFF) SELECT count(*) FROM order_items;
RESET parallel_setup_cost;
RESET min_parallel_table_scan_size;

-- Finalize Aggregate
--   ->  Gather
--         Workers Planned: 2
--         ->  Partial Aggregate` },
          { t: 'sql', text: `-- Обновляем статистику и добавляем расширенную статистику по корреляции
ANALYZE employees;

CREATE STATISTICS st_emp_dept_salary (dependencies, ndistinct)
ON department_id, salary FROM employees;

ANALYZE employees;` },
          { t: 'p', text: 'Оценки `rows` врут по нескольким причинам: статистика устарела, предикаты коррелированы (город и страна), значения распределены неравномерно, функция непрозрачна для планировщика (`rows=1000` по умолчанию для set-returning функций), а generic plan переиспользует оценку, не учитывая конкретные параметры.' },
          { t: 'list', items: ['`default_statistics_target` (100) — детализация гистограмм и MCV', '`work_mem` — память на **один** узел сортировки или хеширования, не на запрос', '`random_page_cost` — подстройка под SSD/RAID', '`effective_cache_size` — подсказка о размере кэша ОС', '`plan_cache_mode` — `auto`, `force_custom_plan`, `force_generic_plan`', '`pg_stat_statements` — какие запросы реально тратят время'] },
          { t: 'note', text: 'Для диагностики используйте `EXPLAIN (ANALYZE, BUFFERS, SETTINGS, VERBOSE)`: `BUFFERS` показывает чтение и попадания в кэш, `SETTINGS` — какие параметры отличаются от значений по умолчанию.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'advanced-indexes',
    title: 'Продвинутые индексы',
    icon: '🗂️',
    level: 'senior',
    dataset: 'shop',
    intro: 'Выбираем метод доступа под тип данных и оператор, строим выражения, частичные и покрывающие индексы. Разбираемся с bloat, обслуживанием и индексами, которые только замедляют запись.',
    sections: [
      {
        id: 'idx-types',
        title: 'B-tree, Hash, GiST, SP-GiST, GIN, BRIN',
        blocks: [
          { t: 'p', text: 'Индекс — это отдельная структура с собственным методом доступа и классом операторов. B-tree по умолчанию годится для сравнений и сортировки; GIN — для массивов, jsonb и полнотекстового поиска; BRIN хранит только диапазоны страниц и дешёв для огромных монотонных таблиц.' },
          { t: 'table', headers: ['Метод', 'Для чего', 'Пример'], rows: [['B-tree', '`=`, `<`, `>`, `BETWEEN`, сортировка', '`CREATE INDEX ON orders (order_date)`'], ['Hash', 'Только `=`, крупные значения', '`CREATE INDEX ON customers USING hash (email)`'], ['GiST', 'Геометрия, диапазоны, `EXCLUDE`', '`CREATE INDEX ON bookings USING gist (during)`'], ['SP-GiST', 'Разреженные иерархические данные: точки, префиксы', '`text` с префиксным поиском'], ['GIN', 'Множества значений: массивы, jsonb, tsvector', '`CREATE INDEX ON products USING gin (tags)`'], ['BRIN', 'Огромные таблицы с физической корреляцией', '`CREATE INDEX ON orders USING brin (order_date)`']] },
          { t: 'sql', text: `CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_employees_meta ON employees USING GIN (meta jsonb_path_ops);
CREATE INDEX idx_orders_date_brin ON orders USING BRIN (order_date)
  WITH (pages_per_range = 32);` },
          { t: 'p', text: 'Класс операторов задаёт, какие предикаты умеет ускорять индекс. Для `jsonb` это `jsonb_ops` (все операторы, большой индекс) или `jsonb_path_ops` (только `@>`, компактнее). Для текста — `text_pattern_ops` для префиксного `LIKE` или `gin_trgm_ops` для подстрок.' },
          { t: 'note', text: 'Индекс не используется, если оператор не входит в класс операторов по умолчанию. Проверяйте `EXPLAIN` и `pg_indexes`, а не только наличие индекса по колонке.', kind: 'tip' },
        ],
      },
      {
        id: 'idx-operators',
        title: 'Операторы @>, ?, &&, ~ и когда они работают',
        blocks: [
          { t: 'p', text: 'Для массивов и jsonb важнее не тип колонки, а оператор в запросе. `@>` — вложение, `?` — наличие ключа или элемента, `&&` — пересечение, `~` — регулярное выражение. Каждый из них должен поддерживаться методом доступа.' },
          { t: 'sql', text: `-- Массив: содержит все перечисленные элементы
SELECT name FROM products WHERE tags @> ARRAY['office', 'furniture'];

-- Массив: пересекается хотя бы одним элементом
SELECT name FROM products WHERE tags && ARRAY['premium', 'keyboard'];

-- Массив: есть элемент 'sql'
SELECT name FROM employees WHERE skills ? 'sql';

-- jsonb: содержит пару ключ-значение
SELECT name FROM employees WHERE meta @> '{"active": true}';

-- jsonb: ключ существует
SELECT name FROM employees WHERE meta ? 'level';` },
          { t: 'table', headers: ['Оператор', 'Тип', 'Индекс'], rows: [['`@>`', 'массив, jsonb', 'GIN'], ['`?`', 'массив, jsonb, hstore', 'GIN'], ['`&&`', 'массив, диапазоны', 'GIN, GiST'], ['`~`, `~*`', 'text', 'GIN/GiST с `pg_trgm`'], ['`@>` для `tsvector`', 'полнотекстовый', 'GIN']] },
          { t: 'sql', text: `-- Подстрочный поиск: обычный B-tree бесполезен
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

SELECT name FROM products WHERE name ILIKE '%mouse%';` },
          { t: 'note', text: '`LIKE` с ведущим `%` не может использовать B-tree: нет левого префикса. Нужен триграммный индекс (`pg_trgm`) или полнотекстовый поиск.', kind: 'warn' },
        ],
      },
      {
        id: 'idx-expression-partial',
        title: 'Индексы по выражению, частичные и покрывающие',
        blocks: [
          { t: 'p', text: 'Индекс по выражению хранит вычисленное значение и работает, если запрос содержит **то же самое** выражение. Частичный индекс покрывает только подмножество строк и экономит место, когда запросы всегда фильтруют по одному статусу. `INCLUDE` добавляет колонки в листья индекса, не увеличивая ключ поиска.' },
          { t: 'sql', text: `-- Регистронезависимая уникальность email
CREATE UNIQUE INDEX uq_employees_email_lower ON employees (lower(email));

SELECT id, name FROM employees WHERE lower(email) = 'alice@corp.io';

-- Частичный индекс: только активные заказы
CREATE INDEX idx_orders_new_customer
  ON orders (customer_id)
  WHERE status = 'new';

-- Покрывающий индекс: ключ customer_id, в листьях — total и order_date
CREATE INDEX idx_orders_covering
  ON orders (customer_id) INCLUDE (total, order_date);` },
          { t: 'sql', text: `-- Индекс под сортировку и фильтр: порядок колонок важен
CREATE INDEX idx_orders_customer_date_desc
  ON orders (customer_id, order_date DESC);

SELECT id, total
FROM orders
WHERE customer_id = 1
ORDER BY order_date DESC
LIMIT 5;` },
          { t: 'p', text: 'Планировщик применяет частичный индекс, только если может доказать, что предикат запроса подразумевает предикат индекса. Запрос `WHERE status = \'new\'` подходит, а `WHERE status <> \'delivered\'` — нет, даже если фактически строки те же.' },
          { t: 'note', text: 'Дублирующие индексы — частая причина деградации записи. Индекс `(a)` избыточен при наличии `(a, b)`: он покрывается левым префиксом. Проверяйте `pg_stat_user_indexes.idx_scan` и размеры.', kind: 'warn' },
        ],
      },
      {
        id: 'idx-maintenance',
        title: 'Bloat, REINDEX и неиспользуемые индексы',
        blocks: [
          { t: 'p', text: 'Индексы B-tree со временем разбухают: удалённые и обновлённые версии строк оставляют пустые страницы. `fillfactor` ниже 100 оставляет место для HOT-обновлений, но увеличивает размер. Bloat лечится `REINDEX` (в том числе `CONCURRENTLY`) или перестройкой через `pg_repack`.' },
          { t: 'sql', text: `-- Индексы без единого сканирования с момента сброса статистики
SELECT schemaname, relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;` },
          { t: 'sql', text: `-- Перестройка без блокировки записи (вне транзакции)
REINDEX INDEX CONCURRENTLY idx_orders_customer;

-- Перестройка всей таблицы со всеми индексами
REINDEX TABLE CONCURRENTLY orders;` },
          { t: 'p', text: 'Статистика `idx_scan` обнуляется при сбросе статистики и после перезапуска, поэтому выводы делайте по длительному интервалу. Индекс может быть нужен для редкого, но критичного отчёта — удалять его только по счётчику рискованно.' },
          { t: 'note', text: '`REINDEX CONCURRENTLY` нельзя выполнять внутри транзакции, он требует временного места и создаёт новый индекс, а старый удаляет после завершения. При сбое остаётся невалидный индекс — проверяйте `pg_index.indisvalid`.', kind: 'warn' },
          { t: 'list', items: ['`pg_stat_user_indexes` — сканирования и размер', '`pg_index` — `indisvalid`, `indisready`, `indisunique`', '`pgstattuple` — физический размер и доля мёртвых кортежей', '`pg_repack` — онлайн-перестройка таблиц и индексов', '`fillfactor = 90` для часто обновляемых таблиц'] },
        ],
      },
      {
        id: 'idx-design',
        title: 'Проектирование: селективность и порядок колонок',
        blocks: [
          { t: 'p', text: 'Начинайте с самых селективных равенств, затем добавляйте диапазоны и сортировку. Для составного индекса работает правило левого префикса: `(status, order_date)` ускорит запрос по `status`, но не запрос только по `order_date`.' },
          { t: 'sql', text: `-- Фильтр по статусу + сортировка по дате: индекс закрывает оба шага
CREATE INDEX idx_orders_status_date
  ON orders (status, order_date DESC);

EXPLAIN (COSTS OFF)
SELECT id, total
FROM orders
WHERE status = 'delivered'
ORDER BY order_date DESC
LIMIT 10;` },
          { t: 'p', text: 'Каждый индекс — это дополнительная запись в WAL и поддержка при `INSERT`/`UPDATE`/`DELETE`. Десять индексов на таблицу могут замедлить вставку в разы. Индексируйте под конкретные запросы, а не «на всякий случай».' },
          { t: 'table', headers: ['Вопрос', 'Инструмент'], rows: [['Индекс используется?', '`EXPLAIN (ANALYZE, BUFFERS)`'], ['Сколько раз сканировался?', '`pg_stat_user_indexes.idx_scan`'], ['Не дублируется ли?', 'Сравнение колонок и префиксов'], ['Насколько раздут?', '`pgstattuple`, оценка bloat'], ['Не мешает ли записи?', '`pg_stat_user_tables.n_tup_upd`, замеры']] },
          { t: 'note', text: 'Индекс по низкоселективной колонке (например, `vip boolean`) почти бесполезен в одиночку, но может быть полезен в составном индексе или как частичный `WHERE vip` для редкой выборки.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'mvcc',
    title: 'MVCC, VACUUM и bloat',
    icon: '♻️',
    level: 'senior',
    dataset: 'shop',
    intro: 'Разбираем многоверсионность изнутри: версии строк, снимки, мёртвые кортежи и очистку. Учимся измерять bloat, настраивать autovacuum и не доводить базу до wraparound.',
    sections: [
      {
        id: 'mvcc-tuples',
        title: 'Версии строк: xmin, xmax и снимок',
        blocks: [
          { t: 'p', text: 'PostgreSQL не обновляет строку на месте: `UPDATE` создаёт новую версию кортежа, а старую помечает удалённой. В заголовке кортежа есть `xmin` (транзакция, создавшая версию) и `xmax` (транзакция, удалившая или заменившая её). `ctid` указывает физическое расположение версии.' },
          { t: 'sql', text: `SELECT ctid, xmin, xmax, id, name
FROM employees
ORDER BY id
LIMIT 5;` },
          { t: 'sql', text: `-- Снимок видимости текущей транзакции
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT pg_current_snapshot();
SELECT count(*) FROM employees;
COMMIT;` },
          { t: 'p', text: 'Снимок содержит `xmin`, `xmax` и список активных транзакций `xip`. Строка видима, если её `xmin` зафиксирован до снимка и не входит в `xip`, а `xmax` либо отсутствует, либо не виден снимку. В `READ COMMITTED` снимок берётся на каждый оператор, в `REPEATABLE READ` — один на транзакцию.' },
          { t: 'note', text: 'Долгая транзакция удерживает старый снимок, и VACUUM не может удалить версии, которые ещё могут быть видимы. Это главная причина bloat в OLTP-базах.', kind: 'warn' },
        ],
      },
      {
        id: 'mvcc-vacuum',
        title: 'VACUUM и autovacuum',
        blocks: [
          { t: 'p', text: '`VACUUM` проходит по таблице, помечает пространство мёртвых кортежей как переиспользуемое, обновляет карту свободного пространства и visibility map, при необходимости замораживает старые транзакции. Файл таблицы он **не уменьшает** — освободившееся место достанется будущим версиям.' },
          { t: 'sql', text: `VACUUM (VERBOSE, ANALYZE) employees;

-- VERBOSE покажет число удалённых и оставшихся мёртвых кортежей,
-- а также сколько страниц заморожено` },
          { t: 'table', headers: ['Параметр', 'По умолчанию', 'Смысл'], rows: [['autovacuum', 'on', 'Глобальный выключатель'], ['autovacuum_naptime', '1min', 'Период проверки таблиц'], ['autovacuum_vacuum_threshold', '50', 'Минимум мёртвых кортежей'], ['autovacuum_vacuum_scale_factor', '0.2', 'Доля таблицы сверх порога'], ['autovacuum_analyze_threshold', '50', 'Порог для ANALYZE'], ['autovacuum_analyze_scale_factor', '0.1', 'Доля для ANALYZE'], ['autovacuum_max_workers', '3', 'Число процессов очистки']] },
          { t: 'p', text: 'Autovacuum запускается, когда `n_dead_tup > threshold + scale_factor × reltuples`. Для больших таблиц доля 0.2 означает миллионы мёртвых строк — часто её снижают до 0.01–0.05 на уровне таблицы через `ALTER TABLE ... SET (autovacuum_vacuum_scale_factor = 0.02)`. Стоимость очистки регулируют `autovacuum_vacuum_cost_delay` и `autovacuum_vacuum_cost_limit`.' },
          { t: 'sql', text: `ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);` },
          { t: 'note', text: 'VACUUM берёт `SHARE UPDATE EXCLUSIVE`, не блокируя чтение и запись, но конфликтует с другими VACUUM, `CREATE INDEX CONCURRENTLY` и некоторыми ALTER TABLE. `VACUUM FULL` берёт `ACCESS EXCLUSIVE` и переписывает таблицу.', kind: 'warn' },
        ],
      },
      {
        id: 'mvcc-bloat',
        title: 'Измерение bloat и VACUUM FULL',
        blocks: [
          { t: 'p', text: 'Bloat — это свободное место внутри страниц и пустые страницы, которые VACUUM не вернул ОС. Он растёт от частых обновлений, долгих транзакций и отключённого autovacuum. Сначала смотрите на счётчики, затем на физический размер через расширение `pgstattuple`.' },
          { t: 'sql', text: `SELECT relname, n_live_tup, n_dead_tup,
       last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;` },
          { t: 'sql', text: `CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT table_len, tuple_count, dead_tuple_count,
       round(dead_tuple_percent::numeric, 2) AS dead_pct,
       free_percent
FROM pgstattuple('orders');` },
          { t: 'p', text: '`VACUUM FULL` переписывает таблицу в новый файл, возвращает место ОС, но требует `ACCESS EXCLUSIVE` и примерно вдвое больше диска. Для онлайн-системы предпочтительнее `pg_repack`, который работает через триггер и короткие блокировки. Альтернатива — партиционирование и удаление старых партиций вместо массового `DELETE`.' },
          { t: 'sql', text: `-- Тяжёлая операция: блокирует таблицу на всё время перезаписи
VACUUM FULL orders;

-- После перестройки обязательно обновить статистику
ANALYZE orders;` },
          { t: 'note', text: 'Массовый `DELETE` старых строк не уменьшает файл, а лишь создаёт мёртвые кортежи. Для retention используйте партиции: `DROP TABLE` старой партиции освобождает место мгновенно.', kind: 'tip' },
        ],
      },
      {
        id: 'mvcc-freeze',
        title: 'Заморозка транзакций и wraparound',
        blocks: [
          { t: 'p', text: 'Номер транзакции — 32-битное значение, которое циклически переиспользуется. Чтобы старые версии строк не стали «будущими», VACUUM замораживает их: `xmin` заменяется специальным значением `FrozenXID`. Возраст базы считается от `relfrozenxid` и не должен приближаться к пределу.' },
          { t: 'sql', text: `SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;

SELECT relname, age(relfrozenxid) AS table_age
FROM pg_class
WHERE relkind = 'r'
ORDER BY table_age DESC
LIMIT 10;` },
          { t: 'table', headers: ['Параметр', 'По умолчанию', 'Роль'], rows: [['autovacuum_freeze_max_age', '200000000', 'Порог принудительной заморозки'], ['vacuum_freeze_table_age', '150000000', 'Когда VACUUM сканирует всю таблицу'], ['vacuum_freeze_min_age', '50000000', 'Минимальный возраст для заморозки'], ['vacuum_multixact_freeze_max_age', '400000000', 'Аналогично для multixact']] },
          { t: 'p', text: 'При приближении возраста к 2 млрд PostgreSQL включает аварийный режим и может остановить приём транзакций. Это не теоретическая угроза: отключённый autovacuum на большой таблице приводит к отказу кластера. Следите за `age(datfrozenxid)` и настраивайте пороги до того, как сработает аварийный autovacuum.' },
          { t: 'note', text: 'Аварийный autovacuum для заморозки игнорирует `autovacuum_vacuum_cost_delay` и может серьёзно нагрузить I/O. Лучше предотвращать, чем лечить: мониторинг возраста и регулярный VACUUM.', kind: 'warn' },
        ],
      },
      {
        id: 'mvcc-toast',
        title: 'TOAST: большие значения вне строки',
        blocks: [
          { t: 'p', text: 'Строка heap-страницы не может занимать больше ~8KB. Значения длиннее ~2KB сжимаются и при необходимости выносятся в отдельную TOAST-таблицу, а в основной строке остаётся указатель. Это касается `text`, `bytea`, `jsonb`, массивов и других переменных типов.' },
          { t: 'sql', text: `SELECT c.relname AS main_table,
       t.relname AS toast_table,
       pg_size_pretty(pg_total_relation_size(t.oid)) AS toast_size
FROM pg_class c
JOIN pg_class t ON t.oid = c.reltoastrelid
WHERE c.relname IN ('employees', 'products');` },
          { t: 'sql', text: `-- Стратегия хранения колонки
ALTER TABLE employees ALTER COLUMN meta SET STORAGE EXTERNAL;
ALTER TABLE employees ALTER COLUMN meta SET STORAGE EXTENDED;

SELECT attname, attstorage
FROM pg_attribute
WHERE attrelid = 'employees'::regclass AND attnum > 0;` },
          { t: 'p', text: 'Режимы хранения: `PLAIN` (без сжатия и выноса), `EXTENDED` (сжатие и вынос, по умолчанию), `EXTERNAL` (вынос без сжатия — быстрее доступ), `MAIN` (сжатие, вынос в последнюю очередь). `EXTERNAL` полезен для больших jsonb, которые часто читаются целиком.' },
          { t: 'note', text: 'Обращение к TOAST-колонке требует дополнительного чтения. Запрос `SELECT *` по таблице с большими jsonb читает и их; выбирайте только нужные поля и используйте операторы `->`/`->>`, чтобы не тянуть весь документ.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'locking',
    title: 'Блокировки и конкурентность',
    icon: '🔐',
    level: 'senior',
    dataset: 'shop',
    intro: 'Понимаем, какие блокировки берёт каждая операция, как читать pg_locks и почему транзакции попадают в deadlock. Учимся строить очереди на SKIP LOCKED и использовать advisory locks.',
    sections: [
      {
        id: 'lock-table-levels',
        title: 'Уровни блокировок таблиц',
        blocks: [
          { t: 'p', text: 'PostgreSQL комбинирует табличные и строчные блокировки. Обычный `SELECT` берёт `ACCESS SHARE`, `INSERT`/`UPDATE`/`DELETE` — `ROW EXCLUSIVE`, `VACUUM` — `SHARE UPDATE EXCLUSIVE`, а большинство `ALTER TABLE` — `ACCESS EXCLUSIVE`. Конфликт уровней определяет, кто кого ждёт.' },
          { t: 'table', headers: ['Режим', 'Кто берёт', 'Конфликтует с'], rows: [['ACCESS SHARE', 'SELECT', 'ACCESS EXCLUSIVE'], ['ROW SHARE', 'SELECT FOR UPDATE/SHARE', 'EXCLUSIVE, ACCESS EXCLUSIVE'], ['ROW EXCLUSIVE', 'INSERT, UPDATE, DELETE', 'SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE'], ['SHARE UPDATE EXCLUSIVE', 'VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY', 'SHARE UPDATE EXCLUSIVE и выше'], ['SHARE', 'CREATE INDEX без CONCURRENTLY', 'ROW EXCLUSIVE и выше'], ['ACCESS EXCLUSIVE', 'ALTER TABLE, DROP TABLE, TRUNCATE, LOCK TABLE', 'Все режимы']] },
          { t: 'sql', text: `-- Явная блокировка на время транзакции
BEGIN;
LOCK TABLE orders IN ACCESS EXCLUSIVE MODE;
-- ... обслуживание ...
COMMIT;

-- Проверка текущих блокировок
SELECT locktype, relation::regclass, mode, granted, pid
FROM pg_locks
WHERE relation = 'orders'::regclass;` },
          { t: 'p', text: '`ALTER TABLE ADD COLUMN` с константным значением по умолчанию в PG11+ не переписывает таблицу, но всё равно берёт `ACCESS EXCLUSIVE` на короткое время. Поэтому DDL в проде выполняют с `lock_timeout`, чтобы не выстроить очередь запросов за одной блокировкой.' },
          { t: 'note', text: 'Очередь блокировок несправедлива к новым запросам: если `ACCESS EXCLUSIVE` ждёт, последующие `SELECT` тоже встают за ним, даже если могли бы работать параллельно. Короткий `lock_timeout` спасает от лавины.', kind: 'warn' },
        ],
      },
      {
        id: 'lock-rows',
        title: 'Строчные блокировки и SKIP LOCKED',
        blocks: [
          { t: 'p', text: 'Строчные блокировки не блокируют читателей: они лишь мешают другим транзакциям менять ту же строку. Режимы: `FOR UPDATE` (сильнейший), `FOR NO KEY UPDATE` (не блокирует проверку внешних ключей), `FOR SHARE`, `FOR KEY SHARE` (слабейший, для ссылок FK).' },
          { t: 'sql', text: `BEGIN;
SELECT id, status, total
FROM orders
WHERE id = 1
FOR UPDATE;

UPDATE orders SET status = 'processing' WHERE id = 1;
COMMIT;` },
          { t: 'table', headers: ['Режим', 'Блокирует', 'Типичное применение'], rows: [['FOR UPDATE', 'UPDATE, DELETE, все FOR-режимы', 'Захват заказа на обработку'], ['FOR NO KEY UPDATE', 'UPDATE без изменения ключа', 'Обновление полей сущности'], ['FOR SHARE', 'UPDATE, DELETE', 'Совместное чтение с гарантией неизменности'], ['FOR KEY SHARE', 'Только изменение ключа', 'Проверка FK на ссылающуюся строку']] },
          { t: 'sql', text: `-- Очередь задач: каждый воркер забирает свою строку, не ожидая других
WITH next_task AS (
  SELECT id
  FROM orders
  WHERE status = 'new'
  ORDER BY order_date
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE orders o
SET status = 'processing'
FROM next_task t
WHERE o.id = t.id
RETURNING o.id, o.customer_id, o.total;` },
          { t: 'p', text: '`SKIP LOCKED` пропускает уже заблокированные строки, поэтому несколько воркеров могут разбирать очередь параллельно. `NOWAIT` вместо пропуска возвращает ошибку немедленно — полезно, когда лучше упасть, чем ждать.' },
          { t: 'note', text: '`FOR UPDATE` захватывает и строки, не прошедшие финальный фильтр, если они попали в скан. Поэтому важны индексы и точные условия: лишние захваты снижают параллелизм.', kind: 'tip' },
        ],
      },
      {
        id: 'lock-deadlock',
        title: 'Deadlock: причины и разбор',
        blocks: [
          { t: 'p', text: 'Deadlock возникает, когда две транзакции ждут ресурсы друг друга по кругу. PostgreSQL обнаруживает цикл через `deadlock_timeout` (по умолчанию 1s) и аварийно завершает одну транзакцию с ошибкой `deadlock detected`. Приложение должно уметь повторить её.' },
          { t: 'sql', text: `-- Сессия 1
BEGIN;
UPDATE orders SET total = total + 1 WHERE id = 1;

-- Сессия 2
BEGIN;
UPDATE orders SET total = total + 1 WHERE id = 2;

-- Сессия 1
UPDATE orders SET total = total + 1 WHERE id = 2;  -- ждёт сессию 2

-- Сессия 2
UPDATE orders SET total = total + 1 WHERE id = 1;  -- deadlock` },
          { t: 'sql', text: `-- Кто кого блокирует
SELECT pid, pg_blocking_pids(pid) AS blockers,
       state, wait_event_type, wait_event,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Невыданные блокировки
SELECT pid, locktype, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted
ORDER BY pid;` },
          { t: 'p', text: 'Профилактика: обращайтесь к строкам и таблицам в одном порядке, сокращайте транзакции, не смешивайте пользовательские паузы с открытой транзакцией, используйте `lock_timeout` и `statement_timeout`. В логе включайте `log_lock_waits = on` и `log_min_duration_statement`, чтобы видеть источник.' },
          { t: 'note', text: 'Deadlock — не ошибка базы, а сигнал о неудачном порядке доступа. Повтор транзакции целиком — корректная стратегия, но только если операции идемпотентны или защищены ключами идемпотентности.', kind: 'warn' },
        ],
      },
      {
        id: 'lock-advisory',
        title: 'Advisory locks',
        blocks: [
          { t: 'p', text: 'Advisory locks — блокировки на произвольные числа, не связанные со строками. Они живут в сессии или до конца транзакции и удобны для координации фоновых задач: миграций, cron-джобов, обработки одной сущности. Ключ задаётся одним `bigint` или парой `int`.' },
          { t: 'sql', text: `-- Неблокирующий захват: сразу видно, свободен ли ресурс
SELECT pg_try_advisory_lock(42);

-- Блокирующий захват на уровне сессии
SELECT pg_advisory_lock(42);

-- Освобождение
SELECT pg_advisory_unlock(42);

-- Вариант на уровне транзакции: снимется автоматически при COMMIT/ROLLBACK
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nightly-report'));
UPDATE orders SET status = 'archived' WHERE order_date < '2023-01-01';
COMMIT;` },
          { t: 'p', text: 'Для составных ключей используйте форму с двумя `int` и `hashtext` для каждого ключа. Функция `hashtext` даёт 32-битный хеш; коллизии возможны, но для координации задач обычно приемлемы.' },
          { t: 'p', text: 'Advisory-блокировки не участвуют в MVCC и не видны в обычных бизнес-запросах. Они не защищают данные от прямых `UPDATE` — это именно координационный примитив, а не замена транзакционным блокировкам.' },
          { t: 'note', text: 'Сессионные advisory-блокировки опасны с пулом соединений: `pg_advisory_unlock` может не выполниться, и блокировка останется висеть на переиспользуемом соединении. В пуле предпочитайте `pg_advisory_xact_lock`.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'partitioning',
    title: 'Партиционирование',
    icon: '🧱',
    level: 'senior',
    dataset: 'shop',
    intro: 'Проектируем секционированные таблицы под время, регион и хеш. Разбираем pruning, индексы на партициях, ограничения уникальности и рутину обслуживания.',
    sections: [
      {
        id: 'part-strategies',
        title: 'RANGE, LIST и HASH',
        blocks: [
          { t: 'p', text: 'Декларативное партиционирование появилось в PostgreSQL 10: родительская таблица хранит только определение, данные лежат в партициях. Ключ секционирования определяет стратегию: диапазон времени, список значений или хеш для равномерного распределения.' },
          { t: 'sql', text: `-- RANGE: типичный сценарий для заказов по дате
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY,
  customer_id int NOT NULL,
  order_date date NOT NULL,
  status text NOT NULL,
  total numeric(12,2) NOT NULL,
  PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');` },
          { t: 'sql', text: `-- LIST по стране и HASH по customer_id
CREATE TABLE customers (
  id int NOT NULL,
  name text NOT NULL,
  country text NOT NULL,
  PRIMARY KEY (id, country)
) PARTITION BY LIST (country);

CREATE TABLE customers_de PARTITION OF customers FOR VALUES IN ('Germany');
CREATE TABLE customers_other PARTITION OF customers DEFAULT;

CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  customer_id int NOT NULL,
  payload jsonb
) PARTITION BY HASH (customer_id);

CREATE TABLE events_p0 PARTITION OF events
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_p1 PARTITION OF events
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);` },
          { t: 'table', headers: ['Стратегия', 'Когда выбирать', 'Ограничение'], rows: [['RANGE', 'Время, версии, диапазоны', 'Нужно заранее создавать партиции'], ['LIST', 'Регион, статус, категория', 'Риск перекоса при неравных значениях'], ['HASH', 'Равномерное распределение без естественного ключа', 'Не помогает pruning по диапазону']] },
          { t: 'note', text: '`DEFAULT`-партиция ловит все строки, не попавшие в другие. Она удобна как страховка, но мешает созданию новой партиции: PostgreSQL должен просканировать default, чтобы убедиться, что там нет подходящих строк.', kind: 'warn' },
        ],
      },
      {
        id: 'part-pruning',
        title: 'Partition pruning',
        blocks: [
          { t: 'p', text: 'Pruning — отсечение партиций, которые не могут содержать подходящие строки. Статический pruning работает на этапе планирования при константах, динамический — при выполнении, когда условие зависит от параметра. В `EXPLAIN` вы увидите только нужные партиции.' },
          { t: 'sql', text: `EXPLAIN (COSTS OFF)
SELECT * FROM orders
WHERE order_date >= '2025-01-01'
  AND order_date < '2025-04-01';

-- Append
--   ->  Seq Scan on orders_2025
--         Filter: ((order_date >= '2025-01-01') AND (order_date < '2025-04-01'))` },
          { t: 'p', text: 'С prepared statements и generic plan pruning может ухудшиться: план строится без конкретного значения параметра. `plan_cache_mode = force_custom_plan` заставляет планировать каждый вызов с реальными параметрами, что возвращает точное отсечение ценой планирования.' },
          { t: 'sql', text: `SET plan_cache_mode = force_custom_plan;

PREPARE orders_since(date) AS
SELECT * FROM orders WHERE order_date >= $1;

EXECUTE orders_since('2025-06-01');` },
          { t: 'list', items: ['Сравнивайте ключ партиционирования с константой или параметром напрямую', 'Не применяйте функции к ключу: `order_date::text` ломает pruning', 'Избегайте `OR` с несвязанными условиями', 'Проверяйте план через `EXPLAIN (ANALYZE)` на реальных параметрах', 'Следите за `Subplans Removed` в плане'] },
          { t: 'note', text: 'Pruning не уменьшает время, если запрос всё равно читает все партиции: он лишь убирает лишние. Для ускорения нужен индекс **внутри** партиции или более узкий диапазон.', kind: 'info' },
        ],
      },
      {
        id: 'part-indexes-constraints',
        title: 'Индексы, PK и ограничения',
        blocks: [
          { t: 'p', text: 'Индекс, созданный на родительской таблице, автоматически создаётся на каждой партиции (PG11+). Уникальные ограничения и первичный ключ должны включать все колонки ключа партиционирования — глобального уникального индекса по одной колонке через все партиции нет.' },
          { t: 'sql', text: `-- Индекс на родителе создаст дочерние индексы на всех партициях
CREATE INDEX idx_orders_customer ON orders (customer_id);

-- Уникальность возможна только с ключом партиционирования
ALTER TABLE orders
  ADD CONSTRAINT orders_id_date_key UNIQUE (id, order_date);` },
          { t: 'p', text: 'Внешние ключи **из** партиционированной таблицы поддерживаются с PG12. Ограничения-исключения (`EXCLUDE`) на партиционированных таблицах не поддерживаются. `CHECK`-ограничения на родителе наследуются партициями и помогают pruning.' },
          { t: 'table', headers: ['Ограничение', 'Поддержка', 'Обходной путь'], rows: [['PRIMARY KEY по (id, дата)', 'Да', 'Включать ключ партиции'], ['UNIQUE по одной колонке', 'Нет глобально', 'Уникальность на уровне приложения или отдельная таблица'], ['FOREIGN KEY с партиционированной таблицы', 'Да, PG12+', '—'], ['EXCLUDE', 'Нет', 'Триггеры или отдельная таблица'], ['Индекс на родителе', 'Да, PG11+', 'Автоматически на партициях']] },
          { t: 'note', text: 'Если создаёте индекс на родителе, он заблокирует все партиции. Для большой системы создавайте индексы на каждой партиции отдельно с `CONCURRENTLY`, а затем привязывайте их через `ALTER INDEX ... ATTACH PARTITION`.', kind: 'tip' },
        ],
      },
      {
        id: 'part-maintenance',
        title: 'Создание, отсоединение и удаление партиций',
        blocks: [
          { t: 'p', text: 'Партиции по времени создают заранее — например, за месяц до наступления периода. Старые данные удаляют через `DETACH PARTITION` и `DROP TABLE`, а не массовым `DELETE`: это мгновенно освобождает место и не создаёт bloat.' },
          { t: 'sql', text: `-- Новая партиция на будущий год
CREATE TABLE orders_2026 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Отсоединение без длительной блокировки (PG14+)
ALTER TABLE orders DETACH PARTITION orders_2024 CONCURRENTLY;

-- Теперь это обычная таблица: удаляем или архивируем
DROP TABLE orders_2024;

-- Присоединение заранее подготовленной таблицы
CREATE TABLE orders_2027 (
  id bigint GENERATED ALWAYS AS IDENTITY,
  customer_id int NOT NULL,
  order_date date NOT NULL,
  status text NOT NULL,
  total numeric(12,2) NOT NULL,
  PRIMARY KEY (id, order_date)
);

ALTER TABLE orders ATTACH PARTITION orders_2027
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');` },
          { t: 'p', text: '`ATTACH PARTITION` в PG12+ не берёт `ACCESS EXCLUSIVE` на родителя, но требует совпадения структуры, типов и ограничений. Перед присоединением полезно добавить `CHECK`-ограничение на диапазон и `VALIDATE` его — тогда проверка при ATTACH будет быстрее.' },
          { t: 'list', items: ['Автоматизируйте создание партиций (cron, `pg_partman`)', 'Держите запас на 1–3 периода вперёд', 'Удаляйте старые партиции через DETACH + DROP', 'Проверяйте, что default-партиция пуста', 'Следите за числом партиций: сотни ухудшают планирование', 'После массовых изменений запускайте `ANALYZE` партиций'] },
          { t: 'note', text: 'Слишком много партиций (тысячи) увеличивает время планирования и потребление памяти каталогом. Практический ориентир — десятки-сотни активных партиций, а не десятки тысяч.', kind: 'warn' },
        ],
      },
    ],
  },

  {
    id: 'fts',
    title: 'Полнотекстовый поиск',
    icon: '🔎',
    level: 'senior',
    dataset: 'shop',
    intro: 'Строим поиск по смыслу, а не по подстроке: векторы, запросы, ранжирование, GIN-индексы и словари. Дополняем триграммами для опечаток и префиксов.',
    sections: [
      {
        id: 'fts-vector-query',
        title: 'tsvector, tsquery и оператор @@',
        blocks: [
          { t: 'p', text: '`tsvector` — нормализованный документ: набор лексем с позициями. `tsquery` — логическое выражение из лексем с операторами `&`, `|`, `!` и фразовым `<->`. Совпадение проверяется оператором `@@`. Приведение к лексемам убирает стоп-слова и применяет стемминг.' },
          { t: 'sql', text: `SELECT to_tsvector('english', 'PostgreSQL is a powerful relational database') AS vector;

SELECT name
FROM products
WHERE to_tsvector('english', name || ' ' || category)
      @@ to_tsquery('english', 'wireless & mouse');` },
          { t: 'sql', text: `-- Человекопонятные формы запроса
SELECT plainto_tsquery('english', 'wireless mouse');       -- wireless & mouse
SELECT phraseto_tsquery('english', 'wireless mouse');      -- wireless <-> mouse
SELECT websearch_to_tsquery('english', 'laptop -gaming');  -- laptop & !gaming
SELECT to_tsquery('russian', 'база & данных');` },
          { t: 'p', text: '`plainto_tsquery` склеивает слова через `&`, `phraseto_tsquery` требует соседства, `websearch_to_tsquery` понимает синтаксис поисковика: кавычки, минус, `or`. Для пользовательского ввода почти всегда нужен `websearch_to_tsquery`, а не сырой `to_tsquery`, который падает на спецсимволах.' },
          { t: 'note', text: 'Лексемы зависят от конфигурации языка. `to_tsvector` с конфигурацией `russian` и с конфигурацией `english` дадут разные результаты для одного текста — конфигурация должна совпадать в индексе и в запросе.', kind: 'info' },
        ],
      },
      {
        id: 'fts-rank-headline',
        title: 'Ранжирование и подсветка',
        blocks: [
          { t: 'p', text: '`ts_rank` учитывает частоту лексем и их веса; `ts_rank_cd` дополнительно учитывает плотность покрытия. Веса задаются `setweight` буквами A–D: например, название товара важнее описания. Результат — float, по нему сортируют выдачу.' },
          { t: 'sql', text: `SELECT p.name,
       ts_rank(to_tsvector('english', p.name), q) AS rank
FROM products p,
     to_tsquery('english', 'mouse | keyboard') AS q
WHERE to_tsvector('english', p.name) @@ q
ORDER BY rank DESC;` },
          { t: 'sql', text: `SELECT ts_headline(
  'english',
  'Wireless Mouse with USB receiver and silent buttons',
  to_tsquery('english', 'mouse'),
  'StartSel=<b>, StopSel=</b>, MaxFragments=2'
) AS snippet;` },
          { t: 'p', text: 'Для взвешенного документа используйте `setweight`: название получает вес `A`, описание — вес `B`, векторы объединяются оператором `||`. При ранжировании передайте те же веса через `ts_rank(weights, vector, query)`, иначе веса не повлияют на порядок.' },
          { t: 'note', text: '`ts_headline` работает по исходному тексту и довольно дорог. Не применяйте его ко всем строкам выборки — сначала отфильтруйте и ограничьте `LIMIT`, затем считайте сниппеты.', kind: 'tip' },
        ],
      },
      {
        id: 'fts-index',
        title: 'GIN-индекс и хранение вектора',
        blocks: [
          { t: 'p', text: 'GIN — стандартный индекс для `tsvector`. Он хранит лексемы и списки строк, поэтому быстро отвечает на `@@`, но дороже при записи. Вектор можно вычислять на лету (индекс по выражению) или хранить в generated-колонке (PG12+) — второе обычно быстрее.' },
          { t: 'sql', text: `ALTER TABLE products
  ADD COLUMN search tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || category)
  ) STORED;

CREATE INDEX idx_products_search ON products USING GIN (search);

SELECT name
FROM products
WHERE search @@ websearch_to_tsquery('english', 'wireless mouse');` },
          { t: 'p', text: 'Generated-колонка требует immutable-выражения. `to_tsvector(regconfig, text)` immutable, если конфигурация задана константой. При смене словаря или добавлении весов из нескольких колонок чаще используют триггер, который обновляет `search` в `BEFORE INSERT OR UPDATE`.' },
          { t: 'sql', text: `-- Триггерный вариант, когда нужны веса по колонкам
CREATE OR REPLACE FUNCTION products_search_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_search
BEFORE INSERT OR UPDATE OF name, category ON products
FOR EACH ROW EXECUTE FUNCTION products_search_refresh();` },
          { t: 'note', text: 'GIN поддерживает `fastupdate`: новые записи копятся в pending list и вливаются пакетно. Это ускоряет запись, но замедляет часть чтений. Размер pending list ограничен `gin_pending_list_limit`; при массовой загрузке помогает `VACUUM`.', kind: 'warn' },
        ],
      },
      {
        id: 'fts-languages-trgm',
        title: 'Языки, словари, префиксы и триграммы',
        blocks: [
          { t: 'p', text: 'Конфигурация поиска состоит из парсера, словарей и стеммера. Для русского доступен `russian` со snowball-стеммером, но без полноценной морфологии: формы слова сводятся к основе, а не к лемме. Свои словари создаются через `CREATE TEXT SEARCH DICTIONARY`.' },
          { t: 'sql', text: `SELECT to_tsvector('russian', 'Быстрая доставка заказов');
-- 'быстр':1 'доставк':2 'заказ':3

-- Префиксный поиск: лексема с двоеточием и звёздочкой
SELECT name FROM products
WHERE search @@ to_tsquery('english', 'wire:*');

-- Проверка словарей конфигурации
SELECT * FROM pg_ts_config WHERE cfgname = 'russian';` },
          { t: 'sql', text: `-- Триграммы: опечатки, подстроки, ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT similarity('Wireless Mouse', 'wireles mouse');  -- 0.8...
SELECT name FROM products WHERE name % 'wireles mouse';

CREATE INDEX idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);` },
          { t: 'table', headers: ['Задача', 'Инструмент'], rows: [['Поиск по словам с морфологией', '`tsvector` + GIN'], ['Фразы и близость', '`phraseto_tsquery`, `<->`'], ['Опечатки и подстроки', '`pg_trgm` + GIN/GiST'], ['Префиксный ввод', '`to_tsquery(\'word:*\')` или trgm'], ['Поиск без учёта диакритики', '`unaccent` + словарь']] },
          { t: 'note', text: 'Расширение `unaccent` помогает игнорировать диакритику, но его нельзя использовать в immutable generated-колонке напрямую: функция не immutable. Оборачивайте в собственную immutable-функцию с фиксированным словарём.', kind: 'info' },
        ],
      },
    ],
  },
  {
    id: 'plpgsql',
    title: 'PL/pgSQL, функции и триггеры',
    icon: '🧑‍💻',
    level: 'senior',
    dataset: 'company',
    intro: 'Пишем серверный код, который не ломает планировщик и транзакции: функции, процедуры, триггеры и правила. Разбираем volatility, безопасность и отладку.',
    sections: [
      {
        id: 'plpgsql-basics',
        title: 'Функции, переменные и управление потоком',
        blocks: [
          { t: 'p', text: 'Функция PL/pgSQL состоит из секций `DECLARE`, `BEGIN`, `EXCEPTION` (необязательно) и `END`. Переменные объявляются с типом или через `%TYPE`/`%ROWTYPE`, что защищает код от изменения схемы. `SELECT ... INTO` присваивает результат и выставляет `FOUND`.' },
          { t: 'sql', text: `CREATE OR REPLACE FUNCTION employee_bonus(
  p_employee_id int,
  p_rate numeric DEFAULT 0.1
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_salary employees.salary%TYPE;
BEGIN
  SELECT salary INTO v_salary
  FROM employees
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee % not found', p_employee_id
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN round(v_salary * p_rate, 2);
END;
$$;` },
          { t: 'sql', text: `DO $$
DECLARE
  r record;
  v_total numeric := 0;
BEGIN
  FOR r IN SELECT id, name, budget FROM departments ORDER BY id LOOP
    v_total := v_total + coalesce(r.budget, 0);
    RAISE NOTICE 'Department %: %', r.id, r.name;
  END LOOP;

  RAISE NOTICE 'Total budget: %', v_total;
END;
$$;` },
          { t: 'p', text: 'Управление потоком: `IF/ELSIF/ELSE`, `CASE`, циклы `LOOP`, `WHILE`, `FOR`, а также `FOREACH` для массивов. Для выхода используйте `EXIT`, для пропуска итерации — `CONTINUE`. Вложенные блоки могут иметь собственный `EXCEPTION`, который перехватывает ошибки и позволяет залогировать их.' },
          { t: 'table', headers: ['Атрибут', 'Смысл', 'Осторожность'], rows: [['IMMUTABLE', 'Результат зависит только от аргументов', 'Нельзя читать таблицы'], ['STABLE', 'Результат постоянен в пределах запроса', 'Можно читать таблицы'], ['VOLATILE', 'Может меняться при каждом вызове', 'По умолчанию; мешает оптимизациям'], ['STRICT', 'NULL-аргумент даёт NULL без вызова', 'Меняет семантику'], ['SECURITY DEFINER', 'Выполняется с правами владельца', 'Обязательно фиксируйте `search_path`']] },
          { t: 'note', text: 'Функция `VOLATILE` вызывается на каждую строку и не сворачивается планировщиком. Если функция только читает данные, помечайте её `STABLE` — это включает оптимизации и индексы по выражению.', kind: 'tip' },
        ],
      },
      {
        id: 'plpgsql-table-funcs',
        title: 'RETURNS TABLE, OUT и RETURN QUERY',
        blocks: [
          { t: 'p', text: 'Функция может возвращать набор строк через `RETURNS TABLE`, `RETURNS SETOF` или выходные параметры `OUT`. Внутри используйте `RETURN QUERY` для статического запроса и `RETURN QUERY EXECUTE` для динамического. Это удобная замена представлениям с параметрами.' },
          { t: 'sql', text: `CREATE OR REPLACE FUNCTION department_stats(p_min_salary numeric DEFAULT 0)
RETURNS TABLE (
  department text,
  headcount bigint,
  avg_salary numeric
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT d.name,
         count(*)::bigint,
         round(avg(e.salary), 2)
  FROM departments d
  JOIN employees e ON e.department_id = d.id
  WHERE e.salary >= p_min_salary
  GROUP BY d.name
  ORDER BY 3 DESC;
END;
$$;

SELECT * FROM department_stats(90000);` },
          { t: 'sql', text: `-- Вариант с OUT-параметрами
CREATE OR REPLACE FUNCTION department_headcount(
  p_department_id int,
  OUT department text,
  OUT headcount bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  SELECT d.name, count(e.id)
  INTO department, headcount
  FROM departments d
  LEFT JOIN employees e ON e.department_id = d.id
  WHERE d.id = p_department_id
  GROUP BY d.name;
END;
$$;` },
          { t: 'p', text: 'Планировщик по умолчанию считает, что табличная функция вернёт 1000 строк. Если реально строк больше или меньше, оценка ломает планы соединений. Указывайте `ROWS` в определении и, при необходимости, `COST`.' },
          { t: 'sql', text: `CREATE OR REPLACE FUNCTION recent_orders(p_days int)
RETURNS SETOF orders
LANGUAGE sql
STABLE
ROWS 50
AS $$
  SELECT * FROM orders
  WHERE order_date >= current_date - p_days;
$$;` },
          { t: 'note', text: 'Функция `RETURNS SETOF` может быть встроена в запрос как таблица: `SELECT * FROM recent_orders(30)`. Для больших наборов это лучше, чем возвращать массив: строки не материализуются целиком.', kind: 'info' },
        ],
      },
      {
        id: 'plpgsql-procedures',
        title: 'Процедуры и управление транзакциями',
        blocks: [
          { t: 'p', text: 'Процедура (`CREATE PROCEDURE`) вызывается через `CALL` и, в отличие от функции, может управлять транзакциями: `COMMIT` и `ROLLBACK` внутри неё допустимы, если вызов не находится в явном транзакционном блоке. Это удобно для пакетных задач и миграций.' },
          { t: 'sql', text: `CREATE OR REPLACE PROCEDURE close_stale_orders(p_days int DEFAULT 30)
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows bigint;
BEGIN
  UPDATE orders
  SET status = 'cancelled'
  WHERE status = 'new'
    AND order_date < current_date - p_days;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  COMMIT;

  RAISE NOTICE 'Closed % orders', v_rows;
END;
$$;

CALL close_stale_orders(30);` },
          { t: 'p', text: 'Внутри функции `COMMIT` запрещён: функция всегда выполняется в транзакции вызывающего. Процедура позволяет разбить длинную операцию на батчи и коммитить каждый, снижая размер WAL и длину блокировок, но лишает возможности откатить всё целиком.' },
          { t: 'sql', text: `-- Батчевая обработка: коммит каждые 1000 строк
CREATE OR REPLACE PROCEDURE normalize_customer_cities()
LANGUAGE plpgsql
AS $$
DECLARE
  v_ids int[];
BEGIN
  LOOP
    SELECT array_agg(id) INTO v_ids
    FROM (
      SELECT id
      FROM customers
      WHERE city <> initcap(city)
      LIMIT 1000
    ) batch;

    EXIT WHEN v_ids IS NULL;

    UPDATE customers
    SET city = initcap(city)
    WHERE id = ANY(v_ids);

    COMMIT;
  END LOOP;
END;
$$;` },
          { t: 'note', text: '`CALL` внутри `BEGIN ... COMMIT` с явной транзакцией не даст процедуре коммитить: PostgreSQL вернёт ошибку `invalid transaction termination`. Вызывайте процедуру на верхнем уровне.', kind: 'warn' },
        ],
      },
      {
        id: 'plpgsql-triggers',
        title: 'Триггеры: BEFORE, AFTER, NEW и OLD',
        blocks: [
          { t: 'p', text: 'Триггерная функция возвращает `trigger` и получает записи `NEW` (новая строка) и `OLD` (старая). `BEFORE ROW` может изменить `NEW` до записи, `AFTER ROW` видит уже применённые изменения и подходит для аудита. `FOR EACH STATEMENT` срабатывает один раз на оператор.' },
          { t: 'sql', text: `CREATE TABLE employee_audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id int,
  operation text NOT NULL,
  old_salary numeric,
  new_salary numeric,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text NOT NULL DEFAULT current_user
);

CREATE OR REPLACE FUNCTION log_salary_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.salary IS DISTINCT FROM OLD.salary THEN
    INSERT INTO employee_audit (employee_id, operation, old_salary, new_salary)
    VALUES (NEW.id, TG_OP, OLD.salary, NEW.salary);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_salary_audit
AFTER UPDATE OF salary ON employees
FOR EACH ROW
EXECUTE FUNCTION log_salary_change();` },
          { t: 'table', headers: ['Тип', 'Когда', 'Доступно'], rows: [['BEFORE ROW', 'До записи строки', 'Можно менять NEW'], ['AFTER ROW', 'После записи', 'NEW и OLD, но менять поздно'], ['BEFORE STATEMENT', 'До оператора', 'Без NEW/OLD'], ['AFTER STATEMENT', 'После оператора', 'Transition tables (PG10+)'], ['INSTEAD OF', 'Вместо операции над view', 'NEW/OLD для view']] },
          { t: 'p', text: 'Триггеры невидимы в запросе и усложняют отладку: каскадные изменения, рекурсия и скрытые побочные эффекты. Для аудита и валидации это оправдано, для бизнес-логики — часто нет. Держите триггеры короткими и не выполняйте в них тяжёлые запросы.' },
          { t: 'note', text: '`AFTER`-триггер выполняется в той же транзакции, поэтому ошибка в нём откатывает и основную операцию. Это гарантия целостности, но и риск: сбой аудита заблокирует обновление зарплаты.', kind: 'warn' },
        ],
      },
      {
        id: 'plpgsql-rules',
        title: 'Правила (RULES) и их место',
        blocks: [
          { t: 'p', text: 'Правило переписывает запрос до планирования: `CREATE RULE ... DO INSTEAD` подменяет операцию другой. Исторически так делали обновляемые представления, но сейчас для этого чаще используют `INSTEAD OF`-триггеры, которые проще и предсказуемее.' },
          { t: 'sql', text: `CREATE VIEW active_employees AS
SELECT id, name, salary
FROM employees
WHERE meta @> '{"active": true}';

CREATE RULE active_employees_update AS
ON UPDATE TO active_employees
DO INSTEAD
  UPDATE employees
  SET salary = NEW.salary
  WHERE id = OLD.id;` },
          { t: 'p', text: 'Правила мощнее, чем кажется: одно правило может породить несколько операторов, а `RETURNING` ведёт себя неочевидно. Они не срабатывают на `TRUNCATE` и плохо сочетаются с `ON CONFLICT`. Для сложной логики DML выбирайте триггеры.' },
          { t: 'table', headers: ['Критерий', 'RULE', 'TRIGGER'], rows: [['Момент', 'Переписывание запроса', 'Выполнение во время DML'], ['Гранулярность', 'Оператор', 'Строка или оператор'], ['Видимость', 'Меняет план', 'Отдельный вызов'], ['Отладка', 'Сложная', 'Проще'], ['Типичное применение', 'Массовые переписывания', 'Аудит, валидация']] },
          { t: 'note', text: 'Правило `DO ALSO` добавляет оператор, `DO INSTEAD` заменяет исходный. Если правило не сработало, проверьте, не перекрыто ли оно более специфичным и не отключено ли `ALTER TABLE ... DISABLE RULE`.', kind: 'info' },
        ],
      },
    ],
  },

  {
    id: 'security',
    title: 'Безопасность и RLS',
    icon: '🛡️',
    level: 'senior',
    dataset: 'shop',
    intro: 'Строим least-privilege доступ: роли, привилегии, Row-Level Security и защита от SQL-инъекций. Отдельно — SECURITY DEFINER и аудит.',
    sections: [
      {
        id: 'sec-roles',
        title: 'Роли, группы и наследование',
        blocks: [
          { t: 'p', text: 'Роль в PostgreSQL — это и пользователь, и группа. `LOGIN` разрешает подключение, `NOLOGIN` делает роль группой. По умолчанию роли наследуют привилегии членства (`INHERIT`); `NOINHERIT` требует явного `SET ROLE`.' },
          { t: 'sql', text: `CREATE ROLE app_reader NOLOGIN;
CREATE ROLE app_writer NOLOGIN;
GRANT app_reader TO app_writer;

CREATE ROLE app LOGIN PASSWORD 'change-me' IN ROLE app_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;
GRANT INSERT, UPDATE, DELETE ON orders, order_items TO app_writer;` },
          { t: 'sql', text: `-- Проверка и переключение роли
SELECT current_user, session_user;

SET ROLE app_writer;
SELECT current_user;
RESET ROLE;` },
          { t: 'p', text: 'Приложение не должно подключаться суперпользователем: ошибка в коде или инъекция получают полный контроль. Отдельные роли для миграций, чтения, записи и аналитики упрощают аудит и позволяют точечно отзывать доступ.' },
          { t: 'table', headers: ['Атрибут', 'Назначение', 'Риск'], rows: [['SUPERUSER', 'Обход всех проверок', 'Максимальный'], ['CREATEDB', 'Создание баз', 'Средний'], ['CREATEROLE', 'Управление ролями', 'Высокий'], ['REPLICATION', 'Репликация', 'Высокий'], ['BYPASSRLS', 'Обход RLS', 'Высокий'], ['LOGIN', 'Подключение', 'Базовый']] },
          { t: 'note', text: 'Членство в роли с `BYPASSRLS` или `SUPERUSER` наследуется. Проверяйте `pg_auth_members` и `pg_roles.rolbypassrls`, а не только прямые гранты.', kind: 'warn' },
        ],
      },
      {
        id: 'sec-privileges',
        title: 'GRANT, REVOKE и привилегии по умолчанию',
        blocks: [
          { t: 'p', text: 'Доступ к таблице требует привилегии на схему (`USAGE`) и на объект (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`). Последовательности требуют `USAGE` для `nextval` и `SELECT` для `currval`.' },
          { t: 'sql', text: `REVOKE ALL ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_writer;

-- Будущие объекты: привилегии по умолчанию
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_reader;` },
          { t: 'sql', text: `-- Колоночные привилегии: аналитик видит не всё
GRANT SELECT (id, name, city, country) ON customers TO analyst;
REVOKE SELECT (email) ON customers FROM analyst;` },
          { t: 'p', text: '`ALTER DEFAULT PRIVILEGES` действует на объекты, создаваемые **указанной ролью** в указанной схеме. Если миграции выполняет другая роль, привилегии по умолчанию нужно задать и для неё (`FOR ROLE migrations`).' },
          { t: 'note', text: 'С PostgreSQL 15 схема `public` больше не даёт `CREATE` всем по умолчанию, но `USAGE` для `PUBLIC` сохраняется. Явно отзывайте лишнее и фиксируйте `search_path` в функциях.', kind: 'tip' },
        ],
      },
      {
        id: 'sec-rls',
        title: 'Row-Level Security',
        blocks: [
          { t: 'p', text: 'RLS ограничивает строки, видимые роли, на уровне таблицы. Включается `ENABLE ROW LEVEL SECURITY`, политики задаются через `CREATE POLICY` с выражениями `USING` (что видно) и `WITH CHECK` (что можно записать). Без политик при включённом RLS по умолчанию не видно ничего.' },
          { t: 'sql', text: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  FOR ALL
  TO app
  USING (
    customer_id = nullif(current_setting('app.customer_id', true), '')::int
  )
  WITH CHECK (
    customer_id = nullif(current_setting('app.customer_id', true), '')::int
  );` },
          { t: 'p', text: 'Приложение устанавливает контекст на транзакцию: `SET LOCAL app.customer_id = 42`. `SET LOCAL` откатывается вместе с транзакцией, поэтому не протекает между запросами в пуле соединений. Значение читается через `current_setting(..., true)`, чтобы отсутствие настройки не давало ошибку.' },
          { t: 'sql', text: `BEGIN;
SET LOCAL app.customer_id = 42;
SELECT id, total FROM orders;
COMMIT;

-- Владелец таблицы обходит RLS, пока не включён FORCE
ALTER TABLE orders FORCE ROW LEVEL SECURITY;` },
          { t: 'p', text: 'Политики комбинируются: для нескольких `PERMISSIVE` действует `OR`, для `RESTRICTIVE` — `AND`. Это позволяет задать общий tenant-фильтр и отдельные разрешения. RLS не защищает от `SECURITY DEFINER`-функций, написанных без учёта контекста.' },
          { t: 'note', text: 'Суперпользователь и роли с `BYPASSRLS` всегда обходят политики; владелец таблицы — тоже, если не выполнен `FORCE`. Проверяйте это в тестах, иначе изоляция окажется мнимой.', kind: 'warn' },
        ],
      },
      {
        id: 'sec-injection',
        title: 'SQL-инъекции и SECURITY DEFINER',
        blocks: [
          { t: 'p', text: 'Инъекция возникает, когда пользовательский ввод склеивается с SQL. Защита — параметризация: драйвер передаёт значения отдельно от текста запроса, и они никогда не становятся частью синтаксиса. Конкатенация строк с `WHERE id = ` + input недопустима.' },
          { t: 'sql', text: `-- Правильно: параметр передаёт драйвер
PREPARE find_customer(int) AS
SELECT id, name FROM customers WHERE id = $1;

EXECUTE find_customer(42);

-- Идентификаторы нельзя параметризовать: их проверяют и экранируют
SELECT format('SELECT count(*) FROM %I WHERE %I = $1', 'orders', 'customer_id');` },
          { t: 'p', text: 'Для динамического SQL используйте `format` с `%I` (идентификатор) и `%L` (литерал), а значения передавайте через `USING`. Функции `quote_ident` и `quote_literal` делают то же, но `format` читается лучше и меньше подвержен ошибкам.' },
          { t: 'sql', text: `CREATE OR REPLACE FUNCTION count_rows(p_table regclass)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_count bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s', p_table) INTO v_count;
  RETURN v_count;
END;
$$;` },
          { t: 'list', items: ['Никогда не склеивайте ввод с SQL-текстом', 'Для значений — параметры `$1`, `$2` или `USING`', 'Для идентификаторов — `%I` после проверки по белому списку', '`SECURITY DEFINER` всегда с `SET search_path`', 'Не давайте `CREATE` на схему `public` роли приложения', 'Ограничивайте права роли, даже если код кажется безопасным'] },
          { t: 'note', text: '`SECURITY DEFINER`-функция выполняется с правами владельца, поэтому ошибка в `search_path` позволяет подменить таблицу или оператор. Фиксируйте схему явно и не создавайте такие функции без необходимости.', kind: 'warn' },
        ],
      },
      {
        id: 'sec-audit-crypto',
        title: 'pgcrypto, шифрование и аудит',
        blocks: [
          { t: 'p', text: 'Пароли храните только как медленные хеши: `crypt` с солью от `gen_salt` и алгоритмом `bf` (bcrypt) или `scram-sha-256` на уровне ролей. Обратимое шифрование (`pgp_sym_encrypt`) нужно для секретов, которые надо вернуть в исходном виде, и ключ должен жить вне базы.' },
          { t: 'sql', text: `CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT crypt('secret', gen_salt('bf', 12)) AS password_hash;

SELECT crypt('secret', password_hash) = password_hash AS ok
FROM app_users WHERE login = 'alice';

SELECT gen_random_uuid();` },
          { t: 'sql', text: `-- Обратимое шифрование: ключ приходит из KMS, не хранится в таблице
CREATE TABLE payment_cards (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  card_enc bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO payment_cards (customer_id, card_enc)
VALUES (1, pgp_sym_encrypt('4111 1111 1111 1111', 'key-from-kms'));` },
          { t: 'p', text: 'Аудит строится на append-only таблице: отдельная схема, запрет `UPDATE`/`DELETE` для приложения, запись через триггер или `pgaudit`. Храните `current_user`, `session_user`, `inet_client_addr()`, время и идентификатор операции.' },
          { t: 'sql', text: `CREATE SCHEMA audit;

CREATE TABLE audit.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  db_user text NOT NULL DEFAULT session_user,
  client_addr inet DEFAULT inet_client_addr(),
  table_name text NOT NULL,
  operation text NOT NULL,
  row_pk text,
  details jsonb
);

REVOKE ALL ON audit.events FROM PUBLIC;
GRANT INSERT ON audit.events TO app;` },
          { t: 'note', text: 'Аудит без защиты бесполезен: приложение не должно иметь права менять или удалять записи аудита. Отдельная роль, отдельная схема и, при возможности, выгрузка в внешнее хранилище.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'monitoring',
    title: 'Мониторинг и оптимизация',
    icon: '📈',
    level: 'senior',
    dataset: 'shop',
    intro: 'Смотрим на базу глазами эксплуатации: активные сессии, pg_stat_statements, логи, метрики и память. Находим узкие места до того, как они станут инцидентом.',
    sections: [
      {
        id: 'mon-activity',
        title: 'pg_stat_activity: кто и что делает',
        blocks: [
          { t: 'p', text: '`pg_stat_activity` показывает по строке на backend: пользователя, базу, состояние, текущий запрос, время начала транзакции и ожидание. Поле `wait_event_type`/`wait_event` отделяет ожидание блокировки (`Lock`), I/O (`IO`) и клиента (`Client`) от реальной работы.' },
          { t: 'sql', text: `SELECT pid, usename, state,
       wait_event_type, wait_event,
       now() - xact_start AS xact_age,
       now() - query_start AS query_age,
       left(query, 80) AS query
FROM pg_stat_activity
WHERE backend_type = 'client backend'
  AND state <> 'idle'
ORDER BY query_age DESC;` },
          { t: 'sql', text: `-- Аккуратно: terminate рвёт соединение и откатывает транзакцию
SELECT pg_cancel_backend(12345);      -- мягко, только текущий запрос
SELECT pg_terminate_backend(12345, 5000);  -- жёстко, с таймаутом` },
          { t: 'p', text: 'Состояние `idle in transaction` опасно: транзакция держит снимок и блокировки, мешая VACUUM. Долгий `active` без ожиданий — это CPU-bound запрос. Массовые `Lock`-ожидания указывают на DDL, длинную транзакцию или неудачный порядок обновлений.' },
          { t: 'note', text: 'Установите `idle_in_transaction_session_timeout` и `statement_timeout` на уровне роли или базы. Это не лечит причину, но ограничивает ущерб от забытых транзакций.', kind: 'warn' },
        ],
      },
      {
        id: 'mon-pgss',
        title: 'pg_stat_statements',
        blocks: [
          { t: 'p', text: '`pg_stat_statements` агрегирует запросы по `queryid`, нормализуя константы. Это основной инструмент поиска «кто съедает время»: суммарное время, число вызовов, среднее время, прочитанные блоки, временные файлы и WAL. Требует `shared_preload_libraries` и установки расширения.' },
          { t: 'sql', text: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT queryid,
       calls,
       round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows,
       round((100 * total_exec_time
              / sum(total_exec_time) OVER ())::numeric, 1) AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;` },
          { t: 'sql', text: `-- Запросы с временными файлами: не хватает work_mem
SELECT queryid, calls, temp_blks_written,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       left(query, 100) AS query
FROM pg_stat_statements
WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC
LIMIT 10;` },
          { t: 'list', items: ['`calls` — число выполнений; редкий, но тяжёлый запрос виден по `mean_exec_time`', '`shared_blks_hit`/`shared_blks_read` — эффективность кэша', '`temp_blks_written` — сортировки и хеши ушли на диск', '`wal_bytes` — объём записи, важно для репликации', '`planning_time` — дорогое планирование при большом числе партиций', '`queryid` стабилен в пределах мажорной версии, но может меняться'] },
          { t: 'note', text: 'Статистика сбрасывается при перезапуске и по `pg_stat_statements_reset()`. Сравнивайте срезы за одинаковые интервалы, а не абсолютные значения с момента старта.', kind: 'info' },
        ],
      },
      {
        id: 'mon-logs',
        title: 'Логи, auto_explain и медленные запросы',
        blocks: [
          { t: 'p', text: 'Основной сигнал — `log_min_duration_statement`: запросы дольше порога попадают в лог. Дополнительно включайте `log_lock_waits`, `log_temp_files`, `log_checkpoints` и `log_autovacuum_min_duration`. Префикс `log_line_prefix` должен содержать время, PID, пользователя и базу.' },
          { t: 'sql', text: `ALTER SYSTEM SET log_min_duration_statement = '500ms';
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_temp_files = 0;
ALTER SYSTEM SET log_line_prefix = '%m [%p] %u@%d ';
SELECT pg_reload_conf();` },
          { t: 'sql', text: `-- auto_explain: план медленного запроса прямо в логе
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '1s';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
SET auto_explain.log_nested_statements = on;` },
          { t: 'table', headers: ['Параметр', 'Что логирует', 'Когда включать'], rows: [['log_min_duration_statement', 'Запросы дольше порога', 'Всегда, порог 200–1000ms'], ['log_lock_waits', 'Ожидание блокировок дольше deadlock_timeout', 'При подозрении на конкуренцию'], ['log_temp_files', 'Создание временных файлов', 'При нехватке work_mem'], ['log_checkpoints', 'Длительность и объём чекпоинтов', 'При всплесках I/O'], ['log_autovacuum_min_duration', 'Долгие autovacuum', 'При проблемах с bloat']] },
          { t: 'note', text: 'Не включайте `log_statement = all` на постоянной основе в нагруженной системе: объём логов и I/O вырастут, а полезность ниже, чем у порога длительности. Для отладки — только на короткое время.', kind: 'warn' },
        ],
      },
      {
        id: 'mon-instance',
        title: 'Метрики экземпляра и баз',
        blocks: [
          { t: 'p', text: '`pg_stat_database` даёт представление о нагрузке на базу: коммиты, откаты, чтение и попадания в кэш, временные файлы, deadlocks. Само по себе число `blks_hit` бесполезно — важна доля попаданий и её динамика.' },
          { t: 'sql', text: `SELECT datname,
       xact_commit, xact_rollback,
       blks_read, blks_hit,
       round(100 * blks_hit::numeric
             / nullif(blks_hit + blks_read, 0), 2) AS cache_hit_pct,
       temp_files,
       pg_size_pretty(temp_bytes) AS temp_size,
       deadlocks
FROM pg_stat_database
WHERE datname = current_database();` },
          { t: 'sql', text: `SELECT relname, seq_scan, idx_scan,
       n_tup_ins, n_tup_upd, n_tup_del,
       n_dead_tup, n_live_tup
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 10;` },
          { t: 'p', text: 'Дополнительно смотрите `pg_stat_bgwriter` и `pg_stat_checkpointer` (PG17+): сколько страниц сбрасывается чекпоинтами и background writer, не упирается ли система в запись. Расширения `pg_stat_kcache` и `pg_wait_sampling` добавляют профиль CPU/I/O и гистограммы ожиданий.' },
          { t: 'note', text: 'Счётчики накапливаются с момента старта или сброса и обнуляются при восстановлении. Стройте графики скоростей (в секунду), иначе после рестарта метрики будут выглядеть как деградация.', kind: 'info' },
        ],
      },
      {
        id: 'mon-tuning',
        title: 'Память и ключевые настройки',
        blocks: [
          { t: 'p', text: '`shared_buffers` — кэш страниц самой СУБД, обычно 25% RAM. `effective_cache_size` — подсказка планировщику о суммарном кэше (ОС + СУБД), часто 50–75% RAM. `work_mem` выделяется на **каждый** узел сортировки или хеширования в запросе и на каждое соединение.' },
          { t: 'table', headers: ['Параметр', 'Ориентир', 'Комментарий'], rows: [['shared_buffers', '25% RAM', 'Не более 8–16GB на практике'], ['effective_cache_size', '50–75% RAM', 'Только оценка, память не резервируется'], ['work_mem', '4–64MB', 'Умножайте на соединения и узлы'], ['maintenance_work_mem', '5–10% RAM, до 2GB', 'VACUUM, CREATE INDEX'], ['max_wal_size', '4–16GB', 'Реже чекпоинты, больше WAL'], ['checkpoint_timeout', '15–30min', 'Баланс между I/O и временем восстановления']] },
          { t: 'sql', text: `SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'work_mem', 'maintenance_work_mem',
  'effective_cache_size', 'max_wal_size', 'checkpoint_timeout'
)
ORDER BY name;` },
          { t: 'p', text: 'Опасно поднимать `work_mem` глобально: 100 соединений × 3 узла × 64MB — это уже 19GB. Правильнее задавать его на уровне конкретной роли или транзакции для тяжёлых отчётов: `SET LOCAL work_mem` со значением `256MB`.' },
          { t: 'note', text: 'Настройки памяти не заменяют индексы и хорошие запросы. Сначала устраните Seq Scan по большим таблицам и лишние сортировки, затем увеличивайте память.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'architecture',
    title: 'Архитектура PostgreSQL: WAL, репликация, бэкапы',
    icon: '🏗️',
    level: 'senior',
    dataset: 'shop',
    intro: 'Смотрим на кластер целиком: страницы и WAL, чекпоинты, физическая и логическая репликация, резервное копирование и пул соединений. Понимаем, из чего складывается отказоустойчивость.',
    sections: [
      {
        id: 'arch-storage',
        title: 'Кластер, базы и страницы',
        blocks: [
          { t: 'p', text: 'Кластер — это один postmaster и один каталог данных. Внутри — базы, схемы и таблицы. Таблица хранится в heap-файлах по 1GB, страница — 8KB, строка состоит из заголовка кортежа (23 байта) и данных. Индексы и TOAST лежат в отдельных файлах.' },
          { t: 'sql', text: `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;

SELECT c.relname,
       pg_size_pretty(pg_relation_size(c.oid)) AS heap_size,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC;` },
          { t: 'p', text: 'У каждой таблицы есть форки: основной heap, `_fsm` (free space map), `_vm` (visibility map) и `_init` (для unlogged). Visibility map критичен для Index Only Scan и VACUUM: страница помечается как полностью видимая только после очистки.' },
          { t: 'p', text: 'PostgreSQL не поддерживает кластерный индекс в смысле InnoDB: строки лежат в порядке вставки. `CLUSTER` однократно переписывает таблицу по индексу, но новые вставки снова ломают порядок. Для контроля порядка используют `fillfactor` и регулярный `CLUSTER`/`pg_repack`.' },
          { t: 'note', text: 'Последовательное чтение большого heap дешевле случайного. Именно поэтому `correlation` в статистике так влияет на выбор индекса, а BRIN эффективен только при физической корреляции.', kind: 'info' },
        ],
      },
      {
        id: 'arch-wal',
        title: 'WAL, LSN и чекпоинты',
        blocks: [
          { t: 'p', text: 'WAL — журнал упреждающей записи: изменения сначала пишутся в журнал, затем грязные страницы сбрасываются на диск. Каждая запись имеет LSN (log sequence number). Чекпоинт фиксирует точку, с которой можно начать восстановление, и инициирует сброс грязных страниц.' },
          { t: 'sql', text: `SELECT pg_current_wal_lsn() AS current_lsn,
       pg_walfile_name(pg_current_wal_lsn()) AS current_segment;

SELECT * FROM pg_control_checkpoint();

CHECKPOINT;` },
          { t: 'table', headers: ['Параметр', 'Значения', 'Влияние'], rows: [['wal_level', 'minimal, replica, logical', 'Объём WAL и доступность логической репликации'], ['synchronous_commit', 'on, remote_apply, local, off', 'Долговечность коммита против задержки'], ['fsync', 'on/off', 'При off возможна порча данных после сбоя'], ['full_page_writes', 'on/off', 'Защита от torn pages ценой объёма WAL'], ['checkpoint_timeout', 'по умолчанию 5min', 'Частота чекпоинтов'], ['max_wal_size', 'по умолчанию 1GB', 'Верхняя граница WAL между чекпоинтами']] },
          { t: 'p', text: '`synchronous_commit = off` ускоряет коммиты, но при сбое теряются последние транзакции (данные остаются согласованными). `fsync = off` недопустим в проде: возможна физическая порча файлов. Для реплики `remote_apply` ждёт применения WAL на standby.' },
          { t: 'note', text: 'Чекпоинты — основная причина периодических всплесков записи. Слишком частые чекпоинты увеличивают I/O, слишком редкие — время восстановления и объём WAL. Смотрите `log_checkpoints` и `pg_stat_checkpointer`.', kind: 'warn' },
        ],
      },
      {
        id: 'arch-replication',
        title: 'Физическая и логическая репликация',
        blocks: [
          { t: 'p', text: 'Физическая репликация передаёт WAL побайтно: standby — точная копия кластера, только для чтения. Логическая репликация передаёт изменения на уровне таблиц через публикации и подписки, допускает разные версии и выборочные объекты, но не реплицирует DDL и последовательности автоматически.' },
          { t: 'sql', text: `-- Слоты репликации и удерживаемый WAL
SELECT slot_name, slot_type, active,
       restart_lsn,
       pg_size_pretty(
         pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
       ) AS retained_wal
FROM pg_replication_slots;` },
          { t: 'sql', text: `-- Логическая репликация: публикация на источнике
CREATE PUBLICATION shop_pub FOR TABLE orders, order_items;

-- Подписка на приёмнике
CREATE SUBSCRIPTION shop_sub
  CONNECTION 'host=replica-db port=5432 dbname=shop'
  PUBLICATION shop_pub;` },
          { t: 'table', headers: ['Критерий', 'Физическая', 'Логическая'], rows: [['Что копируется', 'Весь кластер, WAL', 'Изменения выбранных таблиц'], ['Версии PostgreSQL', 'Желательно одинаковые', 'Могут различаться'], ['DDL', 'Реплицируется', 'Не реплицируется'], ['Standby для чтения', 'Да, hot standby', 'Нет, это обычная база'], ['Слот', 'Physical slot', 'Logical slot']] },
          { t: 'p', text: 'Синхронная репликация задаётся `synchronous_standby_names` и гарантирует, что коммит подтверждён после записи WAL на standby. Асинхронная быстрее, но при failover возможна потеря последних транзакций. `pg_rewind` помогает вернуть старый primary в строй после переключения.' },
          { t: 'note', text: 'Неактивный слот репликации удерживает WAL бесконечно и может заполнить диск. Мониторьте `retained_wal` и удаляйте ненужные слоты через `pg_drop_replication_slot`.', kind: 'warn' },
        ],
      },
      {
        id: 'arch-backup',
        title: 'pg_dump, pg_basebackup и PITR',
        blocks: [
          { t: 'p', text: 'Логический бэкап (`pg_dump`, `pg_dumpall`) создаёт SQL-дамп или архив и допускает выборочное восстановление. Физический (`pg_basebackup`) копирует кластер целиком и вместе с архивным WAL позволяет восстановиться на момент времени (PITR).' },
          { t: 'sql', text: `-- Точка восстановления перед рискованной миграцией
SELECT pg_create_restore_point('before_migration');

-- Настройки архивирования WAL (нужен перезапуск для archive_mode)
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backup/wal/%f';` },
          { t: 'p', text: 'Для PITR на восстанавливаемом стенде задают `restore_command`, `recovery_target_time` и `recovery_target_action`. После восстановления база либо останавливается на целевой точке, либо продолжает работу. Проверять бэкап нужно восстановлением, а не наличием файла.' },
          { t: 'list', items: ['`pg_dump -Fc` — сжатый архив, восстанавливается `pg_restore`', '`pg_dump -j 8` — параллельный дамп больших баз', '`pg_basebackup -X stream` — физическая копия с WAL', '`pg_verifybackup` — проверка целостности копии', '`pg_create_restore_point` — именованная точка для PITR', 'Регулярные учения по восстановлению — обязательны'] },
          { t: 'note', text: 'Бэкап без проверки восстановления — это не бэкап, а надежда. Фиксируйте RPO/RTO, храните копии вне основного диска и автоматизируйте тестовое восстановление.', kind: 'tip' },
        ],
      },
      {
        id: 'arch-pooling',
        title: 'Соединения и PgBouncer',
        blocks: [
          { t: 'p', text: 'Каждое соединение — отдельный backend-процесс с собственной памятью (несколько MB плюс кэши). Тысячи прямых соединений съедают RAM и перегружают планировщик. Пул соединений переиспользует backend между клиентами и ограничивает их число.' },
          { t: 'sql', text: `SELECT state, count(*) AS connections
FROM pg_stat_activity
GROUP BY state
ORDER BY connections DESC;

SELECT name, setting
FROM pg_settings
WHERE name IN ('max_connections', 'superuser_reserved_connections');` },
          { t: 'table', headers: ['Режим PgBouncer', 'Что закрепляется', 'Совместимость'], rows: [['session', 'Соединение на всю сессию', 'Полная, но меньше экономии'], ['transaction', 'Только на транзакцию', 'Почти полная; осторожно с session-состоянием'], ['statement', 'На один оператор', 'Только простые сценарии']] },
          { t: 'p', text: 'В режиме `transaction` нельзя полагаться на session-level состояние: advisory-блокировки, временные таблицы, `SET` без `LOCAL`, prepared statements и курсоры могут «переехать» на другое соединение. Используйте `SET LOCAL`, `pg_advisory_xact_lock` и отказ от временных таблиц.' },
          { t: 'note', text: 'PgBouncer не заменяет ограничение `max_connections`: он защищает от перегрузки, но приложение всё равно должно закрывать соединения и иметь таймауты. Начинайте с `transaction`-режима и тестируйте каждый сценарий.', kind: 'info' },
        ],
      },
    ],
  },

  {
    id: 'data-modeling-sql',
    title: 'Моделирование данных и антипаттерны',
    icon: '🧩',
    level: 'senior',
    dataset: 'shop',
    intro: 'Проектируем схему, которая переживёт рост и миграции: нормальные формы, правильные типы, ключи и безопасные изменения. Разбираем типовые антипаттерны и их цену.',
    sections: [
      {
        id: 'model-normal-forms',
        title: 'Нормальные формы и аномалии',
        blocks: [
          { t: 'p', text: '1НФ требует атомарных значений, 2НФ — отсутствия частичной зависимости от составного ключа, 3НФ — отсутствия транзитивных зависимостей. BCNF строже: каждый детерминант должен быть кандидатным ключом. Нормализация устраняет аномалии вставки, обновления и удаления.' },
          { t: 'sql', text: `-- Антипаттерн: данные клиента и товаров продублированы в заказе
CREATE TABLE orders_bad (
  id int PRIMARY KEY,
  customer_name text,
  customer_city text,
  product_names text,
  product_prices text
);

-- Нормализованная схема
CREATE TABLE customers (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  city text
);

CREATE TABLE order_items (
  order_id int NOT NULL REFERENCES orders(id),
  product_id int NOT NULL REFERENCES products(id),
  quantity int NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);` },
          { t: 'table', headers: ['Форма', 'Устраняет', 'Пример нарушения'], rows: [['1НФ', 'Повторяющиеся группы, составные значения', '`tags = \'a,b,c\'`'], ['2НФ', 'Зависимость части атрибутов от части ключа', 'Цена товара в `order_items` зависит только от product_id'], ['3НФ', 'Транзитивные зависимости', 'Город клиента зависит от клиента, а не от заказа'], ['BCNF', 'Аномалии при нескольких кандидатных ключах', 'Детерминант не является ключом']] },
          { t: 'p', text: 'Нормализация — не догма. Осознанная денормализация (сохранённый `orders.total`, материализованное представление, дублирование названия в отчёте) допустима, если есть механизм синхронизации и понимание цены: триггеры, транзакции, периодический пересчёт.' },
          { t: 'note', text: 'Дублирование данных без синхронизации — источник расхождений. Если храните агрегат, опишите инвариант и проверяйте его в тестах и мониторинге.', kind: 'warn' },
        ],
      },
      {
        id: 'model-keys-types',
        title: 'Ключи и типы данных',
        blocks: [
          { t: 'p', text: 'Суррогатный ключ (`bigint` identity) стабилен и компактен, натуральный (`email`, `isbn`) несёт смысл, но может измениться. На практике чаще берут суррогатный PK и уникальный индекс на натуральный ключ. Для распределённых систем рассматривают UUID, помня о размере индекса.' },
          { t: 'table', headers: ['Тип', 'Когда', 'Осторожность'], rows: [['`bigint` identity', 'Большинство OLTP-таблиц', 'Не раскрывает бизнес-смысл'], ['`uuid`', 'Распределённая генерация, отсутствие утечки количества', '16 байт, случайный порядок в B-tree'], ['`numeric`', 'Деньги, точные расчёты', 'Медленнее `bigint`/`float`'], ['`timestamptz`', 'Моменты времени', 'Хранит UTC, зависит от TimeZone при выводе'], ['`date`', 'Календарные даты', 'Не путать с моментом времени']] },
          { t: 'sql', text: `CREATE TABLE payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);` },
          { t: 'p', text: 'Деньги храните в `numeric`, а не в `float`: двоичная плавающая точка не представляет 0.1 точно. `timestamp` без зоны — это «настенное время» без привязки к UTC; для событий используйте `timestamptz`. `varchar(n)` в PostgreSQL не быстрее `text`, ограничение длины — бизнес-правило, а не оптимизация.' },
          { t: 'note', text: '`serial` создаёт последовательность с отдельными правами и может неожиданно исчерпаться. `GENERATED ALWAYS AS IDENTITY` — современный стандарт, проще в обслуживании и безопаснее.', kind: 'tip' },
        ],
      },
      {
        id: 'model-antipatterns',
        title: 'Антипаттерны: EAV, CSV, флаги, over-indexing',
        blocks: [
          { t: 'p', text: 'Типовые ошибки моделирования: EAV для всего, CSV в колонке, булевы флаги под каждый статус, «полиморфный» внешний ключ, мягкое удаление без индексов и индексы на каждую колонку. Каждая из них усложняет запросы, целостность или запись.' },
          { t: 'table', headers: ['Антипаттерн', 'Проблема', 'Альтернатива'], rows: [['EAV', 'Сложные JOIN, нет типов и ограничений', '`jsonb` для динамики или явные колонки'], ['CSV в колонке', 'Нельзя индексировать и проверять', 'Связанная таблица или массив'], ['Флаги is_active/is_deleted', 'Противоречивые состояния', 'Один статус + CHECK'], ['Полиморфный FK', 'Невозможно обеспечить ссылочную целостность', 'Отдельные таблицы или общая супертаблица'], ['Over-indexing', 'Замедление записи, bloat', 'Индексы под реальные запросы']] },
          { t: 'sql', text: `-- EAV: гибко, но дорого в запросах и лишено типов
CREATE TABLE employee_attrs (
  employee_id int REFERENCES employees(id),
  attr_name text,
  attr_value text,
  PRIMARY KEY (employee_id, attr_name)
);

-- jsonb: типы и операторы, GIN-индекс
ALTER TABLE employees ADD COLUMN meta jsonb;
CREATE INDEX idx_employees_meta ON employees USING GIN (meta);

SELECT name FROM employees WHERE meta @> '{"level": 4}';` },
          { t: 'p', text: 'CSV-колонка нарушает 1НФ: поиск по элементу превращается в `LIKE \'%,x,%\'`, нельзя поставить FK и уникальность. Массив `text[]` лучше, если элементы простые, а `jsonb` — если нужны вложенность и ключи. Для связей многие-ко-многим — отдельная таблица.' },
          { t: 'note', text: 'Мягкое удаление (`deleted_at`) требует частичных индексов `WHERE deleted_at IS NULL`; иначе каждый запрос фильтрует мёртвые строки, а уникальные ограничения начинают конфликтовать с удалёнными.', kind: 'warn' },
        ],
      },
      {
        id: 'model-migrations',
        title: 'Миграции и обратная совместимость',
        blocks: [
          { t: 'p', text: 'Безопасная миграция — это последовательность расширяющих и сужающих шагов (expand/contract). Сначала добавляем новое, пишем в оба места, затем переключаем чтение, и только потом удаляем старое. Каждый шаг должен быть совместим со старой версией кода, работающей в это время.' },
          { t: 'sql', text: `SET lock_timeout = '3s';

-- 1. Добавить колонку без блокировки на Rewrite
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel text;

-- 2. Ограничение без проверки старых строк
ALTER TABLE orders
  ADD CONSTRAINT orders_total_positive
  CHECK (total >= 0) NOT VALID;

-- 3. Проверить и включить
ALTER TABLE orders VALIDATE CONSTRAINT orders_total_positive;

-- 4. Индекс без блокировки записи
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_channel
  ON orders (channel);` },
          { t: 'list', items: ['`lock_timeout` на каждом DDL, чтобы не встать в очередь навсегда', '`CREATE INDEX CONCURRENTLY` вне транзакции', '`NOT VALID` + `VALIDATE` для CHECK и FK', 'Не менять тип колонки напрямую на большой таблице', 'Новую колонку делать nullable или с быстрым default', 'Удалять старую колонку только после отказа от неё в коде'] },
          { t: 'p', text: 'Инструменты миграций (Flyway, Liquibase, Alembic, sqitch) хранят версию схемы и порядок применения. Важнее инструмента — дисциплина: миграции идемпотентны, проверены на копии продакшена, откат продуман заранее. `CREATE INDEX CONCURRENTLY` при сбое оставляет невалидный индекс, который нужно удалить и повторить.' },
          { t: 'note', text: '`ALTER TABLE ... ALTER COLUMN TYPE` часто переписывает таблицу и берёт `ACCESS EXCLUSIVE`. Для больших таблиц используйте новую колонку, фоновое заполнение батчами и последующее переключение.', kind: 'warn' },
        ],
      },
      {
        id: 'model-conventions',
        title: 'Соглашения об именовании и версионирование',
        blocks: [
          { t: 'p', text: 'Единые соглашения снижают когнитивную нагрузку: `snake_case`, существительные во множественном числе для таблиц, `id` для первичного ключа, `<table>_id` для внешнего, `created_at`/`updated_at` для времени. Имена не должны требовать кавычек — регистр в PostgreSQL складывается в нижний.' },
          { t: 'sql', text: `CREATE SCHEMA billing;

CREATE TABLE billing.invoices (
  invoice_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id int NOT NULL REFERENCES orders (id),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'void'))
);

COMMENT ON TABLE billing.invoices IS 'Счета, выставленные по заказам';` },
          { t: 'table', headers: ['Объект', 'Соглашение', 'Пример'], rows: [['Таблица', 'множественное число, snake_case', '`order_items`'], ['Колонка', 'snake_case, без префикса таблицы', '`created_at`'], ['PK', '`id` или `<entity>_id`', '`invoice_id`'], ['FK', '`<referenced>_id`', '`order_id`'], ['Индекс', '`idx_<table>_<cols>`', '`idx_orders_status_date`'], ['Ограничение', '`<table>_<rule>`', '`orders_total_positive`']] },
          { t: 'p', text: 'Версионирование схемы — это не только таблица `schema_version`. Это совместимость приложения и БД в обе стороны, контрактные тесты и план отката. Держите DDL в репозитории, применяйте через CI и никогда не правьте прод вручную без фиксации.' },
          { t: 'note', text: 'Комментарии к таблицам и колонкам (`COMMENT ON`) дешевы и сильно помогают новым членам команды. Документируйте инварианты, единицы измерения и допустимые статусы прямо в схеме.', kind: 'tip' },
        ],
      },
    ],
  },

  {
    id: 'advanced-sql',
    title: 'Продвинутый SQL: GROUPING SETS, LATERAL, DISTINCT ON',
    icon: '🎓',
    level: 'senior',
    dataset: 'shop',
    intro: 'Инструменты, которые заменяют несколько запросов одним: множественные группировки, LATERAL, DISTINCT ON, оконные рамки и ordered-set агрегаты. Плюс MERGE и JSON_TABLE из свежих версий.',
    sections: [
      {
        id: 'adv-grouping-sets',
        title: 'GROUPING SETS, ROLLUP и CUBE',
        blocks: [
          { t: 'p', text: '`GROUPING SETS` позволяет вычислить несколько группировок за один проход. `ROLLUP (a, b)` даёт иерархию `(a, b)`, `(a)`, `()`; `CUBE (a, b)` — все комбинации. Функция `GROUPING(col)` отличает NULL, возникший из-за агрегации, от настоящего NULL в данных.' },
          { t: 'sql', text: `SELECT d.name AS department,
       e.hired_at::date AS hired,
       count(*) AS employees,
       GROUPING(d.name) AS g_dept,
       GROUPING(e.hired_at) AS g_date
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY ROLLUP (d.name, e.hired_at)
ORDER BY d.name NULLS LAST, e.hired_at NULLS LAST;` },
          { t: 'sql', text: `-- Итоги по статусам и общий итог одним запросом
SELECT status,
       count(*) AS orders,
       sum(total) AS revenue,
       GROUPING(status) AS is_total
FROM orders
GROUP BY GROUPING SETS ((status), ())
ORDER BY is_total, status;` },
          { t: 'table', headers: ['Конструкция', 'Наборы группировок'], rows: [['`GROUPING SETS ((a), (b))`', '`(a)`, `(b)`'], ['`ROLLUP (a, b)`', '`(a, b)`, `(a)`, `()`'], ['`CUBE (a, b)`', '`(a, b)`, `(a)`, `(b)`, `()`'], ['`GROUP BY a, b`', '`(a, b)`']] },
          { t: 'p', text: '`GROUPING()` возвращает 1 для колонки, которая не входит в текущий набор группировок. Это единственный надёжный способ отличить итоговую строку от строки с реальным NULL. Для отчётов с несколькими уровнями это важнее, чем `coalesce`.', },
          { t: 'note', text: 'Число наборов группировок растёт быстро: `CUBE` по пяти колонкам даёт 32 набора. Следите за стоимостью и не подменяйте аналитику одним гигантским запросом без необходимости.', kind: 'info' },
        ],
      },
      {
        id: 'adv-lateral-distinct',
        title: 'LATERAL и DISTINCT ON',
        blocks: [
          { t: 'p', text: '`LATERAL` позволяет подзапросу в `FROM` ссылаться на колонки предыдущих источников. Это естественный способ сделать top-N на группу: для каждой строки внешней таблицы выполняется свой подзапрос с `LIMIT`. Без индекса это может быть медленно, с индексом — очень быстро.' },
          { t: 'sql', text: `SELECT c.name, o.order_date, o.total
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_date, total
  FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY order_date DESC
  LIMIT 2
) o
ORDER BY c.name, o.order_date DESC;` },
          { t: 'sql', text: `-- То же через DISTINCT ON: одна строка на клиента
SELECT DISTINCT ON (customer_id)
       customer_id, order_date, total
FROM orders
ORDER BY customer_id, order_date DESC;` },
          { t: 'p', text: '`DISTINCT ON (expr)` оставляет первую строку каждой группы согласно `ORDER BY`, который **должен** начинаться с того же выражения. Это расширение PostgreSQL; переносимый аналог — `row_number() OVER (PARTITION BY ...) = 1`. По скорости `DISTINCT ON` часто выигрывает за счёт индекса.' },
          { t: 'table', headers: ['Задача', 'Инструмент'], rows: [['Top-N на группу', '`LATERAL` + `LIMIT`'], ['Одна последняя строка на ключ', '`DISTINCT ON`'], ['Несколько агрегатов на группу', '`LATERAL` с отдельными подзапросами'], ['Оконный аналог', '`row_number()`']] },
          { t: 'note', text: '`LEFT JOIN LATERAL ... ON true` сохраняет внешние строки без совпадений, `CROSS JOIN LATERAL` — нет. Выбирайте осознанно: это частая причина «пропавших» клиентов в отчёте.', kind: 'warn' },
        ],
      },
      {
        id: 'adv-windows',
        title: 'Оконные рамки: ROWS, RANGE, GROUPS',
        blocks: [
          { t: 'p', text: 'Рамка определяет, какие строки окна участвуют в вычислении. `ROWS` считает физические строки, `RANGE` — значения `ORDER BY` (включая пиры), `GROUPS` — группы пиров. По умолчанию рамка — `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, что даёт накопительный итог.' },
          { t: 'sql', text: `SELECT order_date, total,
       sum(total) OVER (
         ORDER BY order_date
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_3_rows,
       sum(total) OVER (
         ORDER BY order_date
         RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW
       ) AS moving_30_days,
       count(*) OVER (
         ORDER BY order_date
         GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW
       ) AS groups_frame
FROM orders;` },
          { t: 'sql', text: `-- FILTER: агрегаты по группам
SELECT o.customer_id,
       count(*) FILTER (WHERE o.status = 'delivered') AS delivered,
       sum(o.total) FILTER (WHERE c.vip) AS vip_revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY o.customer_id
ORDER BY o.customer_id;

-- EXCLUDE: сумма всех строк окна, кроме текущей
SELECT order_date, total,
       sum(total) OVER (
         ORDER BY order_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
         EXCLUDE CURRENT ROW
       ) AS total_without_current
FROM orders
ORDER BY order_date;` },
          { t: 'table', headers: ['Рамка', 'Единица', 'Когда'], rows: [['ROWS', 'Физическая строка', 'Скользящее среднее по N строкам'], ['RANGE', 'Значение ORDER BY', 'Интервалы времени, пиры'], ['GROUPS', 'Группа пиров', 'Ранжирование с одинаковыми значениями'], ['EXCLUDE', 'Исключение строк', 'Текущая строка, пиры, группа']] },
          { t: 'p', text: '`FILTER (WHERE ...)` применяется к агрегату до окна и часто заменяет `CASE WHEN`. Именованное окно (`WINDOW w AS (...)`) убирает дублирование. Для `RANGE` с интервалом нужен ровно один ключ `ORDER BY` монотонного типа.' },
          { t: 'note', text: '`RANGE` и `GROUPS` включают все строки-пиры с тем же значением ключа, поэтому результат может отличаться от `ROWS` при дубликатах дат. Проверяйте данные на уникальность ключа, если ожидаете построчный расчёт.', kind: 'warn' },
        ],
      },
      {
        id: 'adv-ordered-json',
        title: 'Ordered-set агрегаты, WITH ORDINALITY, JSON',
        blocks: [
          { t: 'p', text: 'Ordered-set агрегаты считают статистику по упорядоченному набору: `percentile_cont` интерполирует, `percentile_disc` берёт существующее значение, `mode` возвращает самое частое. Синтаксис — `WITHIN GROUP (ORDER BY ...)`, а не обычный аргумент.' },
          { t: 'sql', text: `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total) AS median,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY total) AS p90,
       percentile_disc(0.5) WITHIN GROUP (ORDER BY total) AS median_exact,
       mode() WITHIN GROUP (ORDER BY status) AS most_common_status
FROM orders;` },
          { t: 'sql', text: `-- Разворачиваем массив с номерами позиций
SELECT *
FROM unnest(ARRAY['sql', 'python', 'json'])
     WITH ORDINALITY AS t(skill, ord);

-- Извлекаем элементы jsonb-массива
SELECT jsonb_path_query(meta, '$.tags[*]') AS tag
FROM employees
WHERE id = 1;` },
          { t: 'sql', text: `-- JSON_TABLE (PostgreSQL 17+): таблица из JSON
SELECT e.id, j.tag
FROM employees e,
     JSON_TABLE(
       e.meta,
       '$.tags[*]'
       COLUMNS (tag text PATH '$')
     ) AS j
WHERE e.id = 1;` },
          { t: 'table', headers: ['Оператор/функция', 'Результат'], rows: [['`->`', 'jsonb-значение по ключу или индексу'], ['`->>`', 'text-значение'], ['`#>` / `#>>`', 'Путь к вложенному значению'], ['`@>`', 'Проверка вложения'], ['`jsonb_path_query`', 'Множество значений по JSONPath'], ['`jsonb_path_exists`', 'Булево: есть ли совпадение']] },
          { t: 'note', text: '`JSON_TABLE` появился в PostgreSQL 17 и заменяет ручное разворачивание через `jsonb_array_elements` с `LATERAL`. Для PG16 и ниже используйте `jsonb_array_elements`/`jsonb_each` в `FROM ... LATERAL`.', kind: 'info' },
        ],
      },
      {
        id: 'adv-merge-values',
        title: 'MERGE, VALUES и табличные функции',
        blocks: [
          { t: 'p', text: '`MERGE` (PostgreSQL 15+) объединяет вставку, обновление и удаление в одном операторе по условию соединения. Это удобно для синхронизации справочников и ETL, но не отменяет `ON CONFLICT`: при конкурентных вставках MERGE может получить нарушение уникальности.' },
          { t: 'sql', text: `MERGE INTO products AS p
USING (VALUES
  ('Wireless Mouse', 'electronics', 49.00),
  ('Fountain Pen', 'stationery', 99.00)
) AS s(name, category, price)
ON p.name = s.name
WHEN MATCHED THEN
  UPDATE SET price = s.price, category = s.category
WHEN NOT MATCHED THEN
  INSERT (name, category, price)
  VALUES (s.name, s.category, s.price);` },
          { t: 'sql', text: `-- VALUES как обычная таблица
SELECT *
FROM (VALUES (1, 'new'), (2, 'shipped')) AS v(id, status);

-- Табличная функция с номерами строк
SELECT m, row_number() OVER (ORDER BY m) AS rn
FROM generate_series(
  '2024-01-01'::date,
  '2024-12-01'::date,
  interval '1 month'
) AS m;` },
          { t: 'p', text: 'Табличные функции в `FROM` могут принимать параметры и возвращать множества: `generate_series`, `unnest`, `jsonb_array_elements`, собственные `RETURNS SETOF`. С `WITH ORDINALITY` вы получаете позицию элемента, что важно для сохранения порядка при разворачивании.' },
          { t: 'note', text: '`MERGE ... RETURNING` появился только в PostgreSQL 17. На PG15–16 для получения изменённых строк используйте `INSERT ... ON CONFLICT ... RETURNING` или CTE с `UPDATE ... RETURNING`.', kind: 'warn' },
        ],
      },
    ],
  },
  // __SENIOR_END__
];
