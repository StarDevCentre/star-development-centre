const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"components/ParentAccountDeletion.tsx"),"utf8");
const backend=fs.readFileSync(path.join(root,"supabase/functions/delete-family-account/index.ts"),"utf8");
const sql=fs.readFileSync(path.join(root,"supabase/migrations/20261105180000_parent_family_account_deletion.sql"),"utf8");
const portal=fs.readFileSync(path.join(root,"components/ParentPortal.tsx"),"utf8");
function checkContract(){
 assert.match(portal,/<ParentAccountDeletion supabase=\{supabase\} user=\{user\}/,"Parent account settings must offer deletion without requiring a saved profile");
 assert.match(source,/confirmation!=="DELETE"/,"Require an explicit destructive confirmation");
 assert.match(source,/type="password"/,"Require fresh password");
 assert.match(source,/action:"preview"/);
 assert.match(source,/action:"delete"/);
 assert.match(backend,/caller\.auth\.getUser\(\)/,"Validate JWT with Auth, not client claims");
 assert.match(backend,/signInWithPassword/,"Reauthenticate before deletion");
 assert.match(backend,/verified\.user\?\.id!==user\.id/,"Password must belong to the same account");
 assert.match(backend,/admin\.auth\.admin\.deleteUser\(childId\)/);
 assert.match(backend,/admin\.auth\.admin\.deleteUser\(user\.id\)/);
 assert(backend.indexOf("deleteUser(childId)")<backend.indexOf("deleteUser(user.id)"),"Child identity deletion must be checked before parent identity removal");
 assert.match(sql,/grant execute on function public\.star_family_account_deletion_plan\(uuid\) to service_role/);
 assert.match(sql,/revoke all on function public\.star_family_account_deletion_cleanup\(uuid\) from public,anon,authenticated/);
 assert.match(sql,/child login is shared/i,"Shared child logins must be protected");
 assert.match(sql,/guardian_id<>p_guardian/);
}
function harness(props){
 const states=[];let index=0;let tree;
 const react={useState(initial){const i=index++;if(!(i in states))states[i]=typeof initial==="function"?initial():initial;return[states[i],v=>{states[i]=typeof v==="function"?v(states[i]):v;}] }};
 const exports={};
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require(name){
  if(name==="react")return react;
  if(name==="react/jsx-runtime")return require(name);
  if(name.endsWith(".css"))return {};
  throw Error("Unexpected dependency "+name);
 },window:{location:{replace:props.navigate}},Error,Map,Set,Promise});
 function render(){index=0;tree=exports.ParentAccountDeletion(props);return tree}
 render();return{render,get tree(){return tree}};
}
function nodes(v){if(!v||typeof v!=="object")return[];if(Array.isArray(v))return v.flatMap(nodes);return[v,...nodes(v.props?.children)]}
function words(v){if(v===null||v===undefined||typeof v==="boolean")return"";if(typeof v!=="object")return String(v);if(Array.isArray(v))return v.map(words).join(" ");return words(v.props?.children)}
function element(h,fn){const x=nodes(h.tree).find(fn);assert(x,"Missing required UI element");return x}
function input(h,label,value){const lab=element(h,n=>n.type==="label"&&words(n).startsWith(label));const control=nodes(lab).find(n=>n.type==="input");assert(control);control.props.onChange({target:{value}});h.render();}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 checkContract();
 let deleted=false,navigated="",signedOut=false;const calls=[];
 const supabase={functions:{async invoke(name,{body}){calls.push({name,body});return{data:body.action==="preview"?{ok:true,child_count:2,linked_player_count:2}:{ok:true,deleted:true},error:null};}},
  auth:{async signOut(){signedOut=true;return{error:null};}}};
 const h=harness({supabase,user:{id:"parent-test",email:"parent@test.invalid"},navigate:u=>{navigated=u}});
 const open=element(h,n=>n.type==="button"&&words(n)==="Delete account…");
 open.props.onClick();await settle();h.render();
 assert.match(words(h.tree),/Connected child logins to delete: 2/);
 input(h,"Confirm your sign-in email","parent@test.invalid");
 input(h,"Current password","correct-password");
 input(h,"Type DELETE to confirm","DELETE");
 const button=element(h,n=>n.type==="button"&&words(n)==="Permanently delete my account");
 assert.equal(button.props.disabled,false);
 await element(h,n=>n.type==="form").props.onSubmit({preventDefault(){}});
 await settle();h.render();
 assert.equal(calls.length,2);assert.equal(calls[0].body.action,"preview");assert.equal(calls[1].body.action,"delete");
 assert.equal(calls[1].body.confirm_email,"parent@test.invalid");
 assert.equal(calls[1].body.confirmation,"DELETE");
 assert.equal(signedOut,true);assert.equal(navigated,"/parent-portal?deleted=1");
 // Backend rejection must not be represented as success.
 const fail=harness({supabase:{functions:{async invoke(){return{data:{ok:false,error:"A child account is shared."},error:null};}}},user:{id:"parent-test",email:"parent@test.invalid"},navigate:()=>{deleted=true;}});
 element(fail,n=>n.type==="button"&&words(n)==="Delete account…").props.onClick();
 await settle();fail.render();
 assert.match(words(fail.tree),/child account is shared/i);
 assert.equal(nodes(fail.tree).filter(n=>n.type==="form").length,0);
 assert.equal(deleted,false);
 console.log("PASS: family deletion confirmation, child-impact preview, rejection handling and privileged backend contract.");
})().catch(e=>{console.error(e);process.exitCode=1;});