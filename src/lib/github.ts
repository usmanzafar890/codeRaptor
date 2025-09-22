import { Octokit } from "octokit";
import { db } from "@/server/db"
import { aiSummariseCommit } from "./gemini";
import { auth } from "./auth";
import { headers } from "next/headers";


async function getAuthenticatedOctokit(userId: string) {
    // Fetch the user's GitHub account from the database using their userId
    const githubAccount = await db.account.findFirst({
        where: {
            userId: userId,
            providerId: "github"
        }
    });

    // If no account or access token is found, throw an error
    if (!githubAccount || !githubAccount.gitToken) {
        return new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });
    }

    // Create a new Octokit instance authenticated with the user's token
    return new Octokit({
        auth: githubAccount.gitToken
    });
}

// const octokit = new Octokit({
//     auth: process.env.GITHUB_TOKEN,
// });


type Response = {
    commitHash: string;
    commitMessage: string;
    commitDate: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    branchName: string;
}

export const getCommitHashes = async (githubUrl: string, branchName?: string, userId?: string): Promise<Response[]> => {
    const octokit = await getAuthenticatedOctokit(userId!);
    const [owner, repo] = githubUrl.split("/").slice(-2)
    if (!owner || !repo) {
        throw new Error("Invalid GitHub URL")
    }

    let actualBranch = branchName || '';
    if (!actualBranch) {
        try {
            const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
            actualBranch = repoData.default_branch;
        } catch (error) {
            console.error(`Error fetching default branch for ${owner}/${repo}:`, error);
            throw new Error(`Could not determine default branch for ${owner}/${repo}`);
        }
    }

    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: actualBranch // Use the specified branch
    })
    const sortedCommits = data.sort((a: any, b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[]


    return sortedCommits.slice(0, 10).map((commit: any) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit?.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? "",
        branchName: actualBranch
    }))
}


export const pollCommits = async (projectId: string, userId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId)
    const [owner, repo] = githubUrl.split("/").slice(-2);

    // Find active branches for this project
    const activeBranches = await (db as any).projectBranch.findMany({
        where: {
            projectId: projectId,
            isActive: true // Using isActive instead of isEnable for compatibility
        }
    });

    let allCommits: any[] = [];

    // If there are active branches, poll commits from each
    if (activeBranches.length > 0) {
        // Process each active branch
        for (const branch of activeBranches) {
            const branchCommitHashes = await getCommitHashes(githubUrl, branch.name, userId);
            const unprocessedBranchCommits = await filterUnprocessedCommits(projectId, branchCommitHashes);

            if (unprocessedBranchCommits.length > 0) {
                const summaryResponses = await Promise.allSettled(unprocessedBranchCommits.map(commit => {
                    return summariseCommit(owner!, repo!, commit.commitHash, userId);
                }));

                const summaries = summaryResponses.map((response) => {
                    if (response.status === 'fulfilled') {
                        return response.value as string;
                    }
                    return "";
                });

                const branchCommits = await db.commit.createMany({
                    data: summaries.map((summary, index) => {
                        console.log(`processing commit ${index + 1} from branch ${branch.name}`);
                        return {
                            projectId: projectId,
                            commitHash: unprocessedBranchCommits[index]!.commitHash,
                            commitMessage: unprocessedBranchCommits[index]!.commitMessage,
                            commitAuthorName: unprocessedBranchCommits[index]!.commitAuthorName,
                            commitAuthorAvatar: unprocessedBranchCommits[index]!.commitAuthorAvatar,
                            commitDate: unprocessedBranchCommits[index]!.commitDate,
                            branchName: branch.name,
                            summary,
                        };
                    })
                });

                allCommits.push(branchCommits);
            }
        }
    } else {
        // If no active branches, fall back to default behavior (main branch)
        const commitHashes = await getCommitHashes(githubUrl, undefined, userId);
        const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);

        if (unprocessedCommits.length > 0) {
            const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit => {
                return summariseCommit(owner!, repo!, commit.commitHash, userId);
            }));

            const summaries = summaryResponses.map((response) => {
                if (response.status === 'fulfilled') {
                    return response.value as string;
                }
                return "";
            });

            const commits = await db.commit.createMany({
                data: summaries.map((summary, index) => {
                    console.log(`processing commit ${index + 1} from default branch`);
                    return {
                        projectId: projectId,
                        commitHash: unprocessedCommits[index]!.commitHash,
                        commitMessage: unprocessedCommits[index]!.commitMessage,
                        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                        commitDate: unprocessedCommits[index]!.commitDate,
                        branchName: unprocessedCommits[index]!.branchName,
                        summary,
                    };
                })
            });

            allCommits.push(commits);
        }
    }

    return allCommits.flat();
}

async function summariseCommit(owner: string, repo: string, commitSha: string , userId:string) {
    try {
        const octokit = await getAuthenticatedOctokit(userId);
        const { data } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commitSha,
            headers: {
                Accept: "application/vnd.github.v3.diff",
            },
        });

        const diffContent = data as unknown as string;

        if (!diffContent) {
            console.warn(`No diff content found for commit ${commitSha}. Raw data:`, data);
            return "";
        }

        return (await aiSummariseCommit(diffContent)) || "";
    } catch (error) {
        console.error(`Error fetching or summarizing commit diff for ${commitSha}:`, error);
        return "";
    }
}


async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            githubUrl: true,
        }
    })
    if (!project?.githubUrl) {
        throw new Error("Project has no GitHub URL")
    }
    return { project, githubUrl: project.githubUrl }
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId
        }
    })

    const unprocessedCommits = commitHashes.filter((commit) => !processedCommits.some((processedCommit) => processedCommit.commitHash === commit.commitHash))
    return unprocessedCommits
}

export const getAllBranches = async (githubUrl: string , userId:string): Promise<string[]> => {
    const octokit = await getAuthenticatedOctokit(userId);
    const [owner, repo] = githubUrl.split("/").slice(-2);
    if (!owner || !repo) {
        throw new Error("Invalid GitHub URL");
    }

    try {
        const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
            owner,
            repo,
            per_page: 10,
        });

        const branchNames = branches.map(branch => branch.name);
        return branchNames;
    } catch (error) {
        console.error(`Error fetching branches for ${owner}/${repo}:`, error);
        throw new Error(`Failed to fetch branches for ${owner}/${repo}`);
    }
};