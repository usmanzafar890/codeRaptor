"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { OctagonAlertIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LoadingButton from "@/components/ui/loading-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

// Form schema for request password reset
const requestResetSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});

// Form schema for reset password with token
const resetPasswordSchema = z.object({
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const ResetPasswordForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form for requesting password reset
    const requestResetForm = useForm<z.infer<typeof requestResetSchema>>({
        resolver: zodResolver(requestResetSchema),
        defaultValues: {
            email: "",
        },
    });

    // Form for resetting password with token
    const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    // Handle request password reset
    const onRequestReset = (data: z.infer<typeof requestResetSchema>) => {
        setError(null);
        setSuccess(null);
        setPending(true);
        
        console.log('Requesting password reset for:', data.email);
        console.log('Redirect URL:', window.location.origin + '/reset-password');

        authClient.requestPasswordReset({
            email: data.email,
            redirectTo: window.location.origin + '/reset-password'
        }, {
            onSuccess: () => {
                setSuccess("Password reset instructions have been sent to your email.");
                setPending(false);
            },
            onError: ({ error }) => {
                setError(error.message);
                setPending(false);
            },
        });
    };

    // Handle reset password with token
    const onResetPassword = (data: z.infer<typeof resetPasswordSchema>) => {
        if (!token) {
            setError("Invalid or missing reset token");
            return;
        }

        setError(null);
        setSuccess(null);
        setPending(true);
        
        console.log('Resetting password with token:', token.substring(0, 10) + '...');
        console.log('New password length:', data.password.length);

        authClient.resetPassword({
            token,
            newPassword: data.password,
        }, {
            onSuccess: () => {
                setSuccess("Your password has been reset successfully. You can now log in with your new password.");
                setPending(false);
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            },
            onError: ({ error }) => {
                setError(error.message);
                setPending(false);
            },
        });
    };

    // Render reset password form with token
    if (token) {
        return (
            <div className="flex flex-col gap-6">
                <Card className="overflow-hidden p-0">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <Form {...resetPasswordForm}>
                            <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="p-6 md:p-8">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col items-center text-center">
                                        <h1 className="text-2xl font-bold">
                                            Reset Your Password
                                        </h1>
                                        <p className="text-muted-foreground text-balance">
                                            Enter your new password below
                                        </p>
                                    </div>
                                    <div className="grid gap-3">
                                        <FormField
                                            control={resetPasswordForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>New Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            disabled={pending}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <FormField
                                            control={resetPasswordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            disabled={pending}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {!!error && (
                                        <Alert className="bg-destructive/10 border-none">
                                            <OctagonAlertIcon className="h-4 w-4 !text-destructive"/>
                                            <AlertTitle>{error}</AlertTitle>
                                        </Alert>
                                    )}
                                    {!!success && (
                                        <Alert className="bg-green-100 border-none dark:bg-green-900/20">
                                            <AlertTitle className="text-green-800 dark:text-green-400">{success}</AlertTitle>
                                        </Alert>
                                    )}
                                    <LoadingButton
                                        isLoading={pending}
                                        loadingText="Resetting..."
                                        defaultText="Reset Password"
                                        type="submit"
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm">
                                        Remember your password?{" "}
                                        <Link href="/login" className="underline underline-offset-4">Sign in</Link>
                                    </div>
                                </div>
                            </form>
                        </Form>
                        <div className="bg-accent-foreground from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
                            <Image src="/logo.svg" alt="CodeRaptor Logo" width={92} height={92} />
                            <p className="text-2xl font-semibold text-white">
                                CodeRaptor
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render request password reset form
    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <Form {...requestResetForm}>
                        <form onSubmit={requestResetForm.handleSubmit(onRequestReset)} className="p-6 md:p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">
                                        Forgot Your Password?
                                    </h1>
                                    <p className="text-muted-foreground text-balance">
                                        Enter your email address and we&apos;ll send you a link to reset your password
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    <FormField
                                        control={requestResetForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="hello@example.com"
                                                        disabled={pending}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {!!error && (
                                    <Alert className="bg-destructive/10 border-none">
                                        <OctagonAlertIcon className="h-4 w-4 !text-destructive"/>
                                        <AlertTitle>{error}</AlertTitle>
                                    </Alert>
                                )}
                                {!!success && (
                                    <Alert className="bg-green-100 border-none dark:bg-green-900/20">
                                        <AlertTitle className="text-green-800 dark:text-green-400">{success}</AlertTitle>
                                    </Alert>
                                )}
                                <LoadingButton
                                    isLoading={pending}
                                    loadingText="Sending..."
                                    defaultText="Send Reset Link"
                                    type="submit"
                                    className="w-full"
                                />
                                <div className="text-center text-sm">
                                    Remember your password?{" "}
                                    <Link href="/login" className="underline underline-offset-4">Sign in</Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                    <div className="bg-accent-foreground from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
                        <Image src="/logo.svg" alt="CodeRaptor Logo" width={92} height={92} />
                        <p className="text-2xl font-semibold text-white">
                            CodeRaptor
                        </p>
                    </div>
                </CardContent>
            </Card>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our{" "}
                <Link href="/terms">Terms of Service</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>
            </div>
        </div>
    );
};
