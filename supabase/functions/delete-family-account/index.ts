import {createClient} from "npm:@supabase/supabase-js@2.76.1";

// Deletion is a two-stage action: show the family impact, then require a freshly
// verified password and explicit confirmation. Only this server has the admin key.
const headers={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Content-Type":"application/json",
 "Cache-Control":"no-store",
};
const reply=(status:number,value:Record<string,unknown>)=>
 new Response(JSON.stringify(value),{status,headers});

type Plan={child_ids:string[];child_count:number;linked_player_count:number;files:{bucket:string;name:string}[]};

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply(405,{ok:false,error:"Method not allowed."});
 const bearer=req.headers.get("Authorization")||"";
 if(!bearer.startsWith("Bearer ")||bearer.length>4096)return reply(401,{ok:false,error:"Sign in to your parent account first."});
 if(Number(req.headers.get("content-length")||0)>4096)return reply(413,{ok:false,error:"Request is too large."});
 const url=Deno.env.get("SUPABASE_URL"),publicKey=Deno.env.get("SUPABASE_ANON_KEY"),adminKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!publicKey||!adminKey)return reply(503,{ok:false,error:"Account deletion is temporarily unavailable. Please contact STAR."});
 try{
  const body=await req.json();
  if(!body||typeof body!=="object"||!["preview","delete"].includes(body.action))return reply(400,{ok:false,error:"Invalid account deletion request."});
  const caller=createClient(url,publicKey,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await caller.auth.getUser();
  if(userError||!user||user.is_anonymous||!user.email)return reply(401,{ok:false,error:"Sign in again before continuing."});
  const admin=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:rawPlan,error:planError}=await admin.rpc("star_family_account_deletion_plan",{p_guardian:user.id});
  if(planError){
   const message=planError.message||"";
   return reply(409,{ok:false,error:/child login is shared|linked child login has another/i.test(message)
    ?"A child account is shared or has another account role. Please contact STAR to remove it safely."
    :/staff or organisation/i.test(message)?"This login is also used for staff or organisation access. Contact STAR to arrange deletion."
    :"We could not verify your family accounts. Please contact STAR."});
  }
  const plan=rawPlan as Plan;
  if(!Array.isArray(plan?.child_ids)||!Array.isArray(plan.files))return reply(503,{ok:false,error:"Deletion checks are unavailable."});
  if(body.action==="preview"){
   return reply(200,{ok:true,child_count:plan.child_count||0,linked_player_count:plan.linked_player_count||0});
  }
  if(typeof body.password!=="string"||body.password.length<1||body.password.length>1024||
     body.confirmation!=="DELETE"||typeof body.confirm_email!=="string"||
     body.confirm_email.trim().toLowerCase()!==user.email.toLowerCase()){
   return reply(400,{ok:false,error:"Enter your sign-in email, password and DELETE to confirm."});
  }
  // A valid session by itself is not sufficient for this irreversible action.
  const passwordClient=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:verified,error:passwordError}=await passwordClient.auth.signInWithPassword({email:user.email,password:body.password});
  if(passwordError||verified.user?.id!==user.id)return reply(403,{ok:false,error:"Password could not be verified. Nothing has been deleted."});

  // If a child account was linked or shared while the parent entered their
  // password, abort before removing any files or records.
  const {data:latest,error:latestError}=await admin.rpc("star_family_account_deletion_plan",{p_guardian:user.id});
  if(latestError||!Array.isArray(latest?.child_ids))
   return reply(409,{ok:false,error:"Family links changed or could not be checked. Start the deletion review again."});
  const ids=(v:unknown[])=>JSON.stringify([...new Set(v)].sort());
  if(ids(latest.child_ids)!==ids(plan.child_ids))
   return reply(409,{ok:false,error:"The linked child accounts changed. Review the account deletion details again."});

  // Remove account-owned objects before deleting Auth identities: Supabase Auth
  // refuses to delete accounts while they still own Storage objects.
  const groups=new Map<string,string[]>();
  for(const file of plan.files){
   if(!file||typeof file.bucket!=="string"||typeof file.name!=="string")return reply(503,{ok:false,error:"Account files could not be verified."});
   groups.set(file.bucket,[...(groups.get(file.bucket)||[]),file.name]);
  }
  for(const [bucket,names] of groups){
   for(let i=0;i<names.length;i+=100){
    const {error}=await admin.storage.from(bucket).remove(names.slice(i,i+100));
    if(error)return reply(503,{ok:false,error:"A saved file could not be removed. No account logins have been deleted; contact STAR for help."});
   }
  }
  // This RPC rechecks shared identities in one database transaction and detaches
  // remaining references. It must be executed with the service role only.
  const {data:cleaned,error:cleanupError}=await admin.rpc("star_family_account_deletion_cleanup",{p_guardian:user.id});
  if(cleanupError||!Array.isArray(cleaned?.child_ids)){
   return reply(503,{ok:false,error:"We could not safely finish the data cleanup. Your login remains active. Contact STAR for help."});
  }
  // Irreversible soft deletion closes the login while retaining anonymised Auth IDs
  // needed by STAR's non-null historical coaching and safeguarding audit fields.
  for(const childId of cleaned.child_ids as string[]){
   const {error}=await admin.auth.admin.deleteUser(childId,true);
   if(error)return reply(503,{ok:false,error:"Some child account deletion steps could not be completed. Please contact STAR before retrying."});
  }
  const {error:parentError}=await admin.auth.admin.deleteUser(user.id,true);
  if(parentError)return reply(503,{ok:false,error:"Your parent login could not be removed. Please contact STAR so we can complete the request."});
  return reply(200,{ok:true,deleted:true});
 }catch{
  return reply(500,{ok:false,error:"Account deletion could not be completed. Please contact STAR."});
 }
});