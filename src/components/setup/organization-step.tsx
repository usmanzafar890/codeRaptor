"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { useOrganization } from "@/hooks/use-organization"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface OrganizationStepProps {
  allFormData: any
  setAllFormData: (data: any) => void
}

export default function OrganizationStep({ allFormData, setAllFormData }: OrganizationStepProps) {
  const router = useRouter()
  const { organizationId, setOrganizationId } = useOrganization()
  const { data: organizations, isLoading } = api.organization.getUserOrganizations.useQuery(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // Set organization in form data when component mounts or when organizationId changes
  useEffect(() => {
    setAllFormData((prev: any) => ({
      ...prev,
      organization: {
        ...prev.organization,
        organizationId: organizationId
      }
    }))
  }, [organizationId, setAllFormData])

  const handleSelectOrganization = (id: string | null) => {
    setOrganizationId(id)
    setAllFormData((prev: any) => ({
      ...prev,
      organization: {
        ...prev.organization,
        organizationId: id
      }
    }))
  }

  const handleCreateOrganization = () => {
    router.push('/organizations/create')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Organization</label>
        <Select
          value={allFormData.organization?.organizationId || ""}
          onValueChange={(value) => handleSelectOrganization(value === "none" ? null : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>No organization</span>
              </div>
            </SelectItem>
            {organizations && organizations.map((org: any) => (
              <SelectItem key={org.organizationId} value={org.organizationId}>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                    {org.organization.name.charAt(0)}
                  </div>
                  <span>{org.organization.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleCreateOrganization}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create New Organization
      </Button>
    </div>
  )
}
