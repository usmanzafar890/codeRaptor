import React from "react";
import Image from "next/image";
import {
  ChevronDown,
  Eye,
  Pencil,
  Check,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { type ProjectAccessLevel } from "../team-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberData {
  userId: string;
  name: string;
  image: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: Date;
}

interface MemberListProps {
  memberPermissions: Record<string, ProjectAccessLevel>;
  memberData: Record<string, MemberData>;
  setMemberPermissions: React.Dispatch<
    React.SetStateAction<Record<string, ProjectAccessLevel>>
  >;
  activeMemberDropdown: string | null;
  setActiveMemberDropdown: (email: string | null) => void;
  cancelInvitation: (email: string) => void;
  resendInvitation: (email: string) => void;
  removeUser: (userId: string) => void;
  updateUserAccess: (userId: string, access: ProjectAccessLevel) => void;
}

const getAccessLevelText = (access: ProjectAccessLevel) => {
  switch (access) {
    case "FULL_ACCESS":
      return "Full Access";
    case "EDIT":
      return "Can Edit";
    case "VIEW_ONLY":
      return "Can View";
    default:
      return access;
  }
};

const MemberList = ({
  memberPermissions,
  memberData,
  setMemberPermissions,
  activeMemberDropdown,
  setActiveMemberDropdown,
  cancelInvitation,
  resendInvitation,
  removeUser,
  updateUserAccess,
}: MemberListProps) => {
  const getActiveMembers = () => {
    return Object.keys(memberPermissions).filter(
      (email) => memberData[email]?.status === "accepted",
    );
  };

  const getPendingMembers = () => {
    return Object.keys(memberPermissions).filter(
      (email) => memberData[email]?.status === "pending",
    );
  };

  const getDeclinedMembers = () => {
    return Object.keys(memberPermissions).filter(
      (email) => memberData[email]?.status === "declined",
    );
  };

  const getStatusIcon = (status: "pending" | "accepted" | "declined") => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "declined":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: "pending" | "accepted" | "declined") => {
    switch (status) {
      case "accepted":
        return "Active";
      case "pending":
        return "Pending";
      case "declined":
        return "Declined";
      default:
        return "";
    }
  };

  const getStatusColor = (status: "pending" | "accepted" | "declined") => {
    switch (status) {
      case "accepted":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "declined":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <>
      {getActiveMembers().length > 0 && (
        <div className="px-4 pt-3 pb-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">
              Members with Access ({getActiveMembers().length})
            </h3>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>

          <div className="space-y-4">
            {getActiveMembers().map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-lg bg-white p-1.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={memberData[email]?.image || ""}
                      alt={memberData[email]?.name || email}
                    />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {memberData[email]?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {memberData[email]?.name || email.split("@")[0]}
                    </div>
                    <div className="text-xs text-gray-500">{email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${getStatusColor(memberData[email]?.status || "accepted")}`}
                  >
                    {getStatusIcon(memberData[email]?.status || "accepted")}
                    <span>
                      {getStatusText(memberData[email]?.status || "accepted")}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      data-dropdown-button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMemberDropdown(
                          activeMemberDropdown === email ? null : email,
                        );
                      }}
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {memberPermissions[email] === "FULL_ACCESS" && (
                        <Users className="h-4 w-4 text-gray-400" />
                      )}
                      {memberPermissions[email] === "EDIT" && (
                        <Pencil className="h-4 w-4 text-gray-400" />
                      )}
                      {memberPermissions[email] === "VIEW_ONLY" && (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                      <span>
                        {getAccessLevelText(memberPermissions[email])}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${activeMemberDropdown === email ? "rotate-180" : ""}`}
                      />
                    </button>

                    {activeMemberDropdown === email && (
                      <div
                        data-dropdown-content
                        className="absolute top-full right-0 z-[60] mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white shadow-lg"
                      >
                        <button
                          onClick={() => {
                            if (memberData[email]) {
                              updateUserAccess(
                                memberData[email].userId,
                                "FULL_ACCESS",
                              );
                            }
                            setActiveMemberDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 first:rounded-t-lg hover:bg-gray-50"
                        >
                          <Users className="h-4 w-4 text-gray-500" />
                          Full Access
                        </button>
                        <button
                          onClick={() => {
                            if (memberData[email]) {
                              updateUserAccess(
                                memberData[email].userId,
                                "EDIT",
                              );
                            }
                            setActiveMemberDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                          Can Edit
                        </button>
                        <button
                          onClick={() => {
                            if (memberData[email]) {
                              updateUserAccess(
                                memberData[email].userId,
                                "VIEW_ONLY",
                              );
                            }
                            setActiveMemberDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                          Can View
                        </button>
                        <div className="my-1 border-t border-gray-100"></div>
                        <button
                          onClick={() => {
                            if (memberData[email]) {
                              removeUser(memberData[email].userId);
                            }
                            setActiveMemberDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 last:rounded-b-lg hover:bg-red-50"
                        >
                          <Users className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MemberList;
