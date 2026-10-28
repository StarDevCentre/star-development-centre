const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
function compile(file){const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,Date,Intl,Map,Number,encodeURIComponent,decodeURIComponent});return exports;}
const {assessmentTimeline,parentSpaceKey,parentSpaceSectionFromHash,calendarForSession}=compile('lib/parentExperience.ts');
const rows=[
 {id:'a1',player_id:'a',category:'Technical',rating:2,assessed_on:'2026-07-01'},
 {id:'a2',player_id:'a',category:'Technical',rating:3.5,assessed_on:'2026-09-01'},
 {id:'b1',player_id:'b',category:'Technical',rating:5,assessed_on:'2026-07-01'},
 {id:'a3',player_id:'a',category:'Social',rating:4,assessed_on:'2026-07-01'},
 {id:'a4',player_id:'a',category:'Technical',rating:7,assessed_on:'2026-10-01'},
 {id:'a5',player_id:'a',category:'Technical',rating:NaN,assessed_on:'2026-10-02'},
 {id:'a6',player_id:'a',category:'Technical',rating:3,assessed_on:'2026-02-30'},
 {id:'a7',player_id:'a',category:'Technical',rating:3,assessed_on:'bad-date'}
];
const series=assessmentTimeline(rows,'a','Technical');assert.equal(JSON.stringify(series),JSON.stringify([{id:'a1',date:'2026-07-01',rating:2},{id:'a2',date:'2026-09-01',rating:3.5}]));
assert.equal(assessmentTimeline(rows,'empty','Technical').length,0);
assert.equal(assessmentTimeline(rows,'b','Technical')[0].rating,5);
assert.equal(rows[0].id,'a1');
assert.equal(assessmentTimeline([...rows,{...rows[1],id:'a9',rating:4}],'a','Technical').at(-1).rating,4,'Duplicate-date ratings must resolve deterministically without averaging or double plotting');
assert.notEqual(parentSpaceKey('family-a','player'),parentSpaceKey('family-b','player'));
assert.notEqual(parentSpaceKey('family','a'),parentSpaceKey('family','b'));
assert.notEqual(parentSpaceKey('a:b','c'),parentSpaceKey('a','b:c'));
for(const [hash,result] of [['#Home','Home'],['#development','Development'],['#My%20space','My space'],['#messages','Messages'],['#updates','Updates'],['#account','Account'],['#practice','Practice'],['#programme-prices',null],['#%E0%A4%A',null]])assert.equal(parentSpaceSectionFromHash(hash),result);
const ics=calendarForSession({id:'fixture',title:'Training, then review; coach\nBEGIN:BAD',venue:'Venue\\Court',starts_at:'2026-06-05T17:00:00Z',ends_at:'2026-06-05T18:00:00Z'},new Date('2026-01-01T00:00:00Z'));
assert(ics.includes('DTSTART:20260605T170000Z\r\nDTEND:20260605T180000Z'));
assert(ics.includes('SUMMARY:Training\\, then review\\; coach\\nBEGIN:BAD'));
assert(!ics.includes('\r\nBEGIN:BAD'));
console.log('Passed: real assessment isolation, valid dates/ratings, deterministic history, empty records, account/player preference keys, legacy deep links, in-page anchors and calendar timezone/escaping.');
