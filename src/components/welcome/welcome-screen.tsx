"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Github,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import OrganizationStep from "./organization-step";
import GithubConnectStep from "./github-connect-step";

interface StepState {
  status: "active" | "completed" | "pending" | "loading";
}

export default function WelcomeScreen() {
  const router = useRouter();
  const stepOrder = ["organization", "github"];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepId = stepOrder[currentStepIndex];

  const [steps, setSteps] = useState<{ [key: string]: StepState }>({
    organization: { status: "active" },
    github: { status: "pending" },
  });

  // Track completion status of each step
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const goToNextStep = () => {
    if (currentStepIndex < stepOrder.length - 1) {
      const currentStep = stepOrder[currentStepIndex];
      const nextStep = stepOrder[currentStepIndex + 1];

      if (currentStep && nextStep) {
        setSteps((prev) => ({
          ...prev,
          [currentStep]: { status: "loading" },
        }));

        setTimeout(() => {
          setSteps((prev) => ({
            ...prev,
            [currentStep]: { status: "completed" },
            [nextStep]: { status: "active" },
          }));
          setCurrentStepIndex((prev) => prev + 1);
        }, 500);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const currentStep = stepOrder[currentStepIndex];
      const prevStep = stepOrder[currentStepIndex - 1];

      if (currentStep && prevStep) {
        setSteps((prev) => ({
          ...prev,
          [currentStep]: {
            status:
              prev[currentStep]?.status === "active"
                ? "pending"
                : prev[currentStep]?.status || "pending",
          },
          [prevStep]: { status: "active" },
        }));
      }

      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Organization step is mandatory - no skip function

  const completeSetup = async () => {
    setIsLoading(true);

    try {
      // Mark welcome as complete via API
      const response = await fetch("/api/welcome/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to mark welcome as complete"
        );
      }

      // Get the response data
      const data = await response.json();
      console.log("Welcome completion successful:", data);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing setup:", error);
      
      // Even if there's an error, still redirect to dashboard
      // This prevents the user from being stuck on the welcome page
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
      setIsLoading(false);
    }
  };

  const getProgressIcon = (stepId: string) => {
    const step = steps[stepId];

    if (!step) return null;

    switch (step.status) {
      case "active":
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Circle
              className="h-4 w-4 animate-pulse text-blue-500"
              strokeDasharray="3 3"
            />
          </motion.div>
        );
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </motion.div>
        );
      case "pending":
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Circle className="h-4 w-4 text-gray-400" />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const stepConfigs = {
    organization: {
      icon: <Building2 className="h-3 w-3" />,
      title: "Create Organization",
      description: "Set up your organization for team collaboration",
      content: (
        <OrganizationStep
          onOrganizationCreated={() => setOrganizationCreated(true)}
        />
      ),
    },
    github: {
      icon: <Github className="h-3 w-3" />,
      title: "Connect to GitHub",
      description: "Link your GitHub account for repository access",
      content: (
        <GithubConnectStep onGithubConnected={() => setGithubConnected(true)} />
      ),
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="CodeRaptor Logo" width={80} height={80} />
          </div>
          <h1 className="text-2xl font-semibold text-black">
            Welcome to Code Raptor!
          </h1>
          <p className="text-muted-foreground mx-auto mb-4 max-w-xl text-sm">
            Let&apos;s get you set up with a few quick steps
          </p>
        </div>

        {/* Main Card */}
        <Card className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex-shrink-0 px-5 pt-4 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-black">
                Welcome Setup
              </CardTitle>
              <div className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                Step {currentStepIndex + 1} of {stepOrder.length}
              </div>
            </div>
            <CardDescription className="text-xs text-gray-500">
              Complete these steps to get started with Code Raptor
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-hidden px-5 pb-5">
            <div className="flex-1">
              <div className="h-full px-1">
                <div className="space-y-4 py-2">
                  {stepOrder.map((stepId, index) => {
                    const config =
                      stepConfigs[stepId as keyof typeof stepConfigs];
                    const step = steps[stepId];
                    const isActiveStep = stepId === currentStepId;
                    const isCompleted = step?.status === "completed";
                    const isVisible = index <= currentStepIndex;

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
                          damping: 25,
                        }}
                        className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ${
                          isActiveStep
                            ? "bg-white ring-1 ring-blue-300"
                            : isCompleted
                              ? "bg-gray-50/50"
                              : "bg-white"
                        }`}
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {getProgressIcon(stepId)}
                            <div className="flex flex-1 items-center gap-2">
                              {config.icon}
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-black">
                                  {config.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </div>

                          {isActiveStep && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, delay: 0.03 }}
                              className="mt-4 border-t border-gray-100 pt-4"
                            >
                              {config.content}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex-shrink-0 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                {/* Previous Button */}
                {currentStepIndex > 0 ? (
                  <Button
                    onClick={goToPreviousStep}
                    variant="outline"
                    className="h-9 bg-transparent text-sm"
                  >
                    Back
                  </Button>
                ) : (
                  <div className="h-9">{/* Empty div to maintain layout */}</div>
                )}

                {/* Next/Complete Button */}
                {currentStepIndex < stepOrder.length - 1 ? (
                  <Button
                    onClick={goToNextStep}
                    disabled={currentStepIndex === 0 && !organizationCreated}
                    className="h-9 text-sm"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={completeSetup}
                    disabled={isLoading}
                    className="h-9 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
