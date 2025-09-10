import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import HomeView from "@/components/home/home-view";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!!session) {
    redirect("/dashboard");
  }
  return (
    <HomeView />
  );
}
