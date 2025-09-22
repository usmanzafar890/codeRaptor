"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/trpc/react"
import { Building2, Loader2, CheckCircle2 } from "lucide-react"
import { useOrganization } from "@/hooks/use-organization"
import { showSuccessToast, showErrorToast } from "@/components/ui/sonner"

interface OrganizationStepProps {
  onOrganizationCreated: () => void
}

export default function OrganizationStep({ onOrganizationCreated }: OrganizationStepProps) {
  const [organizationName, setOrganizationName] = useState("")
  const { setOrganizationId } = useOrganization()
  const [isCreating, setIsCreating] = useState(false)
  const [isCreated, setIsCreated] = useState(false)

  const createOrganization = api.organization.createOrganization.useMutation({
    onSuccess: (data) => {
      setIsCreating(false)
      setIsCreated(true)
      setOrganizationId(data.id)
      showSuccessToast("Organization created successfully")
      onOrganizationCreated()
    },
    onError: (error) => {
      setIsCreating(false)
      showErrorToast(error.message || "Failed to create organization")
    }
  })

  const handleCreateOrganization = () => {
    if (!organizationName.trim()) {
      showErrorToast("Organization name is required")
      return
    }

    setIsCreating(true)
    createOrganization.mutate({
      name: organizationName
    })
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 mb-1">Creating an organization is required</h3>
            <p className="text-xs text-blue-600">
              Organizations help you manage projects and team members in one place. You must create an organization
              to continue with the setup process. You can invite team members, assign roles, and collaborate more effectively.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="organization-name" className="text-sm font-medium">
          Organization Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="organization-name"
          placeholder="Enter organization name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="h-9"
          disabled={isCreating || isCreated}
        />
      </div>

      <Button
        onClick={handleCreateOrganization}
        className="w-full"
        disabled={!organizationName.trim() || isCreating || isCreated}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : isCreated ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Organization Created
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            Create Organization
          </>
        )}
      </Button>
    </div>
  )
}
