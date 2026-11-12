const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const base=path.resolve('components');
const regular=require('../lib/content/football-history.json');
const specials=require('../lib/content/football-history-specials.json');
const ultimates=require('../lib/content/football-history-ultimates.json');
const sparks=require('../lib/content/football-history-sparks.json');
function render({preview=true,edition='trailblazers',progress={}}={}){
 let state=0;const exports={};
 const jsx=(type,props)=>({type:typeof type==='function'?'component':type,props});
 const source=ts.transpileModule(fs.readFileSync('components/PlayerFootballHistory.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const hooks={useState(value){const i=state++;return [i===0?edition:i===1?progress:typeof value==='function'?value():value,()=>{}];},useRef(){return {current:null};},useEffect(){}};
 vm.runInNewContext(source,{exports,require(name){if(name==='react')return hooks;if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};if(name.endsWith('.json'))return require(path.resolve(base,name));if(name.endsWith('.css'))return {};return {default:()=>null,SpecialHistoryCard:()=>null,SparksHistoryCard:()=>null,SparksHistoryArt:()=>null,SparksReadAloud:()=>null,supabaseBrowser:null};}});
 return exports.PlayerFootballHistory({playerId:'example',preview});
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
test('owner preview includes all Special and Ultimate stories',()=>{
 const tree=render();const text=JSON.stringify(tree);
 for(const card of [...specials,...ultimates])assert.ok(text.includes(card.name),card.name+' missing');
 assert.ok(text.includes('Special editions'));assert.ok(text.includes('Ultimate Challenges'));
 const meter=nodes(tree).find(n=>n.type==='progress');assert.equal(meter.props.max,regular.length+specials.length+ultimates.length);
});
test('live older collection counts Special and Ultimate awards',()=>{
 const progress=Object.fromEntries([specials[0],ultimates[0]].map(c=>[c.id,{card_id:c.id,earned_at:'2026-11-12',score:c.questions.length,retry_at:null}]));
 const meter=nodes(render({preview:false,progress})).find(n=>n.type==='progress');assert.equal(meter.props.value,2);assert.equal(meter.props.max,regular.length+specials.length+ultimates.length);
});
test('Sparks catalogue stays limited to the younger edition',()=>{
 const tree=render({preview:false,edition:'sparks'});const text=JSON.stringify(tree);
 assert.ok(!text.includes('Special editions'));assert.ok(!text.includes('Ultimate Challenges'));
 assert.equal(nodes(tree).find(n=>n.type==='progress').props.max,sparks.length);
});
