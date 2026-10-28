# Parent Space development release

Target: `development/new-parent-portal` on the existing STAR Vercel project. This branch changes the authenticated `/parent-portal` interface. It is not merged into `main`.

The existing `ParentPortal` remains responsible for authentication, guardian profiles, linked-player loading, registration, recovery and sign-out. Its owner checks and database queries are unchanged. It now passes approved family records and the existing account, messaging, session-request, training, update and phone-alert components into `ParentExperience`.

The signed-in interface uses shared assessments, goals, reports and scheduled sessions, with explicit empty states. Appearance and saved guides use a versioned browser-storage key containing both account and player identifiers. No assessment, report, message or session records are persisted in browser storage by the new interface.

The public `/parent-portal/preview/connected` route exercises the same interface with clearly labelled fictional records and no database writes. Its controls switch between populated and empty records. It does not bypass authentication or load real family information. `/parent-portal/preview` remains the original design prototype.

## Scope and remaining integrations

- All nine formations and tactical/stadium movement examples are available. The current data contract contains no coach-assigned position fields, so no position is assigned or inferred from a sample player. The explorer displays “Not yet shared” until a real coach-profile provider is added.
- Milestones use achieved coaching goals and shared monthly reviews. The photo/video gallery from the design prototype is not presented as an operational upload service. Persistent private media and coach position editing need their own database/storage implementation before a production release.
- Existing account details, registrations, programme prices, family messages, session change requests, home practice and alerts remain operational through their original components. Family tools identify themselves as family-wide and retain their existing player/thread selection controls.
- Development deployments inherit the Vercel project's existing Preview environment configuration. This is a separate website deployment, not a separate Supabase database. No migrations or real-account writes are part of this release.

## Validation

- TypeScript and Next.js production build.
- Assessment player/category isolation, dates, rating bounds and duplicate-date handling.
- Account/player appearance key separation and legacy section links.
- Calendar UTC times and escaped event text.
- Existing registration, account, dashboard derivation, communications, update, pricing and PWA tests.
- Browser checks of development sign-in and the populated/empty interface fixture, mobile layout, personalisation, player switching, chart controls, reports and pitch movement.

A signed-in real-account smoke test remains required before merging this branch into `main`. Do not create test registrations, send messages or change real sessions just to test the release.
