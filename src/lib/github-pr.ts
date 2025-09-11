import { Octokit } from "octokit";
import { db } from "@/server/db";

type PullRequestUser = {
    login: string;
    avatar_url: string;
    html_url?: string;
};

export type PullRequestItem = {
    number: number;
    title: string;
    state: string;
    user: PullRequestUser | null;
    created_at: string;
    updated_at: string;
    html_url: string;
    head_ref: string;
    base_ref: string;
    draft: boolean;
};

async function getAuthenticatedOctokit(userId?: string) {
    if (!userId) {
        return new Octokit({ auth: process.env.GITHUB_TOKEN });
    }

    const githubAccount = await db.account.findFirst({
        where: {
            userId: userId,
            providerId: "github"
        }
    });

    if (!githubAccount || !githubAccount.accessToken) {
        return new Octokit({ auth: process.env.GITHUB_TOKEN });
    }

    return new Octokit({ auth: githubAccount.accessToken });
}

const mapPullRequestData = (pr: any): PullRequestItem => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    user: pr.user
        ? {
            login: pr.user.login,
            avatar_url: pr.user.avatar_url,
            html_url: pr.user.html_url
        }
        : null,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    html_url: pr.html_url,
    head_ref: pr.head?.ref ?? "",
    base_ref: pr.base?.ref ?? "",
    draft: Boolean(pr.draft)
});

export const getAllPullRequests = async (
    owner: string,
    repo: string,
    userId?: string,
    state: "open" | "closed" | "all" = "all"
): Promise<PullRequestItem[]> => {
    try {
        const octokit = await getAuthenticatedOctokit(userId);

        let pullRequests: any[] = [];

        if (state === "all") {
            const [openPRs, closedPRs] = await Promise.all([
                octokit.paginate(octokit.rest.pulls.list, {
                    owner,
                    repo,
                    state: "open",
                    per_page: 100,
                    sort: "created",
                    direction: "desc"
                }),
                octokit.paginate(octokit.rest.pulls.list, {
                    owner,
                    repo,
                    state: "closed",
                    per_page: 100,
                    sort: "created",
                    direction: "desc"
                })
            ]);
            pullRequests = [...openPRs, ...closedPRs];
        } else {
            pullRequests = await octokit.paginate(octokit.rest.pulls.list, {
                owner,
                repo,
                state,
                per_page: 100,
                sort: "created",
                direction: "desc"
            });
        }

        pullRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return pullRequests.map(mapPullRequestData);
    } catch (error) {
        console.error(`Error fetching pull requests for ${owner}/${repo}:`, error);
        throw new Error(`Failed to fetch pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
