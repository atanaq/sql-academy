// Браузерный движок: PGlite (PostgreSQL в WASM) + данные курса.
// Полностью заменяет серверный API — сайт становится статическим.

import { PGlite } from './vendor/pglite/index.js';
import { DATASETS } from './data/schema.js';
import { LESSONS } from './data/lessons.js';
import { TASKS } from './data/tasks.js';
import { REFERENCE } from './data/reference.js';

const instances = new Map();
const locks = new Map();

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

async function getInstance(key) {
  let db = instances.get(key);
  if (!db) {
    db = await buildDataset(key);
    instances.set(key, db);
  }
  return db;
}

async function resetDataset(key) {
  const old = instances.get(key);
  instances.set(key, await buildDataset(key));
  if (old) {
    try { await old.close(); } catch { /* ignore */ }
  }
  return true;
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

// ---------- Сравнение результатов ----------
function canonValue(v) {
  if (v === null || v === undefined) return { t: 'null' };
  if (v instanceof Date) return { t: 's', v: v.toISOString() };
  if (typeof v === 'number') return { t: 'n', v };
  if (typeof v === 'boolean') return { t: 'b', v };
  if (typeof v === 'object') return { t: 'j', v: stableStringify(v) };
  return { t: 's', v: String(v) };
}

function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const keys = Object.keys(v).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
}

function canonRow(row, columns) {
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

function compareResults(actual, expected, orderSensitive = false) {
  const aCols = colSet(actual.columns);
  const eCols = colSet(expected.columns);
  if (JSON.stringify(aCols) !== JSON.stringify(eCols)) {
    return {
      match: false,
      reason: 'columns',
      details: { expectedColumns: expected.columns, actualColumns: actual.columns },
    };
  }
  const aCanon = canonRows(actual.rows, expected.columns, orderSensitive);
  const eCanon = canonRows(expected.rows, expected.columns, orderSensitive);
  if (JSON.stringify(aCanon) !== JSON.stringify(eCanon)) {
    return {
      match: false,
      reason: 'rows',
      details: { expectedRowCount: expected.rows.length, actualRowCount: actual.rows.length },
    };
  }
  return { match: true };
}

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

function trimForResponse(result, maxRows = 50) {
  return {
    columns: result.columns,
    rows: result.rows.slice(0, maxRows),
    rowCount: result.rowCount,
    truncated: result.rowCount > maxRows,
    affectedRows: result.affectedRows,
  };
}

function friendlyError(e) {
  const msg = String(e?.message || e).trim();
  const first = msg.split('\n')[0].trim();
  return first || 'Неизвестная ошибка';
}

// ---------- Публичные функции (аналог REST API) ----------
export function meta() {
  return {
    title: 'SQL Middle Academy',
    datasets: Object.values(DATASETS).map((d) => ({ key: d.key, label: d.label, description: d.description, tables: d.tables })),
    lessonCount: LESSONS.length,
    taskCount: TASKS.length,
  };
}

export function lessonsList() {
  return LESSONS.map((l) => ({
    id: l.id, title: l.title, icon: l.icon, level: l.level,
    dataset: l.dataset, intro: l.intro, sectionCount: l.sections.length,
  }));
}

export function lessonById(id) {
  return LESSONS.find((l) => l.id === id) || null;
}

export function tasksList() {
  return TASKS.map(({ id, title, moduleId, level, difficulty, dataset }) => ({ id, title, moduleId, level, difficulty, dataset }));
}

export function taskById(id) {
  return TASKS.find((t) => t.id === id) || null;
}

export function reference() {
  return REFERENCE;
}

export async function runTaskCheck(taskId, sql) {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error('Задача не найдена');
  return withLock(task.dataset, async () => {
    const db = await getInstance(task.dataset);
    let expected;
    try {
      expected = await runInRollback(db, task.expected);
    } catch (e) {
      return { status: 'internal', error: 'Ошибка в эталонном запросе задачи: ' + e.message };
    }
    let actual;
    try {
      actual = await runInRollback(db, sql);
    } catch (e) {
      return { status: 'error', error: friendlyError(e) };
    }
    const cmp = compareResults(actual, expected, task.orderSensitive);
    return {
      taskId,
      status: cmp.match ? 'pass' : 'fail',
      actual: trimForResponse(actual),
      expected: cmp.match ? undefined : trimForResponse(expected),
      reason: cmp.match ? undefined : cmp.reason,
      details: cmp.match ? undefined : cmp.details,
    };
  });
}

export async function runSandbox(dataset, sql) {
  if (!DATASETS[dataset]) return { ok: false, error: 'Неизвестный набор данных' };
  try {
    const results = await withLock(dataset, async () => {
      const db = await getInstance(dataset);
      const res = await db.exec(sql);
      return res.map(normalizeResult);
    });
    return { ok: true, results };
  } catch (e) {
    return { ok: false, error: String(e.message || e).split('\n')[0] };
  }
}

export async function resetSandbox(dataset) {
  if (!DATASETS[dataset]) return { ok: false, error: 'Неизвестный набор данных' };
  await resetDataset(dataset);
  return { ok: true };
}
