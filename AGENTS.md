# Project coding guidelines

This project has the following Vercel Agent Skills installed:

- `.agents/skills/vercel-react-best-practices/SKILL.md`
- `.agents/skills/vercel-composition-patterns/SKILL.md`

Use these as guidance, adapting them to this Vite + React app. Do not apply Next.js-only APIs or turn every rule into a mechanical rewrite.

## Coding style: source of truth

The detailed coding-style rules live in `.claude/rules/`, each scoped by path front-matter.
**When this file and a rule disagree, the rule wins** — it is the file that gets read when
editing the matching path.

| Rule file                               | Covers                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `formatting.md`                         | Prettier config, **import order**, ESLint gates, TypeScript strictness, generated output  |
| `naming-and-comments.md`                | Identifier/file naming, module shapes, `State`/`Sync` suffixes, comment language and form |
| `react-patterns.md`                     | Composition, state/effects, data flow, code splitting, Fast Refresh boundaries            |
| `styling-and-ui.md`                     | Tailwind + `cn()` usage, variants, accessibility, i18n of user-visible text               |
| `data-and-api.md`                       | Request functions, backend-mirroring types, fixtures, stores vs config                    |
| `project-structure.md`                  | Folder ownership and what belongs in each layer                                           |
| `verification-and-feature-contracts.md` | What to run after a change, and behavior that must not regress                            |

Sections below summarize intent; the table above points to the enforceable detail.

## Whole-project map

Decide a non-business module's home by **layer first, then kind**: who consumes it decides the folder, what it is decides the subfolder.

- `src/pages/<feature>/`: route-level screens; keep one page's private views beside the page.
- `src/components/ui/`: accessible UI primitives with no project knowledge.
- `src/components/core/`: our own infrastructure components that most features depend on — `grid-table/`, `tree`, `form/field`.
- `src/components/common/`: presentational pieces that stay valid in any domain — `header`, `pagination`, `section-card`, `detail-row`, `full-page-loader`, `user-avatar`, `icon`.
- `src/components/navigation/`: components that change your location in the app — currently `logo`.
- `src/components/charts/`: `chart` (instance lifecycle) + `chart-theme` (echarts-decoupled config types).
- `src/components/layout/`: authenticated shell plus the hooks only it consumes; `layout/menu/` owns sidebar menu data/rendering. Pages must not import this folder.
- `src/components/theme/`, `src/components/system/`: self-contained feature components with feature-local models/hooks. `system/` is the shared kit of the four system-management pages.
- `src/lib/`: side-effect-free building blocks — flat files for primitives, subfolders by concern when a topic owns several (`lib/app`, `lib/router`, `lib/theme`, `lib/icons`).
- `src/hooks/`: only genuinely cross-cutting hooks; if a hook has one owning layer, live in that layer instead.
- `src/api/`: business types and request functions; `src/store/`: persisted/client state; `src/router/`: static route modules; `src/config/`: stable option lists and defaults.

## Naming and comments

- Names should describe the actual responsibility. Hooks/functions that compose asynchronous query or route data into synchronized UI state end in `Sync` (for example, `useSidebarBranchesSync`); plain request/query hooks and submit handlers keep action-oriented names.
- Identifiers that hold React state, plus state fields exposed by custom hooks, end in `State`; setters keep the `setX` convention. Domain data and API fields are not renamed merely to add the suffix.
- Keep comments structured: document exported components/hooks when their behavior or contract is not obvious; large files use clear responsibility headings; inline comments explain a constraint, invariant, or non-obvious reason rather than restating the next line. Remove stale comments when moving or renaming code.

## Structure and component boundaries

- Organize by feature. Keep page-only UI and logic beside that page; promote code to `src/components/` only when it is genuinely shared.
- Keep a feature cohesive: colocate a compact component with its types and small helpers. Extract a hook when stateful interaction logic can be understood independently from its JSX; extract a model module for meaningful pure transformations.
- Split files by responsibility, not by line count alone. Avoid one-file-per-helper, pass-through wrappers, and barrels that only re-export local files. Do not split a component simply because it contains a few small render helpers.
- Conversely, a file combining multiple independent concerns or a very large controller/view is a signal to extract a cohesive module. Prefer a small number of substantial modules over many tiny files.
- Keep public component APIs stable and narrow. Use children/slots or explicit variants for structural differences; use booleans for actual optional capabilities, not as a matrix of mutually exclusive modes.
- Keep types private to their feature unless another feature genuinely consumes them. Import feature internals directly rather than adding export barrels without a use case.

## Styling and className

- Use the project `cn` helper when classes are conditional or caller-provided; keep straightforward one-off utilities inline.
- Extract a class token only when it represents a repeated design rule within a cohesive feature. Do not create global style constants for generic two- or three-class combinations.
- Prefer semantic color opacity modifiers and built-in shadow/transition utilities over one-off `color-mix()` and arbitrary shadow values; reserve arbitrary values for genuinely custom controls or previews.
- Keep Tailwind classes in Prettier's sorted order; don't use dynamically assembled class fragments that Tailwind cannot statically detect.

## Verification

After code changes, run `pnpm run check` and `pnpm run build`. For changes to interactive behavior, run the available smoke checks when the browser runtime is available; report environmental blockers instead of implying they passed.
