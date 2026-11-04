type Job={id:string;claim_token:string};
type Recipient={email:string;audience:string;thread_id:string};
type Dependencies={rpc:(action:string,data?:Record<string,unknown>)=>Promise<unknown>;apiKey:string;from:string;fetcher?:typeof fetch;pause?:(ms:number)=>Promise<void>};
export async function deliverOrganisationAlerts({rpc,apiKey,from,fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}:Dependencies){
 const jobs=await rpc('claim') as Job[];let sent=0,skipped=0,retried=0;
 const deadline=Date.now()+45000;
 for(const job of jobs){
  if(Date.now()>deadline)break;
  const recipient=await rpc('check',job) as Recipient|null;if(!recipient){skipped++;continue}
  const portal=recipient.audience==='staff'?'https://starfootball.uk/staff?inbox=organisations#communications':'https://starfootball.uk/school-club-portal?inbox=1';
  let status='retry',providerId:string|undefined;
  try{const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`organisation-alert/${job.id}`},body:JSON.stringify({from,to:[recipient.email],subject:'New update in your STAR organisation inbox',text:`You have a new message or shared update in your STAR organisation inbox.\n\nSign in to read it and reply:\n${portal}\n\nFor privacy, player names and message contents are only shown inside the portal.\n\nSTAR Development Centre | Somerset`}),signal:AbortSignal.timeout(8000),redirect:'error'});
   if(response.ok){const result=await response.json();if(typeof result.id==='string'&&result.id){status='sent';providerId=result.id}}
   else if(response.status>=400&&response.status<500&&![408,409,425,429].includes(response.status))status='failed';
  }catch{/* Queue lease/retry keeps transient failures recoverable. */}
  await rpc('finish',{...job,status,provider_id:providerId});if(status==='sent')sent++;else retried++;
  // Resend's default rate is shared with other site mail; avoid a burst from this worker.
  await pause(600);
 }
 return {sent,skipped,retried};
}
