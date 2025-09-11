'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"
import { useOrganization } from "@/hooks/use-organization"
import { Loader2, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ProjectCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationIdParam = searchParams.get('organizationId')
  const { setOrganizationId } = useOrganization()
  
  // Set organization ID from URL parameter if provided
  useEffect(() => {
    if (organizationIdParam) {
      setOrganizationId(organizationIdParam)
    }
  }, [organizationIdParam, setOrganizationId])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Fetch all user projects
  const { data: userProjects, isLoading: isLoadingUserProjects } = api.project.getProjects.useQuery()
  
  // Check if user is admin or owner of the organization
  const { data: userRole, isLoading: isLoadingRole } = api.organization.getUserRole.useQuery(
    { organizationId: organizationIdParam! },
    { enabled: !!organizationIdParam }
  )
  
  // Convert to boolean to avoid type issues
  const isAdminOrOwner: boolean = !!(userRole?.role === "OWNER" || userRole?.role === "ADMIN")

  // Update project mutation to add organization ID
  const updateProject = api.project.updateProjectOrganization.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully")
      if (organizationIdParam) {
        router.push(`/organizations/${organizationIdParam}`)
      } else {
        router.push('/dashboard')
      }
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Check if user has permission
    if (organizationIdParam && !isAdminOrOwner) {
      toast.error("Only organization owners or admins can add projects")
      setIsSubmitting(false)
      return
    }
    
    if (!selectedProjectId) {
      toast.error("Please select a project")
      setIsSubmitting(false)
      return
    }

    updateProject.mutate({
      projectId: selectedProjectId,
      organizationId: organizationIdParam || undefined
    })
  }

  // Redirect if not loading and not admin/owner
  useEffect(() => {
    if (organizationIdParam && !isLoadingRole && !isAdminOrOwner) {
      toast.error("Only organization owners or admins can add projects")
      router.push(`/organizations/${organizationIdParam}`)
    }
  }, [organizationIdParam, isLoadingRole, isAdminOrOwner, router])

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => organizationIdParam ? router.push(`/organizations/${organizationIdParam}`) : router.push('/dashboard')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add Project to Organization</h1>
        <p className="text-gray-500 mt-1">
          {isLoadingRole ? "Checking permissions..." : 
            (isAdminOrOwner ? "Select an existing project to add to the organization" : 
            "Only organization owners or admins can add projects")
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Project Selection Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="projectSelect">Select Project</Label>
              <Select
                value={selectedProjectId || ""}
                onValueChange={(value) => setSelectedProjectId(value)}
                disabled={!!organizationIdParam && (isAdminOrOwner === false || !!isLoadingRole)}
              >
                <SelectTrigger id="projectSelect" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUserProjects ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading projects...</span>
                    </div>
                  ) : userProjects && userProjects.length > 0 ? (
                    userProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No projects found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => organizationIdParam ? router.push(`/organizations/${organizationIdParam}`) : router.push('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!!isSubmitting || !selectedProjectId || (!!organizationIdParam && (isAdminOrOwner === false || !!isLoadingRole))}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Add Project to Organization'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
