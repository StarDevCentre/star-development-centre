const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync('supabase/functions/organisation-invitation/index.ts','utf8').replace(/^import .*;\n/,'');
function setup(options={}){
 const calls=[];let handler;
 const result=options.invitation||{id:'member-id',attempt_id:'attempt-id',email:'teacher@example.invalid',existing_account:false};
 const caller={auth:{getUser:async()=>options.authFailure?{data:{user:null},error:{}}:{data:{user:{id:'manager-id'}},error:null}},rpc:async(name,args)=>{calls.push({name,args});return {data:result,error:options.prepareFailure?{message:'STAR management access required.'}:null}}};
 const admin={auth:{admin:{inviteUserByEmail:async(email,args)=>{calls.push({name:'invite',email,args});return {error:options.sendFailure||null}}},signInWithOtp:async(args)=>{calls.push({name:'otp',args});return {error:options.otpFailure||null}}},rpc:async(name,args)=>{calls.push({name,args});return {error:null}}};
 const context={createClient:(_url,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:caller,Deno:{env:{get:k=>k},serve:fn=>{handler=fn}},Request,Response,console};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,context);
 return {calls,request:async(body={},authorization='Bearer synthetic-token',method='POST')=>handler(new Request('https://example.invalid',{method,headers:{'Content-Type':'application/json',...(authorization?{Authorization:authorization}:{})},...(method==='POST'?{body:JSON.stringify({name:'Teacher',email:'teacher@example.invalid',organisation_id:'12345678-1234-1234-1234-123456789012',...body})}:{})}))};
}
test('missing or invalid authentication cannot prepare or send',async()=>{
 for(const [options,authorization] of [[{},''],[{authFailure:true},'Bearer invalid']]){
  const s=setup(options);assert.equal((await s.request({},authorization)).status,401);assert.equal(s.calls.length,0);
 }
});
test('unapproved users cannot send invitations',async()=>{
 const s=setup({prepareFailure:true});assert.equal((await s.request()).status,400);assert.equal(s.calls.length,1);
});
test('new invitations use native email verification and password setup',async()=>{
 const s=setup();const response=await s.request();assert.equal(response.status,200);
 const send=s.calls.find(c=>c.name==='invite');assert.equal(send.args.data.organisation_password_setup,true);assert.match(send.args.redirectTo,/school-club-portal\?mode=activate$/);
 assert.equal(s.calls.at(-1).args.p_sent,true);const body=await response.json();assert.equal(body.ok,true);assert.equal('access_token' in body,false);
});
test('existing accounts receive sign-in without changing their password',async()=>{
 const s=setup({invitation:{id:'member-id',attempt_id:'attempt-id',email:'teacher@example.invalid',existing_account:true}});
 assert.equal((await s.request()).status,200);assert.equal(s.calls.some(c=>c.name==='invite'),false);
 const send=s.calls.find(c=>c.name==='otp');assert.equal(send.args.options.shouldCreateUser,false);assert.match(send.args.options.emailRedirectTo,/mode=login$/);assert.equal('password' in send.args,false);
});
test('delivery failures and rate limits never report success',async()=>{
 for(const [failure,status] of [[{code:'smtp_error',status:500},502],[{code:'over_email_send_rate_limit',status:429},429]]){
  const s=setup({sendFailure:failure});const response=await s.request();assert.equal(response.status,status);assert.equal((await response.json()).ok,undefined);assert.equal(s.calls.at(-1).args.p_sent,false);
 }
});
test('an account created during invitation preparation safely falls back to sign-in',async()=>{
 const s=setup({sendFailure:{code:'email_exists'}});assert.equal((await s.request()).status,200);assert.equal(s.calls.filter(c=>c.name==='otp').length,1);assert.equal(s.calls.at(-1).args.p_sent,true);
});
test('bad methods and malformed details do not send email',async()=>{
 const s=setup();assert.equal((await s.request({},'', 'GET')).status,405);
 assert.equal((await s.request({email:42})).status,400);assert.equal(s.calls.length,0);
});
