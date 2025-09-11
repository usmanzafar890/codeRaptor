'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCommit, ExternalLink, Search, Calendar, Code, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface CommitsTabProps {
  projectId: string;
}

export function CommitsTab({ projectId }: CommitsTabProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [authorFilter, setAuthorFilter] = useState<string | undefined>(undefined);
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
  
  // Fetch commits
  const { data, isLoading, error } = api.project.getCommits.useQuery(
    { 
      projectId,
      commitAuthorName: authorFilter && authorFilter !== 'all_authors' ? authorFilter : undefined,
      branchName: branchFilter && branchFilter !== 'all_branches' ? branchFilter : undefined,
      page,
      limit
    },
    { 
      staleTime: 60000, // 1 minute
    }
  );
  
  // Fetch project branches for filter
  const { data: branchesData } = api.project.getProjectBranches.useQuery(
    { projectId },
    { staleTime: 60000 }
  );

  // Extract unique authors from commits
  const authors = data?.commits ? [...new Set(data.commits.map(commit => commit.commitAuthorName).filter(Boolean))] : [];

  // Handle loading state
  if (isLoading) {
    return <CommitsLoadingSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commits</CardTitle>
          <CardDescription>Repository commit history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading commits</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commits</CardTitle>
        <CardDescription>Repository commit history</CardDescription>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <div className="flex-1">
            <Select value={branchFilter || 'all_branches'} onValueChange={(value) => setBranchFilter(value === 'all_branches' ? undefined : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_branches">All branches</SelectItem>
                {branchesData?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.name || `branch_${branch.id}`}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={authorFilter || 'all_authors'} onValueChange={(value) => setAuthorFilter(value === 'all_authors' ? undefined : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_authors">All authors</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author} value={author || `author_${author.substring(0, 3)}_${Math.random().toString(36).substring(2, 7)}`}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Commits List */}
        {data?.commits && data.commits.length > 0 ? (
          <div className="space-y-4">
            {data.commits.map((commit) => (
              <div key={commit.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                <div className="bg-blue-100 p-2 rounded-full">
                  <GitCommit className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{commit.commitMessage?.split('\n')[0]}</h3>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{commit.commitAuthorName || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <GitCommit className="h-3 w-3" />
                      <span className="font-mono">{commit.commitHash?.substring(0, 7)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {commit.commitDate 
                          ? formatDistanceToNow(new Date(commit.commitDate), { addSuffix: true })
                          : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                  
                  {commit.branchName && (
                    <Badge variant="outline" className="mt-2">
                      {commit.branchName}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <GitCommit className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No commits found</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
              {branchFilter || authorFilter 
                ? 'Try changing your filters to see more results'
                : 'No commits have been recorded for this project yet'}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Page {page} of {data.pagination.totalPages}
          </div>
          
          <Button 
            variant="outline" 
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(prev => prev + 1)}
          >
            Next
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Loading skeleton for commits
function CommitsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commits</CardTitle>
        <CardDescription>Loading commits...</CardDescription>
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
