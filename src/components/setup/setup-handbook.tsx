"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Building2, CheckCircle2, Circle, Github, Users, Settings, Database, Zap, GitBranch, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { api } from "@/trpc/react"
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner"
import useRefetch from "@/hooks/use-refetch"
import { useRouter } from "next/navigation"
import Image from "next/image"
import useProject from "@/hooks/use-project"

// Import separated components
import FirstStep from "./first-step"
import BranchStep from "./branch-step"
import IntegrationsStep from "./integrations-step"
import DatabaseStep from "./database-step"
import EnvironmentStep from "./environment-step"
import TeamStep from "./team-step"
import OrganizationStep from "./organization-step"
import ProjectCreationLoader from "./project-loader"

interface StepState {
  status: "active" | "completed" | "skipped" | "pending" | "loading"
}

type RepositoryFormData = {
  githubUrl: string
  projectName: string
}

type IntegrationsFormData = {
  slack: boolean
  jira: boolean
  aws: boolean
  vercel: boolean
  linear: boolean
  notion: boolean
}

type BranchesFormData = {
  mainBranch: boolean
  allRepositories: boolean
  selectedBranches: string[]
}

type DatabaseFormData = {
  type: string
  url: string
}

type EnvironmentFormData = {
  vars: string
}

type TeamFormData = {
  email: string
  role: string
}

type OrganizationFormData = {
  organizationId: string | null
}

type AllFormData = {
  repository: RepositoryFormData
  organization: OrganizationFormData
  integrations: IntegrationsFormData
  branches: BranchesFormData
  database: DatabaseFormData
  environment: EnvironmentFormData
  team: TeamFormData
}

export default function SetupHandbook() {
  const router = useRouter()
  const refetch = useRefetch()
  const { setProjectId, invalidateProjects } = useProject()
  const stepOrder = ["repository", "organization", "branches", "integrations", "database", "environment", "team"]

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStepId = stepOrder[currentStepIndex]

  const [steps, setSteps] = useState<{ [key: string]: StepState }>({
    repository: { status: "active" },
    organization: { status: "pending" },
    integrations: { status: "pending" },
    branches: { status: "pending" },
    database: { status: "pending" },
    environment: { status: "pending" },
    team: { status: "pending" },
  })

  const [allFormData, setAllFormData] = useState<AllFormData>({
    repository: {
      githubUrl: "",
      projectName: "",
    },
    organization: {
      organizationId: null,
    },
    integrations: {
      slack: false,
      jira: false,
      aws: false,
      vercel: false,
      linear: false,
      notion: false,
    },
    branches: {
      mainBranch: true,
      allRepositories: false,
      selectedBranches: ["main"],
    },
    database: {
      type: "",
      url: "",
    },
    environment: {
      vars: "",
    },
    team: {
      email: "",
      role: "",
    },
  })

  const [isRepositoryValidated, setIsRepositoryValidated] = useState(false)
  const [showProjectLoader, setShowProjectLoader] = useState(false)
  const [projectCreationTime, setProjectCreationTime] = useState(8000)
  const [isProjectCreated, setIsProjectCreated] = useState(false)
  const [repoType, setRepoType] = useState<"public" | "private">("public")
  const [selectedPrivateRepo, setSelectedPrivateRepo] = useState<string>("")
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  console.log("🚀 ~ SetupHandbook ~ isGitHubConnected:", isGitHubConnected)

  // Check if user is connected to GitHub
  const checkGitHubConnection = api.project.checkGitHubConnection.useQuery()

  // Update GitHub connection status when data is available
  useEffect(() => {
    if (checkGitHubConnection.data) {
      // Check if either token or installation is valid
      const hasValidConnection = checkGitHubConnection.data.hasValidToken || 
                                checkGitHubConnection.data.hasValidInstallation;
      
      setIsGitHubConnected(hasValidConnection);
      
      // Log detailed connection status for debugging
      console.log("GitHub Connection Status:", {
        isConnected: hasValidConnection,
        hasValidToken: checkGitHubConnection.data.hasValidToken,
        hasValidInstallation: checkGitHubConnection.data.hasValidInstallation,
        hasPrivateRepoAccess: checkGitHubConnection.data.hasPrivateRepoAccess
      });
    }
  }, [checkGitHubConnection.data])


  const { register, handleSubmit, reset, setValue, getValues } = useForm<RepositoryFormData>({
    defaultValues: allFormData.repository,
  })


  useEffect(() => {
    if (currentStepId === "repository") {
      setValue("projectName", allFormData.repository.projectName)
      setValue("githubUrl", allFormData.repository.githubUrl)
    }
  }, [currentStepId, allFormData.repository, setValue])

  const createProject = api.project.createProject.useMutation()
  const checkCredits = api.project.checkCredits.useMutation()

  function onRepositorySubmit(data: RepositoryFormData) {
    setAllFormData((prev) => ({ ...prev, repository: data }))
    const githubUrlToSend = repoType === "public" ? data.githubUrl : `https://github.com/${selectedPrivateRepo}`
    checkCredits.mutate(
      {
        githubUrl: githubUrlToSend,
      },
      {
        onSuccess: (result: any) => {
          if (result.userCredits >= result.fileCount) {
            setIsRepositoryValidated(true)
            setSteps((prev) => ({
              ...prev,
              repository: { status: "completed" },
            }))
          } else {
            setIsRepositoryValidated(false)
          }
        },
        onError: () => {
          showErrorToast("Failed to check credits")
          setIsRepositoryValidated(false)
        },
      },
    )
  }

  function createProjectFinal() {
    if (allFormData.repository && checkCredits.data) {
      setShowProjectLoader(true)
      setIsProjectCreated(false)


      const fileCount = checkCredits.data.fileCount || 25
      const estimatedTime = Math.max(8000, fileCount * 200)
      setProjectCreationTime(estimatedTime)

      const githubUrlToCreate = repoType === "public" ? allFormData.repository.githubUrl : `https://github.com/${selectedPrivateRepo}` // Placeholder for private repo URL


      createProject.mutate(
        {
          name: allFormData.repository.projectName,
          githubUrl: githubUrlToCreate,
          organizationId: allFormData.organization.organizationId,
          branches: allFormData?.branches?.selectedBranches?.map((branch) => ({ name: branch, isActive: true })) || [{ name: 'main', isActive: true }],

        },
        {
          onSuccess: (data) => {
            // Invalidate projects data to ensure fresh data
            invalidateProjects()
            
            // Set the newly created project as the active project
            if (data && data.id) {
              setProjectId(data.id)
            }
            
            setIsProjectCreated(true)
          },
          onError: () => {
            setShowProjectLoader(false)
            setIsProjectCreated(false)
            showErrorToast("Failed to create project")
          },
        },
      )
    }
  }

  const handleLoaderComplete = () => {
    setShowProjectLoader(true)
    setIsProjectCreated(false)

    showSuccessToast("Project created successfully")
    refetch()
    reset()
    
    // Make sure projects data is invalidated again before redirecting
    invalidateProjects()

    // Redirect to dashboard
    router.push('/dashboard')
  }

  const hasEnoughCredits = checkCredits?.data?.userCredits
    ? checkCredits.data.fileCount <= checkCredits.data.userCredits
    : true


  const saveCurrentStepData = () => {
    const currentStepId = stepOrder[currentStepIndex]
    if (currentStepId === "repository") {
      setAllFormData((prev) => ({ ...prev, repository: getValues() }))
    }
  }


  const goToNextStep = () => {
    saveCurrentStepData()

    if (currentStepIndex < stepOrder.length - 1) {
      const currentStep = stepOrder[currentStepIndex]
      const nextStep = stepOrder[currentStepIndex + 1]

      if (currentStep && nextStep) {

        setSteps((prev) => ({
          ...prev,
          [currentStep]: { status: "loading" },
        }))


        setTimeout(() => {
          setSteps((prev) => ({
            ...prev,
            [currentStep]: { status: "completed" },
            [nextStep]: { status: "active" },
          }))
          setCurrentStepIndex((prev) => prev + 1)
        }, 500)
      }
    }
  }

  const goToPreviousStep = () => {
    saveCurrentStepData()

    if (currentStepIndex > 0) {
      const currentStep = stepOrder[currentStepIndex]
      const prevStep = stepOrder[currentStepIndex - 1]

      if (currentStep && prevStep) {
        setSteps((prev) => ({
          ...prev,
          [currentStep]: { status: prev[currentStep]?.status === "active" ? "completed" : (prev[currentStep]?.status || "pending") },
          [prevStep]: { status: "active" },
        }))
      }

      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const skipCurrentStep = () => {
    saveCurrentStepData()

    const currentStep = stepOrder[currentStepIndex]
    if (currentStep) {

      setSteps((prev) => ({
        ...prev,
        [currentStep]: { status: "loading" },
      }))


      setTimeout(() => {
        const nextStep = stepOrder[currentStepIndex + 1]

        setSteps((prev) => ({
          ...prev,
          [currentStep]: { status: "skipped" },
          ...(nextStep && { [nextStep]: { status: "active" } })
        }))


        if (currentStepIndex === stepOrder.length - 1) {
          setCurrentStepIndex(stepOrder.length);
        } else {
          setCurrentStepIndex((prev) => prev + 1)
        }
      }, 500)
    }
  }

  const getProgressIcon = (stepId: string) => {
    const step = steps[stepId]

    if (!step) return null

    switch (step.status) {
      case "active":
        return (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
            <Circle className="w-4 h-4 text-blue-500 animate-pulse" strokeDasharray="3 3" />
          </motion.div>
        )
      case "loading":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case "completed":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </motion.div>
        )
      case "skipped":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Circle className="w-4 h-4 text-gray-600" strokeDasharray="3 3" />
          </motion.div>
        )
      case "pending":
        return (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
            <Circle className="w-4 h-4 text-gray-400" />
          </motion.div>
        )
      default:
        return null
    }
  }

  const stepConfigs = {
    repository: {
      title: "Connect repository",
      description: "Link your GitHub/GitLab repository for version control",
      content: (
        <FirstStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
          checkCredits={checkCredits}
          repoType={repoType}
          setRepoType={setRepoType}
          selectedPrivateRepo={selectedPrivateRepo}
          setSelectedPrivateRepo={setSelectedPrivateRepo}
          isGitHubConnected={isGitHubConnected}
          setIsGitHubConnected={setIsGitHubConnected}
          getValues={getValues}
        />
      ),
    },
    organization: {
      icon: <Building2 className="w-3 h-3" />,
      title: "Select Organization",
      description: "Choose an organization for this project",
      content: (
        <OrganizationStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
    branches: {
      icon: <GitBranch className="w-3 h-3" />,
      title: "Select Branches",
      description: "Select the branches you want to monitor",
      content: (
        <BranchStep

          allBranches={checkCredits?.data?.allBranch || []}

          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
    integrations: {
      icon: <Zap className="w-3 h-3" />,
      title: "Set up integrations",
      description: "Connect essential development tools and services",
      content: (
        <IntegrationsStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
    database: {
      icon: <Database className="w-3 h-3" />,
      title: "Configure Project",
      description: "Set up your database connection and schema",
      content: (
        <DatabaseStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
    environment: {
      icon: <Settings className="w-3 h-3" />,
      title: "Environment variables",
      description: "Configure environment settings and secrets",
      content: (
        <EnvironmentStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
    team: {
      icon: <Users className="w-3 h-3" />,
      title: "Invite your team",
      description: "Add team members and configure roles",
      content: (
        <TeamStep
          allFormData={allFormData}
          setAllFormData={setAllFormData}
        />
      ),
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-2">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="text-center mb-0">
          <div className="flex items-center justify-center mb-2">
            <Image src="/github-mark.svg" width={24} height={24} className="h-6 w-auto mr-3" alt="GitHub Logo" />
            <h1 className="text-2xl font-semibold text-black">Link your Github Repository</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
            Enter the URL of your Github repository to link it to Code Raptor
          </p>
        </div>

        {/* Main Card - Flexible Height */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!showProjectLoader && <CardHeader className="px-5 pt-2 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg font-bold text-black">Project Configuration</CardTitle>
              <Badge className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                Step {Math.min(currentStepIndex + 1, stepOrder.length)} of {stepOrder.length}
              </Badge>
            </div>
            <CardDescription className="text-gray-500 text-xs">
              Configure your project settings, integrations, and team access for optimal development workflow.
            </CardDescription>
          </CardHeader>}

          <CardContent className="px-5 pb-3 flex-1 flex flex-col overflow-hidden">
            {showProjectLoader ? (
              <div className="flex-1 flex items-center justify-center">
                <ProjectCreationLoader
                  isLoading={showProjectLoader}
                  onComplete={handleLoaderComplete}
                  projectCreationTime={projectCreationTime}
                  isProjectCreated={isProjectCreated}
                />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="h-full px-1">
                    <div className="space-y-2 py-1">
                      {stepOrder.map((stepId, index) => {
                        const config = stepConfigs[stepId as keyof typeof stepConfigs]
                        const step = steps[stepId]
                        const isActiveStep = stepId === currentStepId
                        const isCompleted = step?.status === "completed" || step?.status === "skipped"
                        const isVisible = index <= currentStepIndex

                        // Only show current step and previous steps
                        if (!isVisible) {
                          return null;
                        }

                        return (
                          <motion.div
                            key={stepId}
                            data-step={stepId}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.98 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.03,
                              type: "spring",
                              stiffness: 200,
                              damping: 25
                            }}
                            className={`border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-200 ${isActiveStep
                              ? 'ring-1 ring-blue-300 bg-white'
                              : isCompleted
                                ? 'bg-gray-50/50'
                                : 'bg-white'
                              }`}
                          >
                            <div className="px-4 py-2">
                              <div className="flex items-center gap-3">
                                {getProgressIcon(stepId)}
                                <div className="flex items-center gap-2 flex-1">
                                  {"icon" in config && config.icon}
                                  <div className="text-left flex-1">
                                    <div className="font-medium text-black text-sm">{config.title}</div>
                                    <div className="text-xs text-gray-500">{config.description}</div>
                                  </div>
                                </div>

                              </div>

                              {isActiveStep && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, delay: 0.03 }}
                                  className="mt-3 pt-3 pb-2 border-t border-gray-100"
                                >
                                  {config.content}
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    {/* Previous Button */}
                    <Button
                      onClick={goToPreviousStep}
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      className="h-8 text-xs bg-transparent"
                    >
                      Previous
                    </Button>

                    {/* Conditional rendering for middle/right buttons */}
                    {currentStepIndex < stepOrder.length - 1 ? (
                      // For steps 1 to 5 (not the last step)
                      <div className="flex items-center gap-2">
                        {/* Skip Button (for steps 2-5) */}
                        {currentStepIndex !== 0 && (
                          <Button
                            onClick={skipCurrentStep}
                            variant="ghost"
                            className="h-8 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Skip
                          </Button>
                        )}
                        {/* Next/Check Credits Button */}
                        <Button
                          onClick={currentStepIndex === 0 && !isRepositoryValidated ? () => {
                            const formData = getValues();

                            if (formData.projectName && formData.githubUrl) {
                              onRepositorySubmit(formData);
                            }
                          } : goToNextStep}
                          disabled={currentStepIndex === 0 && !isRepositoryValidated ? (checkCredits.isPending || !allFormData.repository.projectName || !allFormData.repository.githubUrl) : false}

                          className="h-8 text-xs"
                        >
                          {currentStepIndex === 0 && !isRepositoryValidated ? (
                            checkCredits.isPending ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Github className="w-3 h-3 mr-1.5" />
                                Check Credits
                              </>
                            )
                          ) : (
                            "Next"
                          )}
                        </Button>
                      </div>
                    ) : currentStepIndex === stepOrder.length - 1 ? (

                      <div className="flex items-center gap-2">
                        {/* Skip Button (moved to right for last step) */}
                        <Button
                          onClick={skipCurrentStep}
                          variant="ghost"
                          className="h-8 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Skip
                        </Button>
                        {/* Create Project Button */}
                        <Button
                          onClick={createProjectFinal}
                          disabled={showProjectLoader}
                          className="h-8 text-xs font-medium"
                        >
                          <Github className="w-3 h-3 mr-1.5" />
                          Create Project
                        </Button>
                      </div>
                    ) : currentStepIndex === stepOrder.length ? (
                      // After skipping last step - only show Create Project button
                      <div className="flex items-center gap-2">
                        {/* Create Project Button */}
                        <Button
                          onClick={createProjectFinal}
                          disabled={showProjectLoader}
                          className="h-8 text-xs font-medium"
                        >
                          <Github className="w-3 h-3 mr-1.5" />
                          Create Project
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
