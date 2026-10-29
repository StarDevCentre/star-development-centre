const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
require.extensions['.tsx']=require.extensions['.ts'];
require.extensions['.css']=()=>{};
const {footballActivities,activityMarker,activityProgress,nextUnexploredScenario,saveActivityProgress}=require('../lib/playerActivities.ts');
const {learningArticles,quizQuestions}=require('../lib/playerLearning.ts');
const {ActivityPitch,PlayerActivities}=require('../components/PlayerActivities.tsx');
const {PlayerLearning}=require('../components/PlayerLearning.tsx');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const scenarios=footballActivities.flatMap(a=>a.scenarios);
const row=(id,player_id='p')=>({player_id,lesson_id:id,completed_at:'2026-10-29T12:00:00Z'});
const same=(a,b)=>a.x===b.x&&a.y===b.y;
function distanceFromSegment(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
}

test('four complete activities contain 24 distinct scenarios with feedback for all 72 choices',()=>{
 assert.deepEqual(footballActivities.map(a=>a.id),['pass','space','next','touch']);
 assert.equal(scenarios.length,24);assert.equal(new Set(scenarios.map(s=>s.id)).size,24);
 for(const a of footballActivities){
  assert.equal(a.scenarios.length,6);
  for(const s of a.scenarios){
   assert.deepEqual(s.choices.map(c=>c.id),['A','B','C']);
   assert.ok(s.choices.some(c=>c.outcome==='opens-play'),s.id);
   for(const text of [s.title,s.prompt,s.picture,s.hint,s.seniorHint,...s.choices.flatMap(c=>[c.label,c.feedback,c.detail])])assert.ok(text.trim().length>8,s.id);
   for(const kind of ['activity','favourite'])assert.ok(activityMarker(kind,s.id).length<=100);
  }
 }
 assert.ok(scenarios.some(s=>s.choices.filter(c=>c.outcome==='opens-play').length>1),'More than one action can be useful');
});

test('pitch targets stay within the diagram and separate touch targets on a 260px pitch',()=>{
 for(const a of footballActivities)for(const s of a.scenarios){
  for(const p of [s.you,s.ball,...s.teammates,...s.opponents,...s.choices.map(c=>c.at)]){
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=100&&p.y>=0&&p.y<=72,s.id);
  }
  for(let i=0;i<s.choices.length;i++)for(let j=i+1;j<s.choices.length;j++){
   const x=s.choices[i].at,y=s.choices[j].at;
   assert.ok(Math.hypot(x.x-y.x,x.y-y.y)*2.6>=44,`${s.id}: choice targets overlap`);
  }
  for(const c of s.choices){
   if(c.kind==='pass')assert.ok(s.teammates.some(t=>same(t,c.at)),`${s.id}: pass needs a teammate`);
   if(c.kind==='hold')assert.ok(same(s.you,c.at),`${s.id}: protection stays with the player`);
  }
 }
});

test('useful passes and support spaces have a clear lane in these snapshots',()=>{
 for(const a of footballActivities)for(const s of a.scenarios)for(const c of s.choices){
  if(c.outcome==='look-again')continue;
  if(c.kind==='pass'||a.id==='space'){
   for(const opponent of s.opponents)assert.ok(distanceFromSegment(opponent,s.ball,c.at)>5,`${s.id} ${c.id}: useful option blocked by opponent`);
  }
 }
});

test('exploration and favourites stay separate, deduplicate and belong to the chosen player',()=>{
 const id=scenarios[0].id,other=scenarios[1].id;
 const state=activityProgress([row('activity:'+id),row('activity:'+id),row('favourite:'+other),row('activity:'+other,'other'),row('favourite:'+id,'other'),row('activity:missing'),row('quiz:'+id),row('unknown:'+id)],'p');
 assert.deepEqual([...state.explored],[id]);assert.deepEqual([...state.favourites],[other]);
 assert.equal(nextUnexploredScenario(footballActivities[0],state.explored),1);
 assert.equal(nextUnexploredScenario(footballActivities[0],new Set(footballActivities[0].scenarios.map(s=>s.id))),0);
 assert.equal(activityProgress([], 'p').explored.size,0);
});

test('save completion waits for the protected action and preserves failure for retry',async()=>{
 const id=scenarios[0].id,calls=[];let finish,returned=false;
 const pending=saveActivityProgress('p',id,'activity',true,(...args)=>{calls.push(args);return new Promise(resolve=>{finish=resolve;});}).then(v=>{returned=true;return v;});
 await Promise.resolve();assert.equal(returned,false);assert.deepEqual(calls,[['p','activity:'+id,true]]);
 finish();assert.equal(await pending,'activity:'+id);assert.equal(returned,true);
 await assert.rejects(()=>saveActivityProgress('p',id,'favourite',true,async()=>{throw Error('Offline');}),/Offline/);
 const retry=[];await saveActivityProgress('p',id,'favourite',false,async(...args)=>{retry.push(args);});
 assert.deepEqual(retry,[['p','favourite:'+id,false]]);
 let called=false;await assert.rejects(()=>saveActivityProgress('p','missing','activity',true,async()=>{called=true;}),/available/);assert.equal(called,false);
});

test('all move diagrams expose labelled keyboard buttons and finite animated paths',()=>{
 for(const a of footballActivities)for(const s of a.scenarios)for(const c of s.choices){
  const html=renderToStaticMarkup(React.createElement(ActivityPitch,{activity:a,scenario:s,selected:c,revealed:true,disabled:false,onChoose:()=>{}}));
  assert.equal((html.match(/<button/g)||[]).length,3);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.match(html,/role="img"/);assert.match(html,/<desc id=/);assert.match(html,/ATTACK THIS WAY/);
  assert.match(html,/aria-label="A\./);assert.doesNotMatch(html,/NaN|undefined|Infinity/);
  if(c.kind!=='hold')assert.match(html,/<animateMotion/);
 }
 const a=footballActivities[0],s=a.scenarios[0];
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...[0,1].map(k=>React.createElement(ActivityPitch,{key:k,activity:a,scenario:s,revealed:false,disabled:true,onChoose:()=>{}}))));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert.equal((html.match(/ disabled=""/g)||[]).length,6);
 const css=fs.readFileSync(require('node:path').join(__dirname,'../components/player-activities.css'),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/\.ps-activity-moving-ball\{display:none\}/);
});

test('library shows only this player’s favourites and learning counts exclude activity markers',()=>{
 const own=scenarios[0],other=scenarios[1];
 const progress=[row('activity:'+own.id),row('favourite:'+own.id),row('favourite:'+other.id,'other'),row(learningArticles[0].id),row('quiz:'+quizQuestions[0].id),row('removed-guide')];
 const props={playerId:'p',senior:false,progress,onLearningProgress:async()=>{}};
 const html=renderToStaticMarkup(React.createElement(PlayerActivities,props));
 assert.match(html,/1 of 24 scenarios explored/);assert.equal((html.match(/<progress/g)||[]).length,4);
 assert.match(html,new RegExp(own.title));assert.doesNotMatch(html,new RegExp(other.title));
 const learning=renderToStaticMarkup(React.createElement(PlayerLearning,props));
 assert.match(learning,/1 activity scenarios explored · 1 guides explored · 1 quiz questions completed/);
 assert.match(learning,/Play &amp; explore/);assert.match(learning,/First-Touch Choices/);
});
