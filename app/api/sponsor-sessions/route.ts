import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const amounts:Record<string,{title:string;amount:number;units:number;kind:string}>={
 "one-group":{title:"One group session",amount:5,units:1,kind:"group"},
 "four-group":{title:"Four group sessions",amount:20,units:4,kind:"group"},
 "one-local":{title:"One individual session · Taunton / Wellington",amount:35,units:1,kind:"individual"},
 "one-bridgwater":{title:"One individual session · Bridgwater",amount:40,units:1,kind:"individual"},
 "two-local":{title:"Two individual sessions · Taunton / Wellington",amount:70,units:2,kind:"individual"},
 "two-bridgwater":{title:"Two individual sessions · Bridgwater",amount:80,units:2,kind:"individual"}
};
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return reply({error:"Origin not allowed."},403);
 if(!request.headers.get("content-type")?.includes("application/json"))return reply({error:"Invalid request."},415);
 if(Number(request.headers.get("content-length")||0)>3000)return reply({error:"Invalid request."},413);
 const token=request.headers.get("authorization")?.match(/^Bearer ([\w.-]+)$/)?.[1];
 if(!token)return reply({error:"Please sign in to your parent account."},401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply({error:"Parent accounts are temporarily unavailable."},503);
 const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:"Bearer "+token}}});
 const {data:{user},error:authError}=await client.auth.getUser(token);
 if(authError||!user?.email||user.is_anonymous)return reply({error:"Please sign in to your parent account."},401);
 const {data:guardian,error:guardianError}=await client.from("guardian_profiles").select("user_id").eq("user_id",user.id).maybeSingle();
 if(guardianError||!guardian)return reply({error:"Please finish setting up your parent profile first."},403);
 let data:Record<string,unknown>;try{const body=await request.text();if(Buffer.byteLength(body)>3000)return reply({error:"Invalid request."},413);data=JSON.parse(body);if(!data||typeof data!=="object"||Array.isArray(data))throw Error();}catch{return reply({error:"Invalid request."},400)}
 const choice=typeof data.choice==="string"?data.choice:"",item=amounts[choice];
 if(!item)return reply({error:"Please choose a listed sponsorship option."},400);
 if(process.env.STAR_ENQUIRY_ENABLED!=="true"||!process.env.RESEND_API_KEY||!process.env.STAR_ENQUIRY_FROM)return reply({error:"Sponsorship pledges are temporarily unavailable. Please contact STAR directly."},503);
 const details=["New STAR session sponsorship pledge","Verified parent account: "+user.id,"Parent email: "+user.email,"Selected: "+item.title,"Value: £"+item.amount,"Session category: "+item.kind,"Sessions requested: "+item.units,"PLEDGE ONLY — NO PAYMENT TAKEN","Do not allocate sessions before payment is independently confirmed."].join("\n");
 try{const response=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.STAR_ENQUIRY_FROM,to:["coachdmp7@gmail.com"],subject:"STAR website: coaching session sponsorship pledge (£"+item.amount+")",text:details,reply_to:user.email})});if(!response.ok)return reply({error:"Could not confirm receipt. Please contact STAR directly."},502);const receipt=await response.json();if(typeof receipt?.id!=="string"||!receipt.id.trim())return reply({error:"Could not confirm receipt. Please contact STAR directly."},502);return reply({ok:true});}catch{return reply({error:"Could not confirm receipt. Please contact STAR directly."},502)}
}
