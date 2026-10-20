import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATASETS } from './data/schema.js';
import { LESSONS } from './data/lessons.js';
import { TASKS, taskSummary } from './data/tasks.js';
import { REFERENCE } from './data/reference.js';
import { runTaskCheck, runScript, resetDataset } from './engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 4000;

// ---------- Метаданные ----------
app.get('/api/meta', (req, res) => {
  res.json({
    title: 'SQL Middle Academy',
    datasets: Object.values(DATASETS).map((d) => ({ key: d.key, label: d.label, description: d.description, tables: d.tables })),
    lessonCount: LESSONS.length,
    taskCount: TASKS.length,
  });
});

// ---------- База знаний ----------
app.get('/api/lessons', (req, res) => {
  res.json(LESSONS.map((l) => ({ id: l.id, title: l.title, icon: l.icon, level: l.level, track: l.track || 'sql', dataset: l.dataset, intro: l.intro, sectionCount: l.sections.length })));
});

app.get('/api/lessons/:id', (req, res) => {
  const lesson = LESSONS.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Модуль не найден' });
  res.json(lesson);
});

// ---------- Тренажёр ----------
app.get('/api/tasks', (req, res) => {
  res.json(taskSummary());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = TASKS.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Задача не найдена' });
  res.json(task);
});

app.post('/api/run/task', async (req, res) => {
  const { taskId, sql } = req.body || {};
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Задача не найдена' });
  if (!sql || !String(sql).trim()) return res.status(400).json({ error: 'Пустой запрос' });
  try {
    const result = await runTaskCheck(task.dataset, task.expected, String(sql), task.orderSensitive);
    res.json({ taskId, ...result });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ---------- Песочница ----------
app.post('/api/sandbox/run', async (req, res) => {
  const { dataset, sql } = req.body || {};
  if (!DATASETS[dataset]) return res.status(400).json({ error: 'Неизвестный набор данных' });
  if (!sql || !String(sql).trim()) return res.status(400).json({ error: 'Пустой запрос' });
  try {
    const results = await runScript(dataset, String(sql));
    res.json({ ok: true, results });
  } catch (e) {
    res.json({ ok: false, error: String(e.message || e).split('\n')[0] });
  }
});

app.post('/api/sandbox/reset', async (req, res) => {
  const { dataset } = req.body || {};
  if (!DATASETS[dataset]) return res.status(400).json({ error: 'Неизвестный набор данных' });
  try {
    await resetDataset(dataset);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ---------- Схема ----------
app.get('/api/schema/:dataset', (req, res) => {
  const ds = DATASETS[req.params.dataset];
  if (!ds) return res.status(404).json({ error: 'Набор данных не найден' });
  res.json({ key: ds.key, label: ds.label, description: ds.description, tables: ds.tables });
});

// ---------- Справочник ----------
app.get('/api/reference', (req, res) => {
  res.json(REFERENCE);
});

// ---------- Статика ----------
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`✅ SQL Middle Academy запущен: http://localhost:${PORT}`);
});
