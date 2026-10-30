const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {filterLibrary,activityKey,activityThemes,blankPlan,moveActivity,planIssue,sessionTimeline,totalMinutes}=require('../lib/staffSessionPlanning.ts');
const library=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../lib/content/session-builder-library.json'),'utf8'));
const filters={query:'',category:'',theme:'',duration:'',sort:'default',favouritesOnly:false,favourites:[]};
test('category, focus, duration and words narrow the same collection',()=>{
 const source=library.find(a=>a.category==='1-to-1 drills'&&activityThemes(a).includes('Passing & receiving'));
 const result=filterLibrary(library,{...filters,category:source.category,theme:'Passing & receiving',duration:'short',query:source.title});
 assert(result.some(a=>a.id===source.id));assert(result.every(a=>a.category===source.category&&a.minutes<=15&&activityThemes(a).includes('Passing & receiving')));
 assert.equal(filterLibrary(library,{...filters,query:'no-such-practice-xyz'}).length,0);
});
test('favourites and sorting do not mutate the catalogue',()=>{
 const before=JSON.stringify(library);const ids=[activityKey(library[40]),activityKey(library[4])];
 const result=filterLibrary(library,{...filters,favouritesOnly:true,favourites:ids,sort:'duration'});
 assert.equal(result.length,2);assert(result[0].minutes<=result[1].minutes);
 const alpha=filterLibrary(library,{...filters,sort:'title'});assert(alpha.every((a,i)=>!i||alpha[i-1].title.localeCompare(a.title)<=0));
 assert.equal(JSON.stringify(library),before);assert.equal(filterLibrary(library,{...filters,favouritesOnly:true}).length,0);
});
test('long activities stay separate from short drills',()=>{
 const result=filterLibrary(library,{...filters,duration:'long'});assert.equal(result.length,30);assert(result.every(a=>a.kind==='Activity'&&a.minutes===30));
});
test('session order changes without altering source content and timing follows order',()=>{
 const plan={...blankPlan(),activities:[{...library[0]},{...library[1]},{...library[2]}]};const original=JSON.stringify(plan);
 const moved=moveActivity(plan,0,1);assert.equal(moved.activities[1].id,plan.activities[0].id);assert.equal(JSON.stringify(plan),original);
 assert.equal(moveActivity(plan,0,-1),plan);assert.equal(moveActivity(plan,2,1),plan);
 assert.deepEqual(sessionTimeline(moved),[{start:0,end:12},{start:12,end:22},{start:22,end:37}]);assert.equal(totalMinutes(moved),37);
});
test('save validation catches blank names, setup, invalid timing and overlong plans',()=>{
 const plan={...blankPlan(),activities:[{...library[0]}]};assert.equal(planIssue('First touch',plan),'');
 assert(planIssue('',plan));assert(planIssue('Session',{...plan,target:0}));assert(planIssue('Session',{...plan,target:60.5}));
 assert(planIssue('Session',{...plan,activities:[]}));assert(planIssue('Session',{...plan,activities:Array(31).fill(library[0])}));
 for(const patch of [{title:''},{setup:''},{minutes:0},{minutes:1.5},{minutes:121}])assert(planIssue('Session',{...plan,activities:[{...library[0],...patch}]}));
});
