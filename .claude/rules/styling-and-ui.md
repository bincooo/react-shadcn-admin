---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI and styling

## Tailwind usage

- Tailwind v4 utilities and the project's semantic tokens only. `bg-card`, `text-muted-foreground`,
  `border-border`, `ring-ring` — not raw palette values or `#` hex.
- Prefer opacity modifiers and built-in shadow/transition utilities over `color-mix()` or
  arbitrary shadows. Arbitrary values (`size-4.5`, `text-[11.5px]`) are for genuinely custom
  controls, dense data views, and previews — not for approximating a token that exists.
- Use `cn()` when classes are conditional or caller-provided (78 uses in `components/`). Keep a
  plain static string inline; do not wrap it for consistency.
- Class order belongs to `prettier-plugin-tailwindcss`. Never hand-sort, never build class
  fragments dynamically (`text-${color}-500` is invisible to the scanner and will be purged).
- Extract a class token only when it encodes a repeated design rule inside one cohesive feature
  — the `VARIANTS` table in `menu-item.tsx` is the pattern. Do not create global constants for
  two- or three-class combinations.

## Components and variants

- Build on `src/components/ui/**` primitives. Do not re-implement a Dialog, Tabs, or Popover.
- Distinct structures → explicit variants; independent capabilities → booleans.
- When the caller owns a visual section, take `children`/slots rather than reaching in with
  selectors or `!important` overrides.

## Accessibility is part of the change

- Preserve labels, `htmlFor`, keyboard interaction, focus rings, and semantic elements.
- Interactive elements that are not a `<button>`/`<a>` need role + keyboard handling.
- Decorative motion respects `prefers-reduced-motion`.
- An icon-only control needs an accessible name (`aria-label` or a visually hidden label); a
  decorative icon is `aria-hidden`.

## Content and i18n

- **User-visible strings go through `t('…')`** (704 calls). Add the key to both
  `zh-CN` and `en-US` in `src/i18n/` in the same change; a key present in one locale only is a
  bug, not a TODO.
- Keys are namespaced by feature: `system.menu.type.directory`, `common.actions.save`. Keep the
  value text out of the key name.
- Legitimate hardcoded Chinese (31 lines, all deliberate): developer-facing `throw new Error`
  text, `<i18n key>` fallbacks where a missing entry should show the key, date format suffixes,
  and JSX comments. Anything the user reads in a normal flow is translatable.
- Do not translate data that comes from the API; render it as-is.

## Layout conventions

- Page-level spacing comes from the page container; do not add outer margins inside reusable
  components.
- Horizontal overflow belongs to the card/container (`contain-inline-size`), never to `<body>`.
- Dense data surfaces (tables, trees, menus) use the shared density tokens rather than per-page
  sizes.
