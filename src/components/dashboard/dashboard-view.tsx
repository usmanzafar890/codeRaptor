'use client'

import useProject from "@/hooks/use-project"
import { ExternalLink, Github } from "lucide-react"
import React from "react"
import Link from "next/link"
import CommitLog from "./commit-log"
import AskQuestionCard from "./ask-question-card"
import MeetingCard from "./meeting-card"
import TeamMembers from "./team-members"
import ArchiveButton from "./archive-button"

const DashboardView = () => {
    const { project } = useProject()
    return (
        <div className="space-y-4 sm:space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Github Link */}
            <div className="w-full sm:w-fit rounded-md bg-primary px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center">
                <Github className="size-4 sm:size-5 text-white" />
                <div className="ml-2">
                    <p className="text-xs sm:text-sm font-medium text-white">
                        This project is linked to {' '}
                        <Link href={project?.githubUrl ?? ""} className="inline-flex items-center text-white/80 hover:underline">
                            <span className="hidden sm:inline">{project?.githubUrl}</span>
                            <span className="sm:hidden">GitHub</span>
                            <ExternalLink className="ml-1 size-3 sm:size-4"/>
                        </Link>
                    </p>
                </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                <TeamMembers />
                <ArchiveButton />
            </div>
           </div>

          <div className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <AskQuestionCard />
                <MeetingCard />
            
            </div>
           </div>
           <div className="mt-6 sm:mt-8"></div>
           <CommitLog />
        </div> 
    )
}

export default DashboardView