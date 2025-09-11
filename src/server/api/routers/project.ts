
import { getAllBranches, pollCommits } from "@/lib/github";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { checkCredits, indexGithubRepo } from "@/lib/github-loader";
import { deleteFile } from "@/lib/firebase";
import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});


export const projectRouter = createTRPCRouter({
    // Update project organization
    updateProjectOrganization: protectedProcedure
        .input(
            z.object({
                projectId: z.string(),
                organizationId: z.string().optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if the project exists and user has access
            const project = await ctx.db.project.findFirst({
                where: {
                    id: input.projectId,
                    userToProjects: {
                        some: {
                            userId: ctx.user.userId!
                        }
                    }
                }
            });

            if (!project) {
                throw new Error('Project not found or you do not have access');
            }

            // If organizationId is provided, check if user is a member of the organization
            if (input.organizationId) {
                const membership = await (ctx.db as any).organizationMember.findFirst({
                    where: {
                        userId: ctx.user.userId!,
                        organizationId: input.organizationId
                    }
                });
                
                if (!membership) {
                    throw new Error('You are not a member of this organization');
                }
            }

            // Update the project with the organization ID
            return await (ctx.db as any).project.update({
                where: {
                    id: input.projectId
                },
                data: {
                    organizationId: input.organizationId
                }
            });
        }),
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
            branches: z.array(z.object({ name: z.string(), isActive: z.boolean() })).optional()

        })


    ).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true
            }
        })
        if (!user) {
            throw new Error('User not found')
        }

        const currentCredits = user.credits || 0;
        const githubAccount = await ctx.db.account.findFirst({
            where: {
                userId: ctx.user.userId!,
                providerId: "github"
            }
        });

        const fileCount = await checkCredits(input.githubUrl, githubAccount?.accessToken || input.githubToken || process.env.GITHUB_TOKEN)
        console.log("🚀 ~ fileCount:", fileCount);
        if (currentCredits < fileCount) {
            throw new Error('Insufficient credits')
        }




        const project = await ctx.db.project.create({
            data: {
                name: input.name,
                githubUrl: input.githubUrl,
                userToProjects: {
                    create: {

                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        if (input.branches) {
            await (ctx.db as any).projectBranch.createMany({
                data: input.branches.map((branch) => ({
                    projectId: project.id,
                    name: branch.name,
                    isActive: true,
                }))
            })
        } else {
            await (ctx.db as any).projectBranch.create({
                data: {
                    projectId: project.id,
                    name: 'main',
                    isActive: true,
                }
            })
        }
        await indexGithubRepo(project.id, input.githubUrl, githubAccount?.accessToken || input.githubToken || process.env.GITHUB_TOKEN)
        await pollCommits(project.id, ctx.user.userId!).catch(error => {
            console.error("Error polling commits after return:", error);
        });
        await ctx.db.user.update({
            where: { id: ctx.user.userId! },
            data: {
                credits: {
                    decrement: fileCount
                }
            }
        })
        return project
    }),
    getProjects: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        })

    }),
    getCommits: protectedProcedure.input(z.object({
        projectId: z.string(),
        commitAuthorName: z.string().optional(),
        branchName: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20)
    })).query(async ({ ctx, input }) => {
        pollCommits(input.projectId, ctx.user.userId!).catch(error => {
            console.error("Error polling commits after return:", error);
        });

        const skip = (input.page - 1) * input.limit;
        
        const where: any = {
            projectId: input.projectId
        };
        
        if (input.commitAuthorName) {
            where.commitAuthorName = input.commitAuthorName;
        }
        
        if (input.branchName) {
            where.branchName = input.branchName;
        }
        
        const totalCount = await ctx.db.commit.count({ where });
        
        const commits = await ctx.db.commit.findMany({
            where,
            orderBy: {
                commitDate: 'desc'
            },
            skip,
            take: input.limit
        });
        
        return {
            commits,
            pagination: {
                total: totalCount,
                page: input.page,
                limit: input.limit,
                totalPages: Math.ceil(totalCount / input.limit)
            }
        };
    }),

    getCommitsSingle: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ ctx, input }) => {
        
        const commits = await ctx.db.commit.findMany();
        
        return {
            commits
        };
    }),

    getCommitDiff: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            commitHash: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                select: { githubUrl: true },
            });

            if (!project?.githubUrl) {
                throw new Error("Project not found or GitHub URL is missing.");
            }

            const [owner, repo] = project.githubUrl.split("/").slice(-2);
            if (!owner || !repo) {
                throw new Error("Invalid GitHub URL format.");
            }

            try {
                const response = await octokit.rest.repos.getCommit({
                    owner,
                    repo,
                    ref: input.commitHash,
                    headers: {
                        Accept: "application/vnd.github.v3.diff",
                    },
                });
                const diffContent = response.data as unknown as string;

                if (!diffContent) {
                    throw new Error("No diff content found for this commit.");
                }

                return diffContent;
            } catch (error) {
                console.error("Error fetching commit diff with Octokit:", error);
                if (error instanceof Error) {
                    throw new Error(`An error occurred while retrieving the commit diff: ${error.message}`);
                }
                throw new Error("An unknown error occurred while retrieving the commit diff.");
            }
        }),

    getBranches: protectedProcedure.input(z.object({
        githubUrl: z.string().url(),
    })).query(async ({ ctx, input }) => {
        try {
            const userId = ctx.user.userId!
            const branches = await getAllBranches(input.githubUrl, userId);
            return branches;
        } catch (error) {
            console.error("Error fetching branches:", error);
            throw new Error("Failed to fetch branches for the repository.");
        }
    }),

    getProjectBranches: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ ctx, input }) => {
        return await (ctx.db as any).projectBranch.findMany({
            where: {
                projectId: input.projectId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }),

    addProjectBranch: protectedProcedure.input(z.object({
        projectId: z.string(),
        name: z.string(),
        isActive: z.boolean().default(false), 
        isOpen: z.boolean().default(true)
    })).mutation(async ({ ctx, input }) => {
        return await (ctx.db as any).projectBranch.create({
            data: {
                projectId: input.projectId,
                name: input.name,
                isActive: input.isActive, 
                isOpen: input.isOpen
            }
        });
    }),

    updateProjectBranch: protectedProcedure.input(z.object({
        id: z.string(),
        isActive: z.boolean().optional(), 
        isOpen: z.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
        return await (ctx.db as any).projectBranch.update({
            where: {
                id: input.id
            },
            data: {
                isActive: input.isActive, 
                isOpen: input.isOpen
            }
        });
    }),

    deleteProjectBranch: protectedProcedure.input(z.object({
        id: z.string()
    })).mutation(async ({ ctx, input }) => {
        return await (ctx.db as any).projectBranch.delete({
            where: {
                id: input.id
            }
        });
    }),

    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        filesReferences: z.any(),
        answer: z.string()
    })).mutation(async ({ ctx, input }) => {
        return await ctx.db.question.create({
            data: {
                answer: input.answer,
                filesReferences: input.filesReferences,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!

            }
        })
    }),
    getQuestions: protectedProcedure.input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.question.findMany({
                where: {
                    projectId: input.projectId
                },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        }),
    uploadMeeting: protectedProcedure.input(z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string()
    })).mutation(async ({ ctx, input }) => {
        const meeting = await ctx.db.meeting.create({
            data: {
                meetingUrl: input.meetingUrl,
                projectId: input.projectId,
                name: input.name,
                status: "PROCESSING"
            }
        })
        return meeting
    }),
    getMeetings: protectedProcedure.input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.meeting.findMany({
                where: {
                    projectId: input.projectId
                }, include: {
                    issues: true
                }
            })
        }),

    deleteMeeting: protectedProcedure.input(z.object({ meetingId: z.string() })).mutation(async ({ ctx, input }) => {
        try {
            const meeting = await ctx.db.meeting.findUnique({
                where: {
                    id: input.meetingId
                }
            });

            if (!meeting) {
                throw new Error(`Meeting with ID ${input.meetingId} not found`);
            }

            await ctx.db.issue.deleteMany({
                where: {
                    meetingId: input.meetingId
                }
            });

            const deletedMeeting = await ctx.db.meeting.delete({
                where: {
                    id: input.meetingId
                }
            });

            if (meeting.meetingUrl) {
                await deleteFile(meeting.meetingUrl).catch(error => {
                    console.error('Error deleting file from Firebase:', error);
                  
                });
            }

            return deletedMeeting;
        } catch (error) {
            console.error('Error in deleteMeeting:', error);
            throw error;
        }
    }),

    getMeetingById: protectedProcedure.input(z.object({ meetingId: z.string() })).query(async ({ ctx, input }) => {
        return await ctx.db.meeting.findUnique({
            where: {
                id: input.meetingId
            },
            include: {
                issues: true
            }
        })
    }),

    archiveProject: protectedProcedure.input(z.object({ projectId: z.string() })).mutation(async ({ ctx, input }) => {
        return await ctx.db.project.update({
            where: {
                id: input.projectId
            },
            data: {
                deletedAt: new Date()
            }
        })
    }),
    getTeamMembers: protectedProcedure.input(z.object({ projectId: z.string() })).query(async ({ ctx, input }) => {
        return await ctx.db.userToProject.findMany({
            where: {
                projectId: input.projectId
            },
            include: {
                user: true
            }
        })
    }),

    getMyCredits: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true,
                id: true
            }
        })
    }),

    checkGitHubConnection: protectedProcedure.query(async ({ ctx }) => {
        const githubAccount = await ctx.db.account.findFirst({
            where: {
                userId: ctx.user.userId!,
                providerId: "github"
            }
        });

        let hasPrivateRepoAccess = false;

        if (githubAccount?.accessToken) {
            try {
                const octokit = new Octokit({
                    auth: githubAccount.accessToken,
                });
                const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
                    visibility: 'private',
                    per_page: 1,
                });
                hasPrivateRepoAccess = repos.length > 0 && true;
            } catch (error) {
                console.error('Error checking private repo access:', error);
                hasPrivateRepoAccess = false;
            }
        }
        return {
            isConnected: hasPrivateRepoAccess,
            accountDetails: hasPrivateRepoAccess,
            hasPrivateRepoAccess
        };
    }),

    getUserRepositories: protectedProcedure.query(async ({ ctx }) => {
        const githubAccount = await ctx.db.account.findFirst({
            where: {
                userId: ctx.user.userId!,
                providerId: "github"
            }
        });

        if (!githubAccount?.accessToken) {
            return { repositories: [] };
        }

        try {
            const userOctokit = new Octokit({
                auth: githubAccount.accessToken,
            });
            const { data: userRepos } = await userOctokit.rest.repos.listForAuthenticatedUser({
                visibility: 'all',
                sort: 'updated',
                per_page: 100,
                affiliation: 'owner'
            });

            const accessibleRepos = userRepos.filter(repo => {
                return repo.permissions?.admin || repo.permissions?.push;
            });
            return {
                repositories: accessibleRepos.map(repo => ({
                    id: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    url: repo.html_url,
                    isPrivate: repo.private
                }))
            };
        } catch (error) {
            console.error('Error fetching accessible repositories:', error);
            return { repositories: [] };
        }
    }),

    checkCredits: protectedProcedure.input(z.object({ githubUrl: z.string(), githubToken: z.string().optional() })).mutation(async ({ ctx, input }) => {
        console.log("🚀 ~ checkCredits:protectedProcedure.input ~ githubUrl:", input.githubUrl)
        const githubAccount = await ctx.db.account.findFirst({
            where: {
                userId: ctx.user.userId!,
                providerId: "github"
            }
        });
        if (!githubAccount) {
            return { fileCount: 0, userCredits: 0, allBranch: [], githubAccount: null };
        }
        const fileCount = await checkCredits(input.githubUrl, githubAccount.accessToken || input.githubToken || process.env.GITHUB_TOKEN)
        const userCredits = await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true
            }
        })
        const userId = ctx.user.userId!
        const allBranch = await getAllBranches(input.githubUrl, userId)
        return { fileCount, userCredits: userCredits?.credits || 0, allBranch, githubAccount }
    })
})
