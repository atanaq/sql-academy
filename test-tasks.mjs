import { PGlite } from '@electric-sql/pglite';
import { DATASETS } from './server/data/schema.js';
import { TASKS } from './server/data/tasks.js';

async function build(key) {
  const ds = DATASETS[key];
  const db = new PGlite();
  await db.exec(ds.ddl);
  await db.exec(ds.seedSql);
  return db;
}

const dbs = {};
for (const t of TASKS) {
  if (!dbs[t.dataset]) dbs[t.dataset] = await build(t.dataset);
  const db = dbs[t.dataset];
  try {
    await db.exec('BEGIN');
    const r = await db.query(t.expected);
    await db.exec('ROLLBACK');
    console.log(`OK   ${t.id}  ${t.title.padEnd(34)} rows=${String(r.rows.length).padStart(2)}  first=${JSON.stringify(r.rows[0]).slice(0, 90)}`);
  } catch (e) {
    try { await db.exec('ROLLBACK'); } catch {}
    console.log(`FAIL ${t.id}  ${t.title}  -> ${String(e.message || e).split('\n')[0].slice(0, 120)}`);
  }
}
for (const [k, db] of Object.entries(dbs)) { try { await db.close(); } catch {} }
console.log('DONE');
