"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatabaseStepProps {
  allFormData: {
    database: {
      type: string
      url: string
    }
  }
  setAllFormData: (data: any) => void
}

export default function DatabaseStep({
  allFormData,
  setAllFormData
}: DatabaseStepProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="db-type" className="text-xs font-medium">
            Database Type
          </Label>
          <Select
            value={allFormData.database.type}
            onValueChange={(value) =>
              setAllFormData((prev: any) => ({
                ...prev,
                database: { ...prev.database, type: value },
              }))
            }
          >
            <SelectTrigger className="w-full bg-white justify-between px-3 text-xs border-gray-200 !h-7 min-h-[28px]">
              <SelectValue placeholder="Select database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mongodb">MongoDB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="db-url" className="text-xs font-medium">
            Connection URL
          </Label>
          <Input
            id="db-url"
            placeholder="postgresql://user:pass@host:5432/db"
            type="password"
            className="h-7 text-xs w-full bg-white px-3 border-gray-200"
            value={allFormData.database.url}
            onChange={(e) =>
              setAllFormData((prev: any) => ({
                ...prev,
                database: { ...prev.database, url: e.target.value },
              }))
            }
          />
        </div>
      </div>
    </div>
  )
} 