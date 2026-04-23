# Contributing

See [CLAUDE.md](./CLAUDE.md) for full coding conventions. Below is a quick reference for the most critical rules.

## Setup

1. `npm install`
2. Create a local Postgres database: `createdb language_licks`
3. Copy `.env.sample` to `.env.local` and fill in the required variables (see [README.md](./README.md#environment-variables))
4. `npm run dev` — Payload runs with `push: true` in dev, so the schema auto-syncs on start
5. Visit [http://localhost:3000/seed](http://localhost:3000/seed) to seed lessons + tags

## Database

- Schema for Drizzle-owned tables lives in `src/lib/db/schema.ts`
- Drizzle tables are registered in `beforeSchemaInit` in `src/payload.config.ts`; Payload owns all migrations
- Before deploying, run `npm run payload:migrate:create` to generate a migration
- Lesson content uses JSON columns for `grammar` and `liaison_tips` arrays

## Naming Conventions

- **Interfaces** must be prefixed with `I`: `IMyInterface`
- **Types** must be prefixed with `T`: `TMyType`
- **Props type** is always named `Props` (no prefix — it's a local convention for component prop interfaces)
- **React components**: `MyComponent` (PascalCase, no prefix)
- **Functions**: `myFunction` (camelCase)
- **Variables**: `myVariable` (camelCase)

## Component Patterns

- Use `export default function ComponentName()` — no arrow functions
- CSS Modules: `import styles from "./Component.module.css"`
- Use `<img>` tags, not Next.js `Image` or SVG-as-component imports
- Don't explicitly import React unless needed

## Component Architecture

- **Atoms**: Styled, stateless components reused in 2+ places
- **Molecules**: Avoid — use wrapper atoms with `children` instead
- **Organisms**: Stateful components composed of atoms or custom sub-components

## Data Fetching

- Lesson data is fetched client-side via React Query hooks (`useLessons`, `useLesson`)
- API routes live in `src/app/api/`
- The lesson list endpoint returns lightweight data (id, sentence, translation)
- Full lesson detail (grammar, liaison tips) is fetched on demand when a lesson is opened
- Progress tracking currently uses localStorage via `useProgress`

## TypeScript

- Never use `any`

## Styling

- CSS Modules only — no inline styles
- Use CSS custom properties (`var(--text-color)`)
- Use `em` units only — never use `rem`
- Use `.container` / `.content` as wrapper classes

## JSX

- Never use ternary for conditional rendering — use `&&`
- Lift shared state to context; render separate components from the page level

## Free Tier

- Lessons flagged `isFree` on the Payload collection are fully accessible without an account
- Non-free lessons appear in the list, but opening one shows only a `SignUpPrompt` in place of the lesson content
- Access inside `LanguageCard` is a single check: `lesson.isFree || isPremium`
- Reviews in `Reviews` exclude non-free lessons for unauthenticated users; when premium lapses, `pauseNonFreeReviews` clears their scheduled reviews
- **Never** gate the lesson list itself — all lessons should be browsable by anyone
- Speech-check access is enforced inside `/api/speech/check` (not a separate token endpoint) — the route allows the request when the caller is premium or when `lesson.isFree` is true; audio is proxied to the Cloud Run service with a Google-signed ID token minted on the dyno

## Authentication

### Architecture

The app uses passwordless email OTP authentication with JWT tokens stored in httpOnly cookies. Auth is enforced at the **API route level**, not via middleware/proxy.

- **Auth utilities** live in `src/lib/auth/`
- **`requireAuth()`** is the single guard function — call it in any API route that needs authentication
- **Auth API routes** live in `src/app/api/auth/`
- **Client-side auth state** is provided by `useAuth()` hook in `src/lib/hooks/useAuth.ts`
- **Page routes are never protected server-side** — pages use `useAuth()` to show different UI based on login status

### Security Rules for Contributors

- **Never** store tokens in localStorage or sessionStorage — always use httpOnly cookies
- **Never** include PII (email, name) in JWT payloads — only store user ID and token version
- **Never** store OTP codes in plaintext — always hash them before writing to the database
- **Never** skip Origin header checking on mutating API routes
- **Always** set `httpOnly`, `secure`, `sameSite: "lax"` on auth cookies
- **Always** verify `tokenVersion` from the database when validating refresh tokens
- **Always** delete used OTP codes after successful verification
- **Always** delete expired OTP codes when generating new ones

### Auth Flow Reference

```
Email input → POST /api/auth/send-code → OTP email sent
Code input  → POST /api/auth/verify    → access + refresh cookies set
API request → requireAuth() verifies access token → returns user or throws AuthError
Token expired → POST /api/auth/refresh  → new access token issued
Logout      → POST /api/auth/logout    → cookies cleared
```

### Protecting an API Route

Call `requireAuth()` at the top of any route handler that needs auth. It returns `{ userId, tokenVersion }` or throws an `AuthError`:

```ts
import { requireAuth, AuthError } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    // ... fetch user-specific data
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
```

### Adding Sensitive Operations

For actions that require re-verification (e.g., email change, account deletion):

1. Trigger a new OTP challenge via `POST /api/auth/send-code`
2. Verify the code via `POST /api/auth/verify` with a `reverify` flag
3. Only proceed with the sensitive action after successful verification
