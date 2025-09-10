"use client"

import { Loader2 } from 'lucide-react'
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Checkmark } from "@/components/kokonutui/currency-transfer"

interface ProjectCreationLoaderProps {
  isLoading: boolean
  onComplete?: () => void
  projectCreationTime?: number
  isProjectCreated?: boolean
}

export default function ProjectCreationLoader({
  isLoading,
  onComplete,
  projectCreationTime = 8000,
  isProjectCreated = false
}: ProjectCreationLoaderProps) {
  const availableTexts = ["Creating your project...", "Setting up repository...", "Configuring integrations...", "Finalizing setup..."]
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      setShowCheck(false)
      setCurrentTextIndex(0)
      return
    }

    
    if (!isProjectCreated) {
      const totalSteps = 100 
      const intervalTime = projectCreationTime / totalSteps

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev == 95 || prev <= 99) {
            clearInterval(interval)
            return 95 
          }else if(prev <= 100){
            return 100
          }
          return prev + 1
        })
      }, intervalTime)

      return () => clearInterval(interval)
    }
  }, [isLoading, projectCreationTime, isProjectCreated])

 
  useEffect(() => {
    if (isProjectCreated && isLoading) {
      setProgress(100)
      setTimeout(() => {
        setShowCheck(true)

        setTimeout(() => {
          onComplete?.()
        }, 2000) 
      }, 300)
    }
  }, [isProjectCreated, isLoading, onComplete])

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % availableTexts.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="relative w-15 h-15 mb-6">
        {showCheck ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
              scale: {
                type: "spring",
                damping: 12,
                stiffness: 150,
              },
            }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 blur-xl bg-blue-500/30 rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{
                delay: 0.3,
                duration: 1,
                ease: "easeOut",
              }}
            />
            <Checkmark
              size={48}
              strokeWidth={2.5}
              color="rgb(59 130 246)"
              className="relative z-10 drop-shadow-lg"
            />
          </motion.div>
        ) : (
          <>
            <Loader2 className="w-full h-full animate-spin text-blue-500" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/10 rounded-full animate-spin-slow" />
          </>
        )}
      </div>

      <div className="space-y-3 text-center mb-6">
        <motion.h3
          className="text-xl font-semibold text-gray-900"
          key={showCheck ? "success" : "loading"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {showCheck ? "Project Created Successfully!" : availableTexts[currentTextIndex]}
        </motion.h3>
        <p className="text-sm text-gray-500">
          {showCheck ? "Redirecting to dashboard..." : "This usually takes a few minutes"}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
