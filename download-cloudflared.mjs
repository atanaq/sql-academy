// Скачивание cloudflared через TLS-стек Node (в обход Schannel).
import https from 'node:https';
import fs from 'node:fs';

const URL_ = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
const DEST = 'bin/cloudflared.exe';

function get(url, redirects = 0) {
  if (redirects > 10) { console.error('too many redirects'); process.exit(1); }
  https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      return get(new URL(res.headers.location, url).href, redirects + 1);
    }
    if (res.statusCode !== 200) { console.error('HTTP', res.statusCode); process.exit(1); }
    const out = fs.createWriteStream(DEST);
    res.pipe(out);
    out.on('finish', () => {
      out.close();
      console.log('DONE', fs.statSync(DEST).size);
      process.exit(0);
    });
  }).on('error', (e) => { console.error('ERR', e.message); process.exit(1); });
}

fs.mkdirSync('bin', { recursive: true });
get(URL_);
