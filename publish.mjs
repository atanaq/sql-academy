// Публикация Data Engineer Academy на GitHub Pages.
// Использование:  GH_TOKEN=<fine-grained token> node publish.mjs
// Токену нужны права Contents: Read and write (и Pages: Read and write — опционально).
import { spawnSync } from 'node:child_process';

async function api(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.GH_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'de-academy-publish',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function main() {
  const TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'sql-academy';
  if (!TOKEN) {
    console.error('Укажите GH_TOKEN — fine-grained токен с правом Contents: Read and write.');
    return 1;
  }

  const user = await api('/user');
  if (user.status !== 200) {
    console.error('Токен недействителен:', user.status, JSON.stringify(user.json).slice(0, 200));
    return 2;
  }
  const owner = user.json.login;
  console.log('Владелец:', owner);

  let repo = await api(`/repos/${owner}/${REPO}`);
  if (repo.status === 404) {
    repo = await api('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name: REPO, private: false, description: 'Data Engineer Academy' }),
    });
    if (repo.status !== 201) {
      console.error('Не удалось создать репозиторий:', repo.status, JSON.stringify(repo.json).slice(0, 200));
      return 3;
    }
    console.log('Репозиторий создан:', repo.json.full_name);
  } else if (repo.status === 200) {
    console.log('Репозиторий:', repo.json.full_name);
  } else {
    console.error('Ошибка доступа к репозиторию:', repo.status);
    return 3;
  }

  console.log('Пушу ветку main...');
  const url = `https://x-access-token:${TOKEN}@github.com/${owner}/${REPO}.git`;
  const g = spawnSync('git', ['-c', 'http.sslBackend=openssl', 'push', url, 'main:main'], {
    stdio: 'inherit',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  if (g.status !== 0) {
    console.error('git push завершился с ошибкой.');
    return 4;
  }

  const body = JSON.stringify({ source: { branch: 'main', path: '/docs' } });
  let pages = await api(`/repos/${owner}/${REPO}/pages`);
  if (pages.status === 404) {
    pages = await api(`/repos/${owner}/${REPO}/pages`, { method: 'POST', body });
  } else if (pages.status === 200) {
    pages = await api(`/repos/${owner}/${REPO}/pages`, { method: 'PUT', body });
  }
  console.log('Pages:', pages.status, pages.json?.html_url || JSON.stringify(pages.json).slice(0, 200));

  for (let i = 0; i < 24; i++) {
    const info = await api(`/repos/${owner}/${REPO}/pages`);
    const st = info.json?.status || '?';
    console.log(`  сборка: ${st}`);
    if (st === 'built') break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`Готово: https://${owner}.github.io/${REPO}/`);
  return 0;
}

const code = await main();
await new Promise((r) => setTimeout(r, 100));
process.exitCode = code;
