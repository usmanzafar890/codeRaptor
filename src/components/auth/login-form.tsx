"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { OctagonAlertIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

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
import { FaGoogle, FaGithub } from "react-icons/fa";


const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: "Password is required" }),
});

export const LoginForm = () => {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        setError(null);
        setPending(true);

        authClient.signIn.email({
            email: data.email,
            password: data.password,
           
        },
        {
            onSuccess: async () => {
                try {
                    // Check if user has completed welcome flow
                    const response = await fetch('/api/user/welcome-status', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();

                        // If welcome is completed, go to dashboard, otherwise go to welcome
                        if (data.welcomeCompleted) {
                            router.push('/dashboard');
                        } else {
                            router.push('/welcome');
                        }
                    } else {
                        // If there's an error checking status, default to welcome page
                        // The middleware will handle redirecting if needed
                        router.push('/welcome');
                    }
                } catch (error) {
                    console.error('Error checking welcome status:', error);
                    // Default to welcome page if there's an error
                    router.push('/welcome');
                }
            },
            onError: ({ error }) => {
                setError(error.message);
                setPending(false);
            },
        });
    };

    const onSocial = (provider: "google" | "github") => {
        setError(null);
        setPending(true);

        authClient.signIn.social(
            {
                provider: provider,
                
            },
            {
            onSuccess: async () => {
                try {
                    // Check if user has completed welcome flow
                    const response = await fetch('/api/user/welcome-status', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // If welcome is completed, go to dashboard, otherwise go to welcome
                        if (data.welcomeCompleted) {
                            router.push('/dashboard');
                        } else {
                            router.push('/welcome');
                        }
                    } else {
                        // If there's an error checking status, default to welcome page
                        // The middleware will handle redirecting if needed
                        router.push('/welcome');
                    }
                } catch (error) {
                    console.error('Error checking welcome status:', error);
                    // Default to welcome page if there's an error
                    router.push('/welcome');
                }
            },
            onError: ({ error }) => {
                setError(error.message);
                setPending(false);
            },
        });
    };     
        

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">
                                        Welcome back
                                    </h1>
                                    <p className="text-muted-foreground text-balance">
                                        Sign in to your account
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                        disabled={pending}
                                        onClick={() => onSocial("google")}
                                        variant="outline"
                                        type="button"
                                        className="w-full"
                                    >
                                        <FaGoogle />
                                    </Button>
                                    <Button 
                                        disabled={pending}
                                        onClick={() => onSocial("github")}
                                        variant="outline"
                                        type="button"
                                        className="w-full"
                                    >
                                        <FaGithub />
                                    </Button>
                                </div>
                                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                                        Or continue with
                                    </span>
                                </div>
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
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
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
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
                                <LoadingButton
                                    isLoading={pending}
                                    loadingText="Signing in..."
                                    defaultText="Sign in"
                                    type="submit"
                                    className="w-full"
                                />

                                <div className="text-center text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link href="/sign-up" className="underline underline-offset-4">Sign up</Link>
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