import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavUser } from "@/components/nav-user";
import InvitationNotificationsWrapper from "@/components/layout/invitation-notifications-wrapper";

type Props = {
  children: React.ReactNode;
};
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
      <main className="m-2 w-full">
        <div className="border-sidebar-border bg-sidebar flex items-center justify-end gap-2 rounded-md border p-2 px-4 shadow">
          <div className="flex w-full items-center justify-end gap-2 md:w-[200px]">
            <InvitationNotificationsWrapper />
            <NavUser />
          </div>
        </div>
        <div className="h-4"></div>
        {/* main content */}
        <div className="border-sidebar-border bg-sidebar h-[calc(100vh-6rem)] overflow-y-auto rounded-md border p-4 shadow">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SidebarLayout;
