# STAR Parent Portal setup

The parent portal at /parent-portal uses Supabase Auth email/password and the publishable client key. The database has row-level policies limiting access to each guardian's records.

Supabase project: mgmzujtzncqubbwzvddh (London).
Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel. Never use a service-role key in client code.

Before inviting families:
- Set Supabase Auth Site URL to https://star-development-centre.vercel.app and add https://star-development-centre.vercel.app/parent-portal to allowed Redirect URLs.
- Confirm email templates and SMTP sending capacity, including password reset.
- Test sign-up, confirmation, sign-in, sign-out, password recovery, and two distinct families' database access.
- Approve the full privacy notice and retention/deletion procedures, with safeguarding lead and data controller identified.
- Player registration entry remains disabled until the above are complete.
- Keep STAR_ENQUIRY_ENABLED=false until enquiry delivery is tested.

The dashboard currently allows parent profile creation and read-only access to any existing registrations; it does not accept children's details.
