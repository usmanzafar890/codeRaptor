/* eslint-disable @next/next/no-img-element */
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/trpc/react"
import { Building2, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationsPage() {
  const router = useRouter()
  const { data: organizations, isLoading } = api.organization.getUserOrganizations.useQuery()

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage your teams and collaborate on projects</p>
        </div>
        <Button onClick={() => router.push('/organizations/create')}>
          <Plus className="mr-2 h-4 w-4" /> Create Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="border-t pt-3">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : organizations && organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org:any) => (
            <Link href={`/organizations/${org.organizationId}`} key={org.organizationId}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {org.organization.logoUrl ? (
                      <div className="h-8 w-8 rounded-md overflow-hidden">
                        <img 
                          src={org.organization.logoUrl} 
                          alt={org.organization.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <CardTitle className="text-xl">{org.organization.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {org.organization.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Role: {org.role.toLowerCase()}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3">
                  <Button variant="ghost" className="w-full justify-start">
                    View Organization
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No organizations yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create an organization to collaborate with your team members on projects
          </p>
          <Button onClick={() => router.push('/organizations/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Organization
          </Button>
        </div>
      )}
    </div>
  )
}
