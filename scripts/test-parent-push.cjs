// Exercise the deployed worker source with real Web Push encryption and mocked
// network/database boundaries. No subscription or credential leaves this process.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ts=require('typescript');
const webpush=require('web-push');
const source=fs.readFileSync('supabase/functions/parent-push-worker/index.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const signing=webpush.generateVAPIDKeys();
const receiver=crypto.createECDH('prime256v1');receiver.generateKeys();
const job={id:1,claim_token:crypto.randomUUID(),notification_id:crypto.randomUUID(),endpoint:'https://fcm.googleapis.com/fcm/send/synthetic-fixture',p256dh:receiver.getPublicKey().toString('base64url'),auth:crypto.randomBytes(16).toString('base64url'),category:'message'};
function worker({jobs=[job],status=201,access=true,networkError=false,configError=false,claimError=false}={}){
 let handler;const calls=[],requests=[],finished=[];
 const db={rpc:async(name,args)=>{
  calls.push(name);
  if(name==='player_push_worker_config')return{data:{publicKey:signing.publicKey,privateKey:signing.privateKey,workerSecret:'synthetic-scheduler-secret'},error:configError?{}:null};
  if(name==='claim_parent_push_deliveries')return{data:jobs,error:claimError?{}:null};
  if(name==='check_parent_push_delivery')return{data:access,error:null};
  if(name==='finish_parent_push_delivery'){finished.push(args);return{error:null};}
  throw new Error(`Unexpected RPC ${name}`);
 }};
 vm.runInNewContext(compiled,{exports:{},require:name=>name.startsWith('npm:web-push')?webpush:{createClient:()=>db},
  Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},Response,TextEncoder,AbortSignal,
  fetch:async(url,options)=>{requests.push({url,options});if(networkError)throw new Error('Synthetic timeout');return new Response('',{status});}
 });
 return{run:(secret='synthetic-scheduler-secret',method='POST')=>handler(new Request('https://example.invalid/worker',{method,headers:secret?{'x-star-worker-secret':secret}:{}})),calls,requests,finished};
}
(async()=>{
 for(const secret of ['', 'wrong-secret']){const h=worker();assert.equal((await h.run(secret)).status,401);assert.equal(h.requests.length,0);assert(!h.calls.includes('claim_parent_push_deliveries'));}
 assert.equal((await worker().run('synthetic-scheduler-secret','GET')).status,405);
 assert.equal((await worker({configError:true}).run()).status,503);
 assert.equal((await worker({claimError:true}).run()).status,503);
 const success=worker();const response=await success.run();assert.equal(response.status,200);assert.equal((await response.json()).sent,1);
 assert.equal(success.finished[0].outcome,'sent');assert.equal(success.requests[0].options.redirect,'error');
 const headers=success.requests[0].options.headers;
 assert.equal(headers['Content-Encoding'],'aes128gcm');assert.match(headers.Authorization,/^vapid /);
 const wire=Buffer.from(success.requests[0].options.body);
 assert(wire.length>100);assert(!wire.includes(Buffer.from('You have a new message from STAR.')));
 for(const [status,outcome] of [[404,'gone'],[410,'gone'],[429,'retry'],[503,'retry'],[400,'failed']]){const h=worker({status});await h.run();assert.equal(h.finished[0].outcome,outcome);assert.equal(h.finished[0].http_status,status);}
 const retry=worker({networkError:true});await retry.run();assert.equal(retry.finished[0].outcome,'retry');
 const revoked=worker({access:false});await revoked.run();assert.equal(revoked.requests.length,0);assert.equal(revoked.finished[0].outcome,'skipped');
 for(const endpoint of ['https://127.0.0.1/private','https://fcm.googleapis.com.evil.invalid/send/test','https://fcm.googleapis.com:443/send/test','https://user:pass@fcm.googleapis.com/send/test']){const h=worker({jobs:[{...job,endpoint}]});await h.run();assert.equal(h.requests.length,0);assert.equal(h.finished[0].outcome,'failed');}
 const empty=worker({jobs:[]});const none=await empty.run();assert.equal((await none.json()).claimed,0);assert.equal(empty.requests.length,0);
 console.log('PASS: worker authentication, encrypted VAPID transport, redirect/endpoint guards, access revocation, empty queue, success, expiry and retry outcomes.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
