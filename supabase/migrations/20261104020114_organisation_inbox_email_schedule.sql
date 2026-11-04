-- Enable only after the production organisation-alerts handler is deployed and configured.
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'organisation_email_worker_secret','Dedicated organisation email queue worker credential') where not exists(select 1 from vault.secrets where name='organisation_email_worker_secret');
select cron.schedule('star-organisation-inbox-email','* * * * *','select star_private.run_organisation_email_worker()');
