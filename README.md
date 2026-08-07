# Inflixo — Frontend Prototype

A modern, responsive frontend prototype for **Inflixo**, a creator identity and
content organization platform for Indian content creators. Built with
Next.js App Router, React, TypeScript, and Tailwind CSS. Everything runs
locally with mock JSON and `localStorage` — there is no backend yet.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`. Enter any email and use any 6-digit code on the OTP screen (or use
the Google/Apple buttons) to get straight into onboarding.

## Production build

```bash
npm run build
npm run start
```

## Architecture

The codebase is intentionally layered so the whole app can be pointed at a
real Node.js/MySQL API later without touching any component code:

```
components/  → UI only, no localStorage access
  ↓ calls
services/    → business logic (ProfileService, SocialService, SeriesService…)
  ↓ calls
repositories/→ raw per-entity persistence (localRepository.ts)
  ↓ calls
utils/storage.ts → the only file that touches window.localStorage directly
```

When the backend is ready, swap `repositories/localRepository.ts` for
`fetch()`-based calls (or add a parallel `apiRepository.ts` and switch the
import) — `services/*` and every component keep working unchanged.

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

- `/login`, `/verify-otp` — mock auth (any email + any 6-digit OTP works)
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

## What's intentionally not built yet

Per the brief, this phase has no real backend: no MySQL, no Node.js APIs, no
auth/email/OTP/payment providers, no social or scraping APIs, no file
uploads. Photos and thumbnails are local `FileReader` previews only. The
`services/` layer is the seam designed for that future integration.
