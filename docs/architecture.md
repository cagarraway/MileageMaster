# Architecture

MileageMaster is a single SvelteKit 3 application: the same codebase renders pages, handles form
submissions and talks to MySQL. It is deployed as a Node.js server (`@sveltejs/adapter-node`).

## Layers

```
src/
├── routes/                      Pages and the app shell (+layout.svelte)
├── lib/
│   ├── components/              Reusable UI (Dialog, FormField)
│   ├── <feature>/               One folder per feature, e.g. vehicles/
│   │   ├── vehicle.ts           Domain rules: validation schemas, messages, pure helpers
│   │   ├── vehicles.remote.ts   Remote functions: the client ↔ server boundary
│   │   └── VehicleDialog.svelte Feature UI
│   └── server/                  Server-only code (never shipped to the browser)
│       ├── db/                  Kysely client, schema types, migrations
│       └── <feature>/           Repositories: all SQL for a feature
├── env.ts                       Declares the environment variables the app needs
└── hooks.server.ts              Runs database migrations on startup
```

A request flows **UI → remote function → repository → database**:

- **UI** (`.svelte`) spreads a remote `form` onto a `<form>` and shows its field issues/results.
- **Remote functions** (`*.remote.ts`) validate input with a Valibot schema, call a repository,
  and translate domain errors into form issues (e.g. a duplicate plate becomes an issue on the
  licence plate field). They contain no SQL.
- **Repositories** (`lib/server/<feature>/*-repository.ts`) contain the queries. They take a
  `Kysely` instance as a parameter, so tests can pass one connected to the test database.
- **Domain rules** (`lib/<feature>/<feature>.ts`) are plain functions and schemas with no
  framework or database dependencies, so they are easy to unit test.

Business rules are enforced on the server. Where the database can guarantee a rule (such as
unique licence plates, via a unique index), it does, so the rule holds even under concurrent
requests; the repository converts the resulting MySQL error into a domain error.

## Database and migrations

- **Kysely** (type-safe SQL query builder) with the **mysql2** driver.
- Table types live in `lib/server/db/schema.ts`. Keep them in sync with the migrations.
- Migrations live in `lib/server/db/migrations/`, named `NNNN_description.ts` and applied in
  filename order. They are bundled into the server build with `import.meta.glob`, and
  `hooks.server.ts` applies pending ones when the server starts. The deployed `build/` folder
  is therefore self-contained: there is no migrations folder to copy alongside it.
- Never edit a migration that has been deployed; add a new one instead.

## Configuration

Environment variables are declared and validated in `src/env.ts` and read via
`$app/env/private`. Locally they come from `.env` (copy `.env.example`); in production they are
set in the hosting control panel. Set `TZ` on the server (e.g. `TZ=Europe/London`) so date
rules such as "not in the future" use the users' calendar day.

## UI conventions

- Tailwind CSS 4, mobile-first. Use the `brand-*` colour scale (defined in
  `src/routes/layout.css`) for the green theme rather than a specific Tailwind palette.
- Records are created and edited in popups (`lib/components/Dialog.svelte`): movable by the
  title bar, closed by Escape, the close button, or clicking outside.

## Testing

| Kind                    | Tool       | Location                     | Needs DB |
| ----------------------- | ---------- | ---------------------------- | -------- |
| Domain rules            | Vitest     | `src/lib/**/*.spec.ts`       | No       |
| Repositories            | Vitest     | `src/lib/server/**/*.spec.ts` | Yes      |
| UI / end-to-end         | Playwright | `e2e/*.e2e.ts`               | Yes      |

Tests that need a database use `mileagemaster_test`, which the Docker setup creates alongside
the development database.
