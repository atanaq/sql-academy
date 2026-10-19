// Локальная замена fetch('/api/...') — вызывает браузерный движок напрямую.

import * as eng from './browser-engine.js';

export async function localApi(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body = opts.body ? JSON.parse(opts.body) : {};

  if (path === '/api/meta') return eng.meta();
  if (path === '/api/lessons') return eng.lessonsList();
  if (path.startsWith('/api/lessons/')) {
    const id = decodeURIComponent(path.slice('/api/lessons/'.length));
    const lesson = eng.lessonById(id);
    if (!lesson) throw new Error('Модуль не найден');
    return lesson;
  }
  if (path === '/api/tasks') return eng.tasksList();
  if (path.startsWith('/api/tasks/')) {
    const id = decodeURIComponent(path.slice('/api/tasks/'.length));
    const task = eng.taskById(id);
    if (!task) throw new Error('Задача не найдена');
    return task;
  }
  if (path === '/api/reference') return eng.reference();
  if (path === '/api/run/task' && method === 'POST') return eng.runTaskCheck(body.taskId, body.sql);
  if (path === '/api/sandbox/run' && method === 'POST') return eng.runSandbox(body.dataset, body.sql);
  if (path === '/api/sandbox/reset' && method === 'POST') return eng.resetSandbox(body.dataset);

  throw new Error('Неизвестный запрос: ' + path);
}
