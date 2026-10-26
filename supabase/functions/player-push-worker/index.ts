import {createClient} from 'npm:@supabase/supabase-js@2.76.1';
import webpush from 'npm:web-push@3.6.7';

type Job={id:number;claim_token:string;endpoint:string;p256dh:string;auth:string;category:string;notification_id:string};
const endpointPattern=/^https:\/\/(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|([a-z0-9-]+\.)?push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)\/[^#\s]+$/;
const messages:Record<string,string>={message:'Your coach has an update for you.',practice:'Your practice plan has an update.',session:'Check your latest session details.',goal:'There’s an update to your goals.',badge:'There’s a new achievement to celebrate.',cosmetic:'You’ve unlocked something for your space.'};
function sameSecret(a:string,b:string){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let mismatch=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)mismatch|=(x[i]||0)^(y[i]||0);return mismatch===0;}
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});

Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const supplied=req.headers.get('x-star-worker-secret');
 if(!supplied||supplied.length>200)return json({error:'Unauthorized'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const config=await db.rpc('player_push_worker_config');
 if(config.error||!config.data)return json({error:'Worker unavailable'},503);
 if(!sameSecret(supplied,config.data.workerSecret))return json({error:'Unauthorized'},401);
 const claimed=await db.rpc('claim_player_push_deliveries',{batch_size:25});
 if(claimed.error)return json({error:'Could not claim deliveries'},503);
 const jobs=(claimed.data||[]) as Job[];
 let sent=0,failed=0;
 async function deliver(job:Job){
  let outcome='retry',status=0;
  try{
   const current=await db.rpc('check_player_push_delivery',{job_id:job.id,token:job.claim_token});
   if(current.error)throw new Error('Access check unavailable');
   if(!current.data)outcome='skipped';
   else if(!endpointPattern.test(job.endpoint)||job.endpoint.length>4096)outcome='failed';
   else{
    // Only generic, encrypted updates travel to a push provider. The player must
    // sign in to read details. Never log endpoints, keys, messages or payloads.
    const payload=JSON.stringify({title:'STAR Player Space',body:messages[job.category]||'There’s something new in your space.',tag:`star-${job.notification_id}`});
    const details=webpush.generateRequestDetails({endpoint:job.endpoint,keys:{p256dh:job.p256dh,auth:job.auth}},payload,{
     TTL:3600,urgency:'normal',contentEncoding:'aes128gcm',
     vapidDetails:{subject:'mailto:coachdmp7@gmail.com',publicKey:config.data.publicKey,privateKey:config.data.privateKey}
    });
    const response=await fetch(details.endpoint,{method:details.method,headers:details.headers,body:details.body,redirect:'error',signal:AbortSignal.timeout(8000)});
    status=response.status;
    outcome=response.ok?'sent':[404,410].includes(status)?'gone':status===429||status>=500?'retry':'failed';
    await response.body?.cancel();
   }
  }catch{outcome='retry';}
  const finished=await db.rpc('finish_player_push_delivery',{job_id:job.id,token:job.claim_token,outcome,http_status:status});
  if(outcome==='sent'&&!finished.error)sent++;else if(outcome!=='skipped'||finished.error)failed++;
 }
 for(let i=0;i<jobs.length;i+=5)await Promise.all(jobs.slice(i,i+5).map(deliver));
 return json({claimed:jobs.length,sent,failed});
});
