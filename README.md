# LanguageLicks

A language learning app for practicing sentence comprehension, writing, and speaking. Built with Next.js 16, PostgreSQL, Drizzle ORM, and Payload CMS.

Each lesson presents a sentence in the target language with grammar breakdowns, liaison/pronunciation tips, writing practice, speaking practice, and a review test. Progress is tracked with a spaced repetition system. French and Italian are supported.

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

| Var                                                 | Required | Purpose                                                                    |
| --------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                                      | yes      | Postgres connection string                                                 |
| `JWT_ACCESS_SECRET`                                 | yes      | HS256 secret for access tokens (15-min TTL)                                |
| `JWT_REFRESH_SECRET`                                | yes      | HS256 secret for refresh tokens (90-day TTL). **Must differ** from access. |
| `RESEND_API_KEY`                                    | yes      | Resend API key used to send OTP emails                                     |
| `EMAIL_FROM`                                        | yes      | Verified sender address in Resend                                          |
| `PAYLOAD_SECRET`                                    | yes      | Secret used to sign Payload admin sessions                                 |
| `INITIAL_ADMIN_EMAIL`                               | yes      | Email of the first admin user created on boot                              |
| `SPEECH_CHECK_JWT_SECRET`                           | yes      | Shared secret with the speech-check gateway (byte-for-byte match)          |
| `NEXT_PUBLIC_SPEECH_CHECK_GATEWAY_URL`              | yes      | Public URL of the speech-check gateway (e.g. `http://localhost:8080`)      |
| `PADDLE_API_KEY`                                    | yes      | Paddle server-side key (sandbox for dev, prod for prod)                    |
| `PADDLE_WEBHOOK_SECRET`                             | yes      | Used to verify Paddle webhook signatures                                   |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`                   | yes      | Paddle client token (exposed to the browser)                               |
| `NEXT_PUBLIC_PADDLE_PRICE_ID`                       | yes      | Paddle price ID for the subscription product                               |
| `NEXT_PUBLIC_PADDLE_ENV`                            | yes      | `sandbox` or `production`                                                  |
| `GCS_PROJECT_ID` / `GCS_BUCKET` / `GCS_CREDENTIALS` | no       | Google Cloud Storage for Payload media uploads. Optional in dev.           |

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

| Route                      | Purpose                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/api/app-lessons`         | Lightweight lesson list (id, sentence, translation)                                                                         |
| `/api/app-lessons/[id]`    | Full lesson detail                                                                                                          |
| `/api/app-tag-groups`      | Flattened tag groups for filters                                                                                            |
| `/api/auth/send-code`      | Email the user a 6-digit OTP                                                                                                |
| `/api/auth/verify`         | Verify OTP, issue access + refresh cookies                                                                                  |
| `/api/auth/refresh`        | Silently renew access token via refresh cookie                                                                              |
| `/api/auth/logout`         | Clear auth cookies                                                                                                          |
| `/api/auth/me`             | Return the current user (or 401)                                                                                            |
| `/api/billing/*`           | Paddle checkout / portal / cancel endpoints                                                                                 |
| `/api/paddle/webhook`      | Paddle subscription webhook                                                                                                 |
| `/api/progress`            | Read/write per-lesson progress for the current user                                                                         |
| `/api/progress/sync`       | Bulk upload local progress on first login                                                                                   |
| `/api/progress/clear`      | Wipe progress for the current user                                                                                          |
| `/api/daily-activity`      | Per-day lessons/reviews count (for streak)                                                                                  |
| `/api/daily-activity/sync` | Bulk upload local daily-activity log on first login                                                                         |
| `/api/speech/token`        | Mint a 15-min HS256 JWT for the speech-check gateway (body: `{ lessonId }`; allowed if lesson is free or caller is premium) |
| `/api/seed`                | Dev-only: run `runSeed()` against the DB                                                                                    |

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

Pronunciation scoring is powered by a self-hosted [`language-licks-speech-check`](../language-licks-speech-check) service running language-specific wav2vec2 phoneme models (`Cnam-LMSSC/wav2vec2-french-phonemizer` for French, `Cnam-LMSSC/wav2vec2-italian-phonemizer` for Italian) behind a TypeScript gateway. Only authenticated premium users can call it.

### Audio Format

Audio is captured client-side as **WAV** (16kHz, 16-bit, mono PCM). Recording auto-stops after **1.5 seconds of silence** following detected speech, or after a **15-second hard cap**.

### Architecture

1. The client requests a short-lived HS256 JWT from `POST /api/speech/token` with the target `lessonId`. The server allows anonymous callers for free lessons and requires premium for paid lessons. For non-premium callers the JWT carries a `lessonId` claim and the client must pass `lessonId` as a query param to the gateway, which rejects mismatches. Premium tokens carry no lesson claim (universal access). Tokens have a 15-minute TTL and are cached at module scope, keyed by lesson.
2. The client captures PCM audio via `AudioContext`, encodes it as a WAV blob, and POSTs it directly to the speech-check gateway with the JWT as a bearer token.
3. The gateway verifies the JWT, applies per-IP and per-user rate limits, and proxies the request to the Python inference server.

The Next.js app only issues tokens — it never sees the audio. This keeps GPU traffic off the web tier.

### Running the speech-check service locally

The speech-check service lives in a sibling repo (`language-licks-speech-check`) and is **not** started by `npm run dev`. It runs a Python inference server on `:8000` and a TypeScript gateway on `:8080`; both must be up for speaking practice to work in dev.

1. Clone and install the service (from the parent directory of this repo):

   ```bash
   cd ../language-licks-speech-check
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   (cd gateway && cp .env.example .env && npm install)
   ```

2. Generate a shared JWT secret:

   ```bash
   openssl rand -base64 64 | tr -d '\n'
   ```

   Paste the same value into **both** `language-licks-speech-check/gateway/.env` (as `SPEECH_CHECK_JWT_SECRET`) and this app's `.env.local`. It must match byte-for-byte.

3. In this app's `.env.local`:

   ```
   SPEECH_CHECK_JWT_SECRET=<shared secret>
   NEXT_PUBLIC_SPEECH_CHECK_GATEWAY_URL=http://localhost:8080
   ```

4. Start Python + gateway in parallel (from the speech-check service repo root):

   ```bash
   ./dev.sh
   ```

   First run downloads the CNAM-LMSSC phonemizer weights (~360 MB per language) from Hugging Face; subsequent runs use the cache.

5. Sanity check:

   ```bash
   curl http://localhost:8080/healthz
   ```

See the speech-check service README for Docker, GPU, and deployment details.

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
      speech/             # Mints short-lived JWTs for the speech-check gateway
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
    useSpeechCheck.ts     # Mic recording + gateway call
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
