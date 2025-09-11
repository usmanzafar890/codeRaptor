'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitPullRequest, Activity, ExternalLink, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { type PullRequestItem } from '@/lib/github-pr';

interface PullRequestsTabProps {
  projectId: string;
  githubUrl: string;
}

export function PullRequestsTab({ projectId, githubUrl }: PullRequestsTabProps) {
  const [prState, setPrState] = useState<'open' | 'closed' | 'all'>('open');
  
  // Extract owner and repo from GitHub URL
  const urlParts = githubUrl.split('/');
  const owner = urlParts[urlParts.length - 2] || '';
  const repo = urlParts[urlParts.length - 1] || '';
  
  // Fetch pull requests based on state
  const { data, isLoading, error } = api.pullrequest.getAllPullRequests.useQuery(
    { 
      owner, 
      repo,
      state: prState 
    },
    { 
      enabled: !!owner && !!repo,
      staleTime: 60000, // 1 minute
    }
  );

  // Handle loading state
  if (isLoading) {
    return <PullRequestsLoadingSkeleton />;
  }

  // Handle error state
  if (error || !owner || !repo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pull Requests</CardTitle>
          <CardDescription>Open and closed pull requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading pull requests</p>
            <p className="text-sm">{error?.message || "Invalid GitHub repository URL"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (!data?.pullRequests || data.pullRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pull Requests</CardTitle>
          <CardDescription>No {prState} pull requests found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No {prState} pull requests found</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
              {prState === 'open' 
                ? 'There are no open pull requests for this repository' 
                : prState === 'closed' 
                  ? 'There are no closed pull requests for this repository'
                  : 'There are no pull requests for this repository'}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Tabs defaultValue={prState} className="w-full" onValueChange={(value) => setPrState(value as 'open' | 'closed' | 'all')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pull Requests</CardTitle>
        <CardDescription>
          {prState === 'open' 
            ? 'Open pull requests' 
            : prState === 'closed' 
              ? 'Closed pull requests' 
              : 'All pull requests'}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Tabs defaultValue={prState} className="w-full" onValueChange={(value) => setPrState(value as 'open' | 'closed' | 'all')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardFooter>
      <CardContent>
        <div className="space-y-4">
          {data.pullRequests.map((pr, index) => (
            <div key={pr.number || index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className={`p-2 rounded-full ${pr.state === 'open' ? 'bg-green-100' : 'bg-red-100'}`}>
                {pr.state === 'open' ? (
                  <GitPullRequest className="h-5 w-5 text-green-600" />
                ) : (
                  <Check className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">{pr.title}</h3>
                  <Badge variant={pr.state === 'open' ? 'outline' : 'secondary'}>
                    {pr.state}
                  </Badge>
                </div>
                {/* Pull requests from GitHub API don't have body in our type */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    #{pr.number} opened {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })} by {pr.user?.login || 'Unknown'}
                  </span>
                  <a 
                    href={pr.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

    </Card>
  );
}

// Loading skeleton for pull requests
function PullRequestsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pull Requests</CardTitle>
        <CardDescription>Loading pull requests...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
