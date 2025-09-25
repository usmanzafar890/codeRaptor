import OrganizationCreateView from "@/components/organization/create-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CreateOrganizationPage({ params }: { params: { id: string } }) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/login");
    }
  return (
    <OrganizationCreateView params={params} />
  )
}