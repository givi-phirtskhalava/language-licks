# Contributing

See [CLAUDE.md](./CLAUDE.md) for full coding conventions. Below is a quick reference for the most critical rules.

## Setup

1. `npm install`
2. Create a local Postgres database: `createdb language_training`
3. Copy `.env.example` to `.env.local` and set your `DATABASE_URL`
4. `npm run db:generate && npm run db:migrate && npm run db:seed`
5. `npm run dev`

## Database

- Schema lives in `src/lib/db/schema.ts`
- After changing the schema, run `npm run db:generate` to create a migration, then `npm run db:migrate` to apply it
- Use `npm run db:studio` to browse the database visually
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
