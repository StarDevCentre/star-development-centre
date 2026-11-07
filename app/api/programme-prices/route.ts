import {createClient} from "@supabase/supabase-js";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0",Vary:"Authorization"};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});

// Keep prices in this server route, out of public page data and browser bundles.
const prices=[
 {slug:"sparks",title:"STAR Sparks",price:"£5",unit:"per 60-minute session",options:["Pay as you go."]},
 {slug:"development",title:"Development Groups",price:"£5",unit:"per 45-minute session",options:["Pay as you go."]},
 {slug:"flyers",title:"STAR Flyers",price:"£375",unit:"for 16 × 60-minute sessions",options:["£375 paid upfront.","Three payments totalling £380. The schedule is agreed with STAR."]},
 {slug:"prestige",title:"STAR Prestige",price:"£800",unit:"for the 24-week programme",options:["£800 paid upfront.","3 × £280 — £840 total.","6 × £150 — £900 total."]},
 {slug:"one-to-one",title:"One to One Coaching",price:"£35",unit:"per 60-minute session · Taunton and Wellington",options:["£40 per 60-minute session in Bridgwater.","Pay after the session."]},
 {slug:"season-support",title:"Player Season Support",price:"£25",unit:"per visit",options:["Visit arrangements are agreed with STAR."]}
];

export async function GET(request:Request){
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer \S+$/i.test(authorization))return reply({error:"Sign in to your parent account."},401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply({error:"Prices are temporarily unavailable. Please contact STAR."},503);
 try{
  const supabase=createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await supabase.auth.getUser(authorization.slice(7));
  if(error||!user||user.is_anonymous)return reply({error:"Please sign in again."},401);
  return reply({prices});
 }catch{return reply({error:"Prices are temporarily unavailable. Please try again."},503);}
}


