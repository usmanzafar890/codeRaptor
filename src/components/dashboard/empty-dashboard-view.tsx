import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileCode, Users, Code, Rocket, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const EmptyDashboardView = () => {
  const router = useRouter();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="space-y-8 py-4"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8 pt-6">
        <div className="relative h-24 w-24 mb-6">
          <Image 
            src="/logo.svg" 
            alt="CodeRaptor Logo" 
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-1">Welcome to CodeRaptor</h1>
        <p className="text-muted-foreground max-w-md mt-2">
          Your intelligent coding companion. Get started by creating a new project or joining an existing one.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <motion.div 
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className="group"
        >
          <Card className="border-2 border-primary/10 bg-gradient-to-br from-white to-primary/5 shadow-lg h-full transition-all duration-300 group-hover:shadow-primary/10">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                Create a New Project
              </CardTitle>
              <CardDescription className="text-base">
                Start your journey with a new project and unleash the power of AI-assisted development
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button 
                onClick={() => router.push("/setup")}
                className="w-full group-hover:bg-primary/90 transition-all duration-300"
                size="lg"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className="group"
        >
          <Card className="border-2 border-blue-500/10 bg-gradient-to-br from-white to-blue-500/5 shadow-lg h-full transition-all duration-300 group-hover:shadow-blue-500/10">
            <CardHeader>
              <div className="rounded-full bg-blue-500/10 p-3 w-fit mb-3">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">
                Join a Project
              </CardTitle>
              <CardDescription className="text-base">
                Collaborate with your team by accepting an invitation or joining via a shared link
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button 
                onClick={() => router.push("/invitations")}
                className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300"
                size="lg"
              >
                <span>View Invitations</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyDashboardView;
