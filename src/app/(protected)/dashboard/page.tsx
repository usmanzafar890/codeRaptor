import React from "react"
import DashboardView from "@/components/dashboard/dashboard-view"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const DashboardPage = async() => {
        const session = await auth.api.getSession({
            headers: await headers()
        });
    
        if (!session) {
            redirect("/login");
        }
    return (
        <DashboardView />
    )
}

export default DashboardPage