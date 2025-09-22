'use client'

import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenuItem, SidebarMenuButton, SidebarMenu, SidebarFooter } from "@/components/ui/sidebar";
import { Building2, CreditCard, LayoutDashboardIcon, PlusIcon, Presentation, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import useProject from "@/hooks/use-project";
import { useOrganization } from "@/hooks/use-organization";
import { api } from "@/trpc/react";
import { OrganizationDropdown } from "./organization/organization-dropdown";
import { NavUser } from "./nav-user";
import { useEffect } from "react";


const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Organizations",
        url: "/organizations",
        icon: Building2,
    },
    {
        title: "Q&A",
        url: "/qa",
        icon: SparklesIcon,
    },
    {
        title: "Meetings",
        url: "/meetings",
        icon: Presentation,
    },
    {
        title: "Billing",
        url: "/billing",
        icon: CreditCard,
    }
]



export function AppSidebar() {
    const pathname = usePathname()
    const { open } = useSidebar()
    const { projects, projectId, setProjectId } = useProject()
    const { organizationId } = useOrganization()
    const utils = api.useUtils()
    
    // Fetch organization projects if an organization is selected
    const { data: orgProjects, isLoading: isLoadingOrgProjects } = api.organization.getOrganizationProjects.useQuery(
        { organizationId: organizationId! },
        { 
            enabled: !!organizationId,
            staleTime: 0, // Always treat data as stale to ensure fresh data
            refetchOnWindowFocus: true // Refetch when window regains focus
        }
    )
    
    // Set up an effect to invalidate and refetch organization projects when this component mounts or organizationId changes
    useEffect(() => {
        if (organizationId) {
            // Invalidate the getOrganizationProjects query to ensure fresh data
            utils.organization.getOrganizationProjects.invalidate({ organizationId })
        }
    }, [organizationId, utils.organization.getOrganizationProjects])

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={40} height={40} className="w-10 h-10" />
                    {open && (
                        <h1 className="text-xl font-bold text-primary/80">CodeRaptor</h1>
                    )}
                </div>
                <div className="mt-3">
                    <OrganizationDropdown />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Application
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map(item => {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url}
                                                className={cn({
                                                    '!bg-primary !text-white': pathname === item.url
                                                }, 'list-none')}>
                                                <item.icon />
                                                <span className="font-medium">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {/* Projects Section - Combined Personal and Organization */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Projects
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Show loading state if org projects are loading */}
                            {organizationId && isLoadingOrgProjects ? (
                                <div className="p-2 text-sm text-slate-500">Loading projects...</div>
                            ) : (
                                <>
                                    {/* Combine and deduplicate projects */}
                                    {(() => {
                                        // Create a map to track projects by ID to avoid duplicates
                                        const projectMap = new Map();
                                        
                                        // Add personal projects to the map
                                        projects?.forEach((project: any) => {
                                            projectMap.set(project.id, {
                                                ...project,
                                                isPersonal: true
                                            });
                                        });
                                        
                                        // Add organization projects to the map if available
                                        if (organizationId && orgProjects) {
                                            orgProjects.forEach((project: any) => {
                                                projectMap.set(project.id, {
                                                    ...project,
                                                    isOrg: true
                                                });
                                            });
                                        }
                                        
                                        // Convert map back to array
                                        return Array.from(projectMap.values()).map((project: any) => (
                                            <SidebarMenuItem key={project.id}>
                                                <SidebarMenuButton asChild>
                                                    <div onClick={() => setProjectId(project.id)}>
                                                        <div className={cn(
                                                            'rounded-sm border size-6 flex items-center justify-center text-sm',
                                                            {
                                                                'bg-blue-50 text-blue-600': project.isOrg && project.id !== projectId,
                                                                'bg-white text-primary': !project.isOrg && project.id !== projectId,
                                                                'bg-blue-600 text-white': project.isOrg && project.id === projectId,
                                                                'bg-primary text-white': !project.isOrg && project.id === projectId
                                                            }
                                                        )}>
                                                            {project.name[0]}
                                                        </div>
                                                        <span className="font-medium">{project.name}</span>
                                                        {project.isOrg && (
                                                            <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                                Org
                                                            </span>
                                                        )}
                                                    </div>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ));
                                    })()} 
                                    
                                    {/* Add project buttons */}
                                    <div className="h-2"></div>
                                    {open && (
                                        <div className="flex flex-col gap-2">
                                            <SidebarMenuItem>
                                                <Link href="/setup">
                                                    <Button variant="outline" className="w-fit text-xs" size="sm">
                                                        <PlusIcon />
                                                        Create Project
                                                    </Button>
                                                </Link>
                                            </SidebarMenuItem>
                                        </div>
                                    )}
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
        </Sidebar>
    )
}