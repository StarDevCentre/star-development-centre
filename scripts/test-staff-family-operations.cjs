const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {assessmentJourney,assessmentPipelineCounts,assessmentQueueRank}=require('../lib/staffFamilyJourney.ts');
const {intakeAction,actionIntakeSelect}=require('../lib/staffActions.ts');
const {staffSections}=require('../lib/staffApp.ts');
const source=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const now=Date.parse('2026-11-06T13:00:00Z');
const base={assessment_status:'requested',assessment_requested_at:'2026-11-06T03:00:00Z',assessment_contacted_at:null,assessment_starts_at:null,completed_at:'2026-11-05T09:00:00Z',guardian_reviewed_at:'2026-11-05T09:30:00Z'};
test('intake assessment stages distinguish family-led and STAR follow-up',()=>{
 assert.equal(assessmentJourney({...base,assessment_status:'not_requested'},now).stage,'waiting_family');
 assert.equal(assessmentJourney({...base,completed_at:null},now).stage,'waiting_family');
 assert.equal(assessmentJourney({...base,guardian_reviewed_at:null},now).stage,'waiting_family');
 assert.equal(assessmentJourney(base,now).stage,'contact_family');
 assert.equal(assessmentJourney({...base,assessment_contacted_at:'2026-11-06T10:00:00Z'},now).stage,'arrange');
 assert.equal(assessmentJourney({...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-08T16:00:00Z'},now).stage,'booked');
 assert.equal(assessmentJourney({...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-06T12:00:00Z'},now).stage,'record_outcome');
 assert.equal(assessmentJourney({...base,assessment_status:'completed'},now).stage,'next_steps');
 assert.equal(assessmentJourney({...base,assessment_status:'cancelled'},now).stage,'closed');
});
test('12-hour assessment contact target is deterministic and never marks parent-led work overdue',()=>{
 const early=assessmentJourney(base,now);
 assert.equal(early.urgency,'normal');
 assert.equal(early.dueAt,'2026-11-06T15:00:00.000Z');
 const overdue=assessmentJourney({...base,assessment_requested_at:'2026-11-06T01:00:00Z'},now);
 assert.equal(overdue.urgency,'due');
 assert.equal(assessmentJourney({...base,completed_at:null,assessment_requested_at:'2026-11-05T01:00:00Z'},now).urgency,'waiting');
 assert.equal(assessmentJourney({...base,assessment_contacted_at:'2026-11-06T12:00:00Z',assessment_requested_at:'2026-11-05T01:00:00Z'},now).urgency,'normal');
});
test('confirmed assessment only requires outcome check after the 30-minute appointment ends',()=>{
 const appt={...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-06T12:30:00Z'};
 assert.equal(assessmentJourney(appt,now).stage,'record_outcome');
 const notEnded={...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-06T12:45:00Z'};
 assert.equal(assessmentJourney(notEnded,now).stage,'booked');
});
test('pipeline count categories and queue order follow actual state and do not duplicate family records',()=>{
 const rows=[
 {...base,assessment_requested_at:'2026-11-06T00:00:00Z'},
 {...base,assessment_requested_at:'2026-11-06T12:00:00Z'},
 {...base,assessment_contacted_at:'2026-11-06T12:10:00Z'},
 {...base,completed_at:null},
 {...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-08T16:00:00Z'},
 {...base,assessment_status:'confirmed',assessment_starts_at:'2026-11-06T12:00:00Z'},
 {...base,assessment_status:'completed'},
 {...base,assessment_status:'cancelled'},
 ];
 const counts=assessmentPipelineCounts(rows,now);
 assert.deepEqual(counts,{total:8,awaitingParent:1,needsContact:2,contactOverdue:1,arranging:1,booked:1,needsOutcome:1,completed:1,closed:1});
 assert.ok(assessmentQueueRank(rows[0],now)<assessmentQueueRank(rows[1],now));
 assert.ok(assessmentQueueRank(rows[5],now)<assessmentQueueRank(rows[3],now));
});
test('staff action centre includes overdue family contact and elapsed assessment outcomes',()=>{
 const actionSource=source('lib/staffActions.ts');
 const list=source('components/StaffActionList.tsx');
 assert.match(actionSource,/assessment_starts_at/);
 assert.match(actionSource,/outcomeCutoff/);
 assert.match(actionSource,/\.lte\('assessment_starts_at',outcomeCutoff\)/);
 assert.match(actionSource,/assessmentJourney\(p\)\.stage==='record_outcome'/);
 assert.match(list,/overdue\|Review assessment outcome/);
 assert.doesNotMatch(actionIntakeSelect,/details|photo|date_of_birth|contact_email|contact_phone/);
});
test('family operations unifies pipeline, secure inbox and admissions without duplicate message writes',()=>{
 const hub=source('components/StaffFamilyOperations.tsx');
 assert.ok(hub.includes('StaffOnboarding'));
 assert.ok(hub.includes('StaffInbox'));
 assert.ok(hub.includes('AdmissionsManagement'));
 assert.match(hub,/onOpenInbox=\{openInbox\}/);
 assert.match(hub,/active=\{active&&pane==="messages"\}/);
 assert.match(hub,/onOpenCalendar=\{onOpenCalendar\}/);
 assert.doesNotMatch(hub,/from\(["']family_messages["']\)/);
});
test('onboarding actions remain manual and cannot automatically send messages or enrol a player',()=>{
 const onboarding=source('components/StaffOnboarding.tsx');
 assert.match(onboarding,/rpc\('set_assessment_contact'/);
 assert.match(onboarding,/Contact marker removed/);
 assert.match(onboarding,/This button does not send a message/);
 assert.match(onboarding,/p_version:current.version/);
 assert.match(onboarding,/const p=\{\.\.\.current,\.\.\.intakeResult\(r\.data\)\} as Request/);
 assert.match(onboarding,/portal_player_id&&<button/);
 assert.match(onboarding,/Marking the assessment completed records the assessment outcome only/);
 assert.doesNotMatch(onboarding,/\.insert\(\{guardian_id/);
});
test('stale assessment-list loads are rejected and errors are not disguised as empty queues',()=>{
 const onboarding=source('components/StaffOnboarding.tsx');
 assert.match(onboarding,/const req=\+\+loadRequest\.current/);
 assert.match(onboarding,/if\(req!==loadRequest\.current\)return/);
 assert.match(onboarding,/return\(\)=>\{loadRequest\.current\+\+;\}/);
 assert.match(onboarding,/Could not load assessment requests/);
});
test('coach roles cannot access manager-only family operations or conversations',()=>{
 assert.equal(staffSections('coach').some(s=>s.id==='onboarding'||s.id==='communications'||s.id==='admissions'),false);
 assert.equal(staffSections('manager').some(s=>s.id==='onboarding'),true);
 const workspace=source('components/StaffWorkspace.tsx');
 assert.match(workspace,/case "onboarding":return canManage\?<StaffFamilyOperations/);
 assert.match(workspace,/active=\{section==="onboarding"&&!menuOpen\}/);
 assert.match(workspace,/onOpenCalendar=\{\(\)=>navigate\("sessions"\)\}/);
 const inbox=source('components/FamilyCommunications.tsx');
 assert.match(inbox,/guardian_player_links/);
 assert.match(inbox,/if\(role==="guardian"\)linkQuery\.eq\("guardian_id",userId\)/);
});
test('failed secure messages preserve the draft and release the sending lock',()=>{
 const sourceCode=source('components/FamilyCommunications.tsx');
 assert.match(sourceCode,/if\(saveError\)throw saveError/);
 assert.match(sourceCode,/finally\{setBusy\(false\);\}/);
 assert.match(sourceCode,/Your message draft is preserved/);
 assert.match(sourceCode,/Unable to refresh family conversations/);
 assert.match(sourceCode,/guardian_player_links/);
});
test('the PWA family operations layout stays mobile-first without changing the desktop shell',()=>{
 const css=source('components/staff-family-operations.css');
 assert.ok(css.includes('.staff-app--installed-touch .intake-staff-layout'));
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(!css.includes('.staff-app-header{'));
 assert.ok(!css.includes('body{'));
});
