/* Generic offline screen and public icons only. Parent pages, messages,
   authentication and all family records remain network-only. */
const CACHE='star-parent-shell-v2';
const OFFLINE='/parent-app/offline.html';
const PUBLIC=[OFFLINE,'/parent-app/icons/icon-192.png','/parent-app/icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('star-parent-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(event.request.mode==='navigate'&&(url.pathname==='/parent-portal'||url.pathname.startsWith('/parent-portal/'))){event.respondWith(fetch(event.request).catch(()=>caches.match(OFFLINE)));}
 else if(PUBLIC.includes(url.pathname)&&!url.search){event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));}
});

// Lock-screen content is always generic. Never cache or embed family records.
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 const bodies={message:'You have a new message from STAR.',report:'A shared progress report has an update.',session:'Check your latest session details.',programme:'Your programme application has an update.'};
 const body=Object.values(bodies).includes(data.body)?data.body:'There’s an update in your parent portal.';
 event.waitUntil(self.registration.showNotification('STAR Parent Portal',{body,icon:'/parent-app/icons/icon-192.png',badge:'/parent-app/icons/icon-192.png',tag:typeof data.tag==='string'?data.tag.slice(0,80):'star-parent-update'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=new URL('/parent-portal#updates',self.location.origin).href;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  for(const client of clients){const url=new URL(client.url);if(url.origin===self.location.origin&&url.pathname==='/parent-portal'){await client.navigate(target);return client.focus();}}
  return self.clients.openWindow(target);
 }));
});
