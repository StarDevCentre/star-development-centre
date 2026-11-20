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
const prestige=require('../lib/content/football-history-prestige.json');
const sparks=require('../lib/content/football-history-sparks.json');
function render({preview=true,edition='trailblazers',progress={},selectedCard=null,quizQuestion=0,answers=[]}={}){
 let state=0;const exports={};
 const jsx=(type,props)=>({type:typeof type==='function'?'component':type,props});
 const source=ts.transpileModule(fs.readFileSync('components/PlayerFootballHistory.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const hooks={useState(value){const i=state++;return [i===0?edition:i===1?progress:i===5&&selectedCard?selectedCard:i===6&&selectedCard?'quiz':i===8&&selectedCard?answers:i===9&&selectedCard?quizQuestion:typeof value==='function'?value():value,()=>{}];},useRef(){return {current:null};},useEffect(){}};
 vm.runInNewContext(source,{exports,require(name){if(name==='react')return hooks;if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};if(name.endsWith('.json'))return require(path.resolve(base,name));if(name.endsWith('.css'))return {};return {default:()=>null,SpecialHistoryCard:()=>null,SparksHistoryCard:()=>null,SparksHistoryArt:()=>null,SparksReadAloud:()=>null,supabaseBrowser:null};}});
 return exports.PlayerFootballHistory({playerId:'example',preview});
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
test('owner preview includes all Special and Ultimate stories',()=>{
 const tree=render();const text=JSON.stringify(tree);
 for(const card of [...specials,...ultimates])assert.ok(text.includes(card.name),card.name+' missing');
 assert.ok(text.includes('Special editions'));assert.ok(text.includes('Ultimate Challenges'));
 const meter=nodes(tree).find(n=>n.type==='progress');assert.equal(meter.props.max,regular.length+specials.length+ultimates.length+prestige.length);
});
test('live older collection counts Special and Ultimate awards',()=>{
 const progress=Object.fromEntries([specials[0],ultimates[0]].map(c=>[c.id,{card_id:c.id,earned_at:'2026-11-12',score:c.questions.length,retry_at:null}]));
 const meter=nodes(render({preview:false,progress})).find(n=>n.type==='progress');assert.equal(meter.props.value,2);assert.equal(meter.props.max,regular.length+specials.length+ultimates.length+prestige.length);
});
test('Sparks catalogue stays limited to the younger edition',()=>{
 const tree=render({preview:false,edition:'sparks'});const text=JSON.stringify(tree);
 assert.ok(!text.includes('Special editions'));assert.ok(!text.includes('Ultimate Challenges'));
 assert.equal(nodes(tree).find(n=>n.type==='progress').props.max,sparks.length);
});

test('Prestige is locked until every frozen prerequisite is earned',()=>{
 const button=progress=>nodes(render({preview:false,progress})).find(n=>n.type==='button'&&JSON.stringify(n.props.children).includes('The Game They Couldn’t Stop'));
 assert.equal(button({}).props.disabled,true);
 const progress=Object.fromEntries(prestige[0].prerequisites.map(id=>[id,{card_id:id,score:7,earned_at:'2026-11-14',retry_at:null}]));
 assert.equal(button(progress).props.disabled,false);
 delete progress[55];assert.equal(button(progress).props.disabled,true);
 assert.equal(prestige[0].questions.length,10);
 assert.ok(prestige[0].story.split(/\s+/).length>=1000);
});

test('all five Prestige cards preview, and the final four unlock sequentially',()=>{
 assert.equal(prestige.length,5);
 const preview=JSON.stringify(render());
 for(const card of prestige) {
  assert.ok(preview.includes(card.name));
  assert.equal(card.questions.length,10);
  assert.ok(card.story.split(/\s+/).length>=1200);
  for(const q of card.questions) assert.equal(new Set(q.options).size,4);
  for(const face of ['front','back']) assert.ok(fs.existsSync(`public/player-space/history/specials/${card.artwork.slug}-${face}.webp`));
 }
 for(const card of prestige.slice(1)) {
  assert.deepEqual(card.prerequisites,[card.id-1]);
  const find=progress=>nodes(render({preview:false,progress})).find(n=>n.type==='button'&&JSON.stringify(n.props.children).includes(card.name));
  assert.equal(find({}).props.disabled,true);
  assert.equal(find({[card.id-1]:{earned_at:'2026-11-14'}}).props.disabled,false);
  assert.equal(find({[card.id]:{earned_at:'2026-11-14'}}).props.disabled,false);
 }
});

test('regular, Sparks and Prestige quizzes show one question per step',()=>{
 for(const [edition,card] of [['trailblazers',regular[0]],['sparks',sparks[0]],['trailblazers',prestige[0]]]){
  const tree=render({edition,selectedCard:card,quizQuestion:1,answers:[0]});
  const all=nodes(tree),fields=all.filter(n=>n.type==='fieldset');
  assert.equal(fields.length,1,card.name+' must show only one question');
  assert.ok(JSON.stringify(fields[0]).includes(card.questions[1].prompt));
  assert.equal(all.filter(n=>n.type==='input'&&n.props.type==='radio').length,card.questions[1].options.length);
  const meter=all.find(n=>n.type==='progress');
  assert.equal(meter.props.value,2);
  assert.equal(meter.props.max,card.questions.length);
  assert.ok(all.some(n=>n.type==='button'&&n.props.children==='Previous question'));
  const next=all.find(n=>n.type==='button'&&n.props.children==='Next question');
  assert.ok(next);
  assert.equal(next.props.disabled,true,'advance must wait for an answer');
 }
});

test('the final quiz step requires every answer before submitting',()=>{
 for(const [edition,card] of [['trailblazers',regular[0]],['sparks',sparks[0]],['trailblazers',prestige[0]]]){
  const count=card.questions.length;
  const submit=answers=>nodes(render({edition,selectedCard:card,quizQuestion:count-1,answers}))
    .find(n=>n.type==='button'&&n.props.type==='submit');
  assert.equal(submit(Array(count-1).fill(0)).props.disabled,true);
  assert.equal(submit(Array(count).fill(0)).props.disabled,false);
 }
});
