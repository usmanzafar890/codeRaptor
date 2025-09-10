"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EnvironmentStepProps {
  allFormData: {
    environment: {
      vars: string
    }
  }
  setAllFormData: (data: any) => void
}

export default function EnvironmentStep({
  allFormData,
  setAllFormData
}: EnvironmentStepProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="env-vars" className="text-xs font-medium">
          Environment Variables
        </Label>
        <Textarea
          id="env-vars"
          placeholder="API_KEY=your_key_here&#10;DATABASE_URL=your_db_url"
          rows={3}
          className="text-xs resize-none"
          value={allFormData.environment.vars}
          onChange={(e) =>
            setAllFormData((prev: any) => ({
              ...prev,
              environment: { ...prev.environment, vars: e.target.value },
            }))
          }
        />
      </div>
      <div className="text-xs text-gray-600">Add your environment variables (one per line)</div>
    </div>
  )
} 