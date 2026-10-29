const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../lib/content/session-builder-library.json"),"utf8"));
const counts={"1-to-1 drills":50,"1-to-1 activities":10,"Small-group drills":40,"Small-group activities":20,"1-to-1 goalkeeper drills":20};
assert.equal(data.length,140);
for(const [cat,count] of Object.entries(counts))assert.equal(data.filter(x=>x.category===cat).length,count,cat);
for(const field of ["id","title","setup"])assert.equal(new Set(data.map(x=>x[field].toLowerCase())).size,140,"Duplicate "+field);
const original=["Ball mastery and scanning","Receive across your body","Pass and support","1v1: beat and escape","Shield, turn and connect","Wide-channel counterattack","Finishing after a first touch","Goalkeeper: angle and set","Conditioned game and review","Cool-down and player reflection"];
for(const item of data){assert(!original.includes(item.title));assert.equal(item.age,"11–18");for(const key of ["players","points","progression","equipment"])assert(item[key].length>10,item.id+" "+key);assert(item.setup.length>150,item.id);assert(item.progression.includes("Easier:")&&item.progression.includes("Harder:"));assert(item.minutes>0);if(item.kind==="Drill")assert(item.minutes>=10&&item.minutes<=15);else assert.equal(item.minutes,30);if(item.format==="1-to-1")assert.equal(item.players,"1 player + 1 coach");if(item.format==="Goalkeeper 1-to-1")assert.equal(item.players,"1 goalkeeper + 1 coach");}
console.log("Catalogue checks passed: 140 unique entries, five exact category counts, durations, staffing, fields, age range and original-title exclusion.");
