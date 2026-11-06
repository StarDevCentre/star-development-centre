const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {playerAttendanceSummary,nextLinkedSession}=require("../lib/staffPlayer360.ts");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const s=(id,starts_at,ends_at)=>({id,starts_at,ends_at});
test("Player 360 attendance uses the actual linked session roster, not programme membership",()=>{
 const actual=[s("one","2026-10-01T16:00:00Z","2026-10-01T17:00:00Z"),s("two","2026-10-08T16:00:00Z","2026-10-08T17:00:00Z")];
 const summary=playerAttendanceSummary([{session_id:"one",status:"present"},{session_id:"other",status:"absent"},{session_id:"two",status:"absent"}],actual);
 assert.deepEqual(summary,{marked:2,attended:1,absent:1,excused:0,rate:50});
});
test("Excused sessions do not lower attendance rate; unmarked sessions are excluded",()=>{
 const linked=[s("a","2026-10-01T16:00Z","2026-10-01T17:00Z"),s("b","2026-10-02T16:00Z","2026-10-02T17:00Z"),s("c","2026-10-03T16:00Z","2026-10-03T17:00Z")];
 assert.deepEqual(playerAttendanceSummary([{session_id:"a",status:"late"},{session_id:"b",status:"excused"}],linked),{marked:2,attended:1,absent:0,excused:1,rate:100});
});
test("Duplicate or invalid marks cannot inflate a player's attendance",()=>{
 const linked=[s("one","2026-10-01T16:00Z","2026-10-01T17:00Z")];
 const result=playerAttendanceSummary([{session_id:"one",status:"present"},{session_id:"one",status:"late"},{session_id:"other",status:"present"},{session_id:"one",status:"draft"}],linked);
 assert.equal(result.marked,1);
 assert.equal(result.attended,1);
 assert.equal(result.rate,100);
 assert.equal(playerAttendanceSummary([],linked).rate,null);
});
test("The next session is chosen from actually linked sessions, including in progress",()=>{
 const future=s("future","2026-11-09T16:00:00Z","2026-11-09T17:00:00Z");
 const ongoing=s("ongoing","2026-11-06T12:30:00Z","2026-11-06T13:30:00Z");
 const past=s("past","2026-11-04T13:00:00Z","2026-11-04T14:00:00Z");
 assert.equal(nextLinkedSession([future,past,ongoing],Date.parse("2026-11-06T13:00:00Z")).id,"ongoing");
 assert.equal(nextLinkedSession([future,past],Date.parse("2026-11-06T13:00:00Z")).id,"future");
 assert.equal(nextLinkedSession([past],Date.parse("2026-11-06T13:00:00Z")),null);
});
test("Player 360 fetches only player-scoped coaching records with existing RLS",()=>{
 const source=read("components/StaffPlayer360.tsx");
 for(const table of ["coaching_idp_assessments","coaching_observations","coaching_monthly_reviews","training_session_participants","training_attendance","player_achievements","family_monthly_reports","training_sessions"])
  assert.ok(source.includes('from("'+table+'")'),"Missing data source "+table);
 for(const table of ["coaching_idp_assessments","coaching_observations","coaching_monthly_reviews","training_session_participants","training_attendance","player_achievements","family_monthly_reports"]){
  const regex=new RegExp('from\\("'+table+'"\\)[\\s\\S]{0,160}\\.eq\\("player_id",id\\)');
  assert.match(source,regex,"Unscoped player table "+table);
 }
 assert.match(source,/\.in\("id",ids\)\.is\("cancelled_at",null\)/);
 assert.ok(!source.includes('service_role')&&!source.includes('player_intakes')&&!source.includes('guardian_player_links'));
});
test("Switching player identity does not reuse an older player's loaded records",()=>{
 const source=read("components/StaffPlayer360.tsx");
 const parent=read("components/StaffPlayers.tsx");
 assert.match(source,/let alive=true;setLoading\(true\);setSnapshot\(empty\(\)\)/);
 assert.match(source,/if\(!alive\)return/);
 assert.match(source,/return\(\)=>\{alive=false\}/);
 assert.match(parent,/<StaffPlayer360 key=\{player\.id\}/);
});
test("Manager-only family tabs never render for coaches; publishing remains gated",()=>{
 const source=read("components/StaffPlayer360.tsx");
 const roster=read("components/StaffPlayers.tsx");
 const workspace=read("components/StaffWorkspace.tsx");
 assert.match(source,/\.\.\.\(canManage\?\[\{id:"family" as Tab/);
 assert.match(source,/canManage&&tab==="family"/);
 assert.match(roster,/onFamilyInbox=\{canManage\?onFamilyInbox:undefined\}/);
 assert.match(roster,/onShareWithFamily=\{canManage\?onShareWithFamily:undefined\}/);
 assert.match(workspace,/onFamilyInbox=\{canManage\?id=>navigate\("communications",id\):undefined\}/);
 assert.match(workspace,/onShareWithFamily=\{canManage\?id=>navigate\("familyPublishing",id\):undefined\}/);
});
test("Old goal editing, coach assignment and player navigation remain functional entry points",()=>{
 const source=read("components/StaffPlayers.tsx");
 for(const phrase of ["New development goal","Goal not saved.","Mark achieved","Reopen goal","Assigned coaches","Assign a coach","onNote={onNote}","onDevelopment={onDevelopment}","developmentControls={<>"])
  assert.ok(source.includes(phrase),"Legacy workflow lost: "+phrase);
 const workspace=read("components/StaffWorkspace.tsx");
 assert.match(workspace,/onOpenSession=\{id=>navigate\("workspace",undefined,id\)\}/);
});
test("PWA and phone styling is scoped; no desktop/header background replacement",()=>{
 const css=read("components/staff-player-360.css");
 assert.ok(css.includes(".staff-app--installed-touch .staff360"));
 assert.ok(css.includes("@media(max-width:760px)"));
 assert.ok(!css.includes("body{"));
 assert.ok(!css.includes(".staff-app-header{"));
});
