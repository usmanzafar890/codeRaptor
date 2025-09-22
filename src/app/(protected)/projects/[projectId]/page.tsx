"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Code,
  GitBranch,
  Github,
  GitCommit,
  GitPullRequest,
  Settings,
  Users,
  Activity,
  BarChart3,
  Calendar,
  ExternalLink,
} from "lucide-react";
import useProject from "@/hooks/use-project";
import { formatDistanceToNow } from "date-fns";
import { TeamTab } from "@/components/project/team-tab";
import { ProjectStatistics } from "@/components/project/project-statistics";
import CommitLog from "@/components/dashboard/commit-log";
import PullRequestList from "@/components/dashboard/pull-request-list";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { setProjectId } = useProject();

  // Set the current project in the global state
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  // Fetch project details
  const {
    data: project,
    isLoading,
    error,
  } = api.project.getProject.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  // Handle loading state
  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  // Handle error state
  if (error || !project) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p className="font-medium">Error loading project</p>
          <p className="text-sm">{error?.message || "Project not found"}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Format dates for display
  const createdAtFormatted = project.createdAt
    ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })
    : "Unknown";

  const updatedAtFormatted = project.updatedAt
    ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
    : "Unknown";

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Project Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-gray-500">
            <Github className="h-4 w-4" />
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm hover:underline"
            >
              {project.githubUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Project Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">{project.name}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Created {createdAtFormatted}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Branches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">
                    {project.branches?.length || 0}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Active branches</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">
                    {updatedAtFormatted}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Last activity</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest commits and pull requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.commits && project.commits.length > 0 ? (
                    project.commits.map((commit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 border-b pb-3 last:border-0"
                      >
                        <div className="rounded-full bg-blue-100 p-2">
                          <GitCommit className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {commit.commitMessage?.split("\n")[0] || "Commit"}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {commit.commitAuthorName || "Unknown"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline">
                              {commit.branchName || "main"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {commit.commitDate
                                ? formatDistanceToNow(
                                    new Date(commit.commitDate),
                                    { addSuffix: true },
                                  )
                                : "Recently"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No recent activity found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Statistics */}
            <ProjectStatistics projectId={projectId} />
          </div>
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits">
          <CommitLog />
        </TabsContent>

        {/* Pull Requests Tab */}
        <TabsContent value="pull-requests">
          <PullRequestList />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <TeamTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading skeleton for the project detail page
function ProjectDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="mb-6 h-10 w-full" />

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
