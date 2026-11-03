import {createClient} from "npm:@supabase/supabase-js@2.76.1";

// JWT validation is performed with Auth.getUser below; no browser receives an admin key.
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return respond(405,{error:"Method not allowed."});
 const authorization=req.headers.get("Authorization")||"";
 if(!authorization.startsWith("Bearer "))return respond(401,{error:"Sign in to STAR management first."});
 const url=Deno.env.get("SUPABASE_URL")!;
 const caller=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const admin=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data:{user},error:authError}=await caller.auth.getUser();
  if(authError||!user)return respond(401,{error:"Your session has expired. Sign in again."});
  if(Number(req.headers.get("content-length")||0)>4096)return respond(413,{error:"Invitation details are too long."});
  const body=await req.json();
  if(typeof body.email!=="string"||body.email.length>254||typeof body.name!=="string"||body.name.length>100||typeof body.organisation_id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.organisation_id))return respond(400,{error:"Check the name, email and organisation."});
  const {data:invitation,error}=await caller.rpc("star_prepare_organisation_invitation",{p_data:{organisation_id:body.organisation_id,email:body.email,name:body.name}});
  if(error)return respond(400,{error:error.message});
  let sent=false;
  try{
   // Existing accounts retain their password; a one-time email link signs them in.
   // New accounts use Supabase's native invitation, which verifies mailbox possession.
   let result=invitation.existing_account
    ?await admin.auth.signInWithOtp({email:invitation.email,options:{shouldCreateUser:false,emailRedirectTo:"https://starfootball.uk/school-club-portal?mode=login"}})
    :await admin.auth.admin.inviteUserByEmail(invitation.email,{redirectTo:"https://starfootball.uk/school-club-portal?mode=activate",data:{organisation_password_setup:true}});
   // Account creation can race with an invite; never reset an existing account's password.
   if(result.error&&["email_exists","user_already_exists"].includes(result.error.code||"")){
    result=await admin.auth.signInWithOtp({email:invitation.email,options:{shouldCreateUser:false,emailRedirectTo:"https://starfootball.uk/school-club-portal?mode=login"}});
   }
   if(result.error){
    const limited=["over_email_send_rate_limit","over_request_rate_limit","email_send_rate_limit"].includes(result.error.code||"")||result.error.status===429;
    return respond(limited?429:502,{error:limited?"The email service needs a pause. Wait a minute, then resend the invitation.":"The invitation email could not be sent. Check the email address and try again. Access has not been accepted."});
   }
   sent=true;
   return respond(200,{ok:true,message:"Invitation email sent. Ask the staff member to check their inbox and junk folder."});
  }finally{
   const {error:recordError}=await admin.rpc("star_finish_organisation_invitation",{p_id:invitation.id,p_attempt:invitation.attempt_id,p_sent:sent});
   if(recordError)console.error("Organisation invitation status could not be recorded.");
  }
 }catch{return respond(500,{error:"We could not complete the invitation. Refresh its status before trying again."})}
});
