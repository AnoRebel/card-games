# Decision: Gameplay/event animation library

**Status:** Accepted · **Date:** 2026-06-14

## Context

The platform needs two tiers of animation:

1. **Component transitions** — cards entering a hand, modals, list changes.
2. **Orchestrated event animations** — deal stagger, trick-resolution sweep,
   suit-change flourish, win celebration; sequenced, imperative, triggered by
   engine state deltas.

The card UI must stay **memory-light and smooth on mobile**, compositor-friendly
(transform/opacity), and honour `prefers-reduced-motion`. We evaluated
**Three.js**, **Anime.js**, and **Popmotion** for tier 2.

## Options

| Library | Bundle | Model | 2D/3D | Fit |
|---|---|---|---|---|
| **Three.js** | ~150 KB+ (WebGL) | Scene graph, imperative | 3D | Overkill — we render 2D SVG cards; a WebGL context is heavy on memory for mobile and adds a parallel render path we don't need. |
| **Popmotion** | ~5 KB core | Low-level animate/keyframes | 2D | Capable but low-level; `@vueuse/motion` is already built on the same lineage, so adding raw Popmotion duplicates what we have for tier 1. |
| **Anime.js v4** | ~9 KB (modular ESM) | `animate` + `createTimeline` + `stagger` | 2D | Best fit — first-class timelines/stagger for sequenced events, tiny, framework-agnostic, easy to gate on reduced-motion. |

## Decision

- **Tier 1 (component transitions):** keep **`@vueuse/motion`** (`v-motion` +
  `motionPresets.ts`). Declarative, integrates with Vue lifecycle.
- **Tier 2 (orchestrated events):** **Anime.js v4**, wrapped in `app/utils/anim.ts`
  (`dealIn`, `playCard`, `sweepTrick`, `suitFlourish`, `celebrate`, `crossFade`).
- **Page-root theme transition:** the **View Transitions API** (circular/iris/fade
  reveal) for dark/light mode — neither tier-1 nor tier-2 tool does root reveals;
  Anime.js `crossFade` is the fallback where View Transitions are unsupported.
- **Three.js:** rejected — no 3D requirement; WebGL memory cost conflicts with the
  mobile/memory-light guarantee. Revisit only if a future game needs true 3D.

## Guarantees preserved

Every `anim.ts` helper checks `prefers-reduced-motion` and no-ops (snaps to final
state) when reduced motion is preferred. All animations use transform/opacity (or
clip-path for the root reveal) — no layout-thrashing properties, no per-frame
allocation beyond what Anime.js manages internally.
