export const LESSONS_DE_BIGDATA = [
  {
    id: 'spark',
    title: 'Apache Spark и PySpark',
    icon: '⚡',
    level: 'middle',
    track: 'bigdata',
    dataset: 'ecommerce',
    intro: 'Apache Spark — распределённый движок для обработки больших данных: он разбивает вычисления на задачи, выполняет их параллельно на кластере и переживает падение отдельных исполнителей. В этом модуле — архитектура, ленивые вычисления, партиции, shuffle, стратегии join и практическая оптимизация PySpark-ETL.',
    outcomes: [
      'Объяснять роли драйвера, экзекьюторов и кластерного менеджера.',
      'Читать физический план и отличать narrow-трансформации от wide.',
      'Выбирать стратегию join и диагностировать skew и лишний shuffle.',
      'Настраивать AQE, кэш и партиционирование под реальную нагрузку.',
      'Писать ETL на PySpark и осознанно сравнивать его с pandas.',
    ],
    sections: [
      {
        id: 'spark-arch',
        title: 'Архитектура, ленивые вычисления и DataFrame',
        blocks: [
          { t: 'p', text: 'Spark — это не база данных, а вычислительный движок. Он не хранит данные сам, а читает их из S3, HDFS, Kafka, JDBC или другого источника, строит план вычислений и распределяет работу по кластеру. Понимание того, где живёт драйвер и что делают экзекьюторы, объясняет большинство ошибок памяти и «медленных» job.' },
          { t: 'h', text: 'Драйвер, экзекьюторы и кластерный менеджер' },
          { t: 'p', text: 'Драйвер запускает `main`, принимает код, строит DAG и физический план, делит его на stages и tasks, а затем собирает результаты. Экзекьюторы — отдельные JVM-процессы на воркерах: они выполняют tasks, держат кэш и shuffle-файлы. Кластерный менеджер (YARN, Kubernetes, Standalone) выделяет ресурсы и запускает экзекьюторов.' },
          { t: 'list', items: [
            'Драйвер хранит план, метаданные и результаты `collect`; его память не рассчитана на весь датасет.',
            'Экзекьютор выполняет несколько tasks параллельно — по числу cores, выделенных ему.',
            'Каждая task обрабатывает одну партицию; число партиций задаёт максимальный параллелизм stage.',
            'Кэш и shuffle-файлы живут на экзекьюторах, поэтому их потеря означает пересчёт.',
          ] },
          { t: 'note', text: '`collect()`, `toPandas()` и broadcast-переменные тянут данные или объект в драйвер. Если результат не помещается в память драйвера, job упадёт независимо от размера кластера.', kind: 'tip' },
          { t: 'h', text: 'Lazy evaluation: transformations и actions' },
          { t: 'p', text: 'Трансформации не вычисляются сразу: Spark накапливает lineage и оптимизирует план целиком. Вычисления запускает только action. Это позволяет Catalyst убрать лишние колонки, протолкнуть фильтры вниз и выбрать другой join, но мешает наивному профилированию: `show()` и `count()` могут пересчитывать один и тот же pipeline.' },
          { t: 'code', text: `from pyspark.sql import functions as F

events = spark.read.json("s3://lake/raw/events/")
paid = events.filter(F.col("type") == "order_paid")
by_country = paid.groupBy("country").count()

# Данные ещё не прочитаны: построен только логический план.
by_country.explain("formatted")

# Action запускает job и физически читает файлы.
by_country.show(20, truncate=False)`, lang: 'python' },
          { t: 'table', headers: ['Категория', 'Примеры', 'Что происходит'], rows: [
            ['Narrow-трансформация', 'select, filter, withColumn, union', 'Данные остаются в тех же партициях, shuffle нет'],
            ['Wide-трансформация', 'groupBy, join, distinct, orderBy, repartition', 'Нужен shuffle: обмен данными между экзекьюторами'],
            ['Action', 'count, collect, show, write, foreach', 'Запускает job и возвращает результат или пишет данные'],
          ] },
          { t: 'p', text: 'Wide-трансформация всегда создаёт границу stage: Spark сначала выполняет map-side часть, пишет shuffle-файлы, затем запускает следующий stage на reduce-стороне. Каждый shuffle — это сериализация, сеть и диск, поэтому главный вопрос оптимизации звучит так: «можно ли убрать или уменьшить этот обмен?»' },
          { t: 'note', text: 'Повторный `count()` без `cache` пересчитывает весь pipeline. Если результат используется несколько раз, материализуйте его осознанно, а не добавляйте кэш «на всякий случай».', kind: 'warn' },
          { t: 'h', text: 'DataFrame API и схемы' },
          { t: 'p', text: 'DataFrame — декларативное API поверх RDD: вы описываете, что нужно получить, а Catalyst выбирает, как это сделать. RDD оставляйте для случаев, когда нужен ручной контроль над партициями или нет табличного представления. DataFrame избавляет от Python-сериализации в большинстве операций и использует Tungsten для компактного представления строк.' },
          { t: 'code', text: `from pyspark.sql.types import (
    StructType, StructField, StringType, LongType, DecimalType, TimestampType,
)

order_schema = StructType([
    StructField("order_id", StringType(), False),
    StructField("user_id", LongType(), False),
    StructField("amount", DecimalType(12, 2), True),
    StructField("status", StringType(), True),
    StructField("created_at", TimestampType(), True),
])

orders = (
    spark.read
    .schema(order_schema)
    .option("mode", "PERMISSIVE")
    .parquet("s3://lake/raw/orders/")
)
orders.createOrReplaceTempView("orders")`, lang: 'python' },
          { t: 'p', text: 'Явная схема дешевле и надёжнее `inferSchema=True`: Spark не делает дополнительный проход по файлам, а типы не зависят от текущей порции данных. Для CSV и JSON задавайте `mode` и разбирайтесь с битыми строками через `_corrupt_record`, а не отбрасывайте их молча.' },
          { t: 'sql', text: `SELECT status,
       count(*) AS orders,
       round(sum(amount), 2) AS revenue
FROM orders
WHERE created_at >= DATE '2026-01-01'
GROUP BY status
ORDER BY revenue DESC;` },
          { t: 'note', text: 'DataFrame иммутабелен: `withColumn` и `filter` возвращают новый объект. Если не присвоить результат переменной, изменения просто потеряются.', kind: 'info' },
        ],
      },
      {
        id: 'spark-partitions-shuffle',
        title: 'Партиции, shuffle и стратегии join',
        blocks: [
          { t: 'p', text: 'Партиция — единица параллелизма и единица отказа. Слишком мало партиций оставляет cores без работы, слишком много — добавляет накладные расходы на планирование и мелкие задачи. При чтении из файлов Spark обычно делает одну партицию на блок HDFS или на несколько файлов, а `spark.sql.files.maxPartitionBytes` ограничивает размер такой партиции.' },
          { t: 'code', text: `base = spark.read.parquet("s3://lake/raw/orders/")
print(base.rdd.getNumPartitions())

by_user = base.repartition(200, "user_id")  # wide: полный shuffle
small = base.coalesce(8)                    # narrow: без shuffle

(base.withColumn("dt", F.to_date("created_at"))
     .write.mode("overwrite")
     .partitionBy("dt")
     .parquet("s3://lake/silver/orders/"))`, lang: 'python' },
          { t: 'list', items: [
            '`repartition(n)` делает полный shuffle и может увеличить или уменьшить число партиций.',
            '`repartition(n, col)` хеширует строки по колонке — полезно перед join по тому же ключу.',
            '`coalesce(n)` только объединяет соседние партиции, не перераспределяя данные.',
            '`partitionBy` при записи создаёт каталоги, но не влияет на параллелизм уже существующего DataFrame.',
          ] },
          { t: 'note', text: '`coalesce(1)` перед записью — частая причина того, что все данные обрабатывает одна task. Уменьшайте число партиций только до разумного размера файла, а не до единицы.', kind: 'warn' },
          { t: 'h', text: 'Shuffle: что происходит на самом деле' },
          { t: 'p', text: 'Shuffle — это обмен данными между экзекьюторами по ключу: map-side задачи пишут блоки, reduce-side читают их по сети. Данные сериализуются, сортируются, могут уходить на диск и spilling-иться. Именно поэтому shuffle дорог и именно поэтому фильтрация до join или groupBy почти всегда окупается.' },
          { t: 'code', text: `joined = orders.join(users, "user_id").groupBy("country").count()
joined.explain("formatted")

# == Physical Plan ==
# AdaptiveSparkPlan isFinalPlan=false
# +- HashAggregate(keys=[country], functions=[count(1)])
#    +- Exchange hashpartitioning(country, 200)
#       +- BroadcastHashJoin [user_id], [user_id], Inner
#          :- FileScan parquet ...
#          +- BroadcastExchange ...`, lang: 'python' },
          { t: 'p', text: '`spark.sql.shuffle.partitions` по умолчанию равен 200 и не зависит от размера данных. Для маленького shuffle это сотни пустых задач, для большого — гигантские партиции и spill. Начиная со Spark 3.x AQE сам укрупняет мелкие партиции, но базовое значение всё равно стоит подбирать под объём.' },
          { t: 'h', text: 'Стратегии join' },
          { t: 'table', headers: ['Стратегия', 'Когда выбирается', 'Ограничения'], rows: [
            ['Broadcast hash join', 'Одна сторона меньше autoBroadcastJoinThreshold', 'Малая таблица должна поместиться в память каждого экзекьютора'],
            ['Shuffle hash join', 'Одна сторона заметно меньше, но больше порога broadcast', 'Нужен shuffle и хеш-таблица на каждой партиции'],
            ['Sort-merge join', 'Две большие таблицы, равномерные ключи', 'Shuffle и сортировка; самый чувствительный к skew'],
            ['Broadcast nested loop', 'Non-equi join с маленькой стороной', 'Дорогой по CPU, применим только к маленькой таблице'],
            ['Bucket join', 'Обе таблицы забакетированы одинаково', 'Нужны совместимые buckets и поддержка со стороны таблицы'],
          ] },
          { t: 'p', text: 'Broadcast join избавляет большую таблицу от shuffle: маленькая копируется на каждый экзекьютор. Это лучший выбор для справочников, стран, тарифов и небольших dim-таблиц. Порог задаётся в байтах, но реальное ограничение — свободная память экзекьютора, умноженная на число параллельных tasks.' },
          { t: 'code', text: `from pyspark.sql.functions import broadcast

result = orders.join(broadcast(users_small), "user_id", "left")
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 32 * 1024 * 1024)`, lang: 'python' },
          { t: 'sql', text: `SELECT /*+ BROADCAST(u) */ o.order_id, u.country
FROM orders o
LEFT JOIN users u ON u.user_id = o.user_id;` },
          { t: 'p', text: 'Если обе таблицы большие и ключ распределён равномерно, Spark выберет sort-merge join. Ускорить его можно бакетированием по тому же ключу: тогда при совпадении числа buckets shuffle для join не нужен. Но бакетирование требует дисциплины при записи и не всегда поддерживается внешними таблицами.' },
          { t: 'p', text: 'Skew — ситуация, когда один ключ (например, `country = "RU"` или `user_id = null`) занимает большую часть строк. Параллелизм падает: одна task перерабатывает гигабайты, остальные простаивают. Лечение зависит от причины: отфильтровать null, вынести hot keys в отдельный pipeline, добавить соль к ключу, включить `skewJoin` в AQE или broadcast-нуть маленькую сторону.' },
          { t: 'note', text: 'Broadcast-хинт на большой таблице не ускоряет join, а приводит к OOM и падению экзекьюторов. Сначала проверьте размер стороны через `count` и `spark.sessionState.conf.autoBroadcastJoinThreshold`, а не добавляйте хинт наугад.', kind: 'warn' },
        ],
      },
      {
        id: 'spark-optimize-etl',
        title: 'Кэш, AQE, оптимизация и ETL',
        blocks: [
          { t: 'p', text: 'Кэш оправдан, когда один и тот же DataFrame используется в нескольких actions или в итеративном алгоритме. Кэшировать всё подряд вредно: память экзекьюторов ограничена, а вытесненные блоки всё равно придётся пересчитывать. Всегда освобождайте кэш через `unpersist`, когда он больше не нужен.' },
          { t: 'code', text: `enriched = orders.join(broadcast(users_small), "user_id").cache()
enriched.count()  # материализуем кэш один раз

report = enriched.groupBy("country").agg(F.sum("amount").alias("revenue"))
report.show()

enriched.unpersist()`, lang: 'python' },
          { t: 'p', text: '`cache()` по умолчанию использует `MEMORY_AND_DISK`. `persist(StorageLevel.DISK_ONLY)` помогает, когда памяти мало, но добавляет чтение с диска. `checkpoint()` обрезает lineage и пишет данные в надёжное хранилище — это нужно для очень длинных цепочек и для восстановления после сбоев, а не для ускорения обычного запроса.' },
          { t: 'h', text: 'Adaptive Query Execution' },
          { t: 'p', text: 'AQE пересобирает план по фактической статистике shuffle-файлов: объединяет мелкие партиции, переключает sort-merge на broadcast, если сторона оказалась маленькой, и разбивает перекошенные партиции. Для этого должны быть включены adaptive execution и сбор статистики; на некоторых источниках статистика может отсутствовать.' },
          { t: 'code', text: `spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128m")`, lang: 'python' },
          { t: 'p', text: 'AQE не заменяет осмысленную модель данных. Если ключ join перекошен из-за null, разбиение hot-партиции лишь смягчит симптом. Если источник — тысячи мелких файлов, adaptive coalesce поможет не всегда: файлы всё равно нужно компактифицировать.' },
          { t: 'h', text: 'Чек-лист оптимизации' },
          { t: 'list', items: [
            'Фильтруйте и выбирайте колонки как можно раньше — меньше данных проходит через shuffle.',
            'Читайте Parquet или ORC вместо CSV и JSON: колонки, статистика и сжатие.',
            'Broadcast-ьте маленькие справочники, но проверяйте, что они действительно помещаются в память.',
            'Замените Python UDF на встроенные функции `pyspark.sql.functions`: JVM-функции не платят за сериализацию.',
            'Лечите skew: null-ключи, salting, отдельный pipeline для горячих ключей.',
            'Партиционируйте таблицу по дате или региону и используйте partition pruning.',
            'Не вызывайте `collect` и `toPandas` для данных, которые не помещаются в драйвер.',
            'Следите за размером shuffle-партиций: целевой диапазон — примерно 100–200 МБ.',
          ] },
          { t: 'h', text: 'Пример PySpark ETL' },
          { t: 'p', text: 'Ниже — типичный batch-пайплайн: читаем сырые заказы и пользователей, чистим, обогащаем через broadcast join, считаем дневную выручку и пишем результат с партиционированием по дате. Обратите внимание на порядок операций: фильтр и выбор колонок стоят до join и агрегации.' },
          { t: 'code', text: `from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (
    SparkSession.builder
    .appName("daily-revenue")
    .config("spark.sql.adaptive.enabled", "true")
    .config("spark.sql.adaptive.skewJoin.enabled", "true")
    .getOrCreate()
)

orders = spark.read.parquet("s3://lake/raw/orders/")
users = spark.read.parquet("s3://lake/raw/users/")

clean_orders = (
    orders
    .filter((F.col("status") == "paid") & F.col("user_id").isNotNull())
    .withColumn("dt", F.to_date("created_at"))
    .select("order_id", "user_id", "amount", "dt")
)

users_small = users.select("user_id", "country", "segment")

enriched = clean_orders.join(
    F.broadcast(users_small), on="user_id", how="left"
)

daily = (
    enriched
    .groupBy("dt", "country")
    .agg(
        F.countDistinct("order_id").alias("orders"),
        F.round(F.sum("amount"), 2).alias("revenue"),
    )
)

(daily.write
    .mode("overwrite")
    .partitionBy("dt")
    .parquet("s3://lake/gold/daily_revenue/"))`, lang: 'python' },
          { t: 'p', text: 'В физическом плане такого пайплайна должны быть видны `FileScan` с отсечением колонок, `BroadcastHashJoin` и один `Exchange` на `groupBy`. Если вы видите два и более shuffle без необходимости, `collect` в середине или отсутствие pruning, ищите причину в плане, а не в конфигурации кластера.' },
          { t: 'h', text: 'Spark и pandas' },
          { t: 'table', headers: ['Критерий', 'Spark', 'pandas'], rows: [
            ['Объём', 'Гигабайты и терабайты, распределённо', 'До объёма памяти одной машины'],
            ['Ленивость', 'Трансформации ленивые, нужен action', 'Операции выполняются сразу'],
            ['Отказоустойчивость', 'Пересчёт партиций и lineage', 'Нет, процесс падает вместе с данными'],
            ['API', 'DataFrame и SQL, ограниченный набор операций', 'Богатая экосистема и Python-объекты'],
            ['Когда выбирать', 'ETL, большие join и агрегации', 'Исследование, небольшие данные, ML на одной машине'],
          ] },
          { t: 'note', text: '`toPandas()` полезен, когда агрегат уже маленький. Если вы вызываете его после `groupBy` по миллионам ключей, проблема не в pandas, а в том, что результат не должен был ехать в драйвер.', kind: 'tip' },
        ],
      },
      {
        id: 'spark-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            '`collect()` или `toPandas()` на большом DataFrame: переполнение памяти драйвера и падение всего приложения.',
            '`inferSchema=True` в проде: лишний проход по данным, нестабильные типы и молчаливые null.',
            '`repartition(1)` или `coalesce(1)` перед записью: все данные проходят через одну task.',
            'Broadcast-хинт на большой таблице: OOM экзекьюторов вместо ускорения.',
            'Кэш без `unpersist`: вытеснение нужных блоков и деградация последующих job.',
            'Python UDF там, где есть встроенная функция: сериализация, потеря vectorization и рост CPU.',
            'Игнорирование skew: несколько tasks работают в десятки раз дольше остальных, cluster простаивает.',
            'Путаница между числом партиций и числом файлов: слишком много мелких файлов на выходе.',
          ] },
          { t: 'note', text: 'Большинство проблем Spark диагностируется по UI: смотрите stages, shuffle read/write, spill, размер самой большой task и physical plan. Конфигурация без наблюдения — это гадание.', kind: 'warn' },
        ],
      },
      {
        id: 'spark-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'table', headers: ['Вопрос', 'Что важно ответить'], rows: [
            ['Чем драйвер отличается от экзекьютора?', 'Драйвер строит план и координирует job, экзекьюторы выполняют tasks и хранят данные; память драйвера не масштабируется под датасет'],
            ['Почему transformations ленивые?', 'Чтобы оптимизировать весь план целиком и не читать лишние данные; вычисление запускает action'],
            ['Когда происходит shuffle?', 'На wide-трансформациях: groupBy, join, distinct, orderBy, repartition; это граница stage'],
            ['Broadcast join или sort-merge?', 'Broadcast — если сторона помещается в память экзекьюторов; sort-merge — для двух больших таблиц с равномерным ключом'],
            ['Что такое skew и как лечить?', 'Неравномерное распределение ключей; null-фильтр, salting, broadcast, AQE skew join, отдельный pipeline'],
            ['Зачем нужен AQE?', 'Пересобирает план по фактической статистике: coalesce партиций, смена join, разбиение перекошенных партиций'],
            ['Кэш или checkpoint?', 'Кэш ускоряет повторное использование, но хранит lineage; checkpoint обрезает lineage и пишет в надёжное хранилище'],
            ['Когда Spark проигрывает pandas?', 'На маленьких данных: overhead кластера и JVM больше, чем выигрыш от распределённости'],
          ] },
          { t: 'p', text: 'Практическое задание: дан DataFrame заказов и маленькая таблица пользователей. Нужно посчитать выручку по странам за последние 30 дней. Хороший ответ: отфильтровать заказы до join, выбрать только нужные колонки, broadcast-нуть пользователей, агрегировать, проверить план на наличие одного shuffle и объяснить, что будет при перекосе по стране.' },
          { t: 'note', text: 'На собеседовании ценят не перечисление настроек, а умение объяснить, где именно в плане возникнет обмен данными и почему выбранное решение его уменьшит или уберёт.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'kafka',
    title: 'Стриминг: Apache Kafka',
    icon: '🌊',
    level: 'middle',
    track: 'streaming',
    dataset: 'ecommerce',
    intro: 'Kafka — распределённый журнал событий, через который сервисы обмениваются данными без прямых синхронных вызовов. В модуле — устройство топиков и партиций, producer и consumer, consumer groups, гарантии доставки, Schema Registry, Connect и базовые понятия потоковой обработки: время события, watermark и окна.',
    outcomes: [
      'Объяснять, как topic, partition и offset обеспечивают порядок и масштабирование.',
      'Настраивать producer и consumer под нужную семантику доставки.',
      'Выбирать между at-least-once, at-most-once и exactly-once.',
      'Понимать роль Schema Registry и Kafka Connect в event-driven платформе.',
      'Отличать event time от processing time и корректно считать окна.',
    ],
    sections: [
      {
        id: 'kafka-log',
        title: 'Topic, partition, offset и хранение лога',
        blocks: [
          { t: 'p', text: 'Kafka хранит события в виде append-only лога. Producer дописывает запись в конец партиции, consumer читает её по offset и сам решает, когда зафиксировать позицию. В отличие от очереди, прочитанное сообщение не удаляется сразу: оно живёт до истечения retention или до компакции. Поэтому один и тот же поток можно перечитать несколькими независимыми потребителями.' },
          { t: 'table', headers: ['Понятие', 'Смысл'], rows: [
            ['Topic', 'Логический поток событий, например shop-events'],
            ['Partition', 'Упорядоченный append-only лог внутри топика; единица параллелизма'],
            ['Offset', 'Позиция записи в партиции, монотонно растёт'],
            ['Segment', 'Файл сегмента лога; единица удаления при retention'],
            ['Replication factor', 'Сколько копий партиции хранится в кластере'],
            ['ISR', 'Синхронизированные реплики, готовые стать лидером'],
          ] },
          { t: 'h', text: 'Партиционирование и порядок' },
          { t: 'p', text: 'Порядок гарантирован только внутри одной партиции. По умолчанию producer хеширует ключ и выбирает партицию по модулю, поэтому события одного пользователя с одинаковым ключом попадают в одну партицию и читаются по порядку. Если ключ не задан, запись распределяется по round-robin или sticky-стратегии, и порядок между событиями теряется.' },
          { t: 'p', text: 'Число партиций определяет максимальный параллелизм consumer group. Увеличивать партиции можно, уменьшать — нельзя. При увеличении меняется маппинг ключей на партиции, поэтому события одного ключа могут оказаться в разных партициях — это нужно учитывать при переработке истории.' },
          { t: 'code', text: `kafka-topics.sh --create --topic shop-events --partitions 12 --replication-factor 3 --config cleanup.policy=delete --bootstrap-server broker:9092

kafka-topics.sh --describe --topic shop-events --bootstrap-server broker:9092`, lang: 'bash' },
          { t: 'h', text: 'Retention и compaction' },
          { t: 'p', text: 'Политика `delete` удаляет старые сегменты по времени или размеру: `retention.ms` и `retention.bytes`. Политика `compact` оставляет последнее значение для каждого ключа и удаляет устаревшие версии; tombstones с null-значением удаляются позже, после `delete.retention.ms`. Компакция не гарантирует мгновенного удаления и не подходит для event streams, где важна полная история.' },
          { t: 'code', text: `kafka-configs.sh --alter --entity-type topics --entity-name shop-events --add-config retention.ms=604800000,min.insync.replicas=2 --bootstrap-server broker:9092`, lang: 'bash' },
          { t: 'p', text: 'Репликация защищает от отказа брокера: лидер принимает записи, follower-реплики копируют лог. `acks=all` вместе с `min.insync.replicas=2` означает, что запись подтверждена только после попадания в кворум реплик. Если доступных реплик меньше минимума, producer получит ошибку — это лучше, чем молча потерять данные.' },
          { t: 'note', text: 'Порядок гарантирован только в пределах партиции. Если бизнес-требование звучит как «события пользователя строго по порядку», ключом должен быть `user_id`, а не случайный `event_id`.', kind: 'warn' },
          { t: 'note', text: 'Компакция подходит для changelog и state store: последнее состояние по ключу важнее истории. Для аудита и повторной обработки событий используйте `delete` с достаточным retention.', kind: 'info' },
        ],
      },
      {
        id: 'kafka-clients',
        title: 'Producer, consumer и consumer groups',
        blocks: [
          { t: 'h', text: 'Producer: acks, батчи и идемпотентность' },
          { t: 'p', text: 'Producer буферизует записи и отправляет их батчами. `linger.ms` увеличивает задержку, но повышает пропускную способность; `batch.size` ограничивает размер батча; сжатие (`compression.type`) экономит сеть и диск. `acks=0` не ждёт подтверждения, `acks=1` ждёт лидера, `acks=all` — все in-sync реплики. Идемпотентность (`enable.idempotence=true`) защищает от дублей при retry в рамках одной producer-сессии.' },
          { t: 'code', text: `from confluent_kafka import Producer
import json

conf = {
    "bootstrap.servers": "broker-1:9092,broker-2:9092",
    "enable.idempotence": True,
    "acks": "all",
    "compression.type": "snappy",
    "linger.ms": 20,
}

producer = Producer(conf)

def delivery(err, msg):
    if err is not None:
        print("delivery failed:", err)

event = {"event_id": "evt-1", "user_id": 42, "type": "order_paid", "amount": 1990}
producer.produce(
    topic="shop-events",
    key=str(event["user_id"]),
    value=json.dumps(event).encode("utf-8"),
    callback=delivery,
)
producer.flush()`, lang: 'python' },
          { t: 'h', text: 'Consumer groups и ребалансировка' },
          { t: 'p', text: '`group.id` объединяет потребителей в группу: каждая партиция назначается ровно одному consumer внутри группы, поэтому суммарный параллелизм не превышает число партиций. Consumers с разными `group.id` читают поток независимо. При входе или выходе участника происходит rebalance: партиции перераспределяются, и на это время обработка может приостановиться.' },
          { t: 'code', text: `from confluent_kafka import Consumer, KafkaError
import json

consumer = Consumer({
    "bootstrap.servers": "broker-1:9092",
    "group.id": "orders-enricher",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
})
consumer.subscribe(["shop-events"])

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise RuntimeError(msg.error())
        process(json.loads(msg.value()))
        consumer.commit(message=msg, asynchronous=False)
finally:
    consumer.close()`, lang: 'python' },
          { t: 'p', text: 'Ручной коммит после обработки даёт at-least-once: при падении между обработкой и коммитом событие будет прочитано снова. Автокоммит по таймеру может зафиксировать offset до обработки и потерять данные. Долгая обработка, превышающая `max.poll.interval.ms`, приводит к исключению consumer из группы и новому rebalance — тяжёлую работу лучше выносить в отдельный пул или уменьшать batch.' },
          { t: 'h', text: 'Семантика доставки' },
          { t: 'table', headers: ['Семантика', 'Механизм', 'Риск'], rows: [
            ['At-most-once', 'Коммит до обработки или acks=0', 'Потеря событий'],
            ['At-least-once', 'Коммит после обработки, retries', 'Дубликаты, нужна идемпотентная обработка'],
            ['Exactly-once', 'Идемпотентный producer + транзакции + read_committed', 'Сложнее и дороже; sink тоже должен поддерживать транзакции или upsert'],
          ] },
          { t: 'p', text: 'Exactly-once в Kafka устроен через транзакционного producer и чтение с `isolation.level=read_committed`: незакоммиченные записи не видны потребителю. Но сквозная гарантия возможна только тогда, когда и выходной sink поддерживает транзакции или идемпотентную запись по ключу. Запись в произвольный HTTP-сервис без ключа идемпотентности останется at-least-once.' },
          { t: 'note', text: '`enable.auto.commit=true` — самая частая причина потерь. Если обработка не идемпотентна, отключите автокоммит и фиксируйте offset после успешной записи результата.', kind: 'warn' },
          { t: 'h', text: 'Schema Registry и Kafka Connect' },
          { t: 'p', text: 'Schema Registry хранит схемы Avro, Protobuf или JSON Schema и проверяет совместимость при публикации. Это защищает потребителей от неожиданного изменения формата. Режимы совместимости — `BACKWARD`, `FORWARD`, `FULL`, `NONE` — определяют, какие изменения допустимы: добавление необязательного поля обычно безопасно, удаление обязательного — нет.' },
          { t: 'code', text: `{
  "type": "record",
  "name": "OrderPaid",
  "namespace": "shop.events",
  "fields": [
    {"name": "event_id", "type": "string"},
    {"name": "user_id", "type": "long"},
    {"name": "amount", "type": "long"},
    {"name": "currency", "type": "string", "default": "RUB"}
  ]
}`, lang: 'json' },
          { t: 'p', text: 'Kafka Connect переносит данные между Kafka и внешними системами декларативно: source-коннекторы читают из БД или файлов, sink-коннекторы пишут в S3, ClickHouse, Elasticsearch. Debezium через Connect реализует CDC. Single Message Transforms позволяют менять сообщение на лету, но сложную логику лучше оставлять потоковому приложению, а не разрастающейся цепочке SMT.' },
          { t: 'note', text: 'Схема и контракт важнее формата сериализации. Если потребители жёстко парсят JSON и падают на новом поле, проблема не в Kafka, а в отсутствии управления схемами.', kind: 'tip' },
        ],
      },
      {
        id: 'kafka-streams',
        title: 'Event-driven, время и окна',
        blocks: [
          { t: 'p', text: 'В event-driven архитектуре сервисы публикуют факты о произошедшем, а не команды друг другу. Это снижает связность: новый потребитель подключается к топику, не меняя producer. Плата за гибкость — eventual consistency, необходимость идемпотентности, дедупликации и мониторинга задержек. Паттерн outbox помогает атомарно записать изменение в БД и событие в Kafka.' },
          { t: 'h', text: 'Event time, processing time и watermarks' },
          { t: 'p', text: '`event_time` — когда событие произошло, `processing_time` — когда его обработали. Для корректных окон нужен event time. Watermark — эвристическая граница: система считает, что события старше watermark уже не придут (или приходят с опозданием в пределах allowed lateness). Watermark позволяет закрывать окна и освобождать state, не дожидаясь конца потока.' },
          { t: 'p', text: 'Окна бывают tumbling (фиксированные непересекающиеся), hopping (скользящие с шагом), sliding (по числу событий или интервалу) и session (по разрыву активности). Поздние события либо отбрасываются, либо обновляют уже закрытое окно — это зависит от `allowed lateness` и требований отчётности.' },
          { t: 'sql', text: `SELECT
    user_id,
    TUMBLE_START(event_time, INTERVAL '5' MINUTE) AS window_start,
    COUNT(*) AS events,
    SUM(amount) AS revenue
FROM shop_events
GROUP BY
    user_id,
    TUMBLE(event_time, INTERVAL '5' MINUTE);` },
          { t: 'p', text: 'Состояние потокового приложения растёт вместе с числом ключей и длиной окон. Нужны checkpointing, ограничение state и план восстановления. Exactly-once в потоковой обработке требует транзакционного sink или идемпотентного upsert по ключу окна; одного «Kafka умеет exactly-once» недостаточно.' },
          { t: 'table', headers: ['Инструмент', 'Модель', 'Сильная сторона'], rows: [
            ['Kafka Streams', 'Библиотека в JVM-приложении', 'Простая интеграция с Kafka, state stores, exactly-once'],
            ['Apache Flink', 'Отдельный кластер, event time и state', 'Сложные окна, большие state, продвинутая обработка'],
            ['Spark Structured Streaming', 'Микробатчи или continuous', 'Единый код с batch, интеграция с lakehouse'],
            ['ksqlDB', 'SQL поверх Kafka Streams', 'Быстрые потоковые агрегации без кода'],
          ] },
          { t: 'p', text: 'Мониторинг потока — это не только CPU. Смотрите consumer lag по группам, число under-replicated partitions, размер ISR, свободное место на брокерах, частоту rebalance и возраст самого старого непрочитанного сообщения. Lag в сообщениях без привязки к времени может выглядеть нормально, пока потребление не начнёт отставать на часы.' },
          { t: 'note', text: 'Если объём событий небольшой, а требования — обычный request-response, Kafka может быть лишней инфраструктурой. Журнал событий оправдан, когда нужны replay, несколько независимых потребителей и развязка сервисов.', kind: 'tip' },
        ],
      },
      {
        id: 'kafka-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            'Автокоммит до обработки: при падении события теряются, а lag выглядит нулевым.',
            'Ключ не задан или случайный: события одного пользователя разъезжаются по партициям, порядок нарушается.',
            'Уменьшение числа партиций или изменение ключа без плана: история читается в неверном порядке.',
            'Долгая обработка в `poll` без heartbeat: consumer исключают из группы, начинается rebalance storm.',
            'Использование Kafka как базы данных с бесконечным retention: рост диска и стоимости.',
            'Ожидание exactly-once при записи в sink без транзакций или идемпотентности.',
            'Отсутствие Schema Registry и контрактов: потребители ломаются на новом поле.',
            'Игнорирование lag и under-replicated partitions до инцидента.',
          ] },
          { t: 'note', text: 'Для каждого топика заранее определите: ключ, число партиций, retention, семантику доставки и владельца схемы. Эти пять решений определяют большую часть эксплуатационных проблем.', kind: 'warn' },
        ],
      },
      {
        id: 'kafka-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'table', headers: ['Вопрос', 'Что важно ответить'], rows: [
            ['Почему Kafka быстрее очереди?', 'Append-only лог, последовательный I/O, батчи, zero-copy, партиционирование и независимые consumer groups'],
            ['Где гарантирован порядок?', 'Только внутри партиции; ключ определяет партицию'],
            ['Что такое consumer group?', 'Группа потребителей, делящих партиции; одна партиция — один consumer внутри группы'],
            ['Как достигается exactly-once?', 'Идемпотентный producer, транзакции, read_committed и транзакционный или идемпотентный sink'],
            ['Retention или compaction?', 'Retention — история событий, compaction — последнее состояние по ключу'],
            ['Что такое watermark?', 'Граница event time, после которой окно считается завершённым с учётом допустимого опоздания'],
            ['Зачем Schema Registry?', 'Контракты и проверка совместимости схем между producer и consumer'],
            ['Как масштабировать потребление?', 'Добавлять партиции и consumers до числа партиций; следить за rebalance и lag'],
          ] },
          { t: 'p', text: 'Практическое задание: спроектировать поток заказов с гарантией «ни одного потерянного события» и дедупликацией на стороне склада. Хороший ответ: ключ `order_id`, `acks=all`, идемпотентный producer, ручной коммит после записи, upsert в sink по `order_id`, мониторинг lag и DLQ для ядовитых сообщений.' },
          { t: 'note', text: 'Не начинайте ответ с перечисления компонентов. Сначала уточните требования: объём, допустимые задержки, порядок, потери и дубликаты — от них зависит вся конфигурация.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'warehouses',
    title: 'Хранилища данных: Redshift, BigQuery, Snowflake, ClickHouse',
    icon: '🏬',
    level: 'middle',
    track: 'warehouse',
    dataset: 'ecommerce',
    intro: 'Аналитическое хранилище — это не просто база с большими таблицами, а MPP-система с колоночным хранением, собственным планировщиком и моделью стоимости. Разберём, как устроены Redshift, BigQuery, Snowflake и ClickHouse, чем отличаются распределение, партиционирование и sort keys и какие аналитические паттерны на них работают лучше всего.',
    outcomes: [
      'Объяснять, почему колоночное хранение ускоряет аналитику и мешает точечным UPDATE.',
      'Выбирать distribution key, sort key, partition и clustering под запросы.',
      'Понимать модели стоимости четырёх хранилищ и способы их контролировать.',
      'Осознанно выбирать хранилище под workload, команду и бюджет.',
      'Применять MERGE, pre-aggregation и SCD2 в аналитическом контуре.',
    ],
    sections: [
      {
        id: 'warehouses-mpp',
        title: 'MPP, колонки и физическое распределение',
        blocks: [
          { t: 'p', text: 'OLTP-база оптимизирована под короткие транзакции и точечные изменения, аналитическое хранилище — под сканирование больших диапазонов и агрегации. MPP-система (massively parallel processing) делит таблицу между узлами и выполняет один запрос параллельно: каждый узел читает свою часть, затем строки обмениваются для join и агрегации. Чем удачнее распределение, тем меньше сетевого обмена.' },
          { t: 'table', headers: ['Свойство', 'Строчное хранение', 'Колоночное хранение'], rows: [
            ['Чтение', 'Читает всю строку, даже если нужны две колонки', 'Читает только нужные колонки'],
            ['Сжатие', 'Хуже: разные типы в одной строке', 'Лучше: однотипные значения и кодирование'],
            ['Запись одной строки', 'Дёшево', 'Дорого: задевает несколько колонок и блоков'],
            ['Агрегации', 'Много лишнего I/O', 'Быстро за счёт column pruning и vectorization'],
            ['Типичный workload', 'OLTP, очереди, CRUD', 'OLAP, отчёты, витрины, BI'],
          ] },
          { t: 'p', text: 'Колоночные файлы хранят статистику по блокам — min/max, null count, иногда bloom filter. Планировщик использует её для zone map pruning: блоки, которые не попадают в фильтр, не читаются. Поэтому порядок сортировки и партиционирование важнее, чем количество индексов: они определяют, какие блоки вообще будут открыты.' },
          { t: 'h', text: 'Distribution key и обмен данными' },
          { t: 'p', text: 'В Redshift строки распределяются по узлам согласно `DISTSTYLE`: `KEY` хеширует по колонке, `EVEN` раскладывает равномерно, `ALL` копирует таблицу на каждый узел. Если join идёт по distribution key обеих таблиц, данные уже лежат рядом и обмен не нужен. Иначе планировщик делает broadcast маленькой стороны или redistribution больших сторон — это дорого и чувствительно к skew.' },
          { t: 'code', text: `CREATE TABLE fact_orders (
    order_id   BIGINT ENCODE az64,
    user_id    BIGINT ENCODE az64,
    order_date DATE ENCODE az64,
    amount     NUMERIC(12, 2) ENCODE az64
)
DISTSTYLE KEY
DISTKEY (user_id)
COMPOUND SORTKEY (order_date, user_id);`, lang: 'sql' },
          { t: 'p', text: 'BigQuery не даёт выбирать distribution key: хранение и вычисления разделены, а данные автоматически раскладываются по слотам. Snowflake использует микропартиции и автоматическое кластеризованное хранение, поэтому явный distribution key там тоже не нужен. ClickHouse распределяет данные между шардами на уровне кластера, а внутри шарда порядок задаётся `ORDER BY`.' },
          { t: 'h', text: 'Partitioning, clustering и sort keys' },
          { t: 'p', text: 'Партиционирование разрезает таблицу на независимые сегменты по значению колонки: обычно по дате. Запрос с фильтром по дате читает только нужные партиции — это partition pruning. Внутри партиции clustering или sort key задаёт физический порядок, который помогает отсекать блоки по второму измерению: стране, статусу, пользователю.' },
          { t: 'code', text: `CREATE OR REPLACE TABLE dwh.fact_orders
PARTITION BY DATE(order_ts)
CLUSTER BY user_id, status
AS
SELECT order_id, user_id, status, amount, order_ts
FROM staging.orders;`, lang: 'sql' },
          { t: 'code', text: `CREATE TABLE fact_orders (
    order_id   UInt64,
    user_id    UInt64,
    order_date Date,
    status     LowCardinality(String),
    amount     Decimal(12, 2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY (user_id, order_date, order_id);`, lang: 'sql' },
          { t: 'table', headers: ['Система', 'Распределение', 'Партиционирование и сортировка', 'Нюанс'], rows: [
            ['Redshift', 'DISTKEY / EVEN / ALL', 'COMPOUND или INTERLEAVED SORTKEY, dist key', 'Нужно вручную выбирать ключи под join'],
            ['BigQuery', 'Автоматически, слоты', 'PARTITION BY дата, CLUSTER BY до 4 колонок', 'Нет индексов и distribution key'],
            ['Snowflake', 'Микропартиции автоматически', 'Кластеризация по ключу, поиск по метаданным', 'Ключ кластеризации влияет на pruning'],
            ['ClickHouse', 'Шарды и реплики на уровне кластера', 'PARTITION BY и ORDER BY внутри MergeTree', 'ORDER BY — это первичный ключ и сортировка'],
          ] },
          { t: 'note', text: 'Ключ распределения с высокой кардинальностью и перекосом (например, `country`) сведёт параллелизм к одной перегруженной задаче. Проверяйте распределение через системные представления, а не по интуиции.', kind: 'warn' },
          { t: 'note', text: 'Партиционирование по колонке с миллионами уникальных значений создаёт миллионы мелких партиций и убивает производительность. Партиция должна соответствовать типичному фильтру: день, месяц, регион.', kind: 'info' },
        ],
      },
      {
        id: 'warehouses-cost',
        title: 'Materialized views и cost-модель',
        blocks: [
          { t: 'p', text: 'Materialized view хранит результат запроса физически и обновляется при изменении базовых таблиц или по расписанию. Это способ платить за тяжёлую агрегацию один раз, а не на каждом открытии дашборда. Но MV не бесплатны: они занимают место, требуют refresh и могут отставать от источника. Для real-time отчётности важнее указать допустимую задержку, чем гнаться за «нулевым лагом».' },
          { t: 'code', text: `CREATE MATERIALIZED VIEW dwh.daily_revenue
PARTITION BY dt
CLUSTER BY country
AS
SELECT
    DATE(created_at) AS dt,
    country,
    SUM(amount) AS revenue,
    COUNT(DISTINCT order_id) AS orders
FROM dwh.orders
GROUP BY dt, country;`, lang: 'sql' },
          { t: 'p', text: 'BigQuery обновляет MV инкрементально при поддержке запроса и может использовать их для rewrite; Snowflake поддерживает автоматическую кластеризацию и refresh; Redshift требует явного `REFRESH MATERIALIZED VIEW`; в ClickHouse materialized view — это скорее триггер на вставку, который пишет в целевую таблицу, а не автоматически обновляемый снимок.' },
          { t: 'table', headers: ['Система', 'За что платят', 'Как экономить'], rows: [
            ['Redshift', 'Часы работы узлов или RPU, concurrency scaling, storage', 'Пауза кластера, WLM, сжатие, короткие запросы в spectrum'],
            ['BigQuery', 'Байты, просканированные on-demand, или слоты', 'Partition pruning, clustering, отказ от SELECT *, dry run'],
            ['Snowflake', 'Кредиты за время работы warehouse и storage', 'Auto-suspend, правильный размер warehouse, кэш результатов'],
            ['ClickHouse', 'CPU, RAM и диск инстанса или облачные ресурсы', 'Разреженные индексы, кодек, TTL, материализованные агрегаты'],
          ] },
          { t: 'p', text: 'В BigQuery стоимость on-demand зависит от объёма прочитанных колонок и партиций, а не от времени выполнения. `SELECT *` на широкой таблице читает все колонки и все партиции; `LIMIT 10` не уменьшает scan, если нет фильтра и pruning. Проверяйте оценку через dry run и создавайте отдельные представления под типовые вопросы.' },
          { t: 'p', text: 'В Snowflake стоимость определяется временем работы virtual warehouse: пока он включён, кредиты расходуются даже на простаивающие запросы. `AUTO_SUSPEND` и `AUTO_RESUME` обязательны, а размер warehouse нужно подбирать под сложность запроса, а не «на максимум». Разные команды и нагрузки лучше изолировать разными warehouse, чтобы тяжёлый отчёт не тормозил ingest.' },
          { t: 'p', text: 'В Redshift стоимость — это зарезервированные узлы или RPU, поэтому простой кластер всё равно стоит денег. WLM-очереди и короткие запросы (SQA) помогают не блокировать дашборды тяжёлой загрузкой. В ClickHouse экономия — это прежде всего правильный `ORDER BY`, кодеки, TTL и отказ от чтения лишних колонок; облачный managed-сервис добавляет стоимость хранения и реплик.' },
          { t: 'note', text: 'Самый дешёвый запрос — тот, который не был выполнен. Кэш результатов, pre-aggregation, ограничение глубины истории и отказ от `SELECT *` экономят больше, чем смена тарифа.', kind: 'tip' },
          { t: 'p', text: 'Workload isolation — отдельная тема. Snowflake изолирует по warehouse, Redshift — по WLM-очередям и отдельным кластерам, BigQuery — по reservations и проектам, ClickHouse — по репликам и профилям квот. Смешивать ad-hoc аналитику, ETL и streaming ingest в одном пуле ресурсов почти всегда означает, что кто-то будет ждать.' },
        ],
      },
      {
        id: 'warehouses-compare',
        title: 'Сравнение и аналитические паттерны',
        blocks: [
          { t: 'table', headers: ['Критерий', 'Redshift', 'BigQuery', 'Snowflake', 'ClickHouse'], rows: [
            ['Архитектура', 'MPP-кластер, узлы', 'Serverless, разделение storage и compute', 'Разделение storage и compute, warehouse', 'Колоночный MergeTree, шарды'],
            ['Масштабирование', 'Узлы, concurrency scaling', 'Автоматическое, слоты', 'Размер warehouse за секунды', 'Вертикальное и шардирование'],
            ['Сильная сторона', 'Экосистема AWS и SQL', 'Простота, без серверов, большие scan', 'Гибкость, изоляция нагрузок', 'Скорость агрегаций на больших объёмах'],
            ['Слабость', 'Ручная настройка ключей', 'Стоимость непредсказуема без дисциплины', 'Кредиты и стоимость при простое', 'Точечные UPDATE, JOIN-паттерны, эксплуатация'],
            ['Когда выбирать', 'AWS, предсказуемый кластер', 'Разнородная аналитика без администрирования', 'Много команд и нагрузок', 'Логи, события, real-time дашборды'],
          ] },
          { t: 'p', text: 'Выбор хранилища почти всегда определяется контекстом: где уже живут данные, кто будет эксплуатировать систему, какие SLA и бюджет. Redshift логичен в AWS-контуре с сильной SQL-командой. BigQuery — когда нужна минимальная эксплуатация и эластичность. Snowflake — когда важны изоляция нагрузок и работа с несколькими облаками. ClickHouse — когда основная нагрузка — это широкие агрегации по событиям и логам, где важна скорость чтения.' },
          { t: 'h', text: 'Аналитические паттерны' },
          { t: 'list', items: [
            'Звезда: факты на уровне заказа или события, измерения с суррогатными ключами; join по небольшим dim-таблицам.',
            'Денормализация: широкие витрины под конкретный дашборд вместо универсальной модели.',
            'Pre-aggregation: ежедневные или часовые агрегаты, которые обновляются инкрементально.',
            'SCD2: история изменений измерения с `valid_from` и `valid_to` для корректных атрибутов на дату факта.',
            'Late-arriving data: факты приходят позже измерения; используйте суррогатные ключи и повторную привязку.',
            'MERGE/upsert: идемпотентная загрузка по бизнес-ключу вместо append-only дублей.',
          ] },
          { t: 'sql', text: `MERGE dwh.dim_user AS t
USING staging.users AS s
ON t.user_id = s.user_id
WHEN MATCHED AND s.updated_at > t.updated_at THEN UPDATE SET
    t.email = s.email,
    t.segment = s.segment,
    t.updated_at = s.updated_at
WHEN NOT MATCHED THEN INSERT (user_id, email, segment, updated_at)
VALUES (s.user_id, s.email, s.segment, s.updated_at);` },
          { t: 'sql', text: `-- BigQuery: удержание по когортам первого заказа
WITH first_order AS (
    SELECT user_id, MIN(DATE(created_at)) AS first_day
    FROM dwh.orders
    GROUP BY user_id
),
activity AS (
    SELECT
        o.user_id,
        DATE_DIFF(DATE(o.created_at), f.first_day, DAY) AS day_n
    FROM dwh.orders o
    JOIN first_order f USING (user_id)
)
SELECT first_day, day_n, COUNT(DISTINCT user_id) AS active_users
FROM activity
GROUP BY first_day, day_n
ORDER BY first_day, day_n;` },
          { t: 'p', text: 'Для SCD2 недостаточно обновлять текущую строку: при исправлении атрибута задним числом нужно закрыть старую версию и вставить новую, а факты связать с версией, действовавшей на дату события. Это дороже, но именно так отчёты перестают «переписывать прошлое» после изменения справочника.' },
          { t: 'note', text: 'Не тащите в хранилище OLTP-паттерн «обновить одну строку по id». Аналитические системы оптимизированы под пакетную запись и сканирование; частые одиночные UPDATE быстро упираются в стоимость и ограничения формата.', kind: 'warn' },
        ],
      },
      {
        id: 'warehouses-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            '`SELECT *` в BigQuery и Redshift: чтение всех колонок и всех партиций, счёт за неиспользованные данные.',
            'Distribution key по низкоселективной или перекошенной колонке: лишний redistribution и одна перегруженная задача.',
            'Партиционирование по `user_id` или `order_id`: миллионы мелких партиций и медленный планировщик.',
            'Сортировка не под те фильтры: zone map не отсекает блоки, хотя данные отсортированы.',
            'Ожидание мгновенного обновления materialized view: отчёт читает устаревшие данные.',
            'Один warehouse или кластер на ETL, BI и ad-hoc: конкуренция за ресурсы и непредсказуемые SLA.',
            'Точечные UPDATE в ClickHouse и попытки использовать его как OLTP-базу.',
            'Отсутствие статистики и dry run: стоимость запроса выясняется после счёта.',
          ] },
          { t: 'note', text: 'Перед изменением физической модели посмотрите, какие запросы реально выполняются. Настройка под гипотетический workload часто ухудшает те запросы, которые приносят пользу.', kind: 'warn' },
        ],
      },
      {
        id: 'warehouses-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'table', headers: ['Вопрос', 'Что важно ответить'], rows: [
            ['Почему колончатые хранилища быстрее для аналитики?', 'Читают только нужные колонки, лучше сжимаются, используют vectorized execution и zone maps'],
            ['Зачем distribution key?', 'Чтобы co-located join шёл без обмена; неправильный ключ даёт broadcast или redistribution'],
            ['Partition и cluster — в чём разница?', 'Partition режет таблицу на сегменты, cluster задаёт порядок внутри и помогает pruning по второму измерению'],
            ['Почему BigQuery дорожает?', 'Оплата за просканированные байты; SELECT *, отсутствие фильтра по партиции и слабое clustering увеличивают scan'],
            ['Когда Snowflake дороже ожидаемого?', 'Warehouse не засыпает, выбран слишком большой размер, тяжёлые запросы выполняются одновременно'],
            ['Как обновлять историю измерений?', 'SCD2: закрыть текущую версию, вставить новую, связать факты по дате'],
            ['Почему ClickHouse плох для UPDATE?', 'MergeTree оптимизирован под вставки и чтение; изменения дороги и асинхронны'],
            ['Как выбрать хранилище?', 'По облаку, workload, требованиям к SLA, команде и бюджету, а не по benchmark'],
          ] },
          { t: 'p', text: 'Практическое задание: дашборд ежедневно сканирует 5 ТБ в BigQuery и стоит слишком дорого. Хороший ответ: проверить запрос и план, добавить фильтр по дате, партиционировать и кластеризовать, убрать `SELECT *`, вынести pre-aggregation и ограничить глубину истории.' },
          { t: 'note', text: 'На собеседовании по хранилищам проверяют не знание кнопок, а понимание связи между физической раскладкой, планом запроса и счётом за ресурсы.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'lakehouse',
    title: 'Data Lake и Lakehouse: S3, Delta, Iceberg, Hudi',
    icon: '🏞️',
    level: 'middle',
    track: 'warehouse',
    dataset: 'ecommerce',
    intro: 'Data lake хранит любые файлы дёшево, но без транзакций, схем и нормального каталога быстро превращается в болото. Lakehouse добавляет к объектному хранилищу открытые табличные форматы с ACID, time travel и эволюцией схемы. Разберём, как устроены Delta Lake, Apache Iceberg и Hudi и как не утонуть в мелких файлах.',
    outcomes: [
      'Различать data lake, warehouse и lakehouse по гарантиям и стоимости.',
      'Проектировать партиционирование и раскладку файлов в объектном хранилище.',
      'Объяснять, как ACID-формат обеспечивает атомарные коммиты и time travel.',
      'Сравнивать Delta Lake, Iceberg и Hudi по метаданным и сценариям.',
      'Диагностировать и лечить проблему мелких файлов.',
    ],
    sections: [
      {
        id: 'lakehouse-concepts',
        title: 'Data Lake, Warehouse и Lakehouse',
        blocks: [
          { t: 'p', text: 'Warehouse требует schema-on-write: данные сначала приводят к модели, потом загружают. Data lake работает наоборот, schema-on-read: файлы лежат как есть, а структура интерпретируется при чтении. Это дёшево и гибко, но без каталога, валидации и транзакций озеро быстро заполняется дублями, несовместимыми схемами и файлами, о которых никто не помнит.' },
          { t: 'p', text: 'Lakehouse — компромисс: данные лежат в открытых файлах в объектном хранилище, а сверху добавлен табличный формат с метаданными, ACID-коммитами, схемой и time travel. Один и тот же набор данных читают Spark, Trino, Flink, DuckDB и warehouse-движки. Вы не заперты в проприетарном формате, но получаете большую часть гарантий хранилища.' },
          { t: 'table', headers: ['Подход', 'Хранение', 'Схема', 'Сильные стороны', 'Слабости'], rows: [
            ['Data lake', 'Файлы в S3/GCS/ADLS', 'Schema-on-read', 'Дёшево, любые форматы, гибкость', 'Нет ACID, каталога и качества без дисциплины'],
            ['Warehouse', 'Проприетарное или управляемое', 'Schema-on-write', 'Быстрые SQL, транзакции, governance', 'Дороже, меньше гибкости, lock-in'],
            ['Lakehouse', 'Открытые файлы + метаданные', 'Schema-on-write поверх open format', 'ACID, time travel, открытость, дешёвое хранение', 'Сложнее эксплуатация и compaction'],
          ] },
          { t: 'h', text: 'Объектное хранилище: что важно знать' },
          { t: 'p', text: 'S3, GCS и ADLS — не файловые системы. Они дают практически бесконечную ёмкость и высокую durability, но у них нет атомарного переименования каталога, дорогой `LIST` и плата за операции. Запись большого файла идёт через multipart upload. Современные S3 и GCS обеспечивают strong consistency на чтение после записи, но это не отменяет необходимости в транзакционном логе для набора файлов.' },
          { t: 'p', text: 'Ключ объекта — это просто строка, а «каталоги» — префиксы. `s3://lake/orders/dt=2026-01-01/part-0001.parquet` — один объект, а не файл в папке. Это влияет на переименование, листинг и конкурентную запись: два писателя, каждый из которых удаляет и пересоздаёт партицию, легко оставят смесь старых и новых файлов, если нет транзакционного коммита.' },
          { t: 'p', text: 'Классическая организация озера — медальон: `bronze` (сырые данные как пришли), `silver` (очищенные и нормализованные), `gold` (витрины и агрегаты). Слои разделяют ответственность: ошибка в бизнес-логике не требует повторной выгрузки из источника, если bronze сохранён и воспроизводим.' },
          { t: 'note', text: 'Data lake без каталога, владельцев данных и проверок качества — это не архитектура, а свалка. Lakehouse добавляет транзакции, но не заменяет governance.', kind: 'warn' },
          { t: 'note', text: 'Time travel и ACID не делают объектное хранилище резервной копией. Удаление старых снапшотов и VACUUM могут безвозвратно убрать историю.', kind: 'info' },
        ],
      },
      {
        id: 'lakehouse-layout',
        title: 'Файловая раскладка и партиционирование',
        blocks: [
          { t: 'p', text: 'Parquet — стандарт для аналитических данных: колоночное хранение, сжатие, статистика по row groups и predicate pushdown. ORC близок по возможностям и популярен в Hive-экосистеме. Avro хорош для строковой записи и эволюции схемы, но не для сканирующих запросов. JSON и CSV допустимы в bronze, но в silver и gold их лучше конвертировать.' },
          { t: 'table', headers: ['Формат', 'Модель', 'Когда использовать'], rows: [
            ['Parquet', 'Колоночная', 'Основной формат lakehouse, аналитика и Spark'],
            ['ORC', 'Колоночная', 'Hive/Trino-контуры, где он уже принят'],
            ['Avro', 'Строчная', 'Kafka, CDC, потоковая запись и эволюция схемы'],
            ['JSON/CSV', 'Строчная, текст', 'Сырой слой и обмен, но не основа витрин'],
          ] },
          { t: 'p', text: 'Партиционирование по дате — самый распространённый паттерн, потому что почти все запросы фильтруют по времени. Дополнительные измерения (страна, источник, тип события) добавляют только если они действительно используются в фильтрах и имеют умеренную кардинальность. Партиция по `user_id` создаст миллионы каталогов и маленьких файлов.' },
          { t: 'code', text: `s3://lake/silver/orders/
  dt=2026-10-01/
    part-00000.parquet
    part-00001.parquet
  dt=2026-10-02/
    part-00000.parquet
    part-00001.parquet`, lang: 'text' },
          { t: 'p', text: 'Iceberg поддерживает hidden partitioning: пользователь пишет `WHERE created_at > ...`, а движок сам применяет трансформацию `days(created_at)` и отсекает нужные файлы. Это лучше Hive-style партиций, потому что не требует колонки `dt` в запросе и позволяет менять схему партиционирования без перезаписи всей таблицы.' },
          { t: 'sql', text: `CREATE TABLE lake.orders (
    order_id   BIGINT,
    user_id    BIGINT,
    amount     DECIMAL(12, 2),
    created_at TIMESTAMP
)
USING iceberg
PARTITIONED BY (days(created_at), bucket(16, user_id));` },
          { t: 'h', text: 'Проблема мелких файлов' },
          { t: 'p', text: 'Каждый файл — это открытие, чтение метаданных и отдельная task. Тысячи файлов по несколько килобайт замедляют планирование, перегружают память драйвера и убивают параллелизм. Обычно целятся в файлы размером 128–512 МБ, а количество файлов на партицию держат в разумных пределах. Проблема появляется из-за микробатчей, частых append и партиционирования с высокой кардинальностью.' },
          { t: 'list', items: [
            'Delta Lake: `OPTIMIZE` переписывает мелкие файлы, `Z-ORDER BY` кластеризует данные по колонкам.',
            'Iceberg: `rewrite_data_files` и `rewrite_manifests` компактифицируют данные и метаданные.',
            'Hudi: compaction объединяет delta-файлы merge-on-read таблицы в базовые файлы.',
            'При загрузке уменьшайте число выходных файлов, но не до одной task: контролируйте размер файла.',
            'Батчите микробатчи: накапливайте данные перед записью, а не пишите каждые несколько секунд.',
            'Планируйте регулярный maintenance job, а не разовую уборку после инцидента.',
          ] },
          { t: 'p', text: 'Compaction — это не только размер файлов. Он переписывает данные, создаёт новые снапшоты и временно удваивает объём хранения. Запускайте его в окно низкой нагрузки, ограничивайте параллелизм и следите за retention старых снапшотов, иначе история и мусор начнут конкурировать за место.' },
          { t: 'note', text: 'Не партиционируйте по высокой кардинальности и не пишите по файлу на микробатч. Это две самые частые причины, по которым lakehouse начинает читать медленнее обычного warehouse.', kind: 'warn' },
        ],
      },
      {
        id: 'lakehouse-formats',
        title: 'ACID-форматы: Delta, Iceberg, Hudi',
        blocks: [
          { t: 'p', text: 'ACID-таблица — это набор data-файлов плюс метаданные, которые описывают, какие файлы составляют актуальный снапшот. Новая запись сначала добавляет файлы и атомарно коммитит новую версию метаданных. Читатель видит либо старый, либо новый снапшот, но не смесь. Именно поэтому возможны time travel, откат и конкурентные писатели без блокировки всей таблицы.' },
          { t: 'p', text: 'Конкурентность обычно оптимистическая: writers готовят изменения, а при коммите проверяют, не конфликтуют ли они с уже применённой версией. Конфликт может быть разрешён автоматически (добавление разных файлов), а может потребовать retry (изменение одних и тех же строк). Понимание этого важно при потоковой записи и нескольких ETL-джобах в одну таблицу.' },
          { t: 'table', headers: ['Формат', 'Метаданные', 'Time travel', 'Сильная сторона', 'Когда выбирать'], rows: [
            ['Delta Lake', 'JSON-лог `_delta_log` и Parquet-checkpoints', 'По версии или timestamp', 'Простой старт, MERGE, UniForm, экосистема Databricks', 'Spark-контур, нужен быстрый upsert'],
            ['Apache Iceberg', 'metadata.json, manifest list и manifests', 'По snapshot id или timestamp', 'Открытость, hidden partitioning, много движков', 'Multi-engine lakehouse и большие таблицы'],
            ['Apache Hudi', 'Timeline и индекс', 'По instant time', 'Upserts, incremental pull, merge-on-read', 'CDC и частые обновления строк'],
          ] },
          { t: 'p', text: 'Delta Lake хранит транзакционный лог в `_delta_log`: каждая версия — JSON-файл со списком добавленных и удалённых файлов, а старые версии сворачиваются в Parquet-checkpoint. `MERGE`, `UPDATE`, `DELETE` работают транзакционно. `OPTIMIZE` и `Z-ORDER` упорядочивают файлы, `VACUUM` удаляет старые, больше не нужные файлы, а deletion vectors уменьшают перезапись при точечных изменениях.' },
          { t: 'p', text: 'Iceberg разделяет метаданные на иерархию: metadata.json указывает на снапшоты, снапшот — на manifest list, тот — на manifests со списком data-файлов и статистикой. Такая структура позволяет планировщику отсекать файлы по метаданным, не читая данные, и поддерживает partition evolution. Iceberg используют Spark, Trino, Flink, Snowflake и BigQuery через внешние таблицы.' },
          { t: 'p', text: 'Hudi строится вокруг timeline и индекса, которые позволяют быстро находить файлы для upsert. Copy-on-write переписывает базовые файлы при обновлении, merge-on-read пишет delta-файлы и объединяет их при чтении или compaction. Hudi исторически силён в CDC-сценариях и инкрементальной выгрузке, но требует более внимательной настройки compaction.' },
          { t: 'sql', text: `-- Delta Lake: состояние таблицы на момент времени
SELECT * FROM lake.orders TIMESTAMP AS OF '2026-10-01 00:00:00';

-- Iceberg: конкретный снапшот
SELECT * FROM lake.orders VERSION AS OF 123456789;` },
          { t: 'sql', text: `MERGE INTO lake.orders AS t
USING staging.orders AS s
ON t.order_id = s.order_id
WHEN MATCHED AND s.updated_at > t.updated_at THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;` },
          { t: 'p', text: 'Каталог — не менее важная часть формата. Таблицы регистрируются в Hive Metastore, AWS Glue, Unity Catalog, Polaris, Nessie или REST-каталоге. Каталог хранит расположение, схему, права и иногда снапшоты. Без каталога движки не найдут таблицу, а без governance любой пользователь сможет прочитать сырые персональные данные.' },
          { t: 'note', text: 'VACUUM и удаление старых снапшотов несовместимы с обещанием «всегда можно откатиться». Определите retention истории до того, как настроите очистку, и не считайте time travel заменой резервному копированию.', kind: 'warn' },
          { t: 'note', text: 'Выбор формата редко решает проблему производительности сам по себе. Основной выигрыш дают партиционирование, compaction, pruning и правильный размер файлов.', kind: 'tip' },
        ],
      },
      {
        id: 'lakehouse-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            'Партиционирование по `user_id` или `event_id`: миллионы каталогов и мелких файлов.',
            'Микробатч на файл: потоковая запись каждые несколько секунд создаёт тысячи объектов.',
            'Редкий compaction: таблица читается всё медленнее, а `LIST` и планирование съедают время.',
            '`VACUUM` с маленьким retention сразу после включения time travel: история пропадает.',
            'Одновременная запись нескольких job без плана конфликтов: коммиты падают или перезаписывают друг друга.',
            'Хранение JSON и CSV в silver/gold: нет column pruning, статистики и нормального сжатия.',
            'Отсутствие каталога и владельцев данных: озеро превращается в набор безымянных файлов.',
            'Ожидание, что ACID-формат автоматически решит качество данных и малые файлы.',
          ] },
          { t: 'note', text: 'Lakehouse требует регулярного обслуживания: compaction, очистка снапшотов, обновление статистики и проверка каталога. Это операционная работа, а не разовая настройка.', kind: 'warn' },
        ],
      },
      {
        id: 'lakehouse-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'table', headers: ['Вопрос', 'Что важно ответить'], rows: [
            ['Чем lakehouse отличается от data lake?', 'Открытые файлы плюс табличный формат с ACID, схемой, каталогом и time travel'],
            ['Как работает ACID в Delta или Iceberg?', 'Data-файлы плюс атомарный коммит метаданных; читатель видит целостный снапшот'],
            ['Зачем нужен time travel?', 'Откат, аудит, воспроизводимость отчётов и отладка изменений; не замена бэкапу'],
            ['Почему мелкие файлы — проблема?', 'Накладные расходы на открытие, планирование и задачи; память драйвера и деградация scan'],
            ['Delta, Iceberg или Hudi?', 'Delta — Spark и простой MERGE; Iceberg — открытость и multi-engine; Hudi — CDC и upsert'],
            ['Что такое hidden partitioning?', 'Трансформация партиционирования в метаданных, не требующая колонки-партиции в запросе'],
            ['Что происходит при конкурентной записи?', 'Оптимистическая блокировка и проверка конфликтов на коммите; часть конфликтов требует retry'],
            ['Как обслуживать таблицу?', 'Compaction, очистка старых снапшотов, обновление статистики и контроль каталога'],
          ] },
          { t: 'p', text: 'Практическое задание: поток событий пишет в S3 каждые 30 секунд, через месяц таблица читается в десять раз медленнее. Хороший ответ: включить батчирование или микробатч побольше, настроить compaction, проверить размер и число файлов на партицию, ограничить кардинальность партиций и добавить регулярный maintenance job.' },
          { t: 'note', text: 'На собеседовании по lakehouse ждут понимания компромисса между дешёвым хранением и стоимостью метаданных, compaction и конкурентной записи.', kind: 'tip' },
        ],
      },
    ],
  },
  {
    id: 'cloud',
    title: 'Облака для DE: AWS, GCP, Azure',
    icon: '☁️',
    level: 'middle',
    track: 'cloud',
    dataset: 'ecommerce',
    intro: 'Облако даёт data-инженеру эластичные вычисления, объектное хранилище и управляемые сервисы, но одновременно добавляет IAM, сети, лимиты и счёт за egress. Разберём базу — идентичность, сеть и storage, — а затем сервисы AWS, GCP и Azure и типовую архитектуру аналитической платформы.',
    outcomes: [
      'Объяснять IAM-модель и принцип наименьших привилегий в AWS, GCP и Azure.',
      'Проектировать сеть и доступ к объектному хранилищу без публичных бакетов.',
      'Сопоставлять сервисы AWS, GCP и Azure по функциям.',
      'Считать стоимость хранения, вычислений и egress и управлять ею.',
      'Собирать end-to-end архитектуру ingestion, lakehouse, warehouse и BI.',
    ],
    sections: [
      {
        id: 'cloud-basics',
        title: 'IAM, сеть и объектное хранилище',
        blocks: [
          { t: 'p', text: 'Облачная инфраструктура строится вокруг account, project или subscription — границы биллинга и прав. Внутри выбирают регион и зоны доступности: регион задаёт задержку и юридические требования, зоны — отказоустойчивость. По модели shared responsibility провайдер отвечает за физическую инфраструктуру и гипервизор, а клиент — за идентичность, конфигурацию, шифрование, доступ к данным и безопасность кода.' },
          { t: 'h', text: 'IAM: кто, что и где может делать' },
          { t: 'p', text: 'Субъект (principal) — пользователь, сервис или приложение. Роль выдаёт временные разрешения, политика описывает действия и ресурсы. Принцип наименьших привилегий означает доступ только к нужному префиксу, таблице или секрету и только на время работы. Статические access keys в коде — прямой путь к утечке; используйте роли инстансов, workload identity, service accounts и managed identities.' },
          { t: 'code', text: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::lake-raw",
        "arn:aws:s3:::lake-raw/*"
      ]
    }
  ]
}`, lang: 'json' },
          { t: 'table', headers: ['Задача', 'AWS', 'GCP', 'Azure'], rows: [
            ['Идентичность сервиса', 'IAM role, instance profile', 'Service account, Workload Identity', 'Managed identity, service principal'],
            ['Политика доступа', 'JSON policy, permission boundary', 'IAM policy, roles', 'Azure RBAC, role assignment'],
            ['Федерация', 'OIDC, IAM Identity Center', 'Workload Identity Federation', 'Entra ID federation'],
            ['Секреты', 'Secrets Manager, Parameter Store', 'Secret Manager', 'Key Vault'],
          ] },
          { t: 'h', text: 'Сеть и приватный доступ' },
          { t: 'p', text: 'В AWS это VPC с подсетями, security groups и NACL, в GCP — VPC и firewall rules, в Azure — VNet и network security groups. Публичный endpoint хранилища удобен, но увеличивает поверхность атаки и часто запрещён политикой. Private endpoint или Private Service Connect направляет трафик к сервису через приватную сеть, а NAT gateway нужен для исходящего трафика из приватных подсетей.' },
          { t: 'list', items: [
            'Разделяйте публичные и приватные подсети; кластеры и БД держите в приватных.',
            'Используйте private endpoint для S3/GCS/ADLS, хранилищ и секретов.',
            'Ограничивайте security groups по источнику и порту, а не по `0.0.0.0/0`.',
            'Помните про egress: трафик между регионами и в интернет платный.',
            'Централизуйте логи и аудит доступа к данным с самого начала.',
          ] },
          { t: 'h', text: 'Объектное хранилище' },
          { t: 'p', text: 'S3, GCS и ADLS Gen2 — основа lakehouse. Объект адресуется ключом, а префикс имитирует каталог; атомарного переименования каталога нет. Включайте versioning и lifecycle-политики, шифрование на стороне сервиса или customer-managed key, блокировку публичного доступа. Presigned URL даёт временный доступ к одному объекту и удобен для обмена, но не заменяет IAM.' },
          { t: 'p', text: 'ADLS Gen2 добавляет hierarchical namespace и POSIX-подобные права, что упрощает работу с каталогами. S3 и GCS дают strong consistency на новые объекты и перезапись, но `LIST` по огромному префиксу остаётся дорогим — поэтому каталог таблиц и партиционирование важны и здесь.' },
          { t: 'table', headers: ['Критерий', 'Managed-сервисы', 'Self-hosted'], rows: [
            ['Операции', 'На провайдере: patching, HA, бэкапы', 'На команде: обновления, дежурства, отказы'],
            ['Стоимость', 'Opex, pay-as-you-go, выше за единицу', 'Ниже при стабильной нагрузке, но нужны люди и резервы'],
            ['Контроль', 'Ограничен настройками сервиса', 'Полный доступ к версиям и конфигурации'],
            ['Скорость старта', 'Минуты', 'Дни или недели'],
            ['Lock-in', 'Выше, если использовать проприетарные API', 'Ниже, но дороже в сопровождении'],
            ['Когда выбирать', 'Стандартные workload и небольшая команда', 'Специфичные требования, on-prem, регуляторика'],
          ] },
          { t: 'note', text: 'Публичный бакет с данными — классический инцидент. Блокируйте public access на уровне аккаунта, проверяйте политики и включайте аудит доступа к объектам.', kind: 'warn' },
          { t: 'note', text: 'Managed не значит «безопасный по умолчанию». Ответственность за IAM, сеть, шифрование и права на данные остаётся на клиенте.', kind: 'info' },
        ],
      },
      {
        id: 'cloud-aws-gcp',
        title: 'AWS и GCP',
        blocks: [
          { t: 'h', text: 'AWS: S3, Glue, EMR, Kinesis, Lambda, Redshift' },
          { t: 'table', headers: ['Сервис', 'Роль', 'Типичное применение'], rows: [
            ['S3', 'Объектное хранилище', 'Data lake, сырые и очищенные данные'],
            ['Glue', 'Serverless ETL и каталог', 'Spark-джобы, crawlers, Data Catalog'],
            ['EMR', 'Управляемый Hadoop и Spark', 'Большие Spark-кластеры, spot-инстансы'],
            ['Kinesis', 'Потоковая передача', 'Data Streams, Firehose, Analytics'],
            ['Lambda', 'Serverless-вычисления', 'Событийные триггеры и лёгкий ETL'],
            ['Redshift', 'MPP-хранилище', 'SQL-аналитика, Spectrum по S3'],
            ['Athena', 'SQL по S3', 'Ad-hoc запросы без кластера'],
            ['Step Functions, MWAA', 'Оркестрация', 'Workflow и Airflow'],
            ['Lake Formation', 'Governance', 'Права на уровне таблиц и колонок'],
          ] },
          { t: 'p', text: 'Типовой AWS-контур: события попадают в Kinesis, Firehose складывает их в S3, Glue или EMR чистит и обогащает данные, результат лежит в S3 в Delta или Iceberg, Redshift Spectrum и Athena читают витрины, а Step Functions или MWAA управляют зависимостями. Lambda хороша для реакций на события, но не для тяжёлых join и больших файлов.' },
          { t: 'code', text: `import boto3

s3 = boto3.client("s3")
s3.upload_file(
    Filename="events.parquet",
    Bucket="lake-raw",
    Key="events/dt=2026-10-01/events.parquet",
)`, lang: 'python' },
          { t: 'h', text: 'GCP: GCS, BigQuery, Dataflow, Pub/Sub, Dataproc' },
          { t: 'table', headers: ['Сервис', 'Роль', 'Типичное применение'], rows: [
            ['Cloud Storage', 'Объектное хранилище', 'Data lake и staging'],
            ['BigQuery', 'Serverless-хранилище', 'SQL-аналитика, streaming, ML'],
            ['Dataflow', 'Apache Beam', 'Потоковые и batch-пайплайны'],
            ['Pub/Sub', 'Обмен сообщениями', 'Event-driven ingestion'],
            ['Dataproc', 'Управляемый Spark и Hadoop', 'Миграция Spark-джобов'],
            ['Cloud Composer', 'Airflow', 'Оркестрация'],
            ['Dataplex, BigLake', 'Governance и единый доступ', 'Каталог, качество, внешние таблицы'],
          ] },
          { t: 'p', text: 'BigQuery разделяет хранение и вычисления: данные лежат в колоночном формате, а запросы выполняются на слотах. В on-demand режиме платят за просканированные байты, в capacity — за зарезервированные слоты. Streaming API и BigLake позволяют работать с потоковыми и внешними данными, но стоимость и задержка зависят от режима.' },
          { t: 'sql', text: `CREATE OR REPLACE TABLE dwh.fact_orders
PARTITION BY DATE(order_ts)
CLUSTER BY user_id
AS
SELECT order_id, user_id, amount, order_ts
FROM staging.orders
WHERE DATE(order_ts) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);` },
          { t: 'p', text: 'Разница между AWS и GCP не только в названиях. В AWS много компонентов, которые нужно собрать и связать, зато есть контроль над кластером. В GCP сильнее serverless-подход: BigQuery и Dataflow берут инфраструктуру на себя, но меньше возможностей тонкой настройки и выше зависимость от модели слотов и квот.' },
          { t: 'note', text: 'При миграции сопоставляйте не названия сервисов, а гарантии: кто хранит состояние, как достигается exactly-once, какие лимиты на размер сообщения и сколько стоит egress.', kind: 'tip' },
        ],
      },
      {
        id: 'cloud-azure-arch',
        title: 'Azure, стоимость и референсная архитектура',
        blocks: [
          { t: 'h', text: 'Azure: ADLS, Data Factory, Synapse, Event Hubs' },
          { t: 'table', headers: ['Сервис', 'Роль', 'Типичное применение'], rows: [
            ['ADLS Gen2', 'Объектное хранилище с иерархией', 'Data lake, права на каталоги'],
            ['Data Factory', 'Оркестрация и ETL', 'Пайплайны, копирование, триггеры'],
            ['Synapse Analytics', 'Warehouse и Spark', 'SQL-пулы, Spark-пулы, pipelines'],
            ['Event Hubs', 'Потоковая передача', 'Kafka-совместимый ingestion'],
            ['Databricks', 'Spark-платформа', 'Lakehouse, ML, Delta Live Tables'],
            ['Functions', 'Serverless', 'Событийные обработчики'],
            ['Purview', 'Governance', 'Каталог, lineage, классификация'],
            ['Entra ID', 'Идентичность', 'SSO, managed identities, RBAC'],
          ] },
          { t: 'p', text: 'В Azure данные обычно лежат в ADLS Gen2, ingestion и оркестрация — в Data Factory, тяжёлая обработка — в Databricks или Synapse Spark, а SQL-витрины — в dedicated SQL pool Synapse. Event Hubs принимает поток и совместим с Kafka API, что упрощает миграцию существующих producer и consumer.' },
          { t: 'h', text: 'Стоимость и безопасность' },
          { t: 'list', items: [
            'Хранение: lifecycle-политики, перевод в cold/archive, удаление ненужных версий и снапшотов.',
            'Вычисления: auto-suspend, spot/preemptible, правильный размер кластера, отказ от постоянно включённых dev-кластеров.',
            'Запросы: partition pruning, clustering, отказ от `SELECT *`, pre-aggregation и кэш результатов.',
            'Egress: держите compute рядом с данными и избегайте межрегионального трафика.',
            'Теги и бюджеты: owner, project, environment; алерты на аномальный рост.',
            'Доступ: least privilege, private endpoints, KMS, аудит, запрет публичных бакетов.',
            'Данные: классификация PII, маскирование, retention и право на удаление.',
            'Надёжность: бэкапы метаданных, DR-регион, проверка восстановления.',
          ] },
          { t: 'h', text: 'Референсная архитектура' },
          { t: 'code', text: `Источники: OLTP, приложения, SaaS, CDC
        |
        v
Ingestion: Kinesis / Pub/Sub / Event Hubs
        |
        v
Raw zone: S3 / GCS / ADLS (bronze)
        |
        v
Processing: Glue / Dataflow / Databricks / ADF
        |
        v
Lakehouse: Delta / Iceberg (silver, gold)
        |
        v
Warehouse: Redshift / BigQuery / Synapse
        |
        v
BI, ad-hoc SQL, ML, reverse ETL`, lang: 'text' },
          { t: 'p', text: 'В такой архитектуре важно разделить ответственность слоёв. Ingestion не занимается бизнес-логикой, bronze хранит сырые данные для воспроизводимости, silver отвечает за очистку и конформность, gold — за витрины. Каталог и lineage связывают слои, оркестратор управляет зависимостями, а мониторинг следит за свежестью, объёмом и качеством данных.' },
          { t: 'p', text: 'Для каждого слоя определите SLA: максимальное опоздание данных, допустимую долю ошибок, время восстановления. Без этого «архитектура есть», а понять, что данные устарели, можно только по жалобе пользователя. Алерты на freshness, schema drift, рост null и падение объёма дешевле, чем разбор инцидента постфактум.' },
          { t: 'note', text: 'Не начинайте с микросервисов и сложного стека. Для небольшой команды managed-сервисы и один lakehouse-контур почти всегда дешевле и надёжнее самописной платформы.', kind: 'tip' },
        ],
      },
      {
        id: 'cloud-errors',
        title: 'Частые ошибки',
        blocks: [
          { t: 'list', items: [
            'Статические access keys в коде и CI: утечка и невозможность быстро отозвать доступ.',
            'Публичный бакет или `0.0.0.0/0` в security group: данные и сервисы доступны интернету.',
            'Отсутствие private endpoint: трафик к хранилищу идёт через публичную сеть.',
            'Игнорирование egress: compute в одном регионе, данные в другом, счёт растёт незаметно.',
            'Постоянно включённые dev-кластеры и забытые warehouse: простой стоит как работа.',
            '`SELECT *` и отсутствие partition pruning: оплата за данные, которые не нужны.',
            'Один аккаунт и одна сеть на prod, staging и dev: инцидент в тестовой среде ломает прод.',
            'Отсутствие тегов, бюджета и алертов: стоимость выясняется в конце месяца.',
          ] },
          { t: 'note', text: 'Стоимость и безопасность — не отдельные проекты, а свойства архитектуры. Решения об IAM, сети, формате хранения и партиционировании принимаются вместе.', kind: 'warn' },
        ],
      },
      {
        id: 'cloud-interview',
        title: 'На собеседовании',
        blocks: [
          { t: 'table', headers: ['Вопрос', 'Что важно ответить'], rows: [
            ['Что такое shared responsibility?', 'Провайдер отвечает за физическую инфраструктуру, клиент — за IAM, конфигурацию, данные и код'],
            ['Роль или access key?', 'Роль с временными credentials; статические ключи хранить нельзя'],
            ['Зачем private endpoint?', 'Доступ к managed-сервису через приватную сеть без выхода в интернет'],
            ['S3 — это файловая система?', 'Нет: объекты и префиксы, нет атомарного rename, LIST дорогой'],
            ['Managed или self-hosted?', 'Managed для стандартных workload и малой команды; self-hosted для контроля и специфичных требований'],
            ['BigQuery on-demand или slots?', 'On-demand для непредсказуемой нагрузки, slots — для стабильной и предсказуемой'],
            ['Как контролировать облачные расходы?', 'Теги, бюджеты, lifecycle, auto-suspend, pruning, отказ от SELECT *, egress и мониторинг'],
            ['Спроектируйте ingestion для e-commerce', 'Источники, поток, raw zone, обработка, lakehouse, warehouse, BI, каталог и мониторинг'],
          ] },
          { t: 'p', text: 'Практическое задание: спроектировать платформу для интернет-магазина с потоком заказов, ежедневными выгрузками из OLTP и отчётами за 3 года. Хороший ответ: CDC или Event Hubs для потока, S3/ADLS для raw, Spark или Dataflow для очистки, Delta/Iceberg для lakehouse, Redshift/BigQuery для витрин, оркестратор, каталог, freshness-алерты и расчёт стоимости хранения и scan.' },
          { t: 'note', text: 'На собеседовании по cloud для DE важен не список сервисов, а умение собрать работающий контур с понятными границами доступа, стоимости и ответственности.', kind: 'tip' },
        ],
      },
    ],
  },
];
