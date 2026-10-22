// Задачи тренажёра. Проверка — по результату эталонного запроса.
// Поля: level (junior|middle|senior), difficulty, tables, condition (условие),
// output (что получить), expected/solution/hint.

export const TASKS = [
  // ===================== JUNIOR: фильтрация =====================
  {
    id: 't01',
    moduleId: 'filtering',
    level: 'junior',
    title: 'Кто получает больше 100 000',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Отдел кадров готовит отчёт по оплате труда и хочет выделить верхнюю часть зарплатной шкалы — сотрудников, которые получают **строго больше 100 000**.' },
      { t: 'p', text: 'Сравнение именно строгое (`>`): сотрудник с зарплатой ровно 100 000 в отчёт не попадёт. Если у двух людей зарплата совпадает, порядок между ними задайте по имени.' },
      { t: 'p', text: 'Выведите `name` (имя сотрудника) и `salary` (зарплата). Сортировка: по зарплате по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'salary'], note: 'Только salary > 100000. Порядок: salary ↓, затем name ↑.' },
    expected: `SELECT name, salary FROM employees WHERE salary > 100000 ORDER BY salary DESC, name;`,
    hint: 'Хватит `WHERE salary > 100000` и `ORDER BY salary DESC, name`.',
    solution: `SELECT name, salary
FROM employees
WHERE salary > 100000
ORDER BY salary DESC, name;`,
  },
  {
    id: 't02',
    moduleId: 'filtering',
    level: 'junior',
    title: 'У кого не заполнен email',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'В CRM у части сотрудников не заведён email. Маркетинг просит список таких людей, чтобы дозаполнить контакты.' },
      { t: 'p', text: 'Пустое значение здесь — это `NULL` (отсутствие значения), а не пустая строка. С `NULL` нельзя сравниваться через `=`: такое сравнение всегда даёт `NULL`.' },
      { t: 'p', text: 'Выведите `name` (имя сотрудника) для всех, у кого email не заполнен. Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только строки с email IS NULL. Порядок: name.' },
    expected: `SELECT name FROM employees WHERE email IS NULL ORDER BY name;`,
    hint: 'Проверка на NULL — `IS NULL`, а не `= NULL`.',
    solution: `SELECT name
FROM employees
WHERE email IS NULL
ORDER BY name;`,
  },
  {
    id: 't28',
    moduleId: 'filtering',
    level: 'junior',
    title: 'Все «сыны» компании',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'HR изучает «семейные династии» и ищет сотрудников, чья фамилия заканчивается на **«son»**: Johnson, Wilson, Anderson, Jackson.' },
      { t: 'p', text: 'Поиск должен быть регистронезависимым. В шаблоне `LIKE` символ `%` означает любую последовательность символов, поэтому `%son` подходит для окончания.' },
      { t: 'p', text: 'Выведите `name` (полное имя). Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Имена, оканчивающиеся на son (без учёта регистра). Порядок: name.' },
    expected: `SELECT name FROM employees WHERE name ILIKE '%son' ORDER BY name;`,
    hint: '`ILIKE \'%son\'` — регистронезависимый поиск по окончанию.',
    solution: `SELECT name
FROM employees
WHERE name ILIKE '%son'
ORDER BY name;`,
  },

  // ===================== JUNIOR: агрегация =====================
  {
    id: 't03',
    moduleId: 'aggregation',
    level: 'junior',
    title: 'Средняя зарплата по отделам',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'departments'],
    condition: [
      { t: 'p', text: 'Финансовый отдел сводит среднюю зарплату по каждому подразделению, чтобы сравнить уровни оплаты и заметить перекосы.' },
      { t: 'p', text: 'Название отдела хранится в `departments.name`, зарплата — в `employees.salary`. Таблицы связаны по `employees.department_id = departments.id`.' },
      { t: 'p', text: 'Выведите `department` (название отдела) и `avg_salary` (средняя зарплата, округлённая до 2 знаков). Сортировка: по средней зарплате по убыванию.' },
    ],
    output: { columns: ['department', 'avg_salary'], note: 'По строке на отдел. Порядок: avg_salary ↓.' },
    expected: `SELECT d.name AS department, round(avg(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY avg_salary DESC;`,
    hint: '`JOIN departments`, затем `GROUP BY d.name` и `round(avg(e.salary), 2)`.',
    solution: `SELECT d.name AS department, round(avg(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY avg_salary DESC;`,
  },
  {
    id: 't04',
    moduleId: 'aggregation',
    level: 'junior',
    title: 'Отделы с дорогим штатом',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'departments'],
    condition: [
      { t: 'p', text: 'Руководство хочет понять, в каких отделах средняя зарплата превышает **80 000** — это «дорогие» подразделения, где каждый сотрудник обходится компании дорого.' },
      { t: 'p', text: 'Условие на агрегат (`avg`) проверяется уже после группировки, поэтому нужен `HAVING`, а не `WHERE`.' },
      { t: 'p', text: 'Выведите `department` (название отдела) и `avg_salary` (средняя зарплата, округлённая до целого). Сортировка: по средней зарплате по убыванию.' },
    ],
    output: { columns: ['department', 'avg_salary'], note: 'Только avg > 80000. Порядок: avg_salary ↓.' },
    expected: `SELECT d.name AS department, round(avg(e.salary), 0) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
HAVING avg(e.salary) > 80000
ORDER BY avg_salary DESC;`,
    hint: '`HAVING avg(e.salary) > 80000` — именно HAVING.',
    solution: `SELECT d.name AS department, round(avg(e.salary), 0) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
HAVING avg(e.salary) > 80000
ORDER BY avg_salary DESC;`,
  },
  {
    id: 't05',
    moduleId: 'aggregation',
    level: 'junior',
    title: 'Вилка зарплат по отделам',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: false,
    tables: ['employees', 'departments'],
    condition: [
      { t: 'p', text: 'Чтобы оценить разброс оплаты внутри подразделений, для каждого отдела нужны минимальная и максимальная зарплаты.' },
      { t: 'p', text: 'Строки можно возвращать в произвольном порядке — проверка не зависит от сортировки.' },
      { t: 'p', text: 'Выведите `department` (название отдела), `min_salary` (минимальная зарплата) и `max_salary` (максимальная зарплата).' },
    ],
    output: { columns: ['department', 'min_salary', 'max_salary'], note: 'По строке на отдел, порядок строк любой.' },
    expected: `SELECT d.name AS department, min(e.salary) AS min_salary, max(e.salary) AS max_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name;`,
    hint: 'Агрегаты `min(e.salary)` и `max(e.salary)` + `GROUP BY d.name`.',
    solution: `SELECT d.name AS department, min(e.salary) AS min_salary, max(e.salary) AS max_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name;`,
  },
  {
    id: 't41',
    moduleId: 'aggregation',
    level: 'junior',
    title: 'Два отдела делят фонд оплаты труда',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'departments'],
    condition: [
      { t: 'p', text: 'Руководство сравнивает, какую часть фонда оплаты труда (ФОТ) компании формируют отделы **Engineering** и **Sales**: нужна суммарная зарплата каждого из них и её доля в общем ФОТ в процентах.' },
      { t: 'p', text: 'Доли двух отделов в сумме не дают 100%: зарплату получают сотрудники и других отделов.' },
      { t: 'p', text: 'Выведите `department` (название отдела), `payroll` (суммарная зарплата отдела) и `share_pct` (доля в общем ФОТ в процентах, округлённая до 1 знака).' },
    ],
    output: { columns: ['department', 'payroll', 'share_pct'], note: 'Только Engineering и Sales. Порядок: payroll ↓.' },
    expected: `SELECT d.name AS department,
       sum(e.salary) AS payroll,
       round(sum(e.salary) * 100.0 / (SELECT sum(salary) FROM employees), 1) AS share_pct
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE d.name IN ('Engineering', 'Sales')
GROUP BY d.name
ORDER BY payroll DESC;`,
    hint: 'Сумма по отделу и деление на `(SELECT sum(salary) FROM employees)`.',
    solution: `SELECT d.name AS department,
       sum(e.salary) AS payroll,
       round(sum(e.salary) * 100.0 / (SELECT sum(salary) FROM employees), 1) AS share_pct
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE d.name IN ('Engineering', 'Sales')
GROUP BY d.name
ORDER BY payroll DESC;`,
  },

  // ===================== JUNIOR: JOIN =====================
  {
    id: 't06',
    moduleId: 'joins',
    level: 'junior',
    title: 'Кто в каком отделе',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: false,
    tables: ['employees', 'departments'],
    condition: [
      { t: 'p', text: 'Новичку в компании нужен простой справочник «сотрудник → отдел», чтобы понимать структуру организации.' },
      { t: 'p', text: 'Связь — по `employees.department_id = departments.id`. Нужны только сотрудники с указанным отделом (внутреннее соединение).' },
      { t: 'p', text: 'Выведите `employee` (имя сотрудника) и `department` (название отдела).' },
    ],
    output: { columns: ['employee', 'department'], note: 'Порядок строк любой.' },
    expected: `SELECT e.name AS employee, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id;`,
    hint: '`INNER JOIN departments d ON d.id = e.department_id`.',
    solution: `SELECT e.name AS employee, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id;`,
  },
  {
    id: 't07',
    moduleId: 'joins',
    level: 'junior',
    title: 'Сотрудники без проектов',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'employee_projects'],
    condition: [
      { t: 'p', text: 'PM ищет людей, которых ещё не задействовали ни в одном проекте, — это свободный резерв, который можно подключить.' },
      { t: 'p', text: 'Назначения хранятся в `employee_projects`. Если соединить таблицы через `LEFT JOIN`, у «свободных» сотрудников правая часть будет `NULL`.' },
      { t: 'p', text: 'Выведите `name` (имя сотрудника). Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только сотрудники без проектов. Порядок: name.' },
    expected: `SELECT e.name
FROM employees e
LEFT JOIN employee_projects ep ON ep.employee_id = e.id
WHERE ep.employee_id IS NULL
ORDER BY e.name;`,
    hint: '`LEFT JOIN employee_projects ep ON ep.employee_id = e.id` + `ep.employee_id IS NULL`.',
    solution: `SELECT e.name
FROM employees e
LEFT JOIN employee_projects ep ON ep.employee_id = e.id
WHERE ep.employee_id IS NULL
ORDER BY e.name;`,
  },
  {
    id: 't08',
    moduleId: 'joins',
    level: 'junior',
    title: 'Кто кому подчиняется',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'В компании есть иерархия: у сотрудника есть руководитель (`manager_id`), и топ-менеджеры никому не подчиняются.' },
      { t: 'p', text: 'Соедините таблицу сотрудников сама с собой: одна «копия» — подчинённый, другая — руководитель. Для топ-менеджеров руководителя нет, но их тоже нужно показать.' },
      { t: 'p', text: 'Выведите `employee` (имя подчинённого) и `manager` (имя руководителя или `NULL`). Отсортируйте по имени сотрудника.' },
    ],
    output: { columns: ['employee', 'manager'], note: 'Все сотрудники, включая manager = NULL. Порядок: employee.' },
    expected: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.name;`,
    hint: '`LEFT JOIN employees m ON m.id = e.manager_id`.',
    solution: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.name;`,
  },

  // ===================== JUNIOR: подзапросы =====================
  {
    id: 't09',
    moduleId: 'subqueries',
    level: 'junior',
    title: 'Заказы дороже среднего',
    difficulty: 'easy',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['orders'],
    condition: [
      { t: 'p', text: 'Аналитик ищет «крупные» заказы: те, что дороже средней суммы заказа по всей базе. Это первый шаг к сегментации клиентов.' },
      { t: 'p', text: 'Среднее можно посчитать скалярным подзапросом прямо в `WHERE` — он вернёт одно число.' },
      { t: 'p', text: 'Выведите `id` (номер заказа) и `total` (сумма). Сортировка: по сумме по убыванию.' },
    ],
    output: { columns: ['id', 'total'], note: 'Только total > средней. Порядок: total ↓.' },
    expected: `SELECT id, total FROM orders
WHERE total > (SELECT avg(total) FROM orders)
ORDER BY total DESC;`,
    hint: '`WHERE total > (SELECT avg(total) FROM orders)`.',
    solution: `SELECT id, total
FROM orders
WHERE total > (SELECT avg(total) FROM orders)
ORDER BY total DESC;`,
  },
  {
    id: 't10',
    moduleId: 'subqueries',
    level: 'junior',
    title: 'Клиенты, которые ничего не купили',
    difficulty: 'medium',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['customers', 'orders'],
    condition: [
      { t: 'p', text: 'Маркетинг запускает реактивацию и просит список клиентов, которые зарегистрировались, но не сделали ни одного заказа.' },
      { t: 'p', text: 'Для каждого клиента нужно проверить, есть ли у него хотя бы одна строка в `orders`. Удобнее всего это делает `NOT EXISTS`.' },
      { t: 'p', text: 'Выведите `name` (имя клиента). Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только клиенты без заказов. Порядок: name.' },
    expected: `SELECT name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY name;`,
    hint: '`NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`.',
    solution: `SELECT name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY name;`,
  },
  {
    id: 't11',
    moduleId: 'subqueries',
    level: 'junior',
    title: 'Заказ дороже обычного для клиента',
    difficulty: 'hard',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['orders', 'customers'],
    condition: [
      { t: 'p', text: 'У каждого клиента есть свой «обычный» чек. Нужно найти заказы, которые дороже среднего чека именно этого клиента, — такие покупки можно считать нетипично крупными.' },
      { t: 'p', text: 'Среднее зависит от клиента, поэтому подзапрос должен быть коррелированным: внутри ссылаемся на `o.customer_id` внешнего запроса.' },
      { t: 'p', text: 'Выведите `id` (номер заказа), `name` (имя клиента) и `total` (сумма). Сортировка: по номеру заказа.' },
    ],
    output: { columns: ['id', 'name', 'total'], note: 'Только «дорогие относительно клиента» заказы. Порядок: id.' },
    expected: `SELECT o.id, c.name, o.total
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.total > (SELECT avg(o2.total) FROM orders o2 WHERE o2.customer_id = o.customer_id)
ORDER BY o.id;`,
    hint: 'В подзапросе `WHERE o2.customer_id = o.customer_id`.',
    solution: `SELECT o.id, c.name, o.total
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.total > (SELECT avg(o2.total) FROM orders o2 WHERE o2.customer_id = o.customer_id)
ORDER BY o.id;`,
  },

  // ===================== JUNIOR: CASE и функции =====================
  {
    id: 't29',
    moduleId: 'case-functions',
    level: 'junior',
    title: 'Грейд по зарплате',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Компания вводит грейды: `senior` при зарплате от 120 000, `middle` от 90 000, остальные — `junior`. Нужно проставить грейд каждому.' },
      { t: 'p', text: 'Ветви `CASE` проверяются сверху вниз, поэтому первым нужно проверить наибольший порог, иначе `senior` «поглотит» все остальные.' },
      { t: 'p', text: 'Выведите `name`, `salary` и `grade` (грейд). Сортировка: по зарплате по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'salary', 'grade'], note: 'По строке на сотрудника. Порядок: salary ↓, затем name.' },
    expected: `SELECT name, salary,
       CASE WHEN salary >= 120000 THEN 'senior'
            WHEN salary >= 90000  THEN 'middle'
            ELSE 'junior' END AS grade
FROM employees
ORDER BY salary DESC, name;`,
    hint: '`CASE WHEN salary >= 120000 THEN ... WHEN salary >= 90000 THEN ... ELSE ... END`.',
    solution: `SELECT name, salary,
       CASE WHEN salary >= 120000 THEN 'senior'
            WHEN salary >= 90000  THEN 'middle'
            ELSE 'junior' END AS grade
FROM employees
ORDER BY salary DESC, name;`,
  },
  {
    id: 't30',
    moduleId: 'case-functions',
    level: 'junior',
    title: 'Контакт вместо NULL',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Для рассылки нужен контакт каждого сотрудника: email, а если его нет — заглушка `нет email`, чтобы в письме не было пустоты.' },
      { t: 'p', text: '`COALESCE` возвращает первое не-NULL значение из списка аргументов.' },
      { t: 'p', text: 'Выведите `name` (имя) и `contact` (email или `нет email`). Сортировка: по имени.' },
    ],
    output: { columns: ['name', 'contact'], note: 'Все сотрудники. Порядок: name.' },
    expected: `SELECT name, COALESCE(email, 'нет email') AS contact
FROM employees
ORDER BY name;`,
    hint: '`COALESCE(email, \'нет email\') AS contact`.',
    solution: `SELECT name, COALESCE(email, 'нет email') AS contact
FROM employees
ORDER BY name;`,
  },
  {
    id: 't31',
    moduleId: 'strings',
    level: 'middle',
    title: 'Инициалы для бейджей',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Для пропусков нужны инициалы сотрудников: первая буква имени и первая буква фамилии в верхнем регистре (Alice Johnson → AJ).' },
      { t: 'p', text: 'Имя и фамилия лежат в одном поле `name` через пробел. Пригодятся `split_part`, `left` и `upper`.' },
      { t: 'p', text: 'Выведите `name` (полное имя) и `initials` (инициалы). Сортировка: по имени.' },
    ],
    output: { columns: ['name', 'initials'], note: 'Порядок: name.' },
    expected: `SELECT name,
       upper(left(split_part(name, ' ', 1), 1)) || upper(left(split_part(name, ' ', 2), 1)) AS initials
FROM employees
ORDER BY name;`,
    hint: '`upper(left(split_part(name, \' \', 1), 1)) || upper(left(split_part(name, \' \', 2), 1))`.',
    solution: `SELECT name,
       upper(left(split_part(name, ' ', 1), 1)) || upper(left(split_part(name, ' ', 2), 1)) AS initials
FROM employees
ORDER BY name;`,
  },

  // ===================== JUNIOR: даты =====================
  {
    id: 't24',
    moduleId: 'dates-basics',
    level: 'junior',
    title: 'Кто пришёл в 2020',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'HR готовит отчёт по найму за 2020 год: кто пополнил команду в этом году.' },
      { t: 'p', text: 'Год из даты извлекается функцией `extract(year FROM hired_at)`.' },
      { t: 'p', text: 'Выведите `name` (имя) и `hired_at` (дата найма). Сортировка: по дате найма.' },
    ],
    output: { columns: ['name', 'hired_at'], note: 'Только 2020 год. Порядок: hired_at.' },
    expected: `SELECT name, hired_at
FROM employees
WHERE extract(year FROM hired_at) = 2020
ORDER BY hired_at;`,
    hint: '`WHERE extract(year FROM hired_at) = 2020`.',
    solution: `SELECT name, hired_at
FROM employees
WHERE extract(year FROM hired_at) = 2020
ORDER BY hired_at;`,
  },
  {
    id: 't25',
    moduleId: 'dates-basics',
    level: 'junior',
    title: 'Пять ветеранов компании',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Нужны пять сотрудников с самым большим стажем — их наняли раньше всех.' },
      { t: 'p', text: '`age(hired_at)` возвращает интервал стажа, например `12 years 14 days`.' },
      { t: 'p', text: 'Выведите `name` (имя) и `tenure` (стаж). Сортировка: по дате найма по возрастанию.' },
    ],
    output: { columns: ['name', 'tenure'], note: '5 строк. Порядок: hired_at ↑.' },
    expected: `SELECT name, age(hired_at) AS tenure
FROM employees
ORDER BY hired_at
LIMIT 5;`,
    hint: '`ORDER BY hired_at LIMIT 5`, стаж — `age(hired_at) AS tenure`.',
    solution: `SELECT name, age(hired_at) AS tenure
FROM employees
ORDER BY hired_at
LIMIT 5;`,
  },
  {
    id: 't32',
    moduleId: 'dates-basics',
    level: 'junior',
    title: 'Наймы по годам',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Посчитайте, сколько сотрудников принимали в каждом году, — это динамика роста штата.' },
      { t: 'p', text: 'Год получается через `extract(year FROM hired_at)`; результат нужно использовать и в `GROUP BY`.' },
      { t: 'p', text: 'Выведите `year` (год) и `hired` (число наймов). Сортировка: по году по возрастанию.' },
    ],
    output: { columns: ['year', 'hired'], note: 'По строке на год. Порядок: year ↑.' },
    expected: `SELECT extract(year FROM hired_at) AS year, count(*) AS hired
FROM employees
GROUP BY extract(year FROM hired_at)
ORDER BY year;`,
    hint: '`GROUP BY extract(year FROM hired_at)`, затем `count(*)`.',
    solution: `SELECT extract(year FROM hired_at) AS year, count(*) AS hired
FROM employees
GROUP BY extract(year FROM hired_at)
ORDER BY year;`,
  },

  // ===================== JUNIOR: DML =====================
  {
    id: 't26',
    moduleId: 'dml',
    level: 'junior',
    title: 'Повышение для Engineering',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: false,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Отдел Engineering получает повышение: зарплату всех его сотрудников нужно увеличить на **10%**.' },
      { t: 'p', text: 'Чтобы увидеть результат без отдельного запроса, верните изменённые строки через `RETURNING`.' },
      { t: 'p', text: 'Выведите `name` и `salary` (новая зарплата) для сотрудников отдела 1.' },
    ],
    output: { columns: ['name', 'salary'], note: 'Строки отдела 1 с новой зарплатой. Порядок строк любой.' },
    expected: `UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 1
RETURNING name, salary;`,
    hint: '`UPDATE ... SET salary = salary * 1.10 WHERE department_id = 1 RETURNING name, salary;`',
    solution: `UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 1
RETURNING name, salary;`,
  },
  {
    id: 't27',
    moduleId: 'dml',
    level: 'junior',
    title: 'Обновить Alice через UPSERT',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: false,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Нужно «вставить или обновить» сотрудника с `id = 1` (Alice Johnson): если строка уже есть — обновить зарплату до **160 000**, если нет — вставить.' },
      { t: 'p', text: '`ON CONFLICT (id) DO UPDATE` делает это атомарно. `EXCLUDED` — строка, которую пытались вставить.' },
      { t: 'p', text: 'Выведите `name` и `salary` через `RETURNING`.' },
    ],
    output: { columns: ['name', 'salary'], note: 'Одна строка (Alice) с новой зарплатой.' },
    expected: `INSERT INTO employees (id, name, department_id, salary, hired_at)
VALUES (1, 'Alice Johnson', 1, 160000, '2015-03-12')
ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary
RETURNING name, salary;`,
    hint: '`ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary`.',
    solution: `INSERT INTO employees (id, name, department_id, salary, hired_at)
VALUES (1, 'Alice Johnson', 1, 160000, '2015-03-12')
ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary
RETURNING name, salary;`,
  },

  // ===================== MIDDLE: оконные функции =====================
  {
    id: 't12',
    moduleId: 'window',
    level: 'middle',
    title: 'Три самых дорогих сотрудника',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Нужен топ-3 по зарплате — для сравнения с рынком и подготовки предложений о повышении.' },
      { t: 'p', text: 'Достаточно отсортировать по убыванию и взять `LIMIT 3`. Та же задача решается и через `row_number()`.' },
      { t: 'p', text: 'Выведите `name` и `salary`. Сортировка: по зарплате по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'salary'], note: '3 строки. Порядок: salary ↓, затем name.' },
    expected: `SELECT name, salary FROM employees ORDER BY salary DESC, name LIMIT 3;`,
    hint: '`ORDER BY salary DESC, name LIMIT 3`.',
    solution: `SELECT name, salary
FROM employees
ORDER BY salary DESC, name
LIMIT 3;`,
  },
  {
    id: 't13',
    moduleId: 'window',
    level: 'middle',
    title: 'Нумерация внутри отдела',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'В каждом отделе пронумеруйте сотрудников по убыванию зарплаты — кто в отделе «первый», «второй» и так далее.' },
      { t: 'p', text: '`row_number()` с `PARTITION BY department_id` нумерует строки внутри каждой группы, не схлопывая их (в отличие от `GROUP BY`).' },
      { t: 'p', text: 'Выведите `name`, `department_id`, `salary` и `rn` (номер строки). Сортировка: по отделу, затем по зарплате по убыванию.' },
    ],
    output: { columns: ['name', 'department_id', 'salary', 'rn'], note: 'Все сотрудники. Порядок: department_id, salary ↓.' },
    expected: `SELECT name, department_id, salary,
       row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees
ORDER BY department_id, salary DESC;`,
    hint: '`row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn`.',
    solution: `SELECT name, department_id, salary,
       row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees
ORDER BY department_id, salary DESC;`,
  },
  {
    id: 't14',
    moduleId: 'window',
    level: 'middle',
    title: 'Ранг и плотный ранг',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Сравните две функции ранжирования на данных, где есть одинаковые зарплаты.' },
      { t: 'p', text: '`rank()` при равенстве даёт одинаковый ранг и «перепрыгивает» номера, а `dense_rank()` — не перепрыгивает. Разница видна на дублях зарплат.' },
      { t: 'p', text: 'Выведите `name`, `salary`, `rk` (`rank()`) и `drk` (`dense_rank()`). Сортировка: по зарплате по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'salary', 'rk', 'drk'], note: 'Все сотрудники. Порядок: salary ↓, затем name.' },
    expected: `SELECT name, salary,
       rank() OVER (ORDER BY salary DESC) AS rk,
       dense_rank() OVER (ORDER BY salary DESC) AS drk
FROM employees
ORDER BY salary DESC, name;`,
    hint: 'Обе функции — `OVER (ORDER BY salary DESC)`.',
    solution: `SELECT name, salary,
       rank() OVER (ORDER BY salary DESC) AS rk,
       dense_rank() OVER (ORDER BY salary DESC) AS drk
FROM employees
ORDER BY salary DESC, name;`,
  },
  {
    id: 't15',
    moduleId: 'window',
    level: 'middle',
    title: 'Насколько выросла зарплата',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Для каждого сотрудника нужно сравнить его зарплату с зарплатой предыдущего в списке по убыванию — так видно «шаг» между соседними уровнями оплаты.' },
      { t: 'p', text: '`lag(salary)` возвращает значение предыдущей строки окна. У первого сотрудника предыдущей строки нет — будет `NULL`.' },
      { t: 'p', text: 'Выведите `name`, `salary` и `diff` (разница «предыдущая − текущая»). Сортировка: по зарплате по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'salary', 'diff'], note: 'Все сотрудники. Порядок: salary ↓, затем name.' },
    expected: `SELECT name, salary,
       lag(salary) OVER (ORDER BY salary DESC) - salary AS diff
FROM employees
ORDER BY salary DESC, name;`,
    hint: '`lag(salary) OVER (ORDER BY salary DESC) - salary AS diff`.',
    solution: `SELECT name, salary,
       lag(salary) OVER (ORDER BY salary DESC) - salary AS diff
FROM employees
ORDER BY salary DESC, name;`,
  },
  {
    id: 't35',
    moduleId: 'window',
    level: 'middle',
    title: 'Накопительная сумма по отделам',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Внутри каждого отдела нужна накопительная сумма зарплат — от самой высокой к самой низкой. Это показывает, как быстро «набирается» фонд по мере роста уровня оплаты.' },
      { t: 'p', text: 'Оконный `sum()` с рамкой `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` считает сумму от начала окна до текущей строки.' },
      { t: 'p', text: 'Выведите `department_id`, `name`, `salary` и `running` (накопительная сумма). Сортировка: по отделу, затем по зарплате по убыванию.' },
    ],
    output: { columns: ['department_id', 'name', 'salary', 'running'], note: 'Все сотрудники. Порядок: department_id, salary ↓.' },
    expected: `SELECT department_id, name, salary,
       sum(salary) OVER (
         PARTITION BY department_id
         ORDER BY salary DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running
FROM employees
ORDER BY department_id, salary DESC;`,
    hint: '`sum(salary) OVER (PARTITION BY department_id ORDER BY salary DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.',
    solution: `SELECT department_id, name, salary,
       sum(salary) OVER (
         PARTITION BY department_id
         ORDER BY salary DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running
FROM employees
ORDER BY department_id, salary DESC;`,
  },

  // ===================== MIDDLE: CTE =====================
  {
    id: 't16',
    moduleId: 'cte',
    level: 'middle',
    title: 'Топ-3 клиента по выручке',
    difficulty: 'medium',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['orders', 'customers'],
    condition: [
      { t: 'p', text: 'Нужно понять, кто приносит больше всего денег: три клиента с максимальной суммой заказов.' },
      { t: 'p', text: 'Сначала посчитайте сумму заказов по клиенту в CTE (`WITH`), затем соедините с `customers` и возьмите топ-3.' },
      { t: 'p', text: 'Выведите `name` (имя клиента) и `spent` (суммарная выручка). Сортировка: по выручке по убыванию.' },
    ],
    output: { columns: ['name', 'spent'], note: '3 строки. Порядок: spent ↓.' },
    expected: `WITH totals AS (
  SELECT customer_id, sum(total) AS spent
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, t.spent
FROM totals t
JOIN customers c ON c.id = t.customer_id
ORDER BY t.spent DESC
LIMIT 3;`,
    hint: 'CTE `totals` с `sum(total)`, затем JOIN и `LIMIT 3`.',
    solution: `WITH totals AS (
  SELECT customer_id, sum(total) AS spent
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, t.spent
FROM totals t
JOIN customers c ON c.id = t.customer_id
ORDER BY t.spent DESC
LIMIT 3;`,
  },
  {
    id: 't17',
    moduleId: 'cte',
    level: 'middle',
    title: 'Вся команда Alice',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Иерархия задана через `manager_id`. Нужно собрать всех подчинённых Alice Johnson (`id = 1`) на любом уровне: её прямых подчинённых, их подчинённых и так далее.' },
      { t: 'p', text: 'Это рекурсивный CTE: базовый шаг — сама Alice, рекурсивный — сотрудники, чей `manager_id` уже попал в результат. Уровень считайте в `depth` (Alice = 1).' },
      { t: 'p', text: 'Выведите `name` и `depth`. Сортировка: по уровню, затем по имени.' },
    ],
    output: { columns: ['name', 'depth'], note: 'Alice + все потомки. Порядок: depth, name.' },
    expected: `WITH RECURSIVE sub AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, sub.depth + 1
  FROM employees e
  JOIN sub ON e.manager_id = sub.id
)
SELECT name, depth FROM sub ORDER BY depth, name;`,
    hint: 'Базовый шаг `WHERE id = 1`, рекурсивный — `JOIN sub ON e.manager_id = sub.id`.',
    solution: `WITH RECURSIVE sub AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, sub.depth + 1
  FROM employees e
  JOIN sub ON e.manager_id = sub.id
)
SELECT name, depth
FROM sub
ORDER BY depth, name;`,
  },

  // ===================== MIDDLE: множественные операции =====================
  {
    id: 't18',
    moduleId: 'set-ops',
    level: 'middle',
    title: 'И на Atlas, и на Beacon',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'employee_projects'],
    condition: [
      { t: 'p', text: 'Нужны сотрудники, которые одновременно работают над двумя стратегическими проектами — Atlas (`project_id = 1`) и Beacon (`project_id = 2`).' },
      { t: 'p', text: 'Это пересечение множеств `employee_id` для двух проектов. Используйте `INTERSECT`.' },
      { t: 'p', text: 'Выведите `name` (имя сотрудника). Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только сотрудники обоих проектов. Порядок: name.' },
    expected: `SELECT e.name
FROM employees e
WHERE e.id IN (
  SELECT employee_id FROM employee_projects WHERE project_id = 1
  INTERSECT
  SELECT employee_id FROM employee_projects WHERE project_id = 2
)
ORDER BY e.name;`,
    hint: '`SELECT employee_id ... project_id = 1 INTERSECT SELECT employee_id ... project_id = 2`.',
    solution: `SELECT e.name
FROM employees e
WHERE e.id IN (
  SELECT employee_id FROM employee_projects WHERE project_id = 1
  INTERSECT
  SELECT employee_id FROM employee_projects WHERE project_id = 2
)
ORDER BY e.name;`,
  },
  {
    id: 't19',
    moduleId: 'set-ops',
    level: 'middle',
    title: 'Только Atlas, без Beacon',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'employee_projects'],
    condition: [
      { t: 'p', text: 'Нужны сотрудники, задействованные в Atlas (`project_id = 1`), но не в Beacon (`project_id = 2`), — чтобы понять, кого можно переключить.' },
      { t: 'p', text: 'Это разность множеств: `EXCEPT`.' },
      { t: 'p', text: 'Выведите `name`. Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Atlas без Beacon. Порядок: name.' },
    expected: `SELECT e.name
FROM employees e
WHERE e.id IN (
  SELECT employee_id FROM employee_projects WHERE project_id = 1
  EXCEPT
  SELECT employee_id FROM employee_projects WHERE project_id = 2
)
ORDER BY e.name;`,
    hint: '`SELECT employee_id ... project_id = 1 EXCEPT SELECT employee_id ... project_id = 2`.',
    solution: `SELECT e.name
FROM employees e
WHERE e.id IN (
  SELECT employee_id FROM employee_projects WHERE project_id = 1
  EXCEPT
  SELECT employee_id FROM employee_projects WHERE project_id = 2
)
ORDER BY e.name;`,
  },

  // ===================== MIDDLE: JSON =====================
  {
    id: 't20',
    moduleId: 'json',
    level: 'middle',
    title: 'Уровень и первый тег из JSON',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'В колонке `meta` (тип `jsonb`) хранится профиль сотрудника: числовой `level` и массив строк `tags`.' },
      { t: 'p', text: 'Оператор `->>` возвращает текст, `->` — jsonb. Для первого элемента массива используйте `->> 0` (индексация с нуля).' },
      { t: 'p', text: 'Выведите `name`, `level` (уровень как число) и `first_tag` (первый тег). Сортировка: по уровню по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'level', 'first_tag'], note: 'Все сотрудники. Порядок: level ↓, затем name.' },
    expected: `SELECT name,
       (meta->>'level')::int AS level,
       meta->'tags'->>0 AS first_tag
FROM employees
ORDER BY level DESC, name;`,
    hint: '`(meta->>\'level\')::int AS level` и `meta->\'tags\'->>0 AS first_tag`.',
    solution: `SELECT name,
       (meta->>'level')::int AS level,
       meta->'tags'->>0 AS first_tag
FROM employees
ORDER BY level DESC, name;`,
  },
  {
    id: 't21',
    moduleId: 'json',
    level: 'middle',
    title: 'Кто в теге lead',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Нужно найти сотрудников с тегом `lead` в jsonb-массиве `meta->tags` — это потенциальные лидеры.' },
      { t: 'p', text: 'Оператор `@>` проверяет, что jsonb-массив содержит указанный элемент.' },
      { t: 'p', text: 'Выведите `name`. Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только с тегом lead. Порядок: name.' },
    expected: `SELECT name
FROM employees
WHERE meta->'tags' @> '["lead"]'::jsonb
ORDER BY name;`,
    hint: '`meta->\'tags\' @> \'["lead"]\'::jsonb`.',
    solution: `SELECT name
FROM employees
WHERE meta->'tags' @> '["lead"]'::jsonb
ORDER BY name;`,
  },
  {
    id: 't39',
    moduleId: 'json',
    level: 'middle',
    title: 'Какие теги популярнее',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Разверните массив тегов каждого сотрудника в строки и посчитайте частоту каждого тега — какие компетенции встречаются чаще.' },
      { t: 'p', text: '`jsonb_array_elements_text` разворачивает jsonb-массив в набор текстовых строк.' },
      { t: 'p', text: 'Выведите `tag` (тег) и `cnt` (сколько сотрудников). Сортировка: по количеству по убыванию, затем по тегу.' },
    ],
    output: { columns: ['tag', 'cnt'], note: 'По строке на тег. Порядок: cnt ↓, затем tag.' },
    expected: `SELECT tag, count(*) AS cnt
FROM employees e, jsonb_array_elements_text(e.meta->'tags') AS tag
GROUP BY tag
ORDER BY cnt DESC, tag;`,
    hint: '`FROM employees e, jsonb_array_elements_text(e.meta->\'tags\') AS tag` + `GROUP BY tag`.',
    solution: `SELECT tag, count(*) AS cnt
FROM employees e, jsonb_array_elements_text(e.meta->'tags') AS tag
GROUP BY tag
ORDER BY cnt DESC, tag;`,
  },
  {
    id: 't40',
    moduleId: 'json',
    level: 'middle',
    title: 'Профиль сотрудника в JSON',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Соберите для каждого сотрудника jsonb-объект с именем и зарплатой — это удобный формат для выгрузки в API.' },
      { t: 'p', text: '`jsonb_build_object` собирает объект из пар «ключ, значение».' },
      { t: 'p', text: 'Выведите `info` (jsonb-объект). Отсортируйте по имени.' },
    ],
    output: { columns: ['info'], note: 'Один jsonb-объект на сотрудника. Порядок: name.' },
    expected: `SELECT jsonb_build_object('name', name, 'salary', salary) AS info
FROM employees
ORDER BY name;`,
    hint: '`jsonb_build_object(\'name\', name, \'salary\', salary) AS info`.',
    solution: `SELECT jsonb_build_object('name', name, 'salary', salary) AS info
FROM employees
ORDER BY name;`,
  },

  // ===================== MIDDLE: массивы =====================
  {
    id: 't22',
    moduleId: 'arrays',
    level: 'middle',
    title: 'Кто владеет SQL',
    difficulty: 'easy',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Навыки хранятся в массиве `skills`. Нужно найти всех, кто владеет навыком `sql`, — для формирования команды аналитиков.' },
      { t: 'p', text: 'Оператор `x = ANY(arr)` проверяет, встречается ли значение в массиве.' },
      { t: 'p', text: 'Выведите `name`. Отсортируйте по имени.' },
    ],
    output: { columns: ['name'], note: 'Только владеющие sql. Порядок: name.' },
    expected: `SELECT name FROM employees WHERE 'sql' = ANY(skills) ORDER BY name;`,
    hint: '`WHERE \'sql\' = ANY(skills)`.',
    solution: `SELECT name
FROM employees
WHERE 'sql' = ANY(skills)
ORDER BY name;`,
  },
  {
    id: 't23',
    moduleId: 'arrays',
    level: 'middle',
    title: 'Самый востребованный навык',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Разверните массив `skills` каждого сотрудника в строки и посчитайте, сколько людей владеет каждым навыком.' },
      { t: 'p', text: '`unnest` разворачивает массив в набор строк — дальше работает обычный `GROUP BY`.' },
      { t: 'p', text: 'Выведите `skill` (навык) и `people` (число сотрудников). Сортировка: по числу по убыванию, затем по навыку.' },
    ],
    output: { columns: ['skill', 'people'], note: 'По строке на навык. Порядок: people ↓, затем skill.' },
    expected: `SELECT skill, count(*) AS people
FROM employees e, unnest(e.skills) AS skill
GROUP BY skill
ORDER BY people DESC, skill;`,
    hint: '`FROM employees e, unnest(e.skills) AS skill` + `GROUP BY skill`.',
    solution: `SELECT skill, count(*) AS people
FROM employees e, unnest(e.skills) AS skill
GROUP BY skill
ORDER BY people DESC, skill;`,
  },

  // ===================== MIDDLE: паттерны =====================
  {
    id: 't33',
    moduleId: 'patterns',
    level: 'middle',
    title: 'Лучший в каждом отделе',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Для каждого отдела найдите сотрудника с максимальной зарплатой — «лицо» подразделения.' },
      { t: 'p', text: '`DISTINCT ON (department_id)` берёт первую строку группы согласно `ORDER BY`. Альтернатива — `row_number()` в CTE.' },
      { t: 'p', text: 'Выведите `department_id`, `name`, `salary`. Сортировка: по `department_id`.' },
    ],
    output: { columns: ['department_id', 'name', 'salary'], note: 'По строке на отдел. Порядок: department_id.' },
    expected: `SELECT DISTINCT ON (department_id) department_id, name, salary
FROM employees
ORDER BY department_id, salary DESC;`,
    hint: '`SELECT DISTINCT ON (department_id) ... ORDER BY department_id, salary DESC`.',
    solution: `SELECT DISTINCT ON (department_id) department_id, name, salary
FROM employees
ORDER BY department_id, salary DESC;`,
  },
  {
    id: 't34',
    moduleId: 'patterns',
    level: 'middle',
    title: 'Двое лучших в каждом отделе',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Для каждого отдела нужны два самых высокооплачиваемых сотрудника. Если в отделе меньше двух — выведите сколько есть.' },
      { t: 'p', text: 'Пронумеруйте строки `row_number()` внутри отдела и оставьте `rn <= 2`.' },
      { t: 'p', text: 'Выведите `department_id`, `name`, `salary`. Сортировка: по отделу, затем по зарплате по убыванию.' },
    ],
    output: { columns: ['department_id', 'name', 'salary'], note: 'До 2 строк на отдел. Порядок: department_id, salary ↓.' },
    expected: `WITH ranked AS (
  SELECT department_id, name, salary,
         row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
  FROM employees
)
SELECT department_id, name, salary
FROM ranked
WHERE rn <= 2
ORDER BY department_id, salary DESC;`,
    hint: 'CTE с `row_number() ... AS rn`, затем `WHERE rn <= 2`.',
    solution: `WITH ranked AS (
  SELECT department_id, name, salary,
         row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
  FROM employees
)
SELECT department_id, name, salary
FROM ranked
WHERE rn <= 2
ORDER BY department_id, salary DESC;`,
  },
  {
    id: 't42',
    moduleId: 'aggregation',
    level: 'middle',
    title: 'Какие категории приносят выручку',
    difficulty: 'medium',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['order_items', 'products'],
    condition: [
      { t: 'p', text: 'Магазин анализирует выручку по категориям товаров: сколько денег приносит каждая категория и какую долю она занимает в общей выручке.' },
      { t: 'p', text: 'Выручка — это `quantity * price` по позициям заказов. Категория хранится в `products.category`. Доли всех категорий в сумме дают 100%.' },
      { t: 'p', text: 'Выведите `category` (категория), `revenue` (выручка) и `share_pct` (доля в общей выручке в процентах, округлённая до 1 знака).' },
    ],
    output: { columns: ['category', 'revenue', 'share_pct'], note: 'По строке на категорию. Порядок: revenue ↓.' },
    expected: `SELECT p.category AS category,
       sum(oi.quantity * oi.price) AS revenue,
       round(sum(oi.quantity * oi.price) * 100.0 / (SELECT sum(quantity * price) FROM order_items), 1) AS share_pct
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY revenue DESC;`,
    hint: 'Сумма `quantity * price` по категории и деление на общую сумму из `order_items`.',
    solution: `SELECT p.category AS category,
       sum(oi.quantity * oi.price) AS revenue,
       round(sum(oi.quantity * oi.price) * 100.0 / (SELECT sum(quantity * price) FROM order_items), 1) AS share_pct
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY revenue DESC;`,
  },

  // ===================== SENIOR: продвинутый SQL =====================
  {
    id: 't36',
    moduleId: 'advanced-sql',
    level: 'senior',
    title: 'Итоги по отделам и по компании',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Одним запросом нужны и число сотрудников по каждому отделу, и общий итог по компании — чтобы не склеивать два отчёта вручную.' },
      { t: 'p', text: '`GROUPING SETS ((department_id), ())` считает оба разреза. Строка общего итога имеет `department_id IS NULL`.' },
      { t: 'p', text: 'Выведите `department_id` и `employees` (число сотрудников). Сортировка: по `department_id`, NULL — последней.' },
    ],
    output: { columns: ['department_id', 'employees'], note: 'Отделы + строка общего итога. Порядок: department_id, NULL последней.' },
    expected: `SELECT department_id, count(*) AS employees
FROM employees
GROUP BY GROUPING SETS ((department_id), ())
ORDER BY department_id NULLS LAST;`,
    hint: '`GROUP BY GROUPING SETS ((department_id), ())` и `ORDER BY department_id NULLS LAST`.',
    solution: `SELECT department_id, count(*) AS employees
FROM employees
GROUP BY GROUPING SETS ((department_id), ())
ORDER BY department_id NULLS LAST;`,
  },
  {
    id: 't37',
    moduleId: 'advanced-sql',
    level: 'senior',
    title: 'Главный проект каждого сотрудника',
    difficulty: 'hard',
    dataset: 'company',
    orderSensitive: true,
    tables: ['employees', 'employee_projects'],
    condition: [
      { t: 'p', text: 'Для каждого сотрудника найдите проект, на который у него ушло больше всего часов. Сотрудники без проектов в результат не входят.' },
      { t: 'p', text: '`CROSS JOIN LATERAL` позволяет подзапросу видеть колонки сотрудника и взять `LIMIT 1` — как цикл по каждому сотруднику.' },
      { t: 'p', text: 'Выведите `name`, `project_id`, `hours`. Сортировка: по имени.' },
    ],
    output: { columns: ['name', 'project_id', 'hours'], note: 'Сотрудники с проектами. Порядок: name.' },
    expected: `SELECT e.name, p.project_id, p.hours
FROM employees e
CROSS JOIN LATERAL (
  SELECT ep.project_id, ep.hours
  FROM employee_projects ep
  WHERE ep.employee_id = e.id
  ORDER BY ep.hours DESC
  LIMIT 1
) p
ORDER BY e.name;`,
    hint: '`CROSS JOIN LATERAL (SELECT ... WHERE ep.employee_id = e.id ORDER BY hours DESC LIMIT 1) p`.',
    solution: `SELECT e.name, p.project_id, p.hours
FROM employees e
CROSS JOIN LATERAL (
  SELECT ep.project_id, ep.hours
  FROM employee_projects ep
  WHERE ep.employee_id = e.id
  ORDER BY ep.hours DESC
  LIMIT 1
) p
ORDER BY e.name;`,
  },
  {
    id: 't38',
    moduleId: 'advanced-sql',
    level: 'senior',
    title: 'Медианная зарплата',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: false,
    tables: ['employees'],
    condition: [
      { t: 'p', text: 'Среднее искажает картину из-за выбросов. Для честной оценки нужна медиана зарплат по компании.' },
      { t: 'p', text: '`percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)` — непрерывный 50-й перцентиль, то есть медиана.' },
      { t: 'p', text: 'Выведите `median` (медианная зарплата). Порядок строк не важен.' },
    ],
    output: { columns: ['median'], note: 'Одна строка.' },
    expected: `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median
FROM employees;`,
    hint: '`percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median`.',
    solution: `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median
FROM employees;`,
  },

  // ===================== DE: аналитический SQL =====================
  {
    id: 't43',
    moduleId: 'analytics-sql',
    level: 'middle',
    title: 'Выручка по месяцам',
    difficulty: 'easy',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['orders'],
    condition: [
      { t: 'p', text: 'Финансовый отдел просит помесячную динамику выручки магазина: сколько денег приносил каждый месяц.' },
      { t: 'p', text: 'Дата заказа — `order_date`. Чтобы сгруппировать по месяцам, используйте `date_trunc(\'month\', order_date)` и приведите результат к `date` через `::date`, чтобы в колонке был чистый месяц без времени.' },
      { t: 'p', text: 'Выведите `month` (начало месяца, тип date) и `revenue` (суммарная выручка). Сортировка: по месяцу по возрастанию.' },
    ],
    output: { columns: ['month', 'revenue'], note: 'По строке на месяц. Порядок: month ↑.' },
    expected: `SELECT date_trunc('month', order_date)::date AS month, sum(total) AS revenue
FROM orders
GROUP BY date_trunc('month', order_date)
ORDER BY month;`,
    hint: '`date_trunc(\'month\', order_date)::date` и `sum(total)`.',
    solution: `SELECT date_trunc('month', order_date)::date AS month, sum(total) AS revenue
FROM orders
GROUP BY date_trunc('month', order_date)
ORDER BY month;`,
  },
  {
    id: 't44',
    moduleId: 'analytics-sql',
    level: 'middle',
    title: 'Сколько заказов у каждого клиента',
    difficulty: 'easy',
    dataset: 'shop',
    orderSensitive: true,
    tables: ['customers', 'orders'],
    condition: [
      { t: 'p', text: 'Маркетинг хочет увидеть частоту покупок: сколько заказов сделал каждый клиент, включая тех, кто не купил ни разу.' },
      { t: 'p', text: 'Клиентов без заказов тоже нужно показать — используйте `LEFT JOIN` и `count(o.id)` (а не `count(*)`).' },
      { t: 'p', text: 'Выведите `name` (имя клиента) и `orders` (число заказов). Сортировка: по числу заказов по убыванию, затем по имени.' },
    ],
    output: { columns: ['name', 'orders'], note: 'Все клиенты, включая 0 заказов. Порядок: orders ↓, затем name.' },
    expected: `SELECT c.name, count(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY orders DESC, c.name;`,
    hint: '`LEFT JOIN orders` + `count(o.id)` + `GROUP BY c.name`.',
    solution: `SELECT c.name, count(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY orders DESC, c.name;`,
  },
  {
    id: 't45',
    moduleId: 'analytics-sql',
    level: 'middle',
    title: 'Доля VIP-клиентов в выручке',
    difficulty: 'medium',
    dataset: 'shop',
    orderSensitive: false,
    tables: ['orders', 'customers'],
    condition: [
      { t: 'p', text: 'Нужно понять, насколько бизнес зависит от VIP-клиентов: какую долю всей выручки дают заказы клиентов с `vip = true`.' },
      { t: 'p', text: 'Удобно через `sum(...) FILTER (WHERE c.vip)` для VIP-выручки и `sum(...)` для общей. Не забудьте проценты и округление.' },
      { t: 'p', text: 'Выведите `vip_share` (доля выручки VIP в процентах, округлённая до 1 знака). Порядок строк не важен.' },
    ],
    output: { columns: ['vip_share'], note: 'Одна строка с процентом.' },
    expected: `SELECT round(sum(o.total) FILTER (WHERE c.vip) * 100.0 / sum(o.total), 1) AS vip_share
FROM orders o
JOIN customers c ON c.id = o.customer_id;`,
    hint: '`sum(o.total) FILTER (WHERE c.vip)` и деление на `sum(o.total)`.',
    solution: `SELECT round(sum(o.total) FILTER (WHERE c.vip) * 100.0 / sum(o.total), 1) AS vip_share
FROM orders o
JOIN customers c ON c.id = o.customer_id;`,
  },
  {
    id: 't46',
    moduleId: 'de-interview-wb',
    level: 'middle',
    title: 'Найдите обновлённые и удалённые записи',
    difficulty: 'medium',
    dataset: 'company',
    orderSensitive: true,
    tables: [],
    condition: [
      { t: 'p', text: 'Кейс с собеседования: есть `source` (новые данные) и `target` (старые данные), без CDC и триггеров. Нужно найти, что изменилось и что удалилось, только средствами SQL.' },
      { t: 'p', text: 'Дано: `source(id, name)` = (1, a), (2, b), (3, c); `target(id, name)` = (1, a), (2, b_old), (4, d). Запишите их через CTE `VALUES` прямо в запросе.' },
      { t: 'p', text: 'Выведите `id`, `old_name` (значение из target), `new_name` (из source; для удалённых — `NULL`) и `change_type` (`updated` или `deleted`). Отсортируйте по id.' },
    ],
    output: { columns: ['id', 'old_name', 'new_name', 'change_type'], note: '2 строки: id=2 updated, id=4 deleted.' },
    expected: `WITH source(id, name) AS (VALUES (1, 'a'), (2, 'b'), (3, 'c')),
     target(id, name) AS (VALUES (1, 'a'), (2, 'b_old'), (4, 'd'))
SELECT t.id,
       t.name AS old_name,
       s.name AS new_name,
       CASE WHEN s.id IS NULL THEN 'deleted' ELSE 'updated' END AS change_type
FROM target t
LEFT JOIN source s ON s.id = t.id
WHERE s.id IS NULL OR s.name IS DISTINCT FROM t.name
ORDER BY t.id;`,
    hint: '`LEFT JOIN target → source`, затем `WHERE s.id IS NULL OR s.name IS DISTINCT FROM t.name`.',
    solution: `WITH source(id, name) AS (VALUES (1, 'a'), (2, 'b'), (3, 'c')),
     target(id, name) AS (VALUES (1, 'a'), (2, 'b_old'), (4, 'd'))
SELECT t.id,
       t.name AS old_name,
       s.name AS new_name,
       CASE WHEN s.id IS NULL THEN 'deleted' ELSE 'updated' END AS change_type
FROM target t
LEFT JOIN source s ON s.id = t.id
WHERE s.id IS NULL OR s.name IS DISTINCT FROM t.name
ORDER BY t.id;`,
  },
];

export function taskSummary() {
  return TASKS.map(({ id, title, moduleId, level, difficulty, dataset }) => ({ id, title, moduleId, level, difficulty, dataset }));
}
