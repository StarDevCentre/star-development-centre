# STAR enquiry delivery configuration

The public forms on /book, /register and /contact collect only basic parent/guardian contact details, the player's age (optional), a programme choice and a short enquiry.

## Configure secure delivery

In the STAR Vercel project's Environment Variables, set:

- `RESEND_API_KEY`: a Resend API key with permission to send email.
- `STAR_ENQUIRY_FROM`: an email sender address on a domain verified with Resend (for example, `STAR Enquiries <enquiries@your-verified-domain.co.uk>`).

Keep `STAR_ENQUIRY_ENABLED` unset or `false` until the privacy notice, spam controls and production delivery test are complete. Then set `STAR_ENQUIRY_ENABLED=true` and redeploy.\n\nRedeploy after setting the variables. The API sends each enquiry to `coachdmp7@gmail.com` with the parent's address as reply-to.

Until these are configured, the endpoint returns HTTP 503 and the form **does not claim to have sent anything**. It instead offers parent-controlled email and WhatsApp links prefilled with their entered details.

## Before accepting online enquiries

Confirm your privacy notice explains this enquiry data, its retention and the email service provider. Test delivery, spam prevention, validation, privacy and accessibility on production. A durable, shared rate limiter should be added before enabling public API delivery at scale.

This is **not** a full player registration, session booking or safeguarding record system. Do not collect medical or safeguarding information through this form. Registration with player records and consent must be built on authenticated, access-controlled storage.
