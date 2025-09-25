import CommitDetailClient from "@/components/project-details/project-detail-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface CommitDetailPageProps {
  params: {
    projectId: string;
    commitHash: string;
  };
}

// FIX: Add the 'async' keyword to the function signature.
export default async function CommitDetailPage({
  params,
}: CommitDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  const { projectId, commitHash } = await params;

  return <CommitDetailClient projectId={projectId} commitHash={commitHash} />;
}
