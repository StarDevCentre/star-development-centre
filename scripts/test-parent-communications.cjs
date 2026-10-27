const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react');
const records={guardian_player_links:[{guardian_id:'guardian-a',player_id:'player-a'}],coaching_players:[{id:'player-a',first_name:'Sample',last_name:'Player'}],family_messages:[]};
let writes=0,dispatches=0;
const db={from(table){let update=false,ids=[];const q={select(){return q},eq(){return q},order(){return q},limit(){return q},in(key,value){if(key==='id')ids=value;return q},update(){update=true;return q},then(resolve,reject){if(update){writes++;records.family_messages=records.family_messages.map(m=>ids.includes(m.id)?{...m,read_at:'2026-10-27T12:00:00Z'}:m);return Promise.resolve({error:null}).then(resolve,reject)}return Promise.resolve({data:records[table]||[],error:null}).then(resolve,reject)}};return q}};
const states=[],effects=[],callbacks=[],pending=[];let si=0,ei=0,ci=0,tree,props={userId:'guardian-a',role:'guardian',active:true};
const hooks={...React,useState(initial){const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v}]},useCallback(fn,deps){const i=ci++,old=callbacks[i];if(!old||deps.some((x,j)=>!Object.is(x,old.deps[j])))callbacks[i]={fn,deps};return callbacks[i].fn},useEffect(fn,deps){const i=ei++,old=effects[i];if(!old||deps.some((x,j)=>!Object.is(x,old.deps[j])))pending.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()}})}};
const exportsForTest={};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../components/FamilyCommunications.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports:exportsForTest,require:name=>name==='react'?hooks:name==='react/jsx-runtime'?require(name):name==='../lib/supabaseBrowser'?{supabaseBrowser:db}:null,window:{setInterval(){return 1},clearInterval(){},dispatchEvent(){dispatches++}},Date,Event});
function render(){si=ei=ci=0;tree=exportsForTest.FamilyCommunications(props)}
async function flush(){for(let i=0;i<6;i++){render();while(pending.length)pending.shift()();await new Promise(r=>setImmediate(r))}render()}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)]}
function text(n){if(n==null||typeof n==='boolean')return '';if(typeof n==='string')return n;if(Array.isArray(n))return n.map(text).join(' ');return text(n.props?.children)}
(async()=>{
 await flush();const select=nodes(tree).find(n=>n.type==='select');select.props.onChange({target:{value:'guardian-a:player-a'}});await flush();
 const draft=nodes(tree).find(n=>n.type==='textarea');draft.props.onChange({target:{value:'Unsent fixture draft'}});await flush();
 props={...props,active:false};await flush();records.family_messages=[{id:'message-a',guardian_id:'guardian-a',player_id:'player-a',sender_id:'staff-a',sender_role:'staff',kind:'message',body:'Fixture update',created_at:'2026-10-27T12:00:00Z',read_at:null}];
 // An in-flight refresh may finish after navigating away; it must not mark the message as read.
 nodes(tree).find(n=>n.type==='button'&&text(n)==='Check now').props.onClick();await flush();
 assert.equal(writes,0);assert.equal(nodes(tree).find(n=>n.type==='textarea').props.value,'Unsent fixture draft');
 props={...props,active:true};await flush();assert.equal(writes,1);assert(dispatches>0);assert.equal(nodes(tree).find(n=>n.type==='textarea').props.value,'Unsent fixture draft');
 console.log('Passed: hidden conversation does not mark incoming messages as read; opening it marks read and refreshes the badge; unsent draft survives section changes.');
})().catch(e=>{console.error(e);process.exitCode=1});
