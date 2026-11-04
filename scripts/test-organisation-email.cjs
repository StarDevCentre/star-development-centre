const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=ts.transpileModule(fs.readFileSync('lib/organisationEmailWorker.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exp={};vm.runInNewContext(source,{exports:exp,AbortSignal,setTimeout,fetch,Date});
(async()=>{
 let cases=0;
 for(const audience of ['organisation','staff'])for(const mode of ['sent','retry429','retry500','invalid400','network','noReceipt','skip']){
  const calls=[];let email,headers;
  const rpc=async(action,data)=>{calls.push([action,data]);return action==='claim'?[{id:'synthetic-job',claim_token:'synthetic-lease'}]:action==='check'?(mode==='skip'?null:{email:'synthetic@example.invalid',audience,thread_id:'private-thread'}):{ok:true}};
  await exp.deliverOrganisationAlerts({rpc,apiKey:'fake',from:'STAR <synthetic@example.invalid>',pause:async()=>{},fetcher:async(url,options)=>{
   email=JSON.parse(options.body);headers=options.headers;
   assert.equal(url,'https://api.resend.com/emails');assert.equal(options.redirect,'error');
   assert.equal(headers['Idempotency-Key'],'organisation-alert/synthetic-job');assert(!options.body.includes('private-thread'));
   if(mode==='network')throw Error('offline');
   return {ok:mode==='sent'||mode==='noReceipt',status:mode==='retry429'?429:mode==='retry500'?500:400,json:async()=>mode==='noReceipt'?{}:{id:'receipt'}};
  }});
  if(mode==='skip'){assert(!email);assert(!calls.some(c=>c[0]==='finish'));cases++;continue}
  const finished=calls.find(c=>c[0]==='finish')[1];assert.equal(finished.status,mode==='sent'?'sent':mode==='invalid400'?'failed':'retry');
  assert.equal(finished.claim_token,'synthetic-lease');assert.equal(finished.provider_id,mode==='sent'?'receipt':undefined);
  assert(email.text.includes(audience==='staff'?'staff?inbox=organisations#communications':'school-club-portal?inbox=1'));
  assert.deepEqual(email.to,['synthetic@example.invalid']);assert(!email.text.includes('Player Name'));cases++;
 }
 console.log(`${cases} organisation email delivery cases passed; mocked provider only.`);
})().catch(e=>{console.error(e);process.exitCode=1});
