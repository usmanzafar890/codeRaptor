"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Clock, X, Github, Calendar, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function InvitationPreviewView() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.invitationId as string;

  // Fetch the specific invitation
  const { data: invitation, isLoading } = api.project.getInvitationById.useQuery(
    { invitationId },
    {
      enabled: !!invitationId,
    }
  );

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const respondToInvitationMutation = api.project.respondToInvitation.useMutation({
    onSuccess: (data) => {
      const action = data.status?.toString().toUpperCase() === "ACCEPTED" ? "accepted" : "declined";
      showSuccessToast(`You have ${action} the invitation to ${data.project.name}`);
      
      // If accepted, redirect to the project
      if (data.status?.toString().toUpperCase() === "ACCEPTED") {
        router.push(`/projects/${data.projectId}`);
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      showErrorToast(error.message);
      setLoadingAction(null);
    },
  });

  const handleAccept = () => {
    setLoadingAction("ACCEPTED");
    respondToInvitationMutation.mutate({
      invitationId,
      status: "ACCEPTED",
    });
  };

  const handleDecline = () => {
    setLoadingAction("DECLINED");
    respondToInvitationMutation.mutate({
      invitationId,
      status: "DECLINED",
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="container max-w-5xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation may have been deleted or you don&apos;t have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = invitation.project;
  const owner = project.userToProjects?.[0]?.user;

  return (
    <div className="container max-w-5xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Project Invitation: {project.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this project. Review the details before accepting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Project Details</h3>
                <div className="mt-2 space-y-2">
                  {project.githubUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Github className="h-4 w-4 text-gray-500" />
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {project.githubUrl.replace("https://github.com/", "")}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Created {format(new Date(project.createdAt), "PPP")}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Project Owner</h3>
                {owner && (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={owner.image || ""} alt={owner.name || ""} />
                      <AvatarFallback>
                        {owner.name?.split(" ").map(n => n.charAt(0)).join("").toUpperCase() || owner.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{owner.name}</div>
                      <div className="text-xs text-gray-500">{owner.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Invitation Details</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Invited {formatDistanceToNow(new Date(invitation.invitedAt))} ago</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Access level: {invitation.access.replace("_", " ").toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleDecline}
                disabled={!!loadingAction}
              >
                {loadingAction === "DECLINED" ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Declining...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Decline Invitation
                  </>
                )}
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!!loadingAction}
              >
                {loadingAction === "ACCEPTED" ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
