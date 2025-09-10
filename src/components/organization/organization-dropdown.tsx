'use client';

import { Building2, ChevronDown, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/hooks/use-organization";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function OrganizationDropdown() {
  const router = useRouter();
  const { open } = useSidebar();
  const { organizationId, setOrganizationId } = useOrganization();
  const { data: organizations, isLoading } = api.organization.getUserOrganizations.useQuery();

  const selectedOrg = organizations?.find(
    (org: any) => org.organizationId === organizationId
  );

  const handleSelectOrganization = (id: string) => {
    setOrganizationId(id);
    router.push(`/organizations/${id}`);
  };

  const handleCreateOrganization = () => {
    router.push('/organizations/create');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        {open && <Skeleton className="h-5 w-24" />}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-start gap-2 w-full px-2 hover:bg-slate-100"
        >
          {selectedOrg ? (
            <>
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="rounded-md bg-blue-100 text-blue-600">
                  {selectedOrg.organization.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium truncate">
                    {selectedOrg.organization.name}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-slate-500" />
              </div>
              {open && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-slate-500">Select Organization</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations && organizations.length > 0 ? (
          organizations.map((org : any) => (
            <DropdownMenuItem
              key={org.organizationId}
              className="cursor-pointer"
              onClick={() => handleSelectOrganization(org.organizationId)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-blue-100 text-blue-600 text-xs">
                    {org.organization.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{org.organization.name}</span>
              </div>
              {org.organizationId === organizationId && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="text-center py-2 text-sm text-slate-500">
            No organizations found
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleCreateOrganization}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/organizations')}
        >
          <Users className="mr-2 h-4 w-4" />
          Manage Organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
