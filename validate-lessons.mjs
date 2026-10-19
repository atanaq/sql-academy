// Валидация структуры модулей базы знаний.
const FILES = [
  ['junior', 'LESSONS_JUNIOR'],
  ['middle', 'LESSONS_MIDDLE'],
  ['senior', 'LESSONS_SENIOR'],
];
const VALID_BLOCK = new Set(['p', 'h', 'sql', 'list', 'note', 'table']);
const VALID_KIND = new Set(['tip', 'warn', 'info']);

let errors = 0;
const report = (msg) => { errors++; console.log('  ❌ ' + msg); };

for (const [file, exportName] of FILES) {
  let mod;
  try {
    mod = await import(`./server/data/lessons-${file}.js`);
  } catch (e) {
    console.log(`\n[${file}] IMPORT ERROR: ${e.message}`);
    errors++;
    continue;
  }
  const arr = mod[exportName];
  if (!Array.isArray(arr)) { report(`[${file}] нет массива ${exportName}`); continue; }
  console.log(`\n[${file}] модулей: ${arr.length}`);
  const ids = new Set();
  for (const m of arr) {
    if (!m.id || typeof m.id !== 'string') report(`${file}: модуль без id`);
    if (ids.has(m.id)) report(`${file}: дубль id ${m.id}`);
    ids.add(m.id);
    for (const k of ['title', 'icon', 'level', 'dataset', 'intro']) {
      if (!m[k]) report(`${m.id}: нет поля ${k}`);
    }
    if (!Array.isArray(m.sections) || !m.sections.length) report(`${m.id}: нет секций`);
    for (const s of m.sections || []) {
      if (!s.id || !s.title) report(`${m.id}: секция без id/title`);
      if (!Array.isArray(s.blocks)) { report(`${m.id}/${s.id}: нет blocks`); continue; }
      for (const b of s.blocks) {
        if (!VALID_BLOCK.has(b.t)) report(`${m.id}/${s.id}: неверный тип блока "${b.t}"`);
        if (b.t === 'sql' && typeof b.text !== 'string') report(`${m.id}/${s.id}: sql без text`);
        if (b.t === 'list' && !Array.isArray(b.items)) report(`${m.id}/${s.id}: list без items`);
        if (b.t === 'note' && b.kind && !VALID_KIND.has(b.kind)) report(`${m.id}/${s.id}: неверный kind "${b.kind}"`);
        if (b.t === 'table' && (!Array.isArray(b.headers) || !Array.isArray(b.rows))) report(`${m.id}/${s.id}: table без headers/rows`);
      }
    }
  }
  console.log(`  секций: ${arr.reduce((n, m) => n + (m.sections?.length || 0), 0)}`);
}

console.log(`\nИТОГО ошибок: ${errors}`);
process.exit(errors ? 1 : 0);
