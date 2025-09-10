// src/app/projects/[projectId]/commits/[commitHash]/commit-detail-client.tsx
"use client";

import { api } from "@/trpc/react";
import { Loader2, ExternalLink, GitBranch, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import the new DiffViewer component and the parser
import { DiffViewer } from "@/components/project-details/diff-viewer";
import { parseGitDiff } from "@/lib/diff-parser";
import { useMemo } from "react";

interface CommitDetailClientProps {
  projectId: string;
  commitHash: string;
}

export default function CommitDetailClient({ projectId, commitHash }: CommitDetailClientProps) {
  // Fetch the commit diff
  const { data: rawDiff, isLoading: isLoadingDiff, isError: isErrorDiff } = api.project.getCommitDiff.useQuery({
    projectId,
    commitHash,
  });

  const { data: commits } = api.project.getCommitsSingle.useQuery({ projectId });
  const commit = commits?.commits.find(c => c.commitHash === commitHash);
  console.log("🚀 ~ CommitDetailClient ~ commit:", commit)

  const isLoading = isLoadingDiff || !commit;
  const isError = isErrorDiff || !commit;
  
  // Use a memoized value for the parsed diff to avoid re-parsing on every render
  const parsedDiff = useMemo(() => {
    if (rawDiff) {
        return parseGitDiff(rawDiff);
    }
    return null;
  }, [rawDiff]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin mr-2" />
        <p className="text-lg">Loading commit diff...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-red-500 text-center">
        <p className="text-xl font-semibold mb-2">Failed to load commit details</p>
        <p className="text-lg">Could not retrieve the diff for commit `**{commitHash}**`.</p>
        <Link href={`/dashboard`} passHref>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Project
          </Button>
        </Link>
      </div>
    );
  }

  // Fallback if no commit details are found, but diff is available
  const commitMessage = commit?.commitMessage.split('\n')[0] || "Commit Details";

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <Link href={`/dashboard`} passHref>
          <Button variant="outline" className="text-gray-700">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
          </Button>
        </Link>
        <Link href={''} target="_blank" rel="noopener noreferrer" passHref>
          <Button variant="outline" className="text-gray-700">
            View on GitHub <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span className="truncate max-w-[80%]">{commitMessage}</span>
            <Badge variant="secondary" className="font-mono text-gray-700">{commitHash.substring(0, 7)}</Badge>
          </CardTitle>
          <div className="text-sm text-gray-500 mt-2">
            Committed by <span className="font-semibold text-gray-800">{commit?.commitAuthorName}</span> on{" "}
            <time dateTime={new Date(commit?.commitDate).toISOString()}>
              {new Date(commit?.commitDate).toLocaleString()}
            </time>
            {commit?.branchName && (
                <div className="flex items-center mt-1">
                    <GitBranch className="h-4 w-4 mr-1 text-gray-500" />
                    <Badge variant="secondary">{commit.branchName}</Badge>
                </div>
            )}
          </div>
        </CardHeader>
                {/* New section for the commit summary */}
        {commit?.summary && (
          <CardContent className="p-4 sm:p-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Summary</h4>
            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm leading-relaxed text-gray-700 overflow-x-auto whitespace-pre-wrap font-sans">
              {commit.summary}
            </pre>
          </CardContent>
        )}
        <CardContent className="p-0">
          {/* RENDER THE PARSED DIFF HERE */}
          {parsedDiff && parsedDiff.length > 0 ? (
            <DiffViewer files={parsedDiff} />
          ) : (
            <div className="p-4 text-center text-gray-500">
                No diff content available for this commit.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}