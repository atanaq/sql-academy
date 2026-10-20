import { ROADMAP } from './data/roadmap.js';
import { QUIZZES } from './data/quizzes.js';
import { INTERVIEW } from './data/interview.js';
import { PROJECTS } from './data/projects.js';
import { PYTHON_TASKS } from './data/python-tasks.js';

'use strict';

/* ============================================================
   SQL Middle Academy — frontend (vanilla JS + CodeMirror 5)
   ============================================================ */

const app = document.getElementById('app');

// ---------- Утилиты ----------
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- Кэш данных ----------
let _meta = null, _lessons = null, _tasks = null, _reference = null, _lessonCache = {};
const getMeta = () => _meta || (_meta = api('/api/meta'));
const getLessons = () => _lessons || (_lessons = api('/api/lessons'));
const getTasks = () => _tasks || (_tasks = api('/api/tasks'));
const getReference = () => _reference || (_reference = api('/api/reference'));
const getLesson = async (id) => _lessonCache[id] || (_lessonCache[id] = await api(`/api/lessons/${id}`));

// ---------- Состояние (localStorage) ----------
function loadState(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function saveState(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
let progress = loadState('sqlAcademy.progress', {});     // taskId -> 'solved' | 'revealed'
let drafts = loadState('sqlAcademy.drafts', {});         // taskId -> sql
let sandboxSql = loadState('sqlAcademy.sandboxSql', null);
let sandboxDataset = loadState('sqlAcademy.sandboxDataset', 'company');

// Прогресс по программе Data Engineer
let lessonProgress = loadState('de.lessonProgress', {});     // moduleId -> true
let quizProgress = loadState('de.quizProgress', {});         // quizId -> best score (0..1)
let pythonProgress = loadState('de.pythonProgress', {});     // taskId -> 'solved'
let projectProgress = loadState('de.projectProgress', {});   // projectId -> { stepIndex: true }

function markLesson(id, val) {
  if (val) lessonProgress[id] = true; else delete lessonProgress[id];
  saveState('de.lessonProgress', lessonProgress);
}
function saveQuizScore(id, score) {
  quizProgress[id] = Math.max(quizProgress[id] || 0, score);
  saveState('de.quizProgress', quizProgress);
}
function markPython(id, val) {
  if (val) pythonProgress[id] = 'solved'; else delete pythonProgress[id];
  saveState('de.pythonProgress', pythonProgress);
}
function toggleProjectStep(projectId, index) {
  const p = projectProgress[projectId] || {};
  if (p[index]) delete p[index]; else p[index] = true;
  projectProgress[projectId] = p;
  saveState('de.projectProgress', projectProgress);
}

// Уровни и фильтры
const LEVEL_LABEL = { junior: 'Junior', middle: 'Middle', senior: 'Senior' };
const TRACK_LABEL = {
  all: 'Все темы', sql: 'SQL', foundations: 'Основы', python: 'Python', modeling: 'Моделирование',
  pipeline: 'ETL и оркестрация', bigdata: 'Big Data', streaming: 'Стриминг', warehouse: 'Хранилища',
  cloud: 'Облака', quality: 'Качество данных', architecture: 'Архитектура', analytics: 'Аналитика', career: 'Карьера',
};
let lessonsLevelFilter = 'all';
let lessonsTrackFilter = 'all';
let trainerLevelFilter = 'all';

function markTask(taskId, val) {
  if (val === 'solved') progress[taskId] = 'solved';
  else if (val === 'revealed' && progress[taskId] !== 'solved') progress[taskId] = 'revealed';
  saveState('sqlAcademy.progress', progress);
}
function saveDraft(taskId, sql) { drafts[taskId] = sql; saveState('sqlAcademy.drafts', drafts); }

// ---------- Подсветка SQL (статический код) ----------
const SQL_KEYWORDS = new Set(('select from where join left right full inner outer cross on group by having order limit offset as and or not null in exists between like ilike is distinct union all intersect except case when then else end with recursive insert into values update set delete returning create table index view materialized drop alter add column primary key foreign references unique check default serial constraint using gin gist btree explain analyze begin commit rollback savepoint for share over partition rows range unbounded preceding following current row asc desc nulls first last lateral conflict do nothing excluded natural cast isolation level if return language double precision time zone at interval extract filter grouping sets rollup cube any some distinct').split(' '));
const SQL_FUNCTIONS = new Set(('count sum avg min max coalesce nullif round abs ceil floor string_agg array_agg json_agg jsonb_agg jsonb_build_object jsonb_array_elements jsonb_array_elements_text jsonb_array_length jsonb_set jsonb_pretty unnest array_length cardinality array_remove array_append array_to_string row_number rank dense_rank ntile lag lead first_value last_value percentile_cont percentile_disc date_trunc to_char age now current_date current_timestamp lower upper trim length substring position split_part replace concat format regexp_replace regexp_matches left right initcap generate_series extract greatest least bool_and bool_or jsonb_object_keys jsonb_each').split(' '));

function highlightSql(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === '-' && code[i + 1] === '-') {
      let j = code.indexOf('\n', i); if (j === -1) j = n;
      out += `<span class="tok-com">${escapeHtml(code.slice(i, j))}</span>`; i = j; continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      let j = code.indexOf('*/', i + 2); j = j === -1 ? n : j + 2;
      out += `<span class="tok-com">${escapeHtml(code.slice(i, j))}</span>`; i = j; continue;
    }
    if (c === "'") {
      let j = i + 1;
      while (j < n) {
        if (code[j] === "'" && code[j + 1] === "'") { j += 2; continue; }
        if (code[j] === "'") { j++; break; } j++;
      }
      out += `<span class="tok-str">${escapeHtml(code.slice(i, j))}</span>`; i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j), up = word.toLowerCase();
      let cls = '';
      if (SQL_KEYWORDS.has(up)) cls = 'tok-kw';
      else if (SQL_FUNCTIONS.has(up)) cls = 'tok-fn';
      out += `<span class="${cls}">${escapeHtml(word)}</span>`; i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9.]/.test(code[j])) j++;
      out += `<span class="tok-num">${escapeHtml(code.slice(i, j))}</span>`; i = j; continue;
    }
    if (/[=<>!+\-*/%|&~^]/.test(c)) {
      let j = i;
      while (j < n && /[=<>!+\-*/%|&~^]/.test(code[j])) j++;
      out += `<span class="tok-op">${escapeHtml(code.slice(i, j))}</span>`; i = j; continue;
    }
    out += escapeHtml(c); i++;
  }
  return out;
}

// ---------- Инлайн-разметка: **bold** и `code` ----------
function renderInline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  return s;
}

// ---------- Кнопки копирования / запуска в песочнице ----------
function copyText(text, btn) {
  const done = () => { btn.textContent = '✓'; setTimeout(() => (btn.textContent = 'Копировать'), 1200); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch { /* ignore */ }
  document.body.removeChild(ta);
}

// ---------- Рендер блоков (уроки/задачи) ----------
function renderBlocks(blocks, { sandboxButtons = false } = {}) {
  if (!blocks || !blocks.length) return '';
  return blocks.map((b) => {
    switch (b.t) {
      case 'p': return `<div class="block"><p>${renderInline(b.text)}</p></div>`;
      case 'h': return `<h3>${renderInline(b.text)}</h3>`;
      case 'list': return `<ul class="block-list">${b.items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ul>`;
      case 'note': {
        const label = b.kind === 'warn' ? '⚠️ Осторожно' : b.kind === 'tip' ? '💡 Совет' : 'ℹ️ Заметка';
        return `<div class="note ${b.kind || 'info'}"><span class="note-label">${label}</span>${renderInline(b.text)}</div>`;
      }
      case 'table': {
        const head = `<tr>${b.headers.map((h) => `<th>${renderInline(h)}</th>`).join('')}</tr>`;
        const rows = b.rows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(String(c))}</td>`).join('')}</tr>`).join('');
        return `<div class="table-wrap" style="margin:14px 0"><table class="data"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
      }
      case 'sql': return renderCodeBlock(b.text, b.caption, sandboxButtons, 'sql');
      case 'code': return renderCodeBlock(b.text, b.caption, false, b.lang || 'code');
      default: return '';
    }
  }).join('');
}

function renderCodeBlock(code, caption, sandboxButtons, lang) {
  const btns = [];
  if (sandboxButtons) btns.push(`<button class="btn small icon" data-run-sandbox="${escapeHtml(code).replace(/"/g, '&quot;')}" title="Открыть в песочнице">▶ в песочницу</button>`);
  btns.push(`<button class="btn small icon" data-copy="${escapeHtml(code).replace(/"/g, '&quot;')}" title="Скопировать">Копировать</button>`);
  const isSql = (lang || 'sql').toLowerCase() === 'sql';
  return `<div class="codeblock">
    <div class="codebar"><span class="cap">${escapeHtml(caption || lang || 'SQL')}</span><div class="actions">${btns.join('')}</div></div>
    <pre><code>${isSql ? highlightSql(code) : escapeHtml(code)}</code></pre>
  </div>`;
}

// ---------- Форматирование ячеек таблиц ----------
function formatCell(v) {
  if (v === null || v === undefined) return '<span class="cell-null">NULL</span>';
  if (typeof v === 'boolean') return `<span class="cell-bool">${v ? 'true' : 'false'}</span>`;
  if (typeof v === 'number') return `<span class="cell-num">${v}</span>`;
  if (v instanceof Date) return escapeHtml(v.toISOString().slice(0, 10));
  if (Array.isArray(v) || (typeof v === 'object')) return escapeHtml(JSON.stringify(v));
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.test(s)) return escapeHtml(s.slice(0, 10));
  if (/^-?\d+(\.\d+)?$/.test(s)) return `<span class="cell-num">${escapeHtml(s)}</span>`;
  return escapeHtml(s);
}

function renderResultTable(result) {
  if (!result || !result.columns || !result.columns.length) return '<div class="muted" style="padding:10px">Пустой результат</div>';
  const head = `<tr>${result.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
  const rows = (result.rows || []).map((r) => `<tr>${result.columns.map((c) => `<td>${formatCell(r[c])}</td>`).join('')}</tr>`).join('');
  const trunc = result.truncated ? `<div class="muted" style="padding:8px 12px;font-size:12.5px">Показаны первые ${result.rows.length} из ${result.rowCount} строк</div>` : '';
  return `<div class="table-wrap"><table class="data"><thead>${head}</thead><tbody>${rows}</tbody></table></div>${trunc}`;
}

// ---------- CodeMirror ----------
function createEditor(el, onRun, opts = {}) {
  return CodeMirror(el, {
    mode: opts.mode || 'text/x-pgsql',
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: false,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    autoCloseBrackets: true,
    styleActiveLine: true,
    hintOptions: { hint: CodeMirror.hint.sql, completeSingle: false },
    extraKeys: {
      'Ctrl-Enter': onRun,
      'Cmd-Enter': onRun,
      'Ctrl-Space': 'autocomplete',
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment',
    },
  });
}

// ---------- Роутер ----------
function navigate() {
  const hash = location.hash.replace(/^#\/?/, '') || 'roadmap';
  const [page, param] = hash.split('/');
  document.querySelectorAll('.nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === page);
  });
  switch (page) {
    case 'roadmap': renderRoadmap(); break;
    case 'lessons': renderLessons(param); break;
    case 'trainer': renderTrainer(param); break;
    case 'python': renderPython(param); break;
    case 'quiz': renderQuiz(param); break;
    case 'interview': renderInterview(); break;
    case 'projects': renderProjects(param); break;
    case 'sandbox': renderSandbox(); break;
    case 'reference': renderReference(); break;
    case 'schema': renderSchema(); break;
    default: renderRoadmap();
  }
}
window.addEventListener('hashchange', navigate);

// ============================================================
// БАЗА ЗНАНИЙ
// ============================================================
async function renderLessons(lessonId) {
  const allLessons = await getLessons();
  const lessons = allLessons.filter((l) =>
    (lessonsLevelFilter === 'all' || l.level === lessonsLevelFilter) &&
    (lessonsTrackFilter === 'all' || (l.track || 'sql') === lessonsTrackFilter));
  const current = lessons.find((l) => l.id === lessonId) || lessons[0] || allLessons[0];
  app.innerHTML = `<div class="page">
    <aside class="pane-side" id="lesson-side"></aside>
    <section class="pane-main narrow" id="lesson-main"><div class="empty-state"><div class="big">📚</div>Загрузка…</div></section>
  </div>`;
  const levelBtns = `<div class="level-filter">
      ${['all', 'junior', 'middle', 'senior'].map((lv) => `<button class="lvl-btn lvl-${lv} ${lessonsLevelFilter === lv ? 'active' : ''}" data-lv="${lv}">${lv === 'all' ? 'Все' : LEVEL_LABEL[lv]}</button>`).join('')}
    </div>`;
  const trackSelect = `<select id="lesson-track" style="width:100%;margin:0 8px 10px;max-width:270px">${Object.keys(TRACK_LABEL).map((t) => `<option value="${t}" ${lessonsTrackFilter === t ? 'selected' : ''}>${TRACK_LABEL[t]}</option>`).join('')}</select>`;
  let sideHtml = `<div class="side-title">Темы курса · ${lessons.length}</div>${levelBtns}${trackSelect}`;
  let lastLevel = null;
  for (const l of lessons) {
    if (l.level !== lastLevel) {
      sideHtml += `<div class="side-title level-head">${LEVEL_LABEL[l.level] || l.level}</div>`;
      lastLevel = l.level;
    }
    sideHtml += `<div class="side-item ${l.id === current.id ? 'active' : ''}" data-id="${l.id}">
        <span class="ico">${lessonProgress[l.id] ? '✅' : l.icon}</span><span class="lbl">${escapeHtml(l.title)}</span>
      </div>`;
  }
  const side = document.getElementById('lesson-side');
  side.innerHTML = sideHtml;
  side.querySelectorAll('.lvl-btn').forEach((b) => b.addEventListener('click', () => {
    lessonsLevelFilter = b.dataset.lv;
    renderLessons();
  }));
  document.getElementById('lesson-track').addEventListener('change', (e) => {
    lessonsTrackFilter = e.target.value;
    renderLessons();
  });
  side.querySelectorAll('.side-item').forEach((el) => {
    el.addEventListener('click', () => { location.hash = `#/lessons/${el.dataset.id}`; });
  });
  const full = await getLesson(current.id);
  const sections = full.sections.map((s) => `
    <div class="lesson-section">
      <h2>${escapeHtml(s.title)}</h2>
      ${renderBlocks(s.blocks, { sandboxButtons: true })}
    </div>`).join('');
  document.getElementById('lesson-main').innerHTML = `
    <div class="lesson-head">
      <h1>${full.icon} ${escapeHtml(full.title)}</h1>
      <span class="badge lvl-${full.level}">${LEVEL_LABEL[full.level] || full.level}</span>
      <span class="tag">${TRACK_LABEL[full.track || 'sql'] || full.track || 'SQL'}</span>
      <button class="btn ghost small" id="lesson-done">${lessonProgress[full.id] ? '✅ Изучено' : '✓ Отметить изученным'}</button>
    </div>
    ${full.outcomes?.length ? `<div class="note tip"><span class="note-label">🎯 Что освоите</span><ul class="block-list">${full.outcomes.map((o) => `<li>${renderInline(o)}</li>`).join('')}</ul></div>` : ''}
    <p class="intro">${renderInline(full.intro)}</p>
    ${sections}`;
  document.getElementById('lesson-done').addEventListener('click', () => {
    markLesson(full.id, !lessonProgress[full.id]);
    renderLessons(full.id);
  });
  bindCodeBlockButtons(document.getElementById('lesson-main'));
}

// ---------- Кнопки кодблоков (copy / run in sandbox) ----------
// Обрабатываются глобально через делегирование (см. document.addEventListener внизу).
function bindCodeBlockButtons() { /* no-op: handled globally */ }

// ============================================================
// ТРЕНАЖЁР
// ============================================================
async function renderTrainer(taskId) {
  const allTasks = await getTasks();
  const tasks = trainerLevelFilter === 'all' ? allTasks : allTasks.filter((t) => t.level === trainerLevelFilter);
  const summary = tasks.find((t) => t.id === taskId) || tasks[0] || allTasks[0];
  // Полная задача (условие, подсказка, решение) — отдельным запросом.
  const current = await api(`/api/tasks/${summary.id}`);
  const idx = tasks.findIndex((t) => t.id === current.id);
  const solved = allTasks.filter((t) => progress[t.id] === 'solved').length;

  app.innerHTML = `<div class="page">
    <aside class="pane-side" id="trainer-side"></aside>
    <section class="pane-main" id="trainer-main"></section>
  </div>`;

  // --- сайдбар: прогресс, фильтр по уровню, группировка по модулям ---
  const lessons = await getLessons();
  const byModule = {};
  for (const t of tasks) (byModule[t.moduleId] ||= []).push(t);
  const filters = `<div class="level-filter">
      ${['all', 'junior', 'middle', 'senior'].map((lv) => `<button class="lvl-btn lvl-${lv} ${trainerLevelFilter === lv ? 'active' : ''}" data-lv="${lv}">${lv === 'all' ? 'Все' : LEVEL_LABEL[lv]}</button>`).join('')}
    </div>`;
  let sideHtml = `<div class="side-title">Решено: ${solved} / ${allTasks.length}</div>
    <div class="progress-track" style="margin:0 8px 12px"><div class="progress-fill" style="width:${Math.round((solved / allTasks.length) * 100)}%"></div></div>${filters}`;
  for (const l of lessons) {
    const modTasks = byModule[l.id] || [];
    if (!modTasks.length) continue;
    sideHtml += `<div class="side-title" style="margin-top:14px">${l.icon} ${escapeHtml(l.title)}</div>`;
    for (const t of modTasks) {
      const done = progress[t.id] === 'solved';
      const revealed = progress[t.id] === 'revealed';
      sideHtml += `<div class="side-item ${t.id === current.id ? 'active' : ''}" data-id="${t.id}">
        <span class="lbl">${done ? '✅ ' : revealed ? '👁️ ' : ''}${escapeHtml(t.title)}</span>
        <span class="badge lvl-${t.level}">${LEVEL_LABEL[t.level]}</span>
      </div>`;
    }
  }
  const side = document.getElementById('trainer-side');
  side.innerHTML = sideHtml;
  side.querySelectorAll('.lvl-btn').forEach((b) => b.addEventListener('click', () => {
    trainerLevelFilter = b.dataset.lv;
    renderTrainer();
  }));
  side.querySelectorAll('.side-item').forEach((el) => {
    el.addEventListener('click', () => { location.hash = `#/trainer/${el.dataset.id}`; });
  });

  // --- основная панель ---
  await renderTrainerMain(current, idx, tasks);
}

async function renderTrainerMain(task, idx, tasks) {
  const main = document.getElementById('trainer-main');
  const difLabel = { easy: 'лёгкая', medium: 'средняя', hard: 'сложная' }[task.difficulty] || task.difficulty;
  const tablesHtml = (task.tables || []).map((tb) => `<span class="chip">${escapeHtml(tb)}</span>`).join('');
  const outCols = (task.output?.columns || []).map((c) => `<code class="inline-code">${escapeHtml(c)}</code>`).join(', ');
  const outNote = task.output?.note ? `<div class="muted" style="font-size:13px;margin-top:4px">${renderInline(task.output.note)}</div>` : '';
  const meta = await getMeta();
  const ds = meta.datasets.find((d) => d.key === task.dataset);
  const taskTables = (ds?.tables || []).filter((t) => (task.tables || []).includes(t.name));
  const schemaHint = taskTables.length ? `<details class="task-schema">
      <summary>🗄️ Схема таблиц задачи</summary>
      <div class="schema-cards" style="margin-top:10px">${taskTables.map((t) => `<div class="schema-card"><div class="sc-name">${escapeHtml(t.name)}</div><div class="sc-rows">${t.columns.map((c) => `<div class="sc-row"><span class="sc-col">${escapeHtml(c[0])}</span><span class="sc-type">${escapeHtml(c[1])}</span></div>`).join('')}</div></div>`).join('')}</div>
    </details>` : '';
  main.innerHTML = `
    <div class="trainer-head">
      <h1 style="margin:0">${escapeHtml(task.title)}</h1>
      <span class="badge lvl-${task.level}">${LEVEL_LABEL[task.level] || task.level}</span>
      <span class="badge ${task.difficulty}">${difLabel}</span>
      <span class="muted" style="font-size:13px">${escapeHtml(task.dataset === 'company' ? 'БД: Компания' : 'БД: Магазин')}</span>
    </div>
    ${task.tables && task.tables.length ? `<div class="chips">Таблицы: ${tablesHtml}</div>` : ''}
    <div class="trainer-desc">${renderBlocks(task.condition) || '<p class="muted">Условие для этой задачи пока не задано.</p>'}</div>
    <div class="output-panel">
      <div class="op-head">📤 Что нужно получить</div>
      <div class="op-cols">Колонки: ${outCols || '—'}</div>
      ${outNote}
    </div>
    ${schemaHint}

    <div class="editor-wrap">
      <div class="editor-toolbar">
        <span class="muted" style="font-size:13px">Ваш запрос</span>
        <span class="spacer"></span>
        <span class="hint-kbd">Ctrl+Space — подсказка · Ctrl+Enter — выполнить</span>
      </div>
      <div id="trainer-editor"></div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button class="btn primary" id="run-task">▶ Выполнить</button>
      <button class="btn ghost" id="show-hint">💡 Подсказка</button>
      <button class="btn ghost" id="show-solution">👁️ Показать решение</button>
    </div>

    <div id="trainer-hint"></div>
    <div id="trainer-solution"></div>
    <div id="trainer-result"></div>

    <div class="pager">
      <button class="btn" id="prev-task" ${idx === 0 ? 'disabled' : ''}>← Предыдущая</button>
      <button class="btn" id="next-task" ${idx === tasks.length - 1 ? 'disabled' : ''}>Следующая →</button>
      <span class="muted" style="font-size:13px">${idx + 1} / ${tasks.length}</span>
    </div>`;

  // --- редактор ---
  const editor = createEditor(document.getElementById('trainer-editor'), () => runTask(task));
  editor.setValue(drafts[task.id] ?? '-- Напишите ваш SQL-запрос здесь\n');
  editor.on('change', () => saveDraft(task.id, editor.getValue()));

  // --- события ---
  document.getElementById('run-task').addEventListener('click', () => runTask(task));
  document.getElementById('show-hint').addEventListener('click', () => {
    const el = document.getElementById('trainer-hint');
    el.innerHTML = el.innerHTML ? '' : `<div class="hint-box">💡 ${renderInline(task.hint || 'Подсказка для этой задачи пока не добавлена.')}</div>`;
  });
  document.getElementById('show-solution').addEventListener('click', () => {
    markTask(task.id, 'revealed');
    const el = document.getElementById('trainer-solution');
    if (el.innerHTML) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="solution-box"><div class="rp-head" style="padding:8px 12px;font-size:12.5px;font-weight:700;background:#101a30;border-bottom:1px solid var(--border-soft)">Эталонное решение</div>${renderCodeBlock(task.solution)}</div>`;
    bindCodeBlockButtons(el);
    document.getElementById('trainer-side') && updateTrainerSidebar();
  });
  document.getElementById('prev-task').addEventListener('click', () => { if (idx > 0) location.hash = `#/trainer/${tasks[idx - 1].id}`; });
  document.getElementById('next-task').addEventListener('click', () => { if (idx < tasks.length - 1) location.hash = `#/trainer/${tasks[idx + 1].id}`; });
}

async function updateTrainerSidebar() {
  // лёгкое обновление галочек после решения — перерисуем сайдбар
  const tasks = await getTasks();
  if (!tasks.length) return;
  const side = document.getElementById('trainer-side');
  if (!side) return;
  side.querySelectorAll('.side-item').forEach((el) => {
    const t = tasks.find((x) => x.id === el.dataset.id);
    if (!t) return;
    const done = progress[t.id] === 'solved';
    const revealed = progress[t.id] === 'revealed';
    el.querySelector('.lbl').innerHTML = `${done ? '✅ ' : revealed ? '👁️ ' : ''}${escapeHtml(t.title)}`;
  });
}

async function runTask(task) {
  const editor = document.querySelector('#trainer-editor .CodeMirror');
  if (!editor) return;
  const cm = editor.CodeMirror;
  const sql = cm.getValue();
  const resultEl = document.getElementById('trainer-result');
  resultEl.innerHTML = `<div class="result-banner" style="background:var(--bg-panel-2);color:var(--text-muted);border:1px solid var(--border)">⏳ Выполняю запрос…</div>`;
  try {
    const res = await api('/api/run/task', { method: 'POST', body: JSON.stringify({ taskId: task.id, sql }) });
    if (res.status === 'pass') {
      markTask(task.id, 'solved');
      resultEl.innerHTML = `<div class="result-banner pass">✅ Верно! Результат совпадает с ожидаемым.</div>
        <div class="result-panel"><div class="rp-head" style="color:var(--green)">Ваш результат (${res.actual.rowCount} строк)</div>${renderResultTable(res.actual)}</div>`;
      updateTrainerSidebar();
    } else if (res.status === 'error') {
      resultEl.innerHTML = `<div class="result-banner error">❌ Ошибка выполнения</div>
        <div class="codeblock"><pre><code>${escapeHtml(res.error)}</code></pre></div>`;
    } else if (res.status === 'fail') {
      let reasonHtml = '';
      if (res.reason === 'columns') {
        reasonHtml = `<div class="note warn"><span class="note-label">⚠️ Колонки не совпадают</span>
          Ожидались: <code class="inline-code">${res.details.expectedColumns.map(escapeHtml).join(', ')}</code><br>
          Получены: <code class="inline-code">${res.details.actualColumns.map(escapeHtml).join(', ')}</code></div>`;
      } else if (res.reason === 'rows') {
        reasonHtml = `<div class="note warn"><span class="note-label">⚠️ Строки не совпадают</span>
          Ожидалось строк: <strong>${res.details.expectedRowCount}</strong>, получено: <strong>${res.details.actualRowCount}</strong></div>`;
      }
      resultEl.innerHTML = `<div class="result-banner fail">❌ Неверно — результат отличается от ожидаемого.</div>${reasonHtml}
        <div class="diff-grid">
          <div class="result-panel expected"><div class="rp-head">Ожидаемый результат (${res.expected.rowCount} строк)</div>${renderResultTable(res.expected)}</div>
          <div class="result-panel actual"><div class="rp-head">Ваш результат (${res.actual.rowCount} строк)</div>${renderResultTable(res.actual)}</div>
        </div>`;
    } else {
      resultEl.innerHTML = `<div class="result-banner error">❌ ${escapeHtml(res.error || 'Неизвестная ошибка')}</div>`;
    }
  } catch (e) {
    resultEl.innerHTML = `<div class="result-banner error">❌ ${escapeHtml(e.message)}</div>`;
  }
}

// ============================================================
// ПЕСОЧНИЦА
// ============================================================
const SAMPLE_SQL = `-- Песочница: пишите любые запросы PostgreSQL.
-- Текущий набор данных — «Компания (HR)».

SELECT e.name, d.name AS department, e.salary
FROM employees e
JOIN departments d ON d.id = e.department_id
ORDER BY e.salary DESC
LIMIT 10;`;

async function renderSandbox() {
  const meta = await getMeta();
  app.innerHTML = `<div class="page">
    <section class="pane-main" style="display:flex;flex-direction:column">
      <div class="sandbox-toolbar">
        <select id="sandbox-dataset">${meta.datasets.map((d) => `<option value="${d.key}" ${d.key === sandboxDataset ? 'selected' : ''}>${escapeHtml(d.label)}</option>`).join('')}</select>
        <button class="btn primary" id="sandbox-run">▶ Выполнить</button>
        <button class="btn ghost" id="sandbox-reset">↺ Сбросить данные</button>
        <span class="spacer" style="flex:1"></span>
        <span class="hint-kbd">Ctrl+Enter — выполнить · поддерживается несколько команд через ;</span>
      </div>
      <div class="sandbox-layout">
        <div class="sandbox-editor">
          <div class="editor-wrap">
            <div class="editor-toolbar">
              <span class="muted" style="font-size:13px">Запрос</span>
              <span class="spacer"></span>
              <span class="hint-kbd">Ctrl+Space — автодополнение</span>
            </div>
            <div id="sandbox-editor"></div>
          </div>
          <div class="sandbox-results" id="sandbox-results"></div>
        </div>
        <aside class="sandbox-schema" id="sandbox-schema"></aside>
      </div>
    </section>
  </div>`;

  const editor = createEditor(document.getElementById('sandbox-editor'), () => runSandbox());
  editor.setValue(sandboxSql ?? SAMPLE_SQL);
  editor.on('change', () => { sandboxSql = editor.getValue(); saveState('sqlAcademy.sandboxSql', sandboxSql); });

  renderSandboxSchema(meta);

  document.getElementById('sandbox-dataset').addEventListener('change', (e) => {
    sandboxDataset = e.target.value;
    saveState('sqlAcademy.sandboxDataset', sandboxDataset);
    renderSandboxSchema(meta);
    document.getElementById('sandbox-results').innerHTML = '';
  });
  document.getElementById('sandbox-run').addEventListener('click', () => runSandbox());
  document.getElementById('sandbox-reset').addEventListener('click', async () => {
    try {
      await api('/api/sandbox/reset', { method: 'POST', body: JSON.stringify({ dataset: sandboxDataset }) });
      document.getElementById('sandbox-results').innerHTML = `<div class="result-banner pass">↺ Данные набора «${escapeHtml(meta.datasets.find((d) => d.key === sandboxDataset)?.label || '')}» сброшены к исходному состоянию.</div>`;
    } catch (e) {
      document.getElementById('sandbox-results').innerHTML = `<div class="result-banner error">❌ ${escapeHtml(e.message)}</div>`;
    }
  });
}

function renderSandboxSchema(meta) {
  const ds = meta.datasets.find((d) => d.key === sandboxDataset);
  if (!ds) return;
  document.getElementById('sandbox-schema').innerHTML =
    `<h4>🗄️ Схема: ${escapeHtml(ds.label)}</h4>
     <p class="muted" style="font-size:12.5px;margin:0 0 12px">${escapeHtml(ds.description)}</p>` +
    ds.tables.map((t) => `<div class="tbl">
        <div class="tbl-name">${escapeHtml(t.name)}</div>
        ${t.columns.map((c) => `<div class="col"><span>${escapeHtml(c[0])}</span> <span class="ctype">${escapeHtml(c[1])}</span></div>`).join('')}
      </div>`).join('');
}

async function runSandbox() {
  const el = document.querySelector('#sandbox-editor .CodeMirror');
  if (!el) return;
  const sql = el.CodeMirror.getValue();
  const resultsEl = document.getElementById('sandbox-results');
  resultsEl.innerHTML = `<div class="result-banner" style="background:var(--bg-panel-2);color:var(--text-muted);border:1px solid var(--border)">⏳ Выполняю…</div>`;
  try {
    const res = await api('/api/sandbox/run', { method: 'POST', body: JSON.stringify({ dataset: sandboxDataset, sql }) });
    if (!res.ok) {
      resultsEl.innerHTML = `<div class="result-banner error">❌ Ошибка</div><div class="codeblock"><pre><code>${escapeHtml(res.error)}</code></pre></div>`;
      return;
    }
    const parts = res.results.map((r, i) => {
      const label = res.results.length > 1 ? `Результат ${i + 1}` : 'Результат';
      if (r.columns && r.columns.length) {
        return `<div class="result-panel" style="margin-bottom:14px"><div class="rp-head">${label} (${r.rowCount} строк)</div>${renderResultTable(r)}</div>`;
      }
      return `<div class="result-banner pass" style="margin-bottom:14px">✅ ${label}: выполнено${r.affectedRows ? ` — затронуто строк: ${r.affectedRows}` : ''}</div>`;
    }).join('');
    resultsEl.innerHTML = parts || `<div class="result-banner pass">✅ Выполнено успешно.</div>`;
  } catch (e) {
    resultsEl.innerHTML = `<div class="result-banner error">❌ ${escapeHtml(e.message)}</div>`;
  }
}

// ============================================================
// СПРАВОЧНИК
// ============================================================
async function renderReference() {
  const ref = await getReference();
  app.innerHTML = `<div class="page">
    <aside class="pane-side" id="ref-side"></aside>
    <section class="pane-main narrow" id="ref-main"></section>
  </div>`;
  document.getElementById('ref-side').innerHTML =
    `<div class="side-title">Разделы</div>` +
    ref.map((s, i) => `<div class="side-item ${i === 0 ? 'active' : ''}" data-idx="${i}"><span class="ico">${s.icon}</span><span class="lbl">${escapeHtml(s.title)}</span></div>`).join('') +
    `<div class="side-title" style="margin-top:16px">Быстрый поиск</div><div style="padding:0 8px"><input id="ref-q" placeholder="Поиск…" style="width:100%;background:var(--bg-panel-2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text)"></div>`;
  document.getElementById('ref-side').querySelectorAll('.side-item').forEach((el) => {
    el.addEventListener('click', () => {
      document.getElementById('ref-side').querySelectorAll('.side-item').forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
      renderRefSection(ref, Number(el.dataset.idx), document.getElementById('ref-q').value);
    });
  });
  document.getElementById('ref-q').addEventListener('input', (e) => {
    const active = document.querySelector('#ref-side .side-item.active');
    const idx = active ? Number(active.dataset.idx) : 0;
    renderRefSection(ref, idx, e.target.value);
  });
  renderRefSection(ref, 0, '');
}

function renderRefSection(ref, idx, query) {
  const main = document.getElementById('ref-main');
  const q = (query || '').trim().toLowerCase();
  const itemHtml = (item) => `
      <div class="ref-item">
        <div class="ri-head">${renderInline(item.t)}</div>
        <div class="ri-code"><pre>${highlightSql(item.c)}</pre></div>
        ${item.n ? `<div class="ri-note">${renderInline(item.n)}</div>` : ''}
      </div>`;
  if (q) {
    const hits = [];
    ref.forEach((s) => s.items.forEach((it) => {
      if ((it.t + ' ' + it.c + ' ' + (it.n || '')).toLowerCase().includes(q)) hits.push({ section: s, item: it });
    }));
    main.innerHTML = `<h1>🔎 Поиск: ${escapeHtml(q)}</h1>
      <p class="muted">Найдено записей: ${hits.length} (поиск по всем разделам)</p>` +
      (hits.length ? hits.map(({ section, item }) => `
        <div class="ref-item">
          <div class="ri-head">${section.icon} ${renderInline(item.t)} <span class="muted" style="font-weight:400;font-size:12px">· ${escapeHtml(section.title)}</span></div>
          <div class="ri-code"><pre>${highlightSql(item.c)}</pre></div>
          ${item.n ? `<div class="ri-note">${renderInline(item.n)}</div>` : ''}
        </div>`).join('') : `<div class="empty-state">Ничего не найдено</div>`);
    return;
  }
  const section = ref[idx];
  main.innerHTML = `<h1>${section.icon} ${escapeHtml(section.title)}</h1>` +
    (section.items.length ? section.items.map(itemHtml).join('') : `<div class="empty-state">Раздел пуст</div>`);
}

// ============================================================
// СХЕМА БД
// ============================================================
async function renderSchema() {
  const meta = await getMeta();
  app.innerHTML = `<section class="pane-main narrow">
    <h1>🗄️ Схемы учебных баз данных</h1>
    <p class="intro">Две базы данных, на которых построены задачи тренажёра и примеры. Обе доступны в песочнице.</p>
    ${meta.datasets.map((ds) => `
      <div class="schema-ds">
        <h2>${escapeHtml(ds.label)}</h2>
        <p class="muted" style="margin:0 0 14px">${escapeHtml(ds.description)}</p>
        <div class="schema-cards">
          ${ds.tables.map((t) => `
            <div class="schema-card">
              <div class="sc-name">${escapeHtml(t.name)}</div>
              <div class="sc-rows">${t.columns.map((c) => `<div class="sc-row"><span class="sc-col">${escapeHtml(c[0])}</span><span class="sc-type">${escapeHtml(c[1])}</span></div>`).join('')}</div>
            </div>`).join('')}
        </div>
      </div>`).join('')}
  </section>`;
}

// ============================================================
// УЧЕБНЫЙ ПУТЬ
// ============================================================
async function renderRoadmap() {
  const lessons = await getLessons();
  const map = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const tasks = await getTasks();
  const doneModules = lessons.filter((l) => lessonProgress[l.id]).length;
  const solvedTasks = tasks.filter((t) => progress[t.id] === 'solved').length;
  const quizzesDone = Object.values(quizProgress).filter((s) => s >= 0.7).length;
  const pythonDone = Object.values(pythonProgress).filter((s) => s === 'solved').length;
  const nextModule = ROADMAP.flatMap((p) => p.modules).map((id) => map[id]).find((m) => m && !lessonProgress[m.id]);

  app.innerHTML = `<section class="pane-main narrow">
    <h1>🧭 Путь Data Engineer: с нуля до middle</h1>
    <p class="intro">Пошаговая программа на 6–9 месяцев (10–15 часов в неделю): теория → практика → проекты → собеседование. Проходите фазы по порядку, отмечайте модули и решайте задачи.</p>
    <div class="dash-grid">
      <div class="dash-card"><div class="dash-num">${doneModules}/${lessons.length}</div><div class="dash-lbl">модулей изучено</div></div>
      <div class="dash-card"><div class="dash-num">${solvedTasks}/${tasks.length}</div><div class="dash-lbl">SQL-задач решено</div></div>
      <div class="dash-card"><div class="dash-num">${pythonDone}/${PYTHON_TASKS.length}</div><div class="dash-lbl">Python-задач</div></div>
      <div class="dash-card"><div class="dash-num">${quizzesDone}/${QUIZZES.length}</div><div class="dash-lbl">квизов сдано</div></div>
    </div>
    ${nextModule ? `<div class="roadmap-next"><span class="muted">Следующий шаг:</span> <a href="#/lessons/${nextModule.id}">${nextModule.icon} ${escapeHtml(nextModule.title)}</a></div>` : '<div class="roadmap-next">🎉 Все модули отмечены! Переходите к проектам и собеседованию.</div>'}
    ${ROADMAP.map((phase, i) => {
      const mods = phase.modules.map((id) => map[id]).filter(Boolean);
      const done = mods.filter((m) => lessonProgress[m.id]).length;
      const pct = mods.length ? Math.round((done / mods.length) * 100) : 0;
      return `<div class="phase-card">
        <div class="phase-head">
          <div>
            <div class="phase-eyebrow">Фаза ${i + 1} · ${escapeHtml(phase.weeks)} · ${escapeHtml(LEVEL_LABEL[phase.level] || phase.level)}</div>
            <h2>${escapeHtml(phase.title)}</h2>
          </div>
          <div class="phase-pct">${done}/${mods.length}</div>
        </div>
        <div class="progress-track" style="margin:8px 0 12px"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p class="muted">${escapeHtml(phase.goal)}</p>
        <div class="phase-modules">${mods.map((m) => `<a class="phase-module ${lessonProgress[m.id] ? 'done' : ''}" href="#/lessons/${m.id}"><span>${lessonProgress[m.id] ? '✅' : '○'} ${m.icon} ${escapeHtml(m.title)}</span></a>`).join('')}</div>
        <details class="phase-checkpoint"><summary>✅ Чекпоинт фазы</summary><div>${escapeHtml(phase.checkpoint)}</div></details>
      </div>`;
    }).join('')}
  </section>`;
}

// ============================================================
// PYTHON-ТРЕНАЖЁР (Pyodide, реальный Python в браузере)
// ============================================================
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
let pyodideInstance = null, pyodidePromise = null;

async function ensurePyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = PYODIDE_CDN + 'pyodide.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Не удалось загрузить Pyodide. Нужен интернет при первом запуске.'));
          document.head.appendChild(s);
        });
      }
      pyodideInstance = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      return pyodideInstance;
    })();
  }
  return pyodidePromise;
}

async function renderPython(taskId) {
  const tasks = PYTHON_TASKS;
  const current = tasks.find((t) => t.id === taskId) || tasks[0];
  const idx = tasks.findIndex((t) => t.id === current.id);
  const done = Object.values(pythonProgress).filter((v) => v === 'solved').length;

  app.innerHTML = `<div class="page"><aside class="pane-side" id="py-side"></aside><section class="pane-main" id="py-main"></section></div>`;
  const side = document.getElementById('py-side');
  side.innerHTML = `<div class="side-title">Python-задачи · ${done}/${tasks.length}</div>` +
    tasks.map((t) => `<div class="side-item ${t.id === current.id ? 'active' : ''}" data-id="${t.id}">
      <span class="lbl">${pythonProgress[t.id] ? '✅ ' : ''}${escapeHtml(t.title)}</span>
      <span class="badge lvl-${t.level}">${LEVEL_LABEL[t.level]}</span>
    </div>`).join('');
  side.querySelectorAll('.side-item').forEach((el) => el.addEventListener('click', () => { location.hash = `#/python/${el.dataset.id}`; }));

  const main = document.getElementById('py-main');
  main.innerHTML = `
    <div class="trainer-head"><h1 style="margin:0">${escapeHtml(current.title)}</h1><span class="badge lvl-${current.level}">${LEVEL_LABEL[current.level]}</span></div>
    <div class="trainer-desc">${renderBlocks([{ t: 'p', text: current.description }])}</div>
    <div class="editor-wrap"><div class="editor-toolbar"><span class="muted" style="font-size:13px">Python · выполняется в браузере</span><span class="spacer"></span><span class="hint-kbd">Ctrl+Enter — проверить</span></div><div id="py-editor"></div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" id="py-check">✓ Проверить</button>
      <button class="btn ghost" id="py-run">▶ Запустить</button>
      <button class="btn ghost" id="py-hint">💡 Подсказка</button>
      <button class="btn ghost" id="py-solution">👁️ Решение</button>
    </div>
    <div id="py-hint"></div><div id="py-solution"></div><div id="py-result"></div>
    <div class="pager"><button class="btn" id="py-prev" ${idx === 0 ? 'disabled' : ''}>← Назад</button><button class="btn" id="py-next" ${idx === tasks.length - 1 ? 'disabled' : ''}>Вперёд →</button><span class="muted">${idx + 1} / ${tasks.length}</span></div>`;

  const editor = createEditor(document.getElementById('py-editor'), () => checkPython(current), { mode: 'text/x-python' });
  editor.setValue(drafts['py:' + current.id] ?? current.starter);
  editor.on('change', () => saveDraft('py:' + current.id, editor.getValue()));

  document.getElementById('py-check').addEventListener('click', () => checkPython(current));
  document.getElementById('py-run').addEventListener('click', () => runPython(current, false));
  document.getElementById('py-hint').addEventListener('click', () => {
    const el = document.getElementById('py-hint');
    el.innerHTML = el.innerHTML ? '' : `<div class="hint-box">💡 ${renderInline(current.hint || 'Подсказки нет — проверьте типы, крайние случаи и имена функций.')}</div>`;
  });
  document.getElementById('py-solution').addEventListener('click', () => {
    const el = document.getElementById('py-solution');
    el.innerHTML = el.innerHTML ? '' : renderCodeBlock(current.solution, 'python', false, 'python');
  });
  document.getElementById('py-prev').addEventListener('click', () => { if (idx > 0) location.hash = `#/python/${tasks[idx - 1].id}`; });
  document.getElementById('py-next').addEventListener('click', () => { if (idx < tasks.length - 1) location.hash = `#/python/${tasks[idx + 1].id}`; });
}

async function checkPython(task) {
  await runPython(task, true);
}

async function runPython(task, withTests) {
  const cmEl = document.querySelector('#py-editor .CodeMirror');
  if (!cmEl) return;
  const code = cmEl.CodeMirror.getValue();
  const resultEl = document.getElementById('py-result');
  resultEl.innerHTML = `<div class="result-banner" style="background:var(--bg-panel-2);color:var(--text-muted);border:1px solid var(--border)">⏳ Инициализирую Python (первый запуск ~10–20 с)…</div>`;
  try {
    const py = await ensurePyodide();
    const out = [];
    py.setStdout({ batched: (s) => out.push(s) });
    py.setStderr({ batched: (s) => out.push(s) });
    const full = withTests ? code + '\n' + task.tests : code;
    await py.loadPackagesFromImports(full);
    const ret = await py.runPythonAsync(full);
    if (withTests) {
      markPython(task.id, true);
      resultEl.innerHTML = `<div class="result-banner pass">✅ Все тесты прошли!</div>${out.length ? `<div class="codeblock"><pre><code>${escapeHtml(out.join('\n'))}</code></pre></div>` : ''}`;
    } else {
      resultEl.innerHTML = `<div class="result-banner pass">✅ Выполнено</div><div class="codeblock"><pre><code>${escapeHtml(out.join('\n') || (ret !== undefined ? String(ret) : 'Нет вывода'))}</code></pre></div>`;
    }
  } catch (e) {
    const msg = String(e.message || e);
    resultEl.innerHTML = `<div class="result-banner fail">${withTests ? '❌ Тесты не прошли' : '❌ Ошибка выполнения'}</div><div class="codeblock"><pre><code>${escapeHtml(msg)}</code></pre></div>`;
  }
}

// ============================================================
// КВИЗЫ
// ============================================================
async function renderQuiz(quizId) {
  if (!quizId) {
    app.innerHTML = `<section class="pane-main narrow">
      <h1>🧠 Квизы</h1><p class="intro">Проверьте понимание тем. Проходной результат — 70%.</p>
      <div class="quiz-grid">${QUIZZES.map((q) => {
        const best = quizProgress[q.id] || 0;
        return `<a class="quiz-card" href="#/quiz/${q.id}">
          <div class="quiz-card-title">${escapeHtml(q.title)}</div>
          <div class="muted" style="font-size:13px">${LEVEL_LABEL[q.level] || q.level} · ${q.questions.length} вопросов</div>
          <div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${Math.round(best * 100)}%"></div></div>
          <div class="muted" style="font-size:12px;margin-top:4px">${best ? 'Лучший результат: ' + Math.round(best * 100) + '%' : 'Ещё не проходили'}</div>
        </a>`;
      }).join('')}</div>
    </section>`;
    return;
  }
  const quiz = QUIZZES.find((q) => q.id === quizId) || QUIZZES[0];
  app.innerHTML = `<section class="pane-main narrow" id="quiz-main"></section>`;
  renderQuizBody(quiz);
}

function renderQuizBody(quiz) {
  const main = document.getElementById('quiz-main');
  main.innerHTML = `<h1>🧠 ${escapeHtml(quiz.title)}</h1>
    <p class="muted">${LEVEL_LABEL[quiz.level] || quiz.level} · ${quiz.questions.length} вопросов</p>
    <div class="quiz-list">${quiz.questions.map((q, qi) => `
      <div class="quiz-q" data-q="${qi}">
        <div class="quiz-q-text"><b>${qi + 1}.</b> ${renderInline(q.q)}</div>
        <div class="quiz-opts">${q.options.map((o, oi) => `<label class="quiz-opt"><input type="radio" name="q${qi}" value="${oi}"> <span>${renderInline(o)}</span></label>`).join('')}</div>
        <div class="quiz-explain" id="qx-${qi}"></div>
      </div>`).join('')}</div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><button class="btn primary" id="quiz-check">Проверить</button><a class="btn ghost" href="#/quiz">← К списку квизов</a></div>
    <div id="quiz-result"></div>`;
  document.getElementById('quiz-check').addEventListener('click', () => {
    let correct = 0;
    quiz.questions.forEach((q, qi) => {
      const sel = document.querySelector(`input[name="q${qi}"]:checked`);
      const val = sel ? Number(sel.value) : -1;
      const ok = val === q.answer;
      if (ok) correct++;
      const wrap = document.querySelector(`.quiz-q[data-q="${qi}"]`);
      wrap.querySelectorAll('.quiz-opt').forEach((el, oi) => {
        el.classList.toggle('correct', oi === q.answer);
        el.classList.toggle('wrong', oi === val && val !== q.answer);
      });
      const ex = document.getElementById(`qx-${qi}`);
      ex.innerHTML = (ok ? '✅ Верно. ' : '❌ Правильный ответ выделен. ') + renderInline(q.explain);
      ex.classList.toggle('ok', ok);
    });
    const score = correct / quiz.questions.length;
    saveQuizScore(quiz.id, score);
    document.getElementById('quiz-result').innerHTML = `<div class="result-banner ${score >= 0.7 ? 'pass' : 'fail'}">Результат: ${correct} из ${quiz.questions.length} (${Math.round(score * 100)}%)</div>`;
  });
}

// ============================================================
// СОБЕСЕДОВАНИЕ
// ============================================================
let ivTrack = 'all';
let ivQuery = '';

async function renderInterview() {
  app.innerHTML = `<section class="pane-main narrow">
    <h1>💬 Вопросы с собеседований</h1>
    <p class="intro">${INTERVIEW.length} вопросов с эталонными ответами. Фильтруйте по теме и ищите по тексту.</p>
    <div class="ref-search"><input id="iv-q" placeholder="Поиск по вопросу, ответу, тегу…" value="${escapeHtml(ivQuery)}"></div>
    <div class="level-filter" id="iv-tracks"></div>
    <div id="iv-list"></div>
  </section>`;
  const tracks = ['all', ...Array.from(new Set(INTERVIEW.map((x) => x.track)))];
  document.getElementById('iv-tracks').innerHTML = tracks.map((t) => `<button class="lvl-btn ${ivTrack === t ? 'active' : ''}" data-track="${t}">${t === 'all' ? 'Все темы' : escapeHtml(t)}</button>`).join('');
  document.getElementById('iv-tracks').querySelectorAll('.lvl-btn').forEach((b) => b.addEventListener('click', () => {
    ivTrack = b.dataset.track;
    document.getElementById('iv-tracks').querySelectorAll('.lvl-btn').forEach((x) => x.classList.toggle('active', x.dataset.track === ivTrack));
    renderInterviewList();
  }));
  document.getElementById('iv-q').addEventListener('input', (e) => { ivQuery = e.target.value; renderInterviewList(); });
  renderInterviewList();
}

function renderInterviewList() {
  const el = document.getElementById('iv-list');
  if (!el) return;
  const q = ivQuery.trim().toLowerCase();
  const items = INTERVIEW.filter((x) => (ivTrack === 'all' || x.track === ivTrack) &&
    (!q || (x.q + ' ' + x.a + ' ' + (x.tags || []).join(' ')).toLowerCase().includes(q)));
  el.innerHTML = items.length ? items.map((x) => `
    <details class="interview-item">
      <summary><span class="iv-q">${renderInline(x.q)}</span><span class="iv-tags">${(x.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</span></summary>
      <div class="iv-a">${renderInline(x.a)}</div>
    </details>`).join('') : `<div class="empty-state">Ничего не найдено</div>`;
}

// ============================================================
// ПРОЕКТЫ
// ============================================================
async function renderProjects(projectId) {
  if (!projectId) {
    app.innerHTML = `<section class="pane-main narrow">
      <h1>🛠️ Проекты для портфолио</h1>
      <p class="intro">End-to-end проекты, которые показывают работодателю, что вы умеете строить пайплайны. Проходите шаги и отмечайте выполненное.</p>
      <div class="quiz-grid">${PROJECTS.map((p) => {
        const done = Object.keys(projectProgress[p.id] || {}).length;
        const pct = Math.round((done / p.steps.length) * 100);
        return `<a class="quiz-card" href="#/projects/${p.id}">
          <div class="quiz-card-title">${escapeHtml(p.title)}</div>
          <div class="muted" style="font-size:13px">${LEVEL_LABEL[p.level] || p.level} · ${p.steps.length} шагов</div>
          <div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="muted" style="font-size:12px;margin-top:4px">${done}/${p.steps.length} шагов · ${escapeHtml(p.stack.join(' · '))}</div>
        </a>`;
      }).join('')}</div>
    </section>`;
    return;
  }
  const p = PROJECTS.find((x) => x.id === projectId) || PROJECTS[0];
  const doneMap = projectProgress[p.id] || {};
  app.innerHTML = `<section class="pane-main narrow">
    <a href="#/projects" class="muted" style="font-size:13px">← Все проекты</a>
    <h1>${escapeHtml(p.title)}</h1>
    <div class="chips">${p.stack.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div>
    <p class="intro">${escapeHtml(p.goal)}</p>
    <h2>Шаги</h2>
    <div class="project-steps">${p.steps.map((s, i) => `
      <label class="project-step ${doneMap[i] ? 'done' : ''}">
        <input type="checkbox" data-step="${i}" ${doneMap[i] ? 'checked' : ''}>
        <span><b>${i + 1}. ${escapeHtml(s.title)}</b><br><span class="muted">${escapeHtml(s.detail)}</span></span>
      </label>`).join('')}</div>
    <h2>Критерии приёмки</h2>
    <ul class="block-list">${p.acceptance.map((a) => `<li>${renderInline(a)}</li>`).join('')}</ul>
    ${p.tips?.length ? `<div class="note tip"><span class="note-label">💡 Советы</span>${p.tips.map((t) => renderInline(t)).join('<br>')}</div>` : ''}
  </section>`;
  document.querySelectorAll('.project-steps input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
    toggleProjectStep(p.id, Number(cb.dataset.step));
    cb.closest('.project-step').classList.toggle('done', cb.checked);
  }));
}

// ---------- старт ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy], [data-run-sandbox]');
  if (!btn) return;
  if (btn.dataset.copy) copyText(btn.dataset.copy, btn);
  else if (btn.dataset.runSandbox) {
    sandboxSql = btn.dataset.runSandbox;
    saveState('sqlAcademy.sandboxSql', sandboxSql);
    location.hash = '#/sandbox';
  }
});

navigate();
