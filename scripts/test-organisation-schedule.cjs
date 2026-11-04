const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({supabaseBrowser:null}),Date,Intl,Number,Error});return exports;}
const {weeklySessionDates}=load('lib/organisationSchedule.ts'),{ukInputToISO,ukDateTimeInput}=load('lib/sessionOperations.ts');
assert.deepEqual([...weeklySessionDates('2027-03-21',3)],['2027-03-21','2027-03-28','2027-04-04']);
assert.deepEqual([...weeklySessionDates('2026-12-28',2)],['2026-12-28','2027-01-04']);
assert.deepEqual([...weeklySessionDates('2028-02-22',2)],['2028-02-22','2028-02-29']);
for(const [date,count] of [['2027-02-30',2],['bad',2],['2027-01-01',0],['2027-01-01',41],['2027-01-01',1.5]])assert.equal(weeklySessionDates(date,count).length,0);
assert.equal(weeklySessionDates('2027-01-01',40).length,40);
assert.deepEqual([...weeklySessionDates('2027-03-21',3)].filter(d=>d!=='2027-03-28'),['2027-03-21','2027-04-04']);
assert.equal(ukInputToISO('2027-03-21T17:00'),'2027-03-21T17:00:00.000Z');
assert.equal(ukInputToISO('2027-03-28T17:00'),'2027-03-28T16:00:00.000Z');
assert.equal(ukDateTimeInput('2027-03-28T16:00:00.000Z'),'2027-03-28T17:00');
assert.throws(()=>ukInputToISO('2027-03-28T01:30'),/does not exist/);
assert.throws(()=>ukInputToISO('2027-10-31T01:30'),/occurs twice/);
console.log('15 weekly-date, exclusion and UK clock-change checks passed; no network or records changed.');
