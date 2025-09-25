import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProjectCreateView from "@/components/organization/add-project-organization";
import { Suspense } from "react";

export default async function ProjectCreatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">Loading...</div>}>
      <ProjectCreateView />
    </Suspense>
  );
}
