"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Github, GitBranch } from 'lucide-react'
import { ComboboxCities } from "./branches-combobox"

import { api } from "@/trpc/react"

interface BranchStepProps {
  allFormData: {
    branches: {
      mainBranch: boolean
      allRepositories: boolean
      selectedBranches: string[]
    }
  }
  setAllFormData: (data: any) => void

  allBranches: string[]
}

export default function BranchStep({
  allFormData,
  setAllFormData,
  allBranches
}: BranchStepProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Branch Selection</Label>
        <div className="border border-gray-200 rounded-lg p-2 bg-white">
          <div className="space-y-1">
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-sm text-gray-900">Main Branch</div>
                  <div className="text-xs text-gray-500">Monitor your main/master branch</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={allFormData.branches.mainBranch}
                  onCheckedChange={(checked) =>
                    setAllFormData((prev: any) => ({
                      ...prev,
                      branches: { ...prev.branches, mainBranch: checked },
                    }))
                  }
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Github className="w-4 h-4 text-gray-600" />
                <div>

                  <div className="font-medium text-sm text-gray-900">All Branches</div>
                  <div className="text-xs text-gray-500">Monitor all repository branches</div>
                </div>
              </div>
              <Switch
                checked={allFormData.branches.allRepositories}
                onCheckedChange={(checked) =>
                  setAllFormData((prev: any) => ({
                    ...prev,
                    branches: { ...prev.branches, allRepositories: checked , selectedBranches: allBranches },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm text-gray-900">Selected Branches</div>
                  <div className="text-xs text-gray-500">Choose specific branches to monitor</div>
                </div>
              </div>
              <ComboboxCities
                allBranches={allBranches}
                selectedBranches={allFormData.branches.selectedBranches}
                onBranchesChange={(branches) =>
                  setAllFormData((prev: any) => ({
                    ...prev,
                    branches: { ...prev.branches, selectedBranches: branches },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 