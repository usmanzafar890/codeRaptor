import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Use type assertion to access models with proper casing
type PrismaClientWithModels = typeof import("@prisma/client").PrismaClient;

export const organizationRouter = createTRPCRouter({
  getUserRole: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await (ctx.db as any).organizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.organizationId,
        },
      });

      if (!membership) {
        return { role: null };
      }

      return { role: membership.role };
    }),
  getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    // Use type assertion to access the model
    return await ((ctx.db as any) as any).organizationMember.findMany({
      where: {
        userId: ctx.user.userId!,
      },
      include: {
        organization: true,
      },
    });
  }),

  getOrganization: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // First check if the user is a member of this organization
      const membership = await (ctx.db as any).OrganizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.id,
        },
      });

      if (!membership) {
        throw new Error("You don't have access to this organization");
      }

      return await ((ctx.db as any) as any).organization.findUnique({
        where: {
          id: input.id,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          projects: true,
        },
      });
    }),

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the organization
      const organization = await ((ctx.db as any) as any).organization.create({
        data: {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl,
          ownerId: ctx.user.userId!,
          members: {
            create: {
              userId: ctx.user.userId!,
              role: "OWNER",
            },
          },
        },
      });

      return organization;
    }),

  updateOrganization: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user is an owner or admin
      const membership = await (ctx.db as any).OrganizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.id,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new Error("You don't have permission to update this organization");
      }

      // Update the organization
      return await ((ctx.db as any) as any).organization.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl,
        },
      });
    }),

  deleteOrganization: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the user is the owner
      const organization = await (ctx.db as any).Organization.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      if (organization.ownerId !== ctx.user.userId) {
        throw new Error("Only the owner can delete an organization");
      }

      // First, delete all organization members
      await ((ctx.db as any) as any).organizationMember.deleteMany({
        where: {
          organizationId: input.id,
        },
      });

      // Then, delete all projects associated with the organization
      await ((ctx.db as any) as any).project.updateMany({
        where: {
          organizationId: input.id,
        },
        data: {
          organizationId: null,
        },
      });

      // Finally, delete the organization
      return await ((ctx.db as any) as any).organization.delete({
        where: {
          id: input.id,
        },
      });
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userEmail: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user is an owner or admin
      const membership = await (ctx.db as any).OrganizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.organizationId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new Error("You don't have permission to add members to this organization");
      }

      // Find the user by email
      const user = await (ctx.db as any).user.findUnique({
        where: {
          email: input.userEmail,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if the user is already a member
      const existingMembership = await ((ctx.db as any) as any).organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId: input.organizationId,
        },
      });

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }

      // Add the user to the organization
      return await ((ctx.db as any) as any).organizationMember.create({
        data: {
          userId: user.id,
          organizationId: input.organizationId,
          role: input.role,
        },
      });
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user is an owner or admin
      const membership = await (ctx.db as any).OrganizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.organizationId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new Error("You don't have permission to update member roles in this organization");
      }

      // Check if the target user is the owner (cannot change owner's role)
      const organization = await (ctx.db as any).Organization.findUnique({
        where: {
          id: input.organizationId,
        },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      if (organization.ownerId === input.userId) {
        throw new Error("Cannot change the owner's role");
      }

      // Update the member's role
      return await ((ctx.db as any) as any).organizationMember.update({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
        data: {
          role: input.role,
        },
      });
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the user is an owner or admin
      const membership = await (ctx.db as any).OrganizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.organizationId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new Error("You don't have permission to remove members from this organization");
      }

      // Check if the target user is the owner (cannot remove owner)
      const organization = await ((ctx.db as any) as any).organization.findUnique({
        where: {
          id: input.organizationId,
        },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      if (organization.ownerId === input.userId) {
        throw new Error("Cannot remove the owner from the organization");
      }

      // Remove the member
      return await ((ctx.db as any) as any).organizationMember.delete({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
      });
    }),

  getOrganizationProjects: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if the user is a member of this organization
      const membership = await (ctx.db as any).organizationMember.findFirst({
        where: {
          userId: ctx.user.userId!,
          organizationId: input.organizationId,
        },
      });

      if (!membership) {
        throw new Error("You don't have access to this organization");
      }

      // Get all projects for this organization
      return await (ctx.db as any).project.findMany({
        where: {
          organizationId: input.organizationId,
        } as any, // Type assertion to fix TypeScript error
      });
    }),
});
