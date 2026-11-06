// Read-only reliability regressions. No accounts, bookings or messages are created.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.join(__dirname,'..');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {ukInputToISO}=require('../lib/sessionOperations.ts');
const {createRequestSequence}=require('../lib/staffRequestSequence.ts');
const {intakeSections,intakeMissing}=require('../lib/playerOnboarding.ts');
const {staffSections,staffSectionFromHash}=require('../lib/staffApp.ts');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('assessment time conversion rejects both invalid UK clock-change times',()=>{
 assert.equal(ukInputToISO('2026-07-15T16:30'),'2026-07-15T15:30:00.000Z');
 assert.equal(ukInputToISO('2026-11-06T16:00'),'2026-11-06T16:00:00.000Z');
 assert.throws(()=>ukInputToISO('2026-03-29T01:30'),/does not exist/);
 assert.throws(()=>ukInputToISO('2026-10-25T01:30'),/occurs twice/);
 assert.match(read('components/StaffOnboarding.tsx'),/p_starts:status==='confirmed'\?ukInputToISO\(date\):null/);
 assert.doesNotMatch(read('components/StaffOnboarding.tsx'),/function ukInstant\(/);
});
test('parent intake checks required safeguarding data but not optional assessment availability',()=>{
 assert.equal(intakeSections.length,5);
 const details=Object.fromEntries(intakeSections.flatMap(s=>s.fields).filter(f=>f.required).map(f=>[f.key,'None known']));
 details.medical='None known';
 const base={first_name:'Synthetic',last_name:'Fixture',date_of_birth:'2013-05-05',details,photo_path:null};
 assert.deepEqual(intakeMissing(base),[]);
 for(const key of ['contact_phone','emergency_phone','support','medical','coaching_media','public_photos','public_video','public_name']){
  assert.ok(intakeMissing({...base,details:{...details,[key]:''}}).length,'Required field should fail: '+key);
 }
 assert.deepEqual(intakeMissing({...base,details:{...details,availability:''}}),[],'Availability is optional');
 assert.deepEqual(intakeMissing({...base,details:{...details,allergies:''}}),[],'Hidden follow-ups are optional');
 const withDetails={...details,medical:'Details below'};
 for(const key of ['medical_details','allergies','medication','injuries','emergency_plan']){
  assert.ok(intakeMissing({...base,details:{...withDetails,[key]:''}}).length,'Missing medical follow-up: '+key);
 }
});
test('attendance results from an older selection or a closed panel cannot replace newer state',()=>{
 const gate=createRequestSequence();
 const first=gate.next();
 const second=gate.next();
 assert.equal(gate.isCurrent(first),false);
 assert.equal(gate.isCurrent(second),true);
 gate.invalidate();
 assert.equal(gate.isCurrent(second),false);
 const source=read('components/SessionAttendance.tsx');
 assert.match(source,/loadSequence\.current\.isCurrent\(request\)/);
 assert.match(source,/loadSequence\.current\.invalidate\(\)/);
 assert.match(source,/selectedSessionRef\.current!==selectedAtStart/);
 assert.match(source,/setLoading\(false\)/);
});
test('attendance writes retain an explicit failure path and require a confirmed changed record',()=>{
 const source=read('components/SessionAttendance.tsx');
 assert.match(source,/\.upsert\(\{session_id:selectedAtStart,player_id:playerId,status,recorded_by:userId/);
 assert.match(source,/onConflict:"session_id,player_id"/);
 assert.match(source,/if\(error\|\|!saved\?\.length\)/);
 assert.match(source,/Attendance not saved/);
 assert.match(source,/Roster was not changed/);
});
test('staff navigation continues to restrict manager and owner tools',()=>{
 const coach=staffSections('coach').map(x=>x.id);
 const manager=staffSections('manager').map(x=>x.id);
 const owner=staffSections('owner').map(x=>x.id);
 for(const protectedPage of ['onboarding','organisations','communications','analytics','admissions']){
  assert.equal(coach.includes(protectedPage),false,protectedPage);
  assert.equal(manager.includes(protectedPage),true,protectedPage);
 }
 assert.equal(manager.includes('administration'),false);
 assert.equal(owner.includes('administration'),true);
 assert.equal(staffSectionFromHash('#administration','coach'),null);
});
test('calendar contact lookup does not double-list a player from intake and roster',()=>{
 const pathToMigration='supabase/migrations/20261106095500_dedupe_assessment_calendar_people.sql';
 const migration=read(pathToMigration);
 assert.match(migration,/not exists\s*\(\s*select 1\s+from star_private\.assessment_calendar_links/);
 assert.match(migration,/i\.portal_player_id=sp\.player_id/);
});
test('private data is not copied into the public session title',()=>{
 const migration=read('supabase/migrations/20261105211800_sync_staff_assessments_to_training_calendar.sql');
 assert.match(migration,/values\s*\('FREE assessment','Other'/);
 assert.doesNotMatch(migration,/values\s*\(.*first_name.*last_name/s);
});
