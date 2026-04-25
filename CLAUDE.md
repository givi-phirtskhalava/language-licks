@AGENTS.md

# Claude Instructions

## Component Patterns

- Use `export default function ComponentName()` instead of arrow functions
- Import styles as `import style from "./Component.module.css"`
- Don't use Next.js Image component, use regular HTML `img` tags
- Don't import SVGs as components — use `<img src=...>` instead
- Don't explicitly import React unless needed

## Atomic Components

- **Atoms**: Styled, stateless components used in at least 2 other components
- **Molecules**: AVOID USING — use wrapper atoms with children instead
- **Organisms**: Stateful components consisting of atoms or custom sub components

## Component Extraction

- If a component is repeated in its exact state in multiple places, extract it to a separate atom — a stateless visual component that receives props
- If the component is complex, has different use cases, or is heavily customized per usage, leave the instances individual — don't force a shared abstraction

## Naming Conventions

- React component files: `MyComponent`
- React components: `<MyComponent />`
- Functions: `function myFunction()`
- Variables: `const myVariable`
- Props type: `Props`
- Interfaces: `IMyCustomInterface`
- Types: `TMyCustomType`

## TypeScript

- Never use `any`

## Styling

- CSS modules with `import style from "./Component.module.css"`
- Use CSS custom properties like `var(--text-color)`
- Use em units only — never use rem
- Use `.container` and `.content` as wrapper classes
- Use `classNames` package for multiple classes: `classNames(style.base, condition && style.conditional)`
- Apply `box-sizing: border-box` globally
- Avoid inline styles — use `className` instead
- For inputs and buttons, use `min-height` to control height instead of vertical padding. Horizontal padding for spacing is fine

## Functions

- Avoid arrow functions for function declarations
- Use clear, descriptive function names
- Add line breaks between functions

## Animations

- CSS animations for simple animations
- Motion (Framer Motion) for DOM element transitions
- GSAP for complex animations

## Accessibility

- Don't disable default outline on focus states
- Ensure clear indicators for selected elements

## JSX Conditionals

- Never use ternary (`? :`) for conditional rendering in JSX — use `&&` instead
- For multiple states, use separate `{condition && <Component />}` blocks
- Lift shared state to context and render separate components from the page level rather than nesting conditionals inside one component

## Code Formatting

- Applies to ALL code (variable declarations, statements, expressions, JSX), not just JSX
- If consecutive elements/blocks/statements each fit on one line, don't add line breaks between them
- If any element/block/statement spans multiple lines, add a blank line before and after it to separate it from neighbors
- Example: three single-line `const` declarations stack with no breaks; but a multi-line chained `.filter().map().sort()` declaration needs a blank line before and after it, even when the next line is another `const`

## Database

- Schema for Drizzle-owned tables is defined in `src/lib/db/schema.ts` using Drizzle ORM
- Languages are configured in `src/lib/projectConfig.ts`, not stored in the database
- Lesson grammar and liaison tips are stored as JSON columns
- Use the `db` instance from `src/lib/db/index.ts` for all queries
- Payload owns `lessons`, `tag-groups`, `media`; Drizzle owns `users`, `verification_codes`, `progress`, `daily_activity`
- **When adding a Drizzle table**: add it to `src/lib/db/schema.ts` **and** register it in the `beforeSchemaInit` list in `src/payload.config.ts` — otherwise Payload will drop it
- **When adding a Payload collection**: make sure its slug/table name doesn't collide with a Drizzle table
- Payload owns all migrations. `beforeSchemaInit` pulls the Drizzle tables into Payload's schema so Payload creates and tracks them alongside its own tables
- In dev, Payload runs with `push: true` so schema changes auto-sync on dev server start — no migrations needed locally
- For prod: run `npm run payload:migrate:create` to generate a migration before deploying; the release phase runs `payload migrate`

## Data Fetching

- Lesson data is fetched client-side via React Query hooks in `src/lib/hooks/`
- `useLessons(language)` fetches the lightweight list (id, sentence, translation)
- `useLesson(id)` fetches full lesson detail on demand
- API routes live in `src/app/api/`
- Progress tracking uses localStorage via `useProgress` (keyed by lesson ID)
- React Query is configured with `staleTime: Infinity` — data is fetched once per session per key

## Communication

- Keep responses concise — user reviews code directly
- Do not explain what you've done after completing tasks — just do the work
- No explanations unless explicitly requested
- Do NOT add extra CSS, styles, or helper functions unless explicitly asked
- Only implement what is directly requested
- Do NOT delete console.log statements unless the logged value is no longer present in the code
