'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeam } = api.project.getTeamMembers.useQuery(
    { projectId },
    { staleTime: 60000 }
  );

  // Handle loading state
  if (isLoadingTeam) {
    return <TeamLoadingSkeleton />;
  }

  // If no authors found
  if (teamMembers?.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Team</CardTitle>
          <CardDescription>Team Members on access level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No team members found</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-2">
              No team members have been added to this project yet
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
        <CardDescription>Team Members on access level</CardDescription>
      </CardHeader>
      <CardContent>

        {/* Team Members Section (if available) */}
        {teamMembers && teamMembers.length > 0 && (
          <div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image || ''} alt={member.user.name || ''} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {member.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{member.user.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {member.access}
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
