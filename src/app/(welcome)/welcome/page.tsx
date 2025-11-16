import { WelcomeScreen } from "@/components/welcome"
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Only redirect to dashboard if the user has completed the welcome flow
  const cookieStore = await cookies();
  const completed = cookieStore.get("welcome_completed")?.value === "true";
  console.log("🚀 ~ WelcomePage ~ completed:", completed)
  if (!!session && completed) redirect("/dashboard");

  return <WelcomeScreen />
}
