---
paths:
  - 'src/**/*.{ts,tsx}'
---

# Naming, types, and comments

## Names describe responsibility

- Prefer a specific name over a generic one. `resolveIconName` over `getIcon`; `menuTreeCache`
  over `cache`. Avoid `shared`, `utils`, `data`, `handler` unless the role is genuinely that.
- Booleans read as assertions: `useChinese`, `inGroup`, `iconOnly`, `hasMore`.
- Event handlers are `onX` on props and `handleX` / a verb phrase inside the component.

## Two suffixes carry real meaning

- **`State`** — every `useState` value and every state field a custom hook returns:
  `const [draftState, setDraftState]`, `menusSync.selectedCount`. Setters keep `setX`.
  Do **not** rename API/domain fields to add the suffix; `user.realName` stays as the backend
  spells it.
- **`Sync`** — only for hooks/functions that compose async query or route data into synchronized
  UI state: `useUsersSync`, `useSidebarBranchesSync`, `useRouteTabSync`. Plain request hooks and
  submit actions keep action-oriented names (`useUserList`, `saveUser`). Do not add `Sync`
  mechanically.

## Module shapes

- **Components are `export function Name(props)` declarations** — 67 of 69 exported components.
  Arrow-function components are not used for exported components.
- **Named exports everywhere in the interior, `export default` only at route entries.** Pages
  (`pages/*/index.tsx`), `App.tsx`, and the i18n instance are the only default exports; every
  component, hook, helper and type in `components/`, `lib/`, `hooks/`, `api/` is named. Route
  modules load pages by default export, so the page file is the one place the default is wanted.
- **Props are typed with `interface XxxProps`**, declared immediately above the component
  (20 files). Use an inline object type only for a trivial or one-off signature
  (`function Icon({ name }: IconProps)` still prefers the named interface). `type` is for
  composition, not for props: `type MenuItemsProps = Omit<MenuItemGroupProps, 'item'> & { … }`.
- **File names are kebab-case**: `menu-item.tsx`, `icon-name.ts`, `grid-table-config.tsx`. The
  only PascalCase file is `App.tsx`, which is a route-level exception.
- **No `enum`** (zero in the codebase). Use a union type, or a `const` object with
  `as const satisfies Record<…>` when a lookup table is needed — see
  `menu-item.tsx`'s `VARIANTS`.

## Types stay close to their consumer

- Keep a type private to its feature until another feature genuinely consumes it. Export the
  narrow one, not the whole shape.
- Derive instead of duplicating: `SystemMenu['menuType']`, `Omit<MenuItemGroupProps, 'item'>`,
  `Parameters<typeof fn>[0]`. Duplicated structural types drift.
- Model mutually exclusive states as a union, not as several optional booleans.

## Comments are Chinese, and explain why

- **Write comments in Chinese** (1033 of 1346 comment lines in business code). English is only
  acceptable for a file that is itself in English; do not mix languages inside one file.
- **Exported components, hooks and non-obvious functions carry a JSDoc block** — 89% of the 306
  exported functions do today. A local helper that is obvious from its body does not need one.
- **Single-line JSDoc when one sentence suffices** (501 of 623 blocks):
  `/** 无法识别（或为空）时统一回退的图标 */`. Use the multi-line block when the reader needs a
  contract, a constraint, or a tradeoff, and open with a standalone summary line, a blank `*`
  line, then the detail:

  ```ts
  /**
   * 菜单树的纯函数工具：树遍历、筛选与节点查找。
   *
   * 全部是纯函数，不含 React 状态，因此与 `use-menus-sync` 的查询/变更逻辑分开。
   */
  ```

- **Explain the constraint, invariant, or tradeoff — never narrate the next line.** Compare:
  - Good: `// 命中区 8px，视觉线只在悬停表头时出现，拖拽时加粗并贯通表头高度`
  - Good: ``// `DynamicIcon` 在模块到位前返回 null，图标位会塌陷再撑开``
  - Bad: `// 设置加载状态` above `setLoading(true)`
- **Record the rejected alternative when a non-obvious decision was made.** A comment that says
  what was tried and why it failed prevents the next person from redoing it — e.g. the note in
  `vite.config.ts` about `experimentalMinChunkSize` collapsing every icon back into one chunk.
- **No section divider banners.** Files are divided by responsibility through ordering and JSDoc,
  not `// ─────` rulers (zero in the codebase).
- **Delete stale comments.** If code moves or behavior changes, the old explanation is a bug.
- Never state a fact about external systems (limits, defaults, backend behavior) that you have
  not verified. An invented "backend caps at 50" is worse than no comment.

## File-level JSDoc is the exception, not the rule

Only about 10% of files open with a module-level JSDoc, and those are `lib/` modules and files
whose module _is_ a concept (`chart.tsx`, `menu-tree.ts`). A component file usually needs none;
its component JSDoc says the same thing in the right place. Add a file header when the file's
responsibility cannot be inferred from the exports, or when a rule applies to the whole file
(see the top of this file's neighbours: `menu-tree.ts`).
