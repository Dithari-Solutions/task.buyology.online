# Buyology Kanban — Frontend

Next.js 15 (App Router) + TypeScript + Tailwind interface for **Buyology Kanban**, the
Jira-style task management system of Buyology.

* Dashboard with workload, deadlines and a live activity feed
* Drag-and-drop kanban board (dnd-kit) with WIP limits, filters and inline task creation
* Task drawer with description, comments, watchers and full history
* Admin screens for platforms, boards, columns, members and user accounts
* In-app notification centre backed by the API
* Dark navigation rail + light workspace, responsive down to mobile

## Screens

| Route | Purpose |
| --- | --- |
| `/login` | Sign in (accounts are created by an administrator) |
| `/dashboard` | Personal and organisation-wide overview |
| `/boards` | Every board, filtered by platform |
| `/boards/[key]` | The kanban board itself |
| `/my-tasks` | Task list — “mine” or “everyone”, with filters |
| `/tasks/[key]` | Full-page task view (the target of e-mail links) |
| `/platforms` | Platforms and their boards (admin can create/edit) |
| `/users` | Account administration (**ADMIN** only) |
| `/profile` | Personal details, e-mail preferences, password |

## How it talks to the API

By default the browser only ever calls **this app's own origin**. Every request to
`/api/*` is proxied server-side to `BACKEND_URL`, which means:

* the Spring Boot API does not have to be exposed publicly,
* there is no CORS configuration to get wrong,
* changing the API address needs **no rebuild** — just restart the container.

If you would rather have the browser call the API directly, set
`NEXT_PUBLIC_API_URL` at **build** time and add that frontend origin to the API's
`CORS_ALLOWED_ORIGINS`.

## Running locally

```bash
cp .env.example .env        # set BACKEND_URL
npm install
npm run dev                 # http://localhost:3000
```

With Docker:

```bash
cp .env.example .env
docker compose up -d --build
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `WEB_PORT` | `6061` | Host port published by docker compose (container listens on 3000) |
| `BACKEND_URL` | `http://buyology-kanban-api:8080` | Where the API lives, over the shared docker network (runtime, no rebuild) |
| `NEXT_PUBLIC_API_URL` | empty | Optional: call the API straight from the browser (build-time) |

## Auth

The JWT returned by `POST /api/auth/login` is stored in the `buyology_kanban_token`
cookie. `src/middleware.ts` redirects unauthenticated visitors to `/login` and
signed-in visitors away from it; the axios interceptor clears the cookie and
returns to `/login` on any `401`.

## Health

`GET /api/health` returns `{"status":"UP"}` without touching the API — used by the
container healthcheck.

## Brand

Colour tokens, typography and the logo components are documented in
[BRAND.md](BRAND.md). The marks are traced from the official guideline artwork —
please use `<BuyologyLogo />` / `<BuyologyMark />` rather than re-drawing them.
