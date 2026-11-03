-- Qualify the upload object's name; the organisation subquery also has a name column.
alter policy org_brand_manager_insert on storage.objects
with check (
 bucket_id='organisation-branding'
 and (select star_private.is_staff_manager())
 and exists (
  select 1 from public.star_organisations o
  where o.id::text=(storage.foldername(storage.objects.name))[1]
 )
);
