"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from 'lucide-react'

const branches = [
  { value: "main", label: "main" },
  { value: "staging", label: "staging" },
  { value: "developer", label: "developer" },
]

interface ComboboxCitiesProps {
  selectedBranches: string[]
  onBranchesChange: (branches: string[]) => void
  allBranches: string[]
  disabled?: boolean
}

export function ComboboxCities({ selectedBranches, onBranchesChange, allBranches, disabled = false }: ComboboxCitiesProps) {
  const [open, setOpen] = React.useState(false)

  const toggleSelection = (value: string) => {
    const newBranches = selectedBranches.includes(value)
      ? selectedBranches.filter((v: string) => v !== value)
      : [...selectedBranches, value]
    onBranchesChange(newBranches)
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-48 bg-white justify-between h-7 px-3 text-xs"
          disabled={disabled}
        >
          {selectedBranches.length === 0 ? (
            <span>Select Branches</span>
          ) : (
            <span className="flex items-center">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 text-xs font-medium">
                {selectedBranches.length}
              </span>
              <span className="ml-2">Selected Branches</span>
            </span>
          )}
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search Branch..." />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup>
              {allBranches.map((branch) => (
                <CommandItem key={branch} value={branch} onSelect={() => toggleSelection(branch)}>
                  <span className="truncate">{branch}</span>
                  {selectedBranches.includes(branch) && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
