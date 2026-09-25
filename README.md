# Inflixo

A creator identity and content organization platform built with Next.js,
React, TypeScript, Tailwind CSS, MySQL, Razorpay, and object storage.

## Getting started

```bash
npm install
npm run migrate
npm run dev
```

Copy the variable names from `.env.example` into your local or deployment
environment before running migrations. Open
[http://localhost:3000](http://localhost:3000) and sign in with the OTP sent
to your email.

## Production build

```bash
npm run build
npm run start
```

Production must configure `JWT_SECRET`, `CRON_SECRET`,
`RAZORPAY_WEBHOOK_SECRET`, the MySQL variables, and the credentials for each
enabled provider. Sensitive endpoints fail closed when required secrets are
missing.

## Architecture

The codebase keeps UI, business logic, local caching, and server APIs in
separate layers:

```
components/  → UI only, no localStorage access
  ↓ calls
services/    → business logic (ProfileService, SocialService, SeriesService…)
  ↓ calls
repositories/→ raw per-entity persistence (localRepository.ts)
  ↓ calls
utils/storage.ts → the only file that touches window.localStorage directly
```

The authenticated server state is exposed through `/api/me`; browser storage
is used only as a UI cache and is not an authorization source.

### Folder guide

| Folder | Contents |
|---|---|
| `app/` | Next.js App Router routes (see Routes below) |
| `components/` | Reusable UI: `ui/` (Button, Input, Select…), `onboarding/`, `dashboard/`, `socials/`, `shared/` |
| `layouts/` | `AuthSplitLayout`, `OnboardingLayout` — shared page chrome |
| `themes/` | 5 reusable Creator Card theme components + a registry, all driven by the same typed `ThemeCardProps` |
| `services/` | UI-agnostic business logic, one per domain entity |
| `repositories/` | localStorage read/write, one per entity |
| `contexts/` | `CreatorContext` (reactive profile/socials/theme/series/subscription state), `ToastContext` |
| `types/` | Shared domain types (`CreatorProfile`, `SocialAccounts`, `Series`, etc.) |
| `data/` | Demo creator seed data (Heena Rathod) |
| `utils/` | `storage.ts` (localStorage wrapper), `format.ts` (number formatting, slugify, id generation) |

### Routes

- `/login`, `/verify-otp` — email OTP authentication
- `/onboarding/profile` → `/socials` → `/themes` → `/series` → `/subscription` → `/finish`
- `/dashboard` and `/dashboard/{profile,socials,series,themes,preview,subscription,settings}`
- `/[username]` — the public, shareable creator profile page

### Design system

Colors, radii and shadows are defined as CSS variables in `app/globals.css`
under `@theme inline` (Tailwind v4's CSS-first config) — purple primary
(`--inflixo-purple`), electric blue, soft lavender, and a lime accent used
sparingly, on a light background with rounded 16–28px surfaces.

### Loading the demo creator

The seed data for "Heena Rathod" (used as the design reference throughout)
lives in `data/demoCreator.ts` and can be loaded via
`OnboardingService.seedDemoData()` from any client component or the browser
console (after importing/bundling), which populates profile, socials, theme,
series and an active subscription in one call. The public profile page will
then be live at `/heenarathod`.

### Notes on brand icons

`lucide-react` does not ship brand/logo icons (Instagram, YouTube, Facebook).
Lightweight original SVG icons for these three platforms live in
`components/shared/BrandIcons.tsx`. The Google/Apple buttons on the login
screen use inline SVGs for the same reason.

## Operations

Run `npm run migrate` before deploying a new release. Razorpay webhooks use
`RAZORPAY_WEBHOOK_SECRET`, and the scheduled social sync uses the Vercel cron
`Authorization: Bearer` header backed by `CRON_SECRET`.

Migrations target only the database selected by `MYSQL_HOST`, `MYSQL_USER`,
`MYSQL_PASSWORD`, `MYSQL_DATABASE`, and `MYSQL_PORT`. Run them separately with
the appropriate environment for development and production.

## Import series videos from CSV

Open **Dashboard → Series → Import CSV**. Download the template, fill it in
Excel or Google Sheets, and export as **CSV UTF-8**. Required columns are
`title`, `part_number`, and `url` (`order_number` and `link` are also accepted).
Select an existing series or enter a new series title, review the preview,
and import. Part numbers determine playback listing order; they do not need
to be consecutive. Links must use HTTP or HTTPS.

Files support quoted commas, multiline titles, Unicode, and semicolon-separated
Excel exports. The maximum is 500 videos / 1 MB, subject to the creator's plan.
Duplicate parts or links within the file or target series block the import.
Imports are additive and transactional: existing episodes are never overwritten,
and a failed database write rolls back the entire batch. Direct `.xlsx` upload
is not supported; export the sheet as CSV first.

Run import regression checks with `node --test tests/series-csv.test.cjs`.
