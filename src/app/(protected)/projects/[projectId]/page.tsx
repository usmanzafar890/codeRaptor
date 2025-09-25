import ProjectDetailView from "@/components/project/project-id-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProjectDetailPage() {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/login");
    }
  return <ProjectDetailView />;
}
