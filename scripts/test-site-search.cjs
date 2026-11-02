const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,filename)=>mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {searchSite,cleanQuery}=require('../lib/siteSearch.ts');
const {siteDirectory}=require('../lib/siteDirectory.ts');
const {GET}=require('../app/api/site-search/route.ts');
const {hubArticles}=require('../lib/footballHub.ts');
test('search finds programmes, common questions and account destinations',()=>{
 assert.equal(searchSite('Flyers').results[0].href,'/programmes#flyers');
 assert.equal(searchSite('1:1').results[0].category,'Programmes');
 assert.ok(searchSite('parent login').results.some(r=>r.href==='/parent-portal'));
 assert.ok(searchSite('fees').results.some(r=>r.title==='Programme prices and payment options'));
 assert.ok(searchSite('what should she bring').results.some(r=>r.title.includes('bring')));
 assert.ok(searchSite('Monday').results.some(r=>r.href==='/programmes#sparks-5-7'));
 assert.ok(searchSite('how much does training cost').results.some(r=>r.title==='Programme prices and payment options'));
 assert.ok(searchSite('individual coaching age 12').results.some(r=>r.href==='/programmes#one-to-one'));
 assert.ok(searchSite('playing surface').results.some(r=>r.href==='/first-session'));
 assert.ok(searchSite('autistic').results.some(r=>r.href==='/inclusion'));
});
test('matches article body beyond the summary and tolerates a small typo',()=>{
 const a=hubArticles[0],phrase=a.sections[0].paragraphs[0].split(/\s+/).slice(0,9).join(' ');
 assert.ok(searchSite(phrase).results.some(r=>r.href==='/articles/'+a.slug));
 assert.ok(searchSite('confidnce').results.length>0);
 assert.ok(searchSite('goalkeeper coaching').results.some(r=>r.href==='/coaches'));
 const r=searchSite('scanning','Football guides');assert.ok(r.total>0);assert.ok(r.results.every(r=>r.category==='Football guides'));
});
test('bounds queries, handles punctuation safely and refuses unrelated matches',()=>{
 assert.equal(searchSite('qzxvbnunfindable').total,0);
 for(const q of ['',null,[],{},'a','!!!','the and for'])assert.equal(searchSite(q).total,0);
 assert.equal(cleanQuery('x'.repeat(1000)).length,120);
 assert.ok(!cleanQuery('hello\u0000world').includes('\u0000'));
 assert.equal(searchSite('coaching','',3).results.length,3);
 assert.equal(searchSite('coaching','nonsense').total,0);
});
test('public index contains no private paths or signed-in pricing data',()=>{
 const allowed=new Set(['/','/site-index','/search','/where-we-coach','/first-session','/programmes','/find-your-programme','/our-approach','/inclusion','/coaches','/pathways','/contact','/register','/privacy','/articles','/parent-portal','/player-portal','/staff',...hubArticles.map(a=>'/articles/'+a.slug)]);
 for(const e of siteDirectory){assert.ok(allowed.has(e.href.split('#')[0]),e.href);assert.ok(!/[£]|\bGBP\b|service_role|portal_player_id/.test(JSON.stringify(e)))}
 for(const e of siteDirectory.filter(e=>['/parent-portal','/player-portal','/staff'].includes(e.href))){assert.equal(e.body,undefined);assert.match(e.title,/login/)}
});
test('suggestions API returns a bounded public projection and no-cache/noindex headers',async()=>{
 const r=GET(new Request('https://star.example/api/site-search?q=coaching'));
 assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('X-Robots-Tag'),'noindex');
 const d=await r.json();assert.ok(d.results.length<=6);assert.ok(d.total>=d.results.length);
 for(const item of d.results)assert.deepEqual(Object.keys(item).sort(),['category','excerpt','href','title']);
});
