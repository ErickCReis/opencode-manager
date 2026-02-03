import { Elysia, t, status } from "elysia";
import { createGitHubClient } from "../lib/github-client";
import { getCookieSchema } from "@api";
import { schema } from "@db";
import { db } from "@db";
import { eq } from "drizzle-orm";

export const githubRouter = new Elysia()
  .guard({
    cookie: getCookieSchema(),
  })
  .resolve(async ({ cookie }) => {
    const tokenId = cookie.github_token_id?.value;
    if (!tokenId) {
      return status(401, { success: false, error: "Not authenticated" });
    }

    const [tokenRecord] = await db
      .select({ accessToken: schema.githubTokens.accessToken })
      .from(schema.githubTokens)
      .where(eq(schema.githubTokens.id, tokenId))
      .limit(1);

    if (!tokenRecord) {
      return status(401, { success: false, error: "Token not found" });
    }

    return { github: createGitHubClient(tokenRecord.accessToken) };
  })
  .get("/api/auth/github/repos", async ({ github }) => {
    try {
      const repos = await github.listUserRepos();
      return { success: true, data: repos };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch repos",
      };
    }
  })
  .get("/api/github/:owner/repo/:repo", async ({ github, params }) => {
    try {
      const repo = await github.getRepo(params.owner, params.repo);
      return { success: true, data: repo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch repo",
      };
    }
  })
  .get("/api/github/:owner/repo/:repo/branches", async ({ github, params }) => {
    try {
      const branches = await github.listBranches(params.owner, params.repo);
      return { success: true, data: branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch branches",
      };
    }
  })
  .post(
    "/api/github/:owner/repo/:repo/branches",
    async ({ github, params, body }) => {
      try {
        const branch = await github.createBranch(
          params.owner,
          params.repo,
          body.branchName,
          body.baseBranch,
        );
        return { success: true, data: branch };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create branch",
        };
      }
    },
    {
      body: t.Object({
        branchName: t.String(),
        baseBranch: t.String(),
      }),
    },
  )
  .post(
    "/api/github/:owner/repo/:repo/pulls",
    async ({ github, params, body }) => {
      try {
        const pr = await github.createPullRequest(
          params.owner,
          params.repo,
          body.title,
          body.body,
          body.head,
          body.base,
        );
        return { success: true, data: pr };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create PR",
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        body: t.String(),
        head: t.String(),
        base: t.String(),
      }),
    },
  )
  .get(
    "/api/github/:owner/repo/:repo/pulls",
    async ({ github, params, query }) => {
      try {
        const prs = await github.getPullRequests(params.owner, params.repo, query.state || "open");
        return { success: true, data: prs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch PRs",
        };
      }
    },
    {
      query: t.Object({
        state: t.Union([t.Literal("open"), t.Literal("closed"), t.Literal("all")]),
      }),
    },
  );
