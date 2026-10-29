const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const {NextRequest} = require('next/server');
const source = path.resolve('app/api/staplegrove-referral/route.ts');
function handler() {
  const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const mod = new Module(source, module); mod.filename = source; mod.paths = module.paths;
  mod._compile(code, source);
  return mod.exports.POST;
}
const valid = {name:'Test Player', age:'15', email:'player@example.com', phone:'07700 900123', consent:true, website:''};
function request(data = valid, origin = 'https://star-development-centre.vercel.app') {
  return new NextRequest('https://star-development-centre.vercel.app/api/staplegrove-referral', {method:'POST', headers:{origin,'content-type':'application/json','x-forwarded-for':'192.0.2.1'}, body:JSON.stringify(data)});
}
test('referrals enforce age, consent, contact validation and same-origin requests before delivery', async()=>{
  const post=handler(); let calls=0;
  const original=global.fetch; global.fetch=async()=>{calls++;throw Error('Unexpected provider call')};
  try {
    for(const changes of [{age:'14'},{age:'15.5'},{age:'150'},{email:'invalid'},{phone:'abc1234567'},{consent:false},{name:'A\nB'},{website:'spam'}]) assert.equal((await post(request({...valid,...changes}))).status,400);
    assert.equal((await post(request(valid,'https://untrusted.example'))).status,403);
    assert.equal((await post(request({...valid,name:'x'.repeat(5000)}))).status,413);
    assert.equal(calls,0);
  } finally {global.fetch=original;}
});
test('missing configuration and provider failures never report success',async()=>{
  const key=process.env.RESEND_API_KEY,from=process.env.STAR_ENQUIRY_FROM,original=global.fetch;
  try {
    delete process.env.RESEND_API_KEY;delete process.env.STAR_ENQUIRY_FROM;
    let result=await handler()(request());assert.equal(result.status,503);assert.notEqual((await result.json()).ok,true);
    process.env.RESEND_API_KEY='test-only';process.env.STAR_ENQUIRY_FROM='test@example.com';
    global.fetch=async()=>new Response('{}',{status:403});
    result=await handler()(request());assert.equal(result.status,502);assert.notEqual((await result.json()).ok,true);
    global.fetch=async()=>new Response('{}',{status:200});
    assert.equal((await handler()(request())).status,502);
  } finally {global.fetch=original; if(key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=key;if(from===undefined)delete process.env.STAR_ENQUIRY_FROM;else process.env.STAR_ENQUIRY_FROM=from;}
});
test('accepted referrals send only to the fixed club recipient and repeated submissions are limited',async()=>{
  const key=process.env.RESEND_API_KEY,from=process.env.STAR_ENQUIRY_FROM,original=global.fetch;let calls=0;
  try {
    process.env.RESEND_API_KEY='test-only';process.env.STAR_ENQUIRY_FROM='test@example.com';
    global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');const mail=JSON.parse(options.body);assert.deepEqual(mail.to,['staplegroveladiesfootballclub@gmail.com']);assert.equal(mail.reply_to,valid.email);for(const detail of [valid.name,valid.age,valid.phone,valid.email])assert.ok(mail.text.includes(detail));return Response.json({id:'mock-email-id'});};
    const post=handler();
    for(let i=0;i<4;i++){const result=await post(request({...valid,to:'attacker@example.com'}));assert.equal(result.status,200);assert.equal((await result.json()).ok,true);}
    assert.equal((await post(request())).status,429);assert.equal(calls,4);
  } finally {global.fetch=original;if(key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=key;if(from===undefined)delete process.env.STAR_ENQUIRY_FROM;else process.env.STAR_ENQUIRY_FROM=from;}
});
