"use client"

import useProject from "@/hooks/use-project"
import React, { useState, useMemo, useEffect } from "react"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, GitBranch, UserRound, GitPullRequest, Clock, XCircle } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const PullRequestList = () => {
    const { project } = useProject()
    const [selectedState, setSelectedState] = useState<string>("all")
    const [selectedAuthor, setSelectedAuthor] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const prsPerPage = 10

    const githubUrlParts = project?.githubUrl?.split("/") || []
    const owner = githubUrlParts[githubUrlParts.length - 2]
    const repo = githubUrlParts[githubUrlParts.length - 1]

    const { data, isLoading, isError } = api.pullrequest.getAllPullRequests.useQuery(
        { owner: owner || "", repo: repo || "", state: selectedState === "all" ? "all" : selectedState as "open" | "closed" },
        { 
            enabled: !!owner && !!repo,
            refetchInterval: 30000
        }
    )

    const uniqueAuthors = useMemo(() => {
        if (!data?.pullRequests) return []
        const authors = new Set(data.pullRequests.map(pr => pr.user?.login).filter(Boolean) as string[])
        return ["all", ...Array.from(authors).sort()]
    }, [data?.pullRequests])

    const filteredPRs = useMemo(() => {
        if (!data?.pullRequests) return []

        let currentFiltered = data.pullRequests

        if (selectedAuthor !== "all") {
            currentFiltered = currentFiltered.filter(pr => pr.user?.login === selectedAuthor)
        }

        return currentFiltered
    }, [data?.pullRequests, selectedAuthor])

    const totalPRs = filteredPRs.length
    const totalPages = Math.ceil(totalPRs / prsPerPage)
    const currentPRs = useMemo(() => {
        const startIndex = (currentPage - 1) * prsPerPage
        const endIndex = startIndex + prsPerPage
        return filteredPRs.slice(startIndex, endIndex)
    }, [filteredPRs, currentPage, prsPerPage])

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [selectedState, selectedAuthor])

    useEffect(() => {
        setSelectedState("all")
        setSelectedAuthor("all")
        setCurrentPage(1)
    }, [project?.id])

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
                {/* Header Skeleton */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 animate-pulse">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="h-6 bg-gray-200 rounded w-28"></div>
                        <div className="h-10 bg-gray-200 rounded w-full sm:w-[200px]"></div>
                        <div className="h-10 bg-gray-200 rounded w-full sm:w-[200px]"></div>
                    </div>
                </div>

                {/* PR List Skeleton */}
                <ul className="space-y-6 md:space-y-8">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="relative flex gap-x-4 sm:gap-x-6 animate-pulse">
                            <div className="absolute left-5 sm:left-7 top-0 flex w-0.5 justify-center transform -translate-x-1/2 -ml-0.5 h-full">
                                <div className="w-px bg-gray-200"></div>
                            </div>
                            <div className="relative flex-none z-10">
                                <div className="size-10 sm:size-12 rounded-full bg-gray-200"></div>
                            </div>
                            <div className="flex-auto rounded-lg bg-gray-100 p-4 sm:p-5 shadow-sm ring-1 ring-inset ring-gray-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-x-4 mb-2">
                                    <div className="flex flex-col flex-grow">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">
                                        <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Pagination Skeleton */}
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 mt-10 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="flex items-center space-x-2">
                        <div className="h-9 bg-gray-200 rounded w-24"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-9 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center h-48 bg-red-50 rounded-lg shadow-sm border border-red-200">
                <p className="text-lg font-medium text-red-700">Failed to load pull requests. Please try again later.</p>
            </div>
        )
    }

    if (!data?.pullRequests || data.pullRequests.length === 0) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-lg font-medium text-gray-600">No pull requests found for this project.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-end gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 flex-wrap gap-2">

                    {/* State Filter */}
                    <div className="flex flex-col space-x-2">
                        <span className="text-base font-medium text-gray-700 whitespace-nowrap"><GitPullRequest className="inline-block size-4 mr-1 text-gray-500" />State:</span>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="w-full min-w-[150px] sm:w-[200px] text-gray-800 font-semibold focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">All Pull Requests</SelectItem>
                                <SelectItem value="open" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">Open</SelectItem>
                                <SelectItem value="closed" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Author Filter */}
                    <div className="flex flex-col space-x-2">
                        <span className="text-base font-medium text-gray-700 whitespace-nowrap"><UserRound className="inline-block size-4 mr-1 text-gray-500" />Author:</span>
                        <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                            <SelectTrigger className="w-full min-w-[150px] sm:w-[200px] text-gray-800 font-semibold focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                                <SelectValue placeholder="Select author" />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                {uniqueAuthors.map((author) => (
                                    <SelectItem key={author} value={author} className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">
                                        {author === "all" ? "All Authors" : author}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ul className="space-y-6 md:space-y-8">
                {currentPRs.map((pr, prIdx) => {
                    const prDate = new Date(pr.created_at).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    })

                    const getStateIcon = (state: string, draft: boolean) => {
                        if (draft) {
                            return <Clock className="size-4 text-gray-500" />
                        }
                        if (state === 'open') {
                            return <GitPullRequest className="size-4 text-green-500" />
                        }
                        if (state === 'closed') {
                            return <XCircle className="size-4 text-red-500" />
                        }
                        return <GitPullRequest className="size-4 text-gray-500" />
                    }

                    const getStateBadgeColor = (state: string, draft: boolean) => {
                        if (draft) {
                            return "bg-gray-100 text-gray-800"
                        }
                        if (state === 'open') {
                            return "bg-green-100 text-green-800"
                        }
                        if (state === 'closed') {
                            return "bg-red-100 text-red-800"
                        }
                        return "bg-gray-100 text-gray-800"
                    }

                    return (
                        <li key={pr.number} className="relative flex gap-x-4 sm:gap-x-6 group">
                            <div
                                className={cn(
                                    prIdx === currentPRs.length - 1 ? 'h-6' : 'h-full',
                                    'absolute left-5 sm:left-7 top-0 flex w-0.5 justify-center transform -translate-x-1/2 -ml-0.5'
                                )}
                            >
                                <div className="w-px bg-gray-300 group-hover:bg-blue-400 transition-colors duration-200"></div>
                            </div>

                            <div className="relative flex-none z-10">
                                <Avatar className="size-10 sm:size-12 border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg">
                                    <AvatarImage
                                        src={pr.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.user?.login || "User")}&background=random`}
                                        alt={pr.user?.login || "User"}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-base">
                                        {pr.user?.login?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-auto rounded-lg bg-gray-50 p-4 sm:p-5 shadow-sm ring-1 ring-inset ring-gray-100 transition-all duration-300 group-hover:shadow-lg group-hover:ring-blue-200">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-x-4 mb-2">
                                    <div className="flex flex-col flex-grow">
                                        <Link
                                            target="_blank"
                                            href={pr.html_url}
                                            className="inline-flex items-center text-base sm:text-lg font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-200"
                                            title="View PR on GitHub"
                                        >
                                            #{pr.number} {pr.title}
                                            <ExternalLink className="ml-2 size-4 sm:size-5 text-blue-500 flex-shrink-0" />
                                        </Link>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span className="font-medium text-gray-800">
                                                {pr.user?.login}
                                            </span>{" "}
                                            opened this pull request
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">
                                        <Badge variant="secondary" className={cn("px-3 py-1 text-xs font-medium flex items-center shadow-sm", getStateBadgeColor(pr.state, pr.draft))}>
                                            {getStateIcon(pr.state, pr.draft)}
                                            <span className="ml-1 truncate">
                                                {pr.draft ? 'Draft' : pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}
                                            </span>
                                        </Badge>
                                        <div className="flex items-center gap-1 mt-1">
                                            <CalendarDays className="size-3.5 text-gray-500" />
                                            <time dateTime={pr.created_at} className="text-xs text-gray-500">
                                                {prDate}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <GitBranch className="size-3.5 text-gray-500" />
                                        <span className="font-medium">{pr.head_ref}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-medium">{pr.base_ref}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>

            {/* Pagination Controls */}
            {totalPRs > prsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 mt-10 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <span className="text-sm font-medium text-gray-700">
                        Showing {((currentPage - 1) * prsPerPage) + 1} - {Math.min(currentPage * prsPerPage, totalPRs)} of {totalPRs} pull requests
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                        >
                            <ChevronLeft className="size-4" /> Previous
                        </Button>
                        <span className="text-sm font-semibold text-gray-800">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                        >
                            Next <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PullRequestList
