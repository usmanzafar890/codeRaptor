import { prisma } from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    nextCookies(),
    organization({
      organizationModel: "Organization",
      membershipModel: "OrganizationMember",
      roleEnumType: "OrgRole",
      // Type assertion to fix TypeScript errors
      roles: {
        owner: { id: "OWNER", name: "Owner" } as any,
        admin: { id: "ADMIN", name: "Admin" } as any,
        member: { id: "MEMBER", name: "Member" } as any,
      },
      enableInvitations: true,
    }),
  ],
});
