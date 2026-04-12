# Contributing

See [CLAUDE.md](./CLAUDE.md) for full coding conventions. Below is a quick reference for the most critical rules.

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
