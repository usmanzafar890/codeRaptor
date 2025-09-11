'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, GitCommit, User } from 'lucide-react';

interface TeamTabProps {
  projectId: string;
}

interface CommitAuthor {
  name: string;
  email?: string;
  commitCount: number;
  lastCommitDate?: string;
}

export function TeamTab({ projectId }: TeamTabProps) {
  const [authors, setAuthors] = useState<CommitAuthor[]>([]);
  
  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeam } = api.project.getTeamMembers.useQuery(
    { projectId },
    { staleTime: 60000 }
  );
  
  // Fetch all commits to extract authors
  const { data: commitsData, isLoading: isLoadingCommits } = api.project.getCommitsSingle.useQuery(
    { projectId },
    { staleTime: 60000 }
  );
  
  // Process commits to extract unique authors and their stats
  useEffect(() => {
    if (commitsData?.commits) {
      const authorMap = new Map<string, CommitAuthor>();
      
      commitsData.commits.forEach(commit => {
        if (!commit.commitAuthorName) return;
        
        const name = commit.commitAuthorName;
        
        if (authorMap.has(name)) {
          const author = authorMap.get(name)!;
          author.commitCount++;
          
          // Update last commit date if this commit is newer
          if (commit.commitDate && (!author.lastCommitDate || new Date(commit.commitDate) > new Date(author.lastCommitDate))) {
            author.lastCommitDate = commit.commitDate;
          }
        } else {
          authorMap.set(name, {
            name,
            commitCount: 1,
            lastCommitDate: commit.commitDate
          });
        }
      });
      
      // Convert map to array and sort by commit count (descending)
      const authorArray = Array.from(authorMap.values()).sort((a, b) => b.commitCount - a.commitCount);
      setAuthors(authorArray);
    }
  }, [commitsData]);

  // Handle loading state
  if (isLoadingTeam || isLoadingCommits) {
    return <TeamLoadingSkeleton />;
  }

  // If no authors found
  if (authors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Team</CardTitle>
          <CardDescription>Contributors and team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No team members found</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
              No commits have been recorded for this project yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
        <CardDescription>Contributors based on commit history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {authors.map((author, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{author.name}</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600">
                    {author.commitCount} {author.commitCount === 1 ? 'commit' : 'commits'}
                  </Badge>
                </div>
                
                {author.email && (
                  <p className="text-sm text-gray-500">{author.email}</p>
                )}
                
                {author.lastCommitDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last commit: {new Date(author.lastCommitDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Team Members Section (if available) */}
        {teamMembers && teamMembers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Project Access</h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {member.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{member.user.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        Member
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for team
function TeamLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
        <CardDescription>Loading team information...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
