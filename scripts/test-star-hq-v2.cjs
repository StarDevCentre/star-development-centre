const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
test("v2 is separated from live player access and keeps the owner gate",()=>{
 const entry=read("components/star-hq/StarHQExperience.tsx");
 const gate=read("components/star-hq/StarHQOwnerGate.tsx");
 assert.match(entry,/star-hq-v2\/StarHQRenderer/);
 assert.match(gate,/status==="allowed"\?<StarHQExperience/);
 assert.match(entry,/SAMPLE_PLAYER/);
 assert.doesNotMatch(entry,/\.from\(|\.rpc\(|playerId/);
});
test("reception uses real Three.js PBR geometry rather than the v1 blob renderer",()=>{
 const scene=read("components/star-hq-v2/receptionScene.js");
 const engine=read("components/star-hq-v2/StarHQRenderer.js");
 assert.match(scene,/RoundedBoxGeometry/);
 assert.match(scene,/MeshPhysicalMaterial/);
 assert.match(scene,/CanvasTexture/);
 assert.match(scene,/star-colour-transparent\.webp/);
 assert.match(scene,/TROPHY|Trophy Gallery/);
 assert.match(scene,/WOMEN'S FOOTBALL/);
 assert.match(engine,/THREE\.WebGLRenderer/);
 assert.match(engine,/ACESFilmicToneMapping/);
 assert.match(engine,/this\.cast\.update/);
 assert.doesNotMatch(engine,/this\.human\(/);
});
test("player, Mia and NPCs use actual skinned GLB assets and walking animations",()=>{
 const cast=read("components/star-hq-v2/riggedCharacters.js");
 assert.match(cast,/GLTFLoader/);
 assert.match(cast,/MeshoptDecoder/);
 assert.match(cast,/THREE\.AnimationMixer/);
 assert.match(cast,/female-walk\.glb/);
 assert.match(cast,/new THREE\.PlaneGeometry\(\.22,.15\)/);
 assert.match(cast,/file:"player\.glb"/);
 assert.match(cast,/file:"mia\.glb"/);
 assert.match(cast,/file:"academy-player-a\.glb"/);
 assert.match(cast,/file:"academy-player-b\.glb"/);
 assert.match(cast,/actors\.set\(definition\.id/);
});
test("3D asset proxy uses only licensed static allowlisted names",()=>{
 const api=read("app/api/star-hq/v2-assets/[name]/route.ts");
 assert.match(api,/sourceOrigin = "https:\/\/models\.codelove\.in"/);
 assert.match(api,/hasOwnProperty\.call\(files,name\)/);
 assert.match(api,/new DataView\(data\)\.getUint32\(0,true\)!==0x46546c67/);
 assert.doesNotMatch(api,/new URL\(name|service_role|NEXT_PUBLIC_SUPABASE/);
 const license=read("docs/star-hq/V2-ASSET-PROVENANCE.md");
 assert.match(license,/Copyright \(c\) 2020 Microsoft/);
 assert.match(license,/MIT License/);
});
test("separate audio controls and cleaner mobile settings still work",()=>{
 const entry=read("components/star-hq/StarHQExperience.tsx");
 const css=read("components/star-hq/star-hq.css");
 assert.match(entry,/setSettings/);
 assert.match(entry,/aria-pressed=\{sound\}/);
 assert.match(entry,/aria-pressed=\{music\}/);
 assert.match(entry,/readyPromise/);
 assert.match(css,/hq-settings-toggle/);
 assert.match(css,/hq-header-actions/);
});
test("renderer version is locked; production Player Space entry is not modified",()=>{
 const pkg=JSON.parse(read("package.json")),lock=JSON.parse(read("package-lock.json"));
 assert.equal(pkg.dependencies.three,"0.187.0");
 assert.equal(lock.packages[""].dependencies.three,"0.187.0");
 assert.equal(lock.packages["node_modules/three"].version,"0.187.0");
 const diffFiles=read("docs/star-hq/V2-ASSET-PROVENANCE.md");
 assert.match(diffFiles,/Do not merge to main or deploy to production/);
});
