// База знаний: объединение модулей трёх уровней.
// Контент лежит в отдельных файлах по уровням (junior/middle/senior).

import { LESSONS_JUNIOR } from './lessons-junior.js';
import { LESSONS_MIDDLE } from './lessons-middle.js';
import { LESSONS_SENIOR } from './lessons-senior.js';

export const LESSONS = [...LESSONS_JUNIOR, ...LESSONS_MIDDLE, ...LESSONS_SENIOR];
