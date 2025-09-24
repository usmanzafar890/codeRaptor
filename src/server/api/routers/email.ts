import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { 
  sendEmail, 
  createWelcomeEmail, 
  createPasswordResetEmail,
  createNotificationEmail,
  createCustomEmail,
  createLoginNotificationEmail
} from "@/lib/mail";

export const emailRouter = createTRPCRouter({
  sendLoginNotification: publicProcedure
    .input(z.object({ 
      email: z.string().email(),
      deviceInfo: z.string().optional(),
      location: z.string().optional(),
      time: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const template = createLoginNotificationEmail(
          input.email,
          input.deviceInfo,
          input.location,
          input.time
        );
        const info = await sendEmail(input.email, template);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error("Failed to send login notification email:", error);
        throw new Error("Failed to send login notification email");
      }
    }),
  sendWelcome: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      name: z.string().min(1) 
    }))
    .mutation(async ({ input }) => {
      try {
        const template = createWelcomeEmail(input.name);
        const info = await sendEmail(input.email, template);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        throw new Error("Failed to send welcome email");
      }
    }),

  sendPasswordReset: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      name: z.string().min(1),
      resetToken: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      try {
        // In a real application, you would generate a secure URL with the token
        const resetLink = `${process.env.BETTER_AUTH_URL}/reset-password?token=${input.resetToken}`;
        const template = createPasswordResetEmail(input.name, resetLink);
        const info = await sendEmail(input.email, template);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw new Error("Failed to send password reset email");
      }
    }),

  sendNotification: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      name: z.string().min(1),
      message: z.string().min(1),
      actionLink: z.string().url().optional(),
      actionText: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const template = createNotificationEmail(
          input.name, 
          input.message, 
          input.actionLink, 
          input.actionText
        );
        const info = await sendEmail(input.email, template);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error("Failed to send notification email:", error);
        throw new Error("Failed to send notification email");
      }
    }),

  sendCustom: publicProcedure
    .input(z.object({ 
      email: z.string().email(),
      subject: z.string().min(1),
      text: z.string().min(1),
      html: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      try {
        const template = createCustomEmail(
          input.subject,
          input.text,
          input.html
        );
        const info = await sendEmail(input.email, template);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error("Failed to send custom email:", error);
        throw new Error("Failed to send custom email");
      }
    }),
});
