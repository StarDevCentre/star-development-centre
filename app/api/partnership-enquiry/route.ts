import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const types=new Set(["business","charity","sponsor","community","other"]);
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const field=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max?v.trim():null;
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return reply({error:"Origin not allowed."},403);
 if(process.env.STAR_ENQUIRY_ENABLED!=="true"||!process.env.RESEND_API_KEY||!process.env.STAR_ENQUIRY_FROM)return reply({error:"Please email your proposal to STAR."},503);
 if(!request.headers.get("content-type")?.includes("application/json"))return reply({error:"Invalid request."},415);
 if(Number(request.headers.get("content-length")||0)>14000)return reply({error:"Request too large."},413);
 let data:Record<string,unknown>;try{const body=await request.text();if(Buffer.byteLength(body)>14000)return reply({error:"Request too large."},413);data=JSON.parse(body);if(!data||typeof data!=="object"||Array.isArray(data))throw Error()}catch{return reply({error:"Invalid request."},400)}
 if(data.website)return reply({error:"Unable to accept this enquiry."},400);
 const organisation=field(data.organisation,160),name=field(data.name,100),email=field(data.email,200),phone=field(data.phone??"",40),url=field(data.url??"",300),type=field(data.type,30),proposal=field(data.proposal,3000);
 if(!organisation||organisation.length<2||!name||name.length<2||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone===null||url===null||!type||!types.has(type)||!proposal||proposal.length<20||/[\r\n\x00-\x1f]/.test(organisation+name+email+phone+url)||data.consent!==true)return reply({error:"Please check your details and consent."},400);
 if(url){try{if(!["http:","https:"].includes(new URL(url).protocol))throw Error()}catch{return reply({error:"Please check your website URL."},400)}}
 const text=["New STAR partnership proposal","Organisation: "+organisation,"Contact: "+name,"Email: "+email,"Phone: "+(phone||"Not supplied"),"Website: "+(url||"Not supplied"),"Organisation type: "+type,"Proposal: "+proposal,"Consent to review and respond: Yes"].join("\n");
 try{const response=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.STAR_ENQUIRY_FROM,to:["coachdmp7@gmail.com"],subject:"STAR website: partnership enquiry",text,reply_to:email})});if(!response.ok)return reply({error:"Receipt could not be confirmed."},502);const receipt=await response.json();if(typeof receipt?.id!=="string"||!receipt.id.trim())return reply({error:"Receipt could not be confirmed."},502);return reply({ok:true})}catch{return reply({error:"Receipt could not be confirmed."},502)}
}
