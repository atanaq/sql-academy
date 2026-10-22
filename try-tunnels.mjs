const urls = [
  'https://pipedapi.kavin.rocks/streams/BhnO4bgxVq4',
  'https://pipedapi.adminforge.de/streams/BhnO4bgxVq4',
  'https://api.piped.private.coffee/streams/BhnO4bgxVq4',
  'https://pipedapi.leptons.xyz/streams/BhnO4bgxVq4',
  'https://yewtu.be/api/v1/videos/BhnO4bgxVq4',
  'https://invidious.nerdvpn.de/api/v1/videos/BhnO4bgxVq4',
  'https://iv.melmac.space/api/v1/videos/BhnO4bgxVq4',
  'https://invidious.f5.si/api/v1/videos/BhnO4bgxVq4',
  'https://invidious.privacyredirect.com/api/v1/videos/BhnO4bgxVq4',
];

for (const u of urls) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    console.log('\n===', u, r.status, t.length);
    let j = null;
    try { j = JSON.parse(t); } catch {}
    if (j) {
      console.log('title:', j.title || '');
      console.log('captions:', Array.isArray(j.captions) ? j.captions.length : 'no');
      console.log('subtitles:', j.subtitles ? Object.keys(j.subtitles).join(',') : 'no');
      if (j.captions?.[0]) console.log('caption0:', JSON.stringify(j.captions[0]).slice(0, 300));
    } else {
      console.log(t.slice(0, 250).replace(/\s+/g, ' '));
    }
  } catch (e) {
    console.log('\n===', u, 'ERR', e.message);
  }
}
