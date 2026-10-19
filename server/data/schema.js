// Схемы БД и seed-данные для тренажёра и песочницы (PostgreSQL).

// --- Хелперы для генерации SQL-литералов ---
const str = (s) => (s === null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => (a.length ? `ARRAY[${a.map(str).join(',')}]::text[]` : `ARRAY[]::text[]`);
const json = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
const num = (n) => (n === null ? 'NULL' : String(n));

// ============================================================================
// Набор данных: "Компания (HR)" — сотрудники, отделы, проекты
// ============================================================================

const companyDdl = `
CREATE TABLE departments (
  id serial PRIMARY KEY,
  name text NOT NULL,
  budget numeric(12,2),
  city text
);

CREATE TABLE employees (
  id serial PRIMARY KEY,
  name text NOT NULL,
  department_id int REFERENCES departments(id),
  manager_id int REFERENCES employees(id),
  salary numeric(10,2) NOT NULL,
  hired_at date NOT NULL,
  email text,
  skills text[],
  meta jsonb
);

CREATE TABLE projects (
  id serial PRIMARY KEY,
  name text NOT NULL,
  budget numeric(12,2),
  start_date date,
  end_date date,
  status text
);

CREATE TABLE employee_projects (
  employee_id int REFERENCES employees(id),
  project_id int REFERENCES projects(id),
  role text,
  hours int,
  PRIMARY KEY (employee_id, project_id)
);
`;

const companyDepartments = [
  [1, 'Engineering', 1200000, 'Berlin'],
  [2, 'Marketing', 400000, 'Berlin'],
  [3, 'Sales', 800000, 'London'],
  [4, 'HR', 300000, 'London'],
  [5, 'Support', 250000, null],
  [6, 'Legal', 200000, 'Berlin'],
];

// name, department_id, manager_id, salary, hired_at, email, skills, meta
const companyEmployees = [
  ['Alice Johnson', 1, null, 150000, '2015-03-12', 'alice@corp.io', ['sql', 'python', 'architecture'], { level: 5, tags: ['lead'], active: true }],
  ['Bob Smith', 1, 1, 120000, '2017-07-01', 'bob@corp.io', ['sql', 'python'], { level: 4, tags: ['backend'], active: true }],
  ['Carol White', 1, 1, 125000, '2018-01-15', 'carol@corp.io', ['sql', 'js', 'devops'], { level: 4, tags: ['backend'], active: true }],
  ['Dan Brown', 1, 2, 90000, '2019-05-20', 'dan@corp.io', ['sql', 'js'], { level: 3, tags: ['frontend'], active: false }],
  ['Eve Davis', 1, 2, 95000, '2020-11-02', null, ['sql', 'python'], { level: 3, tags: ['backend'], active: true }],
  ['Frank Miller', 1, 3, 85000, '2021-02-14', 'frank@corp.io', ['js'], { level: 2, tags: ['frontend'], active: true }],
  ['Grace Wilson', 2, null, 110000, '2016-09-30', 'grace@corp.io', ['sql', 'analytics'], { level: 4, tags: ['analytics'], active: true }],
  ['Henry Moore', 2, 7, 78000, '2019-08-08', 'henry@corp.io', ['sql'], { level: 3, tags: ['analytics'], active: true }],
  ['Ivy Taylor', 2, 7, 72000, '2022-04-18', null, ['excel'], { level: 2, tags: ['content'], active: true }],
  ['Jack Anderson', 3, null, 130000, '2014-10-05', 'jack@corp.io', ['sql', 'crm'], { level: 4, tags: ['sales'], active: true }],
  ['Kate Thomas', 3, 10, 88000, '2020-06-25', 'kate@corp.io', ['sql'], { level: 3, tags: ['sales'], active: true }],
  ['Leo Jackson', 3, 10, 82000, '2021-12-01', 'leo@corp.io', ['sql', 'crm'], { level: 3, tags: ['sales'], active: false }],
  ['Mia Harris', 4, null, 95000, '2018-04-11', 'mia@corp.io', ['sql', 'hr'], { level: 3, tags: ['hr'], active: true }],
  ['Noah Martin', 4, 13, 65000, '2023-01-09', 'noah@corp.io', ['hr'], { level: 2, tags: ['hr'], active: true }],
  ['Olivia Clark', 5, null, 80000, '2019-12-12', 'olivia@corp.io', ['sql'], { level: 3, tags: ['support'], active: true }],
  ['Peter Lewis', 5, 15, 60000, '2022-09-03', 'peter@corp.io', [], { level: 1, tags: [], active: true }],
];

const companyProjects = [
  [1, 'Atlas', 500000, '2021-01-01', '2022-06-30', 'completed'],
  [2, 'Beacon', 300000, '2022-03-01', '2023-12-31', 'active'],
  [3, 'Comet', 150000, '2023-01-15', '2023-09-30', 'completed'],
  [4, 'Drift', 200000, '2023-05-01', null, 'active'],
  [5, 'Echo', 90000, '2024-01-10', null, 'planned'],
  [6, 'Falcon', 250000, '2020-06-01', '2021-05-31', 'completed'],
];

// employee_id, project_id, role, hours
const companyAssignments = [
  [1, 1, 'lead', 600], [2, 1, 'dev', 800], [3, 1, 'dev', 750], [4, 1, 'dev', 400],
  [1, 2, 'lead', 300], [3, 2, 'dev', 500], [5, 2, 'dev', 450], [7, 2, 'analyst', 200],
  [10, 3, 'sponsor', 50], [11, 3, 'dev', 400], [12, 3, 'dev', 350], [7, 3, 'analyst', 120], [8, 3, 'analyst', 150],
  [1, 4, 'lead', 250], [2, 4, 'dev', 300], [13, 4, 'hr', 100],
  [15, 5, 'support', 150],
  [10, 6, 'sponsor', 80], [11, 6, 'dev', 600], [2, 6, 'dev', 300],
];

function companySeedSql() {
  const rows = [];
  for (const d of companyDepartments) {
    rows.push(`INSERT INTO departments (id, name, budget, city) VALUES (${d[0]}, ${str(d[1])}, ${num(d[2])}, ${str(d[3])});`);
  }
  for (const e of companyEmployees) {
    rows.push(`INSERT INTO employees (name, department_id, manager_id, salary, hired_at, email, skills, meta) VALUES (${str(e[0])}, ${e[1] ?? 'NULL'}, ${e[2] ?? 'NULL'}, ${num(e[3])}, ${str(e[4])}, ${str(e[5])}, ${arr(e[6])}, ${json(e[7])});`);
  }
  for (const p of companyProjects) {
    rows.push(`INSERT INTO projects (id, name, budget, start_date, end_date, status) VALUES (${p[0]}, ${str(p[1])}, ${num(p[2])}, ${str(p[3])}, ${str(p[4])}, ${str(p[5])});`);
  }
  for (const a of companyAssignments) {
    rows.push(`INSERT INTO employee_projects (employee_id, project_id, role, hours) VALUES (${a[0]}, ${a[1]}, ${str(a[2])}, ${a[3]});`);
  }
  return rows.join('\n');
}

// ============================================================================
// Набор данных: "Магазин (E-commerce)" — клиенты, заказы, товары
// ============================================================================

const shopDdl = `
CREATE TABLE customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  city text,
  country text NOT NULL,
  created_at date NOT NULL,
  vip boolean DEFAULT false
);

CREATE TABLE products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  tags text[]
);

CREATE TABLE orders (
  id serial PRIMARY KEY,
  customer_id int REFERENCES customers(id),
  order_date date NOT NULL,
  status text NOT NULL,
  total numeric(12,2) NOT NULL
);

CREATE TABLE order_items (
  id serial PRIMARY KEY,
  order_id int REFERENCES orders(id),
  product_id int REFERENCES products(id),
  quantity int NOT NULL,
  price numeric(10,2) NOT NULL
);
`;

const shopCustomers = [
  [1, 'Anna Novak', 'Warsaw', 'Poland', '2021-03-10', true],
  [2, 'Boris Petrov', 'Moscow', 'Russia', '2022-01-25', false],
  [3, 'Carla Gomez', 'Madrid', 'Spain', '2021-11-02', true],
  [4, 'Dmitri Volkov', 'Moscow', 'Russia', '2023-05-17', false],
  [5, 'Elena Rossi', 'Milan', 'Italy', '2022-09-30', true],
  [6, 'Franz Weber', 'Berlin', 'Germany', '2021-06-14', false],
  [7, 'Greta Anders', 'Stockholm', 'Sweden', '2023-02-08', false],
  [8, 'Hugo Blanc', 'Paris', 'France', '2022-12-01', true],
  [9, 'Ingrid Schulz', 'Berlin', 'Germany', '2023-06-01', false],
];

const shopProducts = [
  [1, 'Laptop Pro 15', 'electronics', 1800, ['laptop', 'pro']],
  [2, 'Wireless Mouse', 'electronics', 45, ['accessory', 'wireless']],
  [3, 'Mechanical Keyboard', 'electronics', 120, ['accessory', 'keyboard']],
  [4, 'USB-C Hub', 'electronics', 60, ['accessory']],
  [5, 'Office Chair', 'furniture', 320, ['furniture', 'office']],
  [6, 'Standing Desk', 'furniture', 750, ['furniture', 'office']],
  [7, 'Notebook A5', 'stationery', 8, ['paper']],
  [8, 'Fountain Pen', 'stationery', 95, ['pen', 'premium']],
];

// id, customer_id, order_date, status, total
const shopOrders = [
  [1, 1, '2023-01-05', 'delivered', 1860],
  [2, 2, '2023-02-14', 'delivered', 165],
  [3, 3, '2023-03-22', 'cancelled', 900],
  [4, 1, '2023-04-10', 'delivered', 380],
  [5, 4, '2023-05-03', 'shipped', 750],
  [6, 5, '2023-06-18', 'delivered', 1235],
  [7, 6, '2023-07-29', 'delivered', 120],
  [8, 2, '2023-08-11', 'delivered', 2088],
  [9, 8, '2023-09-05', 'shipped', 1800],
  [10, 7, '2023-10-02', 'new', 320],
];

// order_id, product_id, quantity, price
const shopItems = [
  [1, 1, 1, 1800], [1, 4, 1, 60],
  [2, 2, 1, 45], [2, 3, 1, 120],
  [3, 6, 1, 750], [3, 5, 1, 150],
  [4, 5, 1, 320], [4, 4, 1, 60],
  [5, 6, 1, 750],
  [6, 1, 1, 1000], [6, 3, 1, 120], [6, 8, 1, 95], [6, 7, 3, 20],
  [7, 3, 1, 120],
  [8, 1, 1, 1800], [8, 3, 2, 120], [8, 2, 2, 45], [8, 7, 3, 8],
  [9, 1, 1, 1800],
  [10, 5, 1, 320],
];

function shopSeedSql() {
  const rows = [];
  for (const c of shopCustomers) {
    rows.push(`INSERT INTO customers (id, name, city, country, created_at, vip) VALUES (${c[0]}, ${str(c[1])}, ${str(c[2])}, ${str(c[3])}, ${str(c[4])}, ${c[5]});`);
  }
  for (const p of shopProducts) {
    rows.push(`INSERT INTO products (id, name, category, price, tags) VALUES (${p[0]}, ${str(p[1])}, ${str(p[2])}, ${num(p[3])}, ${arr(p[4])});`);
  }
  for (const o of shopOrders) {
    rows.push(`INSERT INTO orders (id, customer_id, order_date, status, total) VALUES (${o[0]}, ${o[1]}, ${str(o[2])}, ${str(o[3])}, ${num(o[4])});`);
  }
  for (const i of shopItems) {
    rows.push(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (${i[0]}, ${i[1]}, ${i[2]}, ${num(i[3])});`);
  }
  return rows.join('\n');
}

// ============================================================================
// Реестр наборов данных
// ============================================================================

export const DATASETS = {
  company: {
    key: 'company',
    label: 'Компания (HR)',
    description: 'Сотрудники, отделы, проекты и назначения. Учебная база для тем: JOIN, агрегация, оконные функции, JSON, массивы, даты.',
    ddl: companyDdl,
    seedSql: companySeedSql(),
    tables: [
      { name: 'departments', columns: [['id', 'serial PK'], ['name', 'text'], ['budget', 'numeric'], ['city', 'text']] },
      { name: 'employees', columns: [['id', 'serial PK'], ['name', 'text'], ['department_id', 'int FK'], ['manager_id', 'int FK'], ['salary', 'numeric'], ['hired_at', 'date'], ['email', 'text'], ['skills', 'text[]'], ['meta', 'jsonb']] },
      { name: 'projects', columns: [['id', 'serial PK'], ['name', 'text'], ['budget', 'numeric'], ['start_date', 'date'], ['end_date', 'date'], ['status', 'text']] },
      { name: 'employee_projects', columns: [['employee_id', 'int FK'], ['project_id', 'int FK'], ['role', 'text'], ['hours', 'int']] },
    ],
  },
  shop: {
    key: 'shop',
    label: 'Магазин (E-commerce)',
    description: 'Клиенты, заказы, товары и позиции заказов. Учебная база для тем: подзапросы, JOIN, агрегация, ранжирование.',
    ddl: shopDdl,
    seedSql: shopSeedSql(),
    tables: [
      { name: 'customers', columns: [['id', 'serial PK'], ['name', 'text'], ['city', 'text'], ['country', 'text'], ['created_at', 'date'], ['vip', 'boolean']] },
      { name: 'products', columns: [['id', 'serial PK'], ['name', 'text'], ['category', 'text'], ['price', 'numeric'], ['tags', 'text[]']] },
      { name: 'orders', columns: [['id', 'serial PK'], ['customer_id', 'int FK'], ['order_date', 'date'], ['status', 'text'], ['total', 'numeric']] },
      { name: 'order_items', columns: [['id', 'serial PK'], ['order_id', 'int FK'], ['product_id', 'int FK'], ['quantity', 'int'], ['price', 'numeric']] },
    ],
  },
};
