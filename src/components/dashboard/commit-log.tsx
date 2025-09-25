"use client";

import useProject from "@/hooks/use-project";
import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Loader2,
  UserRound,
  MessageSquareText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const CommitLog = () => {
  const { projectId, project, projects } = useProject();
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
    undefined,
  );
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(
    undefined,
  );
  const [selectedMessageType, setSelectedMessageType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const commitsPerPage = 10;

  const hasAccess = !!projects?.find((project) => project.id === projectId);

  const { data, isLoading, isError, refetch } = api.project.getCommits.useQuery(
    {
      projectId: hasAccess ? projectId : undefined,
      commitAuthorName: selectedAuthor === "all" ? undefined : selectedAuthor,
      branchName: selectedBranch === "all" ? undefined : selectedBranch,
      page: currentPage,
      limit: commitsPerPage,
    },
  );

  const uniqueBranches = useMemo(() => {
    if (!data?.commits) return [];
    const branches = new Set(
      data.commits
        .map((commit) => commit.branchName)
        .filter(Boolean) as string[],
    );
    return ["all", ...Array.from(branches).sort()];
  }, [data?.commits]);

  const uniqueAuthors = useMemo(() => {
    if (!data?.commits) return [];
    const authors = new Set(
      data.commits
        .map((commit) => commit.commitAuthorName)
        .filter(Boolean) as string[],
    );
    return ["all", ...Array.from(authors).sort()];
  }, [data?.commits]);

  const filteredCommits = useMemo(() => {
    if (!data?.commits) return [];

    let currentFiltered = data.commits;

    if (selectedMessageType !== "all") {
      currentFiltered = currentFiltered.filter((commit) => {
        const lowerCaseMessage = commit.commitMessage.toLowerCase();
        if (selectedMessageType === "merge-pr") {
          return lowerCaseMessage.startsWith("merge pull request");
        } else if (selectedMessageType === "pull-request") {
          return lowerCaseMessage.includes("pull request");
        } else if (selectedMessageType === "commit") {
          return (
            !lowerCaseMessage.startsWith("merge pull request") &&
            !lowerCaseMessage.includes("pull request")
          );
        }
        return true;
      });
    }

    return currentFiltered;
  }, [data?.commits, selectedMessageType]);

  const totalPages = useMemo(() => {
    if (!data?.pagination) return 1;
    return data.pagination.totalPages;
  }, [data?.pagination]);

  const currentCommits = useMemo(() => {
    return filteredCommits;
  }, [filteredCommits]);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, selectedAuthor, selectedMessageType]);
  useEffect(() => {
    setSelectedBranch("all");
    setSelectedAuthor("all");
    setSelectedMessageType("all");
    setCurrentPage(1);
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex animate-pulse flex-col items-start justify-end gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="h-6 w-28 rounded bg-gray-200"></div>{" "}
            <div className="h-10 w-full rounded bg-gray-200 sm:w-[200px]"></div>{" "}
            <div className="h-10 w-full rounded bg-gray-200 sm:w-[200px]"></div>{" "}
            <div className="h-10 w-full rounded bg-gray-200 sm:w-[200px]"></div>{" "}
          </div>
        </div>

        <ul className="space-y-6 md:space-y-8">
          {[1, 2, 3].map(
            (
              i,
            ) => (
              <li
                key={i}
                className="relative flex animate-pulse gap-x-4 sm:gap-x-6"
              >
                <div className="absolute top-0 left-5 -ml-0.5 flex h-full w-0.5 -translate-x-1/2 transform justify-center sm:left-7">
                  <div className="w-px bg-gray-200"></div>
                </div>
                <div className="relative z-10 flex-none">
                  <div className="size-10 rounded-full bg-gray-200 sm:size-12"></div>{" "}
                </div>
                <div className="flex-auto rounded-lg bg-gray-100 p-4 shadow-sm ring-1 ring-gray-100 ring-inset sm:p-5">
                  <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-x-4">
                    <div className="flex flex-grow flex-col">
                      <div className="mb-1 h-6 w-3/4 rounded bg-gray-200"></div>{" "}
                      <div className="h-4 w-1/2 rounded bg-gray-200"></div>{" "}
                    </div>
                    <div className="mt-2 flex flex-shrink-0 flex-col items-start text-left sm:mt-0 sm:items-end sm:text-right">
                      <div className="mb-1 h-6 w-20 rounded bg-gray-200"></div>{" "}
                      <div className="h-4 w-24 rounded bg-gray-200"></div>{" "}
                    </div>
                  </div>
                  <div className="mt-3 h-24 rounded-md bg-gray-200"></div>{" "}
                </div>
              </li>
            ),
          )}
        </ul>

        <div className="mt-10 flex animate-pulse flex-col items-center justify-between space-y-4 rounded-b-lg border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
          <div className="h-6 w-48 rounded bg-gray-200"></div>{" "}
          <div className="flex items-center space-x-2">
            <div className="h-9 w-24 rounded bg-gray-200"></div>{" "}
            <div className="h-6 w-16 rounded bg-gray-200"></div>{" "}
            <div className="h-9 w-24 rounded bg-gray-200"></div>{" "}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-red-200 bg-red-50 shadow-sm">
        <p className="text-lg font-medium text-red-700">
          Failed to load commits. Please try again later.
        </p>
      </div>
    );
  }

  if (!data?.commits || data.commits.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 shadow-sm">
        <p className="text-lg font-medium text-gray-600">
          No commits found for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex flex-col items-start justify-end gap-4 md:flex-row md:items-center">
        <div className="flex flex-col flex-wrap items-start gap-2 space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="flex flex-col space-x-2">
            <span className="text-base font-medium whitespace-nowrap text-gray-700">
              <GitBranch className="mr-1 inline-block size-4 text-gray-500" />
              Branch:
            </span>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full min-w-[150px] font-semibold text-gray-800 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 sm:w-[200px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {uniqueBranches.map((branch) => (
                  <SelectItem
                    key={branch}
                    value={branch}
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                  >
                    {branch === "all" ? "All Branches" : branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-x-2">
            <span className="text-base font-medium whitespace-nowrap text-gray-700">
              <UserRound className="mr-1 inline-block size-4 text-gray-500" />
              Author:
            </span>
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-full min-w-[150px] font-semibold text-gray-800 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 sm:w-[200px]">
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {uniqueAuthors.map((author) => (
                  <SelectItem
                    key={author}
                    value={author}
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                  >
                    {author === "all" ? "All Authors" : author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-x-2">
            <span className="text-base font-medium whitespace-nowrap text-gray-700">
              <MessageSquareText className="mr-1 inline-block size-4 text-gray-500" />
              Type:
            </span>
            <Select
              value={selectedMessageType}
              onValueChange={setSelectedMessageType}
            >
              <SelectTrigger className="w-full min-w-[150px] font-semibold text-gray-800 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 sm:w-[200px]">
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent className="rounded-md border border-gray-200 bg-white shadow-lg">
                <SelectItem
                  value="all"
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                >
                  All Types
                </SelectItem>
                <SelectItem
                  value="merge-pr"
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                >
                  Merge Pull
                </SelectItem>
                <SelectItem
                  value="pull-request"
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                >
                  Pull Request
                </SelectItem>
                <SelectItem
                  value="commit"
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                >
                  Commit
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ul className="space-y-6 md:space-y-8">
        {currentCommits.map((commit, commitIdx) => {
          const commitDate = new Date(commit.commitDate).toLocaleString(
            undefined,
            {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            },
          );

          return (
            <li
              key={commit.id}
              className="group relative flex gap-x-4 sm:gap-x-6"
            >
              <div
                className={cn(
                  commitIdx === currentCommits.length - 1 ? "h-6" : "h-full",
                  "absolute top-0 left-5 -ml-0.5 flex w-0.5 -translate-x-1/2 transform justify-center sm:left-7",
                )}
              >
                <div className="w-px bg-gray-300 transition-colors duration-200 group-hover:bg-blue-400"></div>
              </div>

              <div className="relative z-10 flex-none">
                <Avatar className="size-10 border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-lg sm:size-12">
                  <AvatarImage
                    src={
                      commit.commitAuthorAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(commit.commitAuthorName || "User")}&background=random`
                    }
                    alt={commit.commitAuthorName || "User"}
                  />
                  <AvatarFallback className="bg-blue-100 text-base font-bold text-blue-700">
                    {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-auto rounded-lg bg-gray-50 p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 ring-inset group-hover:shadow-lg group-hover:ring-blue-200 sm:p-5">
                <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-x-4">
                  <div className="flex flex-grow flex-col">
                    <Link
                      href={`/projects/${projectId}/commits/${commit.commitHash}`}
                      className="inline-flex items-center text-base font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900 hover:underline sm:text-lg"
                      title="View commit details"
                    >
                      {commit.commitMessage.split("\n")[0]}
                    </Link>
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {commit.commitAuthorName}
                      </span>{" "}
                      committed
                    </div>
                  </div>
                  <div className="mt-2 flex flex-shrink-0 flex-col items-start text-left sm:mt-0 sm:items-end sm:text-right">
                    <Badge
                      variant="secondary"
                      className="flex items-center bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 shadow-sm"
                    >
                      <GitBranch className="mr-1 size-3" />
                      <span className="truncate">
                        {commit?.branchName || "-"}
                      </span>
                    </Badge>
                    <div className="mt-1 flex items-center gap-1">
                      <CalendarDays className="size-3.5 text-gray-500" />

                      <time
                        dateTime={
                          typeof commit.commitDate === "object" &&
                          commit.commitDate !== null
                            ? new Date(commit.commitDate).toISOString()
                            : String(commit.commitDate)
                        }
                        className="text-xs text-gray-500"
                      >
                        {commitDate}
                      </time>
                    </div>
                  </div>
                </div>
                {commit.summary && (
                  <pre className="mt-3 max-h-40 overflow-auto rounded-md border border-gray-200 bg-gray-100 p-3 font-mono text-sm leading-relaxed text-pretty whitespace-pre-wrap text-gray-700">
                    {commit.summary}
                  </pre>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pagination Controls */}
      {data?.pagination && data.pagination.total > commitsPerPage && (
        <div className="mt-10 flex flex-col items-center justify-between space-y-4 rounded-b-lg border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
          <span className="text-sm font-medium text-gray-700">
            Showing {(currentPage - 1) * commitsPerPage + 1} -{" "}
            {Math.min(currentPage * commitsPerPage, data.pagination.total)} of{" "}
            {data.pagination.total} commits
          </span>
          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
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
              className="flex items-center gap-1 text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
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
