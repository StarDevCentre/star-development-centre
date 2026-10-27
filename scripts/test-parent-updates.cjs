const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
function compile(file,req,extras={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:req,Date,Intl,Error,Set,...extras});return exports;}
const mapping=compile('lib/parentUpdates.ts',require),dates=compile('lib/parentDashboard.ts',require);
assert.equal(mapping.parentUpdateSection('message'),'messages');assert.equal(mapping.parentUpdateSection('report'),'development');assert.equal(mapping.parentUpdateSection('session'),'sessions');assert.equal(mapping.parentUpdateSection('programme'),'account');
assert.equal(dates.parentSectionFromHash('#updates'),'updates');assert.equal(dates.parentSectionFromHash('#untrusted'),null);
function harness(file,props,dependencies={},extras={}){
 const states=[],effects=[],pending=[];let cursor=0,effectCursor=0,memoCursor=0,tree;const memos=[];
 const hooks={...React,useRef(v){const i=cursor++;if(!(i in states))states[i]={current:v};return states[i]},useState(v){const i=cursor++;if(!(i in states))states[i]=typeof v==='function'?v():v;return[states[i],n=>{states[i]=typeof n==='function'?n(states[i]):n}]},useCallback(fn,deps){const i=memoCursor++,prev=memos[i];if(!prev||deps.some((d,j)=>!Object.is(d,prev.deps[j])))memos[i]={fn,deps};return memos[i].fn},useEffect(fn,deps){const i=effectCursor++,prev=effects[i];if(!prev||!deps||deps.some((d,j)=>!Object.is(d,prev.deps[j])))pending.push(()=>{prev?.cleanup?.();effects[i]={deps,cleanup:fn()}})}};
 const mod=compile(file,name=>name==='react'?hooks:name==='react/jsx-runtime'?require('react/jsx-runtime'):dependencies[name]||{},extras);const C=Object.values(mod)[0];
 function render(){cursor=0;effectCursor=0;memoCursor=0;tree=Array.isArray(props)?C(...props):C(props);return tree}
 async function flush(){for(let i=0;i<4;i++){render();while(pending.length)pending.shift()();await new Promise(r=>setImmediate(r))}render()}
 return{render,flush,get tree(){return tree},props,unmount(){effects.forEach(e=>e?.cleanup?.())}};
}
function nodes(n){return !n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)]}
function text(n){return n==null||typeof n==='boolean'?'':typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(text).join(' '):text(n.props?.children)}
function button(h,label){const n=nodes(h.tree).find(n=>n.type==='button'&&text(n)===label);assert(n,`Missing button ${label}`);return n}
(async()=>{
 let failed=false;const reads=[],opened=[];
 const items=[{id:'n1',player_id:'p2',category:'report',title:'Monthly report published',created_at:'2026-10-27T13:00:00Z',read_at:null},{id:'n2',player_id:null,category:'programme',title:'Your programme application has an update',created_at:'2026-10-27T12:00:00Z',read_at:'2026-10-27T12:10:00Z'}];
 const h=harness('components/ParentUpdates.tsx',{items,players:[{id:'p2',first_name:'Fixture',last_name:'Player'}],onRefresh(){},onRead:async ids=>{if(failed)throw Error('Synthetic failure');reads.push(ids)},onOpen:(...args)=>opened.push(args)},{'../lib/parentDashboard':dates,'../lib/parentUpdates':mapping});h.render();
 assert.equal(reads.length,0,'Mount must not mark anything read');
 button(h,'Unread').props.onClick();h.render();assert(!text(h.tree).includes(items[1].title));
 failed=true;button(h,'View update →').props.onClick();await h.flush();assert.equal(opened.length,0);assert(text(h.tree).includes('Synthetic failure'));
 failed=false;button(h,'View update →').props.onClick();await h.flush();assert.deepEqual(opened,[['development','p2']]);assert.equal(reads[0][0],'n1');
 button(h,'Mark all as read').props.onClick();await h.flush();assert.equal(reads.at(-1).length,1);
 // Hook account changes and stale requests: older account data never reappears.
 let rows=items,failRead=false,failMark=false,hold=false,release;const writes=[];
 const db={from(table){assert.equal(table,'parent_notifications');let update=false,payload,ids=[];const q={select(){return q},eq(){return q},order(){return q},limit(){return q},in(k,v){ids=v;return q},update(p){update=true;payload=p;return q},then(resolve,reject){if(update){writes.push(payload);return Promise.resolve({data:failMark?null:ids.map(id=>({id})),error:failMark?{}:null}).then(resolve,reject)}if(hold){hold=false;return new Promise(r=>{release=r}).then(resolve,reject)}return Promise.resolve({data:rows,error:failRead?{}:null}).then(resolve,reject)}};return q}};
 const listeners={};const win={setInterval:()=>1,clearInterval(){},addEventListener:(k,v)=>listeners[k]=v,removeEventListener:k=>delete listeners[k]};const doc={visibilityState:'visible',addEventListener(){},removeEventListener(){}};
 const hook=harness('components/useParentUpdates.ts',['a',true],{'../lib/supabaseBrowser':{supabaseBrowser:db}},{window:win,document:doc});await hook.flush();assert.equal(hook.tree.unread,1);
 failMark=true;await assert.rejects(hook.tree.markRead(['n1']));hook.render();assert.equal(hook.tree.unread,1);
 failMark=false;await hook.tree.markRead(['n1']);hook.render();assert.equal(hook.tree.unread,0);
 hold=true;const old=hook.tree.refresh();hook.props[0]='b';rows=[];hook.render();assert.equal(hook.tree.items.length,0);await hook.flush();release({data:items,error:null});await old;hook.render();assert.equal(hook.tree.items.length,0);
 failRead=true;await hook.tree.refresh();hook.render();assert(hook.tree.error);assert.equal(hook.tree.items.length,0);
 failRead=false;await hook.tree.refresh();hook.render();assert.equal(hook.tree.error,'');
 hook.unmount();assert(!listeners.focus);
 // Phone alerts need an explicit tap and real permission; failed writes remain retryable.
 let prompts=0,permission='denied',saved=[],rpcCalls=[],subscribed=0,removed=0,saveError=false;
 const prefs={enabled:false,categories:['message','report','session','programme'],quiet_hours:true,consented_at:null};
 const alertDb={auth:{getUser:async()=>({data:{user:{id:'parent-a'}}})},rpc:async(name,args)=>{rpcCalls.push(name);return{data:name==='parent_push_public_key'?'synthetic-public-key':'synthetic-subscription',error:null}},from(table){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:prefs,error:null}),upsert:async value=>{saved.push(value);return{error:saveError?{}:null}},delete(){removed++;return q},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q}};
 const push={defaultParentAlerts:prefs,parentAlertChoices:[{key:'message',label:'Messages'},{key:'report',label:'Reports'},{key:'session',label:'Sessions'},{key:'programme',label:'Programmes'}],pushSupport:()=> 'supported',applicationServerKey:()=>new Uint8Array(),parentPushRegistration:async()=>({pushManager:{getSubscription:async()=>null,subscribe:async()=>{subscribed++;return{toJSON:()=>({endpoint:'synthetic'}),unsubscribe:async()=>true}}}}),removeParentDevicePush:async()=>{removed++}};
 const phone=harness('components/ParentPhoneAlerts.tsx',{userKey:'parent-a'},{'../lib/supabaseBrowser':{supabaseBrowser:alertDb},'../lib/parentPush':push,'./ParentAppChrome':{ParentInstall:()=>null}},{navigator:{},Notification:{requestPermission:async()=>{prompts++;return permission}}});
 await phone.flush();assert.equal(prompts,0);assert(text(phone.tree).includes('Phone alerts are off.'));
 button(phone,'ENABLE PHONE ALERTS').props.onClick();await phone.flush();assert.equal(prompts,1);assert.equal(subscribed,0);assert(text(phone.tree).includes('Notifications are blocked'));
 permission='granted';button(phone,'ENABLE PHONE ALERTS').props.onClick();await phone.flush();assert.equal(subscribed,1);assert(rpcCalls.includes('register_parent_push_subscription'));assert(saved.at(-1).enabled&&saved.at(-1).consented_at);assert(text(phone.tree).includes('Phone alerts are on for this device'));
 saveError=true;button(phone,'Save alert choices ✓').props.onClick();await phone.flush();assert(text(phone.tree).includes('Could not save alert choices'));
 saveError=false;button(phone,'Save alert choices ✓').props.onClick();await phone.flush();assert(text(phone.tree).includes('Your alert choices are saved.'));
 button(phone,'Turn off everywhere').props.onClick();await phone.flush();assert.equal(saved.at(-1).enabled,false);assert.equal(removed,2);assert(text(phone.tree).includes('Phone alerts are off on all your devices.'));phone.unmount();

 console.log('PASS: safe update destinations and sibling context, no implicit reads, read failure/retry, unread filtering, account isolation, stale-response rejection and refresh recovery.');
})().catch(e=>{console.error(e);process.exitCode=1});
