// Полная валидация контента Data Engineer Academy.
import { LESSONS } from './server/data/lessons.js';
import { TASKS } from './server/data/tasks.js';
import { ROADMAP } from './public/data/roadmap.js';
import { QUIZZES } from './public/data/quizzes.js';
import { INTERVIEW } from './public/data/interview.js';
import { PYTHON_TASKS } from './public/data/python-tasks.js';
import { PROJECTS } from './public/data/projects.js';

let errors = 0;
const err = (m) => { errors++; console.log('❌', m); };
const BLOCKS = new Set(['p', 'h', 'sql', 'code', 'list', 'note', 'table']);
const KINDS = new Set(['tip', 'warn', 'info']);
const LEVELS = new Set(['junior', 'middle', 'senior']);
const DIFF = new Set(['easy', 'medium', 'hard']);

// ---- LESSONS ----
const lessonIds = new Set();
for (const l of LESSONS) {
  if (!l.id) err('lesson without id');
  if (lessonIds.has(l.id)) err('duplicate lesson id ' + l.id);
  lessonIds.add(l.id);
  for (const k of ['title', 'icon', 'level', 'intro']) if (!l[k]) err(l.id + ': no ' + k);
  if (!LEVELS.has(l.level)) err(l.id + ': bad level ' + l.level);
  if (!Array.isArray(l.sections) || !l.sections.length) err(l.id + ': no sections');
  for (const s of l.sections || []) {
    if (!s.id || !s.title || !Array.isArray(s.blocks)) { err(l.id + ': bad section ' + s.id); continue; }
    for (const b of s.blocks) {
      if (!BLOCKS.has(b.t)) err(l.id + '/' + s.id + ': bad block ' + b.t);
      if (b.t === 'note' && b.kind && !KINDS.has(b.kind)) err(l.id + ': bad note kind ' + b.kind);
      if (b.t === 'code' && !b.lang) err(l.id + '/' + s.id + ': code without lang');
    }
  }
}

// ---- ROADMAP ----
const phaseIds = new Set();
for (const p of ROADMAP) {
  if (!p.id || phaseIds.has(p.id)) err('roadmap bad id ' + p.id);
  phaseIds.add(p.id);
  for (const k of ['title', 'weeks', 'level', 'goal', 'checkpoint']) if (!p[k]) err(p.id + ': no ' + k);
  for (const mid of p.modules) if (!lessonIds.has(mid)) err(p.id + ': unknown module ' + mid);
}

// ---- TASKS ----
const taskIds = new Set();
for (const t of TASKS) {
  if (!t.id || taskIds.has(t.id)) err('task bad id ' + t.id);
  taskIds.add(t.id);
  if (!lessonIds.has(t.moduleId)) err(t.id + ': unknown module ' + t.moduleId);
  if (!LEVELS.has(t.level)) err(t.id + ': bad level');
  if (!DIFF.has(t.difficulty)) err(t.id + ': bad difficulty');
  if (!t.expected) err(t.id + ': no expected');
  if (!t.output || !Array.isArray(t.output.columns)) err(t.id + ': no output.columns');
  if (!Array.isArray(t.condition) || !t.condition.length) err(t.id + ': no condition');
}

// ---- QUIZZES ----
const quizIds = new Set();
for (const q of QUIZZES) {
  if (!q.id || quizIds.has(q.id)) err('quiz bad id ' + q.id);
  quizIds.add(q.id);
  for (const qq of q.questions) {
    if (!Array.isArray(qq.options) || qq.options.length < 2) err(q.id + ': bad options');
    if (!Number.isInteger(qq.answer) || qq.answer < 0 || qq.answer >= qq.options.length) err(q.id + ': bad answer');
    if (!qq.explain) err(q.id + ': no explain');
  }
}

// ---- INTERVIEW ----
const ivIds = new Set();
for (const x of INTERVIEW) {
  if (!x.id || ivIds.has(x.id)) err('interview bad id ' + x.id);
  ivIds.add(x.id);
  for (const k of ['track', 'level', 'q', 'a']) if (!x[k]) err(x.id + ': no ' + k);
}

// ---- PYTHON ----
const pyIds = new Set();
for (const p of PYTHON_TASKS) {
  if (!p.id || pyIds.has(p.id)) err('python bad id ' + p.id);
  pyIds.add(p.id);
  for (const k of ['title', 'description', 'starter', 'solution', 'tests']) if (!p[k]) err(p.id + ': no ' + k);
}

// ---- PROJECTS ----
const prIds = new Set();
for (const p of PROJECTS) {
  if (!p.id || prIds.has(p.id)) err('project bad id ' + p.id);
  prIds.add(p.id);
  if (!Array.isArray(p.steps) || !p.steps.length) err(p.id + ': no steps');
  if (!Array.isArray(p.acceptance) || !p.acceptance.length) err(p.id + ': no acceptance');
}

console.log('\nИТОГ:');
console.log('модулей:', LESSONS.length, '| секций:', LESSONS.reduce((n, l) => n + l.sections.length, 0));
console.log('фаз roadmap:', ROADMAP.length, '| SQL-задач:', TASKS.length);
console.log('квизов:', QUIZZES.length, '| вопросов:', QUIZZES.reduce((n, q) => n + q.questions.length, 0));
console.log('вопросов собеседования:', INTERVIEW.length, '| Python-задач:', PYTHON_TASKS.length, '| проектов:', PROJECTS.length);
console.log('ошибок:', errors);
process.exit(errors ? 1 : 0);
