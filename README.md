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
AZURE_SPEECH_KEY=      # from Azure Portal → Speech service → Keys and Endpoint
AZURE_SPEECH_REGION=   # e.g. westeurope, eastus
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
- **speech_usage** - Monthly speech recognition usage per user (training and testing seconds)

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

## Speech Recognition & Pronunciation Assessment

Speech recognition is powered by Azure Speech SDK with Pronunciation Assessment. This replaces the browser's Web Speech API, which was unreliable across browsers and devices.

### Architecture

The Azure Speech SDK runs in the browser and streams audio directly to Azure via WebSocket for real-time processing. The API key is never exposed to the client.

1. The client calls `POST /api/speech/token` (requires authentication)
2. The server checks monthly usage limits, then uses the API key to request a short-lived token (10-min TTL) from Azure
3. The client receives the temporary token and uses it with the Azure Speech SDK to stream audio
4. After each recognition session, the client reports the audio duration to `POST /api/speech/usage`

This design serves two purposes: keeping the Azure API key on the server, and enforcing per-user usage limits before issuing tokens.

### Usage Limits

Each authenticated user gets per month:

| Mode | Limit | Use case |
|---|---|---|
| Training | 1 hour (3600s) | Writing/speaking practice sessions |
| Testing | 15 minutes (900s) | Review and test sessions |

Usage is tracked in the `speech_usage` table, keyed by user ID and month (`YYYY-MM` format). Limits are checked before issuing a token — once a user exceeds their allowance, the token endpoint returns 403.

### Pronunciation Feedback

Azure Pronunciation Assessment returns four scores with each recognition:

| Score | What it measures |
|---|---|
| Accuracy | How closely phonemes match native pronunciation |
| Fluency | Smoothness and natural pacing |
| Completeness | Ratio of pronounced words to expected words |
| Prosody | Stress, intonation, and rhythm |

Word-level accuracy scores are also returned. Words scoring below 60% are highlighted in the UI as needing work.

### Azure Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Speech" and create a Speech service resource (S0 / Standard tier)
3. Go to **Keys and Endpoint**, copy **Key 1** and the **Region**
4. Add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` to your `.env`

### Cost

Azure Speech real-time transcription with pronunciation assessment costs **$1 per audio hour**. At the current per-user limits (1h 15min/month), maximum cost per active user is approximately **$1.25/month**.

| Active users | Max monthly cost |
|---|---|
| 100 | $125 |
| 1,000 | $1,250 |
| 10,000 | $12,500 |

### Speech API Routes

| Route | Method | Description |
|---|---|---|
| `/api/speech/token` | POST | Issues a short-lived Azure token (checks auth + usage limits) |
| `/api/speech/usage` | GET | Returns current month's usage and limits |
| `/api/speech/usage` | POST | Reports audio duration after a session |

## Project Structure

```
src/
  app/
    api/
      auth/               # Auth API routes (send-code, verify, refresh, logout, me)
      lessons/            # API routes for lesson data
      speech/             # Speech token issuance and usage tracking
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
