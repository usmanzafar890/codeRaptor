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
    sendResetPassword: async ({ user, url, token }) => {
      // Import the email service
      const { sendEmail } = await import('./mail');
      const { createPasswordResetEmail } = await import('./mail');
      
      try {
        // Create the email template
        const template = createPasswordResetEmail(user.name || user.email, url);
        
        // Send the email
        await sendEmail(user.email, template);
        console.log(`Password reset email sent to ${user.email}`);
        console.log(`Reset URL: ${url}`);
      } catch (error) {
        console.error('Failed to send password reset email:', error);
      }
    },
    onPasswordReset: async ({ user }) => {
      console.log(`Password reset successful for user: ${user.email}`);
    },
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
