# Language Training

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
createdb language_training
```

3. Create a `.env.local` file:

```
DATABASE_URL=postgresql://localhost:5432/language_training
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

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed the database with lesson data |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

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

## Project Structure

```
src/
  app/
    api/lessons/          # API routes for lesson data
    settings/             # Settings page
    reviews/              # Reviews page
    profile/              # Profile page
    page.tsx              # Home page (lesson list)
    layout.tsx            # Root layout
  components/
    atoms/                # Stateless, reusable UI components
    organisms/            # Stateful, composed components
  lib/
    db/                   # Database connection, schema, seed
    hooks/                # React Query hooks (useLessons, useLesson)
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
