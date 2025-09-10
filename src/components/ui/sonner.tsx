"use client"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { X } from "lucide-react"

// Custom Toast Components
const SuccessToast = ({ message }: { message: string }) => (
  <Alert className="flex items-center gap-3 w-80 h-12 bg-black text-white border-none rounded-lg p-3">
    <div className="relative">
      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <AlertTitle className="flex-grow text-white text-sm font-normal">{message}</AlertTitle>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-shrink-0 text-white hover:bg-gray-800"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  </Alert>
)

const ErrorToast = ({ message }: { message: string }) => (
  <Alert className="flex items-center gap-3 w-80 h-12 bg-black text-white border-none rounded-lg p-3">
    <div className="relative">
      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <AlertTitle className="flex-grow text-white text-sm font-normal">{message}</AlertTitle>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-shrink-0 text-white hover:bg-gray-800"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  </Alert>
)

const WarningToast = ({ message }: { message: string }) => (
  <Alert className="flex items-center gap-3 w-80 h-12 bg-black text-white border-none rounded-lg p-3">
    <div className="relative">
      <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <AlertTitle className="flex-grow text-white text-sm font-normal">{message}</AlertTitle>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-shrink-0 text-white hover:bg-gray-800"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  </Alert>
)

const InfoToast = ({ message }: { message: string }) => (
  <Alert className="flex items-center gap-3 w-80 h-12 bg-black text-white border-none rounded-lg p-3">
    <div className="relative">
      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <AlertTitle className="flex-grow text-white text-sm font-normal">{message}</AlertTitle>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-shrink-0 text-white hover:bg-gray-800"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  </Alert>
)

// Toast Functions
export const showSuccessToast = (message: string) => {
  toast.custom(
    (t) => (
      <div onClick={() => toast.dismiss(t)}>
        <SuccessToast message={message} />
      </div>
    ),
    { duration: 3000 }
  )
}

export const showErrorToast = (message: string) => {
  toast.custom(
    (t) => (
      <div onClick={() => toast.dismiss(t)}>
        <ErrorToast message={message} />
      </div>
    ),
    { duration: 4000 }
  )
}

export const showWarningToast = (message: string) => {
  toast.custom(
    (t) => (
      <div onClick={() => toast.dismiss(t)}>
        <WarningToast message={message} />
      </div>
    ),
    { duration: 4000 }
  )
}

export const showInfoToast = (message: string) => {
  toast.custom(
    (t) => (
      <div onClick={() => toast.dismiss(t)}>
        <InfoToast message={message} />
      </div>
    ),
    { duration: 3000 }
  )
}

// Demo Component
export default function SonnerDemo() {
  return (
    <div className="flex flex-wrap gap-6 p-4">
      <Button
        variant="outline"
        className="text-green-500 bg-transparent"
        size="sm"
        onClick={() => showSuccessToast("This is a success toast")}
      >
        Success
      </Button>
      <Button
        variant="outline"
        className="text-blue-500 bg-transparent"
        size="sm"
        onClick={() => showInfoToast("This is an info toast")}
      >
        Info
      </Button>
      <Button
        variant="outline"
        className="text-yellow-500 bg-transparent"
        size="sm"
        onClick={() => showWarningToast("This is a warning toast")}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        className="text-red-500 bg-transparent"
        size="sm"
        onClick={() => showErrorToast("This is an error toast")}
      >
        Error
      </Button>
    </div>
  )
}
