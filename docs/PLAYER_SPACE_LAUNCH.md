# Player Space welcome and phone alerts

The public sample at `/player-portal/preview` has a **Start welcome** button.
It uses sample state, unlocks every cosmetic and never requests notification
permission or sends phone alerts. Real player logins start an unfinished welcome
journey automatically; guardians can start it themselves. Setup can be skipped,
resumed or replayed. Progress belongs to the signed-in person and player pair.
Look/card saves use the existing player profile and reward checks. Goals use the
existing personal-goal path. Completing the welcome journey does not grant rewards.

## Phone alerts

Open **Updates → Phone alert settings**. Every account starts with alerts off.
Enabling requires an explicit button press, browser permission and a currently
linked player or approved family account. Each account controls its own devices,
categories and optional 9 pm–8 am UK quiet time. iPhone/iPad users must open the
installed home-screen app. The sample explains this without enabling notifications.
Device removal, disabling everywhere and sign-out stop delivery on that device.
Read updates, removed links and changed session reminders are rechecked before send.

The existing in-portal notification triggers enqueue opted-in recipients. The
`star-player-phone-alerts` database cron job runs each minute, adds due session
reminders and invokes `player-push-worker` only when delivery work is due. It works
with Player Space closed. Five devices per account are supported. Expired endpoints
are removed; transient failures retry up to five attempts with backoff. Claims use
leases and `SKIP LOCKED`; stale leases recover after ten minutes. Terminal delivery
metadata is retained for 30 days. Push payloads contain generic updates, not player
names, coach messages, locations or profile details. Notification taps open Updates
and normal sign-in/access checks apply.

## Deployment and credentials

Apply the two welcome/phone-alert migrations before deploying the web application.
Deploy the Edge Function with `supabase/config.toml`; its JWT gateway is disabled
because it performs its own scheduler-secret authentication. Public requests
without that credential receive 401. Only the service role can read worker config,
claim jobs or acknowledge sends. Browser RPC implementations live in `star_private`
with invoker wrappers and explicit role grants. All new tables have RLS.

The signing private key and random scheduler credential are encrypted in Supabase
Vault. `star_private.player_push_config` stores their Vault IDs and the public key.
No new Vercel secret or paid messaging integration is required. For a new project,
generate one VAPID key pair and one random scheduler secret, store the private values
in Vault, and insert their IDs plus the public key into the singleton config table.
Never commit generated credentials. Keep the key pair stable; rotating it requires
devices to subscribe again. The worker uses its platform-provided Supabase service
credential and validates the destination host before sending without redirects.

## Verification

- `npm run test:push`: actual worker source, real Web Push encryption and mocked
  HTTP/database boundaries; authentication, endpoint restrictions and delivery outcomes.
- `supabase/tests/player_welcome_journey_rls.sql`: parent invitation and activation,
  player setup/practice, coach feedback/badge, recorded attendance and family visibility.
- `supabase/tests/player_welcome_and_push_rls.sql`: synthetic identities, onboarding
  isolation, opt-in defaults, subscription ownership and key/RPC permissions.
- `supabase/tests/player_push_queue_rls.sql`: recipient scope, read receipts, leases,
  retries and expired subscriptions.
- `supabase/tests/player_push_revocation_rls.sql`: revoked access and rescheduled reminders.

SQL fixtures roll back and send no HTTP requests. A deployed empty-queue smoke test
checks scheduler authentication without sending any player notification. Browser QA
covers welcome completion, saving looks/cards/goals, skip/replay and 320/375px layouts.
An actual phone must opt in before a notification can be received on that phone.
