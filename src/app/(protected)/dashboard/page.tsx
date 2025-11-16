import React from "react";
import DashboardView from "@/components/dashboard/dashboard-view";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Guard: ensure welcome flow is completed before showing dashboard
  const cookieStore = await cookies();
  const completed = cookieStore.get("welcome_completed")?.value === "true";
  if (!completed) {
    // As a fallback, ask the server API for current status
    const hdrs = await headers();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const res = await fetch(`${baseUrl}/api/user/welcome-status`, {
        headers: hdrs,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.welcomeCompleted) {
          redirect("/welcome");
        }
      } else {
        redirect("/welcome");
      }
    } catch {
      redirect("/welcome");
    }
  }
  const projects = await api.project.getProjects();

  return <DashboardView user={session.user} projects={projects} />;
};

export default DashboardPage;
