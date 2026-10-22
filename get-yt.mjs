const vid = 'BhnO4bgxVq4';
const watch = `https://www.youtube.com/watch?v=${vid}`;
const proxies = [
  `https://api.allorigins.win/raw?url=${encodeURIComponent(watch)}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(watch)}`,
  `https://corsproxy.io/?${encodeURIComponent(watch)}`,
];

for (const p of proxies) {
  try {
    const r = await fetch(p, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    const t = await r.text();
    console.log('\n=== proxy', p.slice(0, 60), r.status, t.length);
    const has = t.includes('captionTracks');
    console.log('captionTracks:', has);
    if (has) {
      const i = t.indexOf('"captionTracks":');
      console.log(t.slice(i, i + 700));
      const fs = await import('node:fs');
      fs.writeFileSync('yt-page.html', t);
      console.log('saved yt-page.html');
      break;
    }
  } catch (e) {
    console.log('\n=== proxy', p.slice(0, 60), 'ERR', e.message);
  }
}
