import {createClient} from "npm:@supabase/supabase-js@2.76.1";

// Public endpoint: no STAR account. Only this trusted server has the service role.
// Deploy with verify_jwt=false, configure allowed origin + Cloudflare Turnstile,
// and set STAR_FESTIVAL_BOOKINGS_OPEN=true only after venue/staffing approval.
const slug="christmas-football-festival-2026";
const eventDay="2026-12-21";
const capacity=36;
const earlyBirdLimit=12;
const bucket="star-festival-photos";
const origin=Deno.env.get("STAR_FESTIVAL_ALLOWED_ORIGIN")||"https://starfootball.uk";
const secret=Deno.env.get("STAR_FESTIVAL_TURNSTILE_SECRET")||"";
const isOpen=Deno.env.get("STAR_FESTIVAL_BOOKINGS_OPEN")==="true"&&Boolean(secret);
const headers={
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
 "Access-Control-Allow-Headers":"content-type,apikey,authorization,x-client-info",
 "Content-Type":"application/json",
 "Cache-Control":"no-store",
 "Vary":"Origin"
};
const answer=(status:number,body:Record<string,unknown>)=>
 new Response(JSON.stringify(body),{status,headers});
const read=(fd:FormData,key:string,max:number)=> {
 const value=fd.get(key);
 if(typeof value!=="string"||value.length>max)return null;
 const text=value.trim();
 return /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)?null:text;
};
const phoneOk=(s:string)=>/^[+0-9().\s-]{7,40}$/.test(s)&&s.replace(/\D/g,"").length>=7;
const ageAt=(dob:string):number|null=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob))return null;
 const date=new Date(dob+"T00:00:00Z");
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob)return null;
 const [year,month,day]=dob.split("-").map(Number);
 const age=2026-year-(month>12||(month===12&&day>21)?1:0);
 return age>=5&&age<=16?age:null;
};
const timeout=async(req:Request,limit:number)=>{
 if(!req.body)throw Error("empty");
 const reader=req.body.getReader(),chunks:Uint8Array[]=[];
 let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;
  total+=value.byteLength;
  if(total>limit){await reader.cancel();throw Error("large");}
  chunks.push(value);
 }
 const bytes=new Uint8Array(total);let offset=0;
 for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 return bytes;
};
type BookingRow={id:string;seat_number:number;status:string};
Deno.serve(async req=>{
 if(req.method==="OPTIONS"){
  return req.headers.get("origin")===origin?new Response(null,{status:204,headers}):answer(403,{error:"Origin not allowed."});
 }
 if(req.headers.get("origin")!==origin)return answer(403,{error:"Origin not allowed."});
 if(req.method!=="GET"&&req.method!=="POST")return answer(405,{error:"Method not allowed."});
 if(!isOpen)return answer(200,{open:false,message:"Bookings are not open yet."});
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)return answer(503,{open:false,error:"Booking service is unavailable."});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 if(req.method==="GET"){
  const {data,error}=await admin.from("star_festival_bookings").select("seat_number").eq("event_slug",slug).in("status",["pending","confirmed"]);
  if(error)return answer(503,{open:false,error:"Booking availability is temporarily unavailable."});
  const seats=new Set((data||[]).map((row:{seat_number:number})=>row.seat_number));
  return answer(200,{open:true,remaining:capacity-seats.size,earlyBirdRemaining:Array.from({length:earlyBirdLimit},(_,i)=>i+1).filter(n=>!seats.has(n)).length});
 }
 if(!req.headers.get("content-type")?.startsWith("multipart/form-data;"))return answer(415,{error:"Invalid request format."});
 let fd:FormData;
 try{
  const bytes=await timeout(req,1_800_000);
  fd=await new Response(bytes,{headers:{"content-type":req.headers.get("content-type")||""}}).formData();
 }catch{return answer(413,{error:"The form or photo is too large. Upload a smaller picture."});}
 if(read(fd,"website",180))return answer(400,{error:"Could not process the request."});
 const started=Number(read(fd,"startedAt",24)||0);
 if(!Number.isFinite(started)||Date.now()-started<2500||Date.now()-started>86_400_000)
  return answer(400,{error:"Please reload the form and try again."});
 const fields={
  guardian_first_name:read(fd,"guardianFirst",80),guardian_last_name:read(fd,"guardianLast",80),
  guardian_email:read(fd,"guardianEmail",254)?.toLowerCase(),guardian_phone:read(fd,"guardianPhone",40),
  guardian_relationship:read(fd,"guardianRelationship",80),
  player_first_name:read(fd,"playerFirst",80),player_last_name:read(fd,"playerLast",80),
  player_dob:read(fd,"playerDob",10),player_club:read(fd,"playerClub",120),
  emergency_name:read(fd,"emergencyName",160),emergency_relationship:read(fd,"emergencyRelationship",80),
  emergency_phone:read(fd,"emergencyPhone",40),
  medical_status:read(fd,"medicalStatus",20),
  medical_conditions:read(fd,"medicalConditions",1200),allergies:read(fd,"allergies",800),
  medication:read(fd,"medication",800),emergency_plan:read(fd,"emergencyPlan",1200),
  support_notes:read(fd,"supportNotes",800)
 };
 const filled=(value:string|null|undefined,n=2)=>typeof value==="string"&&value.length>=n;
 if(!filled(fields.guardian_first_name)||!filled(fields.guardian_last_name)||
    !filled(fields.guardian_relationship)||!filled(fields.player_first_name)||!filled(fields.player_last_name)||
    !filled(fields.emergency_name)||!filled(fields.emergency_relationship)||
    !fields.guardian_email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.guardian_email)||
    !fields.guardian_phone||!phoneOk(fields.guardian_phone)||
    !fields.emergency_phone||!phoneOk(fields.emergency_phone)||
    !fields.player_dob||ageAt(fields.player_dob)===null)
  return answer(400,{error:"Please check the parent, player age, and emergency contact details."});
 if(!["none_known","details"].includes(fields.medical_status||"")||
    Object.entries(fields).some(([k,v])=>v===null&&k!=="player_club")||
    (fields.medical_status==="details"&&
      ![fields.medical_conditions,fields.allergies,fields.medication,fields.emergency_plan].some(s=>Boolean(s?.length))))
  return answer(400,{error:"Please complete the medical and emergency information."});
 const guardian=read(fd,"guardianConsent",8)==="yes";
 const health=read(fd,"healthConsent",8)==="yes";
 const privacy=read(fd,"privacyConsent",8)==="yes";
 const media=read(fd,"mediaConsent",8)==="yes";
 if(!guardian||!health||!privacy)return answer(400,{error:"Please review the guardian, privacy and medical data declarations."});
 const turnstile=read(fd,"turnstileToken",2500);
 if(!turnstile)return answer(400,{error:"Please complete the anti-spam check."});
 let captchaOk=false;
 try{
  const verification=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
   method:"POST",body:new URLSearchParams({secret,response:turnstile}),signal:AbortSignal.timeout(8000)
  });
  const result=await verification.json();
  captchaOk=verification.ok&&result.success===true;
 }catch{return answer(503,{error:"Verification is temporarily unavailable. Please retry."});}
 if(!captchaOk)return answer(400,{error:"The anti-spam check expired. Please try again."});
 const suppliedPhoto=fd.get("playerPhoto");
 let photo:Uint8Array|null=null;
 if(suppliedPhoto instanceof File&&suppliedPhoto.size>0){
  if(suppliedPhoto.type!=="image/jpeg"||suppliedPhoto.size>1_024_000)
   return answer(400,{error:"Please upload a JPEG photo under 1 MB."});
  photo=new Uint8Array(await suppliedPhoto.arrayBuffer());
  if(photo[0]!==0xff||photo[1]!==0xd8||photo[2]!==0xff)
   return answer(400,{error:"The photo must be a valid JPEG."});
 }
 const base={
  event_slug:slug,status:"pending",
  ...fields,
  guardian_authority_confirmed:true,health_processing_consent:true,privacy_acknowledged:true,
  event_media_consent:media,consent_version:"2026-11-festival-v1"
 };
 // Allocate an available numbered seat. A partial unique index is the final concurrency guard.
 // If another request claims the same seat, retry; never exceed 36 active bookings.
 let booking:BookingRow|null=null;
 for(let attempt=0;attempt<36;attempt++){
  const existing=await admin.from("star_festival_bookings").select("seat_number").eq("event_slug",slug).in("status",["pending","confirmed"]);
  if(existing.error)return answer(503,{error:"Booking service is temporarily unavailable."});
  const occupied=new Set((existing.data||[]).map((r:{seat_number:number})=>r.seat_number));
  const seat=Array.from({length:capacity},(_,i)=>i+1).find(n=>!occupied.has(n));
  if(!seat)return answer(409,{error:"The festival is currently full. Please contact STAR about cancellations."});
  const {data,error}=await admin.from("star_festival_bookings").insert({
   ...base,seat_number:seat,ticket_price_pence:seat<=earlyBirdLimit?1000:1500
  }).select("id,seat_number,status").single();
  if(!error&&data){booking=data as BookingRow;break;}
  if(error?.code==="23505"){
   // Another registration won the seat or this child has already been registered.
   const dupe=await admin.from("star_festival_bookings").select("id")
      .eq("event_slug",slug).eq("guardian_email",fields.guardian_email!)
      .ilike("player_first_name",fields.player_first_name!).eq("player_dob",fields.player_dob!)
      .in("status",["pending","confirmed"]).limit(1);
   if(dupe.data?.length)return answer(409,{error:"An active request already exists for this player and email. Contact STAR if you need to make a change."});
   continue;
  }
  return answer(503,{error:"Your booking could not be saved. Please try again."});
 }
 if(!booking)return answer(409,{error:"Places are being reserved quickly. Please try again."});
 if(photo){
  const path=`christmas-2026/${booking.id}.jpg`;
  const upload=await admin.storage.from(bucket).upload(path,photo,{contentType:"image/jpeg",upsert:false,cacheControl:"3600"});
  if(upload.error){
   await admin.from("star_festival_bookings").delete().eq("id",booking.id);
   return answer(503,{error:"The photo could not be stored securely. Please retry or leave the optional photo out."});
  }
  const saved=await admin.from("star_festival_bookings").update({player_photo_path:path}).eq("id",booking.id);
  if(saved.error){
   await admin.storage.from(bucket).remove([path]);
   await admin.from("star_festival_bookings").delete().eq("id",booking.id);
   return answer(503,{error:"We could not finish saving your booking. Please try again."});
  }
 }
 return answer(201,{
  ok:true,reference:booking.id.slice(0,8).toUpperCase(),status:"pending",
  pricePence:booking.seat_number<=earlyBirdLimit?1000:1500,
  message:"Request received. STAR will confirm the place and payment arrangements."
 });
});
