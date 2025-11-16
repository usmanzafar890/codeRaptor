import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { shouldShowWelcome } from "@/lib/welcome-utils"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const showWelcome = await shouldShowWelcome(session.user.id)
    return NextResponse.json({ 
      welcomeCompleted: !showWelcome,
      userId: session.user.id
    })
  } catch (error) {
    console.error("Error checking welcome status:", error)
    return NextResponse.json({ error: "Failed to check welcome status" }, { status: 500 })
  }
}
