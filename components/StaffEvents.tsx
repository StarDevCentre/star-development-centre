"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {supabaseBrowser} from "../lib/supabaseBrowser";
import {eventCategories,eventDate,eventTime,type EventCategory,type StarEvent} from "../lib/starEvents";
import "./staff-events.css";

type Editor={id:string;title:string;slug:string;summary:string;description:string;category:EventCategory;start:string;end:string;venue_name:string;venue_address:string;minimum_age:string;maximum_age:string;price_pounds:string;capacity:string;registration_url:string;image_url:string;status:"draft"|"published"|"cancelled"};
const blank=():Editor=>({id:"",title:"",slug:"",summary:"",description:"",category:"Holiday camps",start:"",end:"",venue_name:"",venue_address:"",minimum_age:"",maximum_age:"",price_pounds:"",capacity:"",registration_url:"",image_url:"",status:"draft"});
const slugify=(name:string)=>name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100).replace(/-$/,"");
const localInput=(date:string)=>{const d=new Date(date);const pad=(n:number)=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
function toEditor(row:StarEvent):Editor{return {id:row.id,title:row.title,slug:row.slug,summary:row.summary,description:row.description,category:row.category,start:localInput(row.starts_at),end:localInput(row.ends_at),venue_name:row.venue_name,venue_address:row.venue_address||"",minimum_age:row.minimum_age?.toString()||"",maximum_age:row.maximum_age?.toString()||"",price_pounds:row.price_pence===null?"":(row.price_pence/100).toFixed(2),capacity:row.capacity?.toString()||"",registration_url:row.registration_url||"",image_url:row.image_url||"",status:row.status};}
export function StaffEvents(){
 const client=supabaseBrowser;
 const [events,setEvents]=useState<StarEvent[]>([]);
 const [form,setForm]=useState<Editor>(blank);
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  if(!client){setError("Events database connection is unavailable.");setLoading(false);return;}
  const result=await client.from("star_events").select("id,slug,title,summary,description,category,starts_at,ends_at,venue_name,venue_address,minimum_age,maximum_age,price_pence,capacity,registration_url,image_url,status").order("starts_at",{ascending:false});
  if(result.error){setError(result.error.code==="42P01"||result.error.code==="PGRST205"?"The STAR Events database migration has not been applied yet.":"Couldn't load the events list: "+result.error.message);}
  else{setEvents((result.data||[]) as StarEvent[]);setError("");}
  setLoading(false);
 },[client]);
 useEffect(()=>{void refresh()},[refresh]);
 const change=<K extends keyof Editor>(key:K,value:Editor[K])=>setForm(current=>({...current,[key]:value}));
 function startNew(){setForm(blank());setEditing(true);setError("");setNotice("");}
 function edit(event:StarEvent){setForm(toEditor(event));setEditing(true);setError("");setNotice("");}
 async function save(e:FormEvent){
  e.preventDefault();if(!client||busy)return;setError("");setNotice("");
  const begin=new Date(form.start),finish=new Date(form.end);
  if(!Number.isFinite(begin.getTime())||!Number.isFinite(finish.getTime())||finish<=begin){setError("Set a valid start and end time. The end must come after the start.");return;}
  if(form.minimum_age&&form.maximum_age&&Number(form.minimum_age)>Number(form.maximum_age)){setError("The minimum age must not exceed the maximum age.");return;}
  if(form.status==="cancelled"&&!form.id){setError("Save the event before marking it cancelled.");return;}
  if(form.price_pounds&&!/^\d+(\.\d{1,2})?$/.test(form.price_pounds)){setError("Enter a price with no more than two decimal places, or leave it blank for TBC.");return;}
  for(const url of [form.registration_url,form.image_url])if(url&&(!url.startsWith("https://")||!/^https:\/\/\S+$/.test(url))){setError("Booking and image URLs must start with https://.");return;}
  const payload={title:form.title.trim(),slug:slugify(form.slug||form.title),summary:form.summary.trim(),description:form.description.trim(),category:form.category,
   starts_at:begin.toISOString(),ends_at:finish.toISOString(),venue_name:form.venue_name.trim(),venue_address:form.venue_address.trim()||null,minimum_age:form.minimum_age?Number(form.minimum_age):null,maximum_age:form.maximum_age?Number(form.maximum_age):null,
   price_pence:form.price_pounds===""?null:Math.round(Number(form.price_pounds)*100),capacity:form.capacity?Number(form.capacity):null,
   registration_url:form.registration_url.trim()||null,image_url:form.image_url.trim()||null,status:form.status,updated_at:new Date().toISOString()};
  setBusy(true);
  const result=form.id?await client.from("star_events").update(payload).eq("id",form.id):await client.from("star_events").insert(payload);
  setBusy(false);
  if(result.error){setError(result.error.code==="23505"?"Another event already uses this URL slug. Choose a different slug.":"Event not saved: "+result.error.message);return;}
  setNotice(form.status==="published"?"Event published. It is now listed publicly.":"Event saved.");
  setEditing(false);setForm(blank());await refresh();
 }
 async function deleteDraft(){
  if(!client||!form.id||form.status!=="draft"||busy||!window.confirm("Permanently delete this draft event?"))return;
  setBusy(true);const {error}=await client.from("star_events").delete().eq("id",form.id);setBusy(false);
  if(error){setError("Couldn't delete the draft: "+error.message);return;}
  setEditing(false);setForm(blank());setNotice("Draft deleted.");await refresh();
 }
 return <div className="star-staff-events">
  <div className="star-staff-events-head"><div><p className="star-staff-events-kicker">PUBLIC WEBSITE / EVENTS</p><h3>STAR Events manager</h3><p>Create an event as a draft, review its details, then publish it to the public Events page. Ordinary coaching sessions stay in the training calendar.</p></div><button type="button" onClick={startNew}>+ New event</button></div>
  {error&&<p className="star-staff-events-error" role="alert">{error}</p>}{notice&&<p className="star-staff-events-notice" role="status">{notice}</p>}
  {editing&&<form className="star-staff-event-editor" onSubmit={save}><div className="star-staff-event-editor-head"><h4>{form.id?"Edit event":"Create event"}</h4><button type="button" onClick={()=>{setEditing(false);setError("");}}>Close</button></div>
   <div className="star-staff-event-fields">
    <label>Event title<input required minLength={4} maxLength={140} value={form.title} onChange={e=>setForm(old=>({...old,title:e.target.value,slug:old.id?old.slug:slugify(e.target.value)}))}/></label>
    <label>URL slug<input required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>change("slug",slugify(e.target.value))}/></label>
    <label>Category<select value={form.category} onChange={e=>change("category",e.target.value as EventCategory)}>{eventCategories.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Publication status<select value={form.status} onChange={e=>change("status",e.target.value as Editor["status"])}><option value="draft">Draft — private</option><option value="published">Published — public</option>{form.id&&<option value="cancelled">Cancelled — public notice</option>}</select></label>
    <label className="star-staff-event-wide">Short introduction<input required minLength={12} maxLength={300} value={form.summary} onChange={e=>change("summary",e.target.value)}/></label>
    <label className="star-staff-event-wide">Full event information<textarea required minLength={20} maxLength={10000} rows={5} value={form.description} onChange={e=>change("description",e.target.value)}/></label>
    <label>Starts (device local time)<input type="datetime-local" required value={form.start} onChange={e=>change("start",e.target.value)}/></label>
    <label>Ends (device local time)<input type="datetime-local" required value={form.end} onChange={e=>change("end",e.target.value)}/></label>
    <label>Venue name<input required minLength={3} maxLength={150} value={form.venue_name} onChange={e=>change("venue_name",e.target.value)}/></label>
    <label>Venue address<input maxLength={300} value={form.venue_address} onChange={e=>change("venue_address",e.target.value)}/></label>
    <label>Minimum age<input type="number" min={3} max={18} value={form.minimum_age} onChange={e=>change("minimum_age",e.target.value)}/></label>
    <label>Maximum age<input type="number" min={3} max={18} value={form.maximum_age} onChange={e=>change("maximum_age",e.target.value)}/></label>
    <label>Price (£, 0 for free, blank for TBC)<input inputMode="decimal" placeholder="0.00" value={form.price_pounds} onChange={e=>change("price_pounds",e.target.value)}/></label>
    <label>Capacity (optional)<input type="number" min={1} max={1000} value={form.capacity} onChange={e=>change("capacity",e.target.value)}/></label>
    <label className="star-staff-event-wide">Booking URL (optional — HTTPS only)<input type="url" placeholder="https://..." value={form.registration_url} onChange={e=>change("registration_url",e.target.value)}/></label>
    <label className="star-staff-event-wide">Event photo URL (optional — HTTPS only)<input type="url" placeholder="https://..." value={form.image_url} onChange={e=>change("image_url",e.target.value)}/></label>
   </div><p className="star-staff-event-hint">Event times are saved from your device's local time and shown on the website in UK time. When no booking URL is supplied, visitors can email STAR to enquire.</p>
   <div className="star-staff-event-actions"><button type="submit" disabled={busy}>{busy?"Saving…":form.status==="published"?"Save & publish":"Save event"}</button>{form.status==="draft"&&form.id&&<button type="button" disabled={busy} className="star-staff-event-delete" onClick={()=>void deleteDraft()}>Delete draft</button>}</div>
  </form>}
  {loading?<p role="status">Loading events…</p>:<div className="star-staff-event-list">{events.length?events.map(event=><article key={event.id} className="star-staff-event-item"><div><span className="star-staff-event-status">{event.status}</span><h4>{event.title}</h4><p>{eventDate(event.starts_at)} · {eventTime(event.starts_at)} · {event.venue_name}</p></div><div><button type="button" onClick={()=>edit(event)}>Edit</button>{event.status!=="draft"&&<a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">View ↗</a>}</div></article>):<div className="star-staff-event-none">No events have been created. Choose <strong>New event</strong> to start with a private draft.</div>}</div>}
 </div>;
}
