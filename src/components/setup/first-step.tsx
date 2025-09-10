"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info } from 'lucide-react'
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { api } from "@/trpc/react"

type RepositoryFormData = {
  githubUrl: string
  projectName: string
}

interface FirstStepProps {
  allFormData: {
    repository: RepositoryFormData
  }
  setAllFormData: (data: any) => void
  checkCredits: any
  repoType: "public" | "private"
  setRepoType: (type: "public" | "private") => void
  selectedPrivateRepo: string
  setSelectedPrivateRepo: (repo: string) => void
  isGitHubConnected: boolean
  setIsGitHubConnected: (connected: boolean) => void
  getValues: () => RepositoryFormData
}

type Repository = {
  id: number
  name: string
  fullName: string
  url: string
  isPrivate: boolean
}

export default function FirstStep({
  allFormData,
  setAllFormData,
  checkCredits,
  repoType,
  setRepoType,
  selectedPrivateRepo,
  setSelectedPrivateRepo,
  isGitHubConnected,
  setIsGitHubConnected,
  getValues
}: FirstStepProps) {
  const { register } = useForm<RepositoryFormData>({
    defaultValues: allFormData.repository,
  })
  const router = useRouter()
  
  // Fetch user repositories
  const userRepositories = api.project.getUserRepositories.useQuery(undefined, {
    enabled: isGitHubConnected,
    refetchOnWindowFocus: false
  })

  const generateState = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const randomState = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return randomState;
  };

  const handleConnect = async () => {
    const state = generateState();
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;
    const githubUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new?state=${state}&redirect_uri=${redirectUri}`;
    router.push(githubUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="repo-type" className="text-sm font-medium">
          Repository Type
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Public</span>
          <Switch
            id="repo-type"
            checked={repoType === "private"}
            onCheckedChange={(checked) => setRepoType(checked ? "private" : "public")}
          />
          <span className="text-xs text-gray-500">Private</span>
        </div>
      </div>

      {repoType === "public" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="projectName" className="text-xs font-medium">
              Project Name
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-gray-400"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <Input
                {...register("projectName", { required: true })}
                id="projectName"
                className="h-7 text-xs pl-8 bg-white border-gray-200"
                placeholder="Project Name"
                required
                value={allFormData.repository.projectName}
                onChange={(e) => {
                  setAllFormData((prev: any) => ({
                    ...prev,
                    repository: { ...prev.repository, projectName: e.target.value }
                  }));
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">

            <Label htmlFor="githubUrl" className="text-xs font-medium">

              GitHub URL
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-gray-400"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </div>
              <Input

                {...register("githubUrl", { required: true })}
                id="githubUrl"

                className="h-7 text-xs pl-8 bg-white border-gray-200"
                placeholder="GitHub URL"
                type="url"
                required

                value={allFormData.repository.githubUrl}
                onChange={(e) => {
                  setAllFormData((prev: any) => ({
                    ...prev,
                    repository: { ...prev.repository, githubUrl: e.target.value }
                  }));
                }}
              />
            </div>
          </div>
        </>
      )}

      {repoType === "private" && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="projectName" className="text-xs font-medium">
                Project Name
              </Label>
              <button
                type="button"

                className={`text-xs ${isGitHubConnected ? "text-green-600" : "text-orange-600 hover:text-orange-800"}`}
                onClick={isGitHubConnected ? undefined : handleConnect}
                disabled={isGitHubConnected}

              >
                {isGitHubConnected ? "Connected to GitHub" : "Connect to GitHub account"}
              </button>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-gray-400"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <Input
                {...register("projectName", { required: true })}
                id="projectName"
                className={`h-7 text-xs pl-8 border-gray-200 ${isGitHubConnected ? 'bg-white' : 'bg-gray-100'}`}
                placeholder="Project Name"
                required
                disabled={!isGitHubConnected}
                value={allFormData.repository.projectName}
                onChange={(e) => {
                  setAllFormData((prev: any) => ({
                    ...prev,
                    repository: { ...prev.repository, projectName: e.target.value }
                  }));
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="choose-repository" className="text-xs font-medium">
              Choose Repository
            </Label>
            <div className="w-full">
              <Select
                value={selectedPrivateRepo}
                onValueChange={(value) => {
                  // Find the selected repo and update the project name and URL
                  setSelectedPrivateRepo(value);
                  const selectedRepo = userRepositories.data?.repositories.find(repo => repo.fullName === value);
                  if (selectedRepo) {
                    setAllFormData((prev: any) => ({
                      ...prev,
                      repository: { 
                        ...prev.repository, 
                        projectName: selectedRepo.name,
                        githubUrl: selectedRepo.url
                      }
                    }));
                  }
                }}
                disabled={!isGitHubConnected || userRepositories.isLoading}
              >
                <SelectTrigger className={`w-full justify-between px-3 text-xs border-gray-200 !h-7 min-h-[28px] ${isGitHubConnected ? 'bg-white' : 'bg-gray-100'}`}>
                  <SelectValue placeholder={userRepositories.isLoading ? "Loading repositories..." : "Select a repository"} />
                </SelectTrigger>
                <SelectContent>
                  {userRepositories.isLoading ? (
                    <SelectItem value="loading" disabled>Loading repositories...</SelectItem>
                  ) : userRepositories.data?.repositories && userRepositories.data.repositories.length > 0 ? (
                    userRepositories.data.repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        {repo.fullName} {repo.isPrivate ? "(Private)" : "(Public)"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-repos" disabled>No repositories found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {!!checkCredits.data && (
        <div className="bg-orange-50 px-3 py-2 rounded-md border border-orange-200 text-orange-600">
          <div className="flex items-center gap-2">
            <Info className="size-3" />
            <p className="text-xs">
              You will be charged <strong>{checkCredits.data?.fileCount}</strong> credits for this repository.
            </p>
          </div>
          <p className="text-xs text-blue-600 ml-5">
            You have <strong>{checkCredits.data?.userCredits}</strong> credits remaining.
          </p>
        </div>
      )}
    </div>
  )
} 