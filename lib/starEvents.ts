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
  const db=publicClient();if(!db)return [];
  const {data,error}=await db.from("star_events").select(columns).in("status",["published","cancelled"]).order("starts_at",{ascending:true}).limit(200);
  if(error){console.error("STAR events could not be fetched:",error.code);return [];}
  return (data||[]) as unknown as StarEvent[];
}
export async function getPublicEvent(slug:string):Promise<StarEvent|null>{
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
  const db=publicClient();if(!db)return null;
  const {data,error}=await db.from("star_events").select(columns).eq("slug",slug).in("status",["published","cancelled"]).maybeSingle();
  if(error){console.error("STAR event could not be fetched:",error.code);return null;}
  return data as StarEvent|null;
}
