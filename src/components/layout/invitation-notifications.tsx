"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Bell, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner";

export default function InvitationNotifications() {
  const router = useRouter();
  const {
    data: invitations,
    isLoading,
    refetch,
  } = api.project.getMyInvitations.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const respondToInvitationMutation =
    api.project.respondToInvitation.useMutation({
      onSuccess: (data) => {
        const action =
          data.status?.toString().toUpperCase() === "ACCEPTED"
            ? "accepted"
            : "declined";
        showSuccessToast(
          `You have ${action} the invitation to ${data.project.name}`,
        );
        refetch();

        // If accepted, redirect to the project
        if (data.status?.toString().toUpperCase() === "ACCEPTED") {
          router.push(`/projects/${data.projectId}`);
        }
      },
      onError: (error) => {
        showErrorToast(error.message);
      },
    });

  const [loadingInvitations, setLoadingInvitations] = React.useState<
    Record<string, string>
  >({});

  const handleAccept = (invitationId: string) => {
    setLoadingInvitations((prev) => ({ ...prev, [invitationId]: "ACCEPTED" }));
    respondToInvitationMutation.mutate(
      {
        invitationId,
        status: "ACCEPTED",
      },
      {
        onSettled: () => {
          setLoadingInvitations((prev) => {
            const newState = { ...prev };
            delete newState[invitationId];
            return newState;
          });
        },
      },
    );
  };

  const handleDecline = (invitationId: string) => {
    setLoadingInvitations((prev) => ({ ...prev, [invitationId]: "DECLINED" }));
    respondToInvitationMutation.mutate(
      {
        invitationId,
        status: "DECLINED",
      },
      {
        onSettled: () => {
          setLoadingInvitations((prev) => {
            const newState = { ...prev };
            delete newState[invitationId];
            return newState;
          });
        },
      },
    );
  };

  const pendingCount = invitations?.length || 0;

  if (isLoading || pendingCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0"
          >
            {pendingCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Pending Invitations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {invitations?.map((invitation) => (
          <div key={invitation.id} className="px-2 py-2">
            <div className="mb-1 flex items-start justify-between">
              <div 
                className="w-48 cursor-pointer" 
                onClick={() => router.push(`/invitation-preview/${invitation.id}`)}
              >
                <div className="font-medium truncate">{invitation.project.name}</div>
                {invitation.project.userToProjects?.[0]?.user && (
                  <div className="text-xs text-gray-600 truncate">
                    Owner: {invitation.project.userToProjects[0].user.name}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Invited {formatDistanceToNow(new Date(invitation.invitedAt))}{" "}
                  ago
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={!!loadingInvitations[invitation.id]}
                >
                  {loadingInvitations[invitation.id] === "DECLINED" ? (
                    <span className="h-4 w-4 animate-spin">⏳</span>
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleAccept(invitation.id)}
                  disabled={!!loadingInvitations[invitation.id]}
                >
                  {loadingInvitations[invitation.id] === "ACCEPTED" ? (
                    <span className="h-4 w-4 animate-spin">⏳</span>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-primary justify-center text-center"
          onClick={() => router.push("/invitations")}
        >
          View all invitations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
