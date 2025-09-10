
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import SignOutButton from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NavUser } from "@/components/nav-user";

type Props = {
    children: React.ReactNode
}
export interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
}

const SidebarLayout = async ({ children }: Props) => {

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full m-2">

                <div className="flex justify-end items-center gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4">
                    <div className="w-full md:w-[200px] flex items-center justify-end">
                        <NavUser />
                    </div>
                </div>
                <div className="h-4"></div>
                {/* main content */}
                <div className="border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-auto h-[calc(100vh-6rem)] p-4">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout