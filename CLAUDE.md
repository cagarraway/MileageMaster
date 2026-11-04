# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

MileageMaster is a small web app for recording the mileage of the owner's family vehicles and viewing statistics about them. It replaces an Excel sheet that is awkward to use on a phone, so **mobile-first UI matters**.

It is also a learning project: the owner's first open-source project, and a way to practise Git/GitHub. Explain non-obvious decisions briefly, and prefer simple, conventional solutions over clever ones.

## Requirements

Requirements are tracked as GitHub issues labelled `requirement`, grouped under issues labelled `epic`. Check them (`gh issue list --label requirement`) before designing a feature, rather than inventing scope. Use the exact user-facing messages an issue specifies.

## Architecture

See `docs/architecture.md`. In short: UI (`.svelte`) → remote functions (`#lib/<feature>/*.remote.ts`, validation only, no SQL) → repositories (`#lib/server/<feature>/*-repository.ts`, all SQL) → MySQL. Pure domain rules and Valibot schemas live in `#lib/<feature>/<feature>.ts`. Enforce rules in the database too where possible (e.g. unique indexes).

## Stack

- **SvelteKit 3 + Svelte 5** (runes: `$state`, `$derived`, `$props`, `$effect`). Do not use Svelte 4 syntax (`export let`, `$:`, stores for local state, `on:click`). Minimum versions: Node 22.17, TypeScript 6, Svelte 5.57.1, Vite 8.
- **TypeScript**.
- **Data access:** prefer SvelteKit **remote functions** (`*.remote.ts` with `query` / `query.batch` / `form` / `command` from `$app/server`) over `+page.server.ts` loads and form actions, with Valibot or Zod schemas validating every argument.
  - Still experimental: enable `experimental.remoteFunctions` and `compilerOptions.experimental.async` in the `sveltekit()` plugin options in `vite.config.ts`.
  - Form inputs must spread field attributes, e.g. `<input {...addEntry.fields.odometer.as('number')} />`. A hand-written `name="..."` is rejected on submit. Show validation errors with `fields.x.issues()`.
  - `event.url`, `event.params` and `event.route` throw inside a `query`, so pass any values the query needs as arguments.
  - Remote modules can't live inside a `server` directory. Put DB code in a server-only module and import it from the `.remote.ts` file.
- **Database:** MySQL 8.0 via **Kysely** (query builder) + `mysql2`. Not Drizzle (deployment problems on the host). Table types are in `#lib/server/db/schema.ts`.
  - Migrations: add `#lib/server/db/migrations/NNNN_description.ts` exporting `up`/`down` (typed `Kysely<unknown>`), and update `schema.ts` to match. They're bundled via `import.meta.glob` and applied on server start (`hooks.server.ts`). Never edit a migration that has been deployed. Don't switch to Kysely's `FileMigrationProvider`: the host needs a self-contained `build/`.
  - Kysely 0.29: the migration API is imported from `kysely/migration`, not `kysely`.
  - Env vars are declared in `src/env.ts` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). Never write production credentials into the repo or `.env`.
- **Styling:** Tailwind CSS 4, mobile-first, businesslike green theme. Use the `brand-*` colours from `src/routes/layout.css`.
- **UI:** create/edit records in popups using `#lib/components/Dialog.svelte` (movable, closes on outside click).
- **Deployment:** handled manually (Hostinger, Node.js app hosting, `adapter-node`). Set `TZ` there so date rules use the right calendar day.

## SvelteKit 3 conventions (differ from older docs and training data)

- There is no `svelte.config.js`. All config (adapter, `compilerOptions`, `experimental`, `csrf`, `paths`) goes in `sveltekit({...})` in `vite.config.ts`.
- `$lib` is replaced by `#lib`, declared in `package.json` `imports`. Imports need file extensions, e.g. `import { db } from '#lib/server/db.ts'`.
- Use `$app/state`, not `$app/stores` (removed). Use `$app/env`, not `$app/environment` (renamed). Use `$app/env/private` / `$app/env/public`, not the deprecated `$env/*` modules.
- Server-only files are any file with a `server` segment (`db.server.ts`, `server.ts`) or anything inside a `server/` directory outside `src/routes`.
- Use `Response.json(...)` rather than the deprecated `json(...)` helper, and `refreshAll` rather than `invalidateAll`.
- `error(status, message, extra?)`: the message must be a string, and extra properties go in the third argument.
- `tsconfig.json` extends `$app/tsconfig`.
- When in doubt, check the docs (see below). Older blog posts and examples are often SvelteKit 2.

## Svelte tooling

The official Svelte plugin (MCP server, skills and the `svelte:svelte-file-editor` agent) is installed.

- When creating or editing `.svelte` / `.svelte.ts` / `.svelte.js` files, prefer delegating to the `svelte-file-editor` agent to save context.
- Look up current docs with the MCP tools described below instead of relying on memory, especially for remote functions and other newer APIs.

## Commands

- `npm run db:up` / `npm run db:down`: start/stop the MySQL container (dev DB `mileagemaster`, test DB `mileagemaster_test`). First time: `cp .env.example .env`.
- `npm run dev`: dev server at http://localhost:5173 (needs `db:up`).
- `npm run check`: type check. `npm run lint`: Prettier + ESLint. `npm run format`: fix formatting.
- `npm run test:unit -- --run`: Vitest (domain rules + repository tests against the test DB).
- `npm run test:e2e`: Playwright UI tests (builds the app, runs it against the test DB).
- `npm test`: all of the above tests.

Every feature needs unit tests and Playwright UI tests. Run `check`, `lint` and `test` before committing.

## Conventions

- Work on a feature branch and open a PR. Don't commit directly to `main` unless asked.
- Keep commits small and descriptive, since the owner is learning Git through this project.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
