"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, X, Github, Calendar, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function InvitationsView() {
  const router = useRouter();
  const { data: invitations, isLoading, refetch } = api.project.getMyInvitations.useQuery();
  const [loadingInvitations, setLoadingInvitations] = React.useState<Record<string, string>>({});

  const respondToInvitationMutation = api.project.respondToInvitation.useMutation({
    onSuccess: (data) => {
      const action = data.status?.toString().toUpperCase() === "ACCEPTED" ? "accepted" : "declined";
      showSuccessToast(`You have ${action} the invitation to ${data.project.name}`);
      refetch();
      
      // If accepted, redirect to the project
      if (data.status?.toString().toUpperCase() === "ACCEPTED") {
        router.push(`/projects/${data.projectId}`);
      }
    },
    onError: (error) => {
      showErrorToast(error.message);
      setLoadingInvitations({});
    },
  });

  const handleAccept = (invitationId: string) => {
    setLoadingInvitations(prev => ({ ...prev, [invitationId]: "ACCEPTED" }));
    respondToInvitationMutation.mutate({
      invitationId,
      status: "ACCEPTED",
    }, {
      onSettled: () => {
        setLoadingInvitations(prev => {
          const newState = { ...prev };
          delete newState[invitationId];
          return newState;
        });
      }
    });
  };
  
  const handleDecline = (invitationId: string) => {
    setLoadingInvitations(prev => ({ ...prev, [invitationId]: "DECLINED" }));
    respondToInvitationMutation.mutate({
      invitationId,
      status: "DECLINED",
    }, {
      onSettled: () => {
        setLoadingInvitations(prev => {
          const newState = { ...prev };
          delete newState[invitationId];
          return newState;
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Project Invitations</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Project Invitations</h1>
        <Card>
          <CardHeader>
            <CardTitle>No Pending Invitations</CardTitle>
            <CardDescription>
              You don&apos;t have any pending project invitations at the moment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Project Invitations</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {invitations.map((invitation) => {
          const project = invitation.project;
          const owner = project.userToProjects?.[0]?.user;
          
          return (
            <Card key={invitation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription>
                      Invited {formatDistanceToNow(new Date(invitation.invitedAt))} ago
                    </CardDescription>
                  </div>
                  <Badge>
                    {invitation.access.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.githubUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Github className="h-4 w-4 text-gray-500" />
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {project.githubUrl.replace("https://github.com/", "")}
                      </a>
                    </div>
                  )}
                  
                  {owner && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={owner.image || ""} alt={owner.name || ""} />
                        <AvatarFallback>
                          {owner.name?.split(" ").map(n => n.charAt(0)).join("").toUpperCase() || owner.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <span className="text-gray-500">Owner:</span> {owner.name}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDecline(invitation.id)}
                      disabled={!!loadingInvitations[invitation.id]}
                    >
                      {loadingInvitations[invitation.id] === "DECLINED" ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Declining...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAccept(invitation.id)}
                      disabled={!!loadingInvitations[invitation.id]}
                    >
                      {loadingInvitations[invitation.id] === "ACCEPTED" ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
