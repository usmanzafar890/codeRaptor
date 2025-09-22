import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";
import { shouldShowWelcome } from "@/lib/welcome-utils";

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user is already accessing the welcome page
  if (request.nextUrl.pathname === "/welcome") {
    return NextResponse.next();
  }

  // Check if user is accessing an API route - always allow these
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  // Check cookie first as a quick way to bypass the database check
  const welcomeCookieCompleted = request.cookies.get("welcome_completed")?.value === "true";
  
  // If cookie indicates welcome is completed, allow access
  if (welcomeCookieCompleted) {
    return NextResponse.next();
  }
  
  try {
    // Check if user needs to be redirected to welcome page based on database check
    const showWelcome = await shouldShowWelcome(session.user.id);
    
    // If the user hasn't completed the welcome flow, redirect them to the welcome page
    if (showWelcome) {
      return NextResponse.redirect(new URL("/welcome", request.url));
    }
  } catch (error) {
    console.error("Error checking welcome status:", error);
    // In case of error, continue to the requested page
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/qa",
    "/meetings",
    "/billing",
    "/join/:projectId",
    "/setup",
    "/welcome"
  ],
};