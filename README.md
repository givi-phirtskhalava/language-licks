# Language Licks

A language learning app for practicing sentence comprehension, writing, and speaking. Built with Next.js, PostgreSQL, and Drizzle ORM.

Each lesson presents a sentence in the target language with grammar breakdowns, liaison/pronunciation tips, writing practice, speaking practice, and a review test. Progress is tracked with a spaced repetition system.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Heroku Postgres)
- **ORM**: Drizzle
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
WHISPER_JWT_SECRET=    # HS256 secret, must match the whisper-service gateway
NEXT_PUBLIC_WHISPER_GATEWAY_URL=   # e.g. http://localhost:8080 in dev
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
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate`  | Apply pending migrations                     |
| `npm run db:seed`     | Seed the database with lesson data           |
| `npm run db:studio`   | Open Drizzle Studio (DB browser)             |

## Database

### Schema

- **users** - User accounts with email, name, and selected language
- **lessons** - Lesson content per language (sentence, translation, grammar, liaison tips) stored with JSON columns
- **progress** - Per-user lesson progress tracking (phase, completion, SRS intervals)

### Migrations

Schema is defined in `src/lib/db/schema.ts`. After changing the schema:

```bash
npm run db:generate   # generates SQL migration in ./drizzle/
npm run db:migrate    # applies it to the database
```

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

Speech recognition is powered by a self-hosted Whisper service (`language-licks-whisper-service`) running `faster-whisper` (`large-v3`) behind a TypeScript gateway. Only authenticated premium users can call it.

### Audio Format

Audio is captured client-side as **WAV** (16kHz, 16-bit, mono PCM). Recording auto-stops after **1.5 seconds of silence** following detected speech, or after a **15-second hard cap**.

### Architecture

1. The client requests a short-lived HS256 JWT from `POST /api/speech/token` (premium-gated, 15-minute TTL, cached at module scope).
2. The client captures PCM audio via `AudioContext`, encodes it as a WAV blob, and POSTs it directly to the Whisper gateway with the JWT as a bearer token.
3. The gateway verifies the JWT, applies per-IP and per-user rate limits, and proxies the request to the Python inference server.

The Next.js app only issues tokens — it never sees the audio. This keeps GPU traffic off the web tier.

### Speech API Routes

| Route | Method | Description |
|---|---|---|
| `/api/speech/token` | POST | Issues a short-lived JWT for the Whisper gateway (premium-only) |

### Running the Whisper service locally

The Whisper service lives in a sibling repo (`language-licks-whisper-service`) and is **not** started by `npm run dev`. It runs a Python inference server on `:8000` and a TypeScript gateway on `:8080`; both must be up for speech to work in dev.

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

   Paste the same value into **both** `language-licks-whisper-service/gateway/.env` (as `WHISPER_JWT_SECRET`) and this app's `.env.local`. It must match byte-for-byte.

3. In this app's `.env.local`:

   ```
   WHISPER_JWT_SECRET=<shared secret>
   NEXT_PUBLIC_WHISPER_GATEWAY_URL=http://localhost:8080
   ```

4. Start Python + gateway in parallel (from the whisper-service repo root):

   ```bash
   ./dev.sh
   ```

   First run downloads the `large-v3` model weights (~3 GB) from Hugging Face; subsequent runs use the cache.

5. Sanity check:

   ```bash
   curl http://localhost:8080/healthz
   ```

See the whisper-service README for Docker, GPU, and deployment details.

## Project Structure

```
src/
  app/
    api/
      auth/               # Auth API routes (send-code, verify, refresh, logout, me)
      lessons/            # API routes for lesson data
      speech/             # Speech recognition proxy and usage tracking
    login/                # Login page
    settings/             # Settings page
    reviews/              # Reviews page
    profile/              # Profile page
    page.tsx              # Home page (lesson list)
    layout.tsx            # Root layout
  components/
    atoms/                # Stateless, reusable UI components
    organisms/            # Stateful, composed components
  lib/
    auth/                 # JWT helpers, cookies, OTP, email, origin check, requireAuth
    db/                   # Database connection, schema, seed
    hooks/                # React Query hooks (useLessons, useLesson, useAuth)
    providers/            # React Query provider
    types.ts              # Shared TypeScript interfaces
    projectConfig.ts      # Language configuration
    useProgress.ts        # SRS progress tracking (localStorage)
    useLanguage.ts        # Language selection state
```

## Deployment (Heroku)

The app runs on a single Heroku dyno with Heroku Postgres.

1. Create a Heroku app and add the Heroku Postgres addon
2. Set the `DATABASE_URL` config var (Heroku does this automatically with the addon)
3. Deploy via git push

The `Procfile` handles migrations automatically on each deploy:

```
release: npm run db:migrate
web: npm run start
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for coding conventions and [CLAUDE.md](./CLAUDE.md) for full AI assistant instructions.
