"use client";

import { redirect } from "next/navigation";
import { Icons } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {

  return (
    <div

      className="flex items-center justify-between w-18 cursor-pointer"
    >
      <Icons.logOut />
      Log out
    </div>
  );
}