const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
require.extensions['.tsx']=require.extensions['.ts'];
const {emptySpaceData,cosmetics}=require('../lib/playerSpace.ts');
const {weeklyPlayerPlan,playerUnlockProgress,distinctPracticeDays,savePracticeMoment}=require('../lib/playerSpaceHighlights.ts');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {PlayerWeekHighlights}=require('../components/PlayerWeekHighlights.tsx');
const today='2026-10-29',week='2026-10-26';
const assignment=(id,patch={})=>({id,player_id:'p',title:id,instructions:'Practice',target:null,due_date:null,created_at:'2026-10-25T12:00:00Z',week_start:week,practice_day:0,suggested_minutes:10,equipment:null,is_optional:false,coaching_points:null,goal_id:null,...patch});
const entry=(id,date,minutes=10)=>({id:'entry-'+id+date,assignment_id:id,practice_date:date,minutes,reflection:'I tried again.',created_at:date+'T12:00:00Z',confidence:null,enjoyment:null});
const data=patch=>({...structuredClone(emptySpaceData),assignments:[assignment('a')],...patch});
test('weekly selection chooses unlogged coach practices before optional extras',()=>{
 const d=data({assignments:[assignment('old',{week_start:'2026-10-19'}),assignment('extra',{is_optional:true}),assignment('future',{practice_day:4}),assignment('a')],diary:[entry('a',today)]});
 let plan=weeklyPlayerPlan(d,'p',today);assert.equal(plan.planned,2);assert.equal(plan.logged,1);assert.equal(plan.challenge.id,'future');
 d.diary.push(entry('future',today));plan=weeklyPlayerPlan(d,'p',today);assert.equal(plan.challenge.id,'extra');assert.equal(plan.challenge.is_optional,true);
 d.diary.push(entry('extra',today));plan=weeklyPlayerPlan(d,'p',today);assert.equal(plan.challenge,undefined);assert.equal(plan.logged,2);
});
test('weekly counts deduplicate logs, ignore other players and reset ongoing practices each week',()=>{
 const d=data({assignments:[assignment('a',{week_start:null}),assignment('other',{player_id:'other'})],diary:[entry('a','2026-10-20'),entry('other',today)]});
 assert.equal(weeklyPlayerPlan(d,'p',today).challenge.id,'a');
 d.diary.push(entry('a',today),entry('a',today));assert.equal(weeklyPlayerPlan(d,'p',today).logged,1);
 assert.equal(weeklyPlayerPlan(data({assignments:[]}),'p',today).hasPlan,false);
});
test('practice rewards count distinct positive-minute days for this player',()=>{
 const d=data({assignments:[assignment('a'),assignment('other',{player_id:'other'})],diary:[entry('a','2026-10-26'),entry('a','2026-10-26'),entry('a','2026-10-27',0),entry('other','2026-10-28'),entry('a',today)]});
 assert.equal(distinctPracticeDays(d,'p').size,2);
 const next=playerUnlockProgress(d,'p');assert.equal(next.current,2);assert.equal(next.target,3);assert.match(next.title,/Lightning/);assert.equal(next.ready,false);
});
test('progress never grants rewards and earned extras stay earned after goals reopen',()=>{
 const d=data({diary:[entry('a','2026-10-26'),entry('a','2026-10-27'),entry('a',today)]});
 assert.equal(playerUnlockProgress(d,'p').ready,true);assert.equal(d.unlocks.length,0);
 d.unlocks=cosmetics.map(c=>({player_id:'p',cosmetic:c.key,unlocked_at:today}));
 d.personalGoals=[{id:'g',player_id:'p',goal:'Try it',status:'active',target_date:null}];assert.equal(playerUnlockProgress(d,'p'),null);
});
test('attendance progress respects ball thresholds and only counts personal goals and real badges',()=>{
 const d=data({ballProgress:[{player_id:'p',attended_sessions:9},{player_id:'other',attended_sessions:50}],goals:[{id:'cg',player_id:'p',goal:'Coach goal',status:'achieved'}],awards:[{id:'a',player_id:'p',badge_id:null}],unlocks:[{player_id:'p',cosmetic:'avatar-comet'},{player_id:'p',cosmetic:'decoration-lightning'}]});
 const next=playerUnlockProgress(d,'p');assert.equal(next.key,'ball-nike-10');assert.equal(next.current,9);assert.equal(next.target,10);
 d.ballProgress=[];assert.equal(playerUnlockProgress(d,'p').current,0);
});
test('completion waits for a confirmed save; failures and another player’s assignment cannot celebrate',async()=>{
 const d=data(),value={assignment_id:'a',practice_date:today,minutes:10,reflection:'It felt tricky.'};
 let finish;let complete=false;const pending=savePracticeMoment(d,'p',value,()=>new Promise(resolve=>{finish=resolve})).then(v=>{complete=true;return v});
 await Promise.resolve();assert.equal(complete,false);finish();const moment=await pending;assert.equal(moment.practiceDays,1);assert.equal(moment.newDay,true);
 await assert.rejects(()=>savePracticeMoment(d,'p',value,async()=>{throw Error('Offline')}),/Offline/);
 let called=false;await assert.rejects(()=>savePracticeMoment(d,'other',value,async()=>{called=true}),/not available/);assert.equal(called,false);
 d.diary=[entry('a',today)];assert.equal((await savePracticeMoment(d,'p',value,async()=>{})).newDay,false);
 assert.equal((await savePracticeMoment(data(),'p',{...value,minutes:0},async()=>{})).practiceDays,0);
});
test('Home highlights use only the selected player and distinguish new awards from existing feedback',()=>{
 const d=data({awards:[{id:'hidden',player_id:'other',badge_id:'x',title:'Private other award',description:'Private'}],notifications:[],diary:[entry('a',today)],feedback:[{diary_id:'entry-a'+today,feedback:'Your first touch improved.',reviewed_at:today}]});
 const html=renderToStaticMarkup(React.createElement(PlayerWeekHighlights,{data:d,playerId:'p',name:'Demo',today,onPractice:()=>{},onOpen:()=>{},onStyle:()=>{}}));
 assert.doesNotMatch(html,/Private other award/);assert.match(html,/LATEST COACH FEEDBACK/);assert.match(html,/Your first touch improved/);assert.match(html,/role="progressbar"/);assert.match(html,/Revisit|REVISIT/);
});
