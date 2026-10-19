import { PGlite } from '@electric-sql/pglite';
import { DATASETS } from './data/schema.js';

// Постоянные инстансы PGlite (по одному на набор данных) + простой мьютекс
// для сериализации запросов к одному инстансу.
const instances = new Map(); // datasetKey -> PGlite
const locks = new Map(); // datasetKey -> Promise (цепочка)

async function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  let release;
  const next = new Promise((r) => (release = r));
  locks.set(key, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

async function buildDataset(key) {
  const ds = DATASETS[key];
  if (!ds) throw new Error(`Неизвестный набор данных: ${key}`);
  const db = new PGlite();
  await db.exec(ds.ddl);
  await db.exec(ds.seedSql);
  return db;
}

export async function getInstance(key) {
  let db = instances.get(key);
  if (!db) {
    db = await buildDataset(key);
    instances.set(key, db);
  }
  return db;
}

export async function resetDataset(key) {
  const old = instances.get(key);
  instances.set(key, await buildDataset(key));
  if (old) {
    try { await old.close(); } catch { /* ignore */ }
  }
  return true;
}

/**
 * Выполнить один SQL-запрос (одиночный statement) на инстансе.
 * Возвращает { columns, rows, rowCount } или бросает ошибку.
 */
export async function runSingle(key, sql) {
  return withLock(key, async () => {
    const db = await getInstance(key);
    const res = await db.query(sql);
    return normalizeResult(res);
  });
}

/**
 * Выполнить сценарий (несколько statement) на инстансе песочницы.
 * Возвращает массив результатов по каждой команде.
 */
export async function runScript(key, sql) {
  return withLock(key, async () => {
    const db = await getInstance(key);
    const results = await db.exec(sql);
    return results.map(normalizeResult);
  });
}

function normalizeResult(res) {
  const columns = (res.fields || []).map((f) => f.name);
  const rows = (res.rows || []).map((row) => {
    const out = {};
    for (const c of columns) out[c] = row[c];
    return out;
  });
  return {
    columns,
    rows,
    rowCount: rows.length,
    affectedRows: res.affectedRows ?? (res.command ? 0 : undefined),
  };
}

// ============================================================================
// Сравнение результатов для тренажёра
// ============================================================================

// Каноническая форма значения для сравнения: null, число, строка, JSON.
function canonValue(v) {
  if (v === null || v === undefined) return { t: 'null' };
  if (v instanceof Date) return { t: 's', v: v.toISOString() };
  if (typeof v === 'number') return { t: 'n', v: v };
  if (typeof v === 'boolean') return { t: 'b', v };
  if (typeof v === 'object') return { t: 'j', v: stableStringify(v) };
  // строки: сравниваем как есть
  return { t: 's', v: String(v) };
}

function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const keys = Object.keys(v).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
}

function canonRow(row, columns) {
  // строка -> упорядоченный список пар (колонка, каноническое значение)
  const pairs = columns.map((c) => [c, canonValue(row[c])]);
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return pairs.map(([, v]) => v);
}

function canonRows(rows, columns, orderSensitive) {
  const canon = rows.map((r) => JSON.stringify(canonRow(r, columns)));
  if (!orderSensitive) canon.sort();
  return canon;
}

function colSet(columns) {
  return [...columns].sort();
}

/**
 * Сравнить фактические и ожидаемые результаты.
 * @returns {{ match: boolean, reason?: string, details?: object }}
 */
export function compareResults(actual, expected, orderSensitive = false) {
  const aCols = colSet(actual.columns);
  const eCols = colSet(expected.columns);
  if (JSON.stringify(aCols) !== JSON.stringify(eCols)) {
    return {
      match: false,
      reason: 'columns',
      details: {
        expectedColumns: expected.columns,
        actualColumns: actual.columns,
      },
    };
  }
  // приводим обе стороны к одинаковому порядку колонок (по expected.columns)
  const key = expected.columns; // уже известен порядок ожидаемых колонок
  const aCanon = canonRows(actual.rows, key, orderSensitive);
  const eCanon = canonRows(expected.rows, key, orderSensitive);
  if (JSON.stringify(aCanon) !== JSON.stringify(eCanon)) {
    return {
      match: false,
      reason: 'rows',
      details: {
        expectedRowCount: expected.rows.length,
        actualRowCount: actual.rows.length,
      },
    };
  }
  return { match: true };
}

// ============================================================================
// Выполнение задачи тренажёра: student SQL против expected SQL на чистой копии
// данных (через транзакцию с откатом).
// ============================================================================
// Выполнить запрос в транзакции, которая всегда откатывается,
// чтобы DML-запросы не изменяли общее состояние инстанса.
async function runInRollback(db, sql) {
  await db.exec('BEGIN');
  try {
    const res = normalizeResult(await db.query(sql));
    await db.exec('ROLLBACK');
    return res;
  } catch (e) {
    try { await db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw e;
  }
}

export async function runTaskCheck(key, expectedSql, studentSql, orderSensitive = false) {
  return withLock(key, async () => {
    const db = await getInstance(key);

    // 1) Ожидаемый результат на нетронутых данных (в откатываемой транзакции).
    let expected;
    try {
      expected = await runInRollback(db, expectedSql);
    } catch (e) {
      return { status: 'internal', error: 'Ошибка в эталонном запросе задачи: ' + e.message };
    }

    // 2) Запрос студента — тоже на нетронутых данных (в откатываемой транзакции).
    let actual;
    try {
      actual = await runInRollback(db, studentSql);
    } catch (e) {
      return { status: 'error', error: friendlyError(e) };
    }

    // 3) Сравнение.
    const cmp = compareResults(actual, expected, orderSensitive);
    return {
      status: cmp.match ? 'pass' : 'fail',
      actual: trimForResponse(actual),
      expected: cmp.match ? undefined : trimForResponse(expected),
      reason: cmp.match ? undefined : cmp.reason,
      details: cmp.match ? undefined : cmp.details,
    };
  });
}

function trimForResponse(result, maxRows = 50) {
  return {
    columns: result.columns,
    rows: result.rows.slice(0, maxRows),
    rowCount: result.rowCount,
    truncated: result.rowCount > maxRows,
    affectedRows: result.affectedRows,
  };
}

export function friendlyError(e) {
  const msg = String(e?.message || e).trim();
  // Чистим многострочные сообщения PostgreSQL от лишних переводов строк
  const first = msg.split('\n')[0].trim();
  return first || 'Неизвестная ошибка';
}
