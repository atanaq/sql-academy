// Генерирует tmp_py_validate.py: решения + тесты всех Python-задач.
import fs from 'node:fs';
import { PYTHON_TASKS } from './public/data/python-tasks.js';

let out = '';
for (const t of PYTHON_TASKS) {
  out += `# === ${t.id} ===\n`;
  out += 'try:\n';
  const body = (t.solution + '\n' + t.tests).split('\n');
  for (const line of body) {
    out += '    ' + line + '\n';
  }
  out += `    print("OK ${t.id}")\n`;
  out += `except Exception as e:\n`;
  out += `    print("FAIL ${t.id}", type(e).__name__, e)\n`;
}
fs.writeFileSync('tmp_py_validate.py', out);
console.log('written', PYTHON_TASKS.length, 'tasks');
