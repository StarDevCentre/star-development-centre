/* Generic offline screen and public icons only. Parent pages, messages,
   authentication and all family records remain network-only. */
const CACHE='star-parent-shell-v1';
const OFFLINE='/parent-app/offline.html';
const PUBLIC=[OFFLINE,'/player-space/icons/icon-192.png','/player-space/icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('star-parent-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(event.request.mode==='navigate'&&(url.pathname==='/parent-portal'||url.pathname.startsWith('/parent-portal/'))){event.respondWith(fetch(event.request).catch(()=>caches.match(OFFLINE)));}
 else if(PUBLIC.includes(url.pathname)&&!url.search){event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));}
});
