import {createClient} from "@supabase/supabase-js";

export const eventCategories=["Holiday camps","Skills clinics","Open days","Tournaments","Community events"] as const;
export type EventCategory=typeof eventCategories[number];
export type StarEvent={
  id:string;slug:string;title:string;summary:string;description:string;
  category:EventCategory;starts_at:string;ends_at:string;venue_name:string;
  venue_address:string|null;minimum_age:number|null;maximum_age:number|null;
  price_pence:number|null;capacity:number|null;registration_url:string|null;
  image_url:string|null;status:"draft"|"published"|"cancelled";
};


const christmasFestival:StarEvent={
  id:"star-christmas-football-festival-2026",slug:"christmas-football-festival-2026",
  title:"STAR Christmas Football Festival 2026",
  summary:"Three hours of festive football, skills challenges, mini matches and awards for girls aged 5–16. £10 early bird / £15 standard. Date and venue are provisional; registration is not yet open.",
  description:"Join STAR Development Centre for a football-focused Christmas festival for girls aged 5–16. Enjoy the Reindeer Dribbling Dash, Santa's Target Shooting, Elf Express Passing, the STAR Christmas Cup, a festive penalty challenge and certificates and awards.\n\nThe proposed programme runs from 10:00am to 1:00pm, with age-group activities for 5–7, 8–11 and 12–16 year olds. There are up to 36 places, subject to final venue and staffing checks.\n\nTickets are planned at £10 early bird and £15 standard. Registration is not yet open. Saturday 19 December and Staplegrove Youth Ground, Corkscrew Lane, are proposed details awaiting final confirmation. Please check back for booking information.",
  category:"Community events",starts_at:"2026-12-19T10:00:00Z",ends_at:"2026-12-19T13:00:00Z",
  venue_name:"Staplegrove Youth Ground, Corkscrew Lane (proposed)",venue_address:"Corkscrew Lane, Staplegrove, Taunton, Somerset",
  minimum_age:5,maximum_age:16,price_pence:1500,capacity:36,registration_url:null,
  image_url:"/events/star-christmas-festival.svg",status:"published"
};

export const londonDate=(date:string,options:Intl.DateTimeFormatOptions)=>
  new Intl.DateTimeFormat("en-GB",{...options,timeZone:"Europe/London"}).format(new Date(date));

export const eventDate=(date:string)=>londonDate(date,{day:"numeric",month:"long",year:"numeric"});
export const eventTime=(date:string)=>londonDate(date,{hour:"2-digit",minute:"2-digit"});
export const eventPrice=(pence:number|null)=>{
  if(pence===null)return "Price to be confirmed";
  if(pence===0)return "Free";
  return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:pence%100===0?0:2}).format(pence/100);
};
export const eventAge=(min:number|null,max:number|null)=>
  min!==null&&max!==null?`Ages ${min}–${max}`:min!==null?`Ages ${min}+`:max!==null?`Up to age ${max}`:"Age guidance to follow";
export const eventBookingUrl=(value:string|null)=>{
  if(!value)return null;
  try{const url=new URL(value);return url.protocol==="https:"?url.toString():null;}catch{return null;}
};
function publicClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const columns="id,slug,title,summary,description,category,starts_at,ends_at,venue_name,venue_address,minimum_age,maximum_age,price_pence,capacity,registration_url,image_url,status";
export async function getPublicEvents():Promise<StarEvent[]>{
  const db=publicClient();if(!db)return [christmasFestival];
  const {data,error}=await db.from("star_events").select(columns).in("status",["published","cancelled"]).order("starts_at",{ascending:true}).limit(200);
  if(error){console.error("STAR events could not be fetched:",error.code);return [christmasFestival];}
  const items=(data||[]) as unknown as StarEvent[];
  return [christmasFestival,...items.filter(event=>event.slug!==christmasFestival.slug)].sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
}
export async function getPublicEvent(slug:string):Promise<StarEvent|null>{
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
  if(slug===christmasFestival.slug)return christmasFestival;
  const db=publicClient();if(!db)return null;
  const {data,error}=await db.from("star_events").select(columns).eq("slug",slug).in("status",["published","cancelled"]).maybeSingle();
  if(error){console.error("STAR event could not be fetched:",error.code);return null;}
  return data as StarEvent|null;
}
