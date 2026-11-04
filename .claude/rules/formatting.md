---
paths:
  - '**/*.{js,jsx,ts,tsx,json,css,md,yml,yaml,mjs}'
---

# Formatting and static checks

## Prettier owns layout

- Never hand-format. Config is the contract: single quotes, no semicolons, 2-space indent,
  80-column print width, trailing commas everywhere, parenthesized arrow parameters, LF.
- `prettier-plugin-tailwindcss` sorts Tailwind classes and reads `src/index.css`; do not
  maintain a competing order by hand.
- Run `prettier --write` on **every touched file** before `pnpm run check`. Editing an import
  or reordering JSX almost always changes formatting, and `format:check` fails on the diff.

## Import order

We do not use an import-sorting plugin, so the order is a convention. Keep it in every file:

1. React and its ecosystem (`react`, `react-dom`, `react-router`, `react-i18next`)
2. Other third-party packages (`lucide-react`, `@tanstack/*`, `echarts`, …)
3. `@/` aliases, deepest-independent module first — `@/components/*`, then `@/lib/*`,
   `@/api/*`, `@/store/*`, `@/hooks/*`, `@/config/*`, `@/types`
4. Relative imports (`./`, `../`), closest last

Rules of thumb that actually match the code:

- No blank lines between import statements; the block stays contiguous.
- `import type` sits next to the value imports from the same source, not in a separate block.
  Inline it when they share a module: `import { iconNames, type IconName } from '…'`.
- Type-only imports come before relative imports when the file mixes both, because types belong
  to the module interface rather than the local implementation.
- Never reach across layers in the import list: if a page needs `@/components/ui/*` and
  `@/lib/*`, the component import is listed first.

## ESLint is the gatekeeper, not a preference

These are errors or warnings in `eslint.config.js`, so violations fail `pnpm run check`:

- `consistent-type-imports` — type-only imports use `import type` / inline `type`.
- `no-empty-object-type` — no `interface X extends Y {}`. Write the generic at the call site:
  `get<PageResult<User>>(…)`, never a named empty envelope.
- `no-unused-vars` — unused bindings are errors. Prefix a deliberately unused name with `_`.
- `prefer-const`, `no-var`, `eqeqeq` (smart), `object-shorthand` are on.
- `no-console` — only `warn`/`error`, and only with a real reason.
- `react-refresh/only-export-components` — **a file may export either components or plain
  functions/constants, not both.** This is why icon-name helpers live in
  `lib/icons/icon-name.ts` rather than beside `common/icon.tsx`. A violation is a warning, but
  treated as a defect: it breaks Fast Refresh for that file.

## TypeScript strictness

`tsconfig.json` already turns on `strict`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `verbatimModuleSyntax` and `noUncheckedSideEffectImports`.
Consequences that show up in review:

- `verbatimModuleSyntax` means a type imported without `type` becomes a runtime import — always
  be explicit.
- Avoid `any` (1 occurrence in the codebase today). Reach for `unknown` plus a narrowing guard
  (14 occurrences), a union, or a domain type.
- No non-null assertions (`!`). Runtime proof beats a compiler override; the codebase has zero.
- `as` is acceptable for narrowing at a real boundary (a validated literal, an item type from a
  loosely-typed array), not to silence a genuine type error. Narrow before asserting.
- Annotate exported function return types when the signature is part of a contract or the body is
  long enough that inference is unclear. Component return types stay inferred (0 explicit
  `JSX.Element` annotations) — JSX inference is exact and the annotation adds noise.

## Generated output

- Never hand-edit `dist/` or commit build artifacts as a substitute for source changes.
- `src/components/ui/**` is excluded from ESLint; treat those primitives as vendored — edit only
  when the change is genuinely about the primitive itself, and mention it.
