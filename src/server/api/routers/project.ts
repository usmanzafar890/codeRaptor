import { getAllBranches, pollCommits } from "@/lib/github";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { checkCredits, indexGithubRepo } from "@/lib/github-loader";
import { deleteFile } from "@/lib/firebase";
import { Octokit } from "octokit";
import jwt from "jsonwebtoken";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const projectRouter = createTRPCRouter({
  updateProjectOrganization: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the project exists and user has access
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userToProjects: {
            some: {
              userId: ctx.user.userId!,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found or you do not have access");
      }

      // If organizationId is provided, check if user is a member of the organization
      if (input.organizationId) {
        const membership = await (ctx.db as any).organizationMember.findFirst({
          where: {
            userId: ctx.user.userId!,
            organizationId: input.organizationId,
          },
        });

        if (!membership) {
          throw new Error("You are not a member of this organization");
        }
      }

      // Update the project with the organization ID
      return await (ctx.db as any).project.update({
        where: {
          id: input.projectId,
        },
        data: {
          organizationId: input.organizationId,
        },
      });
    }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
        organizationId: z.string().nullable().optional(),
        branches: z
          .array(z.object({ name: z.string(), isActive: z.boolean() }))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.userId!,
        },
        select: {
          credits: true,
        },
      });
      if (!user) {
        throw new Error("User not found");
      }

      const currentCredits = user.credits || 0;
      const githubAccount = await ctx.db.account.findFirst({
        where: {
          userId: ctx.user.userId!,
          providerId: "github",
        },
      });

      const fileCount = await checkCredits(
        input.githubUrl,
        githubAccount?.gitToken ||
        input.githubToken ||
        process.env.GITHUB_TOKEN,
      );
      console.log("🚀 ~ fileCount:", fileCount);
      if (currentCredits < fileCount) {
        throw new Error("Insufficient credits");
      }

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          organizationId: input.organizationId || null,
          userToProjects: {
            create: {
              userId: ctx.user.userId!,
              access: "OWNER",
              status: "ACCEPTED",
              invitedBy: ctx.user.userId!,
            },
          },
        },
      });

      if (input.branches) {
        await (ctx.db as any).projectBranch.createMany({
          data: input.branches.map((branch) => ({
            projectId: project.id,
            name: branch.name,
            isActive: true,
          })),
        });
      } else {
        await (ctx.db as any).projectBranch.create({
          data: {
            projectId: project.id,
            name: "main",
            isActive: true,
          },
        });
      }
      // Deduct credits immediately
      await ctx.db.user.update({
        where: { id: ctx.user.userId! },
        data: {
          credits: {
            decrement: fileCount,
          },
        },
      });


      await pollCommits(project.id, ctx.user.userId!).catch((error) => {
        console.error("Error polling commits in background:", error);
      });

      // Process indexing and commit polling in background (don't await)
      // This allows the project creation to return immediately
      indexGithubRepo(
        project.id,
        input.githubUrl,
        githubAccount?.gitToken ||
        input.githubToken ||
        process.env.GITHUB_TOKEN,
      ).catch((error) => {
        console.error("Error indexing repository in background:", error);
      });



      return project;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        userToProjects: {
          some: {
            userId: ctx.user.userId!,
            // Only include projects where the user has accepted the invitation
            status: "ACCEPTED",
          },
        },
        deletedAt: null,
      },
      include: {
        userToProjects: {
          where: {
            userId: ctx.user.userId!,
          },
        },
      },
    });
    return projects;
  }),

  getMyProjectsWithAccess: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: {
          some: {
            userId: ctx.user.userId!,
            // Only include projects where the user has accepted the invitation
            status: "ACCEPTED",
          },
        },
        deletedAt: null,
      },
      include: {
        userToProjects: {
          where: {
            userId: ctx.user.userId!,
          },
        },
      },
    });
  }),

  getProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          userToProjects: {
            some: {
              userId: ctx.user.userId!,
              status: "ACCEPTED",
            },
          },
          deletedAt: null,
        },
        include: {
          branches: true,
          commits: {
            take: 5,
            orderBy: {
              commitDate: "desc",
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found or you do not have access");
      }

      return project;
    }),

  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        commitAuthorName: z.string().optional(),
        branchName: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.user.userId!,
          status: "ACCEPTED",
        },
      });

      if (!userProject) {
        throw new Error(
          "Project not found or you don't have access. You may need to accept the invitation first.",
        );
      }

      pollCommits(input.projectId, ctx.user.userId!).catch((error) => {
        console.error("Error polling commits after return:", error);
      });

      const skip = (input.page - 1) * input.limit;

      const where: any = {
        projectId: input.projectId,
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
          commitDate: "desc",
        },
        skip,
        take: input.limit,
      });

      return {
        commits,
        pagination: {
          total: totalCount,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
        },
      };
    }),

  getCommitsSingle: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const commits = await ctx.db.commit.findMany();

      return {
        commits,
      };
    }),

  getCommitDiff: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        commitHash: z.string(),
      }),
    )
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
          throw new Error(
            `An error occurred while retrieving the commit diff: ${error.message}`,
          );
        }
        throw new Error(
          "An unknown error occurred while retrieving the commit diff.",
        );
      }
    }),

  getBranches: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string().url(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.userId!;
        const branches = await getAllBranches(input.githubUrl, userId);
        return branches;
      } catch (error) {
        console.error("Error fetching branches:", error);
        throw new Error("Failed to fetch branches for the repository.");
      }
    }),

  getProjectBranches: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await (ctx.db as any).projectBranch.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }),

  addProjectBranch: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        isActive: z.boolean().default(false),
        isOpen: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).projectBranch.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          isActive: input.isActive,
          isOpen: input.isOpen,
        },
      });
    }),

  updateProjectBranch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        isOpen: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).projectBranch.update({
        where: {
          id: input.id,
        },
        data: {
          isActive: input.isActive,
          isOpen: input.isOpen,
        },
      });
    }),

  deleteProjectBranch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).projectBranch.delete({
        where: {
          id: input.id,
        },
      });
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        filesReferences: z.any(),
        answer: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          filesReferences: input.filesReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.user.userId!,
        },
      });
    }),

  getQuestions: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  uploadMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.create({
        data: {
          meetingUrl: input.meetingUrl,
          projectId: input.projectId,
          name: input.name,
          status: "PROCESSING", // This is fine, it's for the Meeting model
        },
      });
      return meeting;
    }),

  getMeetings: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          issues: true,
        },
      });
    }),

  deleteMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const meeting = await ctx.db.meeting.findUnique({
          where: {
            id: input.meetingId,
          },
        });

        if (!meeting) {
          throw new Error(`Meeting with ID ${input.meetingId} not found`);
        }

        await ctx.db.issue.deleteMany({
          where: {
            meetingId: input.meetingId,
          },
        });

        const deletedMeeting = await ctx.db.meeting.delete({
          where: {
            id: input.meetingId,
          },
        });

        if (meeting.meetingUrl) {
          await deleteFile(meeting.meetingUrl).catch((error) => {
            console.error("Error deleting file from Firebase:", error);
          });
        }

        return deletedMeeting;
      } catch (error) {
        console.error("Error in deleteMeeting:", error);
        throw error;
      }
    }),

  getMeetingById: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findUnique({
        where: {
          id: input.meetingId,
        },
        include: {
          issues: true,
        },
      });
    }),

  archiveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.projectId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }),

  inviteUserToProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        access: z.enum(["FULL_ACCESS", "EDIT", "VIEW_ONLY"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToInvite = await ctx.db.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (!userToInvite) {
        throw new Error("User with this email does not exist.");
      }

      const existingInvitation = await ctx.db.userToProject.findFirst({
        where: {
          userId: userToInvite.id,
          projectId: input.projectId,
        },
      });

      if (existingInvitation) {
        throw new Error("User is already a member of this project.");
      }

      // Get project details for notification
      const project = await ctx.db.project.findUnique({
        where: {
          id: input.projectId,
        },
        select: {
          name: true,
        },
      });

      if (!project) {
        throw new Error("Project not found.");
      }

      // Create invitation
      const invitation = await ctx.db.userToProject.create({
        data: {
          userId: userToInvite.id,
          projectId: input.projectId,
          access: input.access,
          status: "PENDING",
          invitedBy: ctx.user.userId,
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send email notification to the invited user
      // This would be implemented with your email service

      return invitation;
    }),

  updateUserAccess: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        access: z.enum(["FULL_ACCESS", "EDIT", "VIEW_ONLY", "OWNER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserAccess = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: input.projectId,
        },
      });

      if (
        currentUserAccess?.access !== "FULL_ACCESS" &&
        currentUserAccess?.access !== "OWNER"
      ) {
        throw new Error(
          "You do not have permission to update members' access.",
        );
      }

      const updateUserAccess = await ctx.db.userToProject.findFirst({
        where: {
          userId: input.userId,
          projectId: input.projectId,
        },
      });

      if (updateUserAccess?.access === "OWNER") {
        throw new Error("You cannot update the owner's access.");
      }

      return await ctx.db.userToProject.updateMany({
        where: {
          userId: input.userId,
          projectId: input.projectId,
        },
        data: {
          access: input.access,
        },
      });
    }),

  removeUserFromProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.userId) {
        throw new Error("You cannot remove yourself from a project.");
      }

      const currentUserAccess = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: input.projectId,
        },
      });

      if (
        currentUserAccess?.access !== "FULL_ACCESS" &&
        currentUserAccess?.access !== "OWNER"
      ) {
        throw new Error("You do not have permission to remove members.");
      }

      const updateUserAccess = await ctx.db.userToProject.findFirst({
        where: {
          userId: input.userId,
          projectId: input.projectId,
        },
      });

      if (updateUserAccess?.access === "OWNER") {
        throw new Error("You cannot remove the owner of a project.");
      }

      return await ctx.db.userToProject.deleteMany({
        where: {
          userId: input.userId,
          projectId: input.projectId,
        },
      });
    }),

  getTeamMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const members = await ctx.db.userToProject.findMany({
          where: {
            projectId: input.projectId,
          },
          include: {
            user: true,
            project: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        // Get inviter details for pending invitations
        const membersWithInviterDetails = await Promise.all(
          members.map(async (member) => {
            if (member.invitedBy) {
              const inviter = await ctx.db.user.findUnique({
                where: { id: member.invitedBy },
                select: { name: true, email: true, image: true },
              });
              return { ...member, inviter };
            }
            return member;
          }),
        );

        return membersWithInviterDetails;
      } catch (error) {
        console.error("Error in getTeamMembers:", error);
        return [];
      }
    }),

  respondToInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        status: z.enum(["ACCEPTED", "DECLINED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find the invitation
      const invitation = await ctx.db.userToProject.findUnique({
        where: {
          id: input.invitationId,
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error("Invitation not found.");
      }

      // Check if the current user is the one being invited
      if (invitation.userId !== ctx.user.userId) {
        throw new Error(
          "You are not authorized to respond to this invitation.",
        );
      }

      // Check if the invitation is still pending
      if (invitation.status !== "PENDING") {
        throw new Error("This invitation has already been responded to.");
      }

      // Update the invitation status
      const updatedInvitation = await ctx.db.userToProject.update({
        where: {
          id: input.invitationId,
        },
        data: {
          status: input.status,
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedInvitation;

      // TODO: Send notification to the project owner/inviter
    }),

  getInvitationById: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const invitation = await ctx.db.userToProject.findUnique({
          where: {
            id: input.invitationId,
            userId: ctx.user.userId!,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                githubUrl: true,
                createdAt: true,
                userToProjects: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        image: true,
                      },
                    },
                    access: true,
                    status: true,
                  },
                  where: {
                    access: "OWNER",
                  },
                  take: 1,
                },
              },
            },
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

        if (!invitation) {
          throw new Error(
            "Invitation not found or you don't have permission to view it.",
          );
        }

        return invitation;
      } catch (error) {
        console.error("Error in getInvitationById:", error);
        throw error;
      }
    }),

  getPendingInvitationCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await ctx.db.userToProject.count({
        where: {
          userId: ctx.user.userId!,
          status: "PENDING",
        },
      });
      return count;
    } catch (error) {
      console.error("Error in getPendingInvitationCount:", error);
      return 0;
    }
  }),

  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.userToProject.findMany({
        where: {
          userId: ctx.user.userId!,
          status: "PENDING",
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              githubUrl: true,
              createdAt: true,
              userToProjects: {
                select: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                  access: true,
                  status: true,
                },
                where: {
                  access: "OWNER",
                },
                take: 1,
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Error in getMyInvitations:", error);
      return [];
    }
  }),

  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.user.userId!,
      },
      select: {
        credits: true,
        id: true,
      },
    });
  }),

  checkGitHubConnection: protectedProcedure.query(async ({ ctx }) => {
    const githubAccount = await ctx.db.account.findFirst({
      where: {
        userId: ctx.user.userId!,
        providerId: "github",
      },
    });

    let hasPrivateRepoAccess = false;
    let isConnected = false;
    let hasValidToken = false;
    let hasValidInstallation = false;

    if (!githubAccount) {
      console.log("No GitHub account found for user");
      return {
        isConnected: false,
        accountDetails: null,
        hasPrivateRepoAccess: false,
        hasValidToken: false,
        hasValidInstallation: false,
      };
    }

    if (githubAccount.gitToken) {
      try {
        const octokit = new Octokit({
          auth: githubAccount.gitToken,
        });

        const { data: userInfo } = await octokit.rest.users.getAuthenticated();
        hasValidToken = !!userInfo.login;

        const { data: repos } =
          await octokit.rest.repos.listForAuthenticatedUser({
            visibility: "private",
            per_page: 1,
            affiliation: "owner,collaborator",
          });
        console.log("🚀 ~ repos:", repos?.length)
        hasPrivateRepoAccess = repos.length > 0;
      } catch (error) {
        console.error("Error checking GitHub token validity:", error);
        hasValidToken = false;
        hasPrivateRepoAccess = false;
      }
    }

    if (githubAccount.installationId) {
      try {
        const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        );
        if (process.env.GITHUB_APP_ID && privateKey) {
          const now = Math.floor(Date.now() / 1000);
          const payload = {
            iat: now - 60,
            exp: now + 10 * 60,
            iss: process.env.GITHUB_APP_ID,
          };

          const appToken = jwt.sign(payload, privateKey, {
            algorithm: "RS256",
          });
          const appOctokit = new Octokit({ auth: appToken });

          const { data: installationInfo } = await appOctokit.request(
            `GET /app/installations/${githubAccount.installationId}`,
            { installation_id: Number(githubAccount.installationId) },
          );

          hasValidInstallation = !!installationInfo.id;
        }
      } catch (error) {
        console.error("Error checking GitHub installation validity:", error);
        hasValidInstallation = false;
        hasValidToken = false;
      }
    }

    isConnected = hasValidToken || hasValidInstallation;
    return {
      isConnected,
      accountDetails: githubAccount,
      hasPrivateRepoAccess,
      hasValidToken,
      hasValidInstallation,
    };
  }),

  getUserRepositories: protectedProcedure.query(async ({ ctx }) => {
    const githubAccount = await ctx.db.account.findFirst({
      where: {
        userId: ctx.user.userId!,
        providerId: "github",
      },
    });

    if (!githubAccount?.gitToken) {
      return { repositories: [] };
    }

    try {
      if (githubAccount?.installationId) {

        console.log(
          `Fetching repositories for installation ID: ${githubAccount.installationId}`,
        );

        const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        );
        if (!process.env.GITHUB_APP_ID || !privateKey) {
          throw new Error("GitHub App credentials are not configured in .env");
        }

        const now = Math.floor(Date.now() / 1000);
        const payload = {
          iat: now - 60,
          exp: now + 10 * 60,
          iss: process.env.GITHUB_APP_ID,
        };

        const appToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });

        const appOctokit = new Octokit({ auth: appToken });

        const { data: installationToken } = await appOctokit.request(
          `POST /app/installations/${githubAccount.installationId}/access_tokens`,
          {
            installation_id: Number(githubAccount.installationId),
          },
        );

        const installationOctokit = new Octokit({
          auth: installationToken.token,
        });

        const { data: installationRepos } = await installationOctokit.request(
          "GET /installation/repositories",
        );

        console.log(
          `Found ${installationRepos.repositories.length} repositories for installation ${githubAccount.installationId}`,
        );

        return {
          repositories: installationRepos.repositories.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            isPrivate: repo.private,
          })),
        };
      } else {




        console.log(
          "No installation_id found, fetching all user's accessible repositories",
        );




        const userOctokit = new Octokit({
          auth: githubAccount.gitToken,
        });



        const { data: userRepos } =
          await userOctokit.rest.repos.listForAuthenticatedUser({
            visibility: "all",
            sort: "updated",
            per_page: 100,
            affiliation: "owner,collaborator",
          });

        const accessibleRepos = userRepos.filter((repo) => {
          return repo.permissions?.admin || repo.permissions?.push;




        });

        return {
          repositories: accessibleRepos.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            isPrivate: repo.private,
          })),
        };
      }



    } catch (error) {
      console.error("Error fetching accessible repositories:", error);
      return { repositories: [] };
    }
  }),

  hasProjectAccess: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.user.userId!,
          status: "ACCEPTED",
        },
      });

      return {
        hasAccess: !!userProject,
      };
    }),

  checkCredits: protectedProcedure
    .input(
      z.object({ githubUrl: z.string(), githubToken: z.string().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const githubAccount = await ctx.db.account.findFirst({
        where: {
          userId: ctx.user.userId!,
          providerId: "github",
        },
      });

      // if (!githubAccount) {
      //     return { fileCount: 0, userCredits: 0, allBranch: [], githubAccount: null };
      // }
      let fileCount: number;
      if (!githubAccount) {
        fileCount = await checkCredits(
          input.githubUrl,
          process.env.GITHUB_TOKEN,
        );
      } else {
        fileCount = await checkCredits(
          input.githubUrl,
          githubAccount.gitToken ||
          input.githubToken ||
          process.env.GITHUB_TOKEN,
        );
      }

      //   const fileCount = await checkCredits(
      //     input.githubUrl,
      //     githubAccount.accessToken ||
      //       input.githubToken ||
      //       process.env.GITHUB_TOKEN,
      //   );
      const userCredits = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.userId!,
        },
        select: {
          credits: true,
        },
      });

      const userId = ctx.user.userId!;
      const allBranch = await getAllBranches(input.githubUrl, userId);
      return {
        fileCount,
        userCredits: userCredits?.credits || 0,
        allBranch,
        githubAccount,
      };
    }),
});
