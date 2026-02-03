import { Elysia, status } from "elysia";
import { eq } from "drizzle-orm";
import index from "./index.html";
import { db, schema } from "./db";
import { apiRouter } from "./api";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { AppError } from "@lib/error";

migrate(db, { migrationsFolder: "src/db/migrations" });

const app = new Elysia({
  cookie: { secrets: process.env.COOKIE_SECRET || "change-this-in-production" },
})
  .get("/", index)
  .use(apiRouter)
  .all("*", () => status(404))
  .onError(({ code, error }) => {
    console.error(`Error ${code}:`, error);

    if (error instanceof AppError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    const statusCode = code === "VALIDATION" ? 400 : 500;
    const message = error instanceof Error ? error.message : "Internal Error";
    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  })
  .listen({ port: 3000 });

const gracefulShutdown = async () => {
  console.log("\nShutting down...");
  await db
    .update(schema.sessions)
    .set({ status: "stopped" })
    .where(eq(schema.sessions.status, "running"));
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

console.log(`🚀 OpenCode Manager running at ${app.server?.url}`);
