"use client";

import useProject from "@/hooks/use-project";
import { ExternalLink, Github } from "lucide-react";
import React from "react";
import Link from "next/link";
import ProjectHistoryView from "./project-history-view";
import AskQuestionCard from "./ask-question-card";
import MeetingCard from "./meeting-card";
import TeamMembers from "./team-members";
import ArchiveButton from "./archive-button";
import EmptyDashboardView from "./empty-dashboard-view";

const DashboardView = ({ user, projects }: { user: any; projects: any }) => {
  const { project } = useProject();
  const projectId = project?.id;
  
  // If no project is selected, show the empty dashboard view
  if (!projectId) {
    return <EmptyDashboardView />;
  }
  
  const currentProject = projects.find((p: any) => p.id === projectId);
  const isFullAccess = currentProject?.userToProjects.some(
    (utp: any) => utp.access === "FULL_ACCESS" || utp.access === "OWNER",
  );
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Github Link */}
        <div className="bg-primary w-full rounded-md px-3 py-2 sm:w-fit sm:px-4 sm:py-3">
          <div className="flex items-center">
            <Github className="size-4 text-white sm:size-5" />
            <div className="ml-2">
              <p className="text-xs font-medium text-white sm:text-sm">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  <span className="hidden sm:inline">{project?.githubUrl}</span>
                  <span className="sm:hidden">GitHub</span>
                  <ExternalLink className="ml-1 size-3 sm:size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <TeamMembers isFullAccess={isFullAccess} />
          <ArchiveButton />
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          <AskQuestionCard />
          <MeetingCard />
        </div>
      </div>
      <div className="mt-6 sm:mt-8"></div>
      <ProjectHistoryView />
    </div>
  );
};

export default DashboardView;
