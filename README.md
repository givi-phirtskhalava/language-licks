# Language Licks

A language learning app for practicing sentence comprehension, writing, and speaking. Built with Next.js, PostgreSQL, and Drizzle ORM.

Each lesson presents a sentence in the target language with grammar breakdowns, liaison/pronunciation tips, writing practice, speaking practice, and a review test. Progress is tracked with a spaced repetition system.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Heroku Postgres)
- **ORM**: Drizzle (runtime/transactional tables)
- **CMS**: Payload 3 (content tables + admin UI at `/admin`)
- **Data Fetching**: React Query
- **Styling**: CSS Modules
- **Animations**: Motion (Framer Motion)

## Prerequisites

- Node.js 20+
- PostgreSQL (recommended: [Postgres.app](https://postgresapp.com/) on Mac)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local database:

```bash
createdb language_licks
```

3. Create a `.env.local` file:

```
DATABASE_URL=postgresql://localhost:5432/language_training
JWT_ACCESS_SECRET=     # openssl rand -base64 64
JWT_REFRESH_SECRET=    # openssl rand -base64 64 (must be different from access)
RESEND_API_KEY=        # from resend.com
EMAIL_FROM=            # verified sender in Resend
SPEECH_CHECK_JWT_SECRET=    # HS256 secret, must match the speech-check service gateway
NEXT_PUBLIC_SPEECH_CHECK_GATEWAY_URL=   # e.g. http://localhost:8080 in dev
```

4. Generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

5. Seed the database with lesson data:

```bash
npm run db:seed
```

6. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start development server                     |
| `npm run build`       | Build for production                         |
| `npm run start`       | Start production server                      |
| `npm run lint`        | Run ESLint                                   |
| `npm run db:generate` | Generate Drizzle migration files from schema changes |
| `npm run db:migrate`  | Apply pending Drizzle migrations             |
| `npm run db:seed`     | Seed the database with lesson + tag data     |
| `npm run db:studio`   | Open Drizzle Studio (DB browser)             |
| `npx payload migrate:create` | Generate a Payload migration from collection changes |
| `npx payload migrate` | Apply pending Payload migrations             |
| `npx payload migrate:status` | List which Payload migrations have run |

## Database

The app uses **one Postgres database** shared by two ORMs that own disjoint sets of tables. The split is deliberate: each tool is used where its strengths matter.

### Ownership split

| Tool        | Owns                                                                              | Why                                                                                                     |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Payload** | `lessons`, `tag-groups`, `media` (and Payload's internal bookkeeping tables)      | Content authored by humans. The admin UI, access control, and field validation are net wins here.       |
| **Drizzle** | `users`, `verification_codes`, `progress`, `daily_activity`                        | Runtime/transactional data written by the app on every interaction. Needs raw SQL control, low overhead, bulk operations, and isn't browsed in an admin UI. |

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

Schema lives in `src/lib/db/schema.ts`. Migrations are stored in `./drizzle/` and applied with the `db:migrate` script. Use `db:studio` to browse the data.

After changing `schema.ts`:

```bash
npm run db:generate   # diffs schema.ts against the DB and writes a SQL migration
npm run db:migrate    # applies pending migrations
```

### Payload (content)

Collections live in `src/collections/`, wired up in `src/payload.config.ts`. Generated TypeScript types are in `src/payload-types.ts`. The admin UI is at `/admin`.

Current collections:

- **lessons** — sentence, translation, grammar breakdown, liaison tips, language, tags (string array). Lessons reference tags by name (string), not by FK.
- **tag-groups** — one document per language. Each document has a nested array of groups; each group has a nested array of tags. Edit all groups + tags for a language on a single page.
- **media** — uploads (currently unused on the frontend, available for future use).
- **users** — Payload's auth-managed collection, used only for logging in to `/admin`. **Not** the same as the Drizzle `users` table that holds app accounts (see "Two `users` tables" below).

After changing a collection:

```bash
npx payload migrate:create   # generates a SQL migration under src/migrations/
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

Then either fetch that route from a custom admin view component (registered under `admin.components` in `payload.config.ts`) or build a separate Next.js page with the same auth check. This keeps the hot path off Payload while still giving admins a UI.

### Two `users` tables — known split

There are currently two collections both called `users`:

- **Drizzle `users`** (`src/lib/db/schema.ts`) — the app's actual user accounts: email, Paddle subscription, daily target, OTP-issued JWT auth. Used by every authenticated app route.
- **Payload `users`** (`src/collections/Users.ts`) — Payload's built-in auth collection, used only to log in to `/admin`.

These are separate identities in separate tables. App users do not get an admin login by signing up, and admin users do not appear in the Drizzle `users` table. This is fine while the admin is internal-only, but worth being aware of.

### Naming convention for app-facing API routes

To avoid collisions with Payload's REST API at `/api/<collection-slug>`, the app's own data-shaping routes are prefixed with `app-`:

- `/api/app-lessons` — lightweight lesson list for the lesson grid
- `/api/app-lessons/[id]` — full lesson detail
- `/api/app-tag-groups` — flattened tag groups for the filter modal

Without the prefix, a route like `/api/lessons/route.ts` would shadow Payload's `/api/lessons` REST endpoint and break the admin UI (this is what caused "Method Not Allowed" errors during development).

## Free Tier

The app is accessible without an account. Unauthenticated users get:

- **First 10 lessons**: Full access — lesson, writing practice, speaking practice, test, and reviews
- **Lessons 11+**: Lesson phase only (read the sentence, grammar, liaison tips). Writing practice, speaking practice, tests, and reviews require signing up.
- **Progress**: Stored in localStorage for both free and authenticated users

The free lesson count is configured via `FREE_LESSON_COUNT` in `src/lib/projectConfig.ts`.

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

Pronunciation scoring is powered by a self-hosted speech-check service (`language-licks-whisper-service`) running a French-specific wav2vec2 phoneme model (`Cnam-LMSSC/wav2vec2-french-phonemizer`) behind a TypeScript gateway. Only authenticated premium users can call it.

### Audio Format

Audio is captured client-side as **WAV** (16kHz, 16-bit, mono PCM). Recording auto-stops after **1.5 seconds of silence** following detected speech, or after a **15-second hard cap**.

### Architecture

1. The client requests a short-lived HS256 JWT from `POST /api/speech/token` (premium-gated, 15-minute TTL, cached at module scope).
2. The client captures PCM audio via `AudioContext`, encodes it as a WAV blob, and POSTs it directly to the speech-check gateway with the JWT as a bearer token.
3. The gateway verifies the JWT, applies per-IP and per-user rate limits, and proxies the request to the Python inference server.

The Next.js app only issues tokens — it never sees the audio. This keeps GPU traffic off the web tier.

### Speech API Routes

| Route | Method | Description |
|---|---|---|
| `/api/speech/token` | POST | Issues a short-lived JWT for the speech-check gateway (premium-only) |

### Running the speech-check service locally

The speech-check service lives in a sibling repo (`language-licks-whisper-service`) and is **not** started by `npm run dev`. It runs a Python inference server on `:8000` and a TypeScript gateway on `:8080`; both must be up for speech to work in dev.

1. Clone and install the service (from the parent directory of this repo):

   ```bash
   cd ../language-licks-whisper-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   (cd gateway && cp .env.example .env && npm install)
   ```

2. Generate a shared JWT secret:

   ```bash
   openssl rand -base64 64 | tr -d '\n'
   ```

   Paste the same value into **both** `language-licks-whisper-service/gateway/.env` (as `SPEECH_CHECK_JWT_SECRET`) and this app's `.env.local`. It must match byte-for-byte.

3. In this app's `.env.local`:

   ```
   SPEECH_CHECK_JWT_SECRET=<shared secret>
   NEXT_PUBLIC_SPEECH_CHECK_GATEWAY_URL=http://localhost:8080
   ```

4. Start Python + gateway in parallel (from the speech-check service repo root):

   ```bash
   ./dev.sh
   ```

   First run downloads the `Cnam-LMSSC/wav2vec2-french-phonemizer` weights (~360 MB) from Hugging Face; subsequent runs use the cache.

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
    api/
      auth/               # Auth API routes (send-code, verify, refresh, logout, me)
      app-lessons/        # App-facing lesson routes (prefixed to avoid clashing with Payload's /api/lessons)
      app-tag-groups/     # App-facing tag groups route
      speech/             # Speech recognition proxy and usage tracking
    login/                # Login page
    settings/             # Settings page
    reviews/              # Reviews page
    profile/              # Profile page
    page.tsx              # Home page (lesson list)
    layout.tsx            # Root layout
  collections/            # Payload collections (Lessons, TagGroups, Media, Users)
  components/
    atoms/                # Stateless, reusable UI components
    organisms/            # Stateful, composed components
  lib/
    auth/                 # JWT helpers, cookies, OTP, email, origin check, requireAuth
    db/                   # Drizzle connection, schema, seed
    hooks/                # React Query hooks (useLessons, useLesson, useAuth, useTags)
    providers/            # React Query provider
    types.ts              # Shared TypeScript interfaces
    projectConfig.ts      # Language configuration
    useProgress.ts        # SRS progress tracking (localStorage)
    useLanguage.ts        # Language selection state
  migrations/             # Payload-generated SQL migrations
  payload.config.ts       # Payload config (collections, db adapter, admin)
  payload-types.ts        # Generated Payload TypeScript types
```

## Deployment (Heroku)

The app runs on a single Heroku dyno with Heroku Postgres.

1. Create a Heroku app and add the Heroku Postgres addon
2. Set the `DATABASE_URL` config var (Heroku does this automatically with the addon)
3. Deploy via git push

The `Procfile` handles migrations automatically on each deploy. Both ORMs need to be migrated:

```
release: npm run db:migrate && npx payload migrate
web: npm run start
```

Order matters only if a single deploy adds tables in both systems that reference each other — currently they don't, so either order works. Both commands are idempotent and skip already-applied migrations.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for coding conventions and [CLAUDE.md](./CLAUDE.md) for full AI assistant instructions.
