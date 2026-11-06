const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {attendanceSummary,ukDateTimeInput,ukInputToISO}=require('../lib/sessionOperations.ts');
const {styleExtraKeys,styleExtraCounts}=require('../lib/playerCollectionCounts.ts');
const {intakeSections,intakeMissing}=require('../lib/playerOnboarding.ts');
test('late is attended; excused/unmarked do not lower attendance',()=>{assert.deepEqual(attendanceSummary(['present','late','absent','excused'].map(status=>({status})),6),{present:1,late:1,absent:1,excused:1,unmarked:2,attended:2,eligible:3,percentage:67});assert.equal(attendanceSummary([{status:'excused'}]).percentage,null);assert.equal(attendanceSummary([{status:'late'}]).percentage,100);});
test('UK input is independent of machine timezone and rejects clock-change gaps/ambiguity',()=>{assert.equal(ukInputToISO('2026-07-15T16:30'),'2026-07-15T15:30:00.000Z');assert.equal(ukInputToISO('2026-12-15T16:30'),'2026-12-15T16:30:00.000Z');assert.equal(ukDateTimeInput('2026-07-15T15:30:00Z'),'2026-07-15T16:30');assert.throws(()=>ukInputToISO('2026-03-29T01:30'));assert.throws(()=>ukInputToISO('2026-10-25T01:30'));assert.throws(()=>ukInputToISO('2026-02-30T12:00'));});
test('collection totals use one unique catalogue and ignore boots/badges/unknown rewards',()=>{assert.equal(styleExtraCounts([]).unlocked,0);const all=styleExtraKeys.map(cosmetic=>({cosmetic}));assert.equal(styleExtraCounts([...all,...all,{cosmetic:'boot-any'},{cosmetic:'learning-badge-any'},{cosmetic:'unknown'}]).unlocked,styleExtraKeys.length);assert.equal(styleExtraCounts(all.slice(0,3)).unlocked,3);});
test('assessment essentials preserve health, contact and consent without requiring photo or kit',()=>{assert.equal(intakeSections.length,5);const details=Object.fromEntries(intakeSections.flatMap(s=>s.fields).filter(f=>f.required).map(f=>[f.key,'None known']));details.medical='None known';const p={first_name:'Synthetic',last_name:'Player',date_of_birth:'2014-05-10',details,photo_path:null};assert.deepEqual(intakeMissing(p),[]);for(const key of ['medical','emergency_phone','coaching_media']){assert.ok(intakeMissing({...p,details:{...details,[key]:''}}).length);}
assert.deepEqual(intakeMissing({...p,details:{...details,availability:''}}),[],'Availability is optional at assessment request');
assert.deepEqual(intakeMissing({...p,details:{...details,allergies:''}}),[],'Medical follow-ups stay optional when None known is selected');
const withDetails={...details,medical:'Details below'};
for(const key of ['medical_details','allergies','medication','injuries','emergency_plan']){
 assert.ok(intakeMissing({...p,details:{...withDetails,[key]:''}}).length,'Missing conditional medical field: '+key);
}assert.ok(!intakeSections.flatMap(s=>s.fields).find(f=>f.key==='training_top_size').required);});

const {filterLibrary}=require('../lib/staffSessionPlanning.ts');
const {withStarterDiagram}=require('../lib/starterPracticeDiagrams.ts');
test('equipment and space filters distinguish a compact basic practice from keeper equipment and large areas',()=>{const library=[{id:'a',title:'A',setup:'10×8m area',equipment:'Balls, cones',minutes:10,points:'',progression:''},{id:'b',title:'B',setup:'20 × 30m area',equipment:'Ball, gloves',minutes:10,points:'',progression:''},{id:'c',title:'C',setup:'Choose a safe area',equipment:'Balls, cones, goal',minutes:10,points:'',progression:''}];const f={query:'',category:'',theme:'',duration:'',sort:'default',favouritesOnly:false,favourites:[]};assert.deepEqual(filterLibrary(library,{...f,equipment:'basic',space:'compact'}).map(a=>a.id),['a']);assert.deepEqual(filterLibrary(library,{...f,space:'flexible'}).map(a=>a.id),['c']);});
test('six retained starter diagrams specify dimensions, people and ordered action labels',()=>{for(const n of [2,3,4,5,7,8]){const a=withStarterDiagram({id:'starter-'+n,title:'Fixture',minutes:12,setup:'Original setup',equipment:'Balls, cones',points:'',progression:''});assert.ok(a.diagram.width>0&&a.diagram.length>0);assert.equal(a.diagram.people.length,2);assert.ok(a.diagram.arrows.every((v,i)=>v.label===String(i+1)));assert.ok(a.setup.startsWith(a.diagram.caption));}});

const {createRequestSequence}=require('../lib/staffRequestSequence.ts');
test('only the latest attendance response is permitted to update the UI',()=>{
 const guard=createRequestSequence();
 const first=guard.next(),second=guard.next();
 assert.equal(guard.isCurrent(first),false,'Slow old session data must not overwrite selected session');
 assert.equal(guard.isCurrent(second),true);
 guard.invalidate();
 assert.equal(guard.isCurrent(second),false,'An unmounted workspace must ignore late responses');
});
test('staff assessments share the calendar UK clock-change safeguards',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../components/StaffOnboarding.tsx'),'utf8');
 assert.match(source,/p_starts:status==='confirmed'\?ukInputToISO\(date\):null/);
 assert.doesNotMatch(source,/function ukInstant\(/);
 assert.throws(()=>ukInputToISO('2026-10-25T01:30'),/occurs twice/);
 assert.throws(()=>ukInputToISO('2026-03-29T01:30'),/does not exist/);
});
