---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## Project Overview

OpenCode Manager is a web app for managing OpenCode coding sessions. It clones GitHub repositories, spawns OpenCode server instances, and provides a web UI to manage them.

## Architecture

```
src/
├── server.ts          # Elysia server entry point (port 3000)
├── index.html         # HTML entry point (imports app/index.tsx)
├── api/               # Backend API routes (Elysia routers)
│   ├── index.ts       # Main router, exports ApiRouter type for Eden
│   ├── sessions.ts    # CRUD for OpenCode sessions
│   ├── auth.ts        # GitHub OAuth flow
│   └── github.ts      # GitHub API proxy endpoints
├── db/                # Database layer (SQLite + Drizzle)
│   ├── index.ts       # DB connection (opencode-manager.db)
│   └── schema.ts      # Drizzle schema (sessions, githubTokens tables)
├── lib/               # Shared utilities
│   ├── api.ts         # Eden client for frontend (type-safe API calls)
│   ├── session-manager.ts  # Core session logic (clone, start, stop)
│   ├── github-client.ts    # GitHub API wrapper
│   └── utils.ts       # Helpers (generateId, getRandomPort)
└── app/               # React frontend
    ├── index.tsx      # React entry point with QueryClientProvider
    ├── globals.css    # Tailwind CSS
    ├── home/          # Home page components
    └── components/ui/ # Reusable UI components (shadcn-style)
```

## Import Aliases

Path aliases are configured in tsconfig.json. Use `@*` which maps to `./src/*`:

```ts
import { db, schema } from "@db"; // src/db/index.ts
import { api } from "@lib/api"; // src/lib/api.ts
import { Button } from "@app/components/ui/button";
import { getCookieSchema } from "@api"; // src/api/index.ts
```

## Backend Patterns

### Elysia Routers

API routes use Elysia with composable routers:

```ts
import { Elysia, t } from "elysia";

export const myRouter = new Elysia()
  .get("/api/items", async () => {
    return { success: true, data: items };
  })
  .post(
    "/api/items",
    async ({ body }) => {
      // handle creation
    },
    {
      body: t.Object({ name: t.String() }),
    },
  );
```

### Database Queries

Use Drizzle ORM with `bun:sqlite`:

```ts
import { eq } from "drizzle-orm";
import { db, schema } from "@db";

// Select
const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));

// Insert with returning
const [result] = await db
  .insert(schema.sessions)
  .values({ id, repo, branch, port, status: "stopped", createdAt: new Date() })
  .returning();

// Update
await db.update(schema.sessions).set({ status: "running", pid }).where(eq(schema.sessions.id, id));
```

### Shell Commands

Use Bun's shell (`$`) for subprocess operations:

```ts
import { $ } from "bun";

await $`git clone --depth 1 -b ${branch} ${url} ${dir}`;
await $`kill -9 ${pid}`.nothrow().quiet();
const output = await $`ls -la ${path}`.text();
```

## Frontend Patterns

### Type-Safe API Calls

Use Eden treaty client (generated from ApiRouter type):

```ts
import { api } from "@lib/api";

// GET
const { data } = await api.sessions.get();
const { data } = await api.sessions[":id"].get({ params: { id } });

// POST
await api.sessions.post({ repo, branch });
await api.sessions[":id"].start.post({ params: { id } });
```

### React Query

All data fetching uses TanStack Query:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ["sessions"],
  queryFn: () => api.sessions.get().then((res) => res.data?.data),
  refetchInterval: 5000,
});

const mutation = useMutation({
  mutationFn: (body) => api.sessions.post(body),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
});
```

### UI Components

Components are in `src/app/components/ui/` (shadcn-style with base-ui). Import directly:

```tsx
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@app/components/ui/dialog";
```

## Environment Variables

```env
COOKIE_SECRET=your-secret           # Cookie encryption
GITHUB_CLIENT_ID=xxx                # GitHub OAuth
GITHUB_CLIENT_SECRET=xxx            # GitHub OAuth
APP_URL=http://localhost:3000       # Redirect URL for OAuth
SESSIONS_DIR=./sessions             # Where repos are cloned
```

## Key Files

- `src/lib/session-manager.ts` - Core logic for creating/starting/stopping OpenCode sessions
- `src/api/auth.ts` - GitHub OAuth implementation
- `src/db/schema.ts` - Database schema definitions
- `src/lib/api.ts` - Frontend API client (Eden)

## Common Tasks

### Add a new API endpoint

1. Create or edit router in `src/api/`
2. Add to `apiRouter` in `src/api/index.ts`
3. Frontend automatically gets types via Eden

### Add a new database table

1. Add schema in `src/db/schema.ts`
2. Run `bun run db:push` to sync

### Add a new UI component

1. Create in `src/app/components/ui/`
2. Follow existing patterns (base-ui primitives + tailwind)

## Bun APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
