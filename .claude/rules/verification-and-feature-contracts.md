---
paths:
  - 'src/**/*'
  - 'scripts/**/*'
---

# Verification and project-specific contracts

## Verification

- After code changes, run `pnpm run check` and `pnpm run build`. For interactive behavior changes, run the available smoke test when Chromium is available; report environment blockers rather than implying it passed.
- Keep ESLint, TypeScript, and Prettier clean. Do not silence a rule broadly to avoid fixing an underlying issue; use a narrowly scoped suppression with a reason only when the exception is intentional.

## Existing behavior to preserve

- Registration is controlled by the theme settings drawer and is off by default. Registration uses `POST /auth/register` with `username`, `email`, and `password`; the production service must be implemented by the backend.
- Registration stays within the existing login page rather than opening a floating Dialog or modal. The slider login keeps its panel transition; other login styles switch the form in place.
- The animated border is used only by the glass and immersive login styles; do not reintroduce it on the slider or bubble styles without an explicit product change.
- Menu items must not repeat navigation to the active route, and selecting an item closes/hides the floating menu. Failed menu loading must not render a fabricated fallback menu.
- Keep the catalog floating menu optional and visually flat: no left-side blue selection stripe. Preserve existing user-requested visual tuning unless the user asks to change it.
