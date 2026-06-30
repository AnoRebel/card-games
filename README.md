# Card Games

Modular multiplayer card games platform. Ships **Last Card** (shedding) and
**Albastini** (trick-taking) on a shared, game-agnostic engine with offline
(local) and realtime online multiplayer, rooms, spectators, theming, chat,
leaderboards, and per-game tutorials.

## Features

- **Two games**: Last Card (shedding) and Albastini (Tanzanian trick-taking),
  each on a shared, pure, deterministic engine.
- **Offline & online multiplayer** behind one transport seam — hotseat + bots
  offline; realtime, server-authoritative rooms online.
- **Rooms**: create/join, shareable links, seating, host start/end, presence.
- **Spectators** with access control — public rooms or **locked** rooms that
  require a passcode (distinct player vs spectator links).
- **Themes**: built-in + user-uploaded card backs and table backgrounds.
- **Per-room chat**, per-game **leaderboards**, **tutorials** and an
  always-available **rules** panel.
- **Dark/light mode** with animated transitions, **i18n** (English + Swahili),
  in-game **notifications**, and a **settings** page.
- Responsive and mobile-friendly; reduced-motion aware throughout.

## Stack

- **Nuxt 4** (`future.compatibilityVersion: 5`) + Nitro
- **@nuxt/ui** (Tailwind v4) for UI
- **VueUse** (`@vueuse/core`, `@vueuse/nuxt`) + **@vueuse/motion** + **anime.js**
  for animation (see `docs/decisions/animation-library.md`)
- **date-fns** + **@date-fns/tz** for all date/time + timezone handling
- **valibot** for schema validation; **Dexie** (IndexedDB) for results / uploads
- **nuxt-i18n-micro** for i18n (en + sw)
- **v-tour-guide** for interactive in-game tutorials
- **Realtime**: Nitro-native WebSockets (crossws) carry the room/game protocol;
  **Conduit** (`@conduit/client` / `@conduit/server`, via JSR) is an optional
  WebRTC peer-to-peer enhancement behind the same transport seam
- **Vitest** for tests

## Repository layout (bun workspaces)

```
packages/
  engine-core/      # pure, deterministic, framework-free game engine contract
  game-last-card/   # Last Card rules as an engine module (depends on engine-core)
  game-albastini/   # Albastini rules as an engine module (depends on engine-core)
app/                # Nuxt app (pages, components, composables, transports, UI)
server/             # Nitro: Conduit signaling/relay + server-authoritative state
```

The dependency graph is a DAG: `engine-core` is a leaf (no deps); games depend
only on `engine-core`; the app depends on all three. Engine and game packages
**must not** use `Math.random` / `Date.now` / `new Date()` — randomness flows
through a seeded PRNG and time is injected (enforced by an ESLint rule).

## Prerequisites

- [bun](https://bun.sh) ≥ 1.3
- Conduit (optional WebRTC enhancement) is installed from JSR:
  ```bash
  bunx jsr add @conduit/client @conduit/server
  ```

## Setup

```bash
bun install
```

## Develop

```bash
bun run dev        # Nuxt dev server (offline + online both work)
bun run build      # production build
bun run preview    # preview the production build
```

## Playing online

Online rooms run over Nitro-native WebSockets — no extra services needed in dev
or in a standard Node deployment. Create a room from a game's lobby, share the
**player link**, and (for locked rooms) the **spectator link** with its passcode.

To enable the optional Conduit WebRTC path, set `NUXT_CONDUIT_ENABLED=true`.
Conduit/i18n/realtime settings are env-overridable via `runtimeConfig`
(`NUXT_PUBLIC_CONDUIT_PATH`, `NUXT_CONDUIT_AUTH_MODE`, etc.).

## Internationalization

UI is available in **English (en)** and **Swahili (sw)** — switch via the globe
menu. Albastini surfaces authentic Swahili terms (Dume, Jike, Mzungu, Kula,
Otea). Translations live in `locales/`.

## Quality

```bash
bun run test       # run the Vitest suite (engine + games + platform)
bun run lint       # ESLint (includes the engine determinism guard)
bun run typecheck  # vue-tsc type-check
```

## Status

Built in phases (see `openspec/changes/card-games-platform/tasks.md`):
scaffold → engine core → card UI → offline play → Last Card → rooms + online →
Albastini → theming → chat/leaderboard/learnability → polish.
