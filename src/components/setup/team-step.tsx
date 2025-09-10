"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Eye, Pencil } from 'lucide-react'

interface TeamStepProps {
  allFormData: {
    team: {
      email: string
      role: string
    }
  }
  setAllFormData: (data: any) => void
}

export default function TeamStep({
  allFormData,
  setAllFormData
}: TeamStepProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            Team member email
          </Label>
          <Input
            id="email"
            placeholder="colleague@company.com"
            className="h-7 text-xs w-full bg-white px-3 border-gray-200"
            value={allFormData.team.email}
            onChange={(e) =>
              setAllFormData((prev: any) => ({
                ...prev,
                team: { ...prev.team, email: e.target.value },
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role" className="text-xs font-medium">
            Role
          </Label>
          <Select
            value={allFormData.team.role}
            onValueChange={(value) =>
              setAllFormData((prev: any) => ({
                ...prev,
                team: { ...prev.team, role: value },
              }))
            }
          >
            <SelectTrigger className="w-full bg-white justify-between px-3 text-xs border-gray-200 !h-7 min-h-[28px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_access" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Full Access
              </SelectItem>
              <SelectItem value="can_view" className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                Can View
              </SelectItem>
              <SelectItem value="can_edit" className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-gray-500" />
                Can Edit
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 