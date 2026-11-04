---
paths:
  - 'src/**/*'
  - 'package.json'
  - 'pnpm-workspace.yaml'
---

# Project structure and ownership

- Treat this repository as a Vite + React SPA. Follow the existing feature boundaries; do not introduce Next.js-only APIs or conventions.
- Keep route screens in `src/pages/<feature>/`. Place page-private views, hooks, and models beside that page (usually under its `modules/` directory). Promote code to `src/components/` only when it is genuinely reused.
- Keep modules cohesive: colocate small helpers and types with their owner. Extract a hook for independently understandable stateful behavior, or a model module for a meaningful pure transformation. Split by responsibility, not line count. Avoid tiny pass-through files, unnecessary wrappers, and re-export-only barrels.
- Ownership boundaries. Two axes decide where a non-business module goes: **who consumes it** (layer) and **what it is** (kind). Pick the layer first, then the kind subfolder.

  - `src/components/ui/`: accessible UI primitives with no project knowledge (shadcn-derived).
  - `src/components/core/`: our own infrastructure components that most features depend on — `grid-table/`, `tree`, `form/field`. Same no-business-knowledge bar as `ui/`, but written by us.
  - `src/components/common/`: presentational pieces that stay valid in any domain (`header`, `pagination`, `section-card`, `detail-row`, `full-page-loader`, `user-avatar`, `icon`). No feature naming leaks in.
    Render-by-name icons go through `common/icon` (`<Icon name="shield-user" />`); its name-resolution helpers live in `lib/icons/icon-name.ts`, since a file may not export both a component and plain functions (breaks Fast Refresh).
  - `src/components/navigation/`: components that change your location in the app (`logo`).
  - `src/components/charts/`: `chart` owns the echarts instance lifecycle; `chart-theme` holds config types decoupled from echarts.
  - `src/components/layout/`: the authenticated shell and everything only it consumes — header/sidebar/tabs/route-search, plus `layout/menu/` for menu data and rendering. Shell-only hooks live here (`use-menus-sync`, `use-tab-actions`, `use-route-tab-sync`, `use-fullscreen`); pages must never import this folder.
  - `src/components/theme/`, `src/components/system/`: self-contained feature components with their own models and hooks. `system/` holds what the four system-management pages share (list page header actions, filter bar, form sheet, table parts, pagination config, batch delete, paged query, `use-permission`).
  - `src/lib/`: side-effect-free building blocks. Flat files for primitives (`http`, `color`, `format`, `echarts`, `utils`); subfolders by concern when a topic owns more than one file: `lib/app/` (singleton/stateful app infrastructure such as `query-client`, `keepalive`), `lib/router/` (route-transition behaviour), `lib/theme/` (theme runtime), `lib/icons/` (dynamic icon-name resolution: PascalCase/kebab → lucide name, `iconNames` guard).
  - `src/hooks/`: only for hooks that are genuinely cross-cutting across unrelated features. If a hook has a single owning layer, keep it in that layer instead of here — a shared drawer for everything is how `hooks/` turns into a junk drawer.
  - `src/store/`: persisted or client-wide state; `src/router/`: static route definitions and route metadata; `src/config/`: stable option lists and defaults.

- Keep feature-only types private. Put genuinely shared/global declarations in `src/types/*.d.ts`.
- Split APIs by business domain. Each `src/api/<domain>/` owns its request implementation in `index.ts` and domain declarations in `index.d.ts`; callers import from the owning domain, not a monolithic API barrel.
- Centralize every dependency and devDependency version range in the default catalog in `pnpm-workspace.yaml`. Use `"catalog:"` in `package.json`, and update the lockfile when changing or adding dependencies. Keep project metadata such as the app `version` and `packageManager` separate; they are not dependency ranges.

## Routes and menus

- Routes are static and grouped by responsibility. Business modules are `dashboard`, `catalog`, `profile`, and `settings`; system/not-found routes remain separate. The single auth route is imported directly from `router/modules/auth.tsx`. `router/modules/index.ts` discovers the other route definition modules with eager `import.meta.glob()` and aggregates them; add modules by exporting the shared `routeModule` shape instead of adding hard-coded imports. Page components inside route definitions remain lazy-loaded.
- Route metadata owns page titles, breadcrumbs, and route-search metadata. Menu data is for navigation only; do not put React components in menu payloads or use menus to derive route metadata.
- Menu links navigate by path. Do not navigate again when the target is already active, and close/hide a floating menu after an item is chosen. Do not show a fabricated fallback menu when menu loading fails.
- Preserve route-level lazy loading and load large optional dependencies (such as charting) on demand.
