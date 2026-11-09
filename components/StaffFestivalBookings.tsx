"use client";
import {useCallback,useEffect,useState} from "react";
import {supabaseBrowser} from "../lib/supabaseBrowser";
import "./staff-festival-bookings.css";
type BookingSummary={
 id:string;created_at:string;seat_number:number;status:"pending"|"confirmed"|"cancelled";
 ticket_price_pence:number;player_first_name:string;player_last_name:string;player_dob:string;
 guardian_first_name:string;guardian_last_name:string;guardian_email:string;
};
type BookingDetail=BookingSummary&{
 guardian_phone:string;guardian_relationship:string;player_club:string|null;player_photo_path:string|null;
 emergency_name:string;emergency_relationship:string;emergency_phone:string;
 medical_status:string;medical_conditions:string;allergies:string;medication:string;
 emergency_plan:string;support_notes:string;event_media_consent:boolean;
 consent_recorded_at:string
};
const formatted=(d:string)=>new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Europe/London"});
export function StaffFestivalBookings(){
 const db=supabaseBrowser;
 const [rows,setRows]=useState<BookingSummary[]>([]);
 const [selected,setSelected]=useState<BookingDetail|null>(null),[photoUrl,setPhotoUrl]=useState("");
 const [loading,setLoading]=useState(true),[detailLoading,setDetailLoading]=useState(false);
 const [error,setError]=useState(""),[working,setWorking]=useState(false),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  if(!db){setLoading(false);setError("Booking database connection unavailable.");return}
  const {data,error}=await db.from("star_festival_bookings")
   .select("id,created_at,seat_number,status,ticket_price_pence,player_first_name,player_last_name,player_dob,guardian_first_name,guardian_last_name,guardian_email")
   .eq("event_slug","christmas-football-festival-2026").order("seat_number");
  setLoading(false);
  if(error){setError("The guest booking database is not ready or you do not have access.");return}
  setRows((data||[]) as BookingSummary[]);setError("");
 },[db]);
 useEffect(()=>{void refresh()},[refresh]);
 async function open(row:BookingSummary){
  if(!db)return;setDetailLoading(true);setError("");setPhotoUrl("");
  const {data,error}=await db.from("star_festival_bookings")
   .select("id,created_at,seat_number,status,ticket_price_pence,player_first_name,player_last_name,player_dob,guardian_first_name,guardian_last_name,guardian_email,guardian_phone,guardian_relationship,player_club,player_photo_path,emergency_name,emergency_relationship,emergency_phone,medical_status,medical_conditions,allergies,medication,emergency_plan,support_notes,event_media_consent,consent_recorded_at")
   .eq("id",row.id).single();
  if(error||!data){setError("Booking details could not be opened.");setSelected(null);setDetailLoading(false);return}
  const booking=data as BookingDetail;setSelected(booking);
  if(booking.player_photo_path?.startsWith("christmas-2026/")){
   const result=await db.storage.from("star-festival-photos").createSignedUrl(booking.player_photo_path,120);
   if(!result.error&&result.data?.signedUrl)setPhotoUrl(result.data.signedUrl);
  }
  setDetailLoading(false);
 }
 async function changeStatus(status:"confirmed"|"cancelled"|"pending"){
  if(!db||!selected||working)return;
  setWorking(true);setError("");setNotice("");
  const {error}=await db.from("star_festival_bookings").update({status,updated_at:new Date().toISOString()}).eq("id",selected.id);
  setWorking(false);
  if(error){setError("Could not update this booking. Please try again.");return}
  setSelected(old=>old?{...old,status}:old);
  setNotice("Booking marked "+status+". This does not automatically send a message to the parent.");
  await refresh();
 }
 const active=rows.filter(x=>x.status!=="cancelled");
 const pending=rows.filter(x=>x.status==="pending");
 return <section className="star-staff-festival" aria-labelledby="star-festival-admin-title">
  <div className="star-staff-festival-head"><div><p className="star-staff-events-kicker">GUEST BOOKINGS / STAFF-ONLY</p>
   <h3 id="star-festival-admin-title">Christmas Festival registrations</h3>
   <p>Public enquiries are separate from STAR member accounts. Medical information and photos are restricted to authorised staff. Booking requests are not payments or confirmed places.</p>
  </div><button type="button" onClick={()=>void refresh()}>Refresh</button></div>
  <div className="star-staff-festival-stats"><strong>{active.length}<span>Active requests / 36</span></strong><strong>{pending.length}<span>Awaiting confirmation</span></strong><strong>{rows.filter(x=>x.status==="confirmed").length}<span>Confirmed</span></strong></div>
  {error&&<p role="alert" className="star-staff-events-error">{error}</p>}
  {notice&&<p role="status" className="star-staff-events-notice">{notice}</p>}
  {loading?<p>Loading guest bookings…</p>:rows.length===0?<p>No Christmas Festival booking requests yet.</p>:
    <div className="star-staff-festival-table">
     {rows.map(row=><article key={row.id} className="star-staff-festival-row">
      <div><strong>{row.player_first_name} {row.player_last_name}</strong>
       <small>{formatted(row.player_dob)} · {row.guardian_first_name} {row.guardian_last_name} · £{(row.ticket_price_pence/100).toFixed(2)}</small>
      </div><div><span className={"star-staff-festival-status "+row.status}>{row.status}</span>
       <button type="button" onClick={()=>void open(row)}>View safely</button></div>
     </article>)}
    </div>
  }
  {detailLoading&&<p role="status">Opening private booking…</p>}
  {selected&&!detailLoading&&<section className="star-staff-festival-detail" aria-label="Private guest booking details">
   <div className="star-staff-festival-detail-head"><h4>{selected.player_first_name} {selected.player_last_name} — place {selected.seat_number}</h4>
    <button type="button" onClick={()=>{setSelected(null);setPhotoUrl("")}}>Close private details</button></div>
   {photoUrl&&<img src={photoUrl} alt={"Private identification photo of "+selected.player_first_name} className="star-staff-festival-photo"/>}
   <dl>
    <dt>Parent / guardian</dt><dd>{selected.guardian_first_name} {selected.guardian_last_name} ({selected.guardian_relationship})<br/>
     <a href={"mailto:"+selected.guardian_email}>{selected.guardian_email}</a> · <a href={"tel:"+selected.guardian_phone}>{selected.guardian_phone}</a></dd>
    <dt>Player</dt><dd>Born {formatted(selected.player_dob)}{selected.player_club?" · Club: "+selected.player_club:""}</dd>
    <dt>Emergency contact</dt><dd>{selected.emergency_name} ({selected.emergency_relationship}) — <a href={"tel:"+selected.emergency_phone}>{selected.emergency_phone}</a></dd>
    <dt>Medical status</dt><dd>{selected.medical_status==="none_known"?"None known":"Medical details supplied"}</dd>
    <dt>Conditions / injuries</dt><dd>{selected.medical_conditions||"Not supplied"}</dd>
    <dt>Allergies</dt><dd>{selected.allergies||"Not supplied"}</dd>
    <dt>Medication</dt><dd>{selected.medication||"Not supplied"}</dd>
    <dt>Emergency action plan</dt><dd>{selected.emergency_plan||"Not supplied"}</dd>
    <dt>Access / support needs</dt><dd>{selected.support_notes||"Not supplied"}</dd>
    <dt>Event marketing media permission</dt><dd>{selected.event_media_consent?"Yes":"No"}</dd>
    <dt>Declarations recorded</dt><dd>{formatted(selected.consent_recorded_at)}</dd>
   </dl>
   <div className="star-staff-festival-actions">
    <button type="button" disabled={working||selected.status==="confirmed"} onClick={()=>void changeStatus("confirmed")}>Confirm place</button>
    <button type="button" disabled={working||selected.status==="pending"} onClick={()=>void changeStatus("pending")}>Return to pending</button>
    <button type="button" className="cancel" disabled={working||selected.status==="cancelled"} onClick={()=>void changeStatus("cancelled")}>Cancel request</button>
   </div>
   <p>Contact the parent separately to confirm payment and joining instructions. Do not copy health details into ordinary email or public notes.</p>
  </section>}
 </section>;
}
