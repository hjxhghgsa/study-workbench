/* 学习工作台 · 离线缓存
   策略：HTML 走「版本化 key 的缓存优先」（命中 = 一定是当前版本）；静态资源缓存优先。
   ⚠️ 改页面内容必须同时 bump CACHE 版本（本文件 CACHE 常量 + 两页 register 的 ?v= 参数）。 */
const CACHE = 'study-plan-v54';
const STATIC = ['./app.ico',
                './practice.ico',
                './icon-192.png',
                './icon-512.png',
                './manifest.webmanifest',
                './modules/4pxEI2Pj2vAgMbhDGBihkM/index.html?_sw=study-plan-v54',
                './modules/WFMV47uv9q1ZcBh3MSObKz/index.html?_sw=study-plan-v54',
                './modules/ewlnOs4VumnFaJq4uT5g2h/119.html?_sw=study-plan-v54',
                './modules/bhcfvWwEd8tA6jm4yZZDnl/22.html?_sw=study-plan-v54',
                './modules/7nKlelktuy1RcFtZN8d5Gm/ICT.html?_sw=study-plan-v54',
                './ict.html?_sw=study-plan-v54'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(STATIC.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let u; try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) return;          /* 外站链接不拦 */
  const isDoc = req.mode === 'navigate' || /\.html?$/i.test(u.pathname) || /\/$/.test(u.pathname);
  if (isDoc) {
    const bust = new URL(u.href);
    bust.searchParams.set('_sw', CACHE);
    const bkey = new URL(u.pathname, u.href);   /* 只留 _sw 的纯版本 key */
    bkey.searchParams.set('_sw', CACHE);
    e.respondWith(
      caches.match(bust.href)
        .then(hit => hit || caches.match(bkey.href))
        .then(hit => hit || fetch(bust.href, { cache: 'no-store' }).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(bust.href, copy)).catch(() => {});
        }
        return res;
      })).catch(() => caches.match(req).then(h => h || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
