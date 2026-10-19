// GitHub API helper. Токен берётся из GH_TOKEN, в файл не пишется.
const TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GH_REPO || 'sql-academy';
const BRANCH = 'main';
const PAGES_PATH = '/docs';

if (!TOKEN) { console.error('GH_TOKEN is not set'); process.exit(1); }

async function api(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sql-academy-deploy',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, scopes: res.headers.get('x-oauth-scopes') };
}

const action = process.argv[2] || 'user';

if (action === 'user') {
  const r = await api('/user');
  if (r.status !== 200) { console.error('TOKEN ERROR', r.status, JSON.stringify(r.json).slice(0, 300)); process.exit(2); }
  console.log('LOGIN=' + r.json.login);
  console.log('SCOPES=' + (r.scopes || 'unknown'));
  console.log('NAME=' + (r.json.name || ''));
}

if (action === 'ensure-repo') {
  const u = await api('/user');
  const login = u.json.login;
  let r = await api(`/repos/${login}/${REPO}`);
  if (r.status === 404) {
    r = await api('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name: REPO, private: false, auto_init: false, description: 'SQL Middle Academy — PostgreSQL learning site' }),
    });
    console.log('CREATED=' + (r.status === 201 ? r.json.full_name : 'ERR ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 200)));
  } else if (r.status === 200) {
    console.log('EXISTS=' + r.json.full_name);
  } else {
    console.error('REPO CHECK ERR', r.status, JSON.stringify(r.json).slice(0, 200));
  }
  console.log('PUSH_URL=https://github.com/' + login + '/' + REPO + '.git');
  console.log('PAGES_URL=https://' + login + '.github.io/' + REPO + '/');
}

if (action === 'pages') {
  const u = await api('/user');
  const login = u.json.login;
  const body = JSON.stringify({ source: { branch: BRANCH, path: PAGES_PATH } });
  let r = await api(`/repos/${login}/${REPO}/pages`);
  if (r.status === 404) {
    r = await api(`/repos/${login}/${REPO}/pages`, { method: 'POST', body });
  } else if (r.status === 200) {
    r = await api(`/repos/${login}/${REPO}/pages`, { method: 'PUT', body });
  }
  console.log('PAGES_STATUS=' + r.status);
  console.log('PAGES=' + JSON.stringify(r.json).slice(0, 500));
}

if (action === 'pages-info') {
  const u = await api('/user');
  const login = u.json.login;
  const r = await api(`/repos/${login}/${REPO}/pages`);
  console.log('STATUS=' + r.status);
  console.log('HTML_URL=' + (r.json.html_url || ''));
  console.log('STATE=' + (r.json.status || ''));
  console.log('BUILD=' + JSON.stringify(r.json.build_type || ''));
}
