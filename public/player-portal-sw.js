/* Only the generic offline page and public app icons are cached. Authenticated
   pages, private photos, Supabase requests and player records stay network-only. */
const CACHE='star-player-shell-v1';
const PUBLIC=['/player-portal/offline','/player-space/icons/icon-192.png','/player-space/icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('star-player-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin||event.request.method!=='GET')return;if(event.request.mode==='navigate'&&url.pathname.startsWith('/player-portal')){event.respondWith(fetch(event.request).catch(()=>caches.match('/player-portal/offline')));}else if(PUBLIC.includes(url.pathname)&&!url.search){event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));}});
