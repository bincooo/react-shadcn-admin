---
paths:
  - 'src/**/*.{ts,tsx}'
---

# React component and hook patterns

## Composition

- Function components, defined at module scope. Never define a component inside another
  component — that remounts subtree state on every parent render.
- Prefer early returns over nested ternaries: `if (!iconOnly) return link` keeps the JSX shallow.
- Conditional rendering is `cond && <X />` (90 uses) rather than `cond ? <X /> : null` (3 uses).
  Use the ternary only when both branches are real.
- Mutually exclusive structures are named variants, not boolean matrices. `MenuVariant` +
  a `VARIANTS` lookup table beats `<Menu iconOnly floating collapsible />`.
- Booleans are for genuine optional capabilities (`iconOnly`, `disabled`, `loading`).
- Callers that own a structural section pass `children`/slots instead of a `renderX` prop.
- Keep the component API narrow. Every optional prop that cannot combine freely with another is
  a union waiting to be written.

## State and effects

- Derive during render; do not mirror props into state. `useState` holds user intent and
  external subscriptions only.
- Effects are for external synchronization (DOM listeners, timers, third-party instances) and
  always clean up. Chart instance lifecycle is the reference example.
- Lift state only when two consumers must coordinate. Otherwise keep it in the component that
  renders the changed UI.
- `useMemo`/`useCallback` when they stabilize a real dependency boundary or avoid measurable
  work — not as decoration. A `useMemo` over three primitives is noise.
- One state container per concern: a `…Sync` hook owns query → synchronized UI state so the
  page component stays declarative.

## Data flow

- Requests go through the shared `http` client and TanStack Query. Do not add a second fetching
  mechanism.
- Independent requests run in parallel; do not chain `await`s into a waterfall.
- Preserve existing cancellation, loading, and error behavior when refactoring a data flow —
  "it still shows data" is not proof that it still handles failure.

## Code splitting

- Route screens and optional libraries load behind dynamic `import()`; follow the existing lazy
  route pattern rather than importing a heavy module into the shell.
- ECharts is loaded from the chart wrapper, never into the initial bundle.
- Icons render by name through `common/icon` (`<Icon name="shield-user" />`), which uses
  `lucide-react/dynamic`. Do not add a static `name → component` map back in, and do not import
  individual icon modules just to avoid the dynamic path.

## Fast Refresh boundaries

- A file exports components **or** plain functions/constants — never both. When a component needs
  pure helpers, put them in a sibling module (`lib/icons/icon-name.ts` beside
  `common/icon.tsx`) so HMR keeps working.

## Skills

- `.agents/skills/vercel-react-best-practices` and `vercel-composition-patterns` are guidance for
  this Vite SPA. Adapt them; do not apply Next.js-only APIs, and do not mechanically rewrite
  working code to satisfy a rule that does not fit here.
