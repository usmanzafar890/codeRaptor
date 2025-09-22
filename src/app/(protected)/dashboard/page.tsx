import React from "react"
import DashboardView from "@/components/dashboard/dashboard-view"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { api } from "@/trpc/server"
import useProject from "@/hooks/use-project"

const DashboardPage = async() => {
        const session = await auth.api.getSession({
            headers: await headers()
        });
    
        if (!session?.user) {
            redirect("/login");
        }
    const projects = await api.project.getProjects()


    return (
        <DashboardView user={session.user} projects={projects}/>
    )
}

export default DashboardPage