import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markWelcomeComplete } from "@/lib/welcome-utils"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await markWelcomeComplete(session.user.id)
    
    const response = NextResponse.json({ success: true })
    
    response.cookies.set({
      name: "welcome_completed",
      value: "true",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })

    // Clear the temporary "welcome_required" cookie if present
    response.cookies.set({
      name: "welcome_required",
      value: "",
      path: "/",
      maxAge: 0
    })
    
    return response
  } catch (error) {
    console.error("Error marking welcome as complete:", error)
    return NextResponse.json({ error: "Failed to mark welcome as complete" }, { status: 500 })
  }
}
