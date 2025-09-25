import InvitationPreviewView from "@/components/project-invitation/project-invite-preview";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function InvitationPreviewPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }
  return <InvitationPreviewView />;
}
