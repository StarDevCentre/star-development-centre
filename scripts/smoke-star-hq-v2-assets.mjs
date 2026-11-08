/**
 * Production-server HTTP smoke test of the licensed GLB model proxy.
 * Runs without credentials against localhost: the models are public and contain
 * no user data. Real owner preview remains protected by the normal owner gate.
 */
import assert from "node:assert/strict";
const origin=process.env.STAR_HQ_SMOKE_ORIGIN||"http://127.0.0.1:8137";
const cases=[
 {name:"player.glb",expect:"skins"},
 {name:"mia.glb",expect:"skins"},
 {name:"female-walk.glb",expect:"animations"}
];
for(const {name,expect} of cases){
 const response=await fetch(origin+"/api/star-hq/v2-assets/"+name,{signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,name+" server response: "+response.status);
 assert.match(response.headers.get("content-type")||"",/gltf-binary/);
 const bytes=Buffer.from(await response.arrayBuffer());
 assert.equal(bytes.subarray(0,4).toString("ascii"),"glTF");
 assert.ok(bytes.length>1000 && bytes.length<4_000_001,name+": valid size");
 const jsonLen=bytes.readUInt32LE(12);
 const meta=JSON.parse(bytes.subarray(20,20+jsonLen).toString("utf8"));
 assert.ok(Array.isArray(meta[expect])&&meta[expect].length>0,name+": "+expect+" present");
 assert.match(meta.asset?.copyright||"",/MIT License/i);
 console.log("PASS "+name+": "+Math.round(bytes.length/1024)+" KB, "+expect+"="+meta[expect].length);
}
const invalid=await fetch(origin+"/api/star-hq/v2-assets/private-user-data.glb");
assert.equal(invalid.status,404,"allowlist rejects unknown asset names");
console.log("PASS asset allowlist rejects unknown names.");
