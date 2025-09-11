import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { getAllPullRequests } from "@/lib/github-pr";

export const pullRequestRouter = createTRPCRouter({
    getOpenPullRequests: protectedProcedure.input(z.object({
        owner: z.string(),
        repo: z.string()
    })).query(async ({ ctx, input }) => {
        const prs = await getAllPullRequests(input.owner, input.repo, ctx.user.userId!, "open");
        return { pullRequests: prs };
    }),

    getAllPullRequests: protectedProcedure.input(z.object({
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("all")
    })).query(async ({ ctx, input }) => {
        const prs = await getAllPullRequests(input.owner, input.repo, ctx.user.userId!, input.state);
        return { pullRequests: prs };
    })
});
