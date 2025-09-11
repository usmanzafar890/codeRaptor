'use client'

import ProjectCreateView from "@/components/organization/add-project-organization"
import { Suspense } from "react"


export default function ProjectCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">Loading...</div>}>
      <ProjectCreateView />
    </Suspense>
  )
}
