import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {sponsorshipOptions} from "../../../lib/starBankTransfer";
export const runtime="nodejs";
const reply=(v:object,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"no-store"}});
const cols="id,payment_reference,title,amount_pence,status,created_at,reported_sent_at,confirmed_at";
async function session(req:NextRequest){
 const origin=req.headers.get("origin");if(origin&&origin!==req.nextUrl.origin)return {error:"Invalid origin.",status:403} as const;
 const token=req.headers.get("authorization")?.match(/^Bearer ([\w.-]+)$/)?.[1];
 if(!token)return {error:"Sign in to your Parent Portal.",status:401} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return {error:"Parent accounts are temporarily unavailable.",status:503} as const;
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:"Bearer "+token}}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user?.email||user.is_anonymous)return {error:"Please sign in again.",status:401} as const;
 const guardian=await db.from("guardian_profiles").select("user_id").eq("user_id",user.id).maybeSingle();
 if(guardian.error||!guardian.data)return {error:"Complete your parent profile before sponsoring.",status:403} as const;
 return {db,user} as const;
}
async function readBody(req:NextRequest){
 if(!req.headers.get("content-type")?.includes("application/json")||Number(req.headers.get("content-length")||0)>3000)throw Error();
 const body=await req.text();if(Buffer.byteLength(body)>3000)throw Error();
 const data:unknown=JSON.parse(body);if(!data||typeof data!=="object"||Array.isArray(data))throw Error();
 return data as Record<string,unknown>;
}
export async function GET(req:NextRequest){
 const ctx=await session(req);if("error" in ctx)return reply({error:ctx.error},ctx.status);
 const {data,error}=await ctx.db.from("sponsorship_bank_transfers").select(cols).eq("guardian_id",ctx.user.id).order("created_at",{ascending:false}).limit(30);
 return error?reply({error:"Could not load sponsorships."},503):reply({ok:true,orders:data});
}
export async function POST(req:NextRequest){
 const ctx=await session(req);if("error" in ctx)return reply({error:ctx.error},ctx.status);
 let body:Record<string,unknown>;try{body=await readBody(req)}catch{return reply({error:"Invalid request."},400)}
 if(typeof body.choice!=="string"||!sponsorshipOptions.some(x=>x.id===body.choice))return reply({error:"Choose a valid sponsorship."},400);
 const {data,error}=await ctx.db.rpc("star_create_sponsorship_bank_transfer",{p_choice:body.choice});
 if(error||!data?.reference)return reply({error:error?.message||"Could not prepare bank transfer."},503);
 const order={id:data.id,payment_reference:data.reference,title:data.title,amount_pence:data.amount_pence,status:data.status,created_at:data.created_at};
 // Email notifications are supplementary; the database is the authoritative ledger.
 if(process.env.RESEND_API_KEY&&process.env.STAR_ENQUIRY_FROM){
  const note="New STAR sponsorship bank transfer\nParent: "+ctx.user.email+"\nReference: "+order.payment_reference+"\nAmount: £"+(Number(order.amount_pence)/100).toFixed(2)+"\nStatus: NOT RECEIVED — check Zempler before confirmation.";
  try{await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(6000),headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.STAR_ENQUIRY_FROM,to:["coachdmp7@gmail.com"],subject:"STAR transfer awaiting payment · "+order.payment_reference,text:note})})}catch{}
 }
 return reply({ok:true,order},201);
}
export async function PATCH(req:NextRequest){
 const ctx=await session(req);if("error" in ctx)return reply({error:ctx.error},ctx.status);
 let body:Record<string,unknown>;try{body=await readBody(req)}catch{return reply({error:"Invalid request."},400)}
 if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id))return reply({error:"Invalid transfer."},400);
 const {data,error}=await ctx.db.rpc("star_mark_sponsorship_bank_transfer_sent",{p_id:body.id});
 if(error)return reply({error:"Could not update this transfer."},503);
 return data===true?reply({ok:true}):reply({error:"This transfer cannot be marked sent."},409);
}
