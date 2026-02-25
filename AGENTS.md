# Vicoo - Development Agent Instructions

## Cursor Cloud specific instructions

### Project overview

Vicoo ("Your Visual Coordinator") is a pnpm monorepo containing a Personal Knowledge Management app. The two required services for web development are:

| Service | Path | Port | Command |
|---------|------|------|---------|
| API (Express + SQLite) | `apps/api` | 8000 | `pnpm dev:api` |
| Web (React 19 + Vite) | `apps/web` | 3001 | `pnpm dev:web` |

Optional apps (`apps/desktop`, `apps/mobile`, `apps/weapp`) require platform-specific tooling and are not needed for core web development.

### Running services

- Start both services: `pnpm dev` (runs api + web in parallel)
- Start individually: `pnpm dev:api` then `pnpm dev:web`
- The web dev server (Vite) proxies `/api` and `/health` requests to port 8000
- The API uses SQLite via sql.js (in-process, no external DB needed); the DB file auto-creates at `apps/api/data/vicoo.db`
- A `.env` file must exist at the repo root (copy from `.env.example`); AI features degrade gracefully without real API keys

### Authentication in dev mode

- `POST /auth/dev-token` returns a bearer token for the anonymous dev user (`dev_user_1`)
- The web frontend handles this automatically; for API-only testing, include `Authorization: Bearer <token>` header

### AI Provider

All AI operations are handled by **MiniMax** (via LangChain). Coze and Claude Code are bypassed.

- `/api/ai/chat` — LangChain Agent with MiniMax-M2.5 (supports tool calling)
- `/api/ai/summary` and `/api/ai/suggest-tags` — MiniMax M2-her via `simpleChat()` (no tools, faster)
- MiniMax M2-her responses include `<think>...</think>` reasoning blocks; these are stripped in route handlers via `stripThinkingBlock()`
- `MINIMAX_API_KEY` must be set as an environment variable (not loaded from `.env` automatically)

### Known pre-existing issues

- **Smoke test mismatch**: `apps/api/tests/smoke.test.mjs` waits for stdout string `"Server running on"` but the server emits `"Vicoo API running on"`, causing a 30 s timeout. The server itself starts fine.
- **Web test ThemeProvider**: `apps/web/tests/smoke.test.tsx` fails because test renders don't wrap components in `ThemeProvider`.
- **TypeScript lint errors**: Both `apps/api` and `apps/web` have pre-existing TS strict-mode errors (e.g., `unknown` types, missing properties). These do not block runtime.
- **Mobile app lint**: `apps/mobile` has React Native JSX type-compat errors (React 19 + older RN types).

### Lint / test / build commands

Standard monorepo commands are in root `package.json`:

- Lint: `pnpm lint` (runs `tsc --noEmit` per app)
- Test: `pnpm test` or `pnpm test:smoke`
- Build: `pnpm build`
- Type-check: `pnpm typecheck`

### esbuild build approval

`esbuild` must be in `pnpm.onlyBuiltDependencies` in root `package.json` for Vite to work. This is already configured.
