const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const dates=require('../lib/sessionOperations.ts');
const original={id:'session-1',title:'Individual coaching',programme:'1-to-1',starts_at:'2026-11-12T15:00:00+00:00',ends_at:'2026-11-12T16:00:00+00:00',venue:'Old venue',notes:null,organisation_id:null};
async function setup({row=original,result={data:[{id:'session-1'}],error:null},throws=false}={}){
 const states=[],refs=[],effects=[];let cursor=0,refIndex=0,writes=0,saved=0,events=0,payload,filters=[];
 const client={from(table){assert.equal(table,'training_sessions');return {select(){return this;},eq(...args){filters.push(args);return this;},is(...args){filters.push(args);return this;},filter(...args){filters.push(args);return this;},single:async()=>({data:row,error:null}),update(value){writes++;payload=value;return this;},then(resolve,reject){return (throws?Promise.reject(Error('Offline')):Promise.resolve(result)).then(resolve,reject);}};}};
 const hooks={useState(value){const i=cursor++;if(!(i in states))states[i]=value;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef(value){const i=refIndex++;return refs[i]||(refs[i]={current:value});},useEffect(fn){if(!effects.length)effects.push(fn);}};
 const module={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync('components/SessionDetailsEditor.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(compiled,{module,exports:module.exports,Error,require:name=>name==='react'?hooks:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:dates,window:{dispatchEvent(){events++;}},Event:class{}});
 const render=()=>{cursor=0;refIndex=0;return module.exports.SessionDetailsEditor({client,sessionId:row.id,onSaved(){saved++;},onClose(){},onAssessment(){},onOrganisation(){}});};
 render();effects[0]();await new Promise(resolve=>setImmediate(resolve));
 const find=(node,type)=>{if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child,type);if(found)return found;}return null;};
 return {render,states,find,stats:()=>({writes,saved,events,payload,filters})};
}
test('saving changes the selected session, retains links, and refreshes views only after success',async()=>{
 const h=await setup();h.states[1]={...h.states[1],starts_at:'2026-11-12T17:00',ends_at:'2026-11-12T18:30',venue:' New venue '};await h.find(h.render(),'form').props.onSubmit({preventDefault(){}});
 const s=h.stats();assert.equal(s.writes,1);assert.equal(s.saved,1);assert.equal(s.events,1);assert.equal(s.payload.venue,'New venue');assert.equal(s.payload.starts_at,'2026-11-12T17:00:00.000Z');assert.ok(s.filters.some(f=>f[0]==='id'&&f[1]==='session-1'));assert.ok(s.filters.some(f=>f[0]==='starts_at'&&f[1]===original.starts_at));assert.ok(!('source_session_id' in s.payload));
});
test('invalid end time never reaches the database',async()=>{const h=await setup();h.states[1].ends_at='2026-11-12T14:00';await h.find(h.render(),'form').props.onSubmit({preventDefault(){}});assert.equal(h.stats().writes,0);assert.match(h.states[2],/End time/);});
test('zero-row update keeps the draft and never reports success',async()=>{const h=await setup({result:{data:[],error:null}});await h.find(h.render(),'form').props.onSubmit({preventDefault(){}});assert.equal(h.stats().saved,0);assert.equal(h.stats().events,0);assert.match(h.states[2],/changed elsewhere/);assert.ok(h.states[1]);});
test('network failure keeps the draft and unlocks retry',async()=>{const h=await setup({throws:true});await h.find(h.render(),'form').props.onSubmit({preventDefault(){}});assert.equal(h.stats().saved,0);assert.match(h.states[2],/Offline/);assert.equal(h.states[3],false);});
test('assessment and organisation sessions use their dedicated editors',async()=>{for(const row of [{...original,title:'FREE assessment'},{...original,organisation_id:'org-1'}]){const h=await setup({row});assert.equal(h.find(h.render(),'form'),null);assert.equal(h.stats().writes,0);}});
