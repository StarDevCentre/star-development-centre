const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const {NextRequest} = require('next/server');
function compile(filename) {
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(code,filename);return mod.exports;
}
require.extensions['.ts']=(mod,filename)=>{mod.exports=compile(filename)};
const {initialEnquirySelection,enquiryText,enquiryWasReceived,enquiryResponseTime}=require('../lib/enquiries.ts');
const {POST}=require('../app/api/enquiry/route.ts');
const valid={mode:'general',name:'Example Parent',email:'parent@example.com',phone:'07700 900123',age:'6',programme:'sparks',session:'sparks-5-7',message:'Please tell me about this group.',consent:true,website:''};
function request(data=valid,origin='https://star.example',extra={}){return new NextRequest('https://star.example/api/enquiry',{method:'POST',headers:{origin,'content-type':'application/json',...extra},body:JSON.stringify(data)})}
async function configured(run) {
 const keys=['STAR_ENQUIRY_ENABLED','RESEND_API_KEY','STAR_ENQUIRY_FROM'];const before=keys.map(k=>process.env[k]);const fetch=global.fetch;
 Object.assign(process.env,{STAR_ENQUIRY_ENABLED:'true',RESEND_API_KEY:'test-only',STAR_ENQUIRY_FROM:'test@example.com'});
 try{await run()}finally{global.fetch=fetch;keys.forEach((key,i)=>{if(before[i]===undefined)delete process.env[key];else process.env[key]=before[i]})}
}
test('programme and age-group choices survive the enquiry link and can be safely edited',()=>{
 assert.deepEqual(initialEnquirySelection(new URLSearchParams('programme=sparks&age=6&session=sparks-5-7')),{programme:'sparks',age:'6',session:'sparks-5-7'});
 assert.deepEqual(initialEnquirySelection(new URLSearchParams('programme=prestige&age=14&session=sparks-5-7')),{programme:'prestige',age:'14',session:''});
 assert.deepEqual(initialEnquirySelection(new URLSearchParams('programme=unknown&age=99&session=unknown')),{programme:'',age:'',session:''});
 assert.equal(initialEnquirySelection(new URLSearchParams('programme=sparks&age=9&session=sparks-5-7')).session,'');
 const text=enquiryText(valid);assert.match(text,/STAR Sparks/);assert.match(text,/Group: Ages 5–7 · Monday · 3:45–4:45pm/);assert.match(text,/Player age: 6/);
 assert.match(enquiryText({...valid,programme:'one-to-one',session:''}),/One to One Coaching/);
 assert.equal(enquiryResponseTime,'We normally reply within 12 hours, but please allow up to 48 hours.');
});
test('only an explicit successful receipt allows the client to show received',()=>{
 assert.equal(enquiryWasReceived(true,{ok:true}),true);
 for(const [ok,body] of [[false,{ok:true}],[true,{ok:false}],[true,{}],[true,null],[true,'ok'],[true,{ok:'true'}]])assert.equal(enquiryWasReceived(ok,body),false);
});
test('disabled or unconfigured delivery never sends or reports success',async()=>{
 await configured(async()=>{
  let calls=0;global.fetch=async()=>{calls++;throw Error('Must not send')};
  process.env.STAR_ENQUIRY_ENABLED='false';let r=await POST(request());assert.equal(r.status,503);assert.equal((await r.json()).ok,undefined);
  process.env.STAR_ENQUIRY_ENABLED='true';delete process.env.RESEND_API_KEY;r=await POST(request());assert.equal(r.status,503);assert.equal((await r.json()).ok,undefined);
  assert.equal(calls,0);
 });
});
test('invalid fields, consent, requests and honeypot submissions do not reach the email provider',async()=>{
 await configured(async()=>{
  let calls=0;global.fetch=async()=>{calls++;throw Error('Must not send')};
  for(const patch of [{name:'A'},{email:'invalid'},{consent:false},{age:'19'},{age:'6.5'},{programme:'unknown'},{session:'unknown'},{programme:'prestige',session:'sparks-5-7'},{name:'A\nB'},{phone:'x'.repeat(41)},{message:'x'.repeat(1001)},{website:'spam.example'}])assert.equal((await POST(request({...valid,...patch}))).status,400);
  assert.equal((await POST(request(valid,'https://untrusted.example'))).status,403);
  assert.equal((await POST(request(valid,'https://star.example',{'content-type':'text/plain'}))).status,415);
  assert.equal((await POST(request({...valid,message:'x'.repeat(13000)}))).status,413);
  const malformed=new NextRequest('https://star.example/api/enquiry',{method:'POST',headers:{'content-type':'application/json'},body:'{'});assert.equal((await POST(malformed)).status,400);
  assert.equal(calls,0);
 });
});
test('provider errors, timeouts and missing receipt IDs never produce a success response',async()=>{
 await configured(async()=>{
  for(const send of [async()=>new Response('{}',{status:403}),async()=>Response.json({}),async()=>Response.json({id:''}),async()=>Response.json({id:123}),async()=>{throw Error('Timeout')},async()=>new Response('invalid json')]){
   global.fetch=send;const response=await POST(request());assert.equal(response.status,502);assert.notEqual((await response.json()).ok,true);assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
 });
});
test('confirmed enquiries use the fixed STAR address and retain the selected group details',async()=>{
 await configured(async()=>{
  let calls=0;global.fetch=async(url,options)=>{
   calls++;assert.equal(url,'https://api.resend.com/emails');assert.ok(options.signal);
   const body=JSON.parse(options.body);assert.deepEqual(body.to,['coachdmp7@gmail.com']);assert.equal(body.reply_to,valid.email);assert.match(body.text,/STAR Sparks/);assert.match(body.text,/Group: Ages 5–7 · Monday · 3:45–4:45pm/);assert.match(body.text,/Consent to contact: Yes/);
   return Response.json({id:'mock-receipt'});
  };
  const response=await POST(request({...valid,to:'attacker@example.com'}));assert.equal(response.status,200);assert.equal(enquiryWasReceived(response.ok,await response.json()),true);assert.equal(calls,1);assert.equal(response.headers.get('Cache-Control'),'no-store');
 });
});

