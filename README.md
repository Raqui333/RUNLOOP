# RUNLOOP — incremental infrastructure

**RUNLOOP** is a browser-based **idle / incremental game** with a developer-and-infrastructure theme. You start as a lone developer compiling a single project on one machine and grow into someone operating global, self-healing infrastructure — and beyond.

> *"I started compiling a project… now I'm managing infrastructure at an absurd scale."*

<p align="center">
  <img src="docs/main-page.png" alt="RUNLOOP main dashboard screenshot" width="800" />
</p>

<p align="center">
  <img src="docs/compute-page.png" alt="RUNLOOP compute page screenshot" width="800" />
</p>

<p align="center">
  <img src="docs/refactor-page.png" alt="RUNLOOP refactor page screenshot" width="800" />
</p>

---

## Gameplay

- **Cycles** are the primary resource. You produce them per second (`1.25K`, `8.42M`, `91.3B`…) and spend them on generators, upgrades and research.
- **10 procedural generators**, from *Compile Core* to *Inference Cluster* (CPU, Build Server, GPU Array, Sharded Database, API Gateway, Cluster Orchestrator, Regional Datacenter, Cloud Region…). Costs and production grow exponentially with level.
- **Repeatable upgrades** (Optimization Stack, PGO Compiler, Prefetch, Speculative Branch toggles…) and **one-time breakthroughs** (Monorepo, Edge Gateways, Serverless Fabric…) multiply production.
- **Research tree** (~25 nodes) unlocks multipliers, workers, servers, autoscaling and offline-efficiency bonuses.
- **Workers** give +10% production each; **auto-buyers** (autopilot) automate generator purchases once the *Autoscale* research is unlocked.
- **Manual deploy** button: clicking executes a build, instantly banking `production × 5` cycles (further multiplied by click-related research).
- **Refactor (prestige)**: past `1M` run cycles you can reset current infrastructure to gain **Architecture Points**, then specialize into **Performance**, **Reliability** or **Automation** for permanent, compounding bonuses.
- **Offline progress**: closing the tab pays off — production accrues while you're away, and a modal reports exactly what you earned.
- **Milestones & scale tiers**: milestones mark progression thresholds; your "workstation" designations evolve from *Developer Workstation* up to *Distributed Intelligence*.

Numbers use arbitrary-precision decimals (`break_infinity.js`), so growth can continue essentially forever without losing precision.

---

## Tech stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org) (App Router, Turbopack, static export) |
| UI               | React 19 + TypeScript                               |
| Styling          | Tailwind CSS v4 (CSS-first theme, dark "terminal" palette) |
| State            | [zustand](https://github.com/pmndrs/zustand)        |
| Big numbers      | [break_infinity.js](https://github.com/Patashu/break_infinity.js) |
| Tests            | `tsx` smoke scripts (engine + store), no jest dependency |

---

## How it's made

The main design rule (from `AGENTS.md`) is: **game logic lives outside the React components.**

### Game engine (`src/game`)

- `types.ts` — shared types (`GameState`, `GeneratorDef`, `ResearchDef`, …).
- `economy.ts` — **data, not logic**: generator/research/upgrade/milestone definitions and cost curves.
- `engine.ts` — **pure functions** with no React/Zustand coupling: `computeProduction`, `buyGenerator`, `buyResearch`, `processAutoBuyers`, `computeOfflineGain`, `processRefactor`, `getNextMilestone`, …
- `numbers.ts` — formatting (suffixed `K/M/B/T/Qa…`) and Decimal helpers.
- `save.ts` — serialization, versioned schema (`saveVersion: 1`) and defensive sanitization (rejects `NaN`/`Infinity`/negative values and incompatible shapes).
- `state.ts` — `createInitialState()` — the fresh-game state (including a small starter grant so the first generator is immediately reachable).
- `store.ts` — the Zustand bridge. Thin actions (`actBuyGenerator`, `actRefactor`, …) call pure engine functions, then commit results **preserving volatile UI state** (view, logs, toasts). This keeps every mutation testable.

### Game loop

- The store runs a `requestAnimationFrame`-free **interval loop at 10 Hz** (`TICK_MS = 100`).
- Production is computed from **real elapsed time** (`dt = now - lastTickAt`), so tab throttling, dips in FPS and background suspension don't break the economy.
- Autosave every 30s, plus save on `beforeunload` / `visibilitychange`.
- On reload, offline gain = `elapsedTime × productionPerSecond × efficiency` — deterministic, capped, no catch-up ticking of thousands of frames.

### UI (`src/components`)

- `ui.tsx` — small primitives (`Button`, `Card`, `Section`, `Stat`, `Badge`, `Bar`, `ProgressTo`).
- `layout/` — `Header` (production, sessions), `Sidebar` (navigation), `LogPanel` (cosmetic system log), `Toasts` (feedback), `OfflineModal`.
- `views/` — `Overview`, `Compute`, `Automation`, `Research`, `Upgrades`, `Refactor` screens.
- `game/` — `GeneratorCard` (reused by Compute + Automation).

### Project structure

```text
src/
├── app/                 # Next.js app router (layout, page, globals.css)
├── components/
│   ├── GameShell.tsx    # Boot splash + top-level layout
│   ├── game/            # GeneratorCard
│   ├── layout/          # Header, Sidebar, LogPanel, Toasts, OfflineModal
│   ├── views/           # Overview, Compute, Automation, Research, Upgrades, Refactor
│   └── ui.tsx           # Shared primitives
├── game/
│   ├── types.ts         # Shared types
│   ├── economy.ts       # Balance data (definitions & costs)
│   ├── engine.ts        # Pure game logic
│   ├── numbers.ts       # Big-number formatting
│   ├── save.ts          # Persistence + sanitization
│   ├── state.ts         # Fresh-game state
│   └── store.ts         # Zustand store / game loop / actions
└── lib/cn.ts            # classnames helper
scripts/
├── smoke.ts             # Engine tests (14 checks)
└── store-smoke.ts       # Store tests (boot, tick, offline, hard reset)
```

The tests were genuinely useful during development — they caught two real bugs: the offline calculation always seeing `elapsed = 0`, and store commits dropping volatile UI fields.

---

## Getting started

### Requirements

- Node.js 18.18+ (Node 20+ recommended) and npm.

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run the tests

```bash
npm test            # engine (14 checks) + store (4 checks)
npm run test:engine
npm run test:store
```

### Lint & typecheck

```bash
npm run lint
npx tsc --noEmit
```

### Production build

```bash
npm run build
npm run start
```

The game is a static App Router page — the build output can be served by any static host (Vercel, Netlify, a CDN, `npx serve out`, …). There is **no backend**: it's a pure client-side game; progress is saved in `localStorage`.

---

## Customization guide

Because balance data lives in `economy.ts` and logic in `engine.ts`, tuning is straightforward:

- **Balance pacing** — edit costs/growth/production in `GENERATORS`, `RESEARCH`, `UPGRADES`.
- **New generator** — add a `GeneratorDef` to `GENERATORS` and (optionally) a research gate; the UI picks it up automatically.
- **New research** — add a `ResearchDef`; keep the tree acyclic via `prereq`.
- **New milestone / scale tier** — extend `MILESTONES` / `SCALE_TIERS`.
- **Refactor curve** — `getRefactorGain`/`processRefactor` in `engine.ts` and `specCost` in `economy.ts`.

After editing, run `npm test` to make sure nothing regressed.

---

## Roadmap

Development follows the phases in `AGENTS.md`. Currently complete:

- [x] **Phase 1** — layout, core resource, automatic production, upgrades, local save, offline progress.
- [ ] **Phase 2** — deeper research tree & unlocks, richer logs, metrics/analytics panels.
- [ ] **Phase 3** — prestige meta-progression, specializations, procedural challenge systems.
- [ ] **Phase 4** — balance, polish, subtle animations, UX and performance optimization.

---

## License

Feel free to fork for your own experiments.
