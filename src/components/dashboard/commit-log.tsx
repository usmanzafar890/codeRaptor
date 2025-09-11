"use client"

import useProject from "@/hooks/use-project"
import React, { useState, useMemo, useEffect } from "react" 
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, GitBranch, Loader2, UserRound, MessageSquareText } from "lucide-react" 
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


const CommitLog = () => {
    const { projectId, project } = useProject();
    const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
    const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(undefined);
    const [selectedMessageType, setSelectedMessageType] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const commitsPerPage = 10;
    
    const { data, isLoading, isError, refetch } = api.project.getCommits.useQuery({
        projectId,
        commitAuthorName: selectedAuthor === "all" ? undefined : selectedAuthor,
        branchName: selectedBranch === "all" ? undefined : selectedBranch,
        page: currentPage,
        limit: commitsPerPage
    });

    const uniqueBranches = useMemo(() => {
        if (!data?.commits) return [];
        const branches = new Set(data.commits.map(commit => commit.branchName).filter(Boolean) as string[]);
        return ["all", ...Array.from(branches).sort()];
    }, [data?.commits]);

    const uniqueAuthors = useMemo(() => {
        if (!data?.commits) return [];
        const authors = new Set(data.commits.map(commit => commit.commitAuthorName).filter(Boolean) as string[]);
        return ["all", ...Array.from(authors).sort()];
    }, [data?.commits]);

    // Filter by Commit Message Type (still done client-side since API doesn't support it)
    const filteredCommits = useMemo(() => {
        if (!data?.commits) return [];

        let currentFiltered = data.commits;

        // Filter by Commit Message Type (only client-side filter we still need)
        if (selectedMessageType !== "all") {
            currentFiltered = currentFiltered.filter(commit => {
                const lowerCaseMessage = commit.commitMessage.toLowerCase();
                if (selectedMessageType === "merge-pr") {
                    return lowerCaseMessage.startsWith("merge pull request");
                } else if (selectedMessageType === "pull-request") {
                    // This will also catch "Merge pull request" so "merge-pr" should be checked first
                    return lowerCaseMessage.includes("pull request");
                } else if (selectedMessageType === "commit") {
                    return !lowerCaseMessage.startsWith("merge pull request") && !lowerCaseMessage.includes("pull request");
                }
                return true; // Should not happen with "all" check earlier, but for safety
            });
        }

        return currentFiltered;
    }, [data?.commits, selectedMessageType]);

    // Get total pages from API response
    const totalPages = useMemo(() => {
        if (!data?.pagination) return 1;
        return data.pagination.totalPages;
    }, [data?.pagination]);
    
    // Use the filtered commits for message type filtering
    // (or all commits from API if no message type filter)
    const currentCommits = useMemo(() => {
        return filteredCommits;
    }, [filteredCommits]);

    // Handle page changes
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBranch, selectedAuthor, selectedMessageType]);

    // Effect to reset filters and pagination when projectId changes
    useEffect(() => {
        setSelectedBranch("all");
        setSelectedAuthor("all");
        setSelectedMessageType("all");
        setCurrentPage(1);
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
                {/* Header Skeleton */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 animate-pulse">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="h-6 bg-gray-200 rounded w-28"></div> {/* Filter label skeleton */}
                        <div className="h-10 bg-gray-200 rounded w-full sm:w-[200px]"></div> {/* Select trigger skeleton */}
                        <div className="h-10 bg-gray-200 rounded w-full sm:w-[200px]"></div> {/* New Select trigger skeleton */}
                        <div className="h-10 bg-gray-200 rounded w-full sm:w-[200px]"></div> {/* New Select trigger skeleton */}
                    </div>
                </div>

                {/* Commit List Skeleton (simulate 3-4 commits) */}
                <ul className="space-y-6 md:space-y-8">
                    {[1, 2, 3].map((i) => ( // Simulate 3 commit items
                        <li key={i} className="relative flex gap-x-4 sm:gap-x-6 animate-pulse">
                            <div className="absolute left-5 sm:left-7 top-0 flex w-0.5 justify-center transform -translate-x-1/2 -ml-0.5 h-full">
                                <div className="w-px bg-gray-200"></div>
                            </div>
                            <div className="relative flex-none z-10">
                                <div className="size-10 sm:size-12 rounded-full bg-gray-200"></div> {/* Avatar skeleton */}
                            </div>
                            <div className="flex-auto rounded-lg bg-gray-100 p-4 sm:p-5 shadow-sm ring-1 ring-inset ring-gray-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-x-4 mb-2">
                                    <div className="flex flex-col flex-grow">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div> {/* Commit message skeleton */}
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div> {/* Author info skeleton */}
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">
                                        <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div> {/* Badge skeleton */}
                                        <div className="h-4 bg-gray-200 rounded w-24"></div> {/* Date skeleton */}
                                    </div>
                                </div>
                                <div className="mt-3 bg-gray-200 rounded-md h-24"></div> {/* Summary skeleton */}
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Pagination Skeleton */}
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 mt-10 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48"></div> {/* Pagination text skeleton */}
                    <div className="flex items-center space-x-2">
                        <div className="h-9 bg-gray-200 rounded w-24"></div> {/* Previous button skeleton */}
                        <div className="h-6 bg-gray-200 rounded w-16"></div> {/* Page number skeleton */}
                        <div className="h-9 bg-gray-200 rounded w-24"></div> {/* Next button skeleton */}
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center h-48 bg-red-50 rounded-lg shadow-sm border border-red-200">
                <p className="text-lg font-medium text-red-700">Failed to load commits. Please try again later.</p>
            </div>
        );
    }

    if (!data?.commits || data.commits.length === 0) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-lg font-medium text-gray-600">No commits found for this project.</p>
            </div>
        );
    }

    return (

        <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-end gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 flex-wrap gap-2">

                    {/* Branch Filter */}
                    <div className="flex flex-col space-x-2">
                        <span className="text-base font-medium text-gray-700 whitespace-nowrap"><GitBranch className="inline-block size-4 mr-1 text-gray-500" />Branch:</span>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-full min-w-[150px] sm:w-[200px] text-gray-800 font-semibold focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                                <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                {uniqueBranches.map((branch) => (
                                    <SelectItem key={branch} value={branch} className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">
                                        {branch === "all" ? "All Branches" : branch}
                                    </SelectItem>
                                ))}
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

                    {/* Commit Message Type Filter */}
                    <div className="flex flex-col space-x-2">
                        <span className="text-base font-medium text-gray-700 whitespace-nowrap"><MessageSquareText className="inline-block size-4 mr-1 text-gray-500" />Type:</span>
                        <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                            <SelectTrigger className="w-full min-w-[150px] sm:w-[200px] text-gray-800 font-semibold focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                                <SelectValue placeholder="Select message type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200">
                                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">All Types</SelectItem>
                                <SelectItem value="merge-pr" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">Merge Pull</SelectItem>
                                <SelectItem value="pull-request" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">Pull Request</SelectItem>
                                <SelectItem value="commit" className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer">Commit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ul className="space-y-6 md:space-y-8">
                {currentCommits.map((commit, commitIdx) => {
                    const commitDate = new Date(commit.commitDate).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });

                    return (
                        <li key={commit.id} className="relative flex gap-x-4 sm:gap-x-6 group">
                            <div
                                className={cn(
                                    commitIdx === currentCommits.length - 1 ? 'h-6' : 'h-full',
                                    'absolute left-5 sm:left-7 top-0 flex w-0.5 justify-center transform -translate-x-1/2 -ml-0.5'
                                )}
                            >
                                <div className="w-px bg-gray-300 group-hover:bg-blue-400 transition-colors duration-200"></div>
                            </div>

                            <div className="relative flex-none z-10">
                                <Avatar className="size-10 sm:size-12 border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg">
                                    <AvatarImage
                                        src={commit.commitAuthorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commit.commitAuthorName || "User")}&background=random`}
                                        alt={commit.commitAuthorName || "User"}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-base">

                                        {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-auto rounded-lg bg-gray-50 p-4 sm:p-5 shadow-sm ring-1 ring-inset ring-gray-100 transition-all duration-300 group-hover:shadow-lg group-hover:ring-blue-200">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-x-4 mb-2">
                                    <div className="flex flex-col flex-grow">
                                        {/* <Link
                                            target="_blank"
                                            href={`${project?.githubUrl}/commit/${commit.commitHash}`}
                                            className="inline-flex items-center text-base sm:text-lg font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-200"
                                            title="View commit on GitHub"
                                        >
                                            {commit.commitMessage.split('\n')[0]}
                                            <ExternalLink className="ml-2 size-4 sm:size-5 text-blue-500 flex-shrink-0" />
                                        </Link> */}

                                        <Link
                                            href={`/projects/${projectId}/commits/${commit.commitHash}`}
                                            className="inline-flex items-center text-base sm:text-lg font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-200"
                                            title="View commit details"
                                        >
                                            {commit.commitMessage.split('\n')[0]}
                                        </Link>
                                        <div className="text-sm text-gray-600 mt-1">

                                            <span className="font-medium text-gray-800">
                                                {commit.commitAuthorName}
                                            </span>{" "}
                                            committed
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">

                                        <Badge variant="secondary" className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 flex items-center shadow-sm">

                                            <GitBranch className="mr-1 size-3" />
                                            <span className="truncate">{commit?.branchName || '-'}</span>
                                        </Badge>
                                        <div className="flex items-center gap-1 mt-1">
                                            <CalendarDays className="size-3.5 text-gray-500" />

                                            <time dateTime={commit.commitDate instanceof Date ? commit.commitDate.toISOString() : commit.commitDate} className="text-xs text-gray-500">
                                                {commitDate}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                                {commit.summary && (
                                    <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 bg-gray-100 p-3 rounded-md border border-gray-200 max-h-40 overflow-auto font-mono text-pretty">
                                        {commit.summary}
                                    </pre>
                                )}

                            </div>
                        </li>
                    )
                })}
            </ul>

            {/* Pagination Controls */}
            {data?.pagination && data.pagination.total > commitsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 mt-10 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <span className="text-sm font-medium text-gray-700">
                        Showing {((currentPage - 1) * commitsPerPage) + 1} - {Math.min(currentPage * commitsPerPage, data.pagination.total)} of {data.pagination.total} commits
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
    );
};

export default CommitLog;