const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ts=require('typescript');
const root=path.join(__dirname,'..');
function compile(file,scope){const exports={};const source=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{exports,...scope});return exports}
const helpers=compile('lib/parentDashboard.ts',{Date,Intl,Number});
assert.equal(helpers.parentSectionFromHash('#messages'),'messages');
assert.equal(helpers.parentSectionFromHash('#child-private-id'),null);
const states=[],effects=[],pending=[],listeners={},frames=new Map(),pushes=[];let stateCursor=0,effectCursor=0,refCursor=0,frameId=0,focusCount=0;
const refs=[];
const hooks={useState(initial){const i=stateCursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useRef(initial){const i=refCursor++;return refs[i]??(refs[i]={current:initial})},useEffect(fn,deps){const i=effectCursor++;const old=effects[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))pending.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()}})}};
const win={scrollY:0,location:{hash:''},history:{state:{nextRouterState:'retained'},pushState(state,_,hash){assert.equal(state.nextRouterState,'retained');win.location.hash=hash;pushes.push(hash)}},matchMedia:()=>({matches:true}),addEventListener(name,fn){listeners[name]=fn},removeEventListener(name){delete listeners[name]},requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId},cancelAnimationFrame(id){frames.delete(id)},scrollTo({top}){win.scrollY=top}};
const navModule=compile('components/useParentNavigation.ts',{require:name=>name==='react'?hooks:helpers,window:win,document:{getElementById(){return{focus(){focusCount++},scrollIntoView(){}}}}});
let nav;
function render(){stateCursor=effectCursor=refCursor=0;nav=navModule.useParentNavigation()}
function flush(){for(let i=0;i<3;i++){render();while(pending.length)pending.shift()();for(const[id,fn]of frames){frames.delete(id);fn()}}render()}
flush();assert.equal(nav.section,'overview');
win.scrollY=260;nav.goTo('messages');flush();assert.equal(nav.section,'messages');assert.equal(win.scrollY,0);
win.scrollY=730;nav.goTo('development');flush();assert.equal(win.scrollY,0);
win.scrollY=540;nav.goTo('messages');flush();assert.equal(win.scrollY,730);assert(nav.visited.includes('development'));
win.location.hash='#development';listeners.popstate();listeners.hashchange();flush();assert.equal(nav.section,'development');assert.equal(win.scrollY,540,'Paired back/hash events must retain destination scroll');
win.location.hash='#programme-prices';listeners.hashchange();flush();assert.equal(nav.section,'development','In-page links must not switch screens');
assert(pushes.every(hash=>/^#(messages|development)$/.test(hash)));assert(focusCount>=4);
effects.forEach(e=>e.cleanup?.());assert.equal(Object.keys(listeners).length,0);

(async()=>{
 const handlers={},cached=[],deleted=[],responded=[];let fail=false;
 const sw={location:{origin:'https://star.example'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const cacheApi={open:async()=>({addAll:async urls=>cached.push(...urls)}),keys:async()=>['star-parent-shell-old','star-player-shell-v1'],delete:async key=>deleted.push(key),match:async url=>'cached:'+url};
 vm.runInNewContext(fs.readFileSync(path.join(root,'public/parent-portal-sw.js'),'utf8'),{self:sw,caches:cacheApi,URL,fetch:async request=>{if(fail)throw Error('offline');return 'live:'+request.url}});
 let work;handlers.install({waitUntil:p=>work=p});await work;
 assert(cached.every(url=>url==='/parent-app/offline.html'||url.startsWith('/parent-app/icons/')));
 assert(!cached.includes('/parent-portal'));
 handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['star-parent-shell-old']);
 function request(url,mode='navigate',method='GET'){let response;handlers.fetch({request:{url,mode,method},respondWith:p=>response=p});return response}
 assert.equal(request('https://supabase.example/rest/v1/family_messages','cors'),undefined);
 assert.equal(request('https://star.example/api/programme-prices','cors'),undefined);
 assert.equal(request('https://star.example/parent-portal','navigate','POST'),undefined);
 assert.equal(request('https://star.example/parent-portal-other'),undefined);
 assert.equal(await request('https://star.example/parent-portal#messages'),'live:https://star.example/parent-portal#messages');
 fail=true;assert.equal(await request('https://star.example/parent-portal'),'cached:/parent-app/offline.html');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/parent-app/manifest.webmanifest'),'utf8'));
 assert.equal(manifest.start_url,'/parent-portal');assert.equal(manifest.scope,'/parent-portal');assert.equal(manifest.display,'standalone');
 assert(manifest.icons.every(icon=>icon.src.startsWith('/parent-app/icons/')));
 console.log('Passed: mobile section/back navigation, independent scroll restoration, in-page anchors, focus and listener cleanup; parent PWA network-only private data and generic offline fallback.');
})().catch(error=>{console.error(error);process.exitCode=1});
