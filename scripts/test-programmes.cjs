const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function compile(filename, override) {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod = new Module(filename,module);mod.filename=filename;mod.paths=module.paths;
  const original=mod.require.bind(mod);
  if(override)mod.require=id=>id==='@supabase/supabase-js'?override:original(id);
  mod._compile(code,filename);return mod.exports;
}
require.extensions['.ts']=(mod,filename)=>{mod.exports=compile(filename)};
const {findProgrammeMatches,groupSessions,programmeEnquiryHref,programmeSignInReturn}=require('../lib/programmeOptions.ts');
const {programmeForAge}=require('../lib/siteData.ts');
test('finder keeps group requests within group provision at every supported age',()=>{
  for(let age=5;age<=18;age++) {
    const matches=findProgrammeMatches(age,'group');
    assert.deepEqual(matches.map(p=>p.slug),age<=10?['sparks']:age<=16?['development']:[]);
    const groups=groupSessions.filter(g=>age>=g.minAge&&age<=g.maxAge);
    assert.equal(groups.length,age<=16?1:0);
  }
});
test('individual goals lead with One to One Coaching when eligible; all suggestions respect age limits',()=>{
  for(let age=5;age<=18;age++) {
    const individual=findProgrammeMatches(age,'individual');
    assert.deepEqual(individual.map(p=>p.slug),age>=11?['one-to-one','prestige']:age>=7?['flyers']:[]);
    for(const goal of ['start','group','individual','match']) {
      const matches=findProgrammeMatches(age,goal);
      assert.equal(new Set(matches.map(p=>p.slug)).size,matches.length);
      for(const p of matches){assert.ok(programmeForAge(p.slug,age));assert.ok(p.reason.length>20)}
    }
  }
  for(const age of [4,19,NaN,10.5])assert.equal(findProgrammeMatches(age,'individual').length,0);
  assert.equal(findProgrammeMatches(13,'match')[0].slug,'season-support');
});
test('programme enquiries preserve valid selection and age without trusting arbitrary query values',()=>{
  assert.equal(programmeEnquiryHref('one-to-one',14),'/contact?programme=one-to-one&age=14');
  assert.equal(programmeEnquiryHref('flyers',8),'/contact?programme=flyers&age=8');
  assert.equal(programmeEnquiryHref('unrecognised',99),'/contact');
  assert.equal(programmeEnquiryHref('sparks',6,'sparks-5-7'),'/contact?programme=sparks&age=6&session=sparks-5-7');
  assert.equal(programmeEnquiryHref('prestige',14,'sparks-5-7'),'/contact?programme=prestige&age=14');
});
const route=path.resolve('app/api/programme-prices/route.ts');
function request(token){return new Request('https://star.example/api/programme-prices',{headers:token?{Authorization:token}:{}})}
async function withConfig(run) {
  const previous=[process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY];
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-only';
  try{await run()}finally{for(const [i,key]of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'].entries()){if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i]}}
}
test('pricing rejects missing, malformed, invalid and anonymous authentication with no price data',async()=>{
  await withConfig(async()=>{
    let authCalls=0;
    for(const result of [{data:{user:null},error:Error('Invalid token')},{data:{user:{id:'anonymous',is_anonymous:true}},error:null}]) {
      const get=compile(route,{createClient:()=>({auth:{getUser:async()=>{authCalls++;return result}}})}).GET;
      for(const token of [undefined,'Basic test','Bearer ']){const response=await get(request(token));assert.equal(response.status,401);assert.equal((await response.json()).prices,undefined)}
      const response=await get(request('Bearer invalid-token'));assert.equal(response.status,401);assert.equal((await response.json()).prices,undefined);
      assert.match(response.headers.get('Cache-Control'),/private.*no-store/);assert.equal(response.headers.get('Vary'),'Authorization');
    }
    assert.equal(authCalls,2);
  });
});
test('a validated sign-in can read prices without registering or accessing family records',async()=>{
  await withConfig(async()=>{
    const get=compile(route,{createClient:(_url,_key,options)=>{
      assert.equal(options.global.headers.Authorization,'Bearer signed-in-token');
      return {auth:{getUser:async token=>{assert.equal(token,'signed-in-token');return {data:{user:{id:'signed-in-user',is_anonymous:false}},error:null}}},from:()=>{throw Error('Family records must not be queried to view pricing')}};
    }}).GET;
    const response=await get(request('Bearer signed-in-token'));assert.equal(response.status,200);
    const {prices}=await response.json();assert.equal(prices.length,6);
    assert.equal(prices.find(p=>p.slug==='one-to-one').title,'One to One Coaching');
    assert.equal(prices.find(p=>p.slug==='one-to-one').price,'£40');
    assert.equal(prices.find(p=>p.slug==='flyers').price,'£375');
    assert.ok(prices.find(p=>p.slug==='prestige').options.includes('3 × £280 — £840 total.'));
    assert.match(response.headers.get('Cache-Control'),/private.*no-store/);
    assert.ok(prices.every(p=>Object.keys(p).sort().join(',')==='options,price,slug,title,unit'));
  });
});
test('missing configuration and auth-service failure fail closed',async()=>{
  await withConfig(async()=>{
    const get=compile(route,{createClient:()=>{throw Error('Auth service unavailable')}}).GET;
    let response=await get(request('Bearer test'));assert.equal(response.status,503);assert.equal((await response.json()).prices,undefined);
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    response=await get(request('Bearer test'));assert.equal(response.status,503);assert.equal((await response.json()).prices,undefined);
  });
});

test('pricing sign-in returns are limited to the two supported local pages',()=>{
  assert.equal(programmeSignInReturn('programmes'),'/programmes#compare');
  assert.equal(programmeSignInReturn('finder'),'/find-your-programme');
  for(const value of ['https://untrusted.example','//untrusted.example','javascript:alert(1)','/staff-portal',null,undefined])assert.equal(programmeSignInReturn(value),undefined);
});
