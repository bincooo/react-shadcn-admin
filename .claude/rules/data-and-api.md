---
paths:
  - 'src/api/**/*'
  - 'src/types/**/*'
  - 'src/store/**/*'
  - 'src/config/**/*'
  - 'src/lib/**/*'
---

# Data layer and API contracts

## Request functions

- One module per backend resource under `src/api/<domain>/`. The module exports the request
  functions and the response types, nothing else.
- Every request goes through the shared `http` client. No bare `fetch`, no second HTTP wrapper.
- Write the generic at the call site: `http.get<PageResult<User>>('/system/users', { params })`.
  **Never declare a named empty envelope** (`interface UserPage extends PageResult<User> {}`) —
  it hides the shape and is banned by `no-empty-object-type`.
- Query parameters use the shared `QueryParamValue` type; do not widen to `Record<string, any>`.

## Types mirror the backend

- Field names match the wire format exactly (`realName`, `deptId`, `menuType`). Do not rename to
  fit a UI preference; translate at the boundary if the view wants a different name.
- Timestamps that arrive as strings stay strings in the API type; format them in the view.
- Optional means "the backend may omit it". If the field is always present, do not mark it
  optional just to make fixtures easier.

## Mock and fixture data

- Fixtures live under `fake/` and are wired through the Vite mock middleware, not imported into
  app code.
- Seed data must satisfy the same types the API declares. When a type changes, the fixture changes
  in the same commit.

## Stores and config

- `src/store/` holds persisted or client-only state (theme, auth token, layout preferences).
  Server data belongs to TanStack Query, not to a store.
- `src/config/` holds stable option lists and defaults (theme presets, login styles, status
  colors). A value that depends on a request does not belong there.
- `src/lib/` is side-effect-free: no module-level DOM access, no timers, no subscriptions at
  import time. Anything stateful goes in `lib/app/` and is created explicitly.
