import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password - CodeRaptor",
  description: "Reset your password to access your CodeRaptor account",
};

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
        <div className="h-10 w-80 bg-gray-200 rounded mt-4"></div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}