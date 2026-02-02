import { Elysia } from "elysia";
import { sessionsRouter } from "./sessions";
import { githubRouter } from "./github";

export const apiRouter = new Elysia()
  .use(sessionsRouter)
  .use(githubRouter)

export type ApiRouter = typeof apiRouter;