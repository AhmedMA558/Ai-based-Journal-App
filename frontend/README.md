# frontend

React 19 + TypeScript SPA for the AI Journaling Platform. Talks to `gateway-service` (port 8080) - the dev server proxies `/api/**` to `http://localhost:8080` (see `vite.config.js`), and the production build expects the gateway reachable at the same origin or `http://localhost:8080` (see `src/services/api.js`). No frontend `.env` file is needed for local dev.

## Tech stack

- **React 19** + **TypeScript** (partial migration in progress - some components are still `.jsx`, converted incrementally one at a time; see `docs/ARCHITECTURE.md` in the repo root for the migration's status)
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no separate `tailwind.config.js`/`postcss.config.js`) + shadcn/ui-style components (`components.json`, `src/lib/utils.ts`'s `cn()` helper)
- **react-router-dom v7** for routing
- **Vite** for dev/build, **Vitest** + **React Testing Library** for tests
- **axios** for HTTP, **recharts** for charts, **framer-motion** for animation, **lucide-react** for icons

## Scripts

```bash
npm install
npm run dev         # start dev server on :3000, proxies /api to :8080
npm run build        # production build
npm run test          # run Vitest suite
npm run test:watch    # Vitest in watch mode
npm run typecheck     # tsc --noEmit
npm run lint           # oxlint
npm run preview        # preview a production build locally
```

## Structure

```
src/
  components/   one file per view/widget (DashboardView, JournalEditor, SettingsModal, ...)
  services/     thin API client wrappers (authService, journalService, aiService, ...) -
                each unwraps the backend's ApiResponse<T> envelope (res.data.data)
  lib/          shared utilities - moods.ts (mood/emoji/color lookup, single source of
                truth), journalStats.ts (streak/AI-level calculations), utils.ts (cn())
  assets/       static assets
  App.jsx       route tree + top-level auth gating
  main.jsx      entry point, wraps App in BrowserRouter
```

Every new component added since the TypeScript/Tailwind migration started ships as `.tsx` with at least a smoke test alongside it (`Component.test.tsx`).
