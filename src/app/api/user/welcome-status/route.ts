import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { shouldShowWelcome } from "@/lib/welcome-utils"

export async function GET(request: NextRequest) {
  // Get the session using the auth API
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user needs to be shown the welcome screen
    const showWelcome = await shouldShowWelcome(session.user.id)

    // Return the opposite of showWelcome (if showWelcome is true, welcomeCompleted is false)
    return NextResponse.json({ 
      welcomeCompleted: !showWelcome,
      userId: session.user.id
    })
  } catch (error) {
    console.error("Error checking welcome status:", error)
    return NextResponse.json({ error: "Failed to check welcome status" }, { status: 500 })
  }
}
