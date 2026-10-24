import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const ages=new Set(Array.from({length:14},(_,i)=>String(i+5)));
const programmes=new Set(["sparks","development","flyers","prestige","one-to-one","season-support",""]);
const modes=new Set(["booking","interest","general"]);
function clean(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):""}
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Origin not allowed"},{status:403});
 if(process.env.STAR_ENQUIRY_ENABLED!=="true")return NextResponse.json({error:"Online delivery not enabled; use direct contact options."},{status:503});
 const key=process.env.RESEND_API_KEY;
 const from=process.env.STAR_ENQUIRY_FROM;
 if(!key||!from)return NextResponse.json({error:"Online delivery not configured; use direct contact options."},{status:503});
 const len=Number(request.headers.get("content-length")||0);
 if(len>12000)return NextResponse.json({error:"Request too large"},{status:413});
 let data:Record<string,unknown>;
 try{data=await request.json();if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid");}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(clean(data.website,200))return NextResponse.json({ok:true});
 const mode=clean(data.mode,30),name=clean(data.name,100),email=clean(data.email,200),phone=clean(data.phone,40),age=clean(data.age,3),programme=clean(data.programme,40),message=clean(data.message,1000);
 if(!modes.has(mode)||!name||name.length<2||!email||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||data.consent!==true||!programmes.has(programme)||(age&&!ages.has(age)))return NextResponse.json({error:"Invalid enquiry details"},{status:400});
 const lines=["New STAR "+mode+" enquiry","Parent/guardian: "+name,"Email: "+email,"Phone: "+(phone||"Not supplied"),"Player age: "+(age||"Not supplied"),"Programme: "+(programme||"Not selected"),"Message: "+(message||"Not supplied"),"Consent to contact: Yes"];
 try{const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:["coachdmp7@gmail.com"],subject:"STAR website: "+mode+" enquiry",text:lines.join("\n"),reply_to:email})});if(!result.ok){console.error("STAR enquiry provider error",result.status);return NextResponse.json({error:"Delivery failed"},{status:502});}return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});}catch{console.error("STAR enquiry provider unavailable");return NextResponse.json({error:"Delivery unavailable"},{status:502});}
}
