"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Github, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner";

interface GithubConnectStepProps {
  onGithubConnected: () => void;
}

export default function GithubConnectStep({
  onGithubConnected,
}: GithubConnectStepProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check if user is connected to GitHub
  const checkGitHubConnection = api.project.checkGitHubConnection.useQuery(
    undefined,
    {
      refetchOnWindowFocus: true,
      refetchInterval: isConnecting ? 5000 : false, // Poll when connecting
    },
  );

  // Update GitHub connection status when data is available
  useEffect(() => {
    if (checkGitHubConnection.data) {
      // Check if either token or installation is valid
      const hasValidConnection =
        checkGitHubConnection.data.hasValidToken ||
        checkGitHubConnection.data.hasValidInstallation;

      if (hasValidConnection && isConnecting) {
        setIsConnecting(false);
        setIsConnected(true);
        showSuccessToast("Successfully connected to GitHub");
        onGithubConnected();
      } else if (hasValidConnection && !isConnected) {
        setIsConnected(true);
        onGithubConnected();
      }
    }
  }, [
    checkGitHubConnection.data,
    isConnecting,
    isConnected,
    onGithubConnected,
  ]);

  const generateState = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const randomState = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return randomState;
  };


  const handleConnectGithub = async () => {
    setIsConnecting(true);

    try {
      const state = generateState();
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;
      const githubUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new?state=${state}&redirect_uri=${redirectUri}`;
      router.push(githubUrl);
    } catch (error) {
      setIsConnecting(false);
      showErrorToast("Failed to connect to GitHub");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-start gap-3">
          <Github className="mt-0.5 h-5 w-5 text-gray-700" />
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-800">
              Connect to GitHub
            </h3>
            <p className="text-xs text-gray-600">
              Connecting your GitHub account allows Code Raptor to access your
              repositories, manage pull requests, and provide code analysis
              features.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {isConnected ? (
          <div className="flex flex-col items-center">
            <div className="mb-3 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">
              Successfully connected to GitHub
            </p>
            <p className="mt-1 text-xs text-gray-500">
              You can now access your repositories and collaborate with your
              team
            </p>
          </div>
        ) : (
          <Button
            onClick={handleConnectGithub}
            className="bg-black text-white hover:bg-gray-800"
            size="lg"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub Account
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
