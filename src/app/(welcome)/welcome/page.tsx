import { WelcomeScreen } from "@/components/welcome"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!!session) {
    redirect("/dashboard");
  }
  return <WelcomeScreen />
}
