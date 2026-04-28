# LanguageLicks

A language learning app for practicing sentence comprehension, writing, and speaking. Built with Next.js 16, PostgreSQL, Drizzle ORM, and Payload CMS.

Each lesson presents a sentence in the target language with grammar breakdowns, writing practice, speaking practice, and a review test. Progress is tracked with a spaced repetition system. French and Italian are supported.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Heroku Postgres in prod)
- **ORM**: Drizzle (runtime/transactional tables)
- **CMS**: Payload 3 (content tables + admin UI at `/admin`)
- **Data Fetching**: React Query
- **Auth**: Passwordless email OTP + HS256 JWT in httpOnly cookies
- **Billing**: Paddle (sandbox in dev, production in prod)
- **Speech scoring**: Self-hosted [`language-licks-speech-check`](../language-licks-speech-check) service (sibling repo)
- **Styling**: CSS Modules
- **Animations**: Motion (Framer Motion)

## Prerequisites

- Node.js 22+
- PostgreSQL (recommended: [Postgres.app](https://postgresapp.com/) on Mac)
- The sibling `language-licks-speech-check` repo cloned next to this one, if you want speaking practice to work locally

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local database:

   ```bash
   createdb language_training
   ```

3. Copy `.env.sample` to `.env.local` and fill it in. See [Environment Variables](#environment-variables) for what each value is for.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Payload runs with `push: true` in dev, so the schema auto-syncs on start — no migration step needed.

5. Seed the database with lesson + tag data — visit [http://localhost:3000/seed](http://localhost:3000/seed) and run the seeder (dev-only; the `/api/seed` route is a 404 in production).

6. (Optional) Start the speech-check service if you want to test speaking practice. See [Running the speech-check service locally](#running-the-speech-check-service-locally).

## Environment Variables

All vars live in `.env.local` (gitignored). A template is in `.env.sample`.

| Var                                                 | Required | Purpose                                                                                                                                            |
| --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                      | yes      | Postgres connection string                                                                                                                         |
| `JWT_ACCESS_SECRET`                                 | yes      | HS256 secret for access tokens (15-min TTL)                                                                                                        |
| `JWT_REFRESH_SECRET`                                | yes      | HS256 secret for refresh tokens (90-day TTL). **Must differ** from access.                                                                         |
| `RESEND_API_KEY`                                    | yes      | Resend API key used to send OTP emails                                                                                                             |
| `EMAIL_FROM`                                        | yes      | Verified sender address in Resend                                                                                                                  |
| `PAYLOAD_SECRET`                                    | yes      | Secret used to sign Payload admin sessions                                                                                                         |
| `INITIAL_ADMIN_EMAIL`                               | yes      | Email of the first admin user created on boot                                                                                                      |
| `SPEECH_CHECK_URL`                                  | yes      | Base URL of the speech-check Cloud Run service (or `http://localhost:8000` in dev)                                                                 |
| `GCP_SA_KEY`                                        | prod     | JSON of a service account with `roles/run.invoker` on the speech-check service. **Omit in dev** — the route skips IAM when `NODE_ENV=development`. |
| `SPEECH_CHECK_MAX_AUDIO_BYTES`                      | no       | Upload cap in bytes (default `491520`)                                                                                                             |
| `SPEECH_CHECK_PER_USER_RPM`                         | no       | Per-user rate limit, requests per minute (default `60`)                                                                                            |
| `PADDLE_API_KEY`                                    | yes      | Paddle server-side key (sandbox for dev, prod for prod)                                                                                            |
| `PADDLE_WEBHOOK_SECRET`                             | yes      | Used to verify Paddle webhook signatures                                                                                                           |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`                   | yes      | Paddle client token (exposed to the browser)                                                                                                       |
| `NEXT_PUBLIC_PADDLE_PRICE_ID`                       | yes      | Paddle price ID for the subscription product                                                                                                       |
| `NEXT_PUBLIC_PADDLE_ENV`                            | yes      | `sandbox` or `production`                                                                                                                          |
| `GCS_PROJECT_ID` / `GCS_BUCKET` / `GCS_CREDENTIALS` | no       | Google Cloud Storage for Payload media uploads. Optional in dev.                                                                                   |
| `GOOGLE_OAUTH_CLIENT_ID`                            | yes      | OAuth client ID for the admin panel sign-in flow                                                                                                   |
| `GOOGLE_OAUTH_CLIENT_SECRET`                        | yes      | OAuth client secret matching `GOOGLE_OAUTH_CLIENT_ID`                                                                                              |
| `GOOGLE_OAUTH_REDIRECT_URI`                         | yes      | Callback URL — must match the value registered in Google Cloud Console exactly                                                                     |
| `GOOGLE_WORKSPACE_DOMAIN`                           | no       | Restrict admin sign-in to a Workspace domain via the `hd` claim (set to `languagelicks.com`)                                                       |

Generate JWT secrets with:

```bash
openssl rand -base64 64 | tr -d '\n'
```

## Scripts

| Script                           | Description                                          |
| -------------------------------- | ---------------------------------------------------- |
| `npm run dev`                    | Start development server                             |
| `npm run build`                  | Build for production                                 |
| `npm run start`                  | Start production server                              |
| `npm run lint`                   | Run ESLint                                           |
| `npm run payload:migrate:create` | Generate a Payload migration from collection changes |
| `npm run payload:migrate`        | Apply pending Payload migrations                     |
| `npm run payload:migrate:status` | List which Payload migrations have run               |

## Database

The app uses **one Postgres database** shared by two ORMs that own disjoint sets of tables. Each tool is used where its strengths matter.

### Ownership split

| Tool        | Owns                                                                            | Why                                                                                               |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Payload** | `lessons`, `tag-groups`, `media`, `admins` (and Payload's internal bookkeeping) | Content authored by humans. The admin UI, access control, and field validation are net wins here. |
| **Drizzle** | `users`, `verification_codes`, `progress`, `daily_activity`                     | Runtime/transactional data written on every interaction. Needs raw SQL control and low overhead.  |

**Rule of thumb**: if a non-developer would ever edit it, it goes in Payload. If the app writes to it on every lesson interaction, it goes in Drizzle.

### Registering Drizzle tables with Payload

Payload's postgres adapter will drop/ignore any tables it doesn't know about. To keep Drizzle-owned tables safe, they are registered with Payload via the `beforeSchemaInit` hook in `src/payload.config.ts`:

```ts
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL || "" },
  beforeSchemaInit: [
    ({ schema }) => ({
      ...schema,
      tables: {
        ...schema.tables,
        users,
        verificationCodes,
        progress,
        dailyActivity,
      },
    }),
  ],
}),
```

**When adding a new Drizzle table**: add it to `src/lib/db/schema.ts` **and** register it in the `beforeSchemaInit` list in `src/payload.config.ts`. Forgetting the second step means Payload will try to drop the table on its next migration. Table names must also not collide with any Payload collection slug.

### Drizzle (runtime data)

Schema lives in `src/lib/db/schema.ts`. Drizzle tables are registered in `beforeSchemaInit` inside `src/payload.config.ts`, so Payload owns the migrations for them — no separate Drizzle migration step.

After changing `schema.ts`, generate a Payload migration before deploying (see below).

### Payload (content)

Collections live in `src/collections/`, wired up in `src/payload.config.ts`. Generated TypeScript types are in `src/payload-types.ts`. The admin UI is at `/admin`.

Current collections:

- **lessons** — sentence, translation, grammar breakdown, liaison tips, language, tags (string array). Lessons reference tags by name (string), not by FK.
- **tag-groups** — one document per language. Each document has a nested array of groups; each group has a nested array of tags. Edit all groups + tags for a language on a single page.
- **media** — uploads used by Payload admin (GCS-backed in prod).
- **admins** — Payload's auth-managed collection, used only for logging in to `/admin`. **Not** the same as the Drizzle `users` table that holds app accounts (see [Two user tables](#two-user-tables)).

After changing a collection:

```bash
npx payload migrate:create   # generates a migration; run this whenever collection config changes
npx payload migrate          # applies pending migrations
```

`push: false` is set on the postgres adapter, so the dev server will **not** auto-sync schema. Migrations are the only way to change the DB. This is intentional — push is interactive, non-transactional in places, and leaves the DB in half-applied states when it fails. Migrations are reviewable, reproducible, and run the same in dev and prod.

### Bridging Drizzle data into the Payload admin

When you want to surface Drizzle-managed data (e.g. user progress) inside the admin UI, **don't** move it into a Payload collection. Instead, write a normal Next.js route that queries Drizzle directly, and gate it on the Payload session:

```ts
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });
const { user } = await payload.auth({ headers: await nextHeaders() });
if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
// ...query Drizzle, return JSON
```

Then either fetch that route from a custom admin view component (registered under `admin.components` in `payload.config.ts`) or build a separate Next.js page with the same auth check.

### Two user tables

There are two distinct user-like tables, intentionally:

- **Drizzle `users`** (`src/lib/db/schema.ts`) — the app's actual user accounts: email, Paddle subscription, daily target, OTP-issued JWT auth. Used by every authenticated app route.
- **Payload `admins`** (`src/collections/Admins.ts`) — Payload's built-in auth collection, used only to log in to `/admin`.

App users do not get an admin login by signing up; admins do not appear in the Drizzle `users` table. Fine while the admin is internal-only.

### Naming convention for app-facing API routes

To avoid collisions with Payload's REST API at `/api/<collection-slug>`, the app's own data-shaping routes are prefixed with `app-`:

- `/api/app-lessons` — lightweight lesson list for the lesson grid
- `/api/app-lessons/[id]` — full lesson detail
- `/api/app-tag-groups` — flattened tag groups for the filter modal

Without the prefix, a route like `/api/lessons/route.ts` would shadow Payload's `/api/lessons` REST endpoint and break the admin UI.

## App Routes

### Pages (under `src/app/(frontend)/`)

| Route           | Purpose                                      |
| --------------- | -------------------------------------------- |
| `/`             | Home / lesson list                           |
| `/lessons/[id]` | Single lesson detail + practice flow         |
| `/reviews`      | Due reviews for the user's selected language |
| `/login`        | Email OTP login                              |
| `/profile`      | Account / subscription / daily target        |
| `/settings`     | App settings (language, dev tools)           |
| `/faq`          | FAQ / help                                   |
| `/seed`         | Dev-only seed runner (hits `/api/seed`)      |

### API routes (under `src/app/api/`)

| Route                      | Purpose                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/app-lessons`         | Lightweight lesson list (id, sentence, translation)                                                                                                                                             |
| `/api/app-lessons/[id]`    | Full lesson detail                                                                                                                                                                              |
| `/api/app-tag-groups`      | Flattened tag groups for filters                                                                                                                                                                |
| `/api/auth/send-code`      | Email the user a 6-digit OTP                                                                                                                                                                    |
| `/api/auth/verify`         | Verify OTP, issue access + refresh cookies                                                                                                                                                      |
| `/api/auth/refresh`        | Silently renew access token via refresh cookie                                                                                                                                                  |
| `/api/auth/logout`         | Clear auth cookies                                                                                                                                                                              |
| `/api/auth/me`             | Return the current user (or 401)                                                                                                                                                                |
| `/api/billing/*`           | Paddle checkout / portal / cancel endpoints                                                                                                                                                     |
| `/api/paddle/webhook`      | Paddle subscription webhook                                                                                                                                                                     |
| `/api/progress`            | Read/write per-lesson progress for the current user                                                                                                                                             |
| `/api/progress/sync`       | Bulk upload local progress on first login                                                                                                                                                       |
| `/api/progress/clear`      | Wipe progress for the current user                                                                                                                                                              |
| `/api/daily-activity`      | Per-day lessons/reviews count (for streak)                                                                                                                                                      |
| `/api/daily-activity/sync` | Bulk upload local daily-activity log on first login                                                                                                                                             |
| `/api/speech/check`        | Proxy audio to the speech-check service after verifying the session, premium status (or `lesson.isFree`), and per-user rate limit. Adds a Google-signed ID token so Cloud Run accepts the call. |
| `/api/seed`                | Dev-only: run `runSeed()` against the DB                                                                                                                                                        |

## Free Tier

The app is accessible without an account. Unauthenticated users get:

- **Free lessons**: Full access — lesson, writing practice, speaking practice, and reviews
- **Paid lessons**: Shown in the list, but opening one renders only a signup prompt
- **Progress**: Stored in localStorage for both free and authenticated users; synced to the DB on login.

Free vs. paid is controlled by the `isFree` boolean on each Payload lesson, curated in the admin UI.

## Authentication

### Method: Passwordless Email OTP

Users authenticate via a one-time code sent to their email. There are no passwords — email ownership is the identity proof.

**Login flow:**

1. User enters their email address
2. Server generates a 6-digit code with a 10-minute expiry
3. Code is sent to the user's email via Resend
4. User enters the code
5. Server verifies the code, issues an access token and a refresh token
6. User is authenticated

### Token Strategy

| Token         | Storage         | Lifetime   | Purpose                       |
| ------------- | --------------- | ---------- | ----------------------------- |
| Access token  | httpOnly cookie | 15 minutes | Authenticates API requests    |
| Refresh token | httpOnly cookie | 90 days    | Silently renews access tokens |

When the access token expires, the refresh token is used to issue a new one without user interaction. The user stays logged in until the refresh token expires or is revoked.

### Token Revocation

Each user has a `tokenVersion` column in the database. Every issued JWT includes the current `tokenVersion` in its payload. On verification, the server checks that the JWT's version matches the database value.

- **Single user revocation**: Increment the user's `tokenVersion` — all their existing tokens become invalid immediately.
- **Global revocation**: Rotate both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — all tokens for all users are invalidated.

### Re-verification for Sensitive Operations

Certain actions (changing email, deleting account) require a fresh OTP challenge before proceeding, even if the user is already logged in.

## Admin Authentication

The Payload admin panel (`/admin`) is protected by **Google OAuth**, locked to the `languagelicks.com` Workspace. Email/password login is disabled — admins sign in only with their Workspace Google account.

### Flow

1. Browser hits `/admin/*`
2. `proxy.ts` checks for the `admin-session` cookie. Missing or invalid → redirect to `/api/admin/google/start`
3. Start route generates state + PKCE, redirects to Google with `hd=languagelicks.com` and `prompt=select_account`
4. User picks a Google account → Google redirects to `/api/admin/google/callback`
5. Callback verifies state, exchanges code via [`arctic`](https://arcticjs.dev/), and validates the ID token against Google's JWKS (issuer, audience, `email_verified`, `hd`)
6. Looks up the admin record by email — must already exist; the callback never auto-creates admins
7. Issues a 12h `admin-session` JWT (HS256, signed with `PAYLOAD_SECRET`) as an HttpOnly cookie
8. A custom Payload auth strategy on the `admins` collection reads this cookie on every request and resolves the admin user

### Adding an admin

There's no self-signup. Create the admin record manually in Payload first, with the user's Workspace email. They can then sign in via Google.

### Roles

Two roles, derived not from a DB column but from the env:

- **Super admin** — whoever's email matches `INITIAL_ADMIN_EMAIL` (case-insensitive). Full CRUD on every collection.
- **Editor** — every other admin record, scoped to the languages in their `allowedLanguages` field (set by the super admin in the Payload UI).

| Collection   | Super admin | Editor                                                                                                                 |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `admins`     | full CRUD   | read self only                                                                                                         |
| `lessons`    | full CRUD   | read / create / update only where `language ∈ allowedLanguages`; no delete                                             |
| `media`      | full CRUD   | create + read; no update/delete                                                                                        |
| `tag-groups` | full CRUD   | read + update only their language; can add tags but cannot reassign the `language` field, create new groups, or delete |

The super-admin check lives in `src/lib/adminAuth/access.ts`. To make a different admin the super admin, change `INITIAL_ADMIN_EMAIL` and restart — no migration needed.

To add an editor: super admin creates a new admin record, sets `allowedLanguages` to (e.g.) `["french"]`, and the editor signs in with their Workspace Google account.

### Logout

`GET /api/admin/logout` clears `admin-session` and redirects to `/`. **It does not sign the user out of Google itself** — that's a property of OAuth. The logout button in the admin nav fires a `confirm()` warning the admin to also sign out of `accounts.google.com` if they're on a shared computer.

### OAuth clients per environment

Each environment has its own OAuth client in its own Google Cloud project:

| Env   | Cloud project         | Authorized redirect URI                                       |
| ----- | --------------------- | ------------------------------------------------------------- |
| Dev   | `languagelicks-stage` | `http://localhost:3000/api/admin/google/callback`             |
| Stage | `languagelicks-stage` | `https://staging.languagelicks.com/api/admin/google/callback` |
| Prod  | `languagelicks-prod`  | `https://languagelicks.com/api/admin/google/callback`         |

Each client gives its own `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`. Store them per-environment (`.env.local` for dev, `heroku config:set` for stage/prod). The `GOOGLE_OAUTH_REDIRECT_URI` env var must match the registered URI character-for-character (scheme, host, path, no trailing slash).

### Setting up a new OAuth client

1. Cloud Console → APIs & Services → **OAuth consent screen** → User Type: **Internal** (Workspace-only). App name `LanguageLicks Admin`. Support + developer email = your address.
2. **Credentials → Create Credentials → OAuth Client ID** → Web application
3. Add the authorized redirect URI for the environment
4. Copy the Client ID + Secret into the matching env vars

### Recovery (locked out)

If OAuth is misconfigured and you can't sign in:

1. In `src/collections/Admins.ts`, change `disableLocalStrategy` to `false`
2. Restart dev — Payload re-enables password login (with `push: true` in dev, the schema syncs)
3. Use the forgot-password flow (Resend is wired up) to set a new password and sign in
4. Fix the OAuth setup, restore `disableLocalStrategy: { enableFields: true, optionalPassword: true }`, restart

## Security

### Cookie Configuration

All auth cookies are set with:

| Flag       | Value  | Purpose                                                         |
| ---------- | ------ | --------------------------------------------------------------- |
| `httpOnly` | `true` | Prevents JavaScript from reading the token — mitigates XSS      |
| `secure`   | `true` | Cookie is only sent over HTTPS                                  |
| `sameSite` | `lax`  | Cookie is not sent on cross-site POST requests — mitigates CSRF |
| `path`     | `/`    | Cookie is available to all routes                               |

### CSRF Protection

- **`SameSite=Lax` cookies**: The browser does not send auth cookies on cross-origin POST/PUT/DELETE requests. This blocks the primary CSRF attack vector.
- **Origin header checking**: API routes that mutate data verify that the `Origin` header matches the app's domain. Requests from unknown origins are rejected.

### Additional Measures

- OTP codes expire after 10 minutes and are single-use
- OTP codes are hashed before storage (not stored in plaintext)
- Failed verification attempts are rate-limited
- Tokens contain minimal claims (user ID, token version) — no PII in the payload

## Speech Recognition

Pronunciation scoring is powered by a self-hosted [`language-licks-speech-check`](../language-licks-speech-check) service running language-specific wav2vec2 phoneme models (`Cnam-LMSSC/wav2vec2-french-phonemizer` for French, `Cnam-LMSSC/wav2vec2-italian-phonemizer` for Italian). It runs on Google Cloud Run with IAM-only ingress. This Next.js app is the **only** caller.

### Audio Format

Audio is captured client-side as **WAV** (16kHz, 16-bit, mono PCM). Recording auto-stops after **1.5 seconds of silence** following detected speech, or after a **15-second hard cap**.

### Architecture

1. The client captures PCM audio via `AudioContext`, encodes it as a WAV blob, and POSTs it to `/api/speech/check` (same-origin, session cookie auto-included).
2. The route:
   - runs `requireAuth()` to identify the user,
   - applies a per-user in-memory rate limit,
   - pre-checks `Content-Length` against `SPEECH_CHECK_MAX_AUDIO_BYTES`,
   - verifies access — allowed if the user is premium, or the lesson has `isFree: true`,
   - mints a short-lived Google ID token using `GCP_SA_KEY` (cached on the dyno, refreshed ~hourly by `google-auth-library`),
   - proxies the audio to `SPEECH_CHECK_URL/transcribe` with that token as `Authorization: Bearer …`.
3. Cloud Run validates the ID token at the edge before the scorer container ever sees the request. The scorer runs inference and returns the per-word match scores, which we pipe straight back to the browser.

Ingress on the scorer is restricted to one service account; there is no other path to reach it from the internet.

### Running the speech-check service locally

The speech-check service lives in a sibling repo (`language-licks-speech-check`) and is **not** started by `npm run dev`. It runs a Python inference server on `:8000`.

1. Clone and install the service (from the parent directory of this repo):

   ```bash
   cd ../language-licks-speech-check
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. In this app's `.env.local`:

   ```
   SPEECH_CHECK_URL=http://localhost:8000
   ```

   Do **not** set `GCP_SA_KEY` in dev — when `NODE_ENV=development`, the `/api/speech/check` route skips the ID-token mint and sends plain HTTP to `SPEECH_CHECK_URL`. The local Python server has no auth of its own.

3. Start the Python server (from the speech-check repo root):

   ```bash
   ./dev-python.sh
   ```

   First run downloads the CNAM-LMSSC phonemizer weights (~360 MB per language) from Hugging Face; subsequent runs use the cache.

4. Sanity check:

   ```bash
   curl http://localhost:8000/healthz
   ```

See the speech-check service README for Cloud Run deployment, IAM setup, and Docker details.

## Project Structure

```
src/
  app/
    (payload)/            # Payload's mounted admin + REST API (/admin, /api/[...slug])
    (frontend)/           # User-facing pages (home, lessons, reviews, login, profile, settings, faq, seed)
    api/
      auth/               # Email OTP: send-code, verify, refresh, logout, me
      app-lessons/        # App-facing lesson list + detail (prefixed to avoid Payload collision)
      app-tag-groups/     # App-facing tag groups for the filter UI
      billing/            # Paddle checkout / portal / cancel
      paddle/             # Paddle webhook receiver
      progress/           # Per-user lesson progress (GET/POST + sync + clear)
      daily-activity/     # Per-day lessons/reviews counts for streaks
      speech/             # /api/speech/check — proxies audio to the speech-check Cloud Run service
      seed/               # Dev-only seed runner
  collections/            # Payload collections (Admins, Lessons, TagGroups, Media)
  components/
    atoms/                # Stateless, reusable UI components
    organisms/            # Stateful, composed components
  lib/
    auth/                 # JWT helpers, cookies, OTP, email, origin check, requireAuth/requirePremium
    db/                   # Drizzle connection, schema, seed
    hooks/                # React Query hooks (useLessons, useLesson, useAuth, useTags, ...)
    providers/            # React Query provider
    types.ts              # Shared TypeScript interfaces
    projectConfig.ts      # Language configuration + free-lesson count
    useProgress.ts        # SRS progress tracking (localStorage → DB on login)
    useLanguage.ts        # Language selection state
    useSpeechCheck.ts     # Mic recording + POST to /api/speech/check
  payload.config.ts       # Payload config (collections, db adapter, admin, beforeSchemaInit)
  payload-types.ts        # Generated Payload TypeScript types
drizzle/                  # Drizzle-generated SQL migrations
```

Note: Payload-generated migrations will appear under `src/migrations/` after the first `npx payload migrate:create`.

## Deployment (Heroku)

The app runs on a single Heroku dyno with Heroku Postgres.

1. Create a Heroku app and add the Heroku Postgres addon
2. Set the config vars from [Environment Variables](#environment-variables) (`DATABASE_URL` is wired automatically by the addon)
3. Deploy via git push

The `Procfile` handles migrations automatically on each release:

```
release: npx payload migrate
web: npm run start
```

`payload migrate` is idempotent and skips already-applied migrations. It creates both Payload-owned and Drizzle-owned tables (Drizzle tables are pulled into Payload's schema via `beforeSchemaInit`).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for coding conventions and [CLAUDE.md](./CLAUDE.md) for full AI assistant instructions.
