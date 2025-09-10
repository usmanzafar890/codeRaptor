'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code, Rocket, Users } from 'lucide-react'

const HomeView = () => {
    const router = useRouter()

    return (
        <div className="container mx-auto py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
                <h1 className="text-4xl font-bold tracking-tight">Welcome to CodeRaptor</h1>
                <p className="text-muted-foreground max-w-[600px] text-lg">
                    Your intelligent coding assistant that helps you build better software faster.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="p-2 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Code className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="mt-4">Smart Code Analysis</CardTitle>
                            <CardDescription>
                                Analyze your codebase and get intelligent insights
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="p-2 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="mt-4">Team Collaboration</CardTitle>
                            <CardDescription>
                                Work together with your team seamlessly
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="p-2 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Rocket className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="mt-4">Boost Productivity</CardTitle>
                            <CardDescription>
                                Ship features faster with AI-powered assistance
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <Card className="w-full max-w-lg shadow-lg border-primary/20">
                    <CardHeader>
                        <CardTitle>Ready to get started?</CardTitle>
                        <CardDescription>
                            Access your dashboard to manage projects, meetings, and more.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Your projects and team members are waiting for you. Continue to your dashboard to see recent activity and manage your repositories.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default HomeView