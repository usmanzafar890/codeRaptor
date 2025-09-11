'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/trpc/react"
import { Building2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const utils = api.useUtils()

  const createOrganization = api.organization.createOrganization.useMutation({
    onSuccess: (data) => {
      // Invalidate the getUserOrganizations query to refresh the data
      utils.organization.getUserOrganizations.invalidate()
      toast.success("Organization created successfully")
      router.push(`/organizations/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create organization: ${error.message}`)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!name.trim()) {
      toast.error("Organization name is required")
      setIsSubmitting(false)
      return
    }

    createOrganization.mutate({
      name,
      description: description.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined
    })
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-500 mt-1">Create a new organization to collaborate with your team</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Fill in the details for your new organization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                placeholder="Enter organization name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter a brief description of your organization"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
              <p className="text-xs text-gray-500">Optional: Provide a short description of your organization</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input 
                id="logoUrl" 
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={isSubmitting}
                type="url"
              />
              <p className="text-xs text-gray-500">Optional: URL to your organization&apos;s logo</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/organizations')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}