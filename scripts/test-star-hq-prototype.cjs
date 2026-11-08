/** Focused STAR HQ prototype tests. No database writes or real player data. */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
const root=path.resolve(__dirname,"..");
function read(p){return fs.readFileSync(path.join(root,p),"utf8");}
function loadDemo(){
 const source=read("lib/starHQ/demoWorld.ts");
 const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const m={exports:{}};new Function("module","exports",out)(m,m.exports);return m.exports;
}
test("fictional fixture and collision bounds are deterministic",()=>{
 const d=loadDemo();
 assert.equal(d.SAMPLE_PLAYER.firstName,"Alex");
 assert.equal(d.SAMPLE_PLAYER.shirtNumber,10);
 assert.equal(d.NPC_PATHS.length,6);
 assert.equal(d.NPC_PATHS[0].id,"mia");
 assert.equal(d.isBlocked(50,0),true);
 assert.equal(d.isBlocked(0,-4.0),true); // solid reception desk
 assert.equal(d.isBlocked(0,2),false); // player has central movement
 assert.deepEqual(d.moveWithCollisions({x:0,z:-2.7},0,-2.0),{x:0,z:-2.7});
});
test("Mia and locked facilities have real interaction targets",()=>{
 const d=loadDemo();
 assert.equal(d.nearestInteraction({x:2.45,z:-2.9}).id,"mia");
 assert.equal(d.nearestInteraction({x:-8,z:.55}).id,"changing");
 assert.equal(d.nearestInteraction({x:8,z:-2.65}).id,"trophies");
 assert.equal(d.nearestInteraction({x:8,z:2.1}).id,"pitches");
 assert.equal(d.nearestInteraction({x:0,z:4}),null);
 assert.ok(d.DIALOGUE.length>=4);
});
test("UK clock uses timezone and respects GMT/BST",()=>{
 const d=loadDemo();
 const winter=d.londonHour(new Date("2026-01-15T12:00:00Z"));
 const summer=d.londonHour(new Date("2026-07-15T12:00:00Z"));
 assert.equal(winter.hour,12);
 assert.equal(summer.hour,13);
 assert.equal(d.daylight(new Date("2026-07-15T12:00:00Z")).stage,"day");
 assert.equal(d.daylight(new Date("2026-11-15T23:00:00Z")).stage,"night");
});
test("animated NPCs have predictable positions",()=>{
 const d=loadDemo();
 for(const path of d.NPC_PATHS){
  const npc=d.npcAtTime(path,2.0);
  assert.equal(npc.kind,path.kind);assert.ok(Number.isFinite(npc.x));
  assert.ok(Number.isFinite(npc.z));assert.ok(Math.abs(npc.x)<=8.8);
  assert.ok(Math.abs(npc.z)<=5.5);
 }
});
test("owner preview is server-authorised and cannot read real player records",()=>{
 const access=read("app/api/star-hq/preview-access/route.ts");
 assert.match(access,/authClient\.auth\.getUser\(token\)/);
 // Regression: accessToken creates a database-only client; auth.getUser must
 // run on a separate auth-enabled instance, otherwise every owner gets a 403.
 assert.match(access,/const authClient=createClient\(url,key,\{auth:/);
 assert.match(access,/const db=createClient\(url,key,\{auth:[^\n]*accessToken:/);
 assert.ok(access.indexOf("authClient.auth.getUser(token)") < access.indexOf("const db=createClient(url,key"));
 assert.match(access,/from\("staff_members"\)/);
 assert.match(access,/eq\("role","owner"\)/);
 assert.match(access,/eq\("active",true\)/);
 assert.match(access,/no-store/);
 for(const forbidden of ["service_role","SUPABASE_SERVICE_ROLE_KEY","player_space_profiles","coaching_players","owner_player_space_preview"]){
  assert.doesNotMatch(access,new RegExp(forbidden));
 }
 const page=read("app/staff/star-hq-preview/page.tsx");
 assert.match(page,/robots:\{index:false/);
 const gate=read("components/star-hq/StarHQOwnerGate.tsx");
 assert.match(gate,/status==="allowed"\?<StarHQExperience/);
 assert.match(gate,/Authorization:"Bearer "/);
 const experience=read("components/star-hq/StarHQExperience.tsx");
 assert.match(experience,/SAMPLE_PLAYER/);
 assert.doesNotMatch(experience,/\.from\(|\.rpc\(|playerId|photo_url/);
});
test("3D graphics, movement, NPC conversations and accessibility are implemented",()=>{
 const renderer=read("components/star-hq/StarHQRenderer.ts");
 assert.match(renderer,/getContext\("webgl2"/);
 assert.match(renderer,/gl\.drawArrays/);
 assert.match(renderer,/gl\.DEPTH_TEST/);
 assert.match(renderer,/this\.human\(player\.x/);
 assert.match(renderer,/this\.environment\(light\)/);
 assert.match(renderer,/star-colour-transparent\.webp/);
 const experience=read("components/star-hq/StarHQExperience.tsx");
 assert.match(experience,/requestAnimationFrame/);
 assert.match(experience,/moveWithCollisions/);
 assert.match(experience,/npcAtTime/);
 assert.match(experience,/role="dialog"/);
 assert.match(experience,/onPointerMove/);
 assert.match(experience,/Music:/);
 assert.match(experience,/(?:Sounds:|Environment sounds:)/);
 assert.match(experience,/Return to Staff Portal|Exit HQ/);
});
