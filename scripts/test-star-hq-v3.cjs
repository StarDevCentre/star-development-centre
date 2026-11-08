const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("v3 uses sports-specific licensed character models, not the purple casual or suit bases",()=>{
 const proxy=read("app/api/star-hq/v2-assets/[name]/route.ts");
 assert.match(proxy,/"player\.glb": "\/models\/sports-female-01\.glb"/);
 assert.match(proxy,/"mia\.glb": "\/models\/sports-female-02\.glb"/);
 assert.match(proxy,/"coach\.glb": "\/models\/sports-female-02\.glb"/);
 assert.match(proxy,/"admin\.glb": "\/models\/sports-male-01\.glb"/);
 assert.doesNotMatch(proxy,/business-male-01\.glb|female-adult-03\.glb/);
});
test("v3 wardrobe is rigged to the original skeleton, not primitive costume shapes",()=>{
 const style=read("components/star-hq-v3/academyAppearance.js");
 const cast=read("components/star-hq-v2/riggedCharacters.js");
 assert.match(style,/new THREE\.SkinnedMesh/);
 assert.match(style,/skinIndex/);
 assert.match(style,/skinWeight/);
 assert.match(style,/top\.bind\(source\.skeleton/);
 assert.match(style,/Bip01 Head/);
 assert.match(style,/THEME\.navy/);
 assert.match(style,/THEME\.short/);
 assert.match(style,/THEME\.sock/);
 assert.match(cast,/styleAcademyCharacter\(meshRoot,id\)/);
 assert.match(cast,/cloneSkinnedHierarchy\(gltf\.scene\)/);
});
test("Mia is visible alongside lower reception counter, within interaction range",()=>{
 const scene=read("components/star-hq-v2/receptionScene.js");
 const world=read("lib/starHQ/demoWorld.ts");
 assert.match(scene,/Mia stands on the lobby-facing side/);
 assert.match(scene,/block\(group,2\.55,\.45,-4\.64/);
 assert.match(world,/MIA: Point = \{ x: 2\.45, z: -3\.36 \}/);
 assert.match(world,/distance\(point, \{x: 2\.4, z: -3\.16\}\)/);
});
test("feature logo is scaled down; upgraded scene has football-specific academy details",()=>{
 const scene=read("components/star-hq-v2/receptionScene.js");
 assert.match(scene,/logoMesh\.scale\.x=Math\.min\(2\.53,1\.23\*ratio\)/);
 assert.match(scene,/academyDetails\(group\)/);
 assert.match(scene,/WOMEN'S FOOTBALL/);
 assert.match(scene,/Trophy Gallery/);
});
test("existing owner-only access and fiction-only player data remain isolated",()=>{
 const gate=read("components/star-hq/StarHQOwnerGate.tsx");
 const api=read("app/api/star-hq/preview-access/route.ts");
 const demo=read("lib/starHQ/demoWorld.ts");
 assert.match(gate,/status==="allowed"\?<StarHQExperience/);
 assert.match(api,/authClient\.auth\.getUser\(token\)/);
 assert.match(api,/eq\("role","owner"\)/);
 assert.match(demo,/SAMPLE_PLAYER = Object\.freeze/);
 assert.doesNotMatch(demo,/supabase|auth\.getUser|realPlayer/);
});
