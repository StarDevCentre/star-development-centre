const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const plans=require('../lib/content/coaching-session-collection.json');
test('12 distinct complete sessions, four of each duration, eight positional and four small-team',()=>{
 assert.equal(plans.length,12);assert.equal(new Set(plans.map(p=>p.id)).size,12);
 for(const min of [45,60,80])assert.equal(plans.filter(p=>p.minutes===min).length,4);
 assert.equal(plans.filter(p=>p.position==='Small team').length,4);
 for(const p of plans){assert.equal(p.plan.target,p.minutes);assert.equal(p.plan.activities.reduce((n,a)=>n+a.minutes,0),p.minutes);assert.ok(p.playerCount>=1&&p.playerCount<=5);assert.ok(Buffer.byteLength(JSON.stringify(p.plan))<80000);}
});
test('diagrams contain exactly the stated players, plus one coach; unique roles and finite coordinates',()=>{
 for(const p of plans){let count=0;for(const a of p.plan.activities){if(!a.detail)continue;count++;const d=a.detail.diagram;assert.equal(d.people.filter(x=>x.role!=='coach').length,p.playerCount,p.id);assert.equal(d.people.filter(x=>x.role==='coach').length,1);assert.equal(new Set(d.people.map(x=>x.label)).size,d.people.length);assert.ok(d.width>0&&d.length>0);for(const x of d.people){assert.ok(Number.isFinite(x.x)&&Number.isFinite(x.y));assert.ok(x.x>=-15&&x.x<=115&&x.y>=0&&x.y<=105);}for(const ar of d.arrows)assert.ok(['pass','run','dribble'].includes(ar.kind));assert.ok(a.detail.organisation.length&&a.detail.sequence.length>=3&&a.detail.coaching.length>=2&&a.detail.adaptations.length>=2&&a.detail.timing&&a.detail.success)}assert.equal(count,3);}
});
test('every session identifies its published exercise and adaptations, with safe original diagram links',()=>{
 for(const p of plans){assert.equal(new URL(p.source.url).hostname,'www.fifatrainingcentre.com');assert.equal(new URL(p.source.original).hostname,'www.fifatrainingcentre.com');assert.ok(p.source.section&&p.source.adaptation);assert.ok(p.plan.activities.some(a=>a.source));}
});
test('connections use the staff table and calendar opens the selected saved plan; edited setups clear diagrams',()=>{
 const calendar=fs.readFileSync('components/TrainingPlanner.tsx','utf8'),builder=fs.readFileSync('components/StaffSessionBuilder.tsx','utf8'),workspace=fs.readFileSync('components/StaffWorkspace.tsx','utf8');
 assert.match(calendar,/staff_session_plan_links/);assert.match(calendar,/onOpenPlan\(links\.find/);assert.match(workspace,/setPlanRequest/);assert.match(builder,/detail:undefined,source:undefined/);assert.match(builder,/eq\("created_by",userId\)/);
});
