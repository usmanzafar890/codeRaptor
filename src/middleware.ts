import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  // Allow API routes to pass through without checks
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow the welcome page itself to render without checks
  if (request.nextUrl.pathname === "/welcome") {
    return NextResponse.next();
  }

  // Check cookies first to avoid unnecessary network calls
  const welcomeCookieCompleted = request.cookies.get("welcome_completed")?.value === "true";
  const welcomeCookieRequired = request.cookies.get("welcome_required")?.value === "true";

  if (welcomeCookieCompleted) {
    return NextResponse.next();
  }

  if (welcomeCookieRequired) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  // Fetch session only if needed for protected routes
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
  
  try {
    // Ask the server API (Node runtime) for welcome completion status
    const { data: status } = await betterFetch<{ welcomeCompleted: boolean }>(
      "/api/user/welcome-status",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!status?.welcomeCompleted) {
      const response = NextResponse.redirect(new URL("/welcome", request.url));
      response.cookies.set({
        name: "welcome_required",
        value: "false",
      });
      return response;
    }else{
      return NextResponse.next();
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