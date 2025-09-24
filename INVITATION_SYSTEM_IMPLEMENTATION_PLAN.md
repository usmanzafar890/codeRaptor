# Team Member Invitation System Implementation Plan

This document outlines the steps needed to properly implement the team member invitation system in CodeRaptor.

## Database Changes

1. Create a migration to add the following fields to the `userToProject` model:
   ```prisma
   model userToProject {
     // existing fields...
     status    InvitationStatus @default(PENDING)
     invitedAt DateTime @default(now())
     invitedBy String?
   }
   
   enum InvitationStatus {
     PENDING
     ACCEPTED
     DECLINED
   }
   ```

2. Run the migration:
   ```bash
   npx prisma migrate dev --name add_invitation_status_fields
   ```

3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

## API Endpoints

1. Update the `getTeamMembers` endpoint to include invitation status and details:
   ```typescript
   getTeamMembers: protectedProcedure
     .input(z.object({ projectId: z.string() }))
     .query(async ({ ctx, input }) => {
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
         orderBy: [
           { status: 'asc' },
           { createdAt: 'desc' },
         ],
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
         })
       );
       
       return membersWithInviterDetails;
     }),
   ```

2. Update the `inviteUserToProject` endpoint to include inviter's information:
   ```typescript
   inviteUserToProject: protectedProcedure
     // ...existing code...
     .mutation(async ({ ctx, input }) => {
       // ...existing code...
       
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

       // Send email notification to the invited user
       // ...

       return invitation;
     }),
   ```

3. Implement the `respondToInvitation` endpoint:
   ```typescript
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
         throw new Error("You are not authorized to respond to this invitation.");
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

       // Send notification to the project owner/inviter
       // ...

       return updatedInvitation;
     }),
   ```

4. Implement the `getMyInvitations` endpoint:
   ```typescript
   getMyInvitations: protectedProcedure
     .query(async ({ ctx }) => {
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
             },
           },
         },
         orderBy: {
           createdAt: "desc",
         },
       });
     }),
   ```

## Frontend Components

1. Update the `MemberList` component to display pending and declined invitations
2. Add the `PendingInvitations` component to the dashboard
3. Create an `InvitationNotifications` component for the header

## Email Notifications

1. Create email templates for invitations
2. Implement email sending for invitation events:
   - When a user is invited to a project
   - When an invitation is accepted or declined

## Testing

1. Test the invitation flow:
   - Inviting a user
   - Accepting an invitation
   - Declining an invitation
   - Resending an invitation
   - Canceling an invitation

2. Test the notifications:
   - Email notifications
   - UI notifications

## Deployment

1. Run database migrations on production
2. Deploy the updated code

## Future Enhancements

1. Add real-time notifications using WebSockets
2. Implement invitation expiration
3. Add invitation permissions (who can invite users)
4. Add invitation quotas (limit the number of pending invitations)
