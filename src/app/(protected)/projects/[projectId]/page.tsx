'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ExternalLink
} from 'lucide-react';
import useProject from '@/hooks/use-project';
import { formatDistanceToNow } from 'date-fns';
import { PullRequestsTab } from '@/components/project/pull-requests-tab';
import { CommitsTab } from '@/components/project/commits-tab';
import { TeamTab } from '@/components/project/team-tab';
import { ProjectStatistics } from '@/components/project/project-statistics';

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
  const { data: project, isLoading, error } = api.project.getProject.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  // Handle loading state
  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }
  
  // Handle error state
  if (error || !project) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p className="font-medium">Error loading project</p>
          <p className="text-sm">{error?.message || "Project not found"}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => router.push('/dashboard')}
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
    : 'Unknown';
  
  const updatedAtFormatted = project.updatedAt 
    ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
    : 'Unknown';

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <Github className="h-4 w-4" />
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm hover:underline flex items-center gap-1"
            >
              {project.githubUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/settings`)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Code className="h-4 w-4 mr-2" />
            Open in IDE
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Repository</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">{project.name}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Created {createdAtFormatted}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">{project.branches?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Active branches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <span className="text-xl font-semibold">{updatedAtFormatted}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Last activity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest commits and pull requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.commits && project.commits.length > 0 ? (
                  project.commits.map((commit, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <GitCommit className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{commit.commitMessage?.split('\n')[0] || 'Commit'}</p>
                        <p className="text-sm text-gray-500">
                          by {commit.commitAuthorName || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{commit.branchName || 'main'}</Badge>
                          <span className="text-xs text-gray-500">
                            {commit.commitDate ? formatDistanceToNow(new Date(commit.commitDate), { addSuffix: true }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Statistics */}
          <ProjectStatistics projectId={projectId} />
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Project Branches</CardTitle>
              <CardDescription>All branches for this repository</CardDescription>
            </CardHeader>
            <CardContent>
              {project.branches && project.branches.length > 0 ? (
                <div className="space-y-3">
                  {project.branches.map((branch, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{branch.name}</span>
                        {branch.isActive && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        View Commits
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No branches found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits">
          <CommitsTab projectId={projectId} />
        </TabsContent>

        {/* Pull Requests Tab */}
        <TabsContent value="pull-requests">
          <PullRequestsTab projectId={projectId} githubUrl={project.githubUrl || ''} />
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
    <div className="container py-8 max-w-6xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-full mb-6" />

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
