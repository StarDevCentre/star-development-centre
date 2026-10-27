const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
function compile(file,requireFn,env={}){
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:requireFn,process:{env},Response,Request,Date});
 return exports;
}
const {playerAge,programmeForAge}=compile('lib/siteData.ts',require);
const today=new Date('2026-10-27T12:00:00Z');
assert.equal(playerAge('2015-10-27',today),11);
assert.equal(playerAge('2015-10-28',today),10);
assert.equal(playerAge('2007-10-28',today),18);
assert(Number.isNaN(playerAge('2015-02-30',today)));
assert.equal(programmeForAge('prestige',10),false);
assert.equal(programmeForAge('development',17),false);
assert.equal(programmeForAge('flyers',7),true);
assert.equal(programmeForAge('sparks',4),false);

async function check({auth=true,anonymous=false,profile=true,registration=true,databaseError=false,throws=false,header='Bearer test-token',expected}){
 const calls=[];
 const createClient=(_url,_key,options)=>{
  assert.equal(options.global.headers.Authorization,header);
  return {auth:{getUser:async token=>{assert.equal(token,'test-token');if(throws)throw Error('offline');return {data:{user:auth?{id:'guardian-test',is_anonymous:anonymous}:null},error:auth?null:Error('invalid')};}},from(table){
   const filters=[];
   const query={select(columns){assert(['id','user_id'].includes(columns));return query;},eq(k,v){filters.push(['eq',k,v]);return query;},neq(k,v){filters.push(['neq',k,v]);return query;},not(k,op,v){filters.push(['not',k,op,v]);return query;},limit(){calls.push({table,filters});return Promise.resolve({data:(table==='guardian_profiles'?profile:registration)?[{id:'test'}]:[],error:databaseError?Error('unavailable'):null});}};
   return query;
  }};
 };
 const {GET}=compile('app/api/programme-prices/route.ts',()=>({createClient}),{NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'publishable-test'});
 const response=await GET(new Request('https://star.example/api/programme-prices',{headers:header?{Authorization:header}:{}}));
 assert.equal(response.status,expected);
 assert.match(response.headers.get('Cache-Control'),/private, no-store/);
 const body=await response.json();
 if(expected===200){
  assert.equal(body.prices.length,6);
  assert(body.prices.find(p=>p.slug==='prestige').options.some(o=>o.includes('£900 total')));
  assert(!JSON.stringify(body).includes('guardian-test'));
 }else assert(!('prices' in body));
 if(calls.length){
  assert(calls.every(c=>c.filters.some(f=>f[0]==='eq'&&f[2]==='guardian-test')));
  const filter=calls.find(c=>c.table==='player_registrations').filters;
  assert(filter.some(f=>f[0]==='neq'&&f[1]==='status'&&f[2]==='draft'));
  assert(filter.some(f=>f[0]==='not'&&f[1]==='submitted_at'&&f[2]==='is'&&f[3]===null));
 }
}
(async()=>{
 for(const c of [{header:'',expected:401},{header:'Basic wrong',expected:401},{auth:false,expected:401},{anonymous:true,expected:401},{profile:false,expected:403},{registration:false,expected:403},{databaseError:true,expected:503},{throws:true,expected:503},{expected:200}])await check(c);
 console.log('Passed: birthday boundaries, programme age rules, and 9 pricing access/error scenarios.');
})().catch(e=>{console.error(e);process.exitCode=1});
