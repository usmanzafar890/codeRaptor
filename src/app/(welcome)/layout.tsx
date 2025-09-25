import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode
}

const WelcomeLayout = async ({ children }: Props) => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="w-full min-h-screen">
      {children}
    </main>
  )
}

export default WelcomeLayout
