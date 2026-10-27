const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const React=require('react');
const ts=require('typescript');
const root=path.join(__dirname,'..');
const events=[];
const fakeUser={id:'qa-guardian',email:'parent@example.invalid',user_metadata:{guardian_name:'QA Parent'}};
let listener,profile=null,registrations=[],failSave=false;
const client={auth:{
 getUser:async()=>({data:{user:null}}),
 onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}}},
 signUp:async args=>{events.push(['signup',args]);return {data:{session:null},error:null}},
 resend:async args=>{events.push(['resend',args]);return {error:null}},
 signInWithPassword:async()=>{listener('SIGNED_IN',{user:fakeUser});return {error:null}},
 resetPasswordForEmail:async()=>({error:null}),updateUser:async()=>({error:null}),signOut:async()=>{listener('SIGNED_OUT',null);return {error:null}}
},from(table){let operation='read',payload;const filters=[];
 const result=()=>{
  if(table==='guardian_profiles'){
   if(operation==='upsert'){profile=payload;events.push(['profile',payload]);return {error:null}}
   return {data:profile,error:null};
  }
  if(table==='player_registrations'){
   if(operation==='insert'){
    events.push(['registration',payload]);
    if(failSave)return {data:null,error:Error('offline')};
    const record={...payload,id:'qa-registration',created_at:'2026-10-27',recommended_programme:null};registrations.push(record);return {data:record,error:null};
   }
   return {data:registrations.slice(),error:null};
  }
  return {data:[],error:null};
 };
 const q={select(){return q},eq(k,v){filters.push([k,v]);return q},order(){return Promise.resolve(result())},maybeSingle(){return Promise.resolve(result())},single(){return Promise.resolve(result())},upsert(p){operation='upsert';payload=p;return Promise.resolve(result())},insert(p){operation='insert';payload=p;return q}};
 return q;
}};
function compile(relative,requireFn){const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:requireFn,window:{location:{origin:'https://star.example',search:''},sessionStorage:{getItem(){return null},setItem(){}},setTimeout(){return 1},clearTimeout(){}},document:{getElementById(){return {scrollIntoView(){}}}},Date,Error,URLSearchParams});return exports;}
const data=compile('lib/siteData.ts',require);
const pricesStub=()=>null;
function harness(file,props={}){
 const states=[],effects=[],pending=[];let stateCursor=0,effectCursor=0,tree;
 const hooks={...React,useState(initial){const i=stateCursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value}]},useEffect(fn,deps){const i=effectCursor++;const previous=effects[i];if(!previous||!deps||deps.some((d,j)=>!Object.is(d,previous.deps[j]))){pending.push(()=>{previous?.cleanup?.();effects[i]={deps,cleanup:fn()}})}}};
 const mod=compile(file,name=>name==='react'?hooks:name==='react/jsx-runtime'?require('react/jsx-runtime'):name==='../lib/supabaseBrowser'?{supabaseBrowser:client}:name==='../lib/siteData'?data:name==='./ParentProgrammePrices'?{ParentProgrammePrices:pricesStub}:name==='next/link'?{__esModule:true,default:'a'}:new Proxy({},{get:()=>()=>null}));
 const Component=Object.values(mod)[0];
 function render(){stateCursor=0;effectCursor=0;tree=Component(props);return tree}
 async function flush(){for(let i=0;i<4;i++){render();while(pending.length)pending.shift()();await new Promise(r=>setImmediate(r))}render()}
 return {render,flush,get tree(){return tree}};
}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)]}
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(text).join(' ');return text(node.props?.children)}
function find(h,predicate){const n=nodes(h.tree).find(predicate);assert(n,'Expected UI element missing');return n}
function field(h,label,value){const l=find(h,n=>n.type==='label'&&text(n).trim().startsWith(label));const n=nodes(l).find(n=>n.type==='input'||n.type==='select');n.props.onChange({target:{value,checked:value}});h.render()}
function form(h){return find(h,n=>n.type==='form')}
const event={preventDefault(){}};
(async()=>{
 const h=harness('components/ParentPortal.tsx',{initialMode:'signup',initialProgramme:'prestige'});await h.flush();
 assert(text(h.tree).includes('Start with you.'));assert(text(h.tree).includes('STAR Prestige'));
 field(h,'Parent / guardian name','QA Parent');field(h,'Email address','parent@example.invalid');field(h,'Password','fixture password long enough');field(h,'I’m a parent',true);
 await form(h).props.onSubmit(event);h.render();
 assert(text(h.tree).includes('Confirm your email.'));
 const signup=events.find(([kind])=>kind==='signup')[1];assert.equal(signup.options.emailRedirectTo,'https://star.example/parent-portal?programme=prestige');assert.equal(signup.options.data.guardian_name,'QA Parent');
 find(h,n=>n.type==='button'&&text(n)==='Continue to sign in →').props.onClick();h.render();
 assert.equal(find(h,n=>n.type==='input'&&n.props.autoComplete==='current-password').props.value,'');
 field(h,'Password','fixture password long enough');await form(h).props.onSubmit(event);await h.flush();
 assert(text(h.tree).includes('Your contact details'));
 assert.equal(find(h,n=>n.type==='input'&&n.props.autoComplete==='name').props.value,'QA Parent');
 await form(h).props.onSubmit(event);h.render();
 const registration=find(h,n=>n.props?.onSave);
 failSave=true;
 assert.equal(await registration.props.onSave({player_first_name:'QA',player_last_name:'Fixture',date_of_birth:'2013-10-27',programme:'prestige'}),false);h.render();
 assert(find(h,n=>n.props?.onSave));
 failSave=false;
 assert.equal(await find(h,n=>n.props?.onSave).props.onSave({player_first_name:'QA',player_last_name:'Fixture',date_of_birth:'2013-10-27',programme:'prestige'}),true);h.render();
 assert(text(h.tree).includes('Registration received.'));assert(text(h.tree).includes('Awaiting STAR review'));assert(!nodes(h.tree).some(n=>n.props?.onSave));
 assert.equal(find(h,n=>n.type===pricesStub).props.eligible,true);
 assert(events.filter(([kind])=>kind==='registration').every(([,p])=>p.guardian_id===fakeUser.id&&p.status==='submitted'&&p.submitted_at));
 const p=harness('components/PlayerRegistrationDraft.tsx',{initialProgramme:'prestige',busy:false,onSave:async()=>{events.push(['review-save']);return false}});await p.flush();
 field(p,'Player’s first name','QA');field(p,'Player’s last name','Fixture');field(p,'Date of birth','2013-10-27');
 await form(p).props.onSubmit(event);p.render();assert(text(p.tree).includes('Check her details.'));assert(!events.some(([kind])=>kind==='review-save'));
 await form(p).props.onSubmit(event);p.render();assert.equal(events.filter(([kind])=>kind==='review-save').length,1);assert(text(p.tree).includes('Check her details.'));
 find(p,n=>n.type==='button'&&text(n)==='← Edit details').props.onClick();p.render();
 assert.equal(find(p,n=>n.type==='input'&&n.props.value==='QA').props.value,'QA');
 field(p,'Date of birth','2020-10-27');assert.equal(find(p,n=>n.type==='select').props.value,'');
 console.log('Passed: signup → email checkpoint → sign-in → parent profile → registration failure/retry → receipt/pricing; review-before-submit, retained details and age-based programme clearing. Auth and UI exercised with test doubles; email delivery requires a live-account test.');
})().catch(e=>{console.error(e);process.exitCode=1});
