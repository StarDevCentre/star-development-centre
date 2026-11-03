-- Storage metadata fixtures only: no image bytes, no real branding edits. Full rollback.
begin;
create temporary table logo_ctx(k text primary key,id uuid not null default gen_random_uuid());
insert into logo_ctx(k) values('manager'),('member'),('org'),('unknown');
grant select on logo_ctx to authenticated,anon;
insert into auth.users(id,email,email_confirmed_at,is_anonymous)
select id,'logo-check-'||id||'@example.invalid',now(),false from logo_ctx where k in ('manager','member');
insert into public.staff_members(user_id,role,active) select id,'manager',true from logo_ctx where k='manager';
insert into public.star_organisations(id,name,kind,created_by)
select id,'Synthetic school name is not an upload folder','school',(select id from logo_ctx where k='manager') from logo_ctx where k='org';
create function pg_temp.logo_assert(ok boolean,message text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'Logo check failed: %',message; end if; end$$;
create function pg_temp.logo_denied(path text) returns void language plpgsql as $$
begin
 begin insert into storage.objects(bucket_id,name) values('organisation-branding',path);
 exception when insufficient_privilege then return; end;
 raise exception 'Unexpected upload permission for %',path;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from logo_ctx where k='manager'),true);
insert into storage.objects(bucket_id,name,metadata)
values('organisation-branding',(select id::text||'/synthetic-logo.png' from logo_ctx where k='org'),'{"mimetype":"image/png","size":32}');
select pg_temp.logo_assert(exists(select 1 from storage.objects where bucket_id='organisation-branding' and name=(select id::text||'/synthetic-logo.png' from logo_ctx where k='org')),'manager uploads in the actual organisation folder');
select public.star_organisation_portal('save_branding',jsonb_build_object('organisation_id',(select id from logo_ctx where k='org'),'brand_colour','#071c3b','welcome_text','Synthetic welcome','logo_path',(select id::text||'/synthetic-logo.png' from logo_ctx where k='org'),'referral_assignee',''));
select pg_temp.logo_assert((public.star_organisation_portal('manage')->'organisations') @> jsonb_build_array(jsonb_build_object('id',(select id from logo_ctx where k='org'),'logo_path',(select id::text||'/synthetic-logo.png' from logo_ctx where k='org'))),'uploaded logo can be saved to branding');
select pg_temp.logo_denied((select id::text||'/unknown-logo.png' from logo_ctx where k='unknown'));
select pg_temp.logo_denied('synthetic-logo.png');
select set_config('request.jwt.claim.sub',(select id::text from logo_ctx where k='member'),true);
select pg_temp.logo_denied((select id::text||'/member-logo.png' from logo_ctx where k='org'));
reset role;
set local role anon;
select pg_temp.logo_denied((select id::text||'/anonymous-logo.png' from logo_ctx where k='org'));
reset role;
rollback;
select 'Logo upload and branding-save permission checks passed; every fixture rolled back.' as result;
