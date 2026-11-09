// Read-only guest booking and safeguarding regressions; no real child data is created.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('guest event booking is separate from membership and password signup',()=>{
 const page=read('app/events/christmas-football-festival-2026/book/page.tsx');
 const form=read('components/FestivalGuestBookingForm.tsx');
 assert.match(page,/FestivalGuestBookingForm/);
 assert.match(form,/do <strong>not<\/strong> need a STAR membership/);
 assert.doesNotMatch(form,/signUp\(|createUser\(|supabaseBrowser\.auth/);
 assert.match(read('app/events/\[slug\]/page.tsx'),/events\/christmas-football-festival-2026\/book/);
});

test('required guardianship, emergency contact and health permissions are enforced server side',()=>{
 const fn=read('supabase/functions/star-festival-booking/index.ts');
 for(const term of ['guardian_first_name','guardian_email','player_dob','emergency_name','emergency_phone','medical_status','guardianConsent','healthConsent','privacyConsent','STAR_FESTIVAL_TURNSTILE_SECRET']){
  assert.match(fn,new RegExp(term));
 }
 assert.match(fn,/if\(!guardian\|\|!health\|\|!privacy\)/);
 assert.match(fn,/if\(!captchaOk\)/);
 assert.match(fn,/if\(!isOpen\)/);
 assert.match(fn,/new Uint8Array/);
 assert.match(fn,/suppliedPhoto\.type!=="image\/jpeg"/);
 assert.doesNotMatch(fn,/sendEmail|emails\.send|resend\.com\/emails/i,'Health details must never enter ordinary email');
});

test('guests receive no direct database access to children data and photos stay private',()=>{
 const sql=read('supabase/migrations/20261109082500_star_festival_guest_bookings.sql');
 assert.match(sql,/alter table public\.star_festival_bookings enable row level security/i);
 assert.match(sql,/revoke all on public\.star_festival_bookings from public,anon,authenticated/i);
 assert.match(sql,/for select to authenticated[\s\S]*?s\.role in \('owner','manager'\)/);
 assert.match(sql,/public,false,1024000/);
 assert.match(sql,/bucket_id='star-festival-photos'/);
 assert.doesNotMatch(sql,/for insert to anon/);
 assert.doesNotMatch(sql,/bucket_id='star-festival-photos'[\s\S]*?for insert to authenticated/);
});

test('capacity and ticket pricing cannot be changed by form data',()=>{
 const sql=read('supabase/migrations/20261109082500_star_festival_guest_bookings.sql');
 const fn=read('supabase/functions/star-festival-booking/index.ts');
 assert.match(sql,/seat_number between 1 and 36/);
 assert.match(sql,/ticket_price_pence in \(1000,1500\)/);
 assert.match(sql,/create unique index if not exists star_festival_active_seat/);
 assert.match(fn,/const capacity=36/);
 assert.match(fn,/const earlyBirdLimit=12/);
 assert.match(fn,/seat<=earlyBirdLimit\?1000:1500/);
 assert.doesNotMatch(fn,/read\(fd,"seat_number"/);
});

test('medical information is not sent to the public listing and promotional choices default off',()=>{
 const form=read('components/FestivalGuestBookingForm.tsx');
 const staff=read('components/StaffFestivalBookings.tsx');
 assert.match(form,/name="mediaConsent"/);
 assert.doesNotMatch(form,/name="mediaConsent"[^>]*defaultChecked/);
 assert.match(form,/Canvas removes original file metadata/);
 assert.match(staff,/createSignedUrl\(booking\.player_photo_path,120\)/);
 assert.match(staff,/Only authorised|authorised staff/i);
 assert.match(read('app/privacy/page.tsx'),/One-off guest event bookings/);
});
