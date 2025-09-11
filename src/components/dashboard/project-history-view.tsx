"use client"

import React, { useState } from "react"
import CommitLog from "./commit-log"
import PullRequestList from "./pull-request-list"
import HistoryToggle from "./history-toggle"

const ProjectHistoryView: React.FC = () => {
    const [activeView, setActiveView] = useState<'commits' | 'pullrequests'>('commits')

    return (
        <div className="space-y-6">
            {/* Header with Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
                        Project History
                    </h2>
                    <HistoryToggle 
                        activeView={activeView} 
                        onViewChange={setActiveView} 
                    />
                </div>
            </div>

            {/* Content based on active view */}
            {activeView === 'commits' ? (
                <CommitLog />
            ) : (
                <PullRequestList />
            )}
        </div>
    )
}

export default ProjectHistoryView
