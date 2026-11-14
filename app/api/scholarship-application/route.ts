import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const field=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max?v.trim():null;
const choices=new Set(["group","individual","flyers","prestige","unsure"]);
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return reply({error:"Origin not allowed."},403);
 if(!request.headers.get("content-type")?.includes("application/json"))return reply({error:"Invalid request."},415);
 if(Number(request.headers.get("content-length")||0)>9000)return reply({error:"Request too large."},413);
 let data:Record<string,unknown>;try{const body=await request.text();if(Buffer.byteLength(body)>9000)return reply({error:"Request too large."},413);data=JSON.parse(body);if(!data||typeof data!=="object"||Array.isArray(data))throw Error();}catch{return reply({error:"Invalid request."},400)}
 if(data.website)return reply({error:"Unable to accept this request."},400);
 const name=field(data.name,100),email=field(data.email,200),phone=field(data.phone??"",40),age=field(data.age,2),area=field(data.area,70),programme=field(data.programme,30),message=field(data.message,1200);
 if(!name||name.length<2||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone===null||!age||!/^\d{1,2}$/.test(age)||Number(age)<5||Number(age)>18||!area||area.length<2||!programme||!choices.has(programme)||!message||message.length<20||data.consent!==true||/[\r\n\x00-\x1f]/.test(name+email+phone+area))return reply({error:"Please check the form and consent before submitting."},400);
 if(process.env.STAR_ENQUIRY_ENABLED!=="true"||!process.env.RESEND_API_KEY||!process.env.STAR_ENQUIRY_FROM)return reply({error:"The form is temporarily unavailable. Please contact STAR directly."},503);
 const text=["STAR coaching support application","Parent/guardian: "+name,"Email: "+email,"Phone: "+(phone||"Not supplied"),"Player age: "+age,"Area: "+area,"Requested coaching: "+programme,"Circumstances / support requested: "+message,"Consent to contact: Yes","This is an enquiry only. No funding has been allocated."].join("\n");
 try{const response=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.STAR_ENQUIRY_FROM,to:["coachdmp7@gmail.com"],subject:"STAR website: confidential coaching support application",text,reply_to:email})});if(!response.ok)return reply({error:"Could not confirm receipt. Please contact STAR directly."},502);const receipt=await response.json();if(typeof receipt?.id!=="string"||!receipt.id.trim())return reply({error:"Could not confirm receipt. Please contact STAR directly."},502);return reply({ok:true});}catch{return reply({error:"Could not confirm receipt. Please contact STAR directly."},502)}
}
