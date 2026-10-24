// Разбор второго блока собеседования: только новые темы (без повторов).
// DDL/DML и DELETE vs TRUNCATE, память Python, Catalyst, HDFS, Kafka security, live coding.

export const LESSONS_DE_INTERVIEW2 = [
  {
    id: 'de-interview-block2',
    title: 'Собеседование, блок 2: SQL, Python, Spark, HDFS',
    icon: '🧱',
    level: 'middle',
    track: 'career',
    dataset: 'company',
    intro: 'Второй блок тем с собеседования: категории SQL-команд и DELETE vs TRUNCATE, память Python (`is`, copy, venv), Catalyst и predicate pushdown, устройство HDFS и формула репликации, безопасность Kafka и live-coding «login сразу после visit».',
    outcomes: [
      'Различать DDL и DML и объяснять DELETE vs TRUNCATE через dead tuples и VACUUM',
      'Понимать mutable/immutable, `==` vs `is`, shallow/deep copy и venv',
      'Объяснять логический/физический план Spark и predicate pushdown',
      'Знать NameNode, DataNode, Secondary NameNode и формулу выживаемости K−1',
      'Настраивать доступ к Kafka через SASL/SSL и ACL',
      'Решать live-coding: цепочки login после visit по клиентам и месяцам',
    ],
    sections: [
      {
        id: 'ddl-dml',
        title: 'DDL и DML: категории команд',
        blocks: [
          { t: 'p', text: 'Команды SQL делят на группы по назначению. **DDL** (Data Definition Language) меняет **структуру** БД: `CREATE`, `DROP`, `ALTER`, `TRUNCATE`, `COMMENT`. **DML** (Data Manipulation Language) меняет **данные**: `INSERT`, `UPDATE`, `DELETE` (иногда сюда же относят `MERGE`).' },
          { t: 'table', headers: ['Группа', 'Команды', 'Что меняет'], rows: [
            ['DDL', 'CREATE, DROP, ALTER, TRUNCATE', 'структуру объектов и их существование'],
            ['DML', 'INSERT, UPDATE, DELETE, MERGE', 'строки внутри таблиц'],
            ['DQL', 'SELECT', 'ничего не меняет, только читает'],
            ['DCL', 'GRANT, REVOKE', 'права доступа'],
            ['TCL', 'BEGIN, COMMIT, ROLLBACK', 'границы транзакций'],
          ] },
          { t: 'note', text: 'В PostgreSQL `TRUNCATE` относится к DDL, но транзакционен: его можно откатить через `ROLLBACK`. Это редкое сочетание, которое любят спрашивать.', kind: 'tip' },
        ],
      },
      {
        id: 'delete-truncate',
        title: 'DELETE vs TRUNCATE: что происходит на диске',
        blocks: [
          { t: 'p', text: 'Внешне обе команды очищают таблицу, но внутри работают по-разному. **DELETE** — построчная DML-операция: каждая строка помечается удалённой (dead tuple), а физическое место остаётся занятым до `VACUUM`. **TRUNCATE** — DDL-операция: она пересоздаёт файлы таблицы и сразу освобождает пространство.' },
          { t: 'table', headers: ['Критерий', 'DELETE', 'TRUNCATE'], rows: [
            ['Тип', 'DML', 'DDL'],
            ['Как удаляет', 'построчно, с проверкой WHERE', 'сразу всю таблицу'],
            ['WHERE', 'поддерживает', 'не поддерживает'],
            ['Dead tuples', 'да, нужен VACUUM', 'нет, файлы пересоздаются'],
            ['Место на диске', 'освобождается после VACUUM', 'сразу'],
            ['Скорость', 'медленнее на больших объёмах', 'значительно быстрее'],
            ['WAL и логи', 'много записей', 'минимум'],
            ['Триггеры', 'срабатывают', 'не срабатывают (кроме ON TRUNCATE)'],
            ['IDENTITY', 'не сбрасывает', 'сбрасывает с RESTART IDENTITY'],
            ['Откат', 'да', 'да, в PostgreSQL'],
          ] },
          { t: 'sql', text: `-- DELETE: медленно на миллионах строк, место вернёт VACUUM
DELETE FROM orders WHERE order_date < '2023-01-01';

-- TRUNCATE: мгновенно очищает таблицу
TRUNCATE TABLE orders;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;` },
          { t: 'note', text: '`TRUNCATE` берёт `ACCESS EXCLUSIVE`, поэтому блокирует таблицу целиком. На проде массовое удаление часто делают партициями: `DROP TABLE` старой партиции вместо `DELETE` миллионов строк.', kind: 'warn' },
          { t: 'p', text: 'Почему `DELETE` оставляет место: PostgreSQL использует **MVCC**, и старая версия строки должна быть видна транзакциям со старым снимком. `VACUUM` помечает пространство как переиспользуемое, но файл не уменьшает; `VACUUM FULL` переписывает таблицу и возвращает место ОС, но блокирует её.' },
        ],
      },
      {
        id: 'python-memory',
        title: 'Python: mutable/immutable, `==` vs `is`, copy, venv',
        blocks: [
          { t: 'p', text: '**Изменяемые** объекты: `list`, `dict`, `set`, пользовательские классы. **Неизменяемые**: `int`, `str`, `tuple`, `frozenset`. Присваивание не копирует объект, а создаёт **второе имя** для него: `b = a` — это алиас, а не копия.' },
          { t: 'code', text: `a = [1, 2]
b = a            # тот же объект
b.append(3)
print(a)         # [1, 2, 3] — a изменился

c = a.copy()     # поверхностная копия
c.append(4)
print(a)         # [1, 2, 3] — a не изменился`, lang: 'python' },
          { t: 'p', text: '`==` сравнивает **значения**, `is` — **идентичность** (тот же объект в памяти). Для чисел и строк `is` работает непредсказуемо из-за интернирования, поэтому используйте его только для `None`, `True`, `False` и проверки «тот же объект».' },
          { t: 'code', text: `a = [1, 2]
b = [1, 2]
a == b        # True — значения равны
a is b        # False — разные объекты
a is None     # False
id(a) == id(b)  # False`, lang: 'python' },
          { t: 'p', text: '**Словарь** — хеш-таблица: поиск по ключу в среднем за `O(1)`. Ключи должны быть хешируемыми (неизменяемыми). **Список** хранит ссылки на объекты, а не сами значения.' },
          { t: 'p', text: '**venv** изолирует зависимости проекта: разные версии Python и библиотек не конфликтуют. Создание: `python -m venv .venv`, активация: `source .venv/bin/activate` (Linux/macOS) или `.venv\\Scripts\\activate` (Windows).' },
          { t: 'p', text: '**Поверхностная и глубокая копия.** `copy.copy()` создаёт новый контейнер, но вложенные объекты остаются общими. `copy.deepcopy()` рекурсивно копирует и вложенные структуры.' },
          { t: 'code', text: `import copy
a = [[1], [2]]
shallow = copy.copy(a)
deep = copy.deepcopy(a)
shallow[0].append(99)
print(a)        # [[1, 99], [2]] — вложенный список общий
deep[0].append(7)
print(a)        # [[1, 99], [2]] — deepcopy не задел a`, lang: 'python' },
          { t: 'note', text: 'Классическая ловушка — изменяемый аргумент по умолчанию: `def f(x, acc=[])` переиспользует один и тот же список между вызовами. Используйте `acc=None` и создавайте список внутри.', kind: 'warn' },
        ],
      },
      {
        id: 'spark-catalyst',
        title: 'Spark: Catalyst, планы и predicate pushdown',
        blocks: [
          { t: 'p', text: '**Catalyst** — оптимизатор Spark. Запрос проходит путь: **логический план** (что сделать) → **оптимизированный логический план** → **физический план** (как именно). Правила Catalyst переписывают план: убирают лишние колонки, проталкивают фильтры, сворачивают константы, меняют порядок соединений.' },
          { t: 'p', text: '**Predicate pushdown** — проталкивание фильтра `WHERE` как можно ближе к источнику, чтобы до `JOIN` доходило меньше строк. В идеале фильтр применяется при чтении Parquet (по статистике row groups), а не после соединения.' },
          { t: 'code', text: `# Плохо: фильтр после join
df = orders.join(customers, 'customer_id').filter("orders.status = 'paid'")

# Хорошо: фильтр до join (Catalyst сам протолкнёт, но помогаем читаемости)
orders_paid = orders.filter("status = 'paid'")
df = orders_paid.join(customers, 'customer_id')

df.explain(True)   # logical + physical plan`, lang: 'python' },
          { t: 'list', items: [
            '**Column pruning** — читаются только нужные колонки.',
            '**Constant folding** — `1 + 1` заменяется на `2` до выполнения.',
            '**Join reorder** — меньшая сторона может стать build-стороной.',
            '**Limit pushdown** — `LIMIT` старается применить раньше.',
            '`show()` и `count()` — **actions**: они запускают вычисления и могут пересчитать pipeline.',
          ] },
          { t: 'note', text: '`SHOW`/`LIMIT` в Spark не всегда дешёвые: без pushdown они могут прочитать весь датасет. Смотрите `explain`, а не догадывайтесь.', kind: 'warn' },
        ],
      },
      {
        id: 'hdfs',
        title: 'HDFS: NameNode, DataNode, репликация',
        blocks: [
          { t: 'p', text: '**HDFS** — распределённая файловая система. **NameNode** хранит метаданные: дерево каталогов, список блоков и их расположение. **DataNode** хранит сами блоки и шлёт heartbeats. **Secondary NameNode** периодически сливает `fsimage` и `edits` в checkpoint — это **не** standby и **не** замена резервной копии.' },
          { t: 'p', text: 'Файл делится на блоки (обычно **128 МБ**), каждый блок реплицируется. **Фактор репликации** по умолчанию — **3**. **MapReduce** пишет промежуточные результаты на диск, поэтому медленнее; **Spark** считает в памяти и строит DAG.' },
          { t: 'p', text: '**Формула выживаемости.** Если фактор репликации равен `K`, то без потери данных можно потерять не более `K − 1` узлов (для конкретного блока). При `K = 3` безопасно терять максимум **2** DataNode — независимо от того, 10 машин в кластере или 100. Это про реплики одного блока, а не про «запас» кластера.' },
          { t: 'table', headers: ['Компонент', 'Роль', 'Что будет при отказе'], rows: [
            ['NameNode', 'метаданные, карта блоков', 'кластер недоступен (нужен HA/standby)'],
            ['DataNode', 'хранение блоков', 'блоки восстанавливаются с других реплик'],
            ['Secondary NameNode', 'checkpoint fsimage/edits', 'не спасает от отказа NameNode'],
          ] },
          { t: 'note', text: 'Репликация защищает от отказа диска/узла, но не от логических ошибок (`DROP TABLE`) и не заменяет бэкап. Для HA NameNode нужна отдельная конфигурация с standby.', kind: 'warn' },
        ],
      },
      {
        id: 'kafka-security',
        title: 'Kafka: offset и разграничение доступа',
        blocks: [
          { t: 'p', text: '**Offset** — порядковый номер сообщения внутри партиции. Консьюмер коммитит offset, чтобы после рестарта продолжить с места и не потерять порядок. Offset уникален в пределах партиции, а не топика.' },
          { t: 'p', text: '**Безопасность.** Аутентификация — SASL (PLAIN, SCRAM, GSSAPI) поверх TLS; шифрование — SSL/TLS. Авторизация — **ACL** на топик/группу/операции (read, write, describe). Принцип наименьших привилегий: продюсеру — только `write` в свой топик, консьюмеру — `read` и доступ к своей группе.' },
          { t: 'list', items: [
            'Клиентские сертификаты или SASL-токены вместо анонимного доступа.',
            'ACL на `Topic:orders` с операцией `Write` для продюсера.',
            'ACL на `Group:etl` с `Read` для консьюмера.',
            'Квоты на продюсеров/консьюмеров, чтобы один клиент не забивал брокер.',
            'Ротация паролей/сертификатов и аудит подключений.',
          ] },
          { t: 'note', text: 'Включённый TLS без авторизации — это только шифрование канала; доступ к топикам всё равно нужно ограничивать ACL.', kind: 'tip' },
        ],
      },
      {
        id: 'live-coding',
        title: 'Live coding: login сразу после visit',
        blocks: [
          { t: 'p', text: '**Задача.** Есть лог `user_activity_log(client_id, action, hit_time)`. Нужно для каждого клиента за каждый месяц посчитать число «успешных цепочек»: событие `login` произошло **строго сразу после** `visit` без промежуточных действий.' },
          { t: 'p', text: '**План решения.** 1) `LAG(action)` по `client_id` и `hit_time` даёт предыдущее действие. 2) Оставляем строки, где `action = \'login\'` и `prev_action = \'visit\'`. 3) Приводим время к месяцу через `date_trunc(\'month\', hit_time)`. 4) Группируем по клиенту и месяцу, суммируем `CASE`.' },
          { t: 'sql', text: `WITH activity AS (
  SELECT * FROM (VALUES
    (1, 'visit', TIMESTAMP '2024-01-01 10:00:00'),
    (1, 'login', TIMESTAMP '2024-01-01 10:05:00'),
    (1, 'visit', TIMESTAMP '2024-01-15 09:00:00'),
    (1, 'login', TIMESTAMP '2024-01-15 09:02:00'),
    (2, 'visit', TIMESTAMP '2024-02-01 12:00:00'),
    (2, 'login', TIMESTAMP '2024-02-01 12:10:00')
  ) AS t(client_id, action, hit_time)
),
with_prev AS (
  SELECT client_id, action, hit_time,
         lag(action) OVER (PARTITION BY client_id ORDER BY hit_time) AS prev_action
  FROM activity
)
SELECT client_id,
       date_trunc('month', hit_time)::date AS month,
       sum(CASE WHEN action = 'login' AND prev_action = 'visit' THEN 1 ELSE 0 END) AS chains
FROM with_prev
GROUP BY client_id, date_trunc('month', hit_time)
ORDER BY client_id, month;` },
          { t: 'p', text: 'Результат на примере: клиент 1 — 2 цепочки в январе, клиент 2 — 1 цепочка в феврале.' },
          { t: 'list', items: [
            '**Ошибка 1:** забыть `ORDER BY hit_time` внутри `OVER` — синтаксическая ошибка/неопределённый порядок.',
            '**Ошибка 2:** перепутать `ASC` и `DESC` — тогда «предыдущее» станет «следующим».',
            '**Ошибка 3:** считать все `login`, а не только те, что идут сразу после `visit`.',
            '**Ошибка 4:** группировать по точному времени, а не по месяцу.',
            '**Ошибка 5:** забыть, что между `visit` и `login` могло быть другое действие — `LAG` это и проверяет.',
          ] },
          { t: 'note', text: 'Если нужно учитывать только первый `login` после `visit` или сессии, добавьте условие по времени (например, разница < 30 минут) и/или `row_number()` внутри сессии.', kind: 'tip' },
        ],
      },
      {
        id: 'block2-questions',
        title: 'Вопросы этого блока (с ответами)',
        blocks: [
          { t: 'list', items: [
            '**DDL vs DML?** — DDL меняет структуру (CREATE/DROP/ALTER/TRUNCATE), DML — данные (INSERT/UPDATE/DELETE).',
            '**DELETE vs TRUNCATE?** — DELETE построчно, оставляет dead tuples и место до VACUUM; TRUNCATE пересоздаёт файлы, быстрее, но без WHERE и с ACCESS EXCLUSIVE.',
            '**Почему после DELETE нужен VACUUM?** — MVCC оставляет старые версии; VACUUM помечает место переиспользуемым, VACUUM FULL возвращает его ОС.',
            '**`==` vs `is`?** — `==` сравнивает значения, `is` — идентичность объекта (`id()`).',
            '**copy vs deepcopy?** — copy поверхностная (вложенные объекты общие), deepcopy рекурсивная.',
            '**Зачем venv?** — изоляция версий Python и зависимостей между проектами.',
            '**Сложность поиска в dict?** — в среднем O(1), ключи должны быть хешируемыми.',
            '**Что делает Catalyst?** — переписывает логический план (pushdown, pruning, folding) и выбирает физический.',
            '**Что такое predicate pushdown?** — фильтр применяется раньше, ближе к источнику, чтобы уменьшить объём до join.',
            '**NameNode vs DataNode?** — NameNode хранит метаданные и карту блоков, DataNode — сами блоки.',
            '**Secondary NameNode — это standby?** — нет, это checkpoint fsimage/edits, не HA-замена.',
            '**Формула репликации?** — при факторе K можно потерять не более K−1 узлов без потери блока; при 3 — максимум 2.',
            '**Offset в Kafka?** — позиция сообщения в партиции; коммитится консьюмером.',
            '**Как ограничить доступ к Kafka?** — SASL/SSL для аутентификации, ACL на топики и группы.',
            '**Как посчитать login сразу после visit?** — LAG(action) OVER (PARTITION BY client_id ORDER BY hit_time), затем CASE + date_trunc + GROUP BY.',
          ] },
        ],
      },
      {
        id: 'block2-followups',
        title: 'Вопросы от себя: глубже',
        blocks: [
          { t: 'list', items: [
            'Когда `deepcopy` избыточен и чем он опасен по производительности?',
            'Почему изменяемый аргумент по умолчанию — баг, и как его исправить?',
            'Как predicate pushdown взаимодействует с UDF и почему UDF может его сломать?',
            'Почему Secondary NameNode не спасает от отказа NameNode?',
            'Что будет, если replication factor больше числа DataNode?',
            'Как посчитать цепочки, если между visit и login был ещё один visit?',
            'Как ограничить Kafka-доступ только своим топикам и группе?',
            'Чем `TRUNCATE ... RESTART IDENTITY` отличается от `DELETE` для последовательностей?',
          ] },
        ],
      },
      {
        id: 'block2-mistakes',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            'Называть TRUNCATE «быстрым DELETE» — это DDL с другим поведением по блокировкам и месту.',
            'Забывать про VACUUM и удивляться, что диск не освободился.',
            'Использовать `is` для сравнения чисел/строк.',
            'Думать, что `b = a` копирует список.',
            'Считать Secondary NameNode резервной копией.',
            'Путать «можно потерять K−1 узлов» с «запасом кластера».',
            'Забывать `ORDER BY` внутри окна `LAG`.',
          ] },
        ],
      },
    ],
  },
];
