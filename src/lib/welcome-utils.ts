import { prisma } from "@/lib/prisma"


export async function shouldShowWelcome(userId: string): Promise<boolean> {
  try {

    const result = await prisma.$queryRaw<{welcomeCompleted: boolean}[]>`
      SELECT "welcomeCompleted" FROM "user" WHERE id = ${userId} LIMIT 1
    `;
    
    if (result && result.length > 0 && result[0].welcomeCompleted === true) {
      return false;
    }
    if (result && result.length > 0 && result[0].welcomeCompleted === true) {
      return false;
    }
    

    const userOrganizations = await prisma.organizationMember.findFirst({
      where: { userId }
    });

    // Check if user has GitHub connected
    const userGithubConnection = await prisma.account.findFirst({
      where: { 
        userId,
        providerId: "github" 
      }
    });

    // Show welcome screen if user doesn't have organizations or GitHub connected
    return !userOrganizations || !userGithubConnection;
  } catch (error) {
    console.error(`Error checking welcome status for user ${userId}:`, error);
    
    // In case of error, fall back to checking organization and GitHub
    const userOrganizations = await prisma.organizationMember.findFirst({
      where: { userId }
    });

    const userGithubConnection = await prisma.account.findFirst({
      where: { 
        userId,
        providerId: "github" 
      }
    });

    return !userOrganizations || !userGithubConnection;
  }
}

export async function markWelcomeComplete(userId: string): Promise<void> {
  try {

    await prisma.$executeRaw`UPDATE "user" SET "welcomeCompleted" = true WHERE id = ${userId}`;
    
    console.log(`Successfully marked welcome as complete for user ${userId}`);
  } catch (error) {
    console.error(`Failed to mark welcome as complete for user ${userId}:`, error);
    throw error;
  }
}
