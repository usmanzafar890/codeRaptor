"use client"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface IntegrationsStepProps {
  allFormData: {
    integrations: {
      slack: boolean
      jira: boolean
      aws: boolean
      vercel: boolean
      linear: boolean
      notion: boolean
    }
  }
  setAllFormData: (data: any) => void
}

export default function IntegrationsStep({
  allFormData,
  setAllFormData
}: IntegrationsStepProps) {
  const integrations = [
    { id: "slack", label: "Slack", src: "/logos/slack.svg" },
    { id: "jira", label: "Jira", src: "/logos/jira.svg" },
    { id: "aws", label: "AWS", src: "/logos/aws.svg" },
    { id: "vercel", label: "Vercel", src: "/logos/vercel.svg" },
    { id: "linear", label: "Linear", src: "/logos/linear.svg" },
    { id: "notion", label: "Notion", src: "/logos/notion.svg" },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Connect your development tools like Slack, Jira, monitoring services, and third-party APIs.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {integrations.map((integration) => (
          <div key={integration.id} className="p-1.5 border rounded-md hover:bg-gray-50 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
              <img
                  src={integration.src || "/placeholder.svg"}
                  className="w-4 h-4"
                  alt={integration.label}
                />
                <div className="font-medium text-xs">{integration.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[8px] px-1 py-0.5">Coming Soon</Badge>
                <Switch
                  checked={allFormData.integrations[integration.id as keyof typeof allFormData.integrations]}
                  onCheckedChange={(checked) =>
                    setAllFormData((prev: any) => ({
                      ...prev,
                      integrations: { ...prev.integrations, [integration.id]: checked },
                    }))
                  }
                  disabled
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 