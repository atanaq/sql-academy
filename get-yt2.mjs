const vid = 'BhnO4bgxVq4';
const urls = [
  `https://yt.lemnoslife.com/videos?part=snippet&id=${vid}`,
  `https://yt.lemnoslife.com/noKey/videos?part=snippet&id=${vid}`,
  `https://invidious.flokinet.to/api/v1/videos/${vid}`,
  `https://inv.tux.pizza/api/v1/videos/${vid}`,
  `https://invidious.projectsegfau.lt/api/v1/videos/${vid}`,
  `https://iv.ggtyler.dev/api/v1/videos/${vid}`,
  `https://invidious.jing.rocks/api/v1/videos/${vid}`,
  `https://yt.artemislena.eu/api/v1/videos/${vid}`,
  `https://pipedapi.reallyaweso.me/streams/${vid}`,
  `https://piped-api.lunar.icu/streams/${vid}`,
  `https://pipedapi.drgns.space/streams/${vid}`,
  `https://api.piped.yt/streams/${vid}`,
  `https://pipedapi.astartes.nl/streams/${vid}`,
];

for (const u of urls) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    const t = await r.text();
    let j = null;
    try { j = JSON.parse(t); } catch {}
    const title = j?.title || j?.items?.[0]?.snippet?.title || '';
    const desc = j?.description || j?.items?.[0]?.snippet?.description || '';
    const caps = j?.captions?.length ?? (j?.subtitles ? Object.keys(j.subtitles).length : 0);
    console.log(`\n=== ${u}\n  status=${r.status} len=${t.length} title=${JSON.stringify(title).slice(0,80)} caps=${caps} descLen=${desc.length}`);
    if (desc) {
      const fs = await import('node:fs');
      fs.writeFileSync('yt-desc.txt', desc);
      console.log('  desc saved');
    }
    if (j?.captions?.[0]?.url || j?.captions?.[0]?.baseUrl) {
      const fs = await import('node:fs');
      fs.writeFileSync('yt-caption-url.txt', j.captions[0].url || j.captions[0].baseUrl);
      console.log('  caption url saved');
      break;
    }
  } catch (e) {
    console.log(`\n=== ${u}\n  ERR ${e.message}`);
  }
}
