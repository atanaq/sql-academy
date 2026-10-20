// База знаний: SQL-модули (junior/middle/senior) + модули Data Engineering.

import { LESSONS_JUNIOR } from './lessons-junior.js';
import { LESSONS_MIDDLE } from './lessons-middle.js';
import { LESSONS_SENIOR } from './lessons-senior.js';
import { LESSONS_DE_INTRO } from './lessons-de-intro.js';
import { LESSONS_DE_PYTHON } from './lessons-de-python.js';
import { LESSONS_DE_PIPELINE } from './lessons-de-pipeline.js';
import { LESSONS_DE_BIGDATA } from './lessons-de-bigdata.js';
import { LESSONS_DE_ARCH } from './lessons-de-arch.js';

export const LESSONS = [
  ...LESSONS_JUNIOR,
  ...LESSONS_MIDDLE,
  ...LESSONS_SENIOR,
  ...LESSONS_DE_INTRO,
  ...LESSONS_DE_PYTHON,
  ...LESSONS_DE_PIPELINE,
  ...LESSONS_DE_BIGDATA,
  ...LESSONS_DE_ARCH,
];
