import React from "react";
import InvitationsView from "@/components/project-invitation/project-invite";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function InvitationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }
  return <InvitationsView />;
}
