import { Elysia, t } from "elysia";
import { createGitHubClient } from "../lib/github-client";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

export const githubRouter = new Elysia()
  .get("/api/github/repos/:owner/:repo", async ({ params }) => {
    try {
      const client = createGitHubClient(GITHUB_TOKEN);
      const repo = await client.getRepo(params.owner, params.repo);
      return { success: true, data: repo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch repo",
      };
    }
  })
  .get("/api/github/repos/:owner/:repo/branches", async ({ params }) => {
    try {
      const client = createGitHubClient(GITHUB_TOKEN);
      const branches = await client.listBranches(params.owner, params.repo);
      return { success: true, data: branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch branches",
      };
    }
  })
  .post(
    "/api/github/repos/:owner/:repo/branches",
    async ({ params, body }) => {
      try {
        const client = createGitHubClient(GITHUB_TOKEN);
        const branch = await client.createBranch(
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
    "/api/github/repos/:owner/:repo/pulls",
    async ({ params, body }) => {
      try {
        const client = createGitHubClient(GITHUB_TOKEN);
        const pr = await client.createPullRequest(
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
    "/api/github/repos/:owner/:repo/pulls",
    async ({ params, query }) => {
      try {
        const client = createGitHubClient(GITHUB_TOKEN);
        const prs = await client.getPullRequests(params.owner, params.repo, query.state || "open");
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
