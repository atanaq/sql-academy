export const LESSONS_DE_PYTHON = [
  {
    id: 'python-basics',
    title: 'Python: база для DE',
    icon: '🐍',
    level: 'junior',
    track: 'python',
    dataset: 'company',
    intro: "Python — основной язык для ETL, аналитики и оркестрации. Разберём типы, коллекции, функции и окружение так, как они нужны в ежедневной работе с данными.",
    outcomes: [
      "Уверенно выбирать коллекцию под задачу: list, tuple, dict или set",
      "Писать функции с именованными аргументами, `*args` и `**kwargs`",
      "Читать traceback и обрабатывать исключения, не скрывая ошибки",
      "Организовать проект: модули, виртуальное окружение, зависимости",
      "Применять идиомы Python при обработке данных",
    ],
    sections: [
      {
        id: 'py-basics-types',
        title: 'Типы данных и коллекции',
        blocks: [
          { t: 'p', text: "Python — язык с динамической, но строгой типизацией: тип известен во время выполнения, а неявных преобразований между строкой и числом нет. Переменная — это имя, которое ссылается на объект, а не ячейка памяти с зафиксированным типом." },
          { t: 'table', headers: ['Тип', 'Изменяемый', 'Когда нужен'], rows: [['int', 'нет', 'идентификаторы, счётчики, точные целые'], ['float', 'нет', 'измерения и приблизительные вычисления'], ['Decimal', 'нет', 'деньги и суммы, где важна точность'], ['str', 'нет', 'текст в Unicode'], ['bool', 'нет', 'флаги и признаки'], ['NoneType', 'нет', 'отсутствие значения'], ['list', 'да', 'упорядоченный набор, который меняется'], ['tuple', 'нет', 'фиксированная запись, ключ словаря'], ['dict', 'да', 'отображение ключ → значение, порядок вставки сохраняется'], ['set', 'да', 'уникальные значения и быстрая проверка вхождения']] },
          { t: 'code', lang: 'python', text: `from decimal import Decimal

employee = {
    'id': 101,
    'name': 'Анна',
    'salary': Decimal('185000.00'),
    'skills': ('sql', 'python'),
    'active': True,
}

print(employee['name'])
print(employee['salary'] * 12)
print(employee.get('city', 'не указан'))
print(len(employee['skills']))` },
          { t: 'note', kind: 'warn', text: "`0.1 + 0.2 == 0.3` возвращает `False`: float — двоичная дробь с конечной точностью. Для денег берите `Decimal` (или целые копейки), а float сравнивайте через `math.isclose`." },
          { t: 'note', kind: 'tip', text: "`None` — единственный объект в своём роде, поэтому его проверяют через `value is None`, а не через `== None`. Для всех остальных значений используйте `==`." },
        ],
      },
      {
        id: 'py-basics-collections',
        title: 'list, dict, set, tuple и срезы',
        blocks: [
          { t: 'p', text: "Срезы работают одинаково для строк, списков и кортежей: `seq[start:stop:step]`, где `stop` не включается. Отрицательные индексы считаются с конца, а срез создаёт новую последовательность, а не представление в память." },
          { t: 'code', lang: 'python', text: `names = ['Анна', 'Борис', 'Вера', 'Глеб', 'Дина']

print(names[0])        # Анна
print(names[-1])       # Дина
print(names[1:3])      # ['Борис', 'Вера']
print(names[:2])       # ['Анна', 'Борис']
print(names[2:])       # ['Вера', 'Глеб', 'Дина']
print(names[::2])      # ['Анна', 'Вера', 'Дина']
print(names[::-1])     # ['Дина', 'Глеб', 'Вера', 'Борис', 'Анна']
print(names[10:])      # []` },
          { t: 'code', lang: 'python', text: `skills_anna = {'sql', 'python', 'airflow'}
skills_boris = {'python', 'java'}

print(skills_anna & skills_boris)   # {'python'}
print(skills_anna - skills_boris)   # {'sql', 'airflow'}

by_dept = {'IT': 12, 'HR': 5}
by_dept['Sales'] = 8
by_dept['IT'] += 1
print(by_dept['IT'], len(by_dept))

cities = {'Москва', 'Казань', 'Москва'}
print(len(cities), sorted(cities))
print('Казань' in cities)` },
          { t: 'list', items: ["`len`, `in`, `sorted`, `min`, `max`, `sum` работают с любой последовательностью.", "`in` для списка — O(n), для `set` и `dict` — O(1) в среднем, поэтому проверку вхождения делают по множеству.", "`sorted` возвращает новый список, а `list.sort` сортирует на месте и возвращает `None`.", "Кортеж занимает меньше памяти, чем список, и может быть ключом словаря.", "`dict` с версии 3.7 гарантированно сохраняет порядок вставки, `set` порядок не гарантирует."] },
          { t: 'note', kind: 'tip', text: "Ключом словаря может быть только хешируемый объект: число, строка, кортеж из хешируемых элементов. Список ключом быть не может — используйте кортеж." },
          { t: 'note', kind: 'warn', text: "Присваивание `b = a` не копирует список, а создаёт второе имя для того же объекта. Копию даёт `a.copy()` или `a[:]`, но она поверхностная: для вложенных структур нужен `copy.deepcopy`." },
        ],
      },
      {
        id: 'py-basics-flow',
        title: 'Циклы, comprehension, функции, *args и **kwargs',
        blocks: [
          { t: 'p', text: "Цикл `for` перебирает любой итерируемый объект, а `enumerate` и `zip` избавляют от ручных счётчиков и индексов. Comprehension короче цикла, но вложенность глубже двух уровней лучше развернуть в обычный `for`." },
          { t: 'code', lang: 'python', text: `names = ['Анна', 'Борис', 'Вера']
salaries = [185000, 142000, 210000]

for number, name in enumerate(names, start=1):
    print(number, name)

for name, salary in zip(names, salaries):
    print(name, salary)

high = [name for name, salary in zip(names, salaries) if salary > 150000]
by_name = {name: salary for name, salary in zip(names, salaries)}
average = sum(salaries) / len(salaries)` },
          { t: 'code', lang: 'python', text: `def annual(salary, months=12, *, bonus=0):
    return salary * months + bonus

print(annual(150000))
print(annual(150000, 13))
print(annual(150000, bonus=30000))
annual(150000, 12, 30000)   # TypeError: bonus передаётся только по имени` },
          { t: 'code', lang: 'python', text: `def report(title, *rows, sep=' | ', **meta):
    print(title)
    for row in rows:
        print(sep.join(str(cell) for cell in row))
    for key, value in meta.items():
        print(f'{key}: {value}')

report('Зарплаты', ('Анна', 185000), ('Борис', 142000), sep=' -> ', source='hr')` },
          { t: 'code', lang: 'python', text: `from collections import Counter, defaultdict

rows = [
    {'dept': 'IT', 'salary': 185000},
    {'dept': 'HR', 'salary': 120000},
    {'dept': 'IT', 'salary': 210000},
]

counts = Counter(row['dept'] for row in rows)

by_dept = defaultdict(list)
for row in rows:
    by_dept[row['dept']].append(row['salary'])

average = {dept: sum(values) / len(values) for dept, values in by_dept.items()}
top = sorted(average.items(), key=lambda item: item[1], reverse=True)
print(counts, top)` },
          { t: 'list', items: ["`d.get(key, default)` вместо связки `if key in d` и `d[key]`.", "`enumerate` вместо ручного счётчика, `zip` вместо обращения по индексам.", "`first, *rest = values` и `a, b = b, a` — распаковка без временных переменных.", "`if not items:` вместо `if len(items) == 0:`.", "`any(...)` и `all(...)` вместо цикла с флагом.", "`{**first, **second}` и `[*a, *b]` собирают новую коллекцию, не меняя исходные."] },
          { t: 'note', kind: 'warn', text: "Значение по умолчанию вычисляется один раз при определении функции. `def add(tag, tags=[])` накапливает теги между вызовами: пишите `tags=None` и создавайте список внутри функции." },
        ],
      },
      {
        id: 'py-basics-modules',
        title: 'Модули, venv, исключения и чтение ошибок',
        blocks: [
          { t: 'p', text: "Проект на Python — это модули и пакеты, а зависимости ставятся в изолированное виртуальное окружение, чтобы версии библиотек не конфликтовали между задачами. Исключения — штатный механизм работы с ошибками: их ловят точечно, а traceback читают снизу вверх." },
          { t: 'code', lang: 'bash', text: `python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install requests pandas
pip freeze > requirements.txt
python -m etl.load` },
          { t: 'code', lang: 'python', text: `import json
from pathlib import Path


def read_config(path):
    try:
        text = Path(path).read_text(encoding='utf-8')
        return json.loads(text)
    except FileNotFoundError:
        raise FileNotFoundError(f'нет файла конфигурации: {path}')
    except json.JSONDecodeError as exc:
        raise ValueError(f'битый JSON в {path}') from exc
    finally:
        print('чтение завершено')` },
          { t: 'list', items: ["Последняя строка traceback — тип исключения и сообщение: с неё начинают разбор.", "Строка выше показывает файл и номер строки, где ошибка возникла.", "Блоки выше — стек вызовов; ищите первый кадр из вашего проекта, а не из библиотеки.", "`raise ... from exc` сохраняет исходную причину и делает traceback читаемым.", "`except Exception: pass` скрывает ошибку — так делать нельзя."] },
          { t: 'note', kind: 'tip', text: "Ловите самые узкие исключения: `KeyError`, `ValueError`, `FileNotFoundError`, `requests.Timeout`. Голый `except:` перехватывает и `KeyboardInterrupt`, поэтому в рабочем коде его не используют." },
          { t: 'note', kind: 'info', text: "В Windows активируют скрипт `Activate.ps1` из каталога `Scripts` внутри `.venv`. Команды `python`, `pip` и `pytest` после активации те же, что и в Linux." },
        ],
      },
      {
        id: 'py-basics-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'p', text: "Эти ошибки почти никогда не ломают скрипт сразу — они тихо портят результат или всплывают на проде. Проверяйте код на них до ревью." },
          { t: 'list', items: ["**Изменяемое значение по умолчанию**: `def add(tag, tags=[])` накапливает данные между вызовами.", "**Изменение списка во время итерации**: удаление элементов в цикле `for` пропускает часть из них; итерируйтесь по копии или собирайте новый список.", "**`is` вместо `==`**: сравнение чисел и строк через `is` работает случайно, а `== None` — наоборот, нужно `is None`.", "**Копия через присваивание**: `b = a` даёт второе имя, поэтому изменение `b` меняет `a`.", "**`except Exception: pass`**: ошибка исчезает бесследно, и битые данные уходят дальше по пайплайну.", "**Сравнение float на равенство**: `0.1 + 0.2 == 0.3` ложно; используйте `math.isclose` или `Decimal`.", "**`/` вместо `//`**: в Python 3 оператор `/` всегда возвращает float, даже для двух целых.", "**Ожидание порядка от `set`**: множество не упорядочено, хотя `dict` порядок вставки сохраняет."] },
          { t: 'note', kind: 'warn', text: "`round` и `float` не годятся для денег: `round(2.675, 2)` даёт `2.67`, потому что число хранится чуть ниже точной границы. Считайте в `Decimal` или в целых копейках." },
        ],
      },
      {
        id: 'py-basics-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'p', text: "На junior-позиции спрашивают не синтаксис, а понимание модели объектов и умение объяснить последствия решения. Отвечайте коротко и сразу переходите к примеру из практики." },
          { t: 'table', headers: ['Вопрос', 'Ключевое в ответе'], rows: [['Чем `list` отличается от `tuple`?', 'Изменяемость, хешируемость, память; tuple — фиксированная запись и годится в ключи словаря.'], ['Почему `def f(x, acc=[])` — плохая идея?', 'Значение по умолчанию создаётся один раз при определении функции и живёт между вызовами.'], ['`is` и `==` — в чём разница?', '`is` сравнивает идентичность объектов, `==` — значения; `None` проверяют через `is`.'], ['list или set для проверки вхождения?', 'set даёт O(1) в среднем, list — O(n); элементы set должны быть хешируемы.'], ['Что такое генератор?', 'Ленивый итератор: значения считаются по требованию, память не растёт с объёмом данных, повторный проход невозможен.'], ['Почему `0.1 + 0.2 != 0.3`?', 'Двоичное представление float конечно, накапливается погрешность; деньги — `Decimal`, сравнение — `math.isclose`.'], ['Что такое GIL?', 'В CPython байткод исполняет один поток; I/O выигрывает от потоков, CPU-задачи — от процессов.'], ['Как работает `with`?', 'Вызывает `__enter__` и гарантированно `__exit__` при выходе, в том числе при исключении.']] },
          { t: 'note', kind: 'tip', text: "Если спрашивают про производительность, назовите сложность операции и предложите замер через `time.perf_counter`. Ответ без цифр звучит убедительнее, если вы называете, что именно замерили бы." },
        ],
      },
    ],
  },

  {
    id: 'python-files',
    title: 'Python: файлы, CSV, JSON, API',
    icon: '📄',
    level: 'junior',
    track: 'python',
    dataset: 'company',
    intro: "Данные приходят файлами, JSON-ами и по HTTP. Разберём потоковое чтение, кодировки и ETL-скрипт, который переживает сбои сети.",
    outcomes: [
      "Читать файлы через `with` и объяснять, зачем нужен контекстный менеджер",
      "Работать с CSV и JSON без потери кодировки и с корректным экранированием",
      "Строить пути через `pathlib` вместо склейки строк",
      "Забирать данные из API с пагинацией, таймаутами и ретраями",
      "Обрабатывать большие файлы построчно и генераторами",
    ],
    sections: [
      {
        id: 'py-files-open',
        title: 'open, with, кодировки и большие файлы',
        blocks: [
          { t: 'p', text: "`open` возвращает файловый объект, который нужно закрыть, а `with` делает это даже при исключении. Файл итерируется построчно, поэтому чтение не загружает его в память целиком." },
          { t: 'code', lang: 'python', text: `from pathlib import Path

path = Path('data') / 'events.jsonl'

with open(path, encoding='utf-8') as handle:
    for line in handle:
        line = line.strip()
        if line:
            print(line)` },
          { t: 'code', lang: 'python', text: `def read_batches(path, size=1000):
    batch = []
    with open(path, encoding='utf-8') as handle:
        for line in handle:
            batch.append(line.strip())
            if len(batch) >= size:
                yield batch
                batch = []
    if batch:
        yield batch


total = 0
for batch in read_batches('data/events.jsonl'):
    total += len(batch)
print(total)` },
          { t: 'code', lang: 'python', text: `from contextlib import contextmanager
import time


@contextmanager
def timer(label):
    started = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - started
        print(f'{label}: {elapsed:.2f} c')


with timer('чтение файла'):
    with open('data/events.jsonl', encoding='utf-8') as handle:
        for _ in handle:
            pass` },
          { t: 'list', items: ["`read()` и `readlines()` держат файл в памяти целиком; для больших объёмов итерируйте файл или читайте батчами.", "Генератор отдаёт данные по мере чтения, но пройти его можно только один раз.", "CSV больших объёмов удобнее читать через `csv.reader` в цикле или `pandas.read_csv` с `chunksize`.", "`with` вызывает `__exit__` при любом выходе: исключение, `return`, `break`.", "Свой менеджер контекста пишут через `@contextmanager` или класс с `__enter__` и `__exit__`."] },
          { t: 'note', kind: 'warn', text: "Без `encoding` Python берёт кодировку локали: на Windows это часто cp1251, на Linux — UTF-8. Один и тот же скрипт читал бы файл по-разному. UTF-8 с BOM читают как `utf-8-sig`." },
        ],
      },
      {
        id: 'py-files-pathlib',
        title: 'pathlib, os и JSON',
        blocks: [
          { t: 'p', text: "`pathlib` заменяет ручную склейку путей: оператор `/` соединяет части, а `read_text`, `glob` и `mkdir` покрывают типовые операции. JSON в Python представлен обычными `dict` и `list`, поэтому сериализация почти бесплатна." },
          { t: 'code', lang: 'python', text: `from pathlib import Path

base = Path('data')
raw = base / 'raw'
raw.mkdir(parents=True, exist_ok=True)

report = base / 'report.json'
report.write_text('{}', encoding='utf-8')

for path in sorted(base.glob('*.csv')):
    print(path.name, path.suffix, path.stat().st_size)

print(report.exists(), report.resolve())` },
          { t: 'code', lang: 'python', text: `import json
from pathlib import Path

path = Path('data') / 'report.json'

payload = {'date': '2026-10-20', 'total': 3, 'items': [{'id': 1}]}

with open(path, 'w', encoding='utf-8') as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)

with open(path, encoding='utf-8') as handle:
    loaded = json.load(handle)

print(loaded['items'][0]['id'])
print(json.dumps({'name': 'Анна'}, ensure_ascii=False))` },
          { t: 'table', headers: ['Задача', 'Как в pathlib'], rows: [['соединить пути', "`Path('data') / 'employees.csv'`"], ['создать каталог', "`path.mkdir(parents=True, exist_ok=True)`"], ['найти файлы', "`path.glob('*.csv')`, `path.rglob('*.json')`"], ['прочитать текст', "`path.read_text(encoding='utf-8')`"], ['имя, расширение, родитель', '`path.name`, `path.suffix`, `path.parent`'], ['абсолютный путь', '`path.resolve()`']] },
          { t: 'note', kind: 'info', text: "`os` по-прежнему нужен: переменные окружения читают через `os.environ`, а `os.replace` даёт атомарную замену файла. Для новых путей в коде предпочитают `pathlib`." },
        ],
      },
      {
        id: 'py-files-csv-api',
        title: 'CSV, API и ETL-скрипт',
        blocks: [
          { t: 'p', text: "CSV только выглядит простым: внутри бывают запятые в кавычках и переводы строк, поэтому разбирать его делением строки нельзя. API отдаёт данные страницами, и надёжный клиент обязан ставить таймаут, повторять только временные ошибки и соблюдать пагинацию." },
          { t: 'code', lang: 'python', text: `import csv
from pathlib import Path

path = Path('data') / 'employees.csv'

with open(path, encoding='utf-8', newline='') as handle:
    reader = csv.DictReader(handle)
    for row in reader:
        print(row['id'], row['name'], row['salary'])

out = Path('data') / 'employees_clean.csv'
with open(out, 'w', encoding='utf-8', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=['id', 'name', 'email'])
    writer.writeheader()
    writer.writerow({'id': 101, 'name': 'Анна', 'email': 'anna@example.com'})` },
          { t: 'code', lang: 'python', text: `import time
import requests

session = requests.Session()
session.headers.update({'Accept': 'application/json'})


def get_json(url, params, attempts=5):
    for attempt in range(1, attempts + 1):
        try:
            response = session.get(url, params=params, timeout=10)
            if response.status_code == 429 or response.status_code >= 500:
                raise RuntimeError(f'временная ошибка {response.status_code}')
            response.raise_for_status()
            return response.json()
        except (requests.Timeout, requests.ConnectionError, RuntimeError):
            if attempt == attempts:
                raise
            time.sleep(min(2 ** attempt, 30))


def iter_employees(url):
    cursor = None
    while True:
        params = {'limit': 100}
        if cursor:
            params['cursor'] = cursor
        page = get_json(url, params)
        yield from page['items']
        cursor = page.get('next_cursor')
        if not cursor:
            break` },
          { t: 'code', lang: 'python', text: `from pathlib import Path
import csv
import json

BASE = Path('data')
OUT_DIR = BASE / 'processed'
OUT_DIR.mkdir(parents=True, exist_ok=True)


def extract(path):
    with open(path, encoding='utf-8', newline='') as handle:
        yield from csv.DictReader(handle)


def transform(rows):
    for row in rows:
        email = (row.get('email') or '').strip().lower()
        if not email:
            continue
        yield {
            'id': int(row['id']),
            'name': row['name'].strip(),
            'email': email,
            'salary': float(row['salary']),
        }


def load(rows, path):
    with open(path, 'w', encoding='utf-8') as handle:
        for row in rows:
            print(json.dumps(row, ensure_ascii=False), file=handle)


if __name__ == '__main__':
    rows = extract(BASE / 'employees.csv')
    clean = transform(rows)
    load(clean, OUT_DIR / 'employees.jsonl')` },
          { t: 'note', kind: 'warn', text: "Ретрай без ограничения попыток и без паузы превращает сбой API в лавину запросов. Повторяйте только таймауты, обрывы соединения, 429 и 5xx; на 400 и 404 повтор бессмыслен. Для 429 полезно уважать заголовок `Retry-After`." },
        ],
      },
      {
        id: 'py-files-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'p', text: "Файловые и сетевые скрипты падают не от сложной логики, а от мелочей окружения: кодировки, переводы строк, отсутствие таймаута. Все они воспроизводятся на другом компьютере или в CI." },
          { t: 'list', items: ["**Забыть `encoding`**: на другой ОС файл прочитается мусором или упадёт с `UnicodeDecodeError`.", "**Читать файл целиком через `read()`**, когда он больше доступной памяти.", "**Парсить CSV через `split(',')`**: сломается на кавычках и запятых внутри поля.", "**Писать CSV без `newline=''`**: на Windows появятся лишние пустые строки.", "**Вызывать `requests.get` без `timeout`**: зависший сокет остановит весь пайплайн.", "**Повторять любой ответ**, включая 400 и 404, где ошибка в запросе, а не в сети.", "**Хранить токены в коде**: их место — переменные окружения или секрет-хранилище.", "**Перезаписывать результат на месте**: падение в середине оставит недописанный файл, пишите во временный и делайте `os.replace`.", "**`json.dumps` без `ensure_ascii=False`**: кириллица превращается в escape-коды, файл нечитаем глазами."] },
          { t: 'note', kind: 'warn', text: "Склейка путей через `+` ломается на разделителях и абсолютных путях: `'data' + '/f.csv'` даёт лишний слэш. Оператор `/` у `Path` решает это и нормализует путь." },
        ],
      },
      {
        id: 'py-files-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'p', text: "Вопросы про файлы и API проверяют, думаете ли вы про память, кодировки и повторные запуски. Хороший ответ всегда содержит ограничение: когда приём не подходит." },
          { t: 'table', headers: ['Вопрос', 'Ключевое в ответе'], rows: [['Зачем явно указывать `encoding`?', 'Кодировка по умолчанию зависит от ОС и локали; явная делает поведение воспроизводимым.'], ["Почему в CSV нужен `newline=''`?", 'Модуль csv сам управляет переводами строк; иначе на Windows появляются пустые строки.'], ['Как не загрузить файл в память целиком?', 'Итерировать файл построчно, читать батчами, использовать генераторы или `chunksize`.'], ['Зачем `timeout` в requests?', 'Без него зависшее соединение блокирует процесс; таймаут ограничивает ожидание.'], ['Чем cursor-пагинация лучше offset?', 'offset сдвигается при вставках и пропускает или дублирует строки; cursor привязан к позиции в наборе.'], ['Какие ошибки имеет смысл ретраить?', 'Таймауты, обрывы соединения, 429 и 5xx; 400 и 404 повторять бессмысленно.'], ['Как сделать запись файла безопасной?', 'Писать во временный файл в том же каталоге и заменять целевой через `os.replace`.']] },
          { t: 'note', kind: 'tip', text: "Про пагинацию почти всегда спрашивают продолжение: что будет, если данные изменятся между страницами. Ответ про cursor и стабильный порядок сортировки показывает практический опыт." },
        ],
      },
    ],
  },

  {
    id: 'python-pandas',
    title: 'pandas для Data Engineer',
    icon: '🐼',
    level: 'middle',
    track: 'python',
    dataset: 'company',
    intro: "pandas — рабочий инструмент для табличных преобразований: очистки, соединений и агрегаций. Главное — понимать типы, индекс и разницу между копией и представлением.",
    outcomes: [
      "Осознанно выбирать dtypes и оценивать память датафрейма",
      "Чистить пропуски, дубликаты и приводить типы",
      "Строить агрегации, соединения и сводные таблицы",
      "Заменять `apply` векторными операциями там, где это важно для скорости",
      "Обходить chained assignment и `SettingWithCopyWarning`",
    ],
    sections: [
      {
        id: 'py-pandas-frame',
        title: 'Series, DataFrame, dtypes и NaN',
        blocks: [
          { t: 'p', text: "`Series` — одномерный массив со своим индексом, `DataFrame` — набор столбцов, выровненных по общему индексу. Операции выравниваются по меткам, а не по позициям, поэтому индекс — часть данных, а не просто нумерация строк." },
          { t: 'code', lang: 'python', text: `import pandas as pd

df = pd.read_csv(
    'data/employees.csv',
    dtype={'id': 'Int64', 'salary': 'float64'},
    parse_dates=['hired_at'],
    usecols=['id', 'name', 'salary', 'department', 'hired_at'],
)

print(df.shape)
print(df.dtypes)
print(df.info(memory_usage='deep'))` },
          { t: 'code', lang: 'python', text: `import pandas as pd

left = pd.Series([100, 200], index=['a', 'b'])
right = pd.Series([10, 20], index=['b', 'c'])

print(left + right)
# a   NaN
# b  210.0
# c   NaN: выравнивание по меткам, а не по позициям` },
          { t: 'table', headers: ['dtype', 'Что означает', 'Замечание'], rows: [['int64', 'целые без пропусков', 'при появлении NaN столбец станет float64'], ['Int64', 'целые с поддержкой `pd.NA`', 'nullable-расширение, память как у int64'], ['float64', 'числа с плавающей точкой', '`NaN` — штатное значение пропуска'], ['object', 'произвольные Python-объекты, чаще строки', 'медленно и расточительно по памяти'], ['string', 'строки с `pd.NA`', 'предпочтительнее `object` для текста'], ['category', 'повторяющиеся категории', 'экономия памяти при низкой кардинальности'], ['bool / boolean', 'логический тип', '`boolean` поддерживает `pd.NA`'], ['datetime64[ns]', 'дата и время', 'часовой пояс хранится отдельно']] },
          { t: 'note', kind: 'info', text: "`NaN` — это float, поэтому `NaN == NaN` даёт `False`. Проверяйте пропуски через `df['col'].isna()`, а не сравнением. Для целых столбцов с пропусками берите `Int64`, иначе pandas молча сделает из него `float64`." },
        ],
      },
      {
        id: 'py-pandas-clean',
        title: 'Очистка, фильтры, groupby, merge и pivot',
        blocks: [
          { t: 'p', text: "Большая часть работы — привести типы, убрать дубликаты, отфильтровать мусор и свести таблицы вместе. Каждое соединение стоит проверять на кратность, иначе строки незаметно размножатся и метрики поедут." },
          { t: 'code', lang: 'python', text: `df['email'] = df['email'].str.strip().str.lower()
df['phone'] = df['phone'].str.replace('[^0-9]', '', regex=True)

df = df.dropna(subset=['email', 'salary'])
df['salary'] = df['salary'].astype('float64')
df['department'] = df['department'].fillna('unknown').astype('category')

print(df.duplicated(subset=['email']).sum())
df = df.drop_duplicates(subset=['email'], keep='last')` },
          { t: 'code', lang: 'python', text: `high = df[(df['salary'] > 150000) & (df['department'] == 'IT')]
it_only = df[df['department'].isin(['IT', 'HR'])]
recent = df.query("salary > 150000 and department == 'IT'")
by_salary = df.sort_values(['department', 'salary'], ascending=[True, False])` },
          { t: 'code', lang: 'python', text: `summary = (
    df.groupby(['department', 'seniority'], as_index=False, observed=True)
      .agg(employees=('id', 'count'), avg_salary=('salary', 'mean'))
      .sort_values('avg_salary', ascending=False)
)

merged = df.merge(
    departments,
    how='left',
    left_on='department_id',
    right_on='id',
    suffixes=('_emp', '_dep'),
    validate='many_to_one',
)

pivot = merged.pivot_table(
    index='department_name',
    columns='seniority',
    values='salary',
    aggfunc='mean',
    fill_value=0,
)` },
          { t: 'list', items: ["`how` задаёт тип соединения: `inner`, `left`, `right`, `outer`.", "`validate='many_to_one'` падает с `MergeError`, если ключ правой таблицы не уникален, — лучшая страховка от размножения строк.", "`indicator=True` добавляет столбец `_merge` и показывает, откуда пришла каждая строка.", "`pivot_table` сразу агрегирует дубликаты, а `pivot` требует уникальных пар индекс-столбец и падает при повторе.", "`melt` превращает широкую таблицу в длинную, `pivot` — обратно.", "`groupby` по умолчанию отбрасывает `NaN` в ключах; `dropna=False` сохраняет их отдельной группой."] },
          { t: 'note', kind: 'tip', text: "`sort_values` по умолчанию ставит `NaN` в конец, `na_position='first'` меняет порядок. Сортировка стабильна, поэтому список столбцов в `by` задаёт приоритет ключей слева направо." },
        ],
      },
      {
        id: 'py-pandas-perf',
        title: 'apply, память и chained assignment',
        blocks: [
          { t: 'p', text: "pandas быстр, пока вычисления идут в векторизованном коде. `apply` — скрытый цикл на Python, и на миллионах строк он становится узким местом. Отдельная ловушка — присваивание через цепочку индексаций." },
          { t: 'code', lang: 'python', text: `import numpy as np
import pandas as pd

# медленно: Python-функция вызывается для каждой строки
df['annual'] = df.apply(lambda row: row['salary'] * 12, axis=1)

# быстро: одна векторная операция над столбцом
df['annual'] = df['salary'] * 12

# строки — через аксессор .str, а не через apply
df['email'] = df['email'].str.strip().str.lower()

# условная логика — np.where или np.select
df['grade'] = np.where(df['salary'] > 150000, 'senior', 'regular')` },
          { t: 'code', lang: 'python', text: `import numpy as np

# ловушка: df[...] может вернуть копию, присваивание уйдёт в неё
df[df['salary'] > 150000]['grade'] = 'senior'

# правильно: одна операция .loc
df.loc[df['salary'] > 150000, 'grade'] = 'senior'

# правильно: новый датафрейм без мутации исходного
df = df.assign(grade=np.where(df['salary'] > 150000, 'senior', 'regular'))` },
          { t: 'list', items: ["`SettingWithCopyWarning` означает, что присваивание может уйти в копию и не изменить исходный датафрейм.", "`df[df['a'] > 1]['b'] = 0` — цепочка из двух индексаций, результат не гарантирован.", "`df.loc[df['a'] > 1, 'b'] = 0` — одна индексация, присваивание предсказуемо.", "`df.copy()` убирает предупреждение, но не исправляет логику: если нужна одна ячейка, используйте `.loc`.", "В pandas 3.x Copy-on-Write включён по умолчанию, и цепочное присваивание просто ничего не меняет.", "`inplace=True` возвращает `None` и мешает цепочкам методов; в новом коде его избегают."] },
          { t: 'code', lang: 'python', text: `df['department'] = df['department'].astype('category')
df['id'] = pd.to_numeric(df['id'], downcast='integer')
df['salary'] = pd.to_numeric(df['salary'], downcast='float')
print(df.info(memory_usage='deep'))

chunks = pd.read_csv(
    'data/employees.csv',
    usecols=['id', 'salary'],
    chunksize=100_000,
)
for chunk in chunks:
    print(chunk.shape)` },
          { t: 'note', kind: 'info', text: "CSV хранит текст и теряет типы, Parquet хранит схему и сжимает данные по столбцам, поэтому `read_parquet` обычно быстрее и дешевле по памяти. Для повторяющихся строковых столбцов `category` даёт кратную экономию." },
        ],
      },
      {
        id: 'py-pandas-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'p', text: "Ошибки pandas редко бывают синтаксическими: они проявляются как неверные цифры в отчёте. Половина из них связана с индексом и с тем, что операция вернула копию." },
          { t: 'list', items: ["**Chained assignment** вместо `.loc`: присваивание может не дойти до исходного датафрейма.", "**`df[df.a > 1 & df.b == 0]`** без скобок: `&` связывает сильнее `>`, нужны скобки вокруг каждого условия.", "**Сравнение с `NaN`** через `==`: всегда пусто, используйте `isna()` и `notna()`.", "**`merge` без `validate`**: соединение many-to-many тихо размножает строки.", "**`object` для чисел и дат**: медленные операции и сортировка как у строк.", "**`append` в цикле**: удалён в pandas 2.0, используйте `pd.concat`.", "**Забыть `reset_index()`** после `groupby` и потом искать пропавший столбец.", "**`apply(axis=1)`** там, где достаточно арифметики над столбцами.", "**`inplace=True` в цепочке методов**: выражение вернёт `None`, и следующий вызов упадёт."] },
          { t: 'note', kind: 'warn', text: "После `groupby` с `as_index=True` ключ группы становится индексом. Нужен обычный столбец — `reset_index()`; нужны и агрегат, и исходная форма строк — `transform` вместо `agg`." },
        ],
      },
      {
        id: 'py-pandas-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'p', text: "На middle-позиции спрашивают про воспроизводимость результата и стоимость по памяти. Умение объяснить, почему строк стало больше после `merge`, ценится выше знания десятка методов." },
          { t: 'table', headers: ['Вопрос', 'Ключевое в ответе'], rows: [['`loc` и `iloc` — в чём разница?', '`loc` — по меткам индекса и именам столбцов, `iloc` — по целочисленным позициям.'], ['Почему появляется `SettingWithCopyWarning`?', 'Присваивание идёт в объект, который может быть копией; pandas не гарантирует изменение исходного датафрейма.'], ['`count` и `size` в `groupby`?', '`count` считает непустые значения, `size` — все строки группы, включая пропуски.'], ['Чем опасен merge many-to-many?', 'Строки размножаются, метрики завышаются; `validate` превращает это в явную ошибку.'], ['`apply` или векторизация?', 'Векторизованные операции выполняются в C и быстрее; `apply` — цикл Python для нестандартной логики.'], ['Как уменьшить память датафрейма?', '`category` для повторяющихся строк, downcast чисел, `usecols`, Parquet вместо CSV, чтение чанками.'], ['Что такое Copy-on-Write?', 'Режим pandas 3.x: модификация создаёт копию, цепочное присваивание не работает.'], ['Как проверить, что соединение не размножило строки?', 'Сравнить `len` до и после, задать `validate` и проверить уникальность ключа через `duplicated`.']] },
          { t: 'note', kind: 'tip', text: "Если спросят про большие данные, честный ответ: pandas работает в памяти одной машины. Дальше уместно назвать Polars, DuckDB или Spark — и объяснить, по какому признаку выбирают инструмент." },
        ],
      },
    ],
  },

  {
    id: 'python-testing',
    title: 'Тесты, логирование и качество Python-кода',
    icon: '✅',
    level: 'middle',
    track: 'python',
    dataset: 'company',
    intro: "Код, который сработал один раз на ноутбуке, и код, которому доверяют в проде, различаются тестами, логами и воспроизводимостью. Разберём pytest, логирование, типизацию и CI.",
    outcomes: [
      "Писать тесты на pytest с fixtures и parametrize",
      "Подменять внешние зависимости через mock и не тестировать сеть",
      "Настроить logging вместо print и объяснить уровни",
      "Добавить типы, линтер и форматтер в проект",
      "Сделать скрипт идемпотентным и запускать проверки в CI",
    ],
    sections: [
      {
        id: 'py-test-pytest',
        title: 'pytest: тесты, fixtures, parametrize, mock',
        blocks: [
          { t: 'p', text: "pytest находит файлы `test_*.py` и функции `test_*`, а обычный `assert` в нём информативен: при падении видно значения обеих сторон. Тест проверяет поведение, а не повторяет реализацию функции." },
          { t: 'code', lang: 'python', text: `# tests/test_transform.py
import pytest

from etl.transform import normalize_email


def test_normalize_email_lowercases_and_strips():
    assert normalize_email('  Anna@Example.COM ') == 'anna@example.com'


def test_normalize_email_rejects_empty():
    with pytest.raises(ValueError, match='пустой email'):
        normalize_email('   ')` },
          { t: 'code', lang: 'python', text: `# tests/conftest.py
import sqlite3

import pytest


@pytest.fixture
def connection():
    conn = sqlite3.connect(':memory:')
    conn.execute('CREATE TABLE employees (id INTEGER PRIMARY KEY, email TEXT UNIQUE)')
    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture
def employees(connection):
    rows = [(1, 'a@example.com'), (2, 'b@example.com')]
    connection.executemany('INSERT INTO employees VALUES (?, ?)', rows)
    return rows` },
          { t: 'code', lang: 'python', text: `import pytest
from unittest.mock import patch

from etl.load import load_page
from etl.transform import normalize_email


@pytest.mark.parametrize(
    'raw, expected',
    [
        (' Anna@Example.COM ', 'anna@example.com'),
        ('bob@example.com', 'bob@example.com'),
    ],
    ids=['spaces_and_case', 'already_clean'],
)
def test_normalize_email(raw, expected):
    assert normalize_email(raw) == expected


def test_load_uses_timeout():
    with patch('etl.load.requests.get') as get:
        get.return_value.json.return_value = {'items': []}
        load_page('https://api.example.com/employees')
        get.assert_called_once()
        assert get.call_args.kwargs['timeout'] == 10` },
          { t: 'list', items: ["Мокайте по месту использования: `patch('etl.load.requests.get')`, а не `patch('requests.get')`.", "`autospec=True` не даёт моку принять неверные аргументы и ловит опечатки в вызовах.", "`side_effect` задаёт исключения и последовательность ответов — так проверяют ретраи.", "`tmp_path` и `monkeypatch` — встроенные фикстуры для файлов и переменных окружения.", "Тест не должен зависеть от сети, текущего времени и порядка запуска: иначе он падает в CI через месяц."] },
          { t: 'note', kind: 'info', text: "Область видимости фикстуры (`scope='session'`) решает, сколько раз она создаётся. Тяжёлые ресурсы вроде подключения к базе берут на `session` или `module`, а изменяемые данные — на `function`, чтобы тесты не влияли друг на друга." },
        ],
      },
      {
        id: 'py-quality-logging',
        title: 'logging, типизация, ruff и black',
        blocks: [
          { t: 'p', text: "`print` пишет в stdout без уровня, времени и источника. `logging` даёт уровни, обработчики и фильтрацию без правки кода. Типы и линтеры ловят ошибки до запуска, а форматтер снимает споры о стиле." },
          { t: 'code', lang: 'python', text: `import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)

logger = logging.getLogger(__name__)


def load(rows):
    logger.info('загрузка: rows=%s', len(rows))
    try:
        write(rows)
    except OSError:
        logger.exception('не удалось записать файл')
        raise
    logger.warning('строки с пустым email пропущены: %s', 3)` },
          { t: 'table', headers: ['Уровень', 'Когда использовать'], rows: [['DEBUG', 'диагностика, в проде обычно выключен'], ['INFO', 'ход выполнения: старт, объём, завершение'], ['WARNING', 'данные не по плану, но работа продолжается'], ['ERROR', 'операция не выполнена'], ['CRITICAL', 'сломан весь процесс']] },
          { t: 'code', lang: 'python', text: `from collections.abc import Iterable, Iterator
from typing import Literal, TypedDict


class Employee(TypedDict):
    id: int
    email: str
    salary: float


Level = Literal['junior', 'middle', 'senior']


def normalize(rows: Iterable[dict[str, object]]) -> Iterator[Employee]:
    for row in rows:
        yield {
            'id': int(row['id']),
            'email': str(row['email']),
            'salary': float(row['salary']),
        }` },
          { t: 'code', lang: 'bash', text: `pip install ruff mypy pytest
ruff check --fix .
ruff format .
mypy src` },
          { t: 'list', items: ["`ruff` объединяет линтер и форматтер и заменяет связку flake8, isort и black в большинстве проектов.", "`black` — отдельный форматтер; не запускайте его одновременно с `ruff format`, иначе инструменты спорят о стиле.", "Настройки живут в `pyproject.toml`, а не в десятке разрозненных конфигов.", "`pre-commit` запускает проверки до коммита, CI — после пуша.", "`mypy` и `pyright` проверяют типы статически; аннотации не влияют на выполнение и не заменяют тесты."] },
        ],
      },
      {
        id: 'py-quality-project',
        title: 'Структура проекта, ретраи, идемпотентность и CI',
        blocks: [
          { t: 'p', text: "Надёжный пайплайн состоит из маленьких функций с одной ответственностью. Запуск должен быть повторяемым: тот же вход даёт тот же результат, а повторный прогон не создаёт дублей." },
          { t: 'code', lang: 'text', text: `etl-project/
  pyproject.toml
  src/etl/__init__.py
  src/etl/config.py
  src/etl/extract.py
  src/etl/transform.py
  src/etl/load.py
  tests/conftest.py
  tests/test_transform.py` },
          { t: 'code', lang: 'python', text: `from pathlib import Path
import os
import tempfile


def write_atomic(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        'w', encoding='utf-8', delete=False, dir=path.parent
    ) as handle:
        for row in rows:
            print(row, file=handle)
        temp_name = handle.name
    os.replace(temp_name, path)` },
          { t: 'sql', text: `INSERT INTO employees (id, email, salary, updated_at)
VALUES (%s, %s, %s, now())
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    salary = EXCLUDED.salary,
    updated_at = now();` },
          { t: 'list', items: ["**Ключ идемпотентности**: повторная загрузка того же `id` обновляет строку, а не добавляет новую.", "**Атомарная запись**: временный файл плюс `os.replace`, а не запись поверх рабочего файла.", "**Партиции по дате**: перезапись конкретной партиции вместо всей таблицы.", "**Журнал прогонов**: `run_id` и статус показывают, что уже загружено и что упало.", "**Ретраи только для временных ошибок**: backoff с потолком и ограничением попыток, как в `get_json` из модуля про API.", "**Проверка качества после загрузки**: количество строк, доля пропусков, уникальность ключа."] },
          { t: 'code', lang: 'yaml', text: `name: ci
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: ruff format --check .
      - run: pytest -q` },
        ],
      },
      {
        id: 'py-quality-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'p', text: "Проблемы качества обычно не видны на локальной машине: тесты зелёные, логи пустые, а на проде скрипт второй раз создаёт дубли. Проверяйте эти пункты на ревью." },
          { t: 'list', items: ["**Тесты ходят в реальную сеть или базу**: падают в CI и висят минутами.", "**Мок патчит не то место**: `patch('requests.get')` вместо модуля, который импортировал `requests`.", "**`except Exception: pass`**: ошибка исчезает, данные молча теряются.", "**`print` вместо `logging`**: нет уровней, времени и источника сообщения.", "**Ретраи на любые ошибки**: 400 и 404 повторяются впустую и упираются в лимит.", "**Неидемпотентная загрузка**: повторный запуск создаёт дубли строк или файлов.", "**Секреты и персональные данные в логах**: логи часто хранят дольше, чем данные.", "**Тест без `assert`** или тест, проверяющий реализацию вместо поведения.", "**Нет `timeout` у HTTP-клиента**: CI может зависнуть на одном соединении."] },
          { t: 'note', kind: 'warn', text: "Мок — не замена интеграционному тесту. Юнит-тестами с моками проверяют логику, а реальное соединение с внешней системой — отдельным тестом или на стейдже. Иначе тесты зелёные, а прод сломан." },
        ],
      },
      {
        id: 'py-quality-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'p', text: "Вопросы про качество проверяют инженерную зрелость: запускаете ли вы проверки автоматически и думаете ли о повторном запуске. Ответ без примера из практики звучит теоретически." },
          { t: 'table', headers: ['Вопрос', 'Ключевое в ответе'], rows: [['Зачем нужны fixtures?', 'Готовят окружение и данные, переиспользуются между тестами, поддерживают teardown через `yield`.'], ['Что и где патчить в mock?', 'Объект в том модуле, где он используется; иначе патч не подействует.'], ['Чем logging лучше print?', 'Уровни, время, источник, обработчики, фильтрация без правки кода.'], ['Как обеспечить идемпотентность?', 'Естественный ключ, upsert, атомарная замена файла, журнал прогонов.'], ['Что должно быть в CI?', 'Линтер, проверка форматирования, типы и тесты — те же команды, что локально.'], ['Как тестировать код с внешним API?', 'Мокать HTTP-клиент в юнит-тестах и держать отдельный интеграционный тест.'], ['Зачем типы, если Python их не проверяет?', 'Статический анализ ловит ошибки до запуска и документирует контракты функций.'], ['Как отличить временную ошибку от постоянной?', 'По коду ответа и типу исключения: таймауты и 5xx временные, 400 и 404 — нет.']] },
          { t: 'note', kind: 'tip', text: "Спросят про тесты на данные — расскажите про проверку схемы и контрактов: ожидаемые столбцы, типы, уникальность ключа и допустимый процент пропусков. Это ближе к DE, чем покрытие строк кода." },
        ],
      },
    ],
  },
];
