'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/trpc/react"
import { Building2, Edit, Loader2, MoreHorizontal, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [isInviting, setIsInviting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Define organization and member types
  type OrganizationMember = {
    userId: string;
    organizationId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  };
  
  type Project = {
    id: string;
    name: string;
    githubUrl: string;
  };
  
  type OrganizationWithMembers = {
    id: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    ownerId: string;
    members: Array<{
      userId: string;
      role: "OWNER" | "ADMIN" | "MEMBER";
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      };
    }>;
    projects: Array<{
      id: string;
      name: string;
      githubUrl: string;
    }>;
  };

  const { data: organization, isLoading, refetch } = api.organization.getOrganization.useQuery({ id: params.id });
  
  // Use useEffect instead of callbacks
  useEffect(() => {
    if (organization && !isEditing) {
      setName(organization.name);
      setDescription(organization.description || "");
      setLogoUrl(organization.logoUrl || "");
    }
  }, [organization, isEditing]);
  
  // Handle error with error boundary or separate error state
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (error) {
      toast.error(`Error loading organization: ${error}`);
      router.push('/organizations');
    }
  }, [error, router]);

  const updateOrganization = api.organization.updateOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization updated successfully")
      setIsEditing(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to update organization: ${error.message}`)
      setIsSubmitting(false)
    }
  })

  const deleteOrganization = api.organization.deleteOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted successfully")
      router.push('/organizations')
    },
    onError: (error) => {
      toast.error(`Failed to delete organization: ${error.message}`)
      setIsDeleteDialogOpen(false)
    }
  })

  const addMember = api.organization.addMember.useMutation({
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      setInviteRole("MEMBER")
      setIsInviting(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to invite member: ${error.message}`)
      setIsInviting(false)
    }
  })

  const updateMemberRole = api.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated")
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to update member role: ${error.message}`)
    }
  })

  const removeMember = api.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from organization")
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`)
    }
  })

  const handleUpdateOrganization = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!name.trim()) {
      toast.error("Organization name is required")
      setIsSubmitting(false)
      return
    }

    updateOrganization.mutate({
      id: params.id,
      name,
      description: description.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined
    })
  }

  const handleDeleteOrganization = () => {
    deleteOrganization.mutate({ id: params.id })
  }

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    
    if (!inviteEmail.trim()) {
      toast.error("Email is required")
      setIsInviting(false)
      return
    }

    addMember.mutate({
      organizationId: params.id,
      userEmail: inviteEmail,
      role: inviteRole
    })
  }

  const handleUpdateMemberRole = (userId: string, role: "ADMIN" | "MEMBER") => {
    updateMemberRole.mutate({
      organizationId: params.id,
      userId,
      role
    })
  }

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({
      organizationId: params.id,
      userId
    })
  }

  const isOwner = organization?.ownerId === organization?.members.find((member:any) => 
    member.role === "OWNER")?.user.id

  const isAdmin = organization?.members.some((member:any) => 
    member.role === "ADMIN" || member.role === "OWNER")

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-16 w-16 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        
        <Skeleton className="h-12 w-full mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {organization?.logoUrl ? (
            <div className="h-16 w-16 rounded-md overflow-hidden relative">
              <Image 
                src={organization.logoUrl} 
                alt={organization.name} 
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-md bg-blue-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization?.name}</h1>
            <p className="text-gray-500 mt-1">{organization?.description || "No description provided"}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Organization</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this organization? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteOrganization}
                      disabled={deleteOrganization.isPending}
                    >
                      {deleteOrganization.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Organization'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Organization</CardTitle>
            <CardDescription>Update your organization details</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateOrganization}>
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
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditing(false)}
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
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Team Members</h2>
            
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Invite a team member to join your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          disabled={isInviting}
                          type="email"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                          disabled={isInviting}
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <p className="text-xs text-gray-500">
                          Admins can manage organization settings and members.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit"
                        disabled={isInviting || !inviteEmail.trim()}
                      >
                        {isInviting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inviting...
                          </>
                        ) : (
                          'Send Invitation'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="bg-white rounded-md border">
            <div className="p-4 border-b">
              <div className="grid grid-cols-4 text-sm font-medium text-gray-500">
                <div>Member</div>
                <div>Email</div>
                <div>Role</div>
                <div className="text-right">Actions</div>
              </div>
            </div>
            <div className="divide-y">
              {organization?.members.map((member: OrganizationMember) => (
                <div key={member.userId} className="p-4 grid grid-cols-4 items-center">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>{member.user.name?.charAt(0) || member.user.email?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    {member.user.email}
                  </div>
                  <div>
                    <Badge variant={member.role === "OWNER" ? "default" : member.role === "ADMIN" ? "secondary" : "outline"}>
                      {member.role}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {isOwner && member.role !== "OWNER" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleUpdateMemberRole(member.userId, member.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                          >
                            {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            Remove from Organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects</h2>
            
            <Button onClick={() => router.push(`/projects/create?organizationId=${params.id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
          
          {organization?.projects && organization.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organization.projects.map((project: Project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500 truncate">{project.githubUrl}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-3">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.push(`/projects/${project.id}`)}>
                      View Project
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-md bg-gray-50">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Create a new project to get started with your organization
              </p>
              <Button onClick={() => router.push(`/projects/create?organizationId=${params.id}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Additional settings will be available in future updates.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
