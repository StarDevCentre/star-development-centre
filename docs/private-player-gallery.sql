-- Private coaching media. No existing consent is treated as media consent.
create function star_private.gallery_staff(p uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select (select star_private.is_staff_manager()) or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=p and a.staff_user_id=(select auth.uid())))
$$;
revoke all on function star_private.gallery_staff(uuid) from public,anon;
grant execute on function star_private.gallery_staff(uuid) to authenticated;
create table public.player_media_consent (
 player_id uuid primary key references public.coaching_players(id) on delete cascade,
 allowed boolean not null default false,
 changed_at timestamptz not null default now(), changed_by uuid not null references auth.users(id)
);
create table public.player_media (
 id uuid primary key default gen_random_uuid(), player_id uuid not null references public.coaching_players(id) on delete restrict,
 object_path text not null unique, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime')),
 file_size bigint not null check(file_size>0 and file_size<=20971520),
 title text not null check(length(trim(title)) between 1 and 100), caption text not null default '' check(length(caption)<=1000),
 status text not null default 'uploading' check(status in ('uploading','draft','shared','removed')),
 revision bigint not null default 1, created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 changed_at timestamptz not null default now(), shared_at timestamptz,
 check(object_path=player_id::text||'/'||id::text||case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' when 'image/webp' then '.webp' when 'video/mp4' then '.mp4' when 'video/webm' then '.webm' when 'video/quicktime' then '.mov' end),
 check(mime_type not like 'image/%' or file_size<=8388608)
);
create index player_media_player_date on public.player_media(player_id,created_at desc);
create table public.player_media_events (
 id bigint generated always as identity primary key, player_id uuid not null references public.coaching_players(id) on delete restrict,
 media_id uuid references public.player_media(id), action text not null, actor_id uuid not null references auth.users(id), recorded_at timestamptz not null default now()
);
alter table public.player_media_consent enable row level security;
alter table public.player_media enable row level security;
alter table public.player_media_events enable row level security;
revoke all on public.player_media_consent,public.player_media,public.player_media_events from public,anon,authenticated;
grant select on public.player_media_consent,public.player_media,public.player_media_events to authenticated;
create policy gallery_consent_read on public.player_media_consent for select to authenticated using (star_private.gallery_staff(player_id) or exists(select 1 from public.guardian_player_links l where l.player_id=player_media_consent.player_id and l.guardian_id=(select auth.uid())));
create policy gallery_media_read on public.player_media for select to authenticated using (
 star_private.gallery_staff(player_id) or (status='shared' and exists(select 1 from public.player_media_consent c where c.player_id=player_media.player_id and c.allowed) and exists(select 1 from public.guardian_player_links l where l.player_id=player_media.player_id and l.guardian_id=(select auth.uid())))
);
create policy gallery_events_read on public.player_media_events for select to authenticated using ((select star_private.is_staff_manager()) or exists(select 1 from public.guardian_player_links l where l.player_id=player_media_events.player_id and l.guardian_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('player-coaching-media','player-coaching-media',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']);
create policy gallery_object_read on storage.objects for select to authenticated using (
 bucket_id='player-coaching-media' and exists(select 1 from public.player_media m join public.player_media_consent c on c.player_id=m.player_id and c.allowed where m.object_path=name and m.status in ('draft','shared'))
);
create policy gallery_object_upload on storage.objects for insert to authenticated with check (
 bucket_id='player-coaching-media' and exists(select 1 from public.player_media m join public.player_media_consent c on c.player_id=m.player_id and c.allowed where m.object_path=name and m.status='uploading' and m.created_by=(select auth.uid()) and star_private.gallery_staff(m.player_id))
);
-- No overwrite or move permission. Removed objects can only be purged by authorised staff.
create policy gallery_object_delete on storage.objects for delete to authenticated using (
 bucket_id='player-coaching-media' and exists(select 1 from public.player_media m where m.object_path=name and m.status='removed' and star_private.gallery_staff(m.player_id))
);
-- Storage delete also needs SELECT; allow only the delete operation for tombstones.
create policy gallery_removed_cleanup_read on storage.objects for select to authenticated using (
 bucket_id='player-coaching-media' and storage.allow_only_operation('object.delete') and exists(select 1 from public.player_media m where m.object_path=name and m.status='removed' and star_private.gallery_staff(m.player_id))
);
create function public.set_player_media_consent(target_player uuid,permission boolean) returns public.player_media_consent
language plpgsql security definer set search_path='' as $$
declare r public.player_media_consent;
begin
 if auth.uid() is null or permission is null or not exists(select 1 from public.guardian_player_links l where l.player_id=target_player and l.guardian_id=auth.uid()) then raise insufficient_privilege using message='Only an approved parent can change media permission'; end if;
 insert into public.player_media_consent(player_id,allowed,changed_by) values(target_player,permission,auth.uid()) on conflict(player_id) do update set allowed=excluded.allowed,changed_at=clock_timestamp(),changed_by=auth.uid() returning * into r;
 -- Withdrawal permanently unshares existing items; granting again never republishes them.
 if not permission then update public.player_media set status='draft',shared_at=null,revision=revision+1,changed_at=clock_timestamp() where player_id=target_player and status='shared'; end if;
 insert into public.player_media_events(player_id,action,actor_id) values(target_player,case when permission then 'permission_granted' else 'permission_withdrawn' end,auth.uid());
 return r;
end $$;
create function public.reserve_player_media(target_player uuid,media_title text,media_caption text,content_type text,content_size bigint) returns public.player_media
language plpgsql security definer set search_path='' as $$
declare r public.player_media; new_id uuid:=gen_random_uuid(); suffix text;
begin
 if auth.uid() is null or not star_private.gallery_staff(target_player) then raise insufficient_privilege; end if;
 perform 1 from public.player_media_consent where player_id=target_player and allowed for share;
 if not found then raise insufficient_privilege using message='Parent media permission is required'; end if;
 suffix:=case content_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' when 'image/webp' then '.webp' when 'video/mp4' then '.mp4' when 'video/webm' then '.webm' when 'video/quicktime' then '.mov' else null end;
 if suffix is null then raise check_violation using message='Unsupported media type'; end if;
 if (select count(*) from public.player_media where player_id=target_player and status='uploading')>=10 then raise check_violation using message='Remove unfinished uploads before adding more'; end if;
 insert into public.player_media(id,player_id,object_path,mime_type,file_size,title,caption,created_by) values(new_id,target_player,target_player::text||'/'||new_id::text||suffix,content_type,content_size,trim(media_title),coalesce(media_caption,''),auth.uid()) returning * into r;
 insert into public.player_media_events(player_id,media_id,action,actor_id) values(target_player,new_id,'upload_reserved',auth.uid()); return r;
end $$;
create function public.change_player_media(target_media uuid,expected_revision bigint,media_action text,new_title text default null,new_caption text default null) returns public.player_media
language plpgsql security definer set search_path='' as $$
declare r public.player_media; staff boolean; manager boolean; parent boolean;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 -- Lock consent before media to use the same order as permission withdrawal.
 perform 1 from public.player_media_consent c join public.player_media m on m.player_id=c.player_id where m.id=target_media for share of c;
 select * into r from public.player_media where id=target_media for update;
 if not found then raise insufficient_privilege; end if;
 staff:=star_private.gallery_staff(r.player_id);manager:=star_private.is_staff_manager();
 parent:=exists(select 1 from public.guardian_player_links l where l.player_id=r.player_id and l.guardian_id=auth.uid());
 if not staff and not (parent and media_action='remove' and r.status='shared') then raise insufficient_privilege; end if;
 if expected_revision is null or r.revision<>expected_revision then raise serialization_failure using message='This item changed. Refresh and review it again'; end if;
 if r.status='removed' then raise check_violation using message='Item already removed'; end if;
 if media_action in ('finish','share') then
  if not exists(select 1 from public.player_media_consent where player_id=r.player_id and allowed) then raise insufficient_privilege using message='Parent media permission is required'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='player-coaching-media' and o.name=r.object_path and (o.metadata->>'size')::bigint=r.file_size and o.metadata->>'mimetype'=r.mime_type) then raise check_violation using message='Upload is incomplete or does not match this item'; end if;
 end if;
 if media_action='finish' and r.status='uploading' and staff then r.status:='draft';
 elsif media_action='share' and r.status='draft' and manager then r.status:='shared';r.shared_at:=clock_timestamp();
 elsif media_action='unshare' and r.status='shared' and manager then r.status:='draft';r.shared_at:=null;
 elsif media_action='edit' and r.status='draft' and staff then r.title:=trim(new_title);r.caption:=coalesce(new_caption,'');
 elsif media_action='remove' then r.status:='removed';r.shared_at:=null;
 else raise insufficient_privilege using message='This action is not available'; end if;
 update public.player_media set status=r.status,title=r.title,caption=r.caption,shared_at=r.shared_at,revision=revision+1,changed_at=clock_timestamp() where id=r.id returning * into r;
 insert into public.player_media_events(player_id,media_id,action,actor_id) values(r.player_id,r.id,media_action,auth.uid());return r;
end $$;
revoke all on function public.set_player_media_consent(uuid,boolean),public.reserve_player_media(uuid,text,text,text,bigint),public.change_player_media(uuid,bigint,text,text,text) from public,anon;
grant execute on function public.set_player_media_consent(uuid,boolean),public.reserve_player_media(uuid,text,text,text,bigint),public.change_player_media(uuid,bigint,text,text,text) to authenticated;
