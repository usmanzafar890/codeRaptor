"use client";
import { Icons } from "@/components/icons";

export default function SignOutButton() {
  return (
    <div className="flex w-18 cursor-pointer items-center justify-between">
      <Icons.logOut />
      Log out
    </div>
  );
}
