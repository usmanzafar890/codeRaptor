import CommitDetailClient from "@/components/project-details/project-detail-view";

interface CommitDetailPageProps {
  params: {
    projectId: string;
    commitHash: string;
  };
}

// FIX: Add the 'async' keyword to the function signature.
export default async function CommitDetailPage({ params }: CommitDetailPageProps) {
  const { projectId, commitHash } = await params;

  return <CommitDetailClient projectId={projectId} commitHash={commitHash} />;
}