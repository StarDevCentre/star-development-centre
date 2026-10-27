const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const exportsForTest={};
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/parentDashboard.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports:exportsForTest,Date,Intl,Number});
const {parentViewForPlayer,parentDate}=exportsForTest;
const now=Date.parse('2026-10-27T12:00:00Z');
const session=(id,player_id,start,end)=>({id,player_id,title:id,starts_at:start,ends_at:end,venue:'Fixture venue'});
const records=[
 session('later','a','2026-10-29T15:00:00Z','2026-10-29T16:00:00Z'),
 session('sibling','b','2026-10-27T12:30:00Z','2026-10-27T13:30:00Z'),
 session('ended','a','2026-10-27T11:00:00Z','2026-10-27T12:00:00Z'),
 session('ongoing','a','2026-10-27T11:30:00Z','2026-10-27T12:30:00Z'),
 session('invalid','a','not-a-date','2026-10-29T16:00:00Z'),
];
const goals=[{id:'g-a',player_id:'a',goal:'A goal',status:'working_on'},{id:'g-b',player_id:'b',goal:'B goal',status:'working_on'},{id:'g-done',player_id:'a',goal:'Done',status:'achieved'}];
const reports=[{id:'r-b',player_id:'b',review_month:'2026-11-01'},{id:'r-old',player_id:'a',review_month:'2026-09-01'},{id:'r-new',player_id:'a',review_month:'2026-10-01'}];
const a=parentViewForPlayer('a',goals,reports,records,now);
assert.equal(a.nextSession.id,'ongoing');assert.equal(a.sessions.length,2);assert.equal(a.activeGoals.length,1);assert.equal(a.latestReport.id,'r-new');
assert(a.sessions.every(s=>s.player_id==='a'));assert(a.goals.every(g=>g.player_id==='a'));assert(a.reports.every(r=>r.player_id==='a'));
const after=parentViewForPlayer('a',goals,reports,records,Date.parse('2026-10-27T12:30:00Z'));assert.equal(after.nextSession.id,'later');
const b=parentViewForPlayer('b',goals,reports,records,now);assert.equal(b.nextSession.id,'sibling');assert.equal(b.latestReport.id,'r-b');
const empty=parentViewForPlayer('missing',goals,reports,records,now);assert.equal(empty.nextSession,null);assert.equal(empty.latestReport,null);assert.equal(empty.goals.length,0);
assert.equal(records[0].id,'later','Display derivation must not reorder shared source arrays');
assert.equal(parentDate('2026-06-05T17:00:00Z',{hour:'2-digit',minute:'2-digit'}),'18:00');
assert.equal(parentDate('2026-12-05T17:00:00Z',{hour:'2-digit',minute:'2-digit'}),'17:00');
console.log('Passed: sibling isolation, ongoing/ended session boundaries, unsorted sessions/reports, empty states and UK summer/winter times.');
