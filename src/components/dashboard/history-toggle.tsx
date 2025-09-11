"use client"

import React from "react"
import { GitCommit, GitPullRequest } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HistoryToggleProps {
    activeView: 'commits' | 'pullrequests'
    onViewChange: (view: 'commits' | 'pullrequests') => void
}

const HistoryToggle: React.FC<HistoryToggleProps> = ({ activeView, onViewChange }) => {
    return (
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
                variant={activeView === 'commits' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('commits')}
                className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    activeView === 'commits' 
                        ? "bg-white shadow-sm text-gray-900 hover:bg-white" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                )}
            >
                <GitCommit className="size-4" />
                Commits
            </Button>
            <Button
                variant={activeView === 'pullrequests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('pullrequests')}
                className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    activeView === 'pullrequests' 
                        ? "bg-white shadow-sm text-gray-900 hover:bg-white" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                )}
            >
                <GitPullRequest className="size-4" />
                Pull Requests
            </Button>
        </div>
    )
}

export default HistoryToggle
