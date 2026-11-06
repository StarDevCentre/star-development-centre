const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {sessionFlowCounts}=require('../lib/staffSessionFlow.ts');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('session flow is roster-scoped and does not count other programmes or sessions',()=>{
 const counts=sessionFlowCounts(['a','b'],[{player_id:'a',status:'present'},{player_id:'other',status:'late'}]);
 assert.deepEqual(counts,{total:2,present:1,absent:0,late:0,excused:0,marked:1,unmarked:1,ready:false});
});
test('same player is counted once; unknown statuses never complete a register',()=>{
 const counts=sessionFlowCounts(['a','b','b'],[{player_id:'a',status:'present'},{player_id:'a',status:'late'},{player_id:'b',status:'pending'}]);
 assert.equal(counts.total,2);assert.equal(counts.late,1);assert.equal(counts.present,0);assert.equal(counts.unmarked,1);assert.equal(counts.ready,false);
});
test('empty rosters cannot be falsely marked ready to finish',()=>{
 assert.deepEqual(sessionFlowCounts([],[]),{total:0,present:0,absent:0,late:0,excused:0,marked:0,unmarked:0,ready:false});
 const ready=sessionFlowCounts(['p1','p2','p3','p4'],['present','late','absent','excused'].map((status,i)=>({player_id:'p'+(i+1),status})));
 assert.equal(ready.ready,true);assert.equal(ready.marked,4);assert.equal(ready.unmarked,0);
});
test('inline coaching notes use the existing validated observation write with a session ID',()=>{
 const source=read('components/StaffSessionFlow.tsx');
 for(const key of ['coaching_observations','session_id:session.id','recorded_by:userId','observation:observation.trim()','next_action:nextAction.trim()||null'])
  assert.ok(source.includes(key),'Missing coaching observation integration: '+key);
 assert.ok(source.includes('disabled={saving||loading||!playerId||observation.trim().length<5}'),'Draft validation is required');
 assert.match(source,/Observation not saved/);
 assert.match(source,/role="status"/);
});
test('preparation and wrap-up are read-only and link to established operations',()=>{
 const source=read('components/StaffSessionFlow.tsx');
 assert.ok(source.includes('coaching_development_goals'));
 assert.ok(source.includes('staff_session_plan_links'));
 assert.ok(source.includes('staff_session_plans'));
 assert.ok(source.includes('onReturnToCalendar'));
 assert.ok(source.includes('onGoToAttendance'));
 assert.ok(source.includes('onGoToCoaching'));
 assert.ok(source.includes('sessionFlowCounts')===false,'Counts should come from shared workspace state');
 assert.ok(!source.includes('delivered_at'),'Session completion must not invent a persisted delivered field');
});
test('four-stage navigation remains within the existing staff workspace',()=>{
 const source=read('components/SessionAttendance.tsx');
 assert.match(source,/\{id:"overview",label:"Prepare"\}.*\{id:"wrapup",label:"Review"\}/);
 assert.match(source,/SessionPreparation/);
 assert.match(source,/SessionCoachingNotes/);
 assert.match(source,/SessionWrapUp/);
 assert.match(source,/aria-current=\{workspaceTab===step\.id\?"step":undefined\}/);
});

test('calendar sessions can open the coaching workspace without editing bookings',()=>{
 const calendar=read('components/StaffCalendar.tsx');
 const planner=read('components/TrainingPlanner.tsx');
 const workspace=read('components/StaffWorkspace.tsx');
 assert.match(calendar,/onOpenWorkspace\?\:\(sessionId:string\)=>void/);
 assert.match(calendar,/Open coaching workspace →/);
 assert.match(planner,/<StaffCalendar revision=\{calendarRevision\} onOpenWorkspace=\{onOpenWorkspace\}/);
 assert.match(workspace,/onOpenWorkspace=\{id=>navigate\("workspace",undefined,id\)\}/);
});
