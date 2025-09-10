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
    
    // Fetch organization projects if an organization is selected
    const { data: orgProjects, isLoading: isLoadingOrgProjects } = api.organization.getOrganizationProjects.useQuery(
        { organizationId: organizationId! },
        { enabled: !!organizationId }
    )

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
                {/* Organization Projects Section (conditionally rendered) */}
                {organizationId && (
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            Organization Projects
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {isLoadingOrgProjects ? (
                                    <div className="p-2 text-sm text-slate-500">Loading projects...</div>
                                ) : orgProjects && orgProjects.length > 0 ? (
                                    <>
                                        {orgProjects.map((project:any) => (
                                            <SidebarMenuItem key={project.id}>
                                                <SidebarMenuButton asChild>
                                                    <div onClick={() => setProjectId(project.id)}>
                                                        <div className={cn(
                                                            'rounded-sm border size-6 flex items-center justify-center text-sm bg-blue-50 text-blue-600',
                                                            {
                                                                'bg-blue-600 text-white': project.id === projectId
                                                            }
                                                        )}>
                                                            {project.name[0]}
                                                        </div>
                                                        <span className="font-medium">{project.name}</span>
                                                    </div>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                        <div className="h-2"></div>
                                        {open && (
                                            <SidebarMenuItem>
                                                <Link href={`/projects/create?organizationId=${organizationId}`}>
                                                    <Button variant="outline" className="w-fit text-xs" size="sm">
                                                        <PlusIcon />
                                                        Add Project
                                                    </Button>
                                                </Link>
                                            </SidebarMenuItem>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-2 text-sm text-slate-500">
                                        No projects in this organization
                                        {open && (
                                            <Link href={`/projects/create?organizationId=${organizationId}`}>
                                                <Button variant="outline" className="w-full mt-2 text-xs" size="sm">
                                                    <PlusIcon className="mr-1 h-3 w-3" />
                                                    Add Project
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Personal Projects Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Personal Projects
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects?.map((project:any) => {
                                return (
                                    <SidebarMenuItem key={project.id}>
                                        <SidebarMenuButton asChild>
                                            <div onClick={() => setProjectId(project.id)}>
                                                <div className={cn(
                                                    'rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary',
                                                    {
                                                        'bg-primary text-white': project.id === projectId
                                                    }
                                                )}>
                                                    {project.name[0]}
                                                </div>
                                                <span className="font-medium">{project.name}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                            <div className="h-2"> </div>
                            {open && (
                                <SidebarMenuItem>
                                    <Link href="/setup">
                                        <Button variant="outline" className="w-fit text-xs" size="sm">
                                            <PlusIcon />
                                            Create Project
                                        </Button>
                                    </Link>
                                </SidebarMenuItem>
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